// AI Plan Recommendation Engine
// Research Sources:
//   J.D. Power 2024 U.S. Medicare Advantage Study
//   Commonwealth Fund 2024 Value of Medicare Survey (n=3,280)
//   NIH/PMC Qualitative Study PMC10391224
//   Better Medicare Alliance 2025 State of MA Report
//   McKinsey Future of Medicare Advantage 2024
//   MedPAC June 2025 Supplemental Benefits in MA

import type { MedicarePlan, Doctor } from '@/lib/types';

export interface ScoringWeights {
  doctorMatch: number;
  drugCost: number;
  premium: number;
  moop: number;
  starRating: number;
  extraBenefits: number;
  copayBurden: number;
  drugDeductible: number;
}

export interface ExtraBenefitWeights {
  dental: number;
  vision: number;
  hearing: number;
  otc: number;
  fitness: number;
  transportation: number;
  telehealth: number;
  meals: number;
}

export interface ScoringModel {
  id: 'model_a' | 'model_b' | 'custom';
  name: string;
  description: string;
  weights: ScoringWeights;
  extraBenefitWeights: ExtraBenefitWeights;
  sources: string[];
}

export interface PlanScore {
  planId: string;
  score: number;
    totalScore: number;
  rank: number;
  isTopPick: boolean;
  reasons: string[];
    plan: MedicarePlan;
  breakdown: { factor: string; weight: number; contribution: number }[];
}

// MODEL A: Manual custom weights (no extra benefits factor)
export const MODEL_A: ScoringModel = {
  id: 'model_a',
  name: 'Manual Weights',
  description: 'Custom weights emphasizing drug cost. Extra benefits not weighted.',
  weights: {
    doctorMatch: 30,
    drugCost: 20,
    premium: 15,
    moop: 15,
    starRating: 10,
    extraBenefits: 0,
    copayBurden: 5,
    drugDeductible: 5,
  },
  extraBenefitWeights: {
    dental: 0.22, vision: 0.20, otc: 0.20, hearing: 0.08,
    fitness: 0.10, transportation: 0.08, telehealth: 0.06, meals: 0.06,
  },
  sources: ['Internal SelectQuote team weighting'],
};

// MODEL B: Research-backed weights derived from published studies
export const MODEL_B: ScoringModel = {
  id: 'model_b',
  name: 'Research-Backed',
  description: 'Derived from J.D. Power, Commonwealth Fund, NIH, MedPAC & McKinsey research on Medicare consumer preferences. Includes extra benefits.',
  weights: {
    doctorMatch: 25,
    drugCost: 20,
    premium: 12,
    moop: 13,
    starRating: 10,
    extraBenefits: 10,
    copayBurden: 5,
    drugDeductible: 5,
  },
  extraBenefitWeights: {
    // Sub-weights from Commonwealth Fund usage rates (dental 42%, vision 41%, OTC 46%)
    // + EyeMed/KFF switching data + NIH transportation code frequency
    dental: 0.22,
    vision: 0.20,
    otc: 0.20,
    hearing: 0.08,
    fitness: 0.10,
    transportation: 0.08,
    telehealth: 0.06,
    meals: 0.06,
  },
  sources: [
    'J.D. Power 2024 U.S. Medicare Advantage Study',
    'Commonwealth Fund 2024 Value of Medicare Survey (n=3,280)',
    'NIH/PMC Plan Selection Factors Study (PMC10391224)',
    'Better Medicare Alliance 2025 State of MA Report',
    'McKinsey Future of Medicare Advantage 2024',
    'MedPAC June 2025 Supplemental Benefits Report',
    'EyeMed 2025 MA Vision Whitepaper',
  ],
};

export const STORAGE_KEY = 'mqe_ai_model';

export function getActiveModel(): ScoringModel {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'model_a') return MODEL_A;
    if (stored === 'model_b') return MODEL_B;
  } catch {}
  return MODEL_B; // default
}

export function setActiveModel(modelId: 'model_a' | 'model_b'): void {
  try {
    localStorage.setItem(STORAGE_KEY, modelId);
  } catch {}
}

function parseCopay(str: string): number {
  if (!str) return 0;
  const n = parseFloat(str.replace(/[^0-9.]/g, ''));
  return isNaN(n) ? 0 : n;
}

function parseDrugDeductible(str: string): number {
  if (!str) return 0;
  const n = parseFloat(str.replace(/[^0-9.]/g, ''));
  return isNaN(n) ? 0 : n;
}

function calcExtraBenefitsScore(
  plan: MedicarePlan,
  weights: ExtraBenefitWeights
): number {
  let score = 0;
  const eb = plan.extraBenefits || {};
  if (eb.dental?.covered) score += weights.dental;
  if (eb.vision?.covered) score += weights.vision;
  if (eb.otc?.covered) score += weights.otc;
  if (eb.hearing?.covered) score += weights.hearing;
  if (eb.fitness?.covered) score += weights.fitness;
  if (eb.transportation?.covered) score += weights.transportation;
  if (eb.telehealth?.covered) score += weights.telehealth;
  if (eb.meals?.covered) score += weights.meals;
  return score; // 0.0-1.0
}

function getEstAnnualDrugCost(plan: MedicarePlan): number {
  // Try to read the estimated annual drug cost from the plan
  // It may be stored as a custom field added by the API
  const p = plan as MedicarePlan & { estAnnualDrugCost?: number };
  return typeof p.estAnnualDrugCost === 'number' ? p.estAnnualDrugCost : 0;
}

export function scoreAllPlansInternal(
  plans: MedicarePlan[],
  model: ScoringModel,
  doctors: Doctor[]
): PlanScore[] {
  if (plans.length === 0) return [];

  const w = model.weights;
  const totalDoctors = doctors.length;

  // Pre-compute normalization max values
  const maxPremium = Math.max(...plans.map(p => p.premium * 12), 1);
  const maxDrugCost = Math.max(...plans.map(p => getEstAnnualDrugCost(p)), 1);
  const maxMOOP = Math.max(...plans.map(p => p.maxOutOfPocket), 1);
  const maxCopay = Math.max(
    ...plans.map(p => parseCopay(p.copays.primaryCare) * 4 + parseCopay(p.copays.specialist) * 2),
    1
  );
  const maxDrugDed = Math.max(
    ...plans.map(p => parseDrugDeductible(p.rxDrugs.deductible)),
    1
  );

  const avgTotalCost = plans.reduce(
    (s, p) => s + (p.premium * 12) + getEstAnnualDrugCost(p), 0
  ) / plans.length;

  const avgMOOP = plans.reduce((s, p) => s + p.maxOutOfPocket, 0) / plans.length;

  const results: PlanScore[] = plans.map(plan => {
    const p = plan as MedicarePlan & { estAnnualDrugCost?: number; doctorNetworkStatus?: { inNetworkCount: number } };

    // Doctor score
    let doctorRaw = 0.5; // neutral when no doctors
    if (totalDoctors > 0) {
      const inNet = p.doctorNetworkStatus?.inNetworkCount ?? 0;
      doctorRaw = inNet / totalDoctors;
    }

    const drugCost = getEstAnnualDrugCost(plan);
    const drugCostRaw = 1 - drugCost / maxDrugCost;
    const premiumRaw = 1 - (plan.premium * 12) / maxPremium;
    const moopRaw = 1 - plan.maxOutOfPocket / maxMOOP;
    const starRaw = Math.max(0, (plan.starRating.overall - 1) / 4);
    const extraRaw = w.extraBenefits > 0 ? calcExtraBenefitsScore(plan, model.extraBenefitWeights) : 0;
    const copay = parseCopay(plan.copays.primaryCare) * 4 + parseCopay(plan.copays.specialist) * 2;
    const copayRaw = 1 - copay / maxCopay;
    const drugDed = parseDrugDeductible(plan.rxDrugs.deductible);
    const drugDedRaw = 1 - drugDed / maxDrugDed;

    const score =
      doctorRaw * w.doctorMatch +
      drugCostRaw * w.drugCost +
      premiumRaw * w.premium +
      moopRaw * w.moop +
      starRaw * w.starRating +
      extraRaw * w.extraBenefits +
      copayRaw * w.copayBurden +
      drugDedRaw * w.drugDeductible;

    // Reasons
    const reasons: string[] = [];
    const inNet = totalDoctors > 0 ? (p.doctorNetworkStatus?.inNetworkCount ?? 0) : 0;
    if (totalDoctors > 0 && inNet === totalDoctors) {
      reasons.push(`Your doctor${totalDoctors > 1 ? 's are' : ' is'} in-network on this plan`);
    }
    const totalCost = plan.premium * 12 + drugCost;
    if (totalCost < avgTotalCost * 0.85) {
      const pct = Math.round((1 - totalCost / avgTotalCost) * 100);
      reasons.push(`Est. total cost $${totalCost.toLocaleString()}/yr — ${pct}% below average`);
    } else {
      reasons.push(`Est. total cost: $${totalCost.toLocaleString()}/yr (premium + drugs)`);
    }
    if (plan.maxOutOfPocket < avgMOOP * 0.75) {
      reasons.push(`Low max out-of-pocket ($${plan.maxOutOfPocket.toLocaleString()}) limits your risk`);
    }
    if (plan.starRating.overall >= 4.0) {
      reasons.push(`${plan.starRating.overall}-star CMS quality rating`);
    }
    const benefitCount = Object.values(plan.extraBenefits || {}).filter(b => b?.covered).length;
    if (benefitCount >= 7) {
      reasons.push(`${benefitCount}/8 extra benefits included (dental, vision, OTC & more)`);
    }

    const breakdown = [
      { factor: 'Doctor Network', weight: w.doctorMatch, contribution: doctorRaw * w.doctorMatch },
      { factor: 'Drug Cost', weight: w.drugCost, contribution: drugCostRaw * w.drugCost },
      { factor: 'Premium', weight: w.premium, contribution: premiumRaw * w.premium },
      { factor: 'Max Out-of-Pocket', weight: w.moop, contribution: moopRaw * w.moop },
      { factor: 'Star Rating', weight: w.starRating, contribution: starRaw * w.starRating },
      { factor: 'Extra Benefits', weight: w.extraBenefits, contribution: extraRaw * w.extraBenefits },
      { factor: 'Copay Burden', weight: w.copayBurden, contribution: copayRaw * w.copayBurden },
      { factor: 'Drug Deductible', weight: w.drugDeductible, contribution: drugDedRaw * w.drugDeductible },
    ];

    return {
      planId: plan.id,         plan,
      score: Math.round(score * 100) / 100, totalScore: Math.round(score * 100) / 100,
      rank: 0,
      isTopPick: false,
      reasons: reasons.slice(0, 4),
      breakdown,
    };
  });

  results.sort((a, b) => b.score - a.score);
  results.forEach((r, i) => {
    r.rank = i + 1;
    r.isTopPick = i === 0;
  });

  return results;
}

export function getTopPick(
  plans: MedicarePlan[],
  scores: PlanScore[]
): { plan: MedicarePlan; score: PlanScore } | null {
  // Only pick from non-SNP MA plans as the primary recommendation
  const nonSnpPlans = plans.filter(p => !p.snpCategory);
  if (nonSnpPlans.length === 0) return null;
  const nonSnpIds = new Set(nonSnpPlans.map(p => p.id));
  const topScore = scores.find(s => nonSnpIds.has(s.planId));
  if (!topScore) return null;
  const topPlan = plans.find(p => p.id === topScore.planId);
  if (!topPlan) return null;
  return { plan: topPlan, score: topScore };
}

// Type alias used by AdminAIModels
export type ScoringModelType = 'A' | 'B';

// Aliases expected by AdminAIModels component
export const MODEL_A_CONFIG = MODEL_A;
export const MODEL_B_CONFIG = MODEL_B;

// Public wrapper: supports both call signatures
// 1) scoreAllPlans(plans, model, doctors) - used by Plans.tsx
// 2) scoreAllPlans(plans, { rxDrugs, doctors }, 'A'|'B') - used by AdminAIModels
export function scoreAllPlans(
  plans: MedicarePlan[],
  modelOrOpts: ScoringModel | { rxDrugs?: any[]; doctors?: Doctor[] },
  doctorsOrModelType?: Doctor[] | ScoringModelType
): PlanScore[] {
  let model: ScoringModel;
  let doctors: Doctor[];
  if (typeof doctorsOrModelType === 'string') {
    model = doctorsOrModelType === 'A' ? MODEL_A : MODEL_B;
    const opts = modelOrOpts as { rxDrugs?: any[]; doctors?: Doctor[] };
    doctors = opts.doctors || [];
  } else if (Array.isArray(doctorsOrModelType)) {
    model = modelOrOpts as ScoringModel;
    doctors = doctorsOrModelType;
  } else {
    model = modelOrOpts as ScoringModel;
    doctors = [];
  }
  return scoreAllPlansInternal(plans, model, doctors);
}
