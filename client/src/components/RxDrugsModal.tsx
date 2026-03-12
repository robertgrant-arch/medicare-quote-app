// RxDrugsModal — Add prescription drugs to personalize plan comparison
// Design: Bold Civic Design | Primary: #1B365D | CTA: #C41E3A
// Now uses live NIH RxTerms API for comprehensive drug search

import { useState, useEffect } from "react";
import { X, Pill, Search, Plus, Trash2, CheckCircle2, Loader2 } from "lucide-react";
import { POPULAR_RX_DRUGS } from "@/lib/mockData";
import type { RxDrug } from "@/lib/types";

const RXTERMS_API = "https://clinicaltables.nlm.nih.gov/api/rxterms/v3/search";

interface RxTermsResult {
  displayName: string;
  strengths: string[];
  rxcuis: string[];
}

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

async function searchRxTerms(term: string): Promise<RxTermsResult[]> {
  if (!term || term.length < 2) return [];
  const params = new URLSearchParams({
    terms: term,
    ef: "STRENGTHS_AND_FORMS,RXCUIS",
    maxList: "12",
  });
  const res = await fetch(`${RXTERMS_API}?${params}`);
  const data = await res.json();
  const count = data[0] as number;
  if (count === 0) return [];
  const names = data[1] as string[];
  const fields = data[2] as Record<string, string[][]>;
  const results: RxTermsResult[] = [];
  for (let i = 0; i < names.length; i++) {
    results.push({
      displayName: names[i],
      strengths: fields["STRENGTHS_AND_FORMS"]?.[i] || [],
      rxcuis: fields["RXCUIS"]?.[i] || [],
    });
  }
  return results;
}

function parseDrugName(displayName: string): { name: string; route: string } {
  const match = displayName.match(/^(.+?)\s*\((.+)\)$/);
  if (match) return { name: match[1].trim(), route: match[2].trim() };
  return { name: displayName, route: "" };
}

interface RxDrugsModalProps {
  open: boolean;
  onClose: () => void;
  selectedDrugs: RxDrug[];
  onSave: (drugs: RxDrug[]) => void;
}

export default function RxDrugsModal({ open, onClose, selectedDrugs, onSave }: RxDrugsModalProps) {
  const [search, setSearch] = useState("");
  const [drugs, setDrugs] = useState<RxDrug[]>(selectedDrugs);
  const [apiResults, setApiResults] = useState<RxTermsResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [expandedDrug, setExpandedDrug] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setApiResults([]);
      setHasSearched(false);
      setExpandedDrug(null);
    } else {
      setDrugs(selectedDrugs);
    }
  }, [open, selectedDrugs]);

  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) {
      setApiResults([]);
      setHasSearched(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    searchRxTerms(debouncedSearch).then((results) => {
      if (!cancelled) {
        setApiResults(results);
        setIsLoading(false);
        setHasSearched(true);
      }
    }).catch(() => {
      if (!cancelled) {
        setApiResults([]);
        setIsLoading(false);
        setHasSearched(true);
      }
    });
    return () => { cancelled = true; };
  }, [debouncedSearch]);

  if (!open) return null;

  // Fallback: filter mock data for common meds when no search
  const commonDrugs = POPULAR_RX_DRUGS.filter(
    (d) => !drugs.find((sd) => sd.id === d.id)
  ).slice(0, 8);

  const addDrug = (drug: RxDrug) => {
    setDrugs([...drugs, drug]);
  };

  const addFromApi = (result: RxTermsResult, strength?: string, rxcui?: string) => {
    const { name } = parseDrugName(result.displayName);
    const dosage = strength || (result.strengths[0] || "");
    const drug: RxDrug = {
      id: rxcui || `rx-${name}-${dosage}`.replace(/\s+/g, "-").toLowerCase(),
      name: name,
      dosage: dosage.trim(),
      frequency: "Once daily",
      isGeneric: !name.match(/^[A-Z]/),
    };
    setDrugs([...drugs, drug]);
    setExpandedDrug(null);
  };

  const removeDrug = (id: string) => {
    setDrugs(drugs.filter((d) => d.id !== id));
  };

  const handleSave = () => {
    onSave(drugs);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
        style={{ animation: "fadeInUp 0.25s ease" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-5 border-b border-gray-100"
          style={{ backgroundColor: "#F7F8FA" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "#E8F0FE" }}
            >
              <Pill size={20} style={{ color: "#1B365D" }} />
            </div>
            <div>
              <h2
                className="text-lg font-bold text-gray-900"
                style={{ fontFamily: "'Inter', serif" }}
              >
                Add Your Prescriptions
              </h2>
              <p className="text-xs text-gray-500">
                See how plans cover your medications
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-500"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            {isLoading ? (
              <Loader2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
            ) : (
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            )}
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search any drug name (e.g. Crestor, Metformin)..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B365D] transition-colors"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
              autoFocus
            />
          </div>
          {search.length > 0 && search.length < 2 && (
            <p className="text-xs text-gray-400 mt-1 ml-1">Type at least 2 characters to search</p>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5" style={{ maxHeight: "50vh" }}>
          {/* Added drugs */}
          {drugs.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Your Medications ({drugs.length})
              </p>
              {drugs.map((drug) => (
                <div
                  key={drug.id}
                  className="flex items-center justify-between p-3 rounded-xl mb-2"
                  style={{ backgroundColor: "#F0F7F0" }}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{drug.name}</p>
                      <p className="text-xs text-gray-500">
                        {drug.dosage} {drug.dosage && drug.frequency ? " \u00b7 " : ""}{drug.frequency}
                        {drug.isGeneric && (
                          <span className="ml-1.5 text-green-700 bg-green-50 px-1.5 py-0.5 rounded text-[10px] font-medium">Generic</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeDrug(drug.id)}
                    className="p-1.5 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* API Search Results */}
          {hasSearched && apiResults.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Search Results
              </p>
              {apiResults.map((result) => {
                const { name, route } = parseDrugName(result.displayName);
                const isExpanded = expandedDrug === result.displayName;
                return (
                  <div key={result.displayName} className="mb-2">
                    <div
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => {
                        if (result.strengths.length > 1) {
                          setExpandedDrug(isExpanded ? null : result.displayName);
                        } else {
                          addFromApi(result, result.strengths[0], result.rxcuis[0]);
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: "#E8F0FE" }}
                        >
                          <Pill size={14} style={{ color: "#1B365D" }} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{name}</p>
                          <p className="text-xs text-gray-500">
                            {route}{result.strengths.length > 1 ? ` \u00b7 ${result.strengths.length} strengths` : result.strengths[0] ? ` \u00b7 ${result.strengths[0]}` : ""}
                          </p>
                        </div>
                      </div>
                      <button
                        className="p-1.5 rounded-full hover:bg-blue-50 transition-colors"
                        style={{ color: "#1B365D" }}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    {isExpanded && result.strengths.length > 1 && (
                      <div className="ml-11 mt-1 space-y-1">
                        {result.strengths.map((strength, idx) => (
                          <button
                            key={strength}
                            onClick={() => addFromApi(result, strength, result.rxcuis[idx])}
                            className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-blue-50 text-gray-700 transition-colors"
                          >
                            {strength.trim()}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* No results */}
          {hasSearched && apiResults.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <Pill size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No results for "{search}"</p>
              <p className="text-xs text-gray-400 mt-1">Try a different name or spelling</p>
            </div>
          )}

          {/* Common Medications (when no search) */}
          {!hasSearched && !search && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Common Medications
              </p>
              {commonDrugs.map((drug) => (
                <div
                  key={drug.id}
                  className="flex items-center justify-between p-3 rounded-xl mb-2 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => addDrug(drug)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: "#E8F0FE" }}
                    >
                      <Pill size={14} style={{ color: "#1B365D" }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{drug.name}</p>
                      <p className="text-xs text-gray-500">
                        {drug.dosage} \u00b7 {drug.frequency}
                        {drug.isGeneric && (
                          <span className="ml-1.5 text-green-700 bg-green-50 px-1.5 py-0.5 rounded text-[10px] font-medium">Generic available</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <button className="text-xs font-medium px-2.5 py-1 rounded-lg hover:bg-blue-50 transition-colors" style={{ color: "#1B365D" }}>
                    + Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between p-4 border-t border-gray-100"
          style={{ backgroundColor: "#F7F8FA" }}
        >
          <p className="text-xs text-gray-500">
            {drugs.length} medication{drugs.length !== 1 ? "s" : ""} added
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-sm font-bold text-white rounded-xl transition-colors"
              style={{ backgroundColor: "#1B365D" }}
            >
              Save {drugs.length > 0 ? `(${drugs.length}) ` : ""}Medications
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
