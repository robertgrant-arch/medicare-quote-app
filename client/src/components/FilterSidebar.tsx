// FilterSidebar component — plan filtering controls
// Design: Bold Civic Design | Primary: #006B3F

import { useState } from "react";
import { SlidersHorizontal, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import type { FilterState, PlanType, Carrier } from "@/lib/types";

interface FilterSidebarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  totalCount: number;
  filteredCount: number;
  availableCarriers?: string[]; // Dynamic carriers from real plan data
}

const PLAN_TYPES: PlanType[] = ["HMO", "PPO", "PFFS", "SNP"];
const DEFAULT_CARRIERS: string[] = ["UnitedHealthcare", "Humana", "Aetna", "Cigna", "WellCare", "Blue KC"];
const BENEFITS_LIST = [
  { key: "dental", label: "Dental Coverage" },
  { key: "vision", label: "Vision Coverage" },
  { key: "hearing", label: "Hearing Coverage" },
  { key: "otc", label: "OTC Benefits" },
  { key: "fitness", label: "Fitness/Gym" },
  { key: "transportation", label: "Transportation" },
  { key: "telehealth", label: "Telehealth" },
  { key: "meals", label: "Meals Benefit" },
];

function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 pb-4 mb-4">
      <button
        className="flex items-center justify-between w-full mb-3"
        onClick={() => setOpen(!open)}
      >
        <span className="filter-section-title">{title}</span>
        {open ? (
          <ChevronUp size={14} className="text-gray-400" />
        ) : (
          <ChevronDown size={14} className="text-gray-400" />
        )}
      </button>
      {open && children}
    </div>
  );
}

export default function FilterSidebar({
  filters,
  onChange,
  totalCount,
  filteredCount,
  availableCarriers,
}: FilterSidebarProps) {
  const CARRIERS = availableCarriers && availableCarriers.length > 0 ? availableCarriers : DEFAULT_CARRIERS;
  const togglePlanType = (type: PlanType) => {
    const current = filters.planType;
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    onChange({ ...filters, planType: updated });
  };

  const toggleCarrier = (carrier: string) => {
    const current = filters.carriers;
    const updated = current.includes(carrier)
      ? current.filter((c) => c !== carrier)
      : [...current, carrier];
    onChange({ ...filters, carriers: updated });
  };

  const toggleBenefit = (benefit: string) => {
    const current = filters.benefits;
    const updated = current.includes(benefit)
      ? current.filter((b) => b !== benefit)
      : [...current, benefit];
    onChange({ ...filters, benefits: updated });
  };

  const resetFilters = () => {
    onChange({
      planType: [],
      carriers: [],
      premiumRange: [0, 200],
      benefits: [],
      quickFilter: "all",
      sortBy: "best-match",
    });
  };

  const hasActiveFilters =
    filters.planType.length > 0 ||
    filters.carriers.length > 0 ||
    filters.benefits.length > 0 ||
    filters.premiumRange[0] > 0 ||
    filters.premiumRange[1] < 200;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 sticky top-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} style={{ color: "#006B3F" }} />
          <span className="font-bold text-gray-900 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Filter Plans
          </span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-red-500 transition-colors"
          >
            <RotateCcw size={11} />
            Reset
          </button>
        )}
      </div>

      {/* Results count */}
      <div
        className="text-xs font-semibold px-3 py-2 rounded-lg mb-5 text-center"
        style={{ backgroundColor: "#E8F5EE", color: "#006B3F" }}
      >
        Showing {filteredCount} of {totalCount} plans
      </div>

      {/* Sort By */}
      <FilterSection title="Sort By">
        <select
          value={filters.sortBy}
          onChange={(e) =>
            onChange({ ...filters, sortBy: e.target.value as FilterState["sortBy"] })
          }
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-green-600"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          <option value="best-match">Best Match</option>
          <option value="premium-low">Premium: Low to High</option>
          <option value="premium-high">Premium: High to Low</option>
          <option value="star-rating">Star Rating</option>
          <option value="moop-low">Lowest Out-of-Pocket Max</option>
        </select>
      </FilterSection>

      {/* Plan Type */}
      <FilterSection title="Plan Type">
        <div className="space-y-2">
          {PLAN_TYPES.map((type) => (
            <label key={type} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.planType.includes(type)}
                onChange={() => togglePlanType(type)}
                className="w-4 h-4 rounded border-gray-300 accent-green-700"
              />
              <span className="text-sm text-gray-700 group-hover:text-green-800 transition-colors font-medium">
                {type}
              </span>
              <span className="ml-auto text-xs text-gray-400">
                {type === "HMO" ? "12" : type === "PPO" ? "10" : type === "SNP" ? "1" : "1"}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Insurance Company */}
      <FilterSection title="Insurance Company">
        <div className="space-y-2">
          {CARRIERS.map((carrier) => (
            <label key={carrier} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.carriers.includes(carrier)}
                onChange={() => toggleCarrier(carrier)}
                className="w-4 h-4 rounded border-gray-300 accent-green-700"
              />
              <span className="text-sm text-gray-700 group-hover:text-green-800 transition-colors font-medium">
                {carrier}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Monthly Premium */}
      <FilterSection title="Monthly Premium">
        <div className="space-y-3">
          <div className="flex justify-between text-xs text-gray-500 font-medium">
            <span>${filters.premiumRange[0]}/mo</span>
            <span>${filters.premiumRange[1] >= 200 ? "200+" : filters.premiumRange[1]}/mo</span>
          </div>
          <input
            type="range"
            min={0}
            max={200}
            step={10}
            value={filters.premiumRange[1]}
            onChange={(e) =>
              onChange({ ...filters, premiumRange: [filters.premiumRange[0], Number(e.target.value)] })
            }
            className="w-full accent-green-700"
          />
          <div className="flex gap-2">
            {[0, 25, 50, 100].map((val) => (
              <button
                key={val}
                onClick={() => onChange({ ...filters, premiumRange: [0, val === 0 ? 0 : val] })}
                className="flex-1 text-xs py-1 rounded border transition-colors font-medium"
                style={{
                  borderColor: filters.premiumRange[1] <= val || (val === 0 && filters.premiumRange[1] === 0) ? "#006B3F" : "#E5E7EB",
                  color: filters.premiumRange[1] <= val || (val === 0 && filters.premiumRange[1] === 0) ? "#006B3F" : "#6B7280",
                  backgroundColor: filters.premiumRange[1] <= val || (val === 0 && filters.premiumRange[1] === 0) ? "#E8F5EE" : "transparent",
                }}
              >
                {val === 0 ? "$0" : `$${val}`}
              </button>
            ))}
          </div>
        </div>
      </FilterSection>

      {/* Benefits */}
      <FilterSection title="Must-Have Benefits" defaultOpen={false}>
        <div className="space-y-2">
          {BENEFITS_LIST.map((b) => (
            <label key={b.key} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.benefits.includes(b.key)}
                onChange={() => toggleBenefit(b.key)}
                className="w-4 h-4 rounded border-gray-300 accent-green-700"
              />
              <span className="text-sm text-gray-700 group-hover:text-green-800 transition-colors font-medium">
                {b.label}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Help CTA */}
      <div
        className="rounded-xl p-4 text-center"
        style={{ backgroundColor: "#E8F5EE" }}
      >
        <div className="text-xs font-bold text-gray-700 mb-1">Need Help Choosing?</div>
        <div className="text-xs text-gray-500 mb-3">
          Speak with a licensed Medicare agent — free, no obligation.
        </div>
        <a
          href="tel:1-800-555-0100"
          className="block w-full py-2 rounded-lg text-xs font-bold text-white text-center transition-all"
          style={{ backgroundColor: "#F47920" }}
        >
          Call 1-800-555-0100
        </a>
      </div>
    </div>
  );
}
