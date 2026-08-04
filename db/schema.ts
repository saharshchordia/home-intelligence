import { integer, primaryKey, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

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

export const documents = sqliteTable("documents", {
  id: text("id").primaryKey(),
  homeId: text("home_id").notNull(),
  title: text("title").notNull(),
  documentType: text("document_type").notNull(),
  sourceDate: text("source_date").notNull(),
  originalFilename: text("original_filename").notNull(),
  mimeType: text("mime_type").notNull(),
  pageCount: integer("page_count").notNull(),
  objectKey: text("object_key").notNull(),
  sha256: text("sha256").notNull(),
  storageStatus: text("storage_status").notNull(),
  visibility: text("visibility").notNull(),
  createdAt: text("created_at").notNull(),
});

export const assertions = sqliteTable("assertions", {
  id: text("id").primaryKey(),
  homeId: text("home_id").notNull(),
  documentId: text("document_id").notNull(),
  reportItem: text("report_item").notNull(),
  sourcePage: integer("source_page").notNull(),
  section: text("section").notNull(),
  title: text("title").notNull(),
  detail: text("detail").notNull(),
  severity: text("severity").notNull(),
  temporalStatus: text("temporal_status").notNull(),
  reviewStatus: text("review_status").notNull(),
  extractionConfidence: real("extraction_confidence").notNull(),
  entityConfidence: real("entity_confidence").notNull(),
  temporalConfidence: real("temporal_confidence").notNull(),
  locationRationale: text("location_rationale").notNull(),
  createdAt: text("created_at").notNull(),
});

export const assertionEntities = sqliteTable("assertion_entities", {
  assertionId: text("assertion_id").notNull(),
  entityId: text("entity_id").notNull(),
  relationship: text("relationship").notNull(),
  confidence: real("confidence").notNull(),
  status: text("status").notNull(),
  rationale: text("rationale").notNull(),
  reviewedAt: text("reviewed_at"),
}, (table) => [primaryKey({ columns: [table.assertionId, table.entityId] })]);

export const mediaAssets = sqliteTable("media_assets", {
  id: text("id").primaryKey(),
  documentId: text("document_id").notNull(),
  label: text("label").notNull(),
  kind: text("kind").notNull(),
  sourcePage: integer("source_page").notNull(),
  objectKey: text("object_key").notNull(),
  mimeType: text("mime_type").notNull(),
  sha256: text("sha256").notNull(),
  storageStatus: text("storage_status").notNull(),
  createdAt: text("created_at").notNull(),
});

export const assertionEvidence = sqliteTable("assertion_evidence", {
  assertionId: text("assertion_id").notNull(),
  mediaId: text("media_id").notNull(),
}, (table) => [primaryKey({ columns: [table.assertionId, table.mediaId] })]);

export const reviewDecisions = sqliteTable("review_decisions", {
  id: text("id").primaryKey(),
  assertionId: text("assertion_id").notNull(),
  entityId: text("entity_id").notNull(),
  decision: text("decision").notNull(),
  previousStatus: text("previous_status").notNull(),
  nextStatus: text("next_status").notNull(),
  note: text("note").notNull(),
  decidedAt: text("decided_at").notNull(),
});

export const spatialZones = sqliteTable("spatial_zones", {
  id: text("id").primaryKey(),
  homeId: text("home_id").notNull(),
  entityId: text("entity_id"),
  name: text("name").notNull(),
  mode: text("mode").notNull(),
  zoneType: text("zone_type").notNull(),
  geometryKind: text("geometry_kind").notNull(),
  x: real("x").notNull(),
  y: real("y").notNull(),
  z: real("z").notNull(),
  width: real("width").notNull(),
  height: real("height").notNull(),
  depth: real("depth").notNull(),
  color: text("color").notNull(),
  status: text("status").notNull(),
  createdAt: text("created_at").notNull(),
});

export const evidencePins = sqliteTable("evidence_pins", {
  id: text("id").primaryKey(),
  homeId: text("home_id").notNull(),
  assertionId: text("assertion_id").notNull(),
  mediaId: text("media_id"),
  zoneId: text("zone_id"),
  entityId: text("entity_id"),
  mode: text("mode").notNull(),
  x: real("x").notNull(),
  y: real("y").notNull(),
  z: real("z").notNull(),
  label: text("label").notNull(),
  confidence: real("confidence").notNull(),
  status: text("status").notNull(),
  rationale: text("rationale").notNull(),
  createdAt: text("created_at").notNull(),
});
