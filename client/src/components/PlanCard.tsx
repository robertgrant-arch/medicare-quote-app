// PlanCard component — Medicare Advantage plan display card
// Design: Chapter-style | Navy #1B365D | Red #C41E3A | Light Blue #E8F0FE

import { useState } from "react";
import {
  Heart,
  ChevronDown,
  ChevronUp,
  Stethoscope,
  Eye,
  Ear,
  ShoppingBag,
  Dumbbell,
  Car,
  Video,
  UtensilsCrossed,
  Pill,
  Building2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Info,   UserRound,
} from "lucide-react";
import type { MedicarePlan, PlanDoctorNetworkStatus, RxDrug } from "@/lib/types";
import StarRating from "./StarRating";
import CarrierLogo from "./CarrierLogo";
import InlineCompare from "./InlineCompare";

interface PlanCardProps {
  plan: MedicarePlan;
  isFavorited: boolean;
  onToggleFavorite: (id: string) => void;
  onEnroll: (plan: MedicarePlan) => void;
  animationDelay?: number;
  isCompareActive?: boolean;
  onCompareActivate?: (planId: string | null) => void;   doctorNetworkStatus?: PlanDoctorNetworkStatus;   rxDrugs?: RxDrug[];   subsidyLevel?: "full" | "partial" | "none";
}

const BENEFIT_ICONS = {
  dental: Stethoscope,
  vision: Eye,
  hearing: Ear,
  otc: ShoppingBag,
  fitness: Dumbbell,
  transportation: Car,
  telehealth: Video,
  meals: UtensilsCrossed,
};

const BENEFIT_LABELS: Record<string, string> = {
  dental: "Dental",
  vision: "Vision",
  hearing: "Hearing",
  otc: "OTC",
  fitness: "Fitness",
  transportation: "Transport",
  telehealth: "Telehealth",
  meals: "Meals",
};

export default function PlanCard({
  plan,
  isFavorited,
  onToggleFavorite,
  onEnroll,
  animationDelay = 0,
  isCompareActive = false,
  onCompareActivate,
    doctorNetworkStatus,   rxDrugs = [],   subsidyLevel = "none",
}: PlanCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [heartAnimating, setHeartAnimating] = useState(false);

  const handleFavorite = () => {
    setHeartAnimating(true);
    onToggleFavorite(plan.id);
    setTimeout(() => setHeartAnimating(false), 400);
  };

  // Estimate annual drug cost   const estimatedDrugCost = (() => {     if (!rxDrugs || rxDrugs.length === 0) return null;     // Parse tier costs from strings like "$0 copay", "$10", "25%"     const parseCost = (s: string): { type: 'flat' | 'pct'; val: number } => {       const pct = s.match(/(\d+)%/);       if (pct) return { type: 'pct', val: parseInt(pct[1]) / 100 };       const flat = s.match(/\$(\d+)/);       return { type: 'flat', val: flat ? parseInt(flat[1]) : 0 };     };     const tier1 = parseCost(plan.rxDrugs.tier1);     const tier2 = parseCost(plan.rxDrugs.tier2);     const tier3 = parseCost(plan.rxDrugs.tier3);     const tier4 = parseCost(plan.rxDrugs.tier4);     // Avg brand drug cost ~$200/mo, generic ~$20/mo, specialty ~$500/mo     const avgDrugCost = (tier: { type: 'flat' | 'pct'; val: number }, isGeneric: boolean) => {       const retail = isGeneric ? 20 : 200;       if (tier.type === 'flat') return tier.val;       return Math.round(tier.val * retail);     };     let annualCost = 0;     const drugDeductible = parseInt((plan.rxDrugs.deductible || '$0').replace(/[^\d]/g, '')) || 0;     // Subsidy reduces costs     const subsidyMult = subsidyLevel === 'full' ? 0.05 : subsidyLevel === 'partial' ? 0.35 : 1.0;     for (const drug of rxDrugs) {       const isGeneric = drug.isGeneric;       // Assign tier: generic=tier1, brand=tier2       const tierCost = isGeneric ? avgDrugCost(tier1, true) : avgDrugCost(tier2, false);       const monthlyAfterSubsidy = Math.round(tierCost * subsidyMult);       annualCost += monthlyAfterSubsidy * 12;     }     // Add drug deductible once (prorated if multiple drugs)     annualCost += Math.round(drugDeductible * subsidyMult);     // Donut hole: applies when total drug spend hits ICL (~$5,030)     // After ICL, beneficiary pays 25% coinsurance until catastrophic     const icl = plan.rxDrugs.gap ? 0 : 5030; // gap coverage eliminates donut hole     const hasGap = plan.rxDrugs.gap;     if (!hasGap && annualCost > icl) {       const donutHolePortion = annualCost - icl;       // In donut hole: 25% of drug costs (was 100%, now capped at 25%)       const donutHoleExtra = Math.round(donutHolePortion * 0.25);       annualCost = icl + donutHoleExtra;     }     return annualCost;   })();   const benefitKeys = Object.keys(BENEFIT_ICONS) as Array<keyof typeof BENEFIT_ICONS>;

  return (
    <div
      className="plan-card animate-fade-in-up"
      style={{ animationDelay: `${animationDelay}ms`, animationFillMode: "both" }}
    >
      {/* Badge */}
      {plan.isBestMatch && <div className="badge-best-match">Best Match</div>}
      {!plan.isBestMatch && plan.isMostPopular && <div className="badge-popular">Most Popular</div>}
      {!plan.isBestMatch && !plan.isMostPopular && plan.isNewPlan && (
        <div className="badge-new">New Plan</div>
      )}
      {plan.isNonCommissionable && (
        <div
          className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full border"
          style={{ backgroundColor: "#FEF9C3", color: "#92400E", borderColor: "#FDE68A" }}
          title="This plan is not commissionable. We present it for your comparison but cannot earn a commission if you enroll."
        >
          Non-Commissionable
        </div>
      )}

      <div className="p-5">
        {/* ── Card Header ───────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <CarrierLogo carrier={plan.carrier} size="md" />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                {plan.carrier}
              </div>
              <h3
                className="text-base font-bold text-gray-900 leading-snug"
                style={{ color: "#1B365D", fontFamily: "'Inter', sans-serif", fontWeight: 700 }}
              >
                {plan.planName}
              </h3>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded"
                  style={{
                    backgroundColor:
                      plan.planType === "HMO"
                        ? "#DBEAFE"
                        : plan.planType === "PPO"
                        ? "#E8F0FE"
                        : plan.planType === "SNP"
                        ? "#FEF3C7"
                        : "#F3F4F6",
                    color:
                      plan.planType === "HMO"
                        ? "#1B365D"
                        : plan.planType === "PPO"
                        ? "#1B365D"
                        : plan.planType === "SNP"
                        ? "#92400E"
                        : "#374151",
                  }}
                >
                  {plan.planType}
                </span>
                {plan.snpType && (() => {
                  const st = plan.snpType ?? "";
                  const isDual = st.toLowerCase().includes("dual") || plan.planName?.includes("D-SNP");
                  const isChronic = st.toLowerCase().includes("chronic") || st.toLowerCase().includes("disabling") || plan.planName?.includes("C-SNP");
                  const isInstitutional = st.toLowerCase().includes("institutional") || plan.planName?.includes("I-SNP");
                  if (isDual) return (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded border" style={{ backgroundColor: "#EDE9FE", color: "#5B21B6", borderColor: "#C4B5FD" }}>
                      Dual Eligible (D-SNP)
                    </span>
                  );
                  if (isChronic) return (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded border" style={{ backgroundColor: "#FEF3C7", color: "#92400E", borderColor: "#FCD34D" }}>
                      Chronic Condition (C-SNP)
                    </span>
                  );
                  if (isInstitutional) return (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded border" style={{ backgroundColor: "#F0FDF4", color: "#166534", borderColor: "#86EFAC" }}>
                      Institutional (I-SNP)
                    </span>
                  );
                  return (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded border" style={{ backgroundColor: "#FEF3C7", color: "#92400E", borderColor: "#FCD34D" }}>
                      {plan.snpType}
                    </span>
                  );
                })()}
                <StarRating rating={plan.starRating.overall} size={12} />
              </div>
            </div>
          </div>

          {/* Favorite button */}
          <button
            onClick={handleFavorite}
            className="p-2 rounded-full hover:bg-red-50 transition-all flex-shrink-0"
            title={isFavorited ? "Remove from saved" : "Save plan"}
            style={{
              transform: heartAnimating ? "scale(1.4)" : "scale(1)",
              transition: "transform 0.2s ease",
            }}
          >
            <Heart
              size={20}
              className={isFavorited ? "fill-red-500 text-red-500" : "text-gray-300 hover:text-red-400"}
            />
          </button>
        </div>

        {/* ── Pricing Row ───────────────────────────────────────────────── */}
        <div className={`grid ${estimatedDrugCost !== null ? 'grid-cols-4' : 'grid-cols-3'} gap-3 mb-4 p-3 rounded-xl`} style={{ backgroundColor: "#F7F8FA" }}>
          <div className="text-center">
            <div
              className="text-2xl font-bold"
              style={{ color: plan.premium === 0 ? "#C41E3A" : "#1B365D", fontFamily: "'Inter', sans-serif", fontWeight: 800 }}
            >
              {plan.premium === 0 ? "$0" : `$${plan.premium}`}
            </div>
            <div className="text-[10px] text-gray-500 font-medium">/month premium</div>
            {plan.partBPremiumReduction > 0 && (
              <div className="text-[10px] font-semibold mt-0.5" style={{ color: "#1B365D" }}>
                +${plan.partBPremiumReduction} Part B reduction
              </div>
            )}
          </div>
          <div className="text-center border-x border-gray-200">
            <div className="text-lg font-bold" style={{ color: "#1B365D", fontFamily: "'Inter', sans-serif" }}>
              ${plan.deductible === 0 ? "0" : plan.deductible.toLocaleString()}
            </div>
            <div className="text-[10px] text-gray-500 font-medium">deductible</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold" style={{ color: "#1B365D", fontFamily: "'Inter', sans-serif" }}>
              ${plan.maxOutOfPocket.toLocaleString()}
            </div>
            <div className="text-[10px] text-gray-500 font-medium">max out-of-pocket</div>
          </div>
        </div>

                  {/* — Doctor Network Status ——————————————————— */}
          {doctorNetworkStatus && doctorNetworkStatus.doctors.length > 0 && (
            <div className="mt-3 mb-1 px-3 py-2 rounded-lg" style={{ backgroundColor: '#F0F7FF', border: '1px solid #D0E2F7' }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <UserRound size={14} className="text-[#1B365D]" />
                <span className="text-xs font-semibold text-[#1B365D]">Your Doctors</span>
              </div>
              <div className="space-y-1">
                {doctorNetworkStatus.doctors.map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-gray-700">{doc.doctorName}</span>
                    <span className={`font-semibold flex items-center gap-1 ${doc.inNetwork ? 'text-green-600' : 'text-red-500'}`}>
                      {doc.inNetwork ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {doc.inNetwork ? 'In Network' : 'Out of Network'}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-1.5 pt-1.5 border-t border-blue-200 flex items-center justify-between text-xs">
                <span className="font-medium text-[#1B365D]">Network Match</span>
                <span className={`font-bold ${doctorNetworkStatus.allInNetwork ? 'text-green-600' : doctorNetworkStatus.inNetworkCount > 0 ? 'text-yellow-600' : 'text-red-500'}`}>
                  {doctorNetworkStatus.inNetworkCount}/{doctorNetworkStatus.doctors.length} In Network
                </span>
              </div>
            </div>
          )}

        {/* ── Key Copays ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { label: "Primary Care", value: plan.copays.primaryCare },
            { label: "Specialist", value: plan.copays.specialist },
            { label: "Urgent Care", value: plan.copays.urgentCare },
            { label: "Emergency", value: plan.copays.emergency },
          ].map((item) => (
            <div key={item.label} className="flex justify-between items-center py-1.5 border-b border-gray-100">
              <span className="text-xs text-gray-500">{item.label}</span>
              <span
                className="text-xs font-semibold"
                style={{ color: item.value.startsWith("$0") ? "#1B365D" : "#374151" }}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>

        {/* ── Rx Drug Coverage ──────────────────────────────────────────── */}
        <div className="mb-4 p-3 rounded-xl border border-gray-100">
          <div className="flex items-center gap-1.5 mb-2">
            <Pill size={13} style={{ color: "#1B365D" }} />
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Rx Drug Coverage</span>
            {plan.rxDrugs.gap && (
              <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold ml-auto" style={{ backgroundColor: "#E8F0FE", color: "#1B365D" }}>
                Gap Coverage
              </span>
            )}
          </div>
          <div className="grid grid-cols-4 gap-1">
            {[
              { tier: "Tier 1", label: "Generic", value: plan.rxDrugs.tier1 },
              { tier: "Tier 2", label: "Pref Brand", value: plan.rxDrugs.tier2 },
              { tier: "Tier 3", label: "Non-Pref", value: plan.rxDrugs.tier3 },
              { tier: "Tier 4", label: "Specialty", value: plan.rxDrugs.tier4 },
            ].map((t) => (
              <div key={t.tier} className="text-center">
                <div className="text-[10px] text-gray-400 font-medium">{t.tier}</div>
                <div
                  className="text-xs font-bold mt-0.5"
                  style={{ color: t.value === "$0 copay" ? "#1B365D" : "#374151" }}
                >
                  {t.value.replace(" copay", "")}
                </div>
                <div className="text-[9px] text-gray-400">{t.label}</div>
              </div>
            ))}
          </div>
          {plan.rxDrugs.deductible !== "$0" && (
            <div className="text-[10px] text-amber-600 mt-1.5 flex items-center gap-1">
              <AlertCircle size={10} />
              Drug deductible: {plan.rxDrugs.deductible}
            </div>
          )}
        </div>

        {/* ── Extra Benefits Chips ──────────────────────────────────────── */}
        <div className="mb-4">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">
            Extra Benefits
          </div>
          <div className="flex flex-wrap gap-1.5">
            {benefitKeys.map((key) => {
              const benefit = plan.extraBenefits[key];
              const Icon = BENEFIT_ICONS[key];
              return (
                <span
                  key={key}
                  className={`benefit-chip ${benefit.covered ? "benefit-chip-green" : "benefit-chip-gray"}`}
                  title={benefit.details}
                >
                  <Icon size={10} />
                  {BENEFIT_LABELS[key]}
                </span>
              );
            })}
          </div>
        </div>

        {/* ── Expandable Details ────────────────────────────────────────── */}
        {expanded && (
          <div className="animate-slide-down border-t border-gray-100 pt-4 mb-4 space-y-4">
            {/* All Copays */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Building2 size={13} style={{ color: "#1B365D" }} />
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                  All Copays & Cost-Sharing
                </span>
              </div>
              <div className="space-y-1.5">
                {[
                  { label: "Primary Care Visit", value: plan.copays.primaryCare },
                  { label: "Specialist Visit", value: plan.copays.specialist },
                  { label: "Urgent Care", value: plan.copays.urgentCare },
                  { label: "Emergency Room", value: plan.copays.emergency },
                  { label: "Inpatient Hospital", value: plan.copays.inpatientHospital },
                  { label: "Outpatient Surgery", value: plan.copays.outpatientSurgery },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex justify-between items-center py-1.5 px-2 rounded-lg"
                    style={{ backgroundColor: "#F7F8FA" }}
                  >
                    <span className="text-xs text-gray-600">{item.label}</span>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: item.value.startsWith("$0") ? "#1B365D" : "#374151" }}
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Benefit Details */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                        <Info size={13} style={{ color: "#1B365D" }} />
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                  Benefit Details
                </span>
              </div>
              <div className="space-y-1.5">
                {benefitKeys.map((key) => {
                  const benefit = plan.extraBenefits[key];
                  const Icon = BENEFIT_ICONS[key];
                  return (
                    <div
                      key={key}
                      className="flex items-start gap-2 py-1.5 px-2 rounded-lg"
                      style={{ backgroundColor: "#F7F8FA" }}
                    >
                      <div className="flex items-center gap-1.5 min-w-[80px]">
                        {benefit.covered ? (
                          <CheckCircle2 size={12} style={{ color: "#1B365D" }} />
                        ) : (
                          <XCircle size={12} className="text-gray-300" />
                        )}
                        <span className="text-xs font-semibold text-gray-700">
                          {BENEFIT_LABELS[key]}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 flex-1">{benefit.details}</span>
                      {benefit.annualLimit && (
                        <span
                          className="text-xs font-semibold shrink-0"
                          style={{ color: "#1B365D" }}
                        >
                          {benefit.annualLimit}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Plan Info */}
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
              <div>
                <span className="font-semibold text-gray-700">Contract ID: </span>
                {plan.contractId}/{plan.planId}
              </div>
              <div>
                <span className="font-semibold text-gray-700">Network: </span>
                {plan.networkSize.toLocaleString()}+ providers
              </div>
              <div>
                <span className="font-semibold text-gray-700">Enrollment: </span>
                {plan.enrollmentPeriod}
              </div>
              <div>
                <span className="font-semibold text-gray-700">Effective: </span>
                {plan.effectiveDate}
              </div>
            </div>
          </div>
        )}

        {/* ── Inline Compare ────────────────────────────────────────────── */}
        {onCompareActivate && (
          <InlineCompare
            plan={plan}
            isActive={isCompareActive}
            onActivate={onCompareActivate}
          />
        )}

        {/* ── Card Footer ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
          <button
            onClick={() => onEnroll(plan)}
            className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white transition-all shadow-sm"
            style={{ backgroundColor: "#C41E3A" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#A01830";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#C41E3A";
            }}
          >
            Enroll Now
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 px-3 py-2.5 rounded-lg text-sm font-semibold border transition-all"
            style={{
              borderColor: "#E5E7EB",
              color: "#1B365D",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#1B365D";
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#E8F0FE";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#E5E7EB";
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
            }}
          >
            {expanded ? (
              <>
                Less <ChevronUp size={14} />
              </>
            ) : (
              <>
                Details <ChevronDown size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
