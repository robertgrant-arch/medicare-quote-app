/**
 * CMS Data Pipeline
 * -----------------
 * Scheduled daily job that checks CMS data sources for updates, downloads
 * changed files, and updates the database. Currently runs against mock data
 * but is architected to plug in real CMS file URLs.
 *
 * Schedule: daily at 2:00 AM CT
 * Manual trigger: POST /api/admin/sync-now (via adminRouter)
 */

import cron from "node-cron";
import crypto from "crypto";
import { getDb } from "./db";
import { cmsDataSources, cmsSyncLog } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// ─── CMS Data Source Registry ─────────────────────────────────────────────────
// These are the canonical CMS data sources the pipeline monitors.
// Replace the mock URLs with real CMS file URLs when ready to go live.
export const CMS_DATA_SOURCE_DEFINITIONS = [
  {
    name: "MA Landscape File CY2026",
    url: "https://www.cms.gov/data-research/statistics-trends-and-reports/medicare-advantagepart-d-contract-and-enrollment-data/landscape-files",
    category: "landscape" as const,
  },
  {
    name: "Plan Benefit Package (PBP) Files CY2026",
    url: "https://www.cms.gov/medicare/payment/medicare-advantage-rates-statistics/plan-benefit-package-pbp-files",
    category: "pbp" as const,
  },
  {
    name: "CMS Star Ratings Dataset CY2026",
    url: "https://www.cms.gov/medicare/quality/part-c-d-performance-data",
    category: "star_ratings" as const,
  },
  {
    name: "Monthly Enrollment Data",
    url: "https://www.cms.gov/data-research/statistics-trends-and-reports/medicare-advantagepart-d-contract-and-enrollment-data/monthly-enrollment-by-contract",
    category: "enrollment" as const,
  },
  {
    name: "Service Area Files (County/ZIP Mapping) CY2026",
    url: "https://www.cms.gov/medicare/payment/medicare-advantage-rates-statistics/service-area-files",
    category: "service_area" as const,
  },
];

// ─── Seed Data Sources ────────────────────────────────────────────────────────
// Called on server startup to ensure all data source records exist in the DB.
export async function seedCmsDataSources() {
  const dbConn = await getDb();
  if (!dbConn) return;

  for (const source of CMS_DATA_SOURCE_DEFINITIONS) {
    const existing = await dbConn
      .select()
      .from(cmsDataSources)
      .where(eq(cmsDataSources.name, source.name))
      .limit(1);

    if (existing.length === 0) {
      await dbConn.insert(cmsDataSources).values({
        name: source.name,
        url: source.url,
        category: source.category,
        isActive: true,
      });
    }
  }
}

// ─── Mock File Check ──────────────────────────────────────────────────────────
// Simulates checking a CMS URL for updated content.
// In production, replace with real HTTP HEAD/GET requests + file hash comparison.
async function checkSourceForUpdates(source: {
  id: number;
  name: string;
  url: string;
  lastFileHash: string | null;
}): Promise<{ updated: boolean; newHash: string; plansProcessed: number }> {
  // Simulate network latency
  await new Promise((r) => setTimeout(r, 100 + Math.random() * 200));

  // Generate a deterministic mock hash based on source name + current date.
  // In production: compute SHA-256 of downloaded file bytes.
  const today = new Date().toISOString().slice(0, 10);
  const mockContent = `${source.name}::${today}::mock-data`;
  const newHash = crypto.createHash("sha256").update(mockContent).digest("hex");

  const updated = newHash !== source.lastFileHash;
  const plansProcessed = updated ? Math.floor(Math.random() * 500) + 50 : 0;

  return { updated, newHash, plansProcessed };
}

// ─── Run Sync ─────────────────────────────────────────────────────────────────
export async function runCmsSync(triggerType: "scheduled" | "manual"): Promise<{
  syncLogId: number;
  sourcesChecked: number;
  sourcesUpdated: number;
  plansProcessed: number;
  status: "success" | "partial" | "error";
  errors: string[];
}> {
  console.log(`[CMS Pipeline] Starting ${triggerType} sync at ${new Date().toISOString()}`);

  const dbConn = await getDb();
  if (!dbConn) {
    console.warn("[CMS Pipeline] Database not available, skipping sync");
    return {
      syncLogId: 0,
      sourcesChecked: 0,
      sourcesUpdated: 0,
      plansProcessed: 0,
      status: "error",
      errors: ["Database not available"],
    };
  }

  // Insert a "running" log entry
  const [logEntry] = await dbConn
    .insert(cmsSyncLog)
    .values({
      triggerType,
      status: "running",
      sourcesChecked: 0,
      sourcesUpdated: 0,
      plansProcessed: 0,
      startedAt: new Date(),
    })
    .$returningId();

  const syncLogId = logEntry.id;

  const sources = await dbConn
    .select()
    .from(cmsDataSources)
    .where(eq(cmsDataSources.isActive, true));

  let sourcesUpdated = 0;
  let totalPlansProcessed = 0;
  const errors: string[] = [];
  const detailResults: Array<{
    name: string;
    updated: boolean;
    plansProcessed: number;
    error?: string;
  }> = [];

  for (const source of sources) {
    try {
      const result = await checkSourceForUpdates(source);

      if (result.updated) {
        sourcesUpdated++;
        totalPlansProcessed += result.plansProcessed;

        await dbConn
          .update(cmsDataSources)
          .set({
            lastFileHash: result.newHash,
            lastCheckedAt: new Date(),
            lastUpdatedAt: new Date(),
          })
          .where(eq(cmsDataSources.id, source.id));
      } else {
        await dbConn
          .update(cmsDataSources)
          .set({ lastCheckedAt: new Date() })
          .where(eq(cmsDataSources.id, source.id));
      }

      detailResults.push({
        name: source.name,
        updated: result.updated,
        plansProcessed: result.plansProcessed,
      });
    } catch (err) {
      const msg = `${source.name}: ${(err as Error).message}`;
      errors.push(msg);
      detailResults.push({ name: source.name, updated: false, plansProcessed: 0, error: msg });
    }
  }

  const finalStatus: "success" | "partial" | "error" =
    errors.length === 0 ? "success" : errors.length < sources.length ? "partial" : "error";

  // Update the sync log with final results
  await dbConn
    .update(cmsSyncLog)
    .set({
      status: finalStatus,
      sourcesChecked: sources.length,
      sourcesUpdated,
      plansProcessed: totalPlansProcessed,
      errorMessage: errors.length > 0 ? errors.join("; ") : null,
      detailLog: JSON.stringify(detailResults),
      completedAt: new Date(),
    })
    .where(eq(cmsSyncLog.id, syncLogId));

  console.log(
    `[CMS Pipeline] Sync complete. Status: ${finalStatus}, ` +
      `Sources checked: ${sources.length}, Updated: ${sourcesUpdated}, ` +
      `Plans processed: ${totalPlansProcessed}`
  );

  return {
    syncLogId,
    sourcesChecked: sources.length,
    sourcesUpdated,
    plansProcessed: totalPlansProcessed,
    status: finalStatus,
    errors,
  };
}

// ─── Cron Schedule ────────────────────────────────────────────────────────────
// Runs daily at 2:00 AM CT. node-cron v4 TaskOptions: { timezone, name, noOverlap, maxExecutions, maxRandomDelay }
let cronJob: ReturnType<typeof cron.schedule> | null = null;

export function startCmsPipelineCron() {
  if (cronJob) return; // already started

  cronJob = cron.schedule(
    "0 2 * * *", // 2:00 AM daily
    async () => {
      try {
        await runCmsSync("scheduled");
      } catch (err) {
        console.error("[CMS Pipeline] Cron job failed:", err);
      }
    },
    {
      timezone: "America/Chicago",
    }
  );

  console.log("[CMS Pipeline] Daily sync cron scheduled (2:00 AM CT)");
}

export function stopCmsPipelineCron() {
  cronJob?.stop();
  cronJob = null;
}

// ─── Get Next Scheduled Run ───────────────────────────────────────────────────
export function getNextScheduledRun(): string {
  const now = new Date();
  const next = new Date(now);
  // Convert to CT offset (UTC-6 standard, UTC-5 daylight) — approximate
  const ctOffset = -6 * 60; // minutes
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const ctMs = utcMs + ctOffset * 60000;
  const ctNow = new Date(ctMs);

  const nextCt = new Date(ctNow);
  nextCt.setHours(2, 0, 0, 0);
  if (nextCt <= ctNow) {
    nextCt.setDate(nextCt.getDate() + 1);
  }
  // Convert back to UTC
  const nextUtcMs = nextCt.getTime() - ctOffset * 60000;
  return new Date(nextUtcMs).toISOString();
}
