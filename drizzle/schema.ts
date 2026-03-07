import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Admin: Carrier Overrides ────────────────────────────────────────────────
// Controls whether a carrier's plans appear on the public-facing results page.
export const carrierOverrides = mysqlTable("carrier_overrides", {
  id: int("id").autoincrement().primaryKey(),
  /** Normalized carrier name (e.g. "UnitedHealthcare") */
  carrierName: varchar("carrierName", { length: 128 }).notNull().unique(),
  /** When false, ALL plans from this carrier are hidden from public results */
  isEnabled: boolean("isEnabled").default(true).notNull(),
  /** Optional admin note */
  notes: text("notes"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  updatedBy: varchar("updatedBy", { length: 128 }),
});

export type CarrierOverride = typeof carrierOverrides.$inferSelect;
export type InsertCarrierOverride = typeof carrierOverrides.$inferInsert;

// ─── Admin: Plan Overrides ───────────────────────────────────────────────────
// Per-plan visibility and commission status flags.
export const planOverrides = mysqlTable("plan_overrides", {
  id: int("id").autoincrement().primaryKey(),
  /** CMS contract-PBP identifier (e.g. "H1234-001") */
  planId: varchar("planId", { length: 64 }).notNull().unique(),
  planName: varchar("planName", { length: 256 }),
  carrierName: varchar("carrierName", { length: 128 }),
  /** When false, this plan is hidden from public results */
  isEnabled: boolean("isEnabled").default(true).notNull(),
  /** True when this plan does not pay agent commission */
  isNonCommissionable: boolean("isNonCommissionable").default(false).notNull(),
  /** Source URL or document name for the non-commissionable designation */
  nonCommSource: text("nonCommSource"),
  /** Date the non-commissionable status took effect */
  nonCommEffectiveDate: varchar("nonCommEffectiveDate", { length: 32 }),
  /** Optional admin note */
  notes: text("notes"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  updatedBy: varchar("updatedBy", { length: 128 }),
});

export type PlanOverride = typeof planOverrides.$inferSelect;
export type InsertPlanOverride = typeof planOverrides.$inferInsert;

// ─── CMS Data Sources ────────────────────────────────────────────────────────
// Registry of CMS data files the pipeline monitors.
export const cmsDataSources = mysqlTable("cms_data_sources", {
  id: int("id").autoincrement().primaryKey(),
  /** Human-readable name (e.g. "MA Landscape File CY2026") */
  name: varchar("name", { length: 256 }).notNull(),
  /** CMS URL or file path */
  url: text("url").notNull(),
  /** Category for grouping in the admin UI */
  category: mysqlEnum("category", [
    "landscape",
    "pbp",
    "star_ratings",
    "enrollment",
    "service_area",
  ]).notNull(),
  /** SHA-256 hash of last downloaded file (for change detection) */
  lastFileHash: varchar("lastFileHash", { length: 64 }),
  lastCheckedAt: timestamp("lastCheckedAt"),
  lastUpdatedAt: timestamp("lastUpdatedAt"),
  /** Whether this source is active in the pipeline */
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CmsDataSource = typeof cmsDataSources.$inferSelect;
export type InsertCmsDataSource = typeof cmsDataSources.$inferInsert;

// ─── CMS Sync Log ────────────────────────────────────────────────────────────
// Audit trail for every pipeline run (scheduled or manual).
export const cmsSyncLog = mysqlTable("cms_sync_log", {
  id: int("id").autoincrement().primaryKey(),
  /** "scheduled" | "manual" */
  triggerType: mysqlEnum("triggerType", ["scheduled", "manual"]).notNull(),
  status: mysqlEnum("status", ["running", "success", "partial", "error"]).notNull(),
  /** Number of data sources checked */
  sourcesChecked: int("sourcesChecked").default(0).notNull(),
  /** Number of sources where new data was found and processed */
  sourcesUpdated: int("sourcesUpdated").default(0).notNull(),
  /** Number of plan records inserted/updated */
  plansProcessed: int("plansProcessed").default(0).notNull(),
  /** Error message if status = "error" */
  errorMessage: text("errorMessage"),
  /** Full JSON log of per-source results */
  detailLog: text("detailLog"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type CmsSyncLog = typeof cmsSyncLog.$inferSelect;
export type InsertCmsSyncLog = typeof cmsSyncLog.$inferInsert;
