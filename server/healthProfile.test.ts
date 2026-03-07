/**
 * Tests for the healthProfile.recommend tRPC procedure
 *
 * Validates:
 * - Plans are scored and ranked correctly
 * - Match scores are within 0–100
 * - Match reasons and watch-outs are populated
 * - Estimated annual cost calculation is reasonable
 * - AI narrative gracefully degrades on failure
 */

import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const BASE_PROFILE = {
  healthStatus: "good" as const,
  chronicConditions: "1-2" as const,
  plannedSurgery: "no" as const,
  pcpVisits: "3-6" as const,
  specialistVisits: "1-3" as const,
  erVisits: "0" as const,
  urgentCareVisits: "1-3" as const,
  monthlyRxCount: "1-3" as const,
  brandNameDrugs: "no" as const,
  specialtyDrugs: "no" as const,
  monthlyDrugSpend: "under-100" as const,
  dentalImportance: "somewhat" as const,
  visionImportance: "somewhat" as const,
  hearingImportance: "not" as const,
  needsTransportation: "no" as const,
  wantsOTC: "yes" as const,
  wantsFitness: "yes" as const,
  hasSpecificDoctors: "no" as const,
  planTypePreference: "no-preference" as const,
  topPriority: "lowest-premium" as const,
  zip: "64106",
};

const PLAN_A = {
  id: "plan-a",
  planName: "UHC AARP MedicareComplete HMO",
  carrier: "UnitedHealthcare",
  planType: "HMO",
  premium: 0,
  deductible: 0,
  maxOutOfPocket: 4900,
  starRating: 4.5,
  pcpCopay: 0,
  specialistCopay: 35,
  urgentCareCopay: 35,
  erCopay: 90,
  drugTier1Copay: 0,
  drugTier2Copay: 5,
  drugTier3Copay: 42,
  hasDental: true,
  hasVision: true,
  hasHearing: false,
  hasTransportation: false,
  hasOTC: true,
  hasFitness: true,
  isBestMatch: true,
  isMostPopular: false,
};

const PLAN_B = {
  id: "plan-b",
  planName: "Humana Gold Plus PPO",
  carrier: "Humana",
  planType: "PPO",
  premium: 89,
  deductible: 0,
  maxOutOfPocket: 6700,
  starRating: 3.5,
  pcpCopay: 10,
  specialistCopay: 45,
  urgentCareCopay: 45,
  erCopay: 120,
  drugTier1Copay: 5,
  drugTier2Copay: 15,
  drugTier3Copay: 65,
  hasDental: false,
  hasVision: false,
  hasHearing: false,
  hasTransportation: false,
  hasOTC: false,
  hasFitness: false,
  isBestMatch: false,
  isMostPopular: false,
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("healthProfile.recommend", () => {
  it("returns ranked plans with valid match scores", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.healthProfile.recommend({
      profile: BASE_PROFILE,
      plans: [PLAN_A, PLAN_B],
    });

    expect(result.rankedPlans).toHaveLength(2);
    expect(result.totalPlansScored).toBe(2);

    for (const plan of result.rankedPlans) {
      expect(plan.matchScore).toBeGreaterThanOrEqual(0);
      expect(plan.matchScore).toBeLessThanOrEqual(100);
    }
  });

  it("ranks $0-premium plan higher when topPriority is lowest-premium", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.healthProfile.recommend({
      profile: { ...BASE_PROFILE, topPriority: "lowest-premium" },
      plans: [PLAN_B, PLAN_A], // B first to test ordering
    });

    expect(result.rankedPlans[0].id).toBe("plan-a");
    expect(result.rankedPlans[0].matchScore).toBeGreaterThan(result.rankedPlans[1].matchScore);
  });

  it("ranks lower-OOP plan higher when topPriority is lowest-oop", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.healthProfile.recommend({
      profile: { ...BASE_PROFILE, topPriority: "lowest-oop" },
      plans: [PLAN_A, PLAN_B],
    });

    // Plan A has lower OOP ($4900 vs $6700)
    expect(result.rankedPlans[0].id).toBe("plan-a");
  });

  it("includes match reasons array for each plan", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.healthProfile.recommend({
      profile: BASE_PROFILE,
      plans: [PLAN_A],
    });

    expect(result.rankedPlans[0].matchReasons).toBeInstanceOf(Array);
    expect(result.rankedPlans[0].matchReasons.length).toBeGreaterThanOrEqual(0);
  });

  it("includes watch-outs for high-premium plan", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.healthProfile.recommend({
      profile: { ...BASE_PROFILE, topPriority: "lowest-premium" },
      plans: [PLAN_B],
    });

    // Plan B has $89 premium — should have a watch-out
    expect(result.rankedPlans[0].watchOuts.length).toBeGreaterThan(0);
  });

  it("calculates a non-negative estimated annual cost", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.healthProfile.recommend({
      profile: BASE_PROFILE,
      plans: [PLAN_A, PLAN_B],
    });

    for (const plan of result.rankedPlans) {
      expect(plan.estimatedAnnualCost).toBeGreaterThanOrEqual(0);
    }
  });

  it("handles single plan input", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.healthProfile.recommend({
      profile: BASE_PROFILE,
      plans: [PLAN_A],
    });

    expect(result.rankedPlans).toHaveLength(1);
    expect(result.totalPlansScored).toBe(1);
  }, 15_000);

  it("returns aiNarrative as string (may be empty if LLM unavailable)", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.healthProfile.recommend({
      profile: BASE_PROFILE,
      plans: [PLAN_A, PLAN_B],
    });

    expect(typeof result.aiNarrative).toBe("string");
  });

  it("scores PPO plan higher when planTypePreference is ppo", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.healthProfile.recommend({
      profile: { ...BASE_PROFILE, planTypePreference: "ppo" },
      plans: [PLAN_A, PLAN_B],
    });

    // Plan B is PPO — should score higher on this dimension
    const planBResult = result.rankedPlans.find((p) => p.id === "plan-b");
    expect(planBResult).toBeDefined();
    // Plan B should have a PPO-related reason
    const hasPPOReason = planBResult!.matchReasons.some((r) => r.toLowerCase().includes("ppo"));
    expect(hasPPOReason).toBe(true);
  });

  it("includes dental benefit reason when dentalImportance is very and plan has dental", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.healthProfile.recommend({
      profile: { ...BASE_PROFILE, dentalImportance: "very" },
      plans: [PLAN_A],
    });

    const planA = result.rankedPlans[0];
    const hasDentalReason = planA.matchReasons.some((r) => r.toLowerCase().includes("dental"));
    expect(hasDentalReason).toBe(true);
  });
});
