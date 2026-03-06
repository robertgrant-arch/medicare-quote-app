/**
 * AI Plan Compare Page — Optimized for Speed
 * Design: Bold Civic Design | Primary: #006B3F | CTA: #F47920
 *
 * Performance optimizations:
 * 1. Side-by-side comparison table renders INSTANTLY from client-side plan data
 * 2. Claude claude-3-5-haiku-20241022 (2-3x faster than Sonnet)
 * 3. Streaming SSE — AI text appears token-by-token as Claude generates it
 * 4. localStorage cache keyed by sorted plan IDs — instant replay for same pair
 * 5. Progressive UX — table shows immediately, AI streams below
 */

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
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
  RefreshCw,
  Zap,
  Clock,
} from "lucide-react";
import { Streamdown } from "streamdown";
import Header from "@/components/Header";
import CarrierLogo from "@/components/CarrierLogo";
import StarRating from "@/components/StarRating";
import { MOCK_PLANS } from "@/lib/mockData";
import type { MedicarePlan } from "@/lib/types";

// ── localStorage cache helpers ────────────────────────────────────────────────

const CACHE_VERSION = "v1";

function getCacheKey(idA: string, idB: string): string {
  return `medicare-compare-${CACHE_VERSION}-${[idA, idB].sort().join("__")}`;
}

interface CachedResult {
  analysis: string;
  generatedAt: string;
  currentPlanId: string;
  newPlanId: string;
}

function loadCache(idA: string, idB: string): CachedResult | null {
  try {
    const raw = localStorage.getItem(getCacheKey(idA, idB));
    if (!raw) return null;
    return JSON.parse(raw) as CachedResult;
  } catch {
    return null;
  }
}

function saveCache(idA: string, idB: string, result: CachedResult): void {
  try {
    localStorage.setItem(getCacheKey(idA, idB), JSON.stringify(result));
  } catch {
    // ignore storage errors
  }
}

function clearCache(idA: string, idB: string): void {
  try {
    localStorage.removeItem(getCacheKey(idA, idB));
  } catch {
    // ignore
  }
}

// ── Plan normalizer (strips extra fields for API) ─────────────────────────────

function normalizePlan(p: MedicarePlan) {
  return {
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
  };
}

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
                    style={{ backgroundColor: plan.id === value ? "#E8F5EE" : undefined }}
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

// ── Plan Mini Card ────────────────────────────────────────────────────────────

function PlanMiniCard({ plan, label, color }: { plan: MedicarePlan; label: string; color: string }) {
  return (
    <div className="flex-1 bg-white rounded-2xl border-2 p-4 shadow-sm" style={{ borderColor: color }}>
      <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color }}>
        {label}
      </div>
      <div className="flex items-center gap-3 mb-3">
        <CarrierLogo carrier={plan.carrier} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-gray-900 leading-snug truncate">{plan.planName}</div>
          <div className="text-xs text-gray-500">{plan.carrier}</div>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-2">
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
  );
}

// ── Instant Client-Side Comparison Table ─────────────────────────────────────

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

function CompareTable({ current, newPlan }: { current: MedicarePlan; newPlan: MedicarePlan }) {
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
      label: "Fitness Benefit",
      current: current.extraBenefits.fitness.covered ? "✅ Included" : "❌ None",
      newVal: newPlan.extraBenefits.fitness.covered ? "✅ Included" : "❌ None",
      diff: <BenefitCompare current={current.extraBenefits.fitness.covered} newVal={newPlan.extraBenefits.fitness.covered} />,
    },
    {
      label: "Transportation",
      current: current.extraBenefits.transportation.covered ? "✅ Included" : "❌ None",
      newVal: newPlan.extraBenefits.transportation.covered ? "✅ Included" : "❌ None",
      diff: <BenefitCompare current={current.extraBenefits.transportation.covered} newVal={newPlan.extraBenefits.transportation.covered} />,
    },
    {
      label: "Network Size",
      current: `${current.networkSize.toLocaleString()}+ providers`,
      newVal: `${newPlan.networkSize.toLocaleString()}+ providers`,
      diff: <DiffIndicator a={current.networkSize} b={newPlan.networkSize} lowerIsBetter={false} />,
    },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-gray-100">
            <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-400 uppercase tracking-wider w-40">
              Feature
            </th>
            <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#006B3F" }}>
              Current Plan
            </th>
            <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#F47920" }}>
              New Plan
            </th>
            <th className="text-center py-2 pl-3 text-xs font-semibold text-gray-400 uppercase tracking-wider w-16">
              Change
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.label} className={i % 2 === 0 ? "bg-gray-50/50" : "bg-white"}>
              <td className="py-2.5 pr-4 text-xs font-medium text-gray-500 whitespace-nowrap">{row.label}</td>
              <td className="py-2.5 px-3 text-xs font-semibold text-gray-800">
                {row.current}
              </td>
              <td className="py-2.5 px-3 text-xs font-semibold text-gray-800">
                {row.newVal}
                {row.diff}
              </td>
              <td className="py-2.5 pl-3 text-center">
                {row.current === row.newVal ? (
                  <span className="text-[10px] text-gray-400 font-medium">Same</span>
                ) : (
                  <span className="text-[10px]">{row.diff ? "" : "—"}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type ComparePhase = "idle" | "table-ready" | "streaming" | "done" | "error" | "cached";

export default function AICompare() {
  const [currentPlanId, setCurrentPlanId] = useState<string>("");
  const [newPlanId, setNewPlanId] = useState<string>("");

  // Progressive state
  const [phase, setPhase] = useState<ComparePhase>("idle");
  const [streamedText, setStreamedText] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [generatedAt, setGeneratedAt] = useState<string>("");
  const [fromCache, setFromCache] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const currentPlan = MOCK_PLANS.find((p) => p.id === currentPlanId) ?? null;
  const newPlan = MOCK_PLANS.find((p) => p.id === newPlanId) ?? null;
  const canCompare = !!currentPlanId && !!newPlanId && currentPlanId !== newPlanId;

  // Check if cache exists for current pair
  const cachedResult = useMemo(() => {
    if (!currentPlanId || !newPlanId || currentPlanId === newPlanId) return null;
    return loadCache(currentPlanId, newPlanId);
  }, [currentPlanId, newPlanId]);

  const handleCompare = useCallback(async (forceRefresh = false) => {
    if (!currentPlan || !newPlan) return;

    // Check cache first (unless forced refresh)
    if (!forceRefresh && cachedResult) {
      setStreamedText(cachedResult.analysis);
      setGeneratedAt(cachedResult.generatedAt);
      setFromCache(true);
      setPhase("cached");
      return;
    }

    // Cancel any in-flight request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    // STEP 1: Show table instantly (no API wait)
    setPhase("table-ready");
    setStreamedText("");
    setErrorMsg("");
    setFromCache(false);

    // Small delay so the table renders before we start the stream
    await new Promise((r) => setTimeout(r, 50));

    // STEP 2: Start streaming
    setPhase("streaming");

    try {
      const response = await fetch("/api/compare-stream", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          currentPlan: normalizePlan(currentPlan),
          newPlan: normalizePlan(newPlan),
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API error ${response.status}: ${errText.slice(0, 200)}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("event: delta")) continue;
          if (line.startsWith("event: done")) {
            // Stream complete
            const ts = new Date().toISOString();
            setGeneratedAt(ts);
            setPhase("done");
            // Save to cache
            saveCache(currentPlanId, newPlanId, {
              analysis: fullText,
              generatedAt: ts,
              currentPlanId,
              newPlanId,
            });
            return;
          }
          if (line.startsWith("event: error")) continue;
          if (line.startsWith("data: ")) {
            try {
              const chunk = JSON.parse(line.slice(6)) as string;
              if (line.includes('"event":"error"') || (typeof chunk === "string" && chunk.startsWith("Streaming error"))) {
                throw new Error(chunk);
              }
              fullText += chunk;
              setStreamedText(fullText);
            } catch {
              // skip malformed
            }
          }
        }
      }

      // Fallback if stream ended without done event
      const ts = new Date().toISOString();
      setGeneratedAt(ts);
      setPhase("done");
      if (fullText) {
        saveCache(currentPlanId, newPlanId, {
          analysis: fullText,
          generatedAt: ts,
          currentPlanId,
          newPlanId,
        });
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setErrorMsg((err as Error).message || "An unexpected error occurred.");
      setPhase("error");
    }
  }, [currentPlan, newPlan, currentPlanId, newPlanId, cachedResult]);

  const handleReset = () => {
    abortRef.current?.abort();
    setPhase("idle");
    setStreamedText("");
    setErrorMsg("");
    setFromCache(false);
    setGeneratedAt("");
  };

  const handleRefresh = () => {
    if (currentPlanId && newPlanId) {
      clearCache(currentPlanId, newPlanId);
    }
    handleCompare(true);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  const showResults = phase !== "idle";
  const isStreaming = phase === "streaming";
  const isTableReady = phase === "table-ready" || phase === "streaming" || phase === "done" || phase === "cached" || phase === "error";

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FAF9" }}>
      <Header />

      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #004D2C 0%, #006B3F 60%, #00A651 100%)" }}
      >
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
                Select your current plan and a plan you're considering. The comparison table appears
                instantly — then Claude AI streams in a personalized analysis with a clear recommendation.
              </p>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-white/60 text-xs">
                  <Zap size={11} />
                  <span>Instant comparison table</span>
                </div>
                <span className="text-white/30">·</span>
                <div className="flex items-center gap-1.5 text-white/60 text-xs">
                  <Sparkles size={11} />
                  <span>Powered by Claude Haiku</span>
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
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#E8F5EE" }}>
              <span className="text-xs font-bold" style={{ color: "#006B3F" }}>1</span>
            </div>
            <h2 className="text-base font-bold text-gray-900">Select Two Plans to Compare</h2>
            {cachedResult && phase === "idle" && (
              <div className="ml-auto flex items-center gap-1.5 text-[10px] text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-200">
                <Clock size={10} />
                Cached result available
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-5 mb-5">
            <PlanSelector
              label="Your Current Plan"
              sublabel="The plan you're enrolled in now"
              value={currentPlanId}
              onChange={(id) => { setCurrentPlanId(id); handleReset(); }}
              excludeId={newPlanId}
              accentColor="#006B3F"
            />
            <PlanSelector
              label="Plan You're Considering"
              sublabel="The new plan you want to switch to"
              value={newPlanId}
              onChange={(id) => { setNewPlanId(id); handleReset(); }}
              excludeId={currentPlanId}
              accentColor="#F47920"
            />
          </div>

          {currentPlanId && newPlanId && currentPlanId === newPlanId && (
            <div className="flex items-center gap-2 text-amber-600 text-sm mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <AlertCircle size={15} />
              Please select two different plans to compare.
            </div>
          )}

          <button
            onClick={() => handleCompare(false)}
            disabled={!canCompare || isStreaming || phase === "table-ready"}
            className="w-full py-3.5 rounded-xl text-base font-bold text-white transition-all flex items-center justify-center gap-2 shadow-md"
            style={{
              backgroundColor: canCompare && phase === "idle" ? "#F47920" : "#D1D5DB",
              cursor: canCompare && phase === "idle" ? "pointer" : "not-allowed",
            }}
          >
            {phase === "table-ready" || isStreaming ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {phase === "table-ready" ? "Building comparison..." : "Claude is analyzing..."}
              </>
            ) : (
              <>
                <Sparkles size={18} />
                {cachedResult && phase === "idle" ? "Show Cached Comparison" : "Compare Plans with AI"}
              </>
            )}
          </button>

          {!canCompare && !currentPlanId && !newPlanId && (
            <p className="text-center text-xs text-gray-400 mt-3">
              Select both plans above to enable the AI comparison
            </p>
          )}
        </div>

        {/* ── Results: Instant Table + Streaming AI ────────────────────────── */}
        {showResults && currentPlan && newPlan && (
          <div className="space-y-6 animate-fade-in-up">
            {/* VS mini cards — shown instantly */}
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

            {/* Side-by-side table — rendered INSTANTLY from client data */}
            {isTableReady && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#E8F5EE" }}>
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
            )}

            {/* AI Analysis section — streams in progressively */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#FFF3E8" }}>
                    <Sparkles size={14} style={{ color: "#F47920" }} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">AI Analysis by Claude</h2>
                    {generatedAt && (
                      <div className="text-[10px] text-gray-400 flex items-center gap-1">
                        {fromCache && <><Clock size={9} /> Cached · </>}
                        {new Date(generatedAt).toLocaleTimeString()} · claude-3-5-haiku-20241022
                      </div>
                    )}
                    {isStreaming && (
                      <div className="text-[10px] text-orange-500 flex items-center gap-1 animate-pulse">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                        Streaming...
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(phase === "done" || phase === "cached") && (
                    <button
                      onClick={handleRefresh}
                      className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <RefreshCw size={12} />
                      Refresh Analysis
                    </button>
                  )}
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <RotateCcw size={12} />
                    New Comparison
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Streaming loading indicator (only shows before text starts) */}
                {isStreaming && streamedText.length === 0 && (
                  <div className="flex items-center gap-3 text-gray-500 text-sm py-4">
                    <div
                      className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin shrink-0"
                      style={{ borderColor: "#E8F5EE", borderTopColor: "#F47920" }}
                    />
                    Claude is writing the analysis...
                  </div>
                )}

                {/* Streaming / completed text */}
                {streamedText.length > 0 && (
                  <div className="ai-analysis">
                    <style>{`
                      .ai-analysis h2 {
                        font-family: 'DM Serif Display', serif;
                        font-size: 1.05rem;
                        font-weight: 700;
                        color: #1F2937;
                        margin-top: 1.25rem;
                        margin-bottom: 0.4rem;
                        padding-bottom: 0.3rem;
                        border-bottom: 2px solid #E8F5EE;
                      }
                      .ai-analysis h2:first-child { margin-top: 0; }
                      .ai-analysis p { color: #374151; line-height: 1.65; margin-bottom: 0.75rem; font-size: 0.875rem; }
                      .ai-analysis ul { padding-left: 1.25rem; margin-bottom: 0.75rem; }
                      .ai-analysis li { color: #374151; font-size: 0.875rem; margin-bottom: 0.3rem; line-height: 1.55; }
                      .ai-analysis strong { color: #111827; font-weight: 600; }
                    `}</style>
                    <Streamdown>{streamedText}</Streamdown>
                    {isStreaming && (
                      <span className="inline-block w-0.5 h-4 bg-orange-400 animate-pulse ml-0.5 align-middle" />
                    )}
                  </div>
                )}

                {/* Error state */}
                {phase === "error" && (
                  <div className="flex items-start gap-3 text-red-600 bg-red-50 rounded-xl p-4 border border-red-200">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-sm mb-1">AI Analysis Failed</div>
                      <div className="text-xs">{errorMsg}</div>
                      <button
                        onClick={() => handleCompare(true)}
                        className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-800"
                      >
                        <RotateCcw size={11} /> Try Again
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Cached result banner */}
            {fromCache && phase === "cached" && (
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
                <Clock size={16} className="shrink-0" />
                <div className="flex-1">
                  This is a cached result from a previous comparison. The data table above is always live.
                </div>
                <button
                  onClick={handleRefresh}
                  className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 shrink-0"
                >
                  <RefreshCw size={12} /> Refresh
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── How It Works ─────────────────────────────────────────────────── */}
        {phase === "idle" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">How It Works</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                {
                  step: "1",
                  title: "Select Two Plans",
                  desc: "Choose your current plan and one you're considering switching to.",
                  color: "#006B3F",
                },
                {
                  step: "2",
                  title: "Instant Table",
                  desc: "A full side-by-side comparison table appears immediately — no waiting.",
                  color: "#F47920",
                  badge: "Instant",
                },
                {
                  step: "3",
                  title: "AI Streams In",
                  desc: "Claude Haiku analyzes both plans and streams a recommendation in 3-5 seconds.",
                  color: "#006B3F",
                  badge: "~3-5s",
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ backgroundColor: item.color }}
                  >
                    {item.step}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-bold text-gray-800">{item.title}</div>
                      {item.badge && (
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: item.color }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
