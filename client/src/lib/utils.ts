import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


import type { MedicarePlan, Doctor, DoctorNetworkResult, PlanDoctorNetworkStatus } from "./types";

// ── Provider Network Check ────────────────────────────────────────────────────
// Deterministic hash-based network check for doctor/plan combinations.
// Uses NPI + contract ID to produce consistent results.
// PPO plans and larger networks have higher in-network probability.

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function checkSingleDoctor(npi: string, contractId: string, planId: string, carrier: string, planType: string, networkSize: number): boolean {
  const seed = hashCode(`${npi}-${contractId}-${planId}`);
  const normalized = (seed % 1000) / 1000;

  let probability = 0.65;

  // PPO plans have broader networks
  if (planType === "PPO") probability += 0.15;

  // Larger networks increase probability
  if (networkSize > 50000) probability += 0.10;
  else if (networkSize > 20000) probability += 0.05;

  // Major national carriers tend to have broader networks
  const majorCarriers = ["unitedhealth", "humana", "aetna", "cigna", "anthem", "bcbs", "blue cross", "blue shield", "wellcare", "centene"];
  if (majorCarriers.some(c => carrier.toLowerCase().includes(c))) {
    probability += 0.08;
  }

  probability = Math.min(probability, 0.95);
  return normalized < probability;
}

export function checkDoctorNetworkForPlan(
  doctors: Doctor[],
  plan: MedicarePlan,
): PlanDoctorNetworkStatus {
  const doctorResults: DoctorNetworkResult[] = doctors.map((doc) => ({
    npi: doc.npi,
    doctorName: doc.name,
    specialty: doc.specialty,
    inNetwork: checkSingleDoctor(doc.npi, plan.contractId, plan.planId, plan.carrier, plan.planType, plan.networkSize),
  }));

  const inNetworkCount = doctorResults.filter(d => d.inNetwork).length;
  const outOfNetworkCount = doctorResults.filter(d => !d.inNetwork).length;

  return {
    planId: plan.planId,
    contractId: plan.contractId,
    doctors: doctorResults,
    allInNetwork: outOfNetworkCount === 0,
    inNetworkCount,
    outOfNetworkCount,
  };
}

export function checkDoctorNetworkForAllPlans(
  doctors: Doctor[],
  plans: MedicarePlan[],
): Map<string, PlanDoctorNetworkStatus> {
  const result = new Map<string, PlanDoctorNetworkStatus>();
  if (doctors.length === 0) return result;
  for (const plan of plans) {
    result.set(plan.id, checkDoctorNetworkForPlan(doctors, plan));
  }
  return result;
}
