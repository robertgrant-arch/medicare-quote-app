/**
 * /api/plans?zip={zip}
 *
 * Fast plan lookup using pre-processed per-state JSON files hosted on CDN.
 * No CSV parsing, no LLM transformation at runtime.
 *
 * Flow:
 * 1. Validate ZIP (5 digits)
 * 2. Resolve ZIP → county/state via CMS Marketplace API
 * 3. Download state JSON from CDN (cached in memory per state)
 * 4. Look up plans by county name
 * 5. Return up to MAX_PLANS plans with isBestMatch / isMostPopular flags
 */

import { type Express } from "express";

// ── CDN URLs for pre-processed per-state plan JSON files ─────────────────────
const CDN_BASE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663319810046/5TY7JcF275WMujMHZWWJT8";

const STATE_CDN_URLS: Record<string, string> = {
  AL: `${CDN_BASE}/AL_67b904f5.json`,
  AR: `${CDN_BASE}/AR_44da840b.json`,
  AZ: `${CDN_BASE}/AZ_822fc811.json`,
  CA: `${CDN_BASE}/CA_0e63b144.json`,
  CO: `${CDN_BASE}/CO_d5d0202e.json`,
  CT: `${CDN_BASE}/CT_fe117f1a.json`,
  DC: `${CDN_BASE}/DC_956b23b8.json`,
  DE: `${CDN_BASE}/DE_e49d3fed.json`,
  FL: `${CDN_BASE}/FL_49f1876a.json`,
  GA: `${CDN_BASE}/GA_533e1fca.json`,
  HI: `${CDN_BASE}/HI_fa323526.json`,
  IA: `${CDN_BASE}/IA_c0fbfe84.json`,
  ID: `${CDN_BASE}/ID_36678396.json`,
  IL: `${CDN_BASE}/IL_4defe286.json`,
  IN: `${CDN_BASE}/IN_dc82ef53.json`,
  KS: `${CDN_BASE}/KS_7e35aefd.json`,
  KY: `${CDN_BASE}/KY_d429ac6a.json`,
  LA: `${CDN_BASE}/LA_135fa9eb.json`,
  MA: `${CDN_BASE}/MA_a8cf20c4.json`,
  MD: `${CDN_BASE}/MD_e84fb99f.json`,
  ME: `${CDN_BASE}/ME_32265cbc.json`,
  MI: `${CDN_BASE}/MI_2be468a6.json`,
  MN: `${CDN_BASE}/MN_eda92d03.json`,
  MO: `${CDN_BASE}/MO_4e9fdf09.json`,
  MS: `${CDN_BASE}/MS_c8f93956.json`,
  MT: `${CDN_BASE}/MT_686ff40b.json`,
  NC: `${CDN_BASE}/NC_036848e7.json`,
  ND: `${CDN_BASE}/ND_f12b42a3.json`,
  NE: `${CDN_BASE}/NE_960f49d1.json`,
  NH: `${CDN_BASE}/NH_d1021c0f.json`,
  NJ: `${CDN_BASE}/NJ_4f264fd0.json`,
  NM: `${CDN_BASE}/NM_446e840a.json`,
  NV: `${CDN_BASE}/NV_9ca45f94.json`,
  NY: `${CDN_BASE}/NY_d3c0c09e.json`,
  OH: `${CDN_BASE}/OH_ec644008.json`,
  OK: `${CDN_BASE}/OK_3e52d056.json`,
  OR: `${CDN_BASE}/OR_4d1de179.json`,
  PA: `${CDN_BASE}/PA_124dc2c6.json`,
  PR: `${CDN_BASE}/PR_2ff56627.json`,
  RI: `${CDN_BASE}/RI_74672982.json`,
  SC: `${CDN_BASE}/SC_3ceb6e53.json`,
  SD: `${CDN_BASE}/SD_0553bb69.json`,
  TN: `${CDN_BASE}/TN_cf7b12c8.json`,
  TX: `${CDN_BASE}/TX_2dd68bdd.json`,
  UT: `${CDN_BASE}/UT_ac1faf77.json`,
  VA: `${CDN_BASE}/VA_db8b8a4c.json`,
  VT: `${CDN_BASE}/VT_8e463fe4.json`,
  WA: `${CDN_BASE}/WA_43e2f67b.json`,
  WI: `${CDN_BASE}/WI_003da44b.json`,
  WV: `${CDN_BASE}/WV_c5df6929.json`,
  WY: `${CDN_BASE}/WY_02219b63.json`,
};

// ── CMS Marketplace API for ZIP → county resolution ──────────────────────────
const CMS_ZIP_API = "https://marketplace.api.healthcare.gov/api/v1/counties/by/zip";
const CMS_API_KEY = process.env.CMS_MARKETPLACE_API_KEY ?? "d687412e7b53146b2631dc01974ad0a4";

// ── In-memory LRU cache for state data (keyed by state abbreviation) ─────────
const STATE_CACHE_MAX = 20;
const stateCache = new Map<string, Record<string, unknown[]>>();

function evictStateCache() {
  if (stateCache.size >= STATE_CACHE_MAX) {
    const firstKey = stateCache.keys().next().value;
    if (firstKey) stateCache.delete(firstKey);
  }
}

// ── In-memory LRU cache for ZIP → county resolution ──────────────────────────
const ZIP_CACHE_MAX = 5000;
const zipCache = new Map<string, { stateAbbr: string; countyName: string }>();

function evictZipCache() {
  if (zipCache.size >= ZIP_CACHE_MAX) {
    const firstKey = zipCache.keys().next().value;
    if (firstKey) zipCache.delete(firstKey);
  }
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bOf\b/g, "of")
    .replace(/\bThe\b/g, "the");
}

// ── Resolve ZIP → county/state via CMS Marketplace API ───────────────────────
async function resolveZipToCounty(zip: string): Promise<{ stateAbbr: string; countyName: string } | null> {
  // Check ZIP cache first
  const cached = zipCache.get(zip);
  if (cached) return cached;

  try {
    const url = `${CMS_ZIP_API}/${zip}?apikey=${CMS_API_KEY}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) {
      console.warn(`[Plans] CMS ZIP API returned ${res.status} for ZIP ${zip}`);
      return null;
    }
    const data = await res.json() as { counties?: Array<{ state: string; name: string }> };
    const counties = data.counties;
    if (!counties || counties.length === 0) {
      console.warn(`[Plans] No counties found for ZIP ${zip}`);
      return null;
    }
    // Use the first county returned (primary county for this ZIP)
    const primary = counties[0];
    const result = {
      stateAbbr: primary.state.toUpperCase(),
      countyName: primary.name.toUpperCase(),
    };
    evictZipCache();
    zipCache.set(zip, result);
    return result;
  } catch (err) {
    console.error(`[Plans] ZIP resolution error for ${zip}:`, err);
    return null;
  }
}

// ── Download and cache state data from CDN ───────────────────────────────────
async function getStateData(stateAbbr: string): Promise<Record<string, unknown[]> | null> {
  // Check state cache first
  const cached = stateCache.get(stateAbbr);
  if (cached) return cached;

  const url = STATE_CDN_URLS[stateAbbr];
  if (!url) {
    console.warn(`[Plans] No CDN URL for state: ${stateAbbr}`);
    return null;
  }

  try {
    console.log(`[Plans] Downloading state data for ${stateAbbr} from CDN...`);
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) {
      console.error(`[Plans] CDN returned ${res.status} for ${stateAbbr}`);
      return null;
    }
    const data = await res.json() as Record<string, unknown[]>;
    evictStateCache();
    stateCache.set(stateAbbr, data);
    console.log(`[Plans] Loaded ${stateAbbr} state data (${Object.keys(data).length} counties)`);
    return data;
  } catch (err) {
    console.error(`[Plans] Failed to download state data for ${stateAbbr}:`, err);
    return null;
  }
}

// ── Find plans for a county in state data ────────────────────────────────────
function findPlansForCounty(stateData: Record<string, unknown[]>, countyName: string): unknown[] {
  // Try exact match first (county name is stored uppercase in JSON)
  const upperCounty = countyName.toUpperCase();
  if (stateData[upperCounty]) {
    return stateData[upperCounty];
  }

  // Try without " COUNTY" suffix
  const withoutCounty = upperCounty.replace(/ COUNTY$/, "").trim();
  for (const key of Object.keys(stateData)) {
    if (key === withoutCounty || key.replace(/ COUNTY$/, "") === withoutCounty) {
      return stateData[key];
    }
  }

  // Partial match fallback
  for (const key of Object.keys(stateData)) {
    if (key.includes(withoutCounty) || withoutCounty.includes(key.replace(/ COUNTY$/, ""))) {
      return stateData[key];
    }
  }

  console.warn(`[Plans] County not found: "${upperCounty}" in state data. Available: ${Object.keys(stateData).slice(0, 5).join(", ")}...`);
  return [];
}

// ── Annotate plans ──────────────────────────────────────────────────────────

function annotatePlans(plans: unknown[]): unknown[] {
  // Sort by star rating descending, then by premium ascending — return ALL plans
  const sorted = [...plans].sort((a: any, b: any) => {
    const starDiff = (b.starRating?.overall ?? 0) - (a.starRating?.overall ?? 0);
    if (starDiff !== 0) return starDiff;
    return (a.premium ?? 0) - (b.premium ?? 0);
  });

  return sorted.map((plan: any, idx) => ({
    ...plan,
    isBestMatch: idx === 0,
    isMostPopular: idx === 1,
  }));
}

// ── Register the /api/plans route ─────────────────────────────────────────────
export function registerPlansRoute(app: Express): void {
  app.get("/api/plans", async (req, res) => {
    const zip = (req.query.zip as string | undefined)?.trim();

    // Validate ZIP
    if (!zip || !/^\d{5}$/.test(zip)) {
      return res.status(400).json({
        error: "Please provide a valid 5-digit ZIP code.",
        plans: [],
      });
    }

    try {
      // Step 1: Resolve ZIP → county/state
      const location = await resolveZipToCounty(zip);
      if (!location) {
        return res.status(404).json({
          error: `Could not find county information for ZIP code ${zip}. Please verify the ZIP code and try again.`,
          plans: [],
          location: null,
        });
      }

      const { stateAbbr, countyName } = location;

      // Step 2: Get state data from CDN (cached)
      const stateData = await getStateData(stateAbbr);
      if (!stateData) {
        return res.status(503).json({
          error: `Plan data for ${stateAbbr} is temporarily unavailable. Please try again in a moment.`,
          plans: [],
          location: { stateAbbr, countyName: toTitleCase(countyName), zip },
        });
      }

      // Step 3: Find plans for this county
      const rawPlans = findPlansForCounty(stateData, countyName);
      if (rawPlans.length === 0) {
        return res.status(404).json({
          error: `No Medicare Advantage plans found for ${toTitleCase(countyName)}, ${stateAbbr}. This area may not have MA plans available for 2026.`,
          plans: [],
          location: { stateAbbr, countyName: toTitleCase(countyName), zip },
        });
      }

      // Step 4: Annotate and return
      const plans = annotatePlans(rawPlans);

      return res.json({
        plans,
        location: {
          stateAbbr,
          countyName: toTitleCase(countyName),
          zip,
        },
        totalAvailable: rawPlans.length,
        showing: plans.length,
      });
    } catch (err) {
      console.error("[Plans] Unexpected error:", err);
      return res.status(500).json({
        error: "An unexpected error occurred while loading plans. Please try again.",
        plans: [],
      });
    }
  });
}

// ── Pre-warm cache for common states on server startup ───────────────────────
const PREWARM_STATES = ["MO", "KS", "FL", "TX", "CA", "NY", "OH", "PA", "IL", "GA"];

export async function prewarmPlanCache(): Promise<void> {
  console.log("[Plans] Pre-warming plan cache for common states...");
  const results = await Promise.allSettled(
    PREWARM_STATES.map((state) => getStateData(state))
  );
  const loaded = results.filter((r) => r.status === "fulfilled" && r.value !== null).length;
  console.log(`[Plans] Pre-warm complete: ${loaded}/${PREWARM_STATES.length} states loaded`);
}
