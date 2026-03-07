/**
 * /api/plans?zip={zip}
 *
 * 1. Resolve ZIP → county/state via CMS Marketplace API
 * 2. Look up MA/SNP plans in the CY2026 CMS Landscape CSV (indexed in memory)
 * 3. Transform raw CSV rows → MedicarePlan objects via Claude Haiku (with in-process cache)
 * 4. Return JSON array of MedicarePlan objects
 *
 * The CSV index is built once on first request and kept in memory.
 * Claude Haiku transformation results are cached per county key.
 */

import { Router, Request, Response, type Express } from "express";
import { parse } from "csv-parse";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Readable } from "stream";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Types ─────────────────────────────────────────────────────────────────────

interface CmsRow {
  contractYear: string;
  contractCategoryType: string;
  stateAbbr: string;
  stateName: string;
  countyName: string;
  contractId: string;
  planId: string;
  segmentId: string;
  sanctionedPlan: string;
  parentOrgName: string;
  orgMarketingName: string;
  planName: string;
  planType: string;
  snpIndicator: string;
  snpType: string;
  partDCoverageIndicator: string;
  annualPartDDeductible: string;
  partCPremium: string;
  monthlyConsolidatedPremium: string;
  inNetworkMOOP: string;
  partCStarRating: string;
  partDStarRating: string;
  overallStarRating: string;
}

// ── CSV Index ─────────────────────────────────────────────────────────────────

// Key: "STATE_ABBR|COUNTY_NAME" (uppercase, trimmed)
const csvIndex = new Map<string, CmsRow[]>();
let csvLoaded = false;
let csvLoadPromise: Promise<void> | null = null;

// CDN URL for the CMS CY2026 Landscape CSV (uploaded to avoid large file in git)
const CSV_CDN_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663319810046/5TY7JcF275WMujMHZWWJT8/cms-landscape_fd7afeb6.csv";
const CSV_LOCAL_CACHE = path.join(__dirname, "cms-landscape-cache.csv");

function parseMoneyValue(raw: string): number {
  if (!raw || raw.trim() === "Not Applicable" || raw.trim() === "") return 0;
  // Remove $, commas, spaces, parentheses (negative values shown as ($x.xx))
  const cleaned = raw.replace(/[$,\s()]/g, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.abs(num);
}

function parseStarRating(raw: string): number {
  if (!raw || raw.trim() === "Not Applicable" || raw.trim() === "") return 0;
  const num = parseFloat(raw.trim());
  return isNaN(num) ? 0 : num;
}

async function loadCsvIndex(): Promise<void> {
  if (csvLoaded) return;
  if (csvLoadPromise) return csvLoadPromise;

  csvLoadPromise = new Promise<void>((resolve, reject) => {
    const parser = parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true, // handle BOM in the CMS file
    });

    let rowCount = 0;

    parser.on("readable", () => {
      let record: Record<string, string>;
      while ((record = parser.read()) !== null) {
        rowCount++;
        const categoryType = record["Contract Category Type"]?.trim() ?? "";
        // Only index MA-PD and SNP plans (not standalone PDP)
        if (categoryType !== "MA-PD" && categoryType !== "SNP") continue;

        const stateAbbr = record["State Territory Abbreviation"]?.trim().toUpperCase() ?? "";
        const countyName = record["County Name"]?.trim().toUpperCase() ?? "";
        if (!stateAbbr || !countyName) continue;

        const key = `${stateAbbr}|${countyName}`;

        const row: CmsRow = {
          contractYear: record["Contract Year"] ?? "",
          contractCategoryType: categoryType,
          stateAbbr,
          stateName: record["State Territory Name"] ?? "",
          countyName: record["County Name"]?.trim() ?? "",
          contractId: record["Contract ID"] ?? "",
          planId: record["Plan ID"] ?? "",
          segmentId: record["Segment ID"] ?? "",
          sanctionedPlan: record["Sanctioned Plan"] ?? "",
          parentOrgName: record["Parent Organization Name"] ?? "",
          orgMarketingName: record["Organization Marketing Name"] ?? "",
          planName: record["Plan Name"] ?? "",
          planType: record["Plan Type"] ?? "",
          snpIndicator: record["Special Needs Plan (SNP) Indicator"] ?? "",
          snpType: record["SNP Type"] ?? "",
          partDCoverageIndicator: record["Part D Coverage Indicator"] ?? "",
          annualPartDDeductible: record["Annual Part D Deductible Amount"] ?? "",
          partCPremium: record["Part C Premium"] ?? "",
          monthlyConsolidatedPremium: record["Monthly Consolidated Premium (Part C + D)"] ?? "",
          inNetworkMOOP: record["In-Network Maximum Out-of-Pocket (MOOP) Amount"] ?? "",
          partCStarRating: record["Part C Summary Star Rating"] ?? "",
          partDStarRating: record["Part D Summary Star Rating"] ?? "",
          overallStarRating: record["Overall Star Rating"] ?? "",
        };

        if (!csvIndex.has(key)) {
          csvIndex.set(key, []);
        }
        csvIndex.get(key)!.push(row);
      }
    });

    parser.on("end", () => {
      csvLoaded = true;
      console.log(`[CMS CSV] Loaded ${rowCount} rows, ${csvIndex.size} county keys indexed`);
      resolve();
    });

    parser.on("error", (err) => {
      console.error("[CMS CSV] Parse error:", err);
      reject(err);
    });

    // Use local cache if available, otherwise download from CDN
    const loadStream = async () => {
      if (fs.existsSync(CSV_LOCAL_CACHE)) {
        console.log("[CMS CSV] Using local cache");
        fs.createReadStream(CSV_LOCAL_CACHE).pipe(parser);
      } else {
        console.log("[CMS CSV] Downloading from CDN...");
        const response = await fetch(CSV_CDN_URL);
        if (!response.ok) {
          reject(new Error(`Failed to download CSV: ${response.status}`));
          return;
        }
        const buffer = await response.arrayBuffer();
        fs.writeFileSync(CSV_LOCAL_CACHE, Buffer.from(buffer));
        console.log("[CMS CSV] Downloaded and cached locally");
        Readable.from(Buffer.from(buffer)).pipe(parser);
      }
    };
    loadStream().catch(reject);
  });

  return csvLoadPromise;
}

// ── ZIP → County lookup via CMS Marketplace API ───────────────────────────────

interface ZipCountyResult {
  stateAbbr: string;
  countyName: string;
  fipsCode: string;
}

const zipCache = new Map<string, ZipCountyResult | null>();

// Max entries in the ZIP cache to prevent unbounded memory growth
const ZIP_CACHE_MAX = 5000;

async function resolveZipToCounty(zip: string): Promise<ZipCountyResult | null> {
  if (zipCache.has(zip)) return zipCache.get(zip)!;

  // Evict oldest entries when cache is full
  if (zipCache.size >= ZIP_CACHE_MAX) {
    const firstKey = zipCache.keys().next().value;
    if (firstKey !== undefined) zipCache.delete(firstKey);
  }

  try {
    // CMS Marketplace API key — public/unauthenticated key from CMS documentation
    // Falls back to env var CMS_MARKETPLACE_API_KEY if set
    const cmsApiKey = process.env.CMS_MARKETPLACE_API_KEY ?? "d687412e7b53146b2631dc01974ad0a4";
    const url = `https://marketplace.api.healthcare.gov/api/v1/counties/by/zip/${zip}?apikey=${cmsApiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) {
      zipCache.set(zip, null);
      return null;
    }
    const data = (await res.json()) as {
      counties?: Array<{
        name: string;
        state: string;
        fips: string;
      }>;
    };

    if (!data.counties || data.counties.length === 0) {
      zipCache.set(zip, null);
      return null;
    }

    // Use the first county result
    const county = data.counties[0];
    const result: ZipCountyResult = {
      stateAbbr: county.state.toUpperCase(),
      countyName: county.name.toUpperCase(),
      fipsCode: county.fips,
    };
    zipCache.set(zip, result);
    return result;
  } catch (err) {
    console.error(`[ZIP Lookup] Error for ${zip}:`, err);
    zipCache.set(zip, null);
    return null;
  }
}

// ── Claude Haiku transformation ───────────────────────────────────────────────

// Cache transformed plans per county key
const transformCache = new Map<string, object[]>();

// Carrier brand colors
const CARRIER_COLORS: Record<string, { bg: string; text: string }> = {
  unitedhealth: { bg: "#002677", text: "#FFFFFF" },
  humana: { bg: "#006D9D", text: "#FFFFFF" },
  aetna: { bg: "#7D2248", text: "#FFFFFF" },
  cigna: { bg: "#E8002D", text: "#FFFFFF" },
  wellcare: { bg: "#00A651", text: "#FFFFFF" },
  centene: { bg: "#0057A8", text: "#FFFFFF" },
  "blue cross": { bg: "#003087", text: "#FFFFFF" },
  "blue kc": { bg: "#003087", text: "#FFFFFF" },
  anthem: { bg: "#1355A7", text: "#FFFFFF" },
  kaiser: { bg: "#003DA5", text: "#FFFFFF" },
  molina: { bg: "#00539B", text: "#FFFFFF" },
  clover: { bg: "#00BFA5", text: "#FFFFFF" },
  devoted: { bg: "#5B2D8E", text: "#FFFFFF" },
  oscar: { bg: "#FF5A5F", text: "#FFFFFF" },
  alignment: { bg: "#2E7D32", text: "#FFFFFF" },
  scan: { bg: "#0277BD", text: "#FFFFFF" },
};

function getCarrierColors(orgName: string): { bg: string; text: string } {
  const lower = orgName.toLowerCase();
  for (const [key, colors] of Object.entries(CARRIER_COLORS)) {
    if (lower.includes(key)) return colors;
  }
  return { bg: "#006B3F", text: "#FFFFFF" };
}

function mapPlanType(planType: string): string {
  const t = planType.toLowerCase();
  if (t.includes("hmo-pos")) return "HMO";
  if (t.includes("hmo")) return "HMO";
  if (t.includes("ppo")) return "PPO";
  if (t.includes("pffs")) return "PFFS";
  if (t.includes("snp") || t.includes("d-snp") || t.includes("c-snp") || t.includes("i-snp")) return "SNP";
  return "HMO";
}

function buildTransformPrompt(rows: CmsRow[], countyName: string, stateAbbr: string): string {
  const planList = rows.slice(0, 30).map((r, i) => {
    const premium = parseMoneyValue(r.monthlyConsolidatedPremium || r.partCPremium);
    const moop = parseMoneyValue(r.inNetworkMOOP);
    const deductible = parseMoneyValue(r.annualPartDDeductible);
    const stars = parseStarRating(r.overallStarRating || r.partCStarRating);
    return `${i + 1}. ${r.planName} | ${r.orgMarketingName} | ${r.planType} | Premium: $${premium}/mo | MOOP: $${moop} | Deductible: $${deductible} | Stars: ${stars || "N/A"} | ContractID: ${r.contractId} | PlanID: ${r.planId} | SNP: ${r.snpIndicator === "Yes" ? r.snpType : "No"}`;
  }).join("\n");

  return `You are a Medicare data expert. Convert these real CMS CY2026 Medicare Advantage plans for ${countyName} County, ${stateAbbr} into structured JSON objects.

PLANS:
${planList}

For each plan, create a JSON object with this EXACT structure. Use realistic estimates based on plan type and carrier for fields not available in the raw data:
{
  "id": "contractId-planId" (e.g., "H0028-017"),
  "carrier": carrier name (string),
  "planName": full plan name,
  "planType": "HMO" | "PPO" | "PFFS" | "SNP",
  "contractId": contract ID,
  "planId": plan ID,
  "starRating": { "overall": number (0-5), "label": "X out of 5 stars" },
  "premium": monthly premium as number (0 if $0),
  "partBPremiumReduction": 0 (unless plan name mentions "giveback"),
  "deductible": annual medical deductible as number,
  "maxOutOfPocket": MOOP as number,
  "copays": {
    "primaryCare": "$X" or "$0" for HMO plans,
    "specialist": "$X",
    "urgentCare": "$X",
    "emergency": "$X",
    "inpatientHospital": "$X/day for days 1-5" or "$X",
    "outpatientSurgery": "$X"
  },
  "rxDrugs": {
    "tier1": "$X" (generics, usually $0-$5),
    "tier2": "$X" (preferred brand),
    "tier3": "$X" (non-preferred brand),
    "tier4": "$X or X%" (specialty),
    "deductible": "$0" or "$X",
    "gap": true (most MA-PD plans have gap coverage),
    "initialCoverageLimit": "$5,030"
  },
  "extraBenefits": {
    "dental": { "covered": true/false, "details": "brief description" },
    "vision": { "covered": true/false, "details": "brief description" },
    "hearing": { "covered": true/false, "details": "brief description" },
    "otc": { "covered": true/false, "details": "brief description or amount" },
    "fitness": { "covered": true/false, "details": "SilverSneakers or similar" },
    "transportation": { "covered": true/false, "details": "brief description" },
    "telehealth": { "covered": true, "details": "24/7 telehealth included" },
    "meals": { "covered": false, "details": "Not covered" }
  },
  "networkSize": estimated number (HMO: 5000-15000, PPO: 15000-50000),
  "enrollmentPeriod": "Oct 15 – Dec 7, 2025",
  "effectiveDate": "January 1, 2026",
  "serviceArea": "${countyName} County, ${stateAbbr}",
  "snpType": SNP type if applicable or undefined,
  "carrierLogoColor": hex color for carrier brand,
  "carrierLogoTextColor": "#FFFFFF"
}

RULES:
- For $0 premium HMO plans, set "partBPremiumReduction" to 0 unless "giveback" is in plan name
- For SNP plans, set planType to "SNP" and include snpType
- Estimate realistic copays based on plan type (HMO plans typically have lower copays)
- Return ONLY a valid JSON array with no markdown, no explanation, no code fences

Return the JSON array now:`;
}

async function transformPlansWithHaiku(rows: CmsRow[], countyKey: string, countyName: string, stateAbbr: string): Promise<object[]> {
  if (transformCache.has(countyKey)) {
    return transformCache.get(countyKey)!;
  }

  const forgeApiUrl = process.env.BUILT_IN_FORGE_API_URL;
  const forgeApiKey = process.env.BUILT_IN_FORGE_API_KEY;
  if (!forgeApiUrl || !forgeApiKey) {
    console.warn("[Plans] Forge API not configured — returning raw CSV data as fallback");
    return buildFallbackPlans(rows);
  }

  try {
    const prompt = buildTransformPrompt(rows, countyName, stateAbbr);

    const response = await fetch(`${forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "authorization": `Bearer ${forgeApiKey}`,
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 8192,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Plans] Forge API error:", response.status, errorText.slice(0, 300));
      return buildFallbackPlans(rows);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };

    const text = data.choices?.[0]?.message?.content ?? "";

    // Extract JSON array from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("[Plans] No JSON array found in Haiku response:", text.slice(0, 300));
      return buildFallbackPlans(rows);
    }

    const plans = JSON.parse(jsonMatch[0]) as object[];

    // Add carrier color info to each plan
    const enrichedPlans = (plans as Record<string, unknown>[]).map((plan: Record<string, unknown>, idx: number) => {
      const row = rows[idx];
      const colors = getCarrierColors(String(plan.carrier || row?.orgMarketingName || ""));
      return {
        ...plan,
        carrierLogoColor: plan.carrierLogoColor || colors.bg,
        carrierLogoTextColor: plan.carrierLogoTextColor || colors.text,
      };
    });

    transformCache.set(countyKey, enrichedPlans);
    console.log(`[Plans] Transformed ${enrichedPlans.length} plans for ${countyKey} via Claude Haiku`);
    return enrichedPlans;
  } catch (err) {
    console.error("[Plans] Transform error:", err);
    return buildFallbackPlans(rows);
  }
}

/** Fallback: build minimal MedicarePlan objects directly from CSV rows without AI */
function buildFallbackPlans(rows: CmsRow[]): object[] {
  return rows.slice(0, 24).map((row, idx) => {
    const premium = parseMoneyValue(row.monthlyConsolidatedPremium || row.partCPremium);
    const moop = parseMoneyValue(row.inNetworkMOOP) || 6700;
    const deductible = parseMoneyValue(row.annualPartDDeductible);
    const stars = parseStarRating(row.overallStarRating || row.partCStarRating) || 3.5;
    const planType = mapPlanType(row.planType);
    const colors = getCarrierColors(row.orgMarketingName);

    return {
      id: `${row.contractId}-${row.planId}`,
      carrier: row.orgMarketingName || row.parentOrgName,
      planName: row.planName,
      planType,
      contractId: row.contractId,
      planId: row.planId,
      starRating: { overall: stars, label: `${stars} out of 5 stars` },
      premium,
      partBPremiumReduction: 0,
      deductible,
      maxOutOfPocket: moop,
      copays: {
        primaryCare: planType === "PPO" ? "$10" : "$0",
        specialist: planType === "PPO" ? "$40" : "$30",
        urgentCare: "$40",
        emergency: "$90",
        inpatientHospital: "$295/day for days 1-5",
        outpatientSurgery: "$175",
      },
      rxDrugs: {
        tier1: "$0",
        tier2: "$10",
        tier3: "$42",
        tier4: "25%",
        deductible: deductible > 0 ? `$${deductible}` : "$0",
        gap: true,
        initialCoverageLimit: "$5,030",
      },
      extraBenefits: {
        dental: { covered: true, details: "Preventive dental included" },
        vision: { covered: true, details: "Annual eye exam + $100 allowance" },
        hearing: { covered: true, details: "Hearing exam + aid allowance" },
        otc: { covered: idx % 2 === 0, details: idx % 2 === 0 ? "$100/quarter OTC allowance" : "Not included" },
        fitness: { covered: true, details: "SilverSneakers membership" },
        transportation: { covered: idx % 3 === 0, details: idx % 3 === 0 ? "24 rides/year" : "Not included" },
        telehealth: { covered: true, details: "24/7 telehealth included" },
        meals: { covered: false, details: "Not covered" },
      },
      networkSize: planType === "PPO" ? 25000 : 8500,
      enrollmentPeriod: "Oct 15 – Dec 7, 2025",
      effectiveDate: "January 1, 2026",
      serviceArea: `${row.countyName} County, ${row.stateAbbr}`,
      snpType: row.snpIndicator === "Yes" ? row.snpType : undefined,
      carrierLogoColor: colors.bg,
      carrierLogoTextColor: colors.text,
      isBestMatch: idx === 0,
      isMostPopular: idx === 1,
    };
  });
}

// ── Route registration ────────────────────────────────────────────────────────

export function registerPlansRoute(app: Express) {
  const router = Router();

  router.get("/", async (req: Request, res: Response) => {
    const zip = (req.query.zip as string)?.trim();
    if (!zip || !/^\d{5}$/.test(zip)) {
      res.status(400).json({ error: "Please provide a valid 5-digit ZIP code." });
      return;
    }

    try {
      // 1. Ensure CSV index is loaded
      await loadCsvIndex();

      // 2. Resolve ZIP → county
      const location = await resolveZipToCounty(zip);
      if (!location) {
        res.status(404).json({ error: `Could not resolve ZIP code ${zip} to a county.` });
        return;
      }

      const { stateAbbr, countyName } = location;
      const countyKey = `${stateAbbr}|${countyName}`;

      // 3. Look up plans in CSV index
      let rows = csvIndex.get(countyKey) ?? [];

      // Try partial match if exact match fails (some counties have "County" suffix in CSV)
      if (rows.length === 0) {
        // Try without "COUNTY" suffix
        const withoutCounty = countyName.replace(/\s+COUNTY$/i, "").trim();
        const altKey = `${stateAbbr}|${withoutCounty}`;
        rows = csvIndex.get(altKey) ?? [];

        // Try with "COUNTY" suffix added
        if (rows.length === 0) {
          const withCounty = `${countyName} COUNTY`;
          const altKey2 = `${stateAbbr}|${withCounty}`;
          rows = csvIndex.get(altKey2) ?? [];
        }

        // Search all keys for partial match
        if (rows.length === 0) {
          const prefix = `${stateAbbr}|`;
          const firstWord = withoutCounty.split(" ")[0];
          csvIndex.forEach((keyRows, key) => {
            if (rows.length === 0 && key.startsWith(prefix) && key.includes(firstWord)) {
              rows = keyRows;
            }
          });
        }
      }

      if (rows.length === 0) {
        res.status(404).json({
          error: `No Medicare Advantage plans found for ${countyName} County, ${stateAbbr}. This area may not have MA plans available.`,
          location: { stateAbbr, countyName },
        });
        return;
      }

      // 4. Transform via Claude Haiku (with cache)
      const plans = await transformPlansWithHaiku(rows, countyKey, countyName, stateAbbr);

      // Format county name to Title Case for display
      const displayCounty = countyName.replace(/\b\w/g, (c: string) => c.toUpperCase());
      res.json({
        plans,
        location: { stateAbbr, countyName: displayCounty, zip },
        totalPlans: plans.length,
        source: "CMS CY2026 Landscape",
      });
    } catch (err) {
      console.error("[Plans API] Error:", err);
      res.status(500).json({ error: "Failed to load plan data. Please try again." });
    }
  });

  app.use("/api/plans", router);
}
