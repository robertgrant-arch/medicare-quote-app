// Medicare Advantage Plan Quote Engine — Type Definitions
// Design: Bold Civic Design | Primary: #006B3F | CTA: #F47920

export type PlanType = "HMO" | "PPO" | "PFFS" | "SNP";

export type Carrier =
  | "UnitedHealthcare"
  | "Humana"
  | "Aetna"
  | "Cigna"
  | "WellCare"
  | "Blue KC";

export interface StarRating {
  overall: number; // 1-5, supports .5 increments
  label: string;
}

export interface CopayInfo {
  primaryCare: string;
  specialist: string;
  urgentCare: string;
  emergency: string;
  inpatientHospital: string;
  outpatientSurgery: string;
}

export interface RxDrugCoverage {
  tier1: string; // Generic
  tier2: string; // Preferred Brand
  tier3: string; // Non-Preferred Brand
  tier4: string; // Specialty
  deductible: string;
  gap: boolean; // Has gap coverage
  initialCoverageLimit: string;
}

export interface BenefitDetail {
  covered: boolean;
  details: string;
  annualLimit?: string;
}

export interface ExtraBenefits {
  dental: BenefitDetail;
  vision: BenefitDetail;
  hearing: BenefitDetail;
  otc: BenefitDetail; // Over-the-counter
  fitness: BenefitDetail;
  transportation: BenefitDetail;
  telehealth: BenefitDetail;
  meals: BenefitDetail;
}

export interface MedicarePlan {
  id: string;
  carrier: Carrier;
  planName: string;
  planType: PlanType;
  contractId: string;
  planId: string;
  starRating: StarRating;
  premium: number; // Monthly premium in dollars
  partBPremiumReduction: number; // Monthly Part B premium reduction
  deductible: number; // Annual medical deductible
  maxOutOfPocket: number; // Annual MOOP
  copays: CopayInfo;
  rxDrugs: RxDrugCoverage;
  extraBenefits: ExtraBenefits;
  networkSize: number; // Number of in-network providers
  isBestMatch?: boolean;
  isMostPopular?: boolean;
  isNewPlan?: boolean;
  enrollmentPeriod: string;
  effectiveDate: string;
  serviceArea: string;
  snpType?: string; // For SNP plans
  carrierLogoColor: string; // Brand color for carrier
  carrierLogoTextColor: string;
}

export interface FilterState {
  planType: PlanType[];
  carriers: Carrier[];
  premiumRange: [number, number];
  benefits: string[];
  quickFilter: "all" | "ppo" | "zero-premium" | "hmo";
  sortBy: "best-match" | "premium-low" | "premium-high" | "star-rating" | "moop-low";
}

export interface SavedPlan {
  planId: string;
  savedAt: string;
}

export interface RxDrug {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  isGeneric: boolean;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  npi: string;
  address: string;
}
