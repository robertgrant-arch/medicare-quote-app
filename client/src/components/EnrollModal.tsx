// EnrollModal — Enrollment confirmation modal
// Design: Bold Civic Design | Primary: #1B365D | CTA: #C41E3A

import { X, CheckCircle2, Phone, ExternalLink, Shield } from "lucide-react";
import type { MedicarePlan } from "@/lib/types";
import CarrierLogo from "./CarrierLogo";
import StarRating from "./StarRating";

interface EnrollModalProps {
  open: boolean;
  onClose: () => void;
  plan: MedicarePlan | null;
}

export default function EnrollModal({ open, onClose, plan }: EnrollModalProps) {
  if (!open || !plan) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md"
        style={{ animation: "fadeInUp 0.25s ease" }}
      >
        {/* Green header */}
        <div
          className="rounded-t-2xl p-6 text-white text-center relative"
          style={{ background: "linear-gradient(135deg, #004D2C, #1B365D)" }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X size={16} className="text-white" />
          </button>
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 size={28} className="text-white" />
          </div>
          <h2
            className="text-xl font-bold mb-1"
            style={{ fontFamily: "'Inter', serif" }}
          >
            Ready to Enroll?
          </h2>
          <p className="text-white/80 text-sm">
            You've selected a great plan. Here's how to complete your enrollment.
          </p>
        </div>

        <div className="p-6 space-y-5">
          {/* Plan summary */}
          <div
            className="rounded-xl p-4 border"
            style={{ backgroundColor: "#F7F8FA", borderColor: "#E5E7EB" }}
          >
            <div className="flex items-center gap-3 mb-3">
              <CarrierLogo carrier={plan.carrier} size="sm" />
              <div>
                <div className="text-xs text-gray-500 font-medium">{plan.carrier}</div>
                <div className="text-sm font-bold text-gray-900" style={{ fontFamily: "'Inter', serif" }}>
                  {plan.planName}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-lg font-bold" style={{ color: "#1B365D", fontFamily: "'Inter', serif" }}>
                  {plan.premium === 0 ? "$0" : `$${plan.premium}`}
                </div>
                <div className="text-[10px] text-gray-500">/month</div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-800" style={{ fontFamily: "'Inter', serif" }}>
                  ${plan.maxOutOfPocket.toLocaleString()}
                </div>
                <div className="text-[10px] text-gray-500">max OOP</div>
              </div>
              <div className="flex flex-col items-center">
                <StarRating rating={plan.starRating.overall} size={12} showLabel={false} />
                <div className="text-[10px] text-gray-500 mt-0.5">{plan.starRating.overall}★ rating</div>
              </div>
            </div>
          </div>

          {/* Enrollment options */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              Enrollment Options
            </div>

            <button
              className="w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left"
              style={{ borderColor: "#C41E3A", backgroundColor: "#FFF3E0" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: "#C41E3A" }}
                >
                  <ExternalLink size={16} className="text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">Enroll Online</div>
                  <div className="text-xs text-gray-500">Complete enrollment on the carrier's website</div>
                </div>
              </div>
              <span
                className="text-xs font-bold px-3 py-1.5 rounded-lg text-white"
                style={{ backgroundColor: "#C41E3A" }}
              >
                Go Now
              </span>
            </button>

            <button
              className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-green-300 hover:bg-[#E8F0FE]/30 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: "#E8F0FE" }}
                >
                  <Phone size={16} style={{ color: "#1B365D" }} />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">Call to Enroll</div>
                  <div className="text-xs text-gray-500">Speak with a licensed agent: 1-800-555-0100</div>
                </div>
              </div>
              <span
                className="text-xs font-bold px-3 py-1.5 rounded-lg"
                style={{ color: "#1B365D", backgroundColor: "#E8F0FE" }}
              >
                Call Now
              </span>
            </button>
          </div>

          {/* Disclaimer */}
          <div
            className="rounded-xl p-3 flex items-start gap-2"
            style={{ backgroundColor: "#F7F8FA" }}
          >
            <Shield size={13} className="text-gray-400 shrink-0 mt-0.5" />
            <p className="text-xs text-gray-500 leading-relaxed">
              This is a mock demonstration. Enrollment links are for illustration only. Always
              verify plan details with the carrier before enrolling.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
