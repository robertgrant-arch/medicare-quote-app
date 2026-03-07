// DoctorsModal — Add doctors to check in-network coverage
// Design: Bold Civic Design | Primary: #1B365D | CTA: #C41E3A

import { useState } from "react";
import { X, UserRound, Search, Plus, Trash2, CheckCircle2, MapPin } from "lucide-react";
import { POPULAR_DOCTORS } from "@/lib/mockData";
import type { Doctor } from "@/lib/types";

interface DoctorsModalProps {
  open: boolean;
  onClose: () => void;
  selectedDoctors: Doctor[];
  onSave: (doctors: Doctor[]) => void;
}

export default function DoctorsModal({ open, onClose, selectedDoctors, onSave }: DoctorsModalProps) {
  const [search, setSearch] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>(selectedDoctors);

  if (!open) return null;

  const filteredDoctors = POPULAR_DOCTORS.filter(
    (d) =>
      (d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.specialty.toLowerCase().includes(search.toLowerCase())) &&
      !doctors.find((sd) => sd.id === d.id)
  );

  const addDoctor = (doctor: Doctor) => {
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
                Check if your doctors are in-network
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
              placeholder="Search by doctor name or specialty..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B365D] transition-colors"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            />
          </div>

          {/* Added doctors */}
          {doctors.length > 0 && (
            <div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Your Doctors ({doctors.length})
              </div>
              <div className="space-y-2">
                {doctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    className="flex items-start justify-between p-3 rounded-xl border"
                    style={{ borderColor: "#C8D8F5", backgroundColor: "#F0FBF4" }}
                  >
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 size={16} style={{ color: "#1B365D" }} className="mt-0.5 shrink-0" />
                      <div>
                        <div className="text-sm font-semibold text-gray-800">{doctor.name}</div>
                        <div className="text-xs text-gray-500">{doctor.specialty}</div>
                        <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <MapPin size={10} />
                          {doctor.address}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeDoctor(doctor.id)}
                      className="p-1.5 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors shrink-0"
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
              {search ? "Search Results" : "Doctors in Your Area"}
            </div>
            {filteredDoctors.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm">
                {search ? `No results for "${search}"` : "All nearby doctors added"}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredDoctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    className="flex items-start justify-between p-3 rounded-xl border border-gray-100 hover:border-[#C8D8F5] hover:bg-[#E8F0FE]/30 transition-all cursor-pointer"
                    onClick={() => addDoctor(doctor)}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{ backgroundColor: "#F3F4F6" }}
                      >
                        <UserRound size={14} className="text-gray-500" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-800">{doctor.name}</div>
                        <div className="text-xs text-gray-500">{doctor.specialty}</div>
                        <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <MapPin size={10} />
                          {doctor.address}
                        </div>
                      </div>
                    </div>
                    <button
                      className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors shrink-0 mt-0.5"
                      style={{ color: "#1B365D", backgroundColor: "#E8F0FE" }}
                    >
                      <Plus size={12} />
                      Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info note */}
          <div
            className="rounded-xl p-3 text-xs text-gray-600"
            style={{ backgroundColor: "#FFF3E0", border: "1px solid #FED7AA" }}
          >
            <strong>Note:</strong> Doctor network information is based on mock data for demonstration
            purposes. Always verify with the insurance carrier before enrolling.
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
            style={{ backgroundColor: "#1B365D" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#004D2C";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#1B365D";
            }}
          >
            Save {doctors.length > 0 ? `(${doctors.length}) ` : ""}Doctors
          </button>
        </div>
      </div>
    </div>
  );
}
