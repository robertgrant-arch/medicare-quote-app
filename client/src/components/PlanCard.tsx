// PlanCard component — Medicare Advantage plan display card
// Design: Bold Civic Design | Primary: #006B3F | CTA: #F47920

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
  Info,
} from "lucide-react";
import type { MedicarePlan } from "@/lib/types";
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
  onCompareActivate?: (planId: string | null) => void;
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
}: PlanCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [heartAnimating, setHeartAnimating] = useState(false);

  const handleFavorite = () => {
    setHeartAnimating(true);
    onToggleFavorite(plan.id);
    setTimeout(() => setHeartAnimating(false), 400);
  };

  const benefitKeys = Object.keys(BENEFIT_ICONS) as Array<keyof typeof BENEFIT_ICONS>;

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
                style={{ fontFamily: "'DM Serif Display', serif" }}
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
                        ? "#D1FAE5"
                        : plan.planType === "SNP"
                        ? "#FEF3C7"
                        : "#F3F4F6",
                    color:
                      plan.planType === "HMO"
                        ? "#1D4ED8"
                        : plan.planType === "PPO"
                        ? "#065F46"
                        : plan.planType === "SNP"
                        ? "#92400E"
                        : "#374151",
                  }}
                >
                  {plan.planType}
                </span>
                {plan.snpType && (
                  <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-medium">
                    {plan.snpType}
                  </span>
                )}
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
        <div className="grid grid-cols-3 gap-3 mb-4 p-3 rounded-xl" style={{ backgroundColor: "#F8FAF9" }}>
          <div className="text-center">
            <div
              className="text-2xl font-bold"
              style={{ color: plan.premium === 0 ? "#006B3F" : "#1F2937", fontFamily: "'DM Serif Display', serif" }}
            >
              {plan.premium === 0 ? "$0" : `$${plan.premium}`}
            </div>
            <div className="text-[10px] text-gray-500 font-medium">/month premium</div>
            {plan.partBPremiumReduction > 0 && (
              <div className="text-[10px] font-semibold mt-0.5" style={{ color: "#006B3F" }}>
                +${plan.partBPremiumReduction} Part B reduction
              </div>
            )}
          </div>
          <div className="text-center border-x border-gray-200">
            <div className="text-lg font-bold text-gray-800" style={{ fontFamily: "'DM Serif Display', serif" }}>
              ${plan.deductible === 0 ? "0" : plan.deductible.toLocaleString()}
            </div>
            <div className="text-[10px] text-gray-500 font-medium">deductible</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-800" style={{ fontFamily: "'DM Serif Display', serif" }}>
              ${plan.maxOutOfPocket.toLocaleString()}
            </div>
            <div className="text-[10px] text-gray-500 font-medium">max out-of-pocket</div>
          </div>
        </div>

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
                style={{ color: item.value.startsWith("$0") ? "#006B3F" : "#374151" }}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>

        {/* ── Rx Drug Coverage ──────────────────────────────────────────── */}
        <div className="mb-4 p-3 rounded-xl border border-gray-100">
          <div className="flex items-center gap-1.5 mb-2">
            <Pill size={13} style={{ color: "#006B3F" }} />
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Rx Drug Coverage</span>
            {plan.rxDrugs.gap && (
              <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-semibold ml-auto">
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
                  style={{ color: t.value === "$0 copay" ? "#006B3F" : "#374151" }}
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
                <Building2 size={13} style={{ color: "#006B3F" }} />
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
                    style={{ backgroundColor: "#F8FAF9" }}
                  >
                    <span className="text-xs text-gray-600">{item.label}</span>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: item.value.startsWith("$0") ? "#006B3F" : "#374151" }}
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
                <Info size={13} style={{ color: "#006B3F" }} />
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
                      style={{ backgroundColor: "#F8FAF9" }}
                    >
                      <div className="flex items-center gap-1.5 min-w-[80px]">
                        {benefit.covered ? (
                          <CheckCircle2 size={12} style={{ color: "#006B3F" }} />
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
                          style={{ color: "#006B3F" }}
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
            style={{ backgroundColor: "#F47920" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#D4650F";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#F47920";
            }}
          >
            Enroll Now
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 px-3 py-2.5 rounded-lg text-sm font-semibold border transition-all"
            style={{
              borderColor: "#E5E7EB",
              color: "#006B3F",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#006B3F";
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#E8F5EE";
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
