/**
 * Formulary Drug Cost Calculator — 2026 Medicare Part D Model
 *
 * Calculates estimated annual drug costs for a member's drug list against
 * each plan's UNIQUE formulary tier structure.
 *
 * 2026 Part D has THREE phases (donut hole eliminated in 2025):
 *   1. Deductible phase: Member pays 100% until plan drug deductible is met
 *      - Max deductible is $615 for 2026, but many plans have $0
 *      - Tier 1 generics are often exempt from deductible
 *   2. Initial coverage phase: Member pays tier copay/coinsurance
 *      - Continues until member OOP spending reaches $2,100
 *   3. Catastrophic phase: Member pays $0 for rest of year
 *      - Once $2,100 OOP is reached, plan covers 100%
 *
 * Key: Each plan has DIFFERENT tier copays, deductibles, and gap coverage
 * which produces DIFFERENT estimated costs per plan.
 */

// ── Drug classification database ──────────────────────────────────────────────
interface DrugProfile {
  tier: 1 | 2 | 3 | 4;
  avgMonthlyCost: number;
  isGeneric: boolean;
}

const DRUG_DATABASE: Record<string, DrugProfile> = {
  // Tier 1: Generics ($5-30/month retail)
  "lisinopril":          { tier: 1, avgMonthlyCost: 12, isGeneric: true },
  "metformin":           { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "atorvastatin":        { tier: 1, avgMonthlyCost: 15, isGeneric: true },
  "amlodipine":          { tier: 1, avgMonthlyCost: 12, isGeneric: true },
  "omeprazole":          { tier: 1, avgMonthlyCost: 14, isGeneric: true },
  "levothyroxine":       { tier: 1, avgMonthlyCost: 18, isGeneric: true },
  "metoprolol":          { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "losartan":            { tier: 1, avgMonthlyCost: 12, isGeneric: true },
  "simvastatin":         { tier: 1, avgMonthlyCost: 8, isGeneric: true },
  "hydrochlorothiazide": { tier: 1, avgMonthlyCost: 8, isGeneric: true },
  "gabapentin":          { tier: 1, avgMonthlyCost: 15, isGeneric: true },
  "sertraline":          { tier: 1, avgMonthlyCost: 12, isGeneric: true },
  "fluoxetine":          { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "warfarin":            { tier: 1, avgMonthlyCost: 12, isGeneric: true },
  "prednisone":          { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "albuterol":           { tier: 1, avgMonthlyCost: 25, isGeneric: true },
  "furosemide":          { tier: 1, avgMonthlyCost: 8, isGeneric: true },
  "clopidogrel":         { tier: 1, avgMonthlyCost: 14, isGeneric: true },
  "carvedilol":          { tier: 1, avgMonthlyCost: 12, isGeneric: true },
  "tamsulosin":          { tier: 1, avgMonthlyCost: 15, isGeneric: true },
  "montelukast":         { tier: 1, avgMonthlyCost: 14, isGeneric: true },
  "escitalopram":        { tier: 1, avgMonthlyCost: 12, isGeneric: true },
  "pantoprazole":        { tier: 1, avgMonthlyCost: 14, isGeneric: true },
  "meloxicam":           { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "trazodone":           { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "glipizide":           { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "rosuvastatin":        { tier: 1, avgMonthlyCost: 15, isGeneric: true },
  "donepezil":           { tier: 1, avgMonthlyCost: 14, isGeneric: true },
  "memantine":           { tier: 1, avgMonthlyCost: 20, isGeneric: true },
  // Tier 2: Preferred Brand
  "eliquis":   { tier: 2, avgMonthlyCost: 280, isGeneric: false },
  "jardiance":  { tier: 2, avgMonthlyCost: 340, isGeneric: false },
  "xarelto":   { tier: 2, avgMonthlyCost: 290, isGeneric: false },
  "entresto":  { tier: 2, avgMonthlyCost: 380, isGeneric: false },
  "ozempic":   { tier: 2, avgMonthlyCost: 450, isGeneric: false },
  "rybelsus":  { tier: 2, avgMonthlyCost: 420, isGeneric: false },
  "trulicity": { tier: 2, avgMonthlyCost: 400, isGeneric: false },
  "farxiga":   { tier: 2, avgMonthlyCost: 320, isGeneric: false },
  "symbicort": { tier: 2, avgMonthlyCost: 180, isGeneric: false },
  "spiriva":   { tier: 2, avgMonthlyCost: 260, isGeneric: false },
  "lantus":    { tier: 2, avgMonthlyCost: 180, isGeneric: false },
  "humalog":   { tier: 2, avgMonthlyCost: 170, isGeneric: false },
  "novolog":   { tier: 2, avgMonthlyCost: 170, isGeneric: false },
  "lyrica":    { tier: 2, avgMonthlyCost: 240, isGeneric: false },
  "januvia":   { tier: 2, avgMonthlyCost: 280, isGeneric: false },
  // Tier 3: Non-Preferred Brand
  "humira":    { tier: 3, avgMonthlyCost: 2800, isGeneric: false },
  "enbrel":    { tier: 3, avgMonthlyCost: 2600, isGeneric: false },
  "otezla":    { tier: 3, avgMonthlyCost: 1800, isGeneric: false },
  "rinvoq":    { tier: 3, avgMonthlyCost: 3200, isGeneric: false },
  "cosentyx":  { tier: 3, avgMonthlyCost: 2400, isGeneric: false },
  "taltz":     { tier: 3, avgMonthlyCost: 3000, isGeneric: false },
  "breo":      { tier: 3, avgMonthlyCost: 220, isGeneric: false },
  "trelegy":   { tier: 3, avgMonthlyCost: 350, isGeneric: false },
  // Tier 4: Specialty
  "keytruda":  { tier: 4, avgMonthlyCost: 10000, isGeneric: false },
  "revlimid":  { tier: 4, avgMonthlyCost: 8000, isGeneric: false },
  "ibrance":   { tier: 4, avgMonthlyCost: 7500, isGeneric: false },
  "imbruvica": { tier: 4, avgMonthlyCost: 8500, isGeneric: false },
  "jakafi":    { tier: 4, avgMonthlyCost: 9000, isGeneric: false },
  "stelara":   { tier: 4, avgMonthlyCost: 6000, isGeneric: false },
  "dupixent":  { tier: 4, avgMonthlyCost: 2400, isGeneric: false },
};

function classifyUnknownDrug(name: string, dosage: string): DrugProfile {
  const lower = name.toLowerCase();
  const genericSuffixes = ["pril", "olol", "sartan", "statin", "prazole", "tidine", "dipine", "azepam", "oxetine", "pram", "azole", "mycin", "cillin", "cycline"];
  const isLikelyGeneric = genericSuffixes.some(s => lower.endsWith(s));
  if (isLikelyGeneric) {
    return { tier: 1, avgMonthlyCost: 15, isGeneric: true };
  }
  return { tier: 2, avgMonthlyCost: 200, isGeneric: false };
}

// ── Copay/coinsurance parsers ────────────────────────────────────────────────
function parseCopayAmount(copayStr: string): { type: "flat" | "percent"; value: number } {
  if (!copayStr) return { type: "flat", value: 0 };
  const str = copayStr.toLowerCase().trim();
  const pctMatch = str.match(/(\d+(?:\.\d+)?)\s*%/);
  if (pctMatch) return { type: "percent", value: parseFloat(pctMatch[1]) };
  const dollarMatch = str.match(/\$\s*(\d+(?:\.\d+)?)/);
  if (dollarMatch) return { type: "flat", value: parseFloat(dollarMatch[1]) };
  const numMatch = str.match(/(\d+(?:\.\d+)?)/);
  if (numMatch) return { type: "flat", value: parseFloat(numMatch[1]) };
  return { type: "flat", value: 0 };
}

function parseDeductible(deductStr: string | number | undefined): number {
  if (typeof deductStr === "number") return deductStr;
  if (!deductStr) return 0;
  const match = String(deductStr).match(/\$?\s*(\d+(?:,\d{3})*)/);
  if (match) return parseInt(match[1].replace(/,/g, ""), 10);
  return 0;
}

// ── Core types ───────────────────────────────────────────────────────────────
export interface DrugInput {
  name: string;
  dosage: string;
}

export interface DrugCostBreakdown {
  drugName: string;
  tier: number;
  monthlyRetailCost: number;
  monthlyCopay: number;
  annualCost: number;
  phase: string;
}

export interface FormularyResult {
  estimatedAnnualDrugCost: number;
  drugBreakdowns: DrugCostBreakdown[];
  deductibleApplied: number;
  reachesCatastrophic: boolean;
  monthCatastrophicReached: number | null;
  totalRetailCost: number;
  oopBreakdown: {
    deductiblePhase: number;
    initialCoveragePhase: number;
    catastrophicPhase: number;
  };
}

// ── 2026 Medicare Part D Parameters ───────────────────────────────────────────
// Donut hole ELIMINATED in 2025. Three phases only.
const OOP_CAP_2026 = 2100; // Annual OOP cap - after this, $0 cost
const MAX_DEDUCTIBLE_2026 = 615; // Maximum allowed deductible

/**
 * Calculate estimated annual drug cost for a member against a specific plan.
 *
 * 2026 Part D phases:
 *   Phase 1 - Deductible: Member pays 100% of drug retail cost
 *     - Tier 1 generics typically exempt from deductible
 *     - Deductible varies by plan ($0 to $615)
 *   Phase 2 - Initial Coverage: Member pays plan-specific tier copay/coinsurance
 *     - Each plan has DIFFERENT copays per tier
 *     - This is where costs diverge significantly between plans
 *   Phase 3 - Catastrophic: Member pays $0
 *     - Triggered when cumulative OOP reaches $2,100
 */
export function calculateDrugCosts(
  drugs: DrugInput[],
  planRx: {
    tier1: string;
    tier2: string;
    tier3: string;
    tier4: string;
    deductible: string | number;
    gap: boolean;
    initialCoverageLimit?: string;
  }
): FormularyResult {
  if (!drugs || drugs.length === 0) {
    return {
      estimatedAnnualDrugCost: 0,
      drugBreakdowns: [],
      deductibleApplied: 0,
      reachesCatastrophic: false,
      monthCatastrophicReached: null,
      totalRetailCost: 0,
      oopBreakdown: { deductiblePhase: 0, initialCoveragePhase: 0, catastrophicPhase: 0 },
    };
  }

  const drugDeductible = Math.min(parseDeductible(planRx.deductible), MAX_DEDUCTIBLE_2026);

  // Parse each tier's copay structure - THIS IS WHAT DIFFERS PER PLAN
  const tierCopays = {
    1: parseCopayAmount(planRx.tier1),
    2: parseCopayAmount(planRx.tier2),
    3: parseCopayAmount(planRx.tier3),
    4: parseCopayAmount(planRx.tier4),
  };

  // Classify each drug
  const drugProfiles = drugs.map(drug => {
    const key = drug.name.toLowerCase().trim();
    const profile = DRUG_DATABASE[key] || classifyUnknownDrug(drug.name, drug.dosage);
    return { drug, profile };
  });

  // Track spending through Part D phases
  let cumulativeOOP = 0; // Member out-of-pocket running total
  let deductibleRemaining = drugDeductible;
  let totalRetailAnnual = 0;
  let deductiblePhaseCost = 0;
  let initialCoveragePhaseCost = 0;
  let catastrophicPhaseCost = 0;
  let monthCatastrophicReached: number | null = null;

  // Per-drug annual cost tracking
  const drugAnnualCosts: Map<string, number> = new Map();
  for (const { drug } of drugProfiles) {
    drugAnnualCosts.set(drug.name, 0);
  }

  // Process month by month to accurately track phase transitions
  for (let month = 0; month < 12; month++) {
    // Skip if already in catastrophic (member pays $0)
    if (cumulativeOOP >= OOP_CAP_2026) {
      if (monthCatastrophicReached === null) monthCatastrophicReached = month;
      // Still track retail costs
      for (const { drug, profile } of drugProfiles) {
        totalRetailAnnual += profile.avgMonthlyCost;
      }
      continue;
    }

    for (const { drug, profile } of drugProfiles) {
      const retailCost = profile.avgMonthlyCost;
      totalRetailAnnual += retailCost;
      let memberPays = 0;

      // Check if already hit catastrophic
      if (cumulativeOOP >= OOP_CAP_2026) {
        // $0 cost in catastrophic phase
        catastrophicPhaseCost += 0;
        continue;
      }

      // PHASE 1: Deductible
      // Tier 1 generics are typically exempt from deductible in most MA plans
      if (deductibleRemaining > 0 && profile.tier > 1) {
        const deductiblePortion = Math.min(retailCost, deductibleRemaining);
        memberPays = deductiblePortion;
        deductibleRemaining -= deductiblePortion;
        deductiblePhaseCost += memberPays;
      }
      // PHASE 2: Initial Coverage - member pays tier-specific copay/coinsurance
      else {
        const copay = tierCopays[profile.tier as 1 | 2 | 3 | 4];
        if (copay.type === "flat") {
          memberPays = copay.value;
        } else {
          // Coinsurance: percentage of retail cost
          memberPays = retailCost * (copay.value / 100);
        }
        initialCoveragePhaseCost += memberPays;
      }

      // Cap member payment if it would exceed OOP cap
      const remainingToOOPCap = OOP_CAP_2026 - cumulativeOOP;
      if (memberPays > remainingToOOPCap) {
        memberPays = remainingToOOPCap;
        if (monthCatastrophicReached === null) monthCatastrophicReached = month + 1;
      }

      cumulativeOOP += memberPays;
      const prev = drugAnnualCosts.get(drug.name) || 0;
      drugAnnualCosts.set(drug.name, prev + memberPays);
    }
  }

  // Build per-drug breakdowns
  const breakdowns: DrugCostBreakdown[] = drugProfiles.map(({ drug, profile }) => {
    const copay = tierCopays[profile.tier as 1 | 2 | 3 | 4];
    const monthlyCopay = copay.type === "flat" ? copay.value : profile.avgMonthlyCost * (copay.value / 100);
    const annualCost = drugAnnualCosts.get(drug.name) || 0;
    return {
      drugName: drug.name,
      tier: profile.tier,
      monthlyRetailCost: profile.avgMonthlyCost,
      monthlyCopay: Math.round(monthlyCopay * 100) / 100,
      annualCost: Math.round(annualCost),
      phase: cumulativeOOP >= OOP_CAP_2026 ? "catastrophic" : "initial",
    };
  });

  return {
    estimatedAnnualDrugCost: Math.round(cumulativeOOP),
    drugBreakdowns: breakdowns,
    deductibleApplied: drugDeductible - deductibleRemaining,
    reachesCatastrophic: cumulativeOOP >= OOP_CAP_2026,
    monthCatastrophicReached,
    totalRetailCost: Math.round(totalRetailAnnual),
    oopBreakdown: {
      deductiblePhase: Math.round(deductiblePhaseCost),
      initialCoveragePhase: Math.round(initialCoveragePhaseCost),
      catastrophicPhase: Math.round(catastrophicPhaseCost),
    },
  };
}

/**
 * Enrich plans array with per-plan drug cost calculations.
 * Each plan gets its OWN unique cost based on its tier structure.
 */
export function enrichPlansWithDrugCosts(
  plans: any[],
  drugs: DrugInput[]
): any[] {
  if (!drugs || drugs.length === 0) return plans;

  return plans.map(plan => {
    const rxStructure = {
      tier1: plan.rxDrugs?.tier1 ?? "$0",
      tier2: plan.rxDrugs?.tier2 ?? "$10",
      tier3: plan.rxDrugs?.tier3 ?? "$42",
      tier4: plan.rxDrugs?.tier4 ?? "25%",
      deductible: plan.rxDrugs?.deductible ?? "$0",
      gap: plan.rxDrugs?.gap ?? false,
    };

    const result = calculateDrugCosts(drugs, rxStructure);
    const annualPremium = (plan.premium ?? 0) * 12;

    return {
      ...plan,
      formularyDrugCost: result,
      estimatedAnnualDrugCost: result.estimatedAnnualDrugCost,
      estimatedTotalAnnualCost: annualPremium + result.estimatedAnnualDrugCost,
    };
  });
}
