/**
 * Streaming AI Plan Comparison — Express SSE endpoint
 * POST /api/compare-stream
 *
 * Accepts two plan objects, calls Claude claude-haiku-4-5 with streaming,
 * and forwards each text delta as a Server-Sent Events (SSE) stream.
 *
 * The client-side comparison TABLE is built instantly from plan data (no API wait).
 * This endpoint only provides the AI narrative that streams in progressively.
 */

import { Router, Request, Response, type Express } from "express";
import { z } from "zod";

// ── Shared plan schema (mirrors compareRouter.ts) ─────────────────────────────

const BenefitDetailSchema = z.object({
  covered: z.boolean(),
  details: z.string(),
  annualLimit: z.string().optional(),
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
  starRating: z.object({
    overall: z.number(),
    customerService: z.number().optional(),
    drugPlan: z.number().optional(),
    memberComplaints: z.number().optional(),
  }),
  copays: z.object({
    primaryCare: z.string(),
    specialist: z.string(),
    urgentCare: z.string(),
    emergency: z.string(),
    inpatientHospital: z.string(),
    outpatientSurgery: z.string(),
  }),
  rxDrugs: z.object({
    tier1: z.string(),
    tier2: z.string(),
    tier3: z.string(),
    tier4: z.string(),
    deductible: z.string(),
    gap: z.boolean(),
  }),
  extraBenefits: z.object({
    dental: BenefitDetailSchema,
    vision: BenefitDetailSchema,
    hearing: BenefitDetailSchema,
    otc: BenefitDetailSchema,
    fitness: BenefitDetailSchema,
    transportation: BenefitDetailSchema,
    telehealth: BenefitDetailSchema,
    meals: BenefitDetailSchema,
  }),
  networkSize: z.number(),
  enrollmentPeriod: z.string(),
  effectiveDate: z.string(),
  isBestMatch: z.boolean().optional(),
  isMostPopular: z.boolean().optional(),
  isNewPlan: z.boolean().optional(),
  contractId: z.string().optional(),
  planId: z.string().optional(),
});

type PlanInput = z.infer<typeof PlanInputSchema>;

// ── Prompt builder — SHORT version for Haiku ─────────────────────────────────
// The full side-by-side table is already rendered client-side, so we only need
// the AI narrative: Quick Summary, Key Differences, Recommendation.

function buildShortPrompt(current: PlanInput, newPlan: PlanInput): string {
  const benefitList = (p: PlanInput) => {
    const benefits: string[] = [];
    if (p.extraBenefits.dental.covered) benefits.push(`Dental (${p.extraBenefits.dental.details})`);
    if (p.extraBenefits.vision.covered) benefits.push(`Vision (${p.extraBenefits.vision.details})`);
    if (p.extraBenefits.hearing.covered) benefits.push(`Hearing (${p.extraBenefits.hearing.details})`);
    if (p.extraBenefits.otc.covered) benefits.push(`OTC (${p.extraBenefits.otc.details})`);
    if (p.extraBenefits.fitness.covered) benefits.push("Fitness");
    if (p.extraBenefits.transportation.covered) benefits.push("Transportation");
    if (p.extraBenefits.telehealth.covered) benefits.push("Telehealth");
    if (p.extraBenefits.meals.covered) benefits.push("Meals after hospital");
    return benefits.join(", ") || "None";
  };

  return `You are a Medicare Advantage expert. Compare these two plans concisely. The user already sees a full data table — provide ONLY the narrative analysis below.

CURRENT PLAN: ${current.planName} (${current.carrier}, ${current.planType})
- Premium: $${current.premium}/mo | Deductible: $${current.deductible} | MOOP: $${current.maxOutOfPocket.toLocaleString()}
- PCP: ${current.copays.primaryCare} | Specialist: ${current.copays.specialist} | ER: ${current.copays.emergency}
- Rx: T1 ${current.rxDrugs.tier1} / T2 ${current.rxDrugs.tier2} / T3 ${current.rxDrugs.tier3} / T4 ${current.rxDrugs.tier4} | Gap: ${current.rxDrugs.gap ? "Yes" : "No"}
- Stars: ${current.starRating.overall}/5 | Network: ${current.networkSize.toLocaleString()}+ providers
- Extra benefits: ${benefitList(current)}

NEW PLAN: ${newPlan.planName} (${newPlan.carrier}, ${newPlan.planType})
- Premium: $${newPlan.premium}/mo | Deductible: $${newPlan.deductible} | MOOP: $${newPlan.maxOutOfPocket.toLocaleString()}
- PCP: ${newPlan.copays.primaryCare} | Specialist: ${newPlan.copays.specialist} | ER: ${newPlan.copays.emergency}
- Rx: T1 ${newPlan.rxDrugs.tier1} / T2 ${newPlan.rxDrugs.tier2} / T3 ${newPlan.rxDrugs.tier3} / T4 ${newPlan.rxDrugs.tier4} | Gap: ${newPlan.rxDrugs.gap ? "Yes" : "No"}
- Stars: ${newPlan.starRating.overall}/5 | Network: ${newPlan.networkSize.toLocaleString()}+ providers
- Extra benefits: ${benefitList(newPlan)}

Respond in EXACTLY this markdown format (keep each section brief):

## Quick Summary
2-3 sentences summarizing the key trade-offs in plain language.

## Key Differences
- **Cost:** [1-2 sentences on premium/MOOP/copay differences]
- **Rx Drugs:** [1-2 sentences on drug coverage differences]
- **Extra Benefits:** [what's gained or lost switching plans]
- **Network:** [HMO vs PPO implications if different, or network size note]
- **Quality:** [star rating comparison and what it means]

## Recommendation
1 short paragraph with a clear recommendation. Who should switch? Who should stay? Be specific.`;
}

// ── SSE streaming helper ──────────────────────────────────────────────────────

function sendSSE(res: Response, event: string, data: string) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

// ── Route registration ────────────────────────────────────────────────────────

export function registerCompareStreamRoute(app: Express) {
  const streamRouter = Router();

  streamRouter.post("/", async (req: Request, res: Response) => {
    // Validate input
    const parseResult = z
      .object({ currentPlan: PlanInputSchema, newPlan: PlanInputSchema })
      .safeParse(req.body);

    if (!parseResult.success) {
      res.status(400).json({ error: "Invalid plan data", details: parseResult.error.flatten() });
      return;
    }

    const { currentPlan, newPlan } = parseResult.data;

    if (currentPlan.id === newPlan.id) {
      res.status(400).json({ error: "Please select two different plans to compare." });
      return;
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: "ANTHROPIC_API_KEY is not configured." });
      return;
    }

    // Set up SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // disable nginx buffering
    res.flushHeaders();

    try {
      const prompt = buildShortPrompt(currentPlan, newPlan);

      // Call Anthropic streaming API
      const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5", // Fast model for streaming (Haiku 4.5)
          max_tokens: 1024,
          stream: true,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!anthropicRes.ok) {
        const errorText = await anthropicRes.text();
        sendSSE(res, "error", `Anthropic API error: ${anthropicRes.status} — ${errorText.slice(0, 200)}`);
        res.end();
        return;
      }

      // Stream the response body line by line
      const reader = anthropicRes.body?.getReader();
      if (!reader) {
        sendSSE(res, "error", "No response body from Anthropic");
        res.end();
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? ""; // keep incomplete line in buffer

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const dataStr = line.slice(6).trim();
          if (dataStr === "[DONE]") continue;

          try {
            const event = JSON.parse(dataStr) as {
              type: string;
              delta?: { type: string; text?: string };
            };

            if (event.type === "content_block_delta" && event.delta?.type === "text_delta" && event.delta.text) {
              sendSSE(res, "delta", event.delta.text);
            } else if (event.type === "message_stop") {
              sendSSE(res, "done", "");
            }
          } catch {
            // skip malformed JSON lines
          }
        }
      }

      // Ensure done event is sent
      sendSSE(res, "done", "");
      res.end();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      sendSSE(res, "error", `Streaming error: ${message}`);
      res.end();
    }
  });

  app.use("/api/compare-stream", streamRouter);
}
