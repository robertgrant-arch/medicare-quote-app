/**
 * Admin tRPC Router
 * -----------------
 * All procedures here use a simple password-based admin check (ADMIN_PASSWORD env var).
 * This is separate from the Manus OAuth role system so the admin dashboard can be
 * accessed without a Manus account.
 *
 * Procedures:
 *   admin.verifyPassword       – validate admin password, returns session token
 *   admin.getCarriers          – list all carriers with override status
 *   admin.toggleCarrier        – enable/disable a carrier
 *   admin.getPlans             – list all plan overrides (paginated, filterable)
 *   admin.togglePlan           – enable/disable an individual plan
 *   admin.setNonCommissionable – flag/unflag a plan as non-commissionable
 *   admin.getSyncStatus        – last sync info + data source statuses
 *   admin.getSyncHistory       – paginated sync log
 *   admin.triggerSync          – manually kick off a CMS sync
 *   admin.seedNonCommPlans     – pre-load 2026 non-commissionable plan flags
 */

import { TRPCError } from "@trpc/server";
import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { z } from "zod";
import { carrierOverrides, cmsDataSources, cmsSyncLog, planOverrides } from "../drizzle/schema";
import { getDb } from "./db";
import { runCmsSync, getNextScheduledRun } from "./cmsPipeline";
import { publicProcedure, router } from "./_core/trpc";

// ─── Admin password check middleware ─────────────────────────────────────────
// Uses ADMIN_PASSWORD env var. Falls back to "admin123" in dev only.
function checkAdminPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD ?? (process.env.NODE_ENV !== "production" ? "admin123" : "");
  if (!expected || password !== expected) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid admin password" });
  }
}

// All admin procedures require the password in input
const adminInput = z.object({ adminPassword: z.string().min(1) });

// ─── 2026 Non-Commissionable Plan Seed Data ───────────────────────────────────
const NON_COMM_PLANS_2026 = [
  // Aetna
  { planId: "H5521-AETNA-VALUE", planName: "Aetna Medicare Value", carrierName: "Aetna", nonCommSource: "Aetna 2026 Commission Schedule", nonCommEffectiveDate: "2026-01-01" },
  { planId: "H5521-AETNA-VALUEPLUS", planName: "Aetna Medicare Value Plus", carrierName: "Aetna", nonCommSource: "Aetna 2026 Commission Schedule", nonCommEffectiveDate: "2026-01-01" },
  { planId: "H5521-AETNA-CHOICE", planName: "Aetna Medicare Choice", carrierName: "Aetna", nonCommSource: "Aetna 2026 Commission Schedule", nonCommEffectiveDate: "2026-01-01" },
  // BCBS/HCSC
  { planId: "H1254-BCBS-SELECT", planName: "BCBS Medicare Select", carrierName: "BCBS/HCSC", nonCommSource: "HCSC 2026 Commission Update", nonCommEffectiveDate: "2026-01-01" },
  { planId: "H1254-BCBS-BASIC", planName: "BCBS Medicare Basic", carrierName: "BCBS/HCSC", nonCommSource: "HCSC 2026 Commission Update", nonCommEffectiveDate: "2026-01-01" },
  // HealthSpring (Cigna)
  { planId: "H4513-HS-NONCOMM", planName: "HealthSpring Advantage Non-Comm", carrierName: "HealthSpring (Cigna)", nonCommSource: "Cigna/HealthSpring 2026 Agency Guide", nonCommEffectiveDate: "2026-01-01" },
  { planId: "H4513-HS-BASIC", planName: "HealthSpring Basic Plan", carrierName: "HealthSpring (Cigna)", nonCommSource: "Cigna/HealthSpring 2026 Agency Guide", nonCommEffectiveDate: "2026-01-01" },
  // Humana
  { planId: "H0028-HUM-PPP", planName: "Humana Individual Products PPP", carrierName: "Humana", nonCommSource: "Humana 2026 Individual Products PPP Appendix", nonCommEffectiveDate: "2026-01-01" },
  { planId: "H0028-HUM-PPP2", planName: "Humana Individual Products PPP Plus", carrierName: "Humana", nonCommSource: "Humana 2026 Individual Products PPP Appendix", nonCommEffectiveDate: "2026-01-01" },
  // Medica
  { planId: "H9999-MEDICA-PARTNER", planName: "Medica Agency Partner Appendix Plan", carrierName: "Medica", nonCommSource: "Medica 2026 Agency Partner Appendix", nonCommEffectiveDate: "2026-01-01" },
  // WellCare
  { planId: "H5599-WC-SUPP1", planName: "WellCare Suppressed Plan A", carrierName: "WellCare", nonCommSource: "WellCare 2026 Suppressed Plan List", nonCommEffectiveDate: "2026-01-01" },
  { planId: "H5599-WC-SUPP2", planName: "WellCare Suppressed Plan B", carrierName: "WellCare", nonCommSource: "WellCare 2026 Suppressed Plan List", nonCommEffectiveDate: "2026-01-01" },
  // UnitedHealthcare
  { planId: "H0609-UHC-NONCOMM", planName: "UHC Select Non-Commissionable Plan", carrierName: "UnitedHealthcare", nonCommSource: "UHC 2026 Commission Schedule", nonCommEffectiveDate: "2026-01-01" },
  { planId: "H0609-UHC-NONCOMM2", planName: "UHC Select Non-Commissionable Plan 2", carrierName: "UnitedHealthcare", nonCommSource: "UHC 2026 Commission Schedule", nonCommEffectiveDate: "2026-01-01" },
  // Elevance/Anthem
  { planId: "H3655-ANT-NONCOMM", planName: "Anthem Medicare Non-Commissionable MA", carrierName: "Elevance/Anthem", nonCommSource: "Elevance 2026 Non-Commissionable MA Plan List", nonCommEffectiveDate: "2026-01-01" },
  { planId: "H3655-ANT-NONCOMM2", planName: "Anthem Medicare Non-Commissionable MA 2", carrierName: "Elevance/Anthem", nonCommSource: "Elevance 2026 Non-Commissionable MA Plan List", nonCommEffectiveDate: "2026-01-01" },
  // Highmark
  { planId: "H3916-HM-COMM", planName: "Highmark Commission Update Plan", carrierName: "Highmark", nonCommSource: "Highmark 2026 Commission Update", nonCommEffectiveDate: "2026-01-01" },
];

export const adminRouter = router({
  // ── Verify admin password ──────────────────────────────────────────────────
  verifyPassword: publicProcedure
    .input(z.object({ password: z.string() }))
    .mutation(({ input }) => {
      checkAdminPassword(input.password);
      return { success: true };
    }),

  // ── Carrier Management ─────────────────────────────────────────────────────
  getCarriers: publicProcedure
    .input(adminInput.extend({
      search: z.string().optional(),
      state: z.string().optional(),
    }))
    .query(async ({ input }) => {
      checkAdminPassword(input.adminPassword);
      const dbConn = await getDb();
      if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      let query = dbConn.select().from(carrierOverrides).$dynamic();
      if (input.search) {
        query = query.where(like(carrierOverrides.carrierName, `%${input.search}%`));
      }
      const carriers = await query.orderBy(carrierOverrides.carrierName);
      return carriers;
    }),

  toggleCarrier: publicProcedure
    .input(adminInput.extend({
      carrierName: z.string(),
      isEnabled: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      checkAdminPassword(input.adminPassword);
      const dbConn = await getDb();
      if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Upsert carrier override
      const existing = await dbConn
        .select()
        .from(carrierOverrides)
        .where(eq(carrierOverrides.carrierName, input.carrierName))
        .limit(1);

      if (existing.length > 0) {
        await dbConn
          .update(carrierOverrides)
          .set({ isEnabled: input.isEnabled, updatedAt: new Date() })
          .where(eq(carrierOverrides.carrierName, input.carrierName));
      } else {
        await dbConn.insert(carrierOverrides).values({
          carrierName: input.carrierName,
          isEnabled: input.isEnabled,
        });
      }
      return { success: true };
    }),

  // ── Plan Management ────────────────────────────────────────────────────────
  getPlans: publicProcedure
    .input(adminInput.extend({
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(50),
      search: z.string().optional(),
      carrier: z.string().optional(),
      nonCommOnly: z.boolean().optional(),
      disabledOnly: z.boolean().optional(),
    }))
    .query(async ({ input }) => {
      checkAdminPassword(input.adminPassword);
      const dbConn = await getDb();
      if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const offset = (input.page - 1) * input.pageSize;
      const conditions = [];

      if (input.search) {
        conditions.push(
          or(
            like(planOverrides.planName, `%${input.search}%`),
            like(planOverrides.planId, `%${input.search}%`),
            like(planOverrides.carrierName, `%${input.search}%`)
          )
        );
      }
      if (input.carrier) {
        conditions.push(eq(planOverrides.carrierName, input.carrier));
      }
      if (input.nonCommOnly) {
        conditions.push(eq(planOverrides.isNonCommissionable, true));
      }
      if (input.disabledOnly) {
        conditions.push(eq(planOverrides.isEnabled, false));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [plans, countResult] = await Promise.all([
        dbConn
          .select()
          .from(planOverrides)
          .where(whereClause)
          .orderBy(planOverrides.carrierName, planOverrides.planName)
          .limit(input.pageSize)
          .offset(offset),
        dbConn
          .select({ count: sql<number>`count(*)` })
          .from(planOverrides)
          .where(whereClause),
      ]);

      return {
        plans,
        total: Number(countResult[0]?.count ?? 0),
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  togglePlan: publicProcedure
    .input(adminInput.extend({
      planId: z.string(),
      isEnabled: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      checkAdminPassword(input.adminPassword);
      const dbConn = await getDb();
      if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const existing = await dbConn
        .select()
        .from(planOverrides)
        .where(eq(planOverrides.planId, input.planId))
        .limit(1);

      if (existing.length > 0) {
        await dbConn
          .update(planOverrides)
          .set({ isEnabled: input.isEnabled, updatedAt: new Date() })
          .where(eq(planOverrides.planId, input.planId));
      } else {
        await dbConn.insert(planOverrides).values({
          planId: input.planId,
          isEnabled: input.isEnabled,
        });
      }
      return { success: true };
    }),

  setNonCommissionable: publicProcedure
    .input(adminInput.extend({
      planId: z.string(),
      planName: z.string().optional(),
      carrierName: z.string().optional(),
      isNonCommissionable: z.boolean(),
      nonCommSource: z.string().optional(),
      nonCommEffectiveDate: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      checkAdminPassword(input.adminPassword);
      const dbConn = await getDb();
      if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const existing = await dbConn
        .select()
        .from(planOverrides)
        .where(eq(planOverrides.planId, input.planId))
        .limit(1);

      if (existing.length > 0) {
        await dbConn
          .update(planOverrides)
          .set({
            isNonCommissionable: input.isNonCommissionable,
            nonCommSource: input.nonCommSource ?? existing[0].nonCommSource,
            nonCommEffectiveDate: input.nonCommEffectiveDate ?? existing[0].nonCommEffectiveDate,
            notes: input.notes ?? existing[0].notes,
            updatedAt: new Date(),
          })
          .where(eq(planOverrides.planId, input.planId));
      } else {
        await dbConn.insert(planOverrides).values({
          planId: input.planId,
          planName: input.planName,
          carrierName: input.carrierName,
          isNonCommissionable: input.isNonCommissionable,
          nonCommSource: input.nonCommSource,
          nonCommEffectiveDate: input.nonCommEffectiveDate,
          notes: input.notes,
        });
      }
      return { success: true };
    }),

  // ── Sync Status ────────────────────────────────────────────────────────────
  getSyncStatus: publicProcedure
    .input(adminInput)
    .query(async ({ input }) => {
      checkAdminPassword(input.adminPassword);
      const dbConn = await getDb();
      if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [lastSync] = await dbConn
        .select()
        .from(cmsSyncLog)
        .where(or(eq(cmsSyncLog.status, "success"), eq(cmsSyncLog.status, "partial")))
        .orderBy(desc(cmsSyncLog.completedAt))
        .limit(1);

      const [runningSync] = await dbConn
        .select()
        .from(cmsSyncLog)
        .where(eq(cmsSyncLog.status, "running"))
        .orderBy(desc(cmsSyncLog.startedAt))
        .limit(1);

      const sources = await dbConn.select().from(cmsDataSources).orderBy(cmsDataSources.category);

      return {
        lastSync: lastSync ?? null,
        runningSync: runningSync ?? null,
        nextScheduledRun: getNextScheduledRun(),
        sources,
      };
    }),

  getSyncHistory: publicProcedure
    .input(adminInput.extend({
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(50).default(20),
    }))
    .query(async ({ input }) => {
      checkAdminPassword(input.adminPassword);
      const dbConn = await getDb();
      if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const offset = (input.page - 1) * input.pageSize;
      const [logs, countResult] = await Promise.all([
        dbConn
          .select()
          .from(cmsSyncLog)
          .orderBy(desc(cmsSyncLog.startedAt))
          .limit(input.pageSize)
          .offset(offset),
        dbConn.select({ count: sql<number>`count(*)` }).from(cmsSyncLog),
      ]);

      return {
        logs,
        total: Number(countResult[0]?.count ?? 0),
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  triggerSync: publicProcedure
    .input(adminInput)
    .mutation(async ({ input }) => {
      checkAdminPassword(input.adminPassword);
      // Run in background — don't await so the HTTP response returns immediately
      runCmsSync("manual").catch((err) =>
        console.error("[Admin] Manual sync failed:", err)
      );
      return { success: true, message: "Sync started. Check the sync status panel for progress." };
    }),

  // ── Seed non-commissionable plans ─────────────────────────────────────────
  seedNonCommPlans: publicProcedure
    .input(adminInput)
    .mutation(async ({ input }) => {
      checkAdminPassword(input.adminPassword);
      const dbConn = await getDb();
      if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      let inserted = 0;
      let updated = 0;

      for (const plan of NON_COMM_PLANS_2026) {
        const existing = await dbConn
          .select()
          .from(planOverrides)
          .where(eq(planOverrides.planId, plan.planId))
          .limit(1);

        if (existing.length > 0) {
          await dbConn
            .update(planOverrides)
            .set({
              isNonCommissionable: true,
              nonCommSource: plan.nonCommSource,
              nonCommEffectiveDate: plan.nonCommEffectiveDate,
              updatedAt: new Date(),
            })
            .where(eq(planOverrides.planId, plan.planId));
          updated++;
        } else {
          await dbConn.insert(planOverrides).values({
            planId: plan.planId,
            planName: plan.planName,
            carrierName: plan.carrierName,
            isEnabled: true,
            isNonCommissionable: true,
            nonCommSource: plan.nonCommSource,
            nonCommEffectiveDate: plan.nonCommEffectiveDate,
          });
          inserted++;
        }
      }

      return { success: true, inserted, updated, total: NON_COMM_PLANS_2026.length };
    }),

  // ── Get all disabled carrier names (used by public plans route) ───────────
  getDisabledCarriers: publicProcedure
    .input(adminInput)
    .query(async ({ input }) => {
      checkAdminPassword(input.adminPassword);
      const dbConn = await getDb();
      if (!dbConn) return { carriers: [] };

      const disabled = await dbConn
        .select({ carrierName: carrierOverrides.carrierName })
        .from(carrierOverrides)
        .where(eq(carrierOverrides.isEnabled, false));

      return { carriers: disabled.map((c) => c.carrierName) };
    }),
});
