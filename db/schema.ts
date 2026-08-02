import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const homes = sqliteTable("homes", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  acquiredAt: text("acquired_at").notNull(),
  yearBuilt: integer("year_built").notNull(),
  design: text("design").notNull(),
  livingAreaSqFt: integer("living_area_sq_ft").notNull(),
  lotSqFt: integer("lot_sq_ft").notNull(),
  roomCount: integer("room_count").notNull(),
  bedrooms: integer("bedrooms").notNull(),
  bathrooms: integer("bathrooms").notNull(),
  qualityRating: text("quality_rating").notNull(),
  conditionRating: text("condition_rating").notNull(),
  sourceLabel: text("source_label").notNull(),
  sourceDate: text("source_date").notNull(),
});

export const entities = sqliteTable("entities", {
  id: text("id").primaryKey(),
  homeId: text("home_id").notNull(),
  name: text("name").notNull(),
  kind: text("kind").notNull(),
  groupName: text("group_name").notNull(),
  condition: text("condition").notNull(),
  detail: text("detail").notNull(),
  sourcePage: integer("source_page").notNull(),
});

export const events = sqliteTable("events", {
  id: text("id").primaryKey(),
  homeId: text("home_id").notNull(),
  occurredAt: text("occurred_at").notNull(),
  title: text("title").notNull(),
  type: text("type").notNull(),
  summary: text("summary").notNull(),
  conditionBefore: text("condition_before"),
  conditionAfter: text("condition_after"),
  costCents: integer("cost_cents"),
  createdAt: text("created_at").notNull(),
});

export const eventTags = sqliteTable("event_tags", {
  eventId: text("event_id").notNull(),
  entityId: text("entity_id").notNull(),
});

export const evidence = sqliteTable("evidence", {
  id: text("id").primaryKey(),
  homeId: text("home_id").notNull(),
  label: text("label").notNull(),
  kind: text("kind").notNull(),
  sourceRef: text("source_ref").notNull(),
  capturedAt: text("captured_at").notNull(),
  visibility: text("visibility").notNull(),
});

export const eventEvidence = sqliteTable("event_evidence", {
  eventId: text("event_id").notNull(),
  evidenceId: text("evidence_id").notNull(),
});
