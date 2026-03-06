/**
 * pVerify Plan Lookup Router
 *
 * This router provides stubbed endpoints that simulate the pVerify eligibility API.
 * TODO: Replace stub implementations with real pVerify API calls when credentials are available.
 *
 * Real pVerify API docs: https://pverify.com/api-documentation/
 * Auth headers needed:
 *   Authorization: Bearer <pVerify_access_token>
 *   Client-API-Id: <client_id>
 */

import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";

// ─── Schemas ────────────────────────────────────────────────────────────────

const EligibilityInputSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dob: z.string().min(1), // ISO date string YYYY-MM-DD
  memberId: z.string().min(1),
  payerId: z.string().min(1),
});

const PotentialPlanSchema = z.object({
  id: z.string(),
  planName: z.string(),
  carrier: z.string(),
  premium: z.number(),
  deductible: z.number(),
  oopMax: z.number(),
  pcpCopay: z.number(),
  specialistCopay: z.number(),
  urgentCareCopay: z.number(),
  erCopay: z.number(),
  drugTier1Copay: z.number(),
  drugTier2Copay: z.number(),
  drugTier3Copay: z.number(),
  dentalCoverage: z.string(),
  visionCoverage: z.string(),
  hearingCoverage: z.string(),
});

const CurrentPlanSchema = z.object({
  planName: z.string(),
  planId: z.string(),
  payerId: z.string(),
  status: z.string(),
  effectiveDate: z.string(),
  terminationDate: z.string(),
  premium: z.number(),
  deductible: z.number(),
  oopMax: z.number(),
  pcpCopay: z.number(),
  specialistCopay: z.number(),
  urgentCareCopay: z.number(),
  erCopay: z.number(),
  inpatientCost: z.string(),
  drugTier1Copay: z.number(),
  drugTier2Copay: z.number(),
  drugTier3Copay: z.number(),
  dentalCoverage: z.string(),
  visionCoverage: z.string(),
  hearingCoverage: z.string(),
});

// ─── Mock eligibility response ───────────────────────────────────────────────

function buildMockEligibilityResponse(payerId: string, firstName: string, lastName: string) {
  // Vary the mock response slightly based on payer for realism
  const payerPlanMap: Record<string, { planName: string; planId: string; premium: number; oopMax: number }> = {
    UHC001: { planName: "UnitedHealthcare AARP MedicareComplete Patriot (HMO)", planId: "H0624-001", premium: 0, oopMax: 4900 },
    HUM001: { planName: "Humana Gold Plus H5619-003 (HMO)", planId: "H5619-003", premium: 0, oopMax: 5900 },
    AET001: { planName: "Aetna Medicare Advantage Value Plan (HMO)", planId: "H3312-001", premium: 0, oopMax: 6700 },
    BCBS001: { planName: "BlueMedicare HMO Select", planId: "H3135-001", premium: 0, oopMax: 5900 },
    CIG001: { planName: "Cigna Connect (HMO)", planId: "H4513-001", premium: 0, oopMax: 5500 },
    WEL001: { planName: "WellCare Classic (HMO)", planId: "H8894-002", premium: 0, oopMax: 6700 },
    MOL001: { planName: "Molina Medicare Complete Care (HMO)", planId: "H5280-001", premium: 0, oopMax: 5900 },
    CEN001: { planName: "Centene Wellcare Ultra (HMO)", planId: "H8894-004", premium: 0, oopMax: 5500 },
  };

  const payer = payerPlanMap[payerId] ?? payerPlanMap["UHC001"]!;

  return {
    planName: payer.planName,
    planId: payer.planId,
    payerId,
    memberName: `${firstName} ${lastName}`,
    status: "Active",
    effectiveDate: "2025-01-01",
    terminationDate: "2025-12-31",
    premium: payer.premium,
    deductible: 0,
    oopMax: payer.oopMax,
    pcpCopay: 0,
    specialistCopay: 35,
    urgentCareCopay: 35,
    erCopay: 90,
    inpatientCost: "$275/day days 1–7",
    drugTier1Copay: 0,
    drugTier2Copay: 5,
    drugTier3Copay: 42,
    dentalCoverage: "$1,500 comprehensive/year",
    visionCoverage: "$150 eyewear allowance/year",
    hearingCoverage: "$1,000 hearing aid allowance",
  };
}

// ─── Mock comparison response ────────────────────────────────────────────────

function buildMockComparisonResponse(
  currentPlan: z.infer<typeof CurrentPlanSchema>,
  potentialPlan: z.infer<typeof PotentialPlanSchema>
) {
  const moopDiff = currentPlan.oopMax - potentialPlan.oopMax;
  const specialistDiff = currentPlan.specialistCopay - potentialPlan.specialistCopay;
  const premiumDiff = potentialPlan.premium - currentPlan.premium;

  // Rough annual cost estimate: 12 * premium + 6 PCP visits + 4 specialist visits + 2 urgent care
  const currentAnnual =
    currentPlan.premium * 12 +
    currentPlan.pcpCopay * 6 +
    currentPlan.specialistCopay * 4 +
    currentPlan.urgentCareCopay * 2;

  const potentialAnnual =
    potentialPlan.premium * 12 +
    potentialPlan.pcpCopay * 6 +
    potentialPlan.specialistCopay * 4 +
    potentialPlan.urgentCareCopay * 2;

  const savings = currentAnnual - potentialAnnual;

  const currentPros: string[] = [];
  const currentCons: string[] = [];
  const potentialPros: string[] = [];
  const potentialCons: string[] = [];

  // Premium
  if (currentPlan.premium === 0) currentPros.push("$0 monthly premium");
  else currentCons.push(`$${currentPlan.premium}/mo premium`);
  if (potentialPlan.premium === 0) potentialPros.push("$0 monthly premium");
  else potentialCons.push(`$${potentialPlan.premium}/mo premium`);

  // MOOP
  if (moopDiff > 0) {
    currentCons.push(`Higher MOOP of $${currentPlan.oopMax.toLocaleString()}`);
    potentialPros.push(`Lower MOOP of $${potentialPlan.oopMax.toLocaleString()}`);
  } else if (moopDiff < 0) {
    currentPros.push(`Lower MOOP of $${currentPlan.oopMax.toLocaleString()}`);
    potentialCons.push(`Higher MOOP of $${potentialPlan.oopMax.toLocaleString()}`);
  } else {
    currentPros.push(`MOOP of $${currentPlan.oopMax.toLocaleString()}`);
    potentialPros.push(`MOOP of $${potentialPlan.oopMax.toLocaleString()}`);
  }

  // Specialist copay
  if (specialistDiff > 0) {
    currentCons.push(`Higher specialist copay ($${currentPlan.specialistCopay})`);
    potentialPros.push(`Lower specialist copay ($${potentialPlan.specialistCopay})`);
  } else if (specialistDiff < 0) {
    currentPros.push(`Lower specialist copay ($${currentPlan.specialistCopay})`);
    potentialCons.push(`Higher specialist copay ($${potentialPlan.specialistCopay})`);
  }

  // Dental
  if (currentPlan.dentalCoverage !== "Not covered") currentPros.push("Dental coverage included");
  else currentCons.push("No dental coverage");
  if (potentialPlan.dentalCoverage !== "Not covered") potentialPros.push("Dental coverage included");
  else potentialCons.push("No dental coverage");

  // Vision
  if (currentPlan.visionCoverage !== "Not covered") currentPros.push("Vision coverage included");
  else currentCons.push("No vision coverage");
  if (potentialPlan.visionCoverage !== "Not covered") potentialPros.push("Vision coverage included");
  else potentialCons.push("No vision coverage");

  // Hearing
  if (currentPlan.hearingCoverage !== "Not covered") currentPros.push("Hearing aid coverage");
  else currentCons.push("No hearing coverage");
  if (potentialPlan.hearingCoverage !== "Not covered") potentialPros.push("Hearing aid coverage");
  else potentialCons.push("No hearing coverage");

  const summaryParts: string[] = [];
  if (moopDiff > 0) {
    summaryParts.push(
      `Your current plan has a higher out-of-pocket maximum ($${currentPlan.oopMax.toLocaleString()} vs $${potentialPlan.oopMax.toLocaleString()}), which means you could pay up to $${moopDiff.toLocaleString()} more if you have a high-cost medical event.`
    );
  } else if (moopDiff < 0) {
    summaryParts.push(
      `Your current plan offers better financial protection with a lower MOOP ($${currentPlan.oopMax.toLocaleString()} vs $${potentialPlan.oopMax.toLocaleString()}).`
    );
  }
  if (premiumDiff > 0) {
    summaryParts.push(`The new plan costs $${premiumDiff}/month more in premiums ($${premiumDiff * 12}/year).`);
  }
  if (specialistDiff > 0) {
    summaryParts.push(
      `The new plan has lower specialist copays ($${potentialPlan.specialistCopay} vs $${currentPlan.specialistCopay}), which could save you money if you see specialists frequently.`
    );
  }

  const summary =
    summaryParts.length > 0
      ? summaryParts.join(" ")
      : `Both plans offer comparable coverage. Review the detailed comparison below to find the best fit for your healthcare needs.`;

  const recommendation =
    savings > 0
      ? `Based on typical usage (6 PCP visits, 4 specialist visits, 2 urgent care visits per year), the ${potentialPlan.planName} could save you approximately $${savings.toLocaleString()} annually compared to your current plan. If you also factor in the $${moopDiff.toLocaleString()} lower out-of-pocket maximum, the potential savings are even greater in a high-utilization year.`
      : `Your current plan appears to be cost-effective for typical usage patterns. Consider switching only if the ${potentialPlan.planName}'s network includes your preferred doctors and the benefit differences align with your health needs.`;

  return {
    summary,
    currentPlanPros: currentPros,
    currentPlanCons: currentCons,
    potentialPlanPros: potentialPros,
    potentialPlanCons: potentialCons,
    recommendation,
    estimatedAnnualCostCurrent: currentAnnual,
    estimatedAnnualCostPotential: potentialAnnual,
  };
}

// ─── Router ──────────────────────────────────────────────────────────────────

export const pverifyRouter = router({
  /**
   * Stubbed pVerify eligibility lookup.
   * TODO: Replace with real pVerify API call:
   *   POST https://api.pverify.com/api/EligibilitySummary
   *   Headers: { Authorization: `Bearer ${token}`, "Client-API-Id": clientId }
   *   Body: { PayerCode, SubscriberFirstName, SubscriberLastName, SubscriberDOB, SubscriberMemberID }
   */
  lookup: publicProcedure
    .input(EligibilityInputSchema)
    .mutation(async ({ input }) => {
      // Simulate real API latency
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const result = buildMockEligibilityResponse(input.payerId, input.firstName, input.lastName);
      return { success: true, data: result };
    }),

  /**
   * Stubbed plan comparison endpoint.
   * Returns a structured comparison between the current plan and a potential plan.
   * In production this would call Claude or a rules engine.
   */
  compare: publicProcedure
    .input(
      z.object({
        currentPlan: CurrentPlanSchema,
        potentialPlan: PotentialPlanSchema,
      })
    )
    .mutation(async ({ input }) => {
      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      const result = buildMockComparisonResponse(input.currentPlan, input.potentialPlan);
      return { success: true, data: result };
    }),
});
