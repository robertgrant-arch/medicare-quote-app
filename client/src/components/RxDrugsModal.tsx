// RxDrugsModal — Add prescription drugs to personalize plan comparison
// Design: Bold Civic Design | Primary: #006B3F | CTA: #F47920

import { useState } from "react";
import { X, Pill, Search, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { POPULAR_RX_DRUGS } from "@/lib/mockData";
import type { RxDrug } from "@/lib/types";

interface RxDrugsModalProps {
  open: boolean;
  onClose: () => void;
  selectedDrugs: RxDrug[];
  onSave: (drugs: RxDrug[]) => void;
}

export default function RxDrugsModal({ open, onClose, selectedDrugs, onSave }: RxDrugsModalProps) {
  const [search, setSearch] = useState("");
  const [drugs, setDrugs] = useState<RxDrug[]>(selectedDrugs);

  if (!open) return null;

  const filteredDrugs = POPULAR_RX_DRUGS.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) &&
      !drugs.find((sd) => sd.id === d.id)
  );

  const addDrug = (drug: RxDrug) => {
    setDrugs([...drugs, drug]);
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
          style={{ backgroundColor: "#F8FAF9" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "#E8F5EE" }}
            >
              <Pill size={20} style={{ color: "#006B3F" }} />
            </div>
            <div>
              <h2
                className="text-lg font-bold text-gray-900"
                style={{ fontFamily: "'DM Serif Display', serif" }}
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

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Search */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search for a drug name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-600 transition-colors"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            />
          </div>

          {/* Added drugs */}
          {drugs.length > 0 && (
            <div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Your Medications ({drugs.length})
              </div>
              <div className="space-y-2">
                {drugs.map((drug) => (
                  <div
                    key={drug.id}
                    className="flex items-center justify-between p-3 rounded-xl border"
                    style={{ borderColor: "#C3E6D4", backgroundColor: "#F0FBF4" }}
                  >
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 size={16} style={{ color: "#006B3F" }} />
                      <div>
                        <div className="text-sm font-semibold text-gray-800">{drug.name}</div>
                        <div className="text-xs text-gray-500">
                          {drug.dosage} · {drug.frequency}
                          {drug.isGeneric && (
                            <span className="ml-2 text-green-700 font-medium">Generic</span>
                          )}
                        </div>
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
            </div>
          )}

          {/* Suggestions */}
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
              {search ? "Search Results" : "Common Medications"}
            </div>
            {filteredDrugs.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm">
                {search ? `No results for "${search}"` : "All common medications added"}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredDrugs.slice(0, 8).map((drug) => (
                  <div
                    key={drug.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50/30 transition-all cursor-pointer"
                    onClick={() => addDrug(drug)}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: "#F3F4F6" }}
                      >
                        <Pill size={13} className="text-gray-500" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-800">{drug.name}</div>
                        <div className="text-xs text-gray-500">
                          {drug.dosage} · {drug.frequency}
                          {drug.isGeneric && (
                            <span className="ml-2 text-green-700 font-medium">Generic available</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                      style={{ color: "#006B3F", backgroundColor: "#E8F5EE" }}
                    >
                      <Plus size={12} />
                      Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-md"
            style={{ backgroundColor: "#006B3F" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#004D2C";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#006B3F";
            }}
          >
            Save {drugs.length > 0 ? `(${drugs.length}) ` : ""}Medications
          </button>
        </div>
      </div>
    </div>
  );
}
