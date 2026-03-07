/**
 * AI Plan Comparison Router
 * Uses the Manus Forge API (OpenAI-compatible) to generate a detailed
 * Medicare Advantage plan comparison between two selected plans.
 */

import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";

// ── Zod schemas for plan data ─────────────────────────────────────────────────

const CopaysSchema = z.object({
  primaryCare: z.string(),
  specialist: z.string(),
  urgentCare: z.string(),
  emergency: z.string(),
  inpatientHospital: z.string(),
  outpatientSurgery: z.string(),
});

const RxDrugsSchema = z.object({
  tier1: z.string(),
  tier2: z.string(),
  tier3: z.string(),
  tier4: z.string(),
  deductible: z.string(),
  gap: z.boolean(),
});

const BenefitDetailSchema = z.object({
  covered: z.boolean(),
  details: z.string(),
  annualLimit: z.string().optional(),
});

const ExtraBenefitsSchema = z.object({
  dental: BenefitDetailSchema,
  vision: BenefitDetailSchema,
  hearing: BenefitDetailSchema,
  otc: BenefitDetailSchema,
  fitness: BenefitDetailSchema,
  transportation: BenefitDetailSchema,
  telehealth: BenefitDetailSchema,
  meals: BenefitDetailSchema,
});

const StarRatingSchema = z.object({
  overall: z.number(),
  customerService: z.number().optional(),
  drugPlan: z.number().optional(),
  memberComplaints: z.number().optional(),
});

const PlanInputSchema = z.object({
  id: z.string(),
  carrier: z.string(),
  planName: z.string(),
  planType: z.string(),
  snpType: z.string().optional(),
  premium: z.number(),
  deductible: z.number(),
  maxOutOfPocket: z.number(),
  partBPremiumReduction: z.number(),
  starRating: StarRatingSchema,
  copays: CopaysSchema,
  rxDrugs: RxDrugsSchema,
  extraBenefits: ExtraBenefitsSchema,
  networkSize: z.number(),
  enrollmentPeriod: z.string(),
  effectiveDate: z.string(),
  isBestMatch: z.boolean().optional(),
  isMostPopular: z.boolean().optional(),
  isNewPlan: z.boolean().optional(),
  contractId: z.string().optional(),
  planId: z.string().optional(),
});

// ── Helper: build the prompt ──────────────────────────────────────────────────

function buildComparisonPrompt(
  currentPlan: z.infer<typeof PlanInputSchema>,
  newPlan: z.infer<typeof PlanInputSchema>
): string {
  const formatBenefit = (b: z.infer<typeof BenefitDetailSchema>) =>
    b.covered
      ? `Yes — ${b.details}${b.annualLimit ? ` (${b.annualLimit})` : ""}`
      : "Not covered";

  const planSummary = (p: z.infer<typeof PlanInputSchema>) => `
**${p.planName}** (${p.carrier})
- Type: ${p.planType}${p.snpType ? ` — ${p.snpType}` : ""}
- Monthly Premium: $${p.premium}${p.partBPremiumReduction > 0 ? ` (+$${p.partBPremiumReduction}/mo Part B reduction)` : ""}
- Annual Deductible: $${p.deductible}
- Max Out-of-Pocket: $${p.maxOutOfPocket.toLocaleString()}
- CMS Star Rating: ${p.starRating.overall} / 5.0
- Network Size: ${p.networkSize.toLocaleString()}+ providers

**Copays:**
- Primary Care: ${p.copays.primaryCare}
- Specialist: ${p.copays.specialist}
- Urgent Care: ${p.copays.urgentCare}
- Emergency Room: ${p.copays.emergency}
- Inpatient Hospital: ${p.copays.inpatientHospital}
- Outpatient Surgery: ${p.copays.outpatientSurgery}

**Rx Drug Coverage:**
- Tier 1 (Generic): ${p.rxDrugs.tier1}
- Tier 2 (Preferred Brand): ${p.rxDrugs.tier2}
- Tier 3 (Non-Preferred Brand): ${p.rxDrugs.tier3}
- Tier 4 (Specialty): ${p.rxDrugs.tier4}
- Drug Deductible: ${p.rxDrugs.deductible}
- Coverage Gap (Donut Hole) Protection: ${p.rxDrugs.gap ? "Yes" : "No"}

**Extra Benefits:**
- Dental: ${formatBenefit(p.extraBenefits.dental)}
- Vision: ${formatBenefit(p.extraBenefits.vision)}
- Hearing: ${formatBenefit(p.extraBenefits.hearing)}
- OTC Allowance: ${formatBenefit(p.extraBenefits.otc)}
- Fitness: ${formatBenefit(p.extraBenefits.fitness)}
- Transportation: ${formatBenefit(p.extraBenefits.transportation)}
- Telehealth: ${formatBenefit(p.extraBenefits.telehealth)}
- Meals After Hospital: ${formatBenefit(p.extraBenefits.meals)}
`;

  return `You are a Medicare Advantage plan expert helping a beneficiary compare two plans. Analyze the following two plans and provide a comprehensive, clear, and helpful comparison.

## CURRENT PLAN (what they have now):
${planSummary(currentPlan)}

## NEW PLAN (what they're considering switching to):
${planSummary(newPlan)}

Please provide a detailed comparison in the following exact markdown format:

## Quick Summary
Provide 2-3 sentences summarizing the key trade-offs between these plans in plain language.

## Premium & Cost Comparison
Compare monthly premiums, deductibles, and max out-of-pocket costs. Calculate annual premium savings/costs. Highlight which plan is better for low vs. high healthcare utilizers.

## Copay Comparison
Compare all copays side-by-side. Identify which plan has lower costs for primary care, specialists, urgent care, and emergency visits.

## Prescription Drug Coverage
Compare drug tier costs. Analyze the coverage gap (donut hole) protection difference. Note any drug deductible differences.

## Extra Benefits Gained / Lost
List benefits the member would GAIN by switching to the new plan. List benefits they would LOSE.

## Star Rating & Quality
Compare CMS star ratings. Explain what the rating difference means for quality of care. Note network size differences.

## Network Type Considerations
If plan types differ (HMO vs PPO), explain the key implications: referral requirements, out-of-network coverage, flexibility.

## Overall Recommendation
Provide a clear, direct recommendation. Who should switch to the new plan? Who should stay? Use specific scenarios. End with a confidence level (High/Medium/Low).

Be specific with numbers, calculate annual costs where possible, and use plain language that a Medicare beneficiary can understand.`;
}

// ── Forge API call (OpenAI-compatible) ───────────────────────────────────────

async function callForgeApi(prompt: string): Promise<string> {
  const forgeApiUrl = process.env.BUILT_IN_FORGE_API_URL;
  const forgeApiKey = process.env.BUILT_IN_FORGE_API_KEY;

  if (!forgeApiUrl || !forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Forge API is not configured.",
    });
  }

  const response = await fetch(`${forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "authorization": `Bearer ${forgeApiKey}`,
    },
    body: JSON.stringify({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `AI API error: ${response.status} — ${errorText.slice(0, 200)}`,
    });
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "No content returned from AI",
    });
  }

  return content;
}

// ── Router ────────────────────────────────────────────────────────────────────

export const compareRouter = router({
  /**
   * Compare two Medicare Advantage plans using AI.
   * Returns a markdown-formatted analysis.
   */
  comparePlans: publicProcedure
    .input(
      z.object({
        currentPlan: PlanInputSchema,
        newPlan: PlanInputSchema,
      })
    )
    .mutation(async ({ input }) => {
      const { currentPlan, newPlan } = input;

      if (currentPlan.id === newPlan.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Please select two different plans to compare.",
        });
      }

      const prompt = buildComparisonPrompt(currentPlan, newPlan);
      const analysis = await callForgeApi(prompt);

      return {
        analysis,
        currentPlanName: currentPlan.planName,
        newPlanName: newPlan.planName,
        currentCarrier: currentPlan.carrier,
        newCarrier: newPlan.carrier,
        generatedAt: new Date().toISOString(),
      };
    }),

  /**
   * Lightweight health check to validate the Forge API is configured.
   */
  validateApiKey: publicProcedure.query(async () => {
    const forgeApiUrl = process.env.BUILT_IN_FORGE_API_URL;
    const forgeApiKey = process.env.BUILT_IN_FORGE_API_KEY;

    if (!forgeApiUrl || !forgeApiKey) {
      return { valid: false, message: "Forge API not configured" };
    }

    try {
      const response = await fetch(`${forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "authorization": `Bearer ${forgeApiKey}`,
        },
        body: JSON.stringify({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 10,
          messages: [{ role: "user", content: "Hi" }],
        }),
        signal: AbortSignal.timeout(10_000),
      });

      if (response.ok) {
        return { valid: true, message: "Forge API is configured and reachable" };
      }

      const errorText = await response.text();
      return { valid: false, message: `API returned ${response.status}: ${errorText.slice(0, 200)}` };
    } catch (err) {
      return { valid: false, message: `Network error: ${String(err)}` };
    }
  }),
});
