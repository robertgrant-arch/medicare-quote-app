/**
 * AI Plan Compare Page
 * Design: Bold Civic Design | Primary: #006B3F | CTA: #F47920
 * Allows users to select two Medicare Advantage plans and get a
 * Claude-powered AI analysis comparing them in detail.
 */

import { useState, useMemo } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  Sparkles,
  ChevronDown,
  AlertCircle,
  RotateCcw,
  Star,
  TrendingDown,
  TrendingUp,
  Minus,
  CheckCircle2,
  XCircle,
  Info,
} from "lucide-react";
import { Streamdown } from "streamdown";
import Header from "@/components/Header";
import CarrierLogo from "@/components/CarrierLogo";
import StarRating from "@/components/StarRating";
import { MOCK_PLANS } from "@/lib/mockData";
import { trpc } from "@/lib/trpc";
import type { MedicarePlan } from "@/lib/types";

// ── Plan Selector Dropdown ────────────────────────────────────────────────────

interface PlanSelectorProps {
  label: string;
  sublabel: string;
  value: string;
  onChange: (id: string) => void;
  excludeId?: string;
  accentColor: string;
}

function PlanSelector({ label, sublabel, value, onChange, excludeId, accentColor }: PlanSelectorProps) {
  const [open, setOpen] = useState(false);
  const selectedPlan = MOCK_PLANS.find((p) => p.id === value);

  const grouped = useMemo(() => {
    const carriers = Array.from(new Set(MOCK_PLANS.map((p) => p.carrier)));
    return carriers.map((carrier) => ({
      carrier,
      plans: MOCK_PLANS.filter((p) => p.carrier === carrier && p.id !== excludeId),
    }));
  }, [excludeId]);

  return (
    <div className="relative">
      <div className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: accentColor }}>
        {label}
      </div>
      <div className="text-xs text-gray-500 mb-2">{sublabel}</div>

      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left border-2 rounded-xl p-4 transition-all bg-white"
        style={{
          borderColor: open ? accentColor : "#E5E7EB",
          boxShadow: open ? `0 0 0 3px ${accentColor}20` : "none",
        }}
      >
        {selectedPlan ? (
          <div className="flex items-center gap-3">
            <CarrierLogo carrier={selectedPlan.carrier} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-gray-900 truncate">{selectedPlan.planName}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: selectedPlan.planType === "HMO" ? "#DBEAFE" : "#D1FAE5",
                    color: selectedPlan.planType === "HMO" ? "#1D4ED8" : "#065F46",
                  }}
                >
                  {selectedPlan.planType}
                </span>
                <span className="text-xs text-gray-500">
                  {selectedPlan.premium === 0 ? "$0/mo" : `$${selectedPlan.premium}/mo`}
                </span>
                <span className="text-xs text-gray-400">·</span>
                <span className="text-xs text-gray-500">{selectedPlan.starRating.overall}★</span>
              </div>
            </div>
            <ChevronDown
              size={16}
              className="text-gray-400 shrink-0 transition-transform"
              style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
            />
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Select a plan...</span>
            <ChevronDown size={16} className="text-gray-400" />
          </div>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto">
          {grouped.map(({ carrier, plans }) =>
            plans.length === 0 ? null : (
              <div key={carrier}>
                <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-50 border-b border-gray-100">
                  {carrier}
                </div>
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => {
                      onChange(plan.id);
                      setOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                    style={{
                      backgroundColor: plan.id === value ? "#E8F5EE" : undefined,
                    }}
                  >
                    <div className="text-sm font-semibold text-gray-800 leading-snug">{plan.planName}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: plan.planType === "HMO" ? "#DBEAFE" : "#D1FAE5",
                          color: plan.planType === "HMO" ? "#1D4ED8" : "#065F46",
                        }}
                      >
                        {plan.planType}
                      </span>
                      <span className="text-xs text-gray-500">
                        {plan.premium === 0 ? "$0/mo" : `$${plan.premium}/mo`}
                      </span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-500">{plan.starRating.overall}★</span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-500">MOOP: ${plan.maxOutOfPocket.toLocaleString()}</span>
                    </div>
                  </button>
                ))}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

// ── Side-by-Side Summary Table ────────────────────────────────────────────────

interface CompareTableProps {
  current: MedicarePlan;
  newPlan: MedicarePlan;
}

function DiffIndicator({ a, b, lowerIsBetter = true }: { a: number; b: number; lowerIsBetter?: boolean }) {
  if (a === b) return <Minus size={12} className="text-gray-400 inline ml-1" />;
  const better = lowerIsBetter ? b < a : b > a;
  return better ? (
    <TrendingDown size={12} className="text-green-600 inline ml-1" />
  ) : (
    <TrendingUp size={12} className="text-red-500 inline ml-1" />
  );
}

function BenefitCompare({ current, newVal }: { current: boolean; newVal: boolean }) {
  if (current === newVal) return null;
  if (!current && newVal) return <span className="text-[10px] font-bold text-green-600 ml-1">+GAINED</span>;
  if (current && !newVal) return <span className="text-[10px] font-bold text-red-500 ml-1">-LOST</span>;
  return null;
}

function CompareTable({ current, newPlan }: CompareTableProps) {
  const rows = [
    {
      label: "Monthly Premium",
      current: current.premium === 0 ? "$0" : `$${current.premium}`,
      newVal: newPlan.premium === 0 ? "$0" : `$${newPlan.premium}`,
      diff: <DiffIndicator a={current.premium} b={newPlan.premium} lowerIsBetter />,
    },
    {
      label: "Part B Reduction",
      current: current.partBPremiumReduction > 0 ? `+$${current.partBPremiumReduction}/mo` : "None",
      newVal: newPlan.partBPremiumReduction > 0 ? `+$${newPlan.partBPremiumReduction}/mo` : "None",
      diff: <DiffIndicator a={current.partBPremiumReduction} b={newPlan.partBPremiumReduction} lowerIsBetter={false} />,
    },
    {
      label: "Max Out-of-Pocket",
      current: `$${current.maxOutOfPocket.toLocaleString()}`,
      newVal: `$${newPlan.maxOutOfPocket.toLocaleString()}`,
      diff: <DiffIndicator a={current.maxOutOfPocket} b={newPlan.maxOutOfPocket} lowerIsBetter />,
    },
    {
      label: "Annual Deductible",
      current: `$${current.deductible}`,
      newVal: `$${newPlan.deductible}`,
      diff: <DiffIndicator a={current.deductible} b={newPlan.deductible} lowerIsBetter />,
    },
    {
      label: "Plan Type",
      current: current.planType,
      newVal: newPlan.planType,
      diff: null,
    },
    {
      label: "CMS Star Rating",
      current: `${current.starRating.overall} / 5.0`,
      newVal: `${newPlan.starRating.overall} / 5.0`,
      diff: <DiffIndicator a={current.starRating.overall} b={newPlan.starRating.overall} lowerIsBetter={false} />,
    },
    {
      label: "Primary Care Copay",
      current: current.copays.primaryCare,
      newVal: newPlan.copays.primaryCare,
      diff: null,
    },
    {
      label: "Specialist Copay",
      current: current.copays.specialist,
      newVal: newPlan.copays.specialist,
      diff: null,
    },
    {
      label: "Emergency Copay",
      current: current.copays.emergency,
      newVal: newPlan.copays.emergency,
      diff: null,
    },
    {
      label: "Tier 1 (Generic) Rx",
      current: current.rxDrugs.tier1,
      newVal: newPlan.rxDrugs.tier1,
      diff: null,
    },
    {
      label: "Tier 2 (Brand) Rx",
      current: current.rxDrugs.tier2,
      newVal: newPlan.rxDrugs.tier2,
      diff: null,
    },
    {
      label: "Gap Coverage",
      current: current.rxDrugs.gap ? "✅ Yes" : "❌ No",
      newVal: newPlan.rxDrugs.gap ? "✅ Yes" : "❌ No",
      diff: null,
    },
    {
      label: "Dental",
      current: current.extraBenefits.dental.covered ? "✅ Included" : "❌ None",
      newVal: newPlan.extraBenefits.dental.covered ? "✅ Included" : "❌ None",
      diff: <BenefitCompare current={current.extraBenefits.dental.covered} newVal={newPlan.extraBenefits.dental.covered} />,
    },
    {
      label: "Vision",
      current: current.extraBenefits.vision.covered ? "✅ Included" : "❌ None",
      newVal: newPlan.extraBenefits.vision.covered ? "✅ Included" : "❌ None",
      diff: <BenefitCompare current={current.extraBenefits.vision.covered} newVal={newPlan.extraBenefits.vision.covered} />,
    },
    {
      label: "OTC Allowance",
      current: current.extraBenefits.otc.covered ? `✅ ${current.extraBenefits.otc.annualLimit || "Yes"}` : "❌ None",
      newVal: newPlan.extraBenefits.otc.covered ? `✅ ${newPlan.extraBenefits.otc.annualLimit || "Yes"}` : "❌ None",
      diff: <BenefitCompare current={current.extraBenefits.otc.covered} newVal={newPlan.extraBenefits.otc.covered} />,
    },
    {
      label: "Network Size",
      current: `${current.networkSize.toLocaleString()}+ providers`,
      newVal: `${newPlan.networkSize.toLocaleString()}+ providers`,
      diff: <DiffIndicator a={current.networkSize} b={newPlan.networkSize} lowerIsBetter={false} />,
    },
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-200 w-40">
              Feature
            </th>
            <th className="px-4 py-3 bg-green-50 border-b border-green-200 text-center">
              <div className="text-[10px] font-bold uppercase tracking-wide text-green-700 mb-1">Current Plan</div>
              <div className="text-xs font-bold text-gray-800 leading-snug">{current.planName}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">{current.carrier}</div>
            </th>
            <th className="px-4 py-3 bg-orange-50 border-b border-orange-200 text-center">
              <div className="text-[10px] font-bold uppercase tracking-wide text-orange-600 mb-1">New Plan</div>
              <div className="text-xs font-bold text-gray-800 leading-snug">{newPlan.planName}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">{newPlan.carrier}</div>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.label} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              <td className="px-4 py-2.5 text-xs font-semibold text-gray-600 border-r border-gray-100">
                {row.label}
              </td>
              <td className="px-4 py-2.5 text-xs text-center text-gray-700 border-r border-gray-100">
                {row.current}
              </td>
              <td className="px-4 py-2.5 text-xs text-center text-gray-700">
                {row.newVal}
                {row.diff}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Plan Mini Card ────────────────────────────────────────────────────────────

function PlanMiniCard({ plan, label, color }: { plan: MedicarePlan; label: string; color: string }) {
  return (
    <div className="flex-1 rounded-xl border-2 p-4" style={{ borderColor: color, backgroundColor: `${color}08` }}>
      <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color }}>
        {label}
      </div>
      <div className="flex items-start gap-3">
        <CarrierLogo carrier={plan.carrier} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-gray-900 leading-snug">{plan.planName}</div>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: plan.planType === "HMO" ? "#DBEAFE" : "#D1FAE5",
                color: plan.planType === "HMO" ? "#1D4ED8" : "#065F46",
              }}
            >
              {plan.planType}
            </span>
            <StarRating rating={plan.starRating.overall} size={11} />
          </div>
          <div className="flex items-center gap-3 mt-2">
            <div>
              <div className="text-lg font-bold" style={{ color: plan.premium === 0 ? "#006B3F" : "#1F2937" }}>
                {plan.premium === 0 ? "$0" : `$${plan.premium}`}
              </div>
              <div className="text-[10px] text-gray-500">/month</div>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div>
              <div className="text-sm font-bold text-gray-700">${plan.maxOutOfPocket.toLocaleString()}</div>
              <div className="text-[10px] text-gray-500">max OOP</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AICompare() {
  const [currentPlanId, setCurrentPlanId] = useState<string>("");
  const [newPlanId, setNewPlanId] = useState<string>("");
  const [hasCompared, setHasCompared] = useState(false);

  const currentPlan = MOCK_PLANS.find((p) => p.id === currentPlanId) ?? null;
  const newPlan = MOCK_PLANS.find((p) => p.id === newPlanId) ?? null;

  const compareMutation = trpc.compare.comparePlans.useMutation();

  const canCompare = !!currentPlanId && !!newPlanId && currentPlanId !== newPlanId;

  const handleCompare = () => {
    if (!currentPlan || !newPlan) return;

    // Normalize plan data to match the Zod schema (strip extra fields)
    const normalizePlan = (p: MedicarePlan) => ({
      id: p.id,
      carrier: p.carrier,
      planName: p.planName,
      planType: p.planType,
      snpType: p.snpType,
      premium: p.premium,
      deductible: p.deductible,
      maxOutOfPocket: p.maxOutOfPocket,
      partBPremiumReduction: p.partBPremiumReduction,
      starRating: { overall: p.starRating.overall },
      copays: {
        primaryCare: p.copays.primaryCare,
        specialist: p.copays.specialist,
        urgentCare: p.copays.urgentCare,
        emergency: p.copays.emergency,
        inpatientHospital: p.copays.inpatientHospital,
        outpatientSurgery: p.copays.outpatientSurgery,
      },
      rxDrugs: {
        tier1: p.rxDrugs.tier1,
        tier2: p.rxDrugs.tier2,
        tier3: p.rxDrugs.tier3,
        tier4: p.rxDrugs.tier4,
        deductible: p.rxDrugs.deductible,
        gap: p.rxDrugs.gap,
      },
      extraBenefits: {
        dental: { covered: p.extraBenefits.dental.covered, details: p.extraBenefits.dental.details, annualLimit: p.extraBenefits.dental.annualLimit },
        vision: { covered: p.extraBenefits.vision.covered, details: p.extraBenefits.vision.details, annualLimit: p.extraBenefits.vision.annualLimit },
        hearing: { covered: p.extraBenefits.hearing.covered, details: p.extraBenefits.hearing.details, annualLimit: p.extraBenefits.hearing.annualLimit },
        otc: { covered: p.extraBenefits.otc.covered, details: p.extraBenefits.otc.details, annualLimit: p.extraBenefits.otc.annualLimit },
        fitness: { covered: p.extraBenefits.fitness.covered, details: p.extraBenefits.fitness.details },
        transportation: { covered: p.extraBenefits.transportation.covered, details: p.extraBenefits.transportation.details },
        telehealth: { covered: p.extraBenefits.telehealth.covered, details: p.extraBenefits.telehealth.details },
        meals: { covered: p.extraBenefits.meals.covered, details: p.extraBenefits.meals.details },
      },
      networkSize: p.networkSize,
      enrollmentPeriod: p.enrollmentPeriod,
      effectiveDate: p.effectiveDate,
      isBestMatch: p.isBestMatch,
      isMostPopular: p.isMostPopular,
      isNewPlan: p.isNewPlan,
      contractId: p.contractId,
      planId: p.planId,
    });

    setHasCompared(true);
    compareMutation.mutate({
      currentPlan: normalizePlan(currentPlan),
      newPlan: normalizePlan(newPlan),
    });
  };

  const handleReset = () => {
    compareMutation.reset();
    setHasCompared(false);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FAF9" }}>
      <Header />

      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #004D2C 0%, #006B3F 60%, #00A651 100%)",
        }}
      >
        {/* Subtle pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
        <div className="relative container py-10">
          <Link
            href="/plans?zip=64106"
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm font-medium mb-5 transition-colors no-underline"
          >
            <ArrowLeft size={15} />
            Back to Plans
          </Link>
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
            >
              <Sparkles size={24} className="text-white" />
            </div>
            <div>
              <h1
                className="text-3xl lg:text-4xl font-bold text-white mb-2"
                style={{ fontFamily: "'DM Serif Display', serif" }}
              >
                AI Plan Compare
              </h1>
              <p className="text-white/80 text-base max-w-2xl">
                Select your current plan and a plan you're considering. Claude AI will analyze both
                plans and give you a detailed, personalized comparison — including costs, benefits,
                drug coverage, and a clear recommendation.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <div className="flex items-center gap-1.5 text-white/60 text-xs">
                  <Sparkles size={11} />
                  <span>Powered by Claude claude-sonnet-4-20250514</span>
                </div>
                <span className="text-white/30">·</span>
                <div className="flex items-center gap-1.5 text-white/60 text-xs">
                  <Info size={11} />
                  <span>For educational purposes only</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* ── Plan Selection Card ───────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#E8F5EE" }}
            >
              <span className="text-xs font-bold" style={{ color: "#006B3F" }}>1</span>
            </div>
            <h2 className="text-base font-bold text-gray-900">Select Two Plans to Compare</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-5 mb-5">
            <PlanSelector
              label="Your Current Plan"
              sublabel="The plan you're enrolled in now"
              value={currentPlanId}
              onChange={(id) => {
                setCurrentPlanId(id);
                handleReset();
              }}
              excludeId={newPlanId}
              accentColor="#006B3F"
            />
            <PlanSelector
              label="Plan You're Considering"
              sublabel="The new plan you want to switch to"
              value={newPlanId}
              onChange={(id) => {
                setNewPlanId(id);
                handleReset();
              }}
              excludeId={currentPlanId}
              accentColor="#F47920"
            />
          </div>

          {/* Validation message */}
          {currentPlanId && newPlanId && currentPlanId === newPlanId && (
            <div className="flex items-center gap-2 text-amber-600 text-sm mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <AlertCircle size={15} />
              Please select two different plans to compare.
            </div>
          )}

          <button
            onClick={handleCompare}
            disabled={!canCompare || compareMutation.isPending}
            className="w-full py-3.5 rounded-xl text-base font-bold text-white transition-all flex items-center justify-center gap-2 shadow-md"
            style={{
              backgroundColor: canCompare && !compareMutation.isPending ? "#F47920" : "#D1D5DB",
              cursor: canCompare && !compareMutation.isPending ? "pointer" : "not-allowed",
            }}
            onMouseEnter={(e) => {
              if (canCompare && !compareMutation.isPending) {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#D4650F";
              }
            }}
            onMouseLeave={(e) => {
              if (canCompare && !compareMutation.isPending) {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#F47920";
              }
            }}
          >
            {compareMutation.isPending ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Claude is analyzing both plans...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Compare Plans with AI
              </>
            )}
          </button>

          {!canCompare && !currentPlanId && !newPlanId && (
            <p className="text-center text-xs text-gray-400 mt-3">
              Select both plans above to enable the AI comparison
            </p>
          )}
        </div>

        {/* ── Loading State ─────────────────────────────────────────────────── */}
        {compareMutation.isPending && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center mb-6">
            <div className="relative w-16 h-16 mx-auto mb-5">
              <div
                className="w-16 h-16 rounded-full border-4 border-t-transparent animate-spin"
                style={{ borderColor: "#E8F5EE", borderTopColor: "#006B3F" }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles size={20} style={{ color: "#006B3F" }} />
              </div>
            </div>
            <h3
              className="text-xl font-bold text-gray-800 mb-2"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              Claude is analyzing your plans...
            </h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Comparing premiums, copays, drug coverage, extra benefits, star ratings, and network
              differences. This usually takes 10–20 seconds.
            </p>
            <div className="flex justify-center gap-6 mt-6">
              {[
                "Calculating annual costs",
                "Comparing drug tiers",
                "Evaluating extra benefits",
                "Generating recommendation",
              ].map((step, i) => (
                <div
                  key={step}
                  className="text-xs text-gray-400 flex items-center gap-1.5 animate-pulse"
                  style={{ animationDelay: `${i * 300}ms` }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: "#006B3F" }}
                  />
                  {step}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Error State ───────────────────────────────────────────────────── */}
        {compareMutation.isError && (
          <div className="bg-red-50 rounded-2xl border border-red-200 p-6 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-bold text-red-700 mb-1">Comparison Failed</h3>
                <p className="text-sm text-red-600">
                  {compareMutation.error?.message || "An unexpected error occurred. Please try again."}
                </p>
                <button
                  onClick={handleReset}
                  className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-800 transition-colors"
                >
                  <RotateCcw size={13} />
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Results ───────────────────────────────────────────────────────── */}
        {compareMutation.isSuccess && compareMutation.data && currentPlan && newPlan && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Plan mini cards */}
            <div className="flex gap-4">
              <PlanMiniCard plan={currentPlan} label="Current Plan" color="#006B3F" />
              <div className="flex items-center justify-center shrink-0">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md"
                  style={{ backgroundColor: "#F47920" }}
                >
                  VS
                </div>
              </div>
              <PlanMiniCard plan={newPlan} label="New Plan" color="#F47920" />
            </div>

            {/* Side-by-side table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: "#E8F5EE" }}
                >
                  <Star size={14} style={{ color: "#006B3F" }} />
                </div>
                <h2 className="text-base font-bold text-gray-900">Side-by-Side Comparison</h2>
                <div className="ml-auto flex items-center gap-3 text-[10px] text-gray-400">
                  <span className="flex items-center gap-1">
                    <TrendingDown size={10} className="text-green-600" /> Better
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp size={10} className="text-red-500" /> Worse
                  </span>
                  <span className="flex items-center gap-1">
                    <Minus size={10} /> Same
                  </span>
                </div>
              </div>
              <div className="p-4">
                <CompareTable current={currentPlan} newPlan={newPlan} />
              </div>
            </div>

            {/* AI Analysis */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: "#FFF3E8" }}
                  >
                    <Sparkles size={14} style={{ color: "#F47920" }} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">AI Analysis by Claude</h2>
                    <div className="text-[10px] text-gray-400">
                      Generated {new Date(compareMutation.data.generatedAt).toLocaleTimeString()} ·
                      claude-sonnet-4-20250514
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <RotateCcw size={12} />
                  New Comparison
                </button>
              </div>

              {/* Markdown rendered analysis */}
              <div className="p-6">
                <div
                  className="prose prose-sm max-w-none"
                  style={{
                    "--tw-prose-headings": "#1F2937",
                    "--tw-prose-body": "#374151",
                    "--tw-prose-bold": "#111827",
                  } as React.CSSProperties}
                >
                  <style>{`
                    .ai-analysis h2 {
                      font-family: 'DM Serif Display', serif;
                      font-size: 1.1rem;
                      font-weight: 700;
                      color: #1F2937;
                      margin-top: 1.5rem;
                      margin-bottom: 0.5rem;
                      padding-bottom: 0.375rem;
                      border-bottom: 2px solid #E8F5EE;
                      display: flex;
                      align-items: center;
                      gap: 0.5rem;
                    }
                    .ai-analysis h2:first-child {
                      margin-top: 0;
                    }
                    .ai-analysis p {
                      color: #374151;
                      line-height: 1.7;
                      margin-bottom: 0.75rem;
                    }
                    .ai-analysis ul {
                      margin: 0.5rem 0 0.75rem 0;
                      padding-left: 1.25rem;
                    }
                    .ai-analysis li {
                      color: #374151;
                      margin-bottom: 0.25rem;
                      line-height: 1.6;
                    }
                    .ai-analysis strong {
                      color: #111827;
                      font-weight: 700;
                    }
                    .ai-analysis table {
                      width: 100%;
                      border-collapse: collapse;
                      margin: 0.75rem 0;
                      font-size: 0.8125rem;
                    }
                    .ai-analysis th {
                      background: #F8FAF9;
                      padding: 0.5rem 0.75rem;
                      text-align: left;
                      font-weight: 700;
                      color: #374151;
                      border: 1px solid #E5E7EB;
                    }
                    .ai-analysis td {
                      padding: 0.5rem 0.75rem;
                      border: 1px solid #E5E7EB;
                      color: #374151;
                    }
                    .ai-analysis tr:nth-child(even) td {
                      background: #F9FAFB;
                    }
                    .ai-analysis blockquote {
                      border-left: 3px solid #006B3F;
                      padding-left: 1rem;
                      margin: 0.75rem 0;
                      color: #4B5563;
                      font-style: italic;
                    }
                    .ai-analysis code {
                      background: #F3F4F6;
                      padding: 0.125rem 0.375rem;
                      border-radius: 0.25rem;
                      font-size: 0.8125rem;
                      color: #006B3F;
                    }
                  `}</style>
                  <div className="ai-analysis">
                    <Streamdown>{compareMutation.data.analysis}</Streamdown>
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="px-6 pb-5">
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2">
                  <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 leading-relaxed">
                    <strong>Important:</strong> This AI analysis is for educational purposes only and
                    should not be considered professional insurance or financial advice. Plan details
                    shown are mock data. Always verify plan information directly with the insurance
                    carrier and consult a licensed Medicare agent before making enrollment decisions.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA to browse plans */}
            <div
              className="rounded-2xl p-6 text-center"
              style={{ background: "linear-gradient(135deg, #004D2C 0%, #006B3F 100%)" }}
            >
              <h3
                className="text-xl font-bold text-white mb-2"
                style={{ fontFamily: "'DM Serif Display', serif" }}
              >
                Ready to Enroll?
              </h3>
              <p className="text-white/80 text-sm mb-4">
                Browse all 24 available plans in Jackson County, MO and enroll in the plan that's
                right for you.
              </p>
              <Link
                href="/plans?zip=64106"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white no-underline transition-all shadow-lg"
                style={{ backgroundColor: "#F47920" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#D4650F")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#F47920")}
              >
                <CheckCircle2 size={16} />
                Browse All Plans
              </Link>
            </div>
          </div>
        )}

        {/* ── Empty State (no comparison yet) ──────────────────────────────── */}
        {!hasCompared && !compareMutation.isPending && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ backgroundColor: "#E8F5EE" }}
            >
              <Sparkles size={28} style={{ color: "#006B3F" }} />
            </div>
            <h3
              className="text-xl font-bold text-gray-800 mb-2"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              How AI Plan Compare Works
            </h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
              Select your current plan and a plan you're considering above, then click "Compare Plans
              with AI" to get a detailed Claude-powered analysis.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 max-w-xl mx-auto text-left">
              {[
                {
                  icon: "1",
                  title: "Select Plans",
                  desc: "Choose your current plan and a new plan from the dropdowns above",
                },
                {
                  icon: "2",
                  title: "AI Analyzes",
                  desc: "Claude compares premiums, copays, drug costs, and extra benefits",
                },
                {
                  icon: "3",
                  title: "Get Recommendation",
                  desc: "Receive a clear, personalized recommendation with cost estimates",
                },
              ].map((step) => (
                <div key={step.icon} className="text-center">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold text-white"
                    style={{ backgroundColor: "#006B3F" }}
                  >
                    {step.icon}
                  </div>
                  <div className="text-sm font-bold text-gray-800 mb-1">{step.title}</div>
                  <div className="text-xs text-gray-500 leading-relaxed">{step.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
