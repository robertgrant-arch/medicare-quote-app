/**
 * Formulary Drug Cost Calculator
 *
 * Calculates estimated annual drug costs for a member's drug list against
 * each plan's formulary tier structure. Uses standard Medicare Part D
 * cost-sharing phases:
 *
 * 1. Deductible phase: Member pays full cost until drug deductible is met
 * 2. Initial coverage phase: Member pays tier copay/coinsurance
 * 3. Coverage gap (donut hole): Member pays 25% of drug cost (if no gap coverage)
 * 4. Catastrophic phase: Member pays ~5%
 *
 * This module provides deterministic cost estimates WITHOUT requiring
 * external formulary API calls — uses the plan's tier structure + drug
 * classification heuristics to estimate costs.
 */

// ── Drug classification database ──────────────────────────────────────────────
// Maps common drug names to their typical tier and average retail cost/month

interface DrugProfile {
  tier: 1 | 2 | 3 | 4;  // 1=Generic, 2=Preferred Brand, 3=Non-Preferred Brand, 4=Specialty
  avgMonthlyCost: number; // Average retail (uninsured) monthly cost
  isGeneric: boolean;
}

// Comprehensive drug classification lookup
// Covers the most commonly prescribed Medicare drugs
const DRUG_DATABASE: Record<string, DrugProfile> = {
  // ── Tier 1: Generics ($5-30/month retail) ──────────────────────────────────
  "lisinopril":       { tier: 1, avgMonthlyCost: 12, isGeneric: true },
  "metformin":        { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "atorvastatin":     { tier: 1, avgMonthlyCost: 15, isGeneric: true },
  "amlodipine":       { tier: 1, avgMonthlyCost: 12, isGeneric: true },
  "omeprazole":       { tier: 1, avgMonthlyCost: 14, isGeneric: true },
  "levothyroxine":    { tier: 1, avgMonthlyCost: 18, isGeneric: true },
  "metoprolol":       { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "losartan":         { tier: 1, avgMonthlyCost: 12, isGeneric: true },
  "simvastatin":      { tier: 1, avgMonthlyCost: 8, isGeneric: true },
  "hydrochlorothiazide": { tier: 1, avgMonthlyCost: 8, isGeneric: true },
  "gabapentin":       { tier: 1, avgMonthlyCost: 15, isGeneric: true },
  "sertraline":       { tier: 1, avgMonthlyCost: 12, isGeneric: true },
  "fluoxetine":       { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "acetaminophen":    { tier: 1, avgMonthlyCost: 6, isGeneric: true },
  "ibuprofen":        { tier: 1, avgMonthlyCost: 6, isGeneric: true },
  "aspirin":          { tier: 1, avgMonthlyCost: 5, isGeneric: true },
  "warfarin":         { tier: 1, avgMonthlyCost: 12, isGeneric: true },
  "prednisone":       { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "albuterol":        { tier: 1, avgMonthlyCost: 25, isGeneric: true },
  "furosemide":       { tier: 1, avgMonthlyCost: 8, isGeneric: true },
  "clopidogrel":      { tier: 1, avgMonthlyCost: 14, isGeneric: true },
  "carvedilol":       { tier: 1, avgMonthlyCost: 12, isGeneric: true },
  "tamsulosin":       { tier: 1, avgMonthlyCost: 15, isGeneric: true },
  "montelukast":      { tier: 1, avgMonthlyCost: 14, isGeneric: true },
  "escitalopram":     { tier: 1, avgMonthlyCost: 12, isGeneric: true },
  "pantoprazole":     { tier: 1, avgMonthlyCost: 14, isGeneric: true },
  "meloxicam":        { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "trazodone":        { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "glipizide":        { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "rosuvastatin":     { tier: 1, avgMonthlyCost: 15, isGeneric: true },
  "donepezil":        { tier: 1, avgMonthlyCost: 14, isGeneric: true },
  "memantine":        { tier: 1, avgMonthlyCost: 20, isGeneric: true },
  // ── Tier 2: Preferred Brand ($30-150/month retail) ─────────────────────────
  "eliquis":          { tier: 2, avgMonthlyCost: 280, isGeneric: false },
  "jardiance":        { tier: 2, avgMonthlyCost: 340, isGeneric: false },
  "xarelto":          { tier: 2, avgMonthlyCost: 290, isGeneric: false },
  "entresto":         { tier: 2, avgMonthlyCost: 380, isGeneric: false },
  "ozempic":          { tier: 2, avgMonthlyCost: 450, isGeneric: false },
  "rybelsus":         { tier: 2, avgMonthlyCost: 420, isGeneric: false },
  "trulicity":        { tier: 2, avgMonthlyCost: 400, isGeneric: false },
  "farxiga":          { tier: 2, avgMonthlyCost: 320, isGeneric: false },
  "symbicort":        { tier: 2, avgMonthlyCost: 180, isGeneric: false },
  "spiriva":          { tier: 2, avgMonthlyCost: 260, isGeneric: false },
  "lantus":           { tier: 2, avgMonthlyCost: 180, isGeneric: false },
  "humalog":          { tier: 2, avgMonthlyCost: 170, isGeneric: false },
  "novolog":          { tier: 2, avgMonthlyCost: 170, isGeneric: false },
  "lyrica":           { tier: 2, avgMonthlyCost: 240, isGeneric: false },
  "januvia":          { tier: 2, avgMonthlyCost: 280, isGeneric: false },
  // ── Tier 3: Non-Preferred Brand ($100-500/month retail) ────────────────────
  "humira":           { tier: 3, avgMonthlyCost: 2800, isGeneric: false },
  "enbrel":           { tier: 3, avgMonthlyCost: 2600, isGeneric: false },
  "otezla":           { tier: 3, avgMonthlyCost: 1800, isGeneric: false },
  "rinvoq":           { tier: 3, avgMonthlyCost: 3200, isGeneric: false },
  "cosentyx":         { tier: 3, avgMonthlyCost: 2400, isGeneric: false },
  "taltz":            { tier: 3, avgMonthlyCost: 3000, isGeneric: false },
  "breo":             { tier: 3, avgMonthlyCost: 220, isGeneric: false },
  "trelegy":          { tier: 3, avgMonthlyCost: 350, isGeneric: false },
  // ── Tier 4: Specialty ($1000+/month retail) ────────────────────────────────
  "keytruda":         { tier: 4, avgMonthlyCost: 10000, isGeneric: false },
  "revlimid":         { tier: 4, avgMonthlyCost: 8000, isGeneric: false },
  "ibrance":          { tier: 4, avgMonthlyCost: 7500, isGeneric: false },
  "imbruvica":        { tier: 4, avgMonthlyCost: 8500, isGeneric: false },
  "jakafi":           { tier: 4, avgMonthlyCost: 9000, isGeneric: false },
  "stelara":          { tier: 4, avgMonthlyCost: 6000, isGeneric: false },
  "dupixent":         { tier: 4, avgMonthlyCost: 2400, isGeneric: false },
};

// Default profiles for unknown drugs based on heuristics
function classifyUnknownDrug(name: string, dosage: string): DrugProfile {
  const lower = name.toLowerCase();
  // Brand names often start with uppercase and don't end in common generic suffixes
  const genericSuffixes = ["pril", "olol", "sartan", "statin", "prazole", "tidine", "dipine", "azepam", "oxetine", "pram", "azole", "mycin", "cillin", "cycline"];
  const isLikelyGeneric = genericSuffixes.some(s => lower.endsWith(s));
  if (isLikelyGeneric) {
    return { tier: 1, avgMonthlyCost: 15, isGeneric: true };
  }
  // Default to tier 2 preferred brand for unknown drugs
  return { tier: 2, avgMonthlyCost: 200, isGeneric: false };
}

// ── Copay string parser ─────────────────────────────────────────────────────────────
// Extracts dollar amount from strings like "$10 copay", "$42", "25%", "$0"
function parseCopayAmount(copayStr: string): { type: "flat" | "percent"; value: number } {
  if (!copayStr) return { type: "flat", value: 0 };
  const str = copayStr.toLowerCase().trim();
  // Check for percentage: "25%", "25% coinsurance"
  const pctMatch = str.match(/(\d+(?:\.\d+)?)\s*%/);
  if (pctMatch) {
    return { type: "percent", value: parseFloat(pctMatch[1]) };
  }
  // Check for dollar amount: "$10", "$10 copay", "$0"
  const dollarMatch = str.match(/\$\s*(\d+(?:\.\d+)?)/);
  if (dollarMatch) {
    return { type: "flat", value: parseFloat(dollarMatch[1]) };
  }
  return { type: "flat", value: 0 };
}

// Parse deductible string to number
function parseDeductible(deductStr: string): number {
  if (!deductStr) return 0;
  const match = deductStr.match(/\$?\s*(\d+(?:,\d{3})*)/);
  if (match) return parseInt(match[1].replace(/,/g, ""), 10);
  return 0;
}

// Parse initial coverage limit string
function parseCoverageLimit(limitStr: string): number {
  if (!limitStr) return 5030; // 2026 standard ICL
  const match = limitStr.match(/\$?\s*(\d+(?:,\d{3})*)/);
  if (match) return parseInt(match[1].replace(/,/g, ""), 10);
  return 5030;
}

// ── Core calculation types ───────────────────────────────────────────────────────

export interface DrugInput {
  name: string;
  dosage: string;
}

export interface PlanRxStructure {
  tier1: string;  // e.g. "$0 copay"
  tier2: string;  // e.g. "$10 copay"
  tier3: string;  // e.g. "$42"
  tier4: string;  // e.g. "25%" or "$100 copay"
  deductible: string;
  gap: boolean;
  initialCoverageLimit?: string;
}

export interface DrugCostBreakdown {
  drugName: string;
  tier: number;
  monthlyRetailCost: number;
  monthlyCopay: number;
  annualCost: number;
}

export interface FormularyResult {
  estimatedAnnualDrugCost: number;  // Total member pays for drugs per year
  drugBreakdowns: DrugCostBreakdown[];
  deductibleApplied: number;
  reachesGap: boolean;
  gapCost: number;  // Additional cost in donut hole
  totalRetailCost: number;  // Total retail value of all drugs
}

// ── 2026 Medicare Part D standard parameters ─────────────────────────────────
const STANDARD_ICL_2026 = 5030;   // Initial Coverage Limit
const CATASTROPHIC_THRESHOLD_2026 = 8000; // TrOOP threshold
const GAP_MEMBER_SHARE = 0.25;    // 25% in donut hole
const CATASTROPHIC_MEMBER_SHARE = 0.05;  // ~5% in catastrophic

/**
 * Calculate estimated annual drug cost for a member against a plan's
 * formulary tier structure.
 *
 * Implements the standard Medicare Part D cost-sharing phases:
 * 1. Deductible → member pays 100% of retail until deductible met
 * 2. Initial Coverage → member pays tier copay
 * 3. Coverage Gap → member pays 25% (unless plan has gap coverage)
 * 4. Catastrophic → member pays ~5%
 */
export function calculateDrugCosts(
  drugs: DrugInput[],
  planRx: PlanRxStructure
): FormularyResult {
  if (!drugs || drugs.length === 0) {
    return {
      estimatedAnnualDrugCost: 0,
      drugBreakdowns: [],
      deductibleApplied: 0,
      reachesGap: false,
      gapCost: 0,
      totalRetailCost: 0,
    };
  }

  const drugDeductible = parseDeductible(planRx.deductible);
  const icl = parseCoverageLimit(planRx.initialCoverageLimit ?? "");
  const hasGapCoverage = planRx.gap;

  // Parse tier copays
  const tierCopays = {
    1: parseCopayAmount(planRx.tier1),
    2: parseCopayAmount(planRx.tier2),
    3: parseCopayAmount(planRx.tier3),
    4: parseCopayAmount(planRx.tier4),
  };

  // Classify each drug and calculate monthly costs
  const drugProfiles = drugs.map(drug => {
    const key = drug.name.toLowerCase().trim();
    const profile = DRUG_DATABASE[key] || classifyUnknownDrug(drug.name, drug.dosage);
    return { drug, profile };
  });

  // Calculate annual spending through Part D phases
  let totalRetailAnnual = 0;
  let runningTotalDrugSpend = 0; // Tracks total drug spend for phase transitions
  let memberCostTotal = 0;
  let deductibleRemaining = drugDeductible;
  let gapCost = 0;

  const breakdowns: DrugCostBreakdown[] = [];

  // For each month, process all drugs
  for (let month = 0; month < 12; month++) {
    for (const { drug, profile } of drugProfiles) {
      const retailCost = profile.avgMonthlyCost;
      totalRetailAnnual += retailCost;
      let memberPays = 0;

      // Phase 1: Deductible (Tier 1 generics often exempt from deductible)
      if (deductibleRemaining > 0 && profile.tier > 1) {
        const deductiblePortion = Math.min(retailCost, deductibleRemaining);
        memberPays += deductiblePortion;
        deductibleRemaining -= deductiblePortion;
        runningTotalDrugSpend += retailCost;
      }
      // Phase 2: Initial Coverage
      else if (runningTotalDrugSpend < icl) {
        const copay = tierCopays[profile.tier as 1 | 2 | 3 | 4];
        if (copay.type === "flat") {
          memberPays += copay.value;
        } else {
          memberPays += retailCost * (copay.value / 100);
        }
        runningTotalDrugSpend += retailCost;
      }
      // Phase 3: Coverage Gap (Donut Hole)
      else if (runningTotalDrugSpend < CATASTROPHIC_THRESHOLD_2026) {
        if (hasGapCoverage) {
          // Plan covers gap — member still pays tier copay
          const copay = tierCopays[profile.tier as 1 | 2 | 3 | 4];
          if (copay.type === "flat") {
            memberPays += copay.value;
          } else {
            memberPays += retailCost * (copay.value / 100);
          }
        } else {
          // Standard gap — member pays 25%
          memberPays += retailCost * GAP_MEMBER_SHARE;
          gapCost += retailCost * GAP_MEMBER_SHARE;
        }
        runningTotalDrugSpend += retailCost;
      }
      // Phase 4: Catastrophic
      else {
        memberPays += retailCost * CATASTROPHIC_MEMBER_SHARE;
        runningTotalDrugSpend += retailCost;
      }

      memberCostTotal += memberPays;

      // Only add breakdown entry once (first month)
      if (month === 0) {
        const copay = tierCopays[profile.tier as 1 | 2 | 3 | 4];
        const monthlyCopay = copay.type === "flat" ? copay.value : retailCost * (copay.value / 100);
        breakdowns.push({
          drugName: drug.name,
          tier: profile.tier,
          monthlyRetailCost: retailCost,
          monthlyCopay: Math.round(monthlyCopay * 100) / 100,
          annualCost: 0, // Will be updated after full calculation
        });
      }
    }
  }

  // Distribute total member cost proportionally across drugs for breakdown
  const totalMonthlyCopays = breakdowns.reduce((s, b) => s + b.monthlyCopay, 0);
  for (const b of breakdowns) {
    if (totalMonthlyCopays > 0) {
      b.annualCost = Math.round((b.monthlyCopay / totalMonthlyCopays) * memberCostTotal);
    } else {
      b.annualCost = 0;
    }
  }

  return {
    estimatedAnnualDrugCost: Math.round(memberCostTotal),
    drugBreakdowns: breakdowns,
    deductibleApplied: drugDeductible - deductibleRemaining,
    reachesGap: runningTotalDrugSpend >= icl,
    gapCost: Math.round(gapCost),
    totalRetailCost: Math.round(totalRetailAnnual),
  };
}

/**
 * Enrich an array of plans with estimated drug costs for a given drug list.
 * Returns plans sorted by total estimated cost (premium + drug cost).
 */
export function enrichPlansWithDrugCosts(
  plans: any[],
  drugs: DrugInput[]
): any[] {
  if (!drugs || drugs.length === 0) return plans;

  return plans.map(plan => {
    const rxStructure: PlanRxStructure = {
      tier1: plan.rxDrugs?.tier1 ?? "$0",
      tier2: plan.rxDrugs?.tier2 ?? "$10",
      tier3: plan.rxDrugs?.tier3 ?? "$42",
      tier4: plan.rxDrugs?.tier4 ?? "25%",
      deductible: plan.rxDrugs?.deductible ?? "$0",
      gap: plan.rxDrugs?.gap ?? false,
      initialCoverageLimit: plan.rxDrugs?.initialCoverageLimit ?? "",
    };

    const result = calculateDrugCosts(drugs, rxStructure);
    const annualPremium = (plan.premium ?? 0) * 12;
    const estimatedTotalAnnualCost = annualPremium + result.estimatedAnnualDrugCost;

    return {
      ...plan,
      formularyDrugCost: result,
      estimatedAnnualDrugCost: result.estimatedAnnualDrugCost,
      estimatedTotalAnnualCost,
    };
  });
}
