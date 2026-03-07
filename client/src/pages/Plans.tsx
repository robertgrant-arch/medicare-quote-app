// Medicare Advantage Quote Engine — Plans Results Page
// Design: Chapter-style | Navy #1B365D | Red #C41E3A | Light Blue #E8F0FE
// Layout: Sticky top bar + horizontal quick filters + 2-col plan grid + left filter sidebar

import { useState, useMemo, useEffect } from "react";
import { useSearch, useLocation, Link } from "wouter";
import {
  MapPin,
  Pill,
  UserRound,
  Heart,
  ArrowLeft,
  SlidersHorizontal,
  X,
  ChevronDown,
  LayoutGrid,
  List,
  Search,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import PlanCard from "@/components/PlanCard";
import FilterSidebar from "@/components/FilterSidebar";
import RxDrugsModal from "@/components/RxDrugsModal";
import DoctorsModal from "@/components/DoctorsModal";
import EnrollModal from "@/components/EnrollModal";
import type { FilterState, MedicarePlan, RxDrug, Doctor } from "@/lib/types";

const DEFAULT_FILTERS: FilterState = {
  planType: [],
  carriers: [],
  premiumRange: [0, 200],
  benefits: [],
  quickFilter: "all",
  sortBy: "best-match",
};

function applyFilters(plans: MedicarePlan[], filters: FilterState): MedicarePlan[] {
  let result = [...plans];

  // Quick filter
  if (filters.quickFilter === "ppo") {
    result = result.filter((p) => p.planType === "PPO");
  } else if (filters.quickFilter === "hmo") {
    result = result.filter((p) => p.planType === "HMO");
  } else if (filters.quickFilter === "zero-premium") {
    result = result.filter((p) => p.premium === 0);
  }

  // Plan type
  if (filters.planType.length > 0) {
    result = result.filter((p) => filters.planType.includes(p.planType));
  }

  // Carriers
  if (filters.carriers.length > 0) {
    result = result.filter((p) => filters.carriers.includes(p.carrier));
  }

  // Premium range
  result = result.filter(
    (p) => p.premium >= filters.premiumRange[0] && p.premium <= filters.premiumRange[1]
  );

  // Benefits
  if (filters.benefits.length > 0) {
    result = result.filter((p) =>
      filters.benefits.every(
        (b) => p.extraBenefits[b as keyof typeof p.extraBenefits]?.covered
      )
    );
  }

  // Sort
  switch (filters.sortBy) {
    case "premium-low":
      result.sort((a, b) => a.premium - b.premium);
      break;
    case "premium-high":
      result.sort((a, b) => b.premium - a.premium);
      break;
    case "star-rating":
      result.sort((a, b) => b.starRating.overall - a.starRating.overall);
      break;
    case "moop-low":
      result.sort((a, b) => a.maxOutOfPocket - b.maxOutOfPocket);
      break;
    default:
      // best-match: best match first, then most popular, then by star rating
      result.sort((a, b) => {
        if (a.isBestMatch && !b.isBestMatch) return -1;
        if (!a.isBestMatch && b.isBestMatch) return 1;
        if (a.isMostPopular && !b.isMostPopular) return -1;
        if (!a.isMostPopular && b.isMostPopular) return 1;
        return b.starRating.overall - a.starRating.overall;
      });
  }

  return result;
}

export default function Plans() {
  const searchStr = useSearch();
  const [, navigate] = useLocation();
  const params = new URLSearchParams(searchStr);
  const zip = params.get("zip") || "64106";

  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [rxDrugs, setRxDrugs] = useState<RxDrug[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [rxModalOpen, setRxModalOpen] = useState(false);
  const [doctorsModalOpen, setDoctorsModalOpen] = useState(false);
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [enrollPlan, setEnrollPlan] = useState<MedicarePlan | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [zipInput, setZipInput] = useState(zip);
  // Inline compare: only one card can be active at a time
  const [activeCompareId, setActiveCompareId] = useState<string | null>(null);
  const [plans, setPlans] = useState<MedicarePlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [locationInfo, setLocationInfo] = useState<{ stateAbbr: string; countyName: string } | null>(null);

  const handleCompareActivate = (planId: string | null) => {
    setActiveCompareId(planId);
  };

  // Fetch real CMS plans when ZIP changes
  useEffect(() => {
    if (!zip || !/^\d{5}$/.test(zip)) return;
    setPlansLoading(true);
    setPlansError(null);
    fetch(`/api/plans?zip=${zip}`)
      .then((r) => r.json())
      .then((data: { plans?: MedicarePlan[]; location?: { stateAbbr: string; countyName: string }; error?: string }) => {
        if (data.error) {
          setPlansError(data.error);
          setPlans([]);
        } else {
          setPlans(data.plans ?? []);
          setLocationInfo(data.location ?? null);
        }
      })
      .catch((err: Error) => {
        setPlansError("Failed to load plans. Please try again.");
        console.error("[Plans] fetch error:", err);
      })
      .finally(() => setPlansLoading(false));
  }, [zip]);

  // Server returns title-case county name; just append state
  const countyName = locationInfo ? `${locationInfo.countyName}, ${locationInfo.stateAbbr}` : "Loading...";

  const filteredPlans = useMemo(() => {
    let result = applyFilters(plans, filters);
    if (showFavoritesOnly) {
      result = result.filter((p) => favorites.has(p.id));
    }
    return result;
  }, [plans, filters, showFavoritesOnly, favorites]);

  // Memoize available carriers to avoid re-creating on every render
  const availableCarriers = useMemo(
    () => Array.from(new Set(plans.map((p) => p.carrier))).sort(),
    [plans]
  );

  // Dynamic quick filter counts based on loaded plans
  const QUICK_FILTERS = useMemo(() => [
    { key: "all" as const, label: "All Plans", count: plans.length },
    { key: "ppo" as const, label: "PPO", count: plans.filter((p) => p.planType === "PPO").length },
    { key: "zero-premium" as const, label: "$0 Premium", count: plans.filter((p) => p.premium === 0).length },
    { key: "hmo" as const, label: "HMO", count: plans.filter((p) => p.planType === "HMO").length },
  ], [plans]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast.success("Plan removed from saved plans");
      } else {
        next.add(id);
        toast.success("Plan saved!", {
          description: "View your saved plans anytime",
          icon: "❤️",
        });
      }
      return next;
    });
  };

  const handleEnroll = (plan: MedicarePlan) => {
    setEnrollPlan(plan);
    setEnrollModalOpen(true);
  };

  const handleZipSearch = () => {
    if (/^\d{5}$/.test(zipInput.trim())) {
      navigate(`/plans?zip=${zipInput.trim()}`);
    }
  };

  const activeFilterCount =
    filters.planType.length +
    filters.carriers.length +
    filters.benefits.length +
    (filters.premiumRange[1] < 200 ? 1 : 0);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F7F8FA" }}>
      <Header />

      {/* ── Results Header Bar ────────────────────────────────────────────── */}
      <div className="bg-white border-b" style={{ borderColor: "#E8F0FE", boxShadow: "0 1px 8px rgba(27,54,93,0.08)" }}>
        <div className="container py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Breadcrumb + location */}
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="flex items-center gap-1.5 text-sm font-medium no-underline transition-colors"
              style={{ color: "#6B7280" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#1B365D"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#6B7280"; }}
              >
                <ArrowLeft size={15} />
                <span className="hidden sm:inline">Back</span>
              </Link>
              <div className="w-px h-4 bg-gray-200" />
              <div className="flex items-center gap-1.5">
                <MapPin size={15} style={{ color: "#C41E3A" }} />
                <span className="text-sm font-semibold text-gray-800">
                  ZIP {zip} · {countyName}
                </span>
              </div>
            </div>

            {/* ZIP change + tools */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* ZIP input */}
              <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  value={zipInput}
                  onChange={(e) => setZipInput(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => e.key === "Enter" && handleZipSearch()}
                  className="w-20 px-2.5 py-1.5 text-sm font-semibold text-gray-700 focus:outline-none"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                />
                <button
                  onClick={handleZipSearch}
                  className="px-2.5 py-1.5 text-white text-xs font-semibold"
                  style={{ backgroundColor: "#1B365D" }}
                >
                  <Search size={13} />
                </button>
              </div>

              {/* Add Rx */}
              <button
                onClick={() => setRxModalOpen(true)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all"
                style={{
                  borderColor: rxDrugs.length > 0 ? "#1B365D" : "#E5E7EB",
                  color: rxDrugs.length > 0 ? "#1B365D" : "#374151",
                  backgroundColor: rxDrugs.length > 0 ? "#E8F0FE" : "white",
                }}
              >
                <Pill size={13} />
                {rxDrugs.length > 0 ? `${rxDrugs.length} Drug${rxDrugs.length > 1 ? "s" : ""}` : "Add Rx Drugs"}
              </button>

              {/* Add Doctors */}
              <button
                onClick={() => setDoctorsModalOpen(true)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all"
                style={{
                  borderColor: doctors.length > 0 ? "#1B365D" : "#E5E7EB",
                  color: doctors.length > 0 ? "#1B365D" : "#374151",
                  backgroundColor: doctors.length > 0 ? "#E8F0FE" : "white",
                }}
              >
                <UserRound size={13} />
                {doctors.length > 0 ? `${doctors.length} Doctor${doctors.length > 1 ? "s" : ""}` : "Add Doctors"}
              </button>

              {/* Saved plans */}
              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all"
                style={{
                  borderColor: showFavoritesOnly ? "#EF4444" : "#E5E7EB",
                  color: showFavoritesOnly ? "#EF4444" : "#374151",
                  backgroundColor: showFavoritesOnly ? "#FEF2F2" : "white",
                }}
              >
                <Heart
                  size={13}
                  className={showFavoritesOnly ? "fill-red-500 text-red-500" : ""}
                />
                {favorites.size > 0 ? `Saved (${favorites.size})` : "Saved"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Filter Tabs ─────────────────────────────────────────────── */}
      <div className="bg-white border-b" style={{ borderColor: "#E8F0FE" }}>
        <div className="container">
          <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide">
            {QUICK_FILTERS.map((qf) => (
              <button
                key={qf.key}
                onClick={() => setFilters({ ...filters, quickFilter: qf.key })}
                className={`quick-filter-tab whitespace-nowrap ${filters.quickFilter === qf.key ? "active" : ""}`}
              >
                {qf.label}
                <span
                  className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: filters.quickFilter === qf.key ? "rgba(255,255,255,0.3)" : "#E8F0FE",
                    color: filters.quickFilter === qf.key ? "white" : "#1B365D",
                  }}
                >
                  {qf.count}
                </span>
              </button>
            ))}

            <div className="ml-auto flex items-center gap-2 shrink-0">
              {/* Mobile filter toggle */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700"
              >
                <SlidersHorizontal size={13} />
                Filters
                {activeFilterCount > 0 && (
                  <span
                    className="w-4 h-4 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                    style={{ backgroundColor: "#1B365D" }}
                  >
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* View mode toggle */}
              <div className="hidden sm:flex border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className="p-1.5 transition-colors"
                  style={{
                    backgroundColor: viewMode === "grid" ? "#1B365D" : "white",
                    color: viewMode === "grid" ? "white" : "#6B7280",
                  }}
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className="p-1.5 transition-colors"
                  style={{
                    backgroundColor: viewMode === "list" ? "#1B365D" : "white",
                    color: viewMode === "list" ? "white" : "#6B7280",
                  }}
                >
                  <List size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <div className="container py-6">
        <div className="flex gap-6">
          {/* ── Left Sidebar ──────────────────────────────────────────────── */}
          <aside className="hidden lg:block w-64 shrink-0">
            <FilterSidebar
              filters={filters}
              onChange={setFilters}
              totalCount={plans.length}
              filteredCount={filteredPlans.length}
              availableCarriers={availableCarriers}
            />
          </aside>

          {/* ── Plan Grid ─────────────────────────────────────────────────── */}
          <main className="flex-1 min-w-0">
            {/* Results summary */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1
                  className="text-xl font-bold"
                  style={{ color: "#1B365D", fontFamily: "'Inter', sans-serif" }}
                >
                  {showFavoritesOnly ? "Saved Plans" : "Medicare Advantage Plans"}
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {filteredPlans.length} plan{filteredPlans.length !== 1 ? "s" : ""} available
                  {showFavoritesOnly ? " (saved)" : ` in ${countyName}`}
                  {activeFilterCount > 0 && (
                    <span className="ml-2 text-xs font-semibold" style={{ color: "#1B365D" }}>
                      · {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} applied
                    </span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* AI Compare button */}
                <Link
                  href="/ai-compare"
                  className="hidden sm:flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg no-underline transition-all"
                  style={{ backgroundColor: "#FDEEF1", color: "#C41E3A", border: "1.5px solid rgba(196,30,58,0.2)" }}
                >
                  <Sparkles size={12} />
                  AI Compare
                </Link>
                {/* Active filter chips */}
                {activeFilterCount > 0 && (
                  <button
                    onClick={() => setFilters(DEFAULT_FILTERS)}
                    className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
                  >
                    <X size={12} />
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            {/* Personalization banner */}
            {(rxDrugs.length > 0 || doctors.length > 0) && (
              <div
                className="rounded-xl p-3 mb-4 flex items-center gap-3 border"
                style={{ backgroundColor: "#E8F0FE", borderColor: "#C8D8F5" }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "#1B365D" }}
                >
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
                <div className="text-sm text-gray-700">
                  <span className="font-semibold">Personalized for you:</span>{" "}
                  {rxDrugs.length > 0 && `${rxDrugs.length} medication${rxDrugs.length > 1 ? "s" : ""}`}
                  {rxDrugs.length > 0 && doctors.length > 0 && " · "}
                  {doctors.length > 0 && `${doctors.length} doctor${doctors.length > 1 ? "s" : ""}`}
                  <span className="text-gray-500"> added to your profile</span>
                </div>
                <button
                  onClick={() => { setRxDrugs([]); setDoctors([]); }}
                  className="ml-auto text-xs text-gray-500 hover:text-red-500 transition-colors"
                >
                  <X size={13} />
                </button>
              </div>
            )}

            {/* Loading state */}
            {plansLoading && (
              <div className="text-center py-16">
                <div className="w-12 h-12 rounded-full border-4 animate-spin mx-auto mb-4" style={{ borderColor: "#E8F0FE", borderTopColor: "#1B365D" }} />
                <p className="text-gray-500 font-medium">Loading Medicare Advantage plans for ZIP {zip}…</p>
                <p className="text-xs text-gray-400 mt-1">Fetching real CMS 2026 data — this may take 10–20 seconds on first load</p>
              </div>
            )}

            {/* Error state */}
            {plansError && (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-red-50">
                  <Search size={28} className="text-red-400" />
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: "#1B365D", fontFamily: "'Inter', sans-serif" }}>No Plans Found</h3>
                <p className="text-gray-500 mb-4">{plansError}</p>
                <p className="text-sm text-gray-400">Try a different ZIP code or check back later.</p>
              </div>
            )}

            {/* No results */}
            {!plansLoading && !plansError && filteredPlans.length === 0 ? (
              <div className="text-center py-16">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: "#E8F0FE" }}
                >
                  <Search size={28} style={{ color: "#1B365D" }} />
                </div>
                <h3
                  className="text-xl font-bold mb-2"
                  style={{ color: "#1B365D", fontFamily: "'Inter', sans-serif" }}
                >
                  No plans match your filters
                </h3>
                <p className="text-gray-500 mb-6">
                  Try adjusting your filters or clearing them to see all available plans.
                </p>
                <button
                  onClick={() => setFilters(DEFAULT_FILTERS)}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ backgroundColor: "#C41E3A" }}
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 xl:grid-cols-2 gap-5"
                    : "flex flex-col gap-4"
                }
              >
                {filteredPlans.map((plan, i) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    isFavorited={favorites.has(plan.id)}
                    onToggleFavorite={toggleFavorite}
                    onEnroll={handleEnroll}
                    animationDelay={Math.min(i * 60, 400)}
                    isCompareActive={activeCompareId === plan.id}
                    onCompareActivate={handleCompareActivate}
                  />
                ))}
              </div>
            )}

            {/* Bottom disclaimer */}
            <div className="mt-8 p-4 rounded-xl bg-white" style={{ border: "1px solid #E8F0FE" }}>
              <p className="text-xs text-gray-400 leading-relaxed">
                <strong className="text-gray-500">Data Source:</strong> Plan information is sourced from the CMS CY2026 Medicare Advantage Landscape file. Benefit details are AI-estimated. Always verify plan details directly with the insurance carrier before enrolling. Medicare has neither reviewed nor endorsed this information.
              </p>
            </div>
          </main>
        </div>
      </div>

      {/* ── Mobile Filter Drawer ──────────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <span className="font-bold" style={{ color: "#1B365D", fontFamily: "'Inter', sans-serif" }}>Filter Plans</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4">
              <FilterSidebar
                filters={filters}
                onChange={(f) => { setFilters(f); setSidebarOpen(false); }}
                totalCount={plans.length}
                filteredCount={filteredPlans.length}
                availableCarriers={availableCarriers}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      <RxDrugsModal
        open={rxModalOpen}
        onClose={() => setRxModalOpen(false)}
        selectedDrugs={rxDrugs}
        onSave={setRxDrugs}
      />
      <DoctorsModal
        open={doctorsModalOpen}
        onClose={() => setDoctorsModalOpen(false)}
        selectedDoctors={doctors}
        onSave={setDoctors}
      />
      <EnrollModal
        open={enrollModalOpen}
        onClose={() => setEnrollModalOpen(false)}
        plan={enrollPlan}
      />
    </div>
  );
}
