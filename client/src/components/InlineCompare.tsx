/**
 * InlineCompare — "Compare to My Current Plan" feature embedded in each PlanCard.
 *
 * PRIVACY POLICY:
 * - Medicare ID is accepted only as transient input for a one-time eligibility lookup.
 * - It is NEVER stored in any database, log, localStorage, or persistent store.
 * - The state variable is cleared immediately after the pVerify API response is received.
 * - No PII is transmitted to or stored by the comparison endpoint.
 */

import { useState, useRef, useEffect } from "react";
import {
  Lock,
  Shield,
  Loader2,
  CheckCircle2,
  X,
  TrendingDown,
  TrendingUp,
  Minus,
  ThumbsUp,
  ThumbsDown,
  DollarSign,
  Lightbulb,
  Phone,
  BookmarkPlus,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import type { MedicarePlan } from "@/lib/types";

interface InlineCompareProps {
  plan: MedicarePlan;
  isActive: boolean;
  onActivate: (planId: string | null) => void;
}

type CompareStep = "idle" | "lookup" | "analyzing" | "done" | "error";

interface CompareResult {
  summary: string;
  currentPlanPros: string[];
  currentPlanCons: string[];
  potentialPlanPros: string[];
  potentialPlanCons: string[];
  recommendation: string;
  estimatedAnnualCostCurrent: number;
  estimatedAnnualCostPotential: number;
  currentPlan: {
    planName: string;
    planId: string;
    premium: number;
    deductible: number;
    oopMax: number;
    pcpCopay: number;
    specialistCopay: number;
    urgentCareCopay: number;
    erCopay: number;
    drugTier1Copay: number;
    drugTier2Copay: number;
    drugTier3Copay: number;
  };
}

function CompareCell({
  label,
  current,
  potential,
  lowerIsBetter = true,
}: {
  label: string;
  current: string | number;
  potential: string | number;
  lowerIsBetter?: boolean;
}) {
  const currentNum = typeof current === "number" ? current : parseFloat(String(current).replace(/[^0-9.]/g, ""));
  const potentialNum = typeof potential === "number" ? potential : parseFloat(String(potential).replace(/[^0-9.]/g, ""));
  const isNumeric = !isNaN(currentNum) && !isNaN(potentialNum);

  let potentialColor = "#374151";
  let potentialBg = "transparent";
  let Icon = Minus;

  if (isNumeric && currentNum !== potentialNum) {
    const potentialIsBetter = lowerIsBetter ? potentialNum < currentNum : potentialNum > currentNum;
    if (potentialIsBetter) {
      potentialColor = "#065F46";
      potentialBg = "#D1FAE5";
      Icon = TrendingDown;
    } else {
      potentialColor = "#991B1B";
      potentialBg = "#FEE2E2";
      Icon = TrendingUp;
    }
  }

  const fmt = (v: string | number) => {
    if (typeof v === "number") {
      return v === 0 ? "$0" : `$${v.toLocaleString()}`;
    }
    return v;
  };

  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="py-2.5 px-3 text-xs font-medium text-gray-600 w-1/3">{label}</td>
      <td className="py-2.5 px-3 text-xs font-semibold text-center text-gray-700">{fmt(current)}</td>
      <td className="py-2.5 px-3 text-center">
        <span
          className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ color: potentialColor, backgroundColor: potentialBg }}
        >
          <Icon size={10} />
          {fmt(potential)}
        </span>
      </td>
    </tr>
  );
}

export default function InlineCompare({ plan, isActive, onActivate }: InlineCompareProps) {
  // PRIVACY: medicareId is transient — cleared immediately after lookup response
  const [medicareId, setMedicareId] = useState("");
  const [consent, setConsent] = useState(false);
  const [step, setStep] = useState<CompareStep>("idle");
  const [result, setResult] = useState<CompareResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Auto-focus the Medicare ID input when panel opens
  useEffect(() => {
    if (isActive && step === "idle" && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isActive, step]);

  // When unchecked: collapse panel and clear Medicare ID immediately
  const handleCheckboxChange = (checked: boolean) => {
    if (checked) {
      onActivate(plan.id);
    } else {
      // PRIVACY: clear Medicare ID immediately on uncheck
      setMedicareId("");
      setConsent(false);
      setStep("idle");
      setResult(null);
      setErrorMsg("");
      onActivate(null);
    }
  };

  const lookupMutation = trpc.pverify.lookup.useMutation();
  const compareMutation = trpc.pverify.compare.useMutation();

  const handleRunComparison = async () => {
    if (!medicareId.trim() || !consent) return;

    setStep("lookup");
    setErrorMsg("");

    try {
      // Step 1: pVerify eligibility lookup
      // PRIVACY: medicareId is passed transiently and cleared immediately after response
      const lookupResult = await lookupMutation.mutateAsync({ medicareId: medicareId.trim() });

      // PRIVACY: Clear the Medicare ID from state immediately after the API response
      // It is never stored in any database, log, or persistent store.
      setMedicareId(""); // purge from UI state immediately

      if (!lookupResult.success) {
        throw new Error("Eligibility lookup failed");
      }

      const currentPlanData = lookupResult.data;

      // Step 2: AI plan comparison
      setStep("analyzing");

      const potentialPlanData = {
        id: plan.id,
        planName: plan.planName,
        carrier: plan.carrier,
        premium: plan.premium,
        deductible: plan.deductible,
        oopMax: plan.maxOutOfPocket,
        pcpCopay: parseInt(plan.copays.primaryCare.replace(/[^0-9]/g, "")) || 0,
        specialistCopay: parseInt(plan.copays.specialist.replace(/[^0-9]/g, "")) || 0,
        urgentCareCopay: parseInt(plan.copays.urgentCare.replace(/[^0-9]/g, "")) || 0,
        erCopay: parseInt(plan.copays.emergency.replace(/[^0-9]/g, "")) || 0,
        drugTier1Copay: parseInt(plan.rxDrugs.tier1.replace(/[^0-9]/g, "")) || 0,
        drugTier2Copay: parseInt(plan.rxDrugs.tier2.replace(/[^0-9]/g, "")) || 0,
        drugTier3Copay: parseInt(plan.rxDrugs.tier3.replace(/[^0-9]/g, "")) || 0,
        dentalCoverage: plan.extraBenefits.dental.covered ? plan.extraBenefits.dental.details : "Not covered",
        visionCoverage: plan.extraBenefits.vision.covered ? plan.extraBenefits.vision.details : "Not covered",
        hearingCoverage: plan.extraBenefits.hearing.covered ? plan.extraBenefits.hearing.details : "Not covered",
      };

      const compareResult = await compareMutation.mutateAsync({
        currentPlan: currentPlanData,
        potentialPlan: potentialPlanData,
      });

      if (!compareResult.success) {
        throw new Error("Plan comparison failed");
      }

      setResult({
        ...compareResult.data,
        currentPlan: currentPlanData,
      });
      setStep("done");
    } catch (err) {
      // PRIVACY: ensure medicareId is cleared even on error
      setMedicareId("");
      setStep("error");
      setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred. Please try again.");
    }
  };

  const handleClose = () => {
    setResult(null);
    setStep("idle");
    setMedicareId("");
    setConsent(false);
    onActivate(null);
  };

  const canRun = medicareId.trim().length >= 4 && consent && step === "idle";
  const savings = result ? result.estimatedAnnualCostCurrent - result.estimatedAnnualCostPotential : 0;

  return (
    <div className="border-t border-gray-100 mt-1">
      {/* ── Checkbox trigger ─────────────────────────────────────────────── */}
      <label
        className="flex items-center gap-2.5 px-5 py-3 cursor-pointer select-none group"
        style={{ backgroundColor: isActive ? "#F0FAF5" : "transparent" }}
      >
        <div
          className="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all"
          style={{
            borderColor: isActive ? "#006B3F" : "#D1D5DB",
            backgroundColor: isActive ? "#006B3F" : "white",
          }}
        >
          {isActive && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <input
          type="checkbox"
          className="sr-only"
          checked={isActive}
          onChange={(e) => handleCheckboxChange(e.target.checked)}
        />
        <span className="text-xs font-semibold" style={{ color: isActive ? "#006B3F" : "#6B7280" }}>
          Compare to my current plan
        </span>
        {isActive && (
          <span
            className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: "#006B3F", color: "white" }}
          >
            Active
          </span>
        )}
      </label>

      {/* ── Slide-down panel ─────────────────────────────────────────────── */}
      {isActive && (
        <div
          ref={panelRef}
          className="animate-slide-down mx-4 mb-4 rounded-xl border overflow-hidden"
          style={{ borderColor: "#C3E6D4", backgroundColor: "#F0FAF5" }}
        >
          {/* Panel header */}
          <div
            className="flex items-center gap-2.5 px-4 py-3 border-b"
            style={{ borderColor: "#C3E6D4", backgroundColor: "#E8F5EE" }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: "#006B3F" }}
            >
              <Lock size={13} color="white" />
            </div>
            <div>
              <div className="text-sm font-bold" style={{ color: "#004D2C" }}>
                Enter Your Medicare ID to Compare
              </div>
              <div className="text-[11px] text-gray-500">
                Your Medicare ID is never stored · Purged after lookup
              </div>
            </div>
          </div>

          <div className="p-4">
            {/* ── Idle / Input state ──────────────────────────────────────── */}
            {(step === "idle" || step === "error") && (
              <>
                {/* Medicare ID input */}
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Medicare ID
                  </label>
                  <input
                    ref={inputRef}
                    type="text"
                    value={medicareId}
                    onChange={(e) => setMedicareId(e.target.value)}
                    placeholder="e.g. 1EG4-TE5-MK72"
                    maxLength={20}
                    className="w-full px-3 py-2.5 text-sm font-semibold border-2 rounded-lg outline-none transition-all"
                    style={{
                      borderColor: medicareId.length >= 4 ? "#006B3F" : "#D1D5DB",
                      backgroundColor: "white",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#006B3F"; }}
                    onBlur={(e) => {
                      if (medicareId.length < 4) e.currentTarget.style.borderColor = "#D1D5DB";
                    }}
                    onKeyDown={(e) => { if (e.key === "Enter" && canRun) handleRunComparison(); }}
                  />
                  {/* Privacy note */}
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Shield size={10} className="text-gray-400 shrink-0" />
                    <span className="text-[10px] text-gray-400">
                      Never stored · Purged after lookup · Not logged
                    </span>
                  </div>
                </div>

                {/* Consent checkbox */}
                <label className="flex items-start gap-2 mb-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 w-3.5 h-3.5 accent-green-700 shrink-0"
                  />
                  <span className="text-[11px] text-gray-600 leading-relaxed">
                    I consent to a one-time eligibility lookup. I understand this is a simulated
                    lookup for demonstration purposes only.
                  </span>
                </label>

                {/* Error message */}
                {step === "error" && errorMsg && (
                  <div className="mb-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                    <X size={12} className="shrink-0 mt-0.5" />
                    {errorMsg}
                  </div>
                )}

                {/* Run button */}
                <button
                  onClick={handleRunComparison}
                  disabled={!canRun}
                  className="w-full py-2.5 rounded-lg text-sm font-bold text-white transition-all"
                  style={{
                    backgroundColor: canRun ? "#F47920" : "#D1D5DB",
                    cursor: canRun ? "pointer" : "not-allowed",
                  }}
                  onMouseEnter={(e) => {
                    if (canRun) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#D4650F";
                  }}
                  onMouseLeave={(e) => {
                    if (canRun) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#F47920";
                  }}
                >
                  Run Plan Comparison
                </button>
              </>
            )}

            {/* ── Loading: pVerify lookup ──────────────────────────────────── */}
            {step === "lookup" && (
              <div className="py-6 flex flex-col items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "#E8F5EE" }}
                >
                  <Loader2 size={22} className="animate-spin" style={{ color: "#006B3F" }} />
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-gray-800">Looking up your plan...</div>
                  <div className="text-xs text-gray-500 mt-0.5">Checking eligibility via pVerify</div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                  <Shield size={10} />
                  Medicare ID purged after this step
                </div>
              </div>
            )}

            {/* ── Loading: AI analysis ─────────────────────────────────────── */}
            {step === "analyzing" && (
              <div className="py-6 flex flex-col items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "#FFF3E8" }}
                >
                  <Loader2 size={22} className="animate-spin" style={{ color: "#F47920" }} />
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-gray-800">Analyzing plans with AI...</div>
                  <div className="text-xs text-gray-500 mt-0.5">Comparing benefits, costs, and coverage</div>
                </div>
                <div className="flex flex-col gap-1.5 w-full mt-1">
                  {[
                    "Comparing premiums & deductibles",
                    "Analyzing copay differences",
                    "Evaluating drug coverage",
                    "Generating recommendation",
                  ].map((step, i) => (
                    <div key={step} className="flex items-center gap-2 text-xs text-gray-500">
                      <div
                        className="w-1.5 h-1.5 rounded-full animate-pulse"
                        style={{
                          backgroundColor: "#F47920",
                          animationDelay: `${i * 200}ms`,
                        }}
                      />
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Inline comparison result ─────────────────────────────────────── */}
      {isActive && step === "done" && result && (
        <div className="mx-4 mb-4 rounded-xl border overflow-hidden" style={{ borderColor: "#C3E6D4" }}>
          {/* ── Result header ──────────────────────────────────────────────── */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ backgroundColor: "#006B3F" }}
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={18} color="white" />
              <div>
                <div className="text-sm font-bold text-white">Comparison Complete</div>
                <div className="text-[11px] text-green-200">
                  {result.currentPlan.planName} vs {plan.planName}
                </div>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
            >
              <X size={16} color="white" />
            </button>
          </div>

          <div className="p-4 space-y-4" style={{ backgroundColor: "#F8FAF9" }}>
            {/* ── Side-by-side comparison table ────────────────────────────── */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="grid grid-cols-3 text-center text-[10px] font-bold uppercase tracking-wide py-2 border-b border-gray-100"
                style={{ backgroundColor: "#F8FAF9" }}>
                <div className="px-3 text-left text-gray-500">Benefit</div>
                <div className="text-gray-600">Your Current Plan</div>
                <div style={{ color: "#006B3F" }}>{plan.carrier} Plan</div>
              </div>
              <table className="w-full">
                <tbody>
                  <CompareCell
                    label="Monthly Premium"
                    current={result.currentPlan.premium}
                    potential={plan.premium}
                  />
                  <CompareCell
                    label="Deductible"
                    current={result.currentPlan.deductible}
                    potential={plan.deductible}
                  />
                  <CompareCell
                    label="Max Out-of-Pocket"
                    current={result.currentPlan.oopMax}
                    potential={plan.maxOutOfPocket}
                  />
                  <CompareCell
                    label="PCP Visit"
                    current={result.currentPlan.pcpCopay}
                    potential={parseInt(plan.copays.primaryCare.replace(/[^0-9]/g, "")) || 0}
                  />
                  <CompareCell
                    label="Specialist"
                    current={result.currentPlan.specialistCopay}
                    potential={parseInt(plan.copays.specialist.replace(/[^0-9]/g, "")) || 0}
                  />
                  <CompareCell
                    label="Tier 1 Drug"
                    current={result.currentPlan.drugTier1Copay}
                    potential={parseInt(plan.rxDrugs.tier1.replace(/[^0-9]/g, "")) || 0}
                  />
                  <CompareCell
                    label="Tier 2 Drug"
                    current={result.currentPlan.drugTier2Copay}
                    potential={parseInt(plan.rxDrugs.tier2.replace(/[^0-9]/g, "")) || 0}
                  />
                  <CompareCell
                    label="Tier 3 Drug"
                    current={result.currentPlan.drugTier3Copay}
                    potential={parseInt(plan.rxDrugs.tier3.replace(/[^0-9]/g, "")) || 0}
                  />
                </tbody>
              </table>
            </div>

            {/* ── AI Summary ───────────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-gray-100 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb size={13} style={{ color: "#F47920" }} />
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">AI Analysis</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{result.summary}</p>
            </div>

            {/* ── Pros / Cons ──────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3">
              {/* Current plan */}
              <div className="bg-white rounded-xl border border-gray-100 p-3">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">
                  Your Current Plan
                </div>
                {result.currentPlanPros.length > 0 && (
                  <div className="space-y-1 mb-2">
                    {result.currentPlanPros.map((pro, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <ThumbsUp size={9} className="shrink-0 mt-0.5" style={{ color: "#006B3F" }} />
                        <span className="text-[10px] text-gray-600">{pro}</span>
                      </div>
                    ))}
                  </div>
                )}
                {result.currentPlanCons.length > 0 && (
                  <div className="space-y-1">
                    {result.currentPlanCons.map((con, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <ThumbsDown size={9} className="shrink-0 mt-0.5 text-red-400" />
                        <span className="text-[10px] text-gray-500">{con}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Potential plan */}
              <div className="bg-white rounded-xl border border-gray-100 p-3">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">
                  {plan.carrier} Plan
                </div>
                {result.potentialPlanPros.length > 0 && (
                  <div className="space-y-1 mb-2">
                    {result.potentialPlanPros.map((pro, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <ThumbsUp size={9} className="shrink-0 mt-0.5" style={{ color: "#006B3F" }} />
                        <span className="text-[10px] text-gray-600">{pro}</span>
                      </div>
                    ))}
                  </div>
                )}
                {result.potentialPlanCons.length > 0 && (
                  <div className="space-y-1">
                    {result.potentialPlanCons.map((con, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <ThumbsDown size={9} className="shrink-0 mt-0.5 text-red-400" />
                        <span className="text-[10px] text-gray-500">{con}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Annual Cost Comparison ───────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-gray-100 p-3">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign size={13} style={{ color: "#006B3F" }} />
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                  Estimated Annual Cost
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="text-center p-2.5 rounded-lg" style={{ backgroundColor: "#F8FAF9" }}>
                  <div className="text-[10px] text-gray-500 mb-1">Your Current Plan</div>
                  <div className="text-xl font-bold text-gray-800" style={{ fontFamily: "'DM Serif Display', serif" }}>
                    ${result.estimatedAnnualCostCurrent.toLocaleString()}
                  </div>
                  <div className="text-[9px] text-gray-400">typical usage/year</div>
                </div>
                <div
                  className="text-center p-2.5 rounded-lg"
                  style={{
                    backgroundColor: savings > 0 ? "#D1FAE5" : savings < 0 ? "#FEE2E2" : "#F8FAF9",
                  }}
                >
                  <div className="text-[10px] text-gray-500 mb-1">{plan.carrier} Plan</div>
                  <div
                    className="text-xl font-bold"
                    style={{
                      fontFamily: "'DM Serif Display', serif",
                      color: savings > 0 ? "#065F46" : savings < 0 ? "#991B1B" : "#1F2937",
                    }}
                  >
                    ${result.estimatedAnnualCostPotential.toLocaleString()}
                  </div>
                  <div className="text-[9px] text-gray-400">typical usage/year</div>
                </div>
              </div>

              {/* Savings callout */}
              {savings !== 0 && (
                <div
                  className="flex items-center gap-2 p-2.5 rounded-lg"
                  style={{
                    backgroundColor: savings > 0 ? "#FFF3E8" : "#FEF2F2",
                    border: `1.5px solid ${savings > 0 ? "#F4792040" : "#FCA5A540"}`,
                  }}
                >
                  <DollarSign size={14} style={{ color: savings > 0 ? "#F47920" : "#EF4444" }} />
                  <span
                    className="text-xs font-bold"
                    style={{ color: savings > 0 ? "#C2410C" : "#B91C1C" }}
                  >
                    {savings > 0
                      ? `You could save ~$${savings.toLocaleString()}/year by switching to this plan`
                      : `This plan costs ~$${Math.abs(savings).toLocaleString()} more per year than your current plan`}
                  </span>
                </div>
              )}
            </div>

            {/* ── Recommendation ───────────────────────────────────────────── */}
            <div
              className="rounded-xl p-3"
              style={{
                border: "2px solid #F47920",
                backgroundColor: "#FFFBF7",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "#F47920" }}
                >
                  <Lightbulb size={12} color="white" />
                </div>
                <span className="text-xs font-bold" style={{ color: "#C2410C" }}>
                  AI Recommendation
                </span>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">{result.recommendation}</p>
            </div>

            {/* ── Action buttons ───────────────────────────────────────────── */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  // In a real app, this would save to the user's account
                  // For demo: show a toast via the parent or use window alert
                  alert("Comparison saved! (In production, this would save to your account.)");
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold border transition-all"
                style={{ borderColor: "#006B3F", color: "#006B3F" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#E8F5EE";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                }}
              >
                <BookmarkPlus size={12} />
                Save Comparison
              </button>
              <a
                href="tel:1-800-555-0100"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold text-white no-underline transition-all"
                style={{ backgroundColor: "#F47920" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#D4650F";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#F47920";
                }}
              >
                <Phone size={12} />
                Talk to an Agent
              </a>
            </div>

            {/* Privacy disclaimer */}
            <p className="text-[9px] text-gray-400 leading-relaxed text-center">
              Your Medicare ID was used only for this one-time eligibility lookup and has been
              purged from memory. It was never stored in a database, log, or any persistent system.
              Plan data shown is for illustrative purposes only.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
