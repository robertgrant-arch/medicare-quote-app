// DoctorsModal — Add doctors to check in-network coverage
// Design: Bold Civic Design | Primary: #1B365D | CTA: #C41E3A

import { useState, useEffect, useCallback } from "react";
import { X, UserRound, Search, Plus, Trash2, CheckCircle2, MapPin, Loader2 } from "lucide-react";
import type { Doctor } from "@/lib/types";

const NPI_API_BASE = "https://clinicaltables.nlm.nih.gov/api/npi_idv/v3/search";

interface DoctorsModalProps {
  open: boolean;
  onClose: () => void;
  selectedDoctors: Doctor[];
  onSave: (doctors: Doctor[]) => void;
  zip?: string;
}

interface NpiResult {
  npi: string;
  name: string;
  specialty: string;
  address: string;
  phone: string;
}

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

async function searchNpiDoctors(term: string, state?: string): Promise<NpiResult[]> {
  if (!term || term.length < 2) return [];
  const params = new URLSearchParams({
    terms: term,
    maxList: "10",
    ef: "NPI,name.full,provider_type,addr_practice.full,addr_practice.phone",
  });
  if (state) {
    params.set("q", `addr_practice.state:${state}`);
  }
  const res = await fetch(`${NPI_API_BASE}?${params}`);
  const data = await res.json();
  const count = data[0] as number;
  if (count === 0) return [];
  const fields = data[2] as Record<string, string[]>;
  const results: NpiResult[] = [];
  for (let i = 0; i < fields["NPI"].length; i++) {
    results.push({
      npi: fields["NPI"][i],
      name: fields["name.full"][i],
      specialty: fields["provider_type"][i],
      address: fields["addr_practice.full"][i],
      phone: fields["addr_practice.phone"]?.[i] || "",
    });
  }
  return results;
}

export default function DoctorsModal({ open, onClose, selectedDoctors, onSave, zip }: DoctorsModalProps) {
  const [search, setSearch] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>(selectedDoctors);
  const [searchResults, setSearchResults] = useState<NpiResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debouncedSearch = useDebounce(search, 350);

  // Derive state from zip if available
  const state = zip ? undefined : undefined; // Could map zip to state later

  useEffect(() => {
    if (!open) {
      setSearch("");
      setSearchResults([]);
      setHasSearched(false);
    } else {
      setDoctors(selectedDoctors);
    }
  }, [open, selectedDoctors]);

  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    searchNpiDoctors(debouncedSearch, state).then((results) => {
      if (!cancelled) {
        setSearchResults(results);
        setIsLoading(false);
        setHasSearched(true);
      }
    }).catch(() => {
      if (!cancelled) {
        setSearchResults([]);
        setIsLoading(false);
        setHasSearched(true);
      }
    });
    return () => { cancelled = true; };
  }, [debouncedSearch, state]);

  if (!open) return null;

  const filteredResults = searchResults.filter(
    (r) => !doctors.find((d) => d.npi === r.npi)
  );

  const addDoctor = (result: NpiResult) => {
    const doctor: Doctor = {
      id: result.npi,
      name: result.name,
      specialty: result.specialty,
      npi: result.npi,
      address: result.address,
    };
    setDoctors([...doctors, doctor]);
  };

  const removeDoctor = (id: string) => {
    setDoctors(doctors.filter((d) => d.id !== id));
  };

  const handleSave = () => {
    onSave(doctors);
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
              <UserRound size={20} style={{ color: "#1B365D" }} />
            </div>
            <div>
              <h2
                className="text-lg font-bold text-gray-900"
                style={{ fontFamily: "'Inter', serif" }}
              >
                Add Your Doctors
              </h2>
              <p className="text-xs text-gray-500">
                Search the NPI registry to find your doctors
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
              <Loader2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
            ) : (
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            )}
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by doctor name (e.g. Smith, Johnson)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
              autoFocus
            />
          </div>
          {search.length > 0 && search.length < 2 && (
            <p className="text-xs text-gray-400 mt-1 ml-1">Type at least 2 characters to search</p>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: "50vh" }}>
          {/* Selected Doctors */}
          {doctors.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Your Doctors ({doctors.length})
              </p>
              {doctors.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between p-3 rounded-xl mb-2"
                  style={{ backgroundColor: "#F0F7F0" }}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{d.name}</p>
                      <p className="text-xs text-gray-500">{d.specialty}</p>
                      {d.address && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <MapPin size={10} />
                          {d.address}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeDoctor(d.id)}
                    className="p-1.5 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Search Results */}
          {filteredResults.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Search Results
              </p>
              {filteredResults.map((r) => (
                <div
                  key={r.npi}
                  className="flex items-center justify-between p-3 rounded-xl mb-2 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => addDoctor(r)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: "#E8F0FE" }}
                    >
                      <UserRound size={14} style={{ color: "#1B365D" }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{r.name}</p>
                      <p className="text-xs text-gray-500">{r.specialty}</p>
                      {r.address && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <MapPin size={10} />
                          {r.address}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    className="p-1.5 rounded-full hover:bg-blue-50 transition-colors"
                    style={{ color: "#1B365D" }}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Empty States */}
          {hasSearched && filteredResults.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <UserRound size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No doctors found for "{search}"</p>
              <p className="text-xs text-gray-400 mt-1">Try a different name or spelling</p>
            </div>
          )}

          {!hasSearched && doctors.length === 0 && (
            <div className="text-center py-8">
              <Search size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">Search for your doctors above</p>
              <p className="text-xs text-gray-400 mt-1">We'll check if they're in-network for each plan</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-100" style={{ backgroundColor: "#F7F8FA" }}>
          <p className="text-xs text-gray-500">
            {doctors.length} doctor{doctors.length !== 1 ? "s" : ""} added
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
              Save Doctors
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
