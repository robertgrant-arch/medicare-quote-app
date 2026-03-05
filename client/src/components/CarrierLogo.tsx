// CarrierLogo component — renders carrier brand logo with color
import type { Carrier } from "@/lib/types";
import { CARRIER_COLORS } from "@/lib/mockData";

interface CarrierLogoProps {
  carrier: Carrier;
  size?: "sm" | "md" | "lg";
}

const CARRIER_ABBR: Record<Carrier, string> = {
  UnitedHealthcare: "UHC",
  Humana: "HUM",
  Aetna: "AET",
  Cigna: "CGN",
  WellCare: "WLC",
  "Blue KC": "BKC",
};

const CARRIER_FULL: Record<Carrier, string[]> = {
  UnitedHealthcare: ["United", "HealthCare"],
  Humana: ["Humana"],
  Aetna: ["Aetna"],
  Cigna: ["Cigna"],
  WellCare: ["WellCare"],
  "Blue KC": ["Blue KC"],
};

export default function CarrierLogo({ carrier, size = "md" }: CarrierLogoProps) {
  const colors = CARRIER_COLORS[carrier];
  const lines = CARRIER_FULL[carrier];

  const dimensions = {
    sm: { width: 64, height: 32, fontSize: "9px", abbr: "10px" },
    md: { width: 96, height: 44, fontSize: "10px", abbr: "12px" },
    lg: { width: 120, height: 52, fontSize: "11px", abbr: "14px" },
  }[size];

  return (
    <div
      className="rounded-lg flex items-center justify-center font-bold shadow-sm"
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        width: dimensions.width,
        height: dimensions.height,
        fontFamily: "'DM Sans', sans-serif",
        flexShrink: 0,
      }}
    >
      {lines.length === 1 ? (
        <span style={{ fontSize: dimensions.abbr }}>{lines[0]}</span>
      ) : (
        <div className="text-center leading-tight">
          {lines.map((line, i) => (
            <div key={i} style={{ fontSize: dimensions.fontSize }}>
              {line}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
