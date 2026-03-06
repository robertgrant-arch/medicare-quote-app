import { describe, expect, it } from "vitest";
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

const SAMPLE_LOOKUP_INPUT = {
  firstName: "John",
  lastName: "Smith",
  dob: "1950-03-15",
  memberId: "123456789",
  payerId: "UHC001",
};

describe("pverify.lookup", () => {
  it("returns a successful mock eligibility response", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.pverify.lookup(SAMPLE_LOOKUP_INPUT);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data.status).toBe("Active");
    expect(result.data.planName).toBeTruthy();
    expect(result.data.planId).toBeTruthy();
    expect(result.data.effectiveDate).toBe("2025-01-01");
    expect(result.data.terminationDate).toBe("2025-12-31");
    expect(typeof result.data.oopMax).toBe("number");
    expect(typeof result.data.premium).toBe("number");
  }, 10000); // 10s timeout to allow for the 1.2s artificial delay

  it("includes member name in the response", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.pverify.lookup(SAMPLE_LOOKUP_INPUT);

    expect(result.data.memberName).toContain("John");
    expect(result.data.memberName).toContain("Smith");
  }, 10000);

  it("returns different plan names for different payers", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    const uhcResult = await caller.pverify.lookup({ ...SAMPLE_LOOKUP_INPUT, payerId: "UHC001" });
    const humanaResult = await caller.pverify.lookup({ ...SAMPLE_LOOKUP_INPUT, payerId: "HUM001" });

    expect(uhcResult.data.planName).not.toBe(humanaResult.data.planName);
    expect(uhcResult.data.planId).not.toBe(humanaResult.data.planId);
  }, 30000);

  it("has all required copay fields", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.pverify.lookup(SAMPLE_LOOKUP_INPUT);
    const d = result.data;

    expect(typeof d.pcpCopay).toBe("number");
    expect(typeof d.specialistCopay).toBe("number");
    expect(typeof d.urgentCareCopay).toBe("number");
    expect(typeof d.erCopay).toBe("number");
    expect(typeof d.drugTier1Copay).toBe("number");
    expect(typeof d.drugTier2Copay).toBe("number");
    expect(typeof d.drugTier3Copay).toBe("number");
    expect(d.dentalCoverage).toBeTruthy();
    expect(d.visionCoverage).toBeTruthy();
    expect(d.hearingCoverage).toBeTruthy();
  }, 10000);
});

describe("pverify.compare", () => {
  const CURRENT_PLAN = {
    planName: "UnitedHealthcare AARP MedicareComplete Patriot (HMO)",
    planId: "H0624-001",
    payerId: "UHC001",
    status: "Active",
    effectiveDate: "2025-01-01",
    terminationDate: "2025-12-31",
    premium: 0,
    deductible: 0,
    oopMax: 4900,
    pcpCopay: 0,
    specialistCopay: 35,
    urgentCareCopay: 35,
    erCopay: 90,
    inpatientCost: "$275/day days 1-7",
    drugTier1Copay: 0,
    drugTier2Copay: 5,
    drugTier3Copay: 42,
    dentalCoverage: "$1,500 comprehensive/year",
    visionCoverage: "$150 eyewear allowance/year",
    hearingCoverage: "$1,000 hearing aid allowance",
  };

  const POTENTIAL_PLAN = {
    id: "humana-h1036",
    planName: "Humana Gold Plus H1036-286 (HMO)",
    carrier: "Humana",
    premium: 0,
    deductible: 0,
    oopMax: 3400,
    pcpCopay: 5,
    specialistCopay: 35,
    urgentCareCopay: 30,
    erCopay: 90,
    drugTier1Copay: 0,
    drugTier2Copay: 4,
    drugTier3Copay: 38,
    dentalCoverage: "$1,000 comprehensive/year",
    visionCoverage: "$100 eyewear allowance/year",
    hearingCoverage: "$500 hearing aid allowance",
  };

  it("returns a structured comparison result", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.pverify.compare({
      currentPlan: CURRENT_PLAN,
      potentialPlan: POTENTIAL_PLAN,
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data.summary).toBeTruthy();
    expect(result.data.recommendation).toBeTruthy();
    expect(Array.isArray(result.data.currentPlanPros)).toBe(true);
    expect(Array.isArray(result.data.currentPlanCons)).toBe(true);
    expect(Array.isArray(result.data.potentialPlanPros)).toBe(true);
    expect(Array.isArray(result.data.potentialPlanCons)).toBe(true);
    expect(typeof result.data.estimatedAnnualCostCurrent).toBe("number");
    expect(typeof result.data.estimatedAnnualCostPotential).toBe("number");
  }, 10000);

  it("identifies lower MOOP as a pro for the potential plan", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.pverify.compare({
      currentPlan: CURRENT_PLAN,
      potentialPlan: POTENTIAL_PLAN,
    });

    // Potential plan has lower MOOP ($3400 vs $4900), should be flagged as a pro
    const potentialPros = result.data.potentialPlanPros.join(" ");
    expect(potentialPros).toContain("3,400");
  }, 10000);

  it("calculates annual cost estimates correctly", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.pverify.compare({
      currentPlan: CURRENT_PLAN,
      potentialPlan: POTENTIAL_PLAN,
    });

    // Current: 0*12 + 0*6 + 35*4 + 35*2 = 0 + 0 + 140 + 70 = 210
    expect(result.data.estimatedAnnualCostCurrent).toBe(210);
    // Potential: 0*12 + 5*6 + 35*4 + 30*2 = 0 + 30 + 140 + 60 = 230
    expect(result.data.estimatedAnnualCostPotential).toBe(230);
  }, 10000);
});
