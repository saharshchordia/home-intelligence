import { env as cloudflareEnv } from "cloudflare:workers";
import {
  baselineEntities,
  baselineEvent,
  baselineEvidence,
  baselineHome,
  drivePhotoWalkAssertions,
  drivePhotoWalkDocument,
  drivePhotoWalkEvent,
  drivePhotoWalkMedia,
  drivePhotoWalkPins,
  baselineSpatialZones,
  type EvidencePin,
  type Evidence,
  type InspectionAssertion,
  type MediaAsset,
  type SourceDocument,
  type SpatialZone,
  type TwinEntity,
  type TwinEvent,
  type TwinPayload,
} from "../twin-data";

type RuntimeBindings = {
  DB?: D1Database;
  EVIDENCE_BUCKET?: R2Bucket;
};

let runtimeBindings: RuntimeBindings | null = null;

export function configureTwinStore(bindings: RuntimeBindings) {
  runtimeBindings = bindings;
}

export const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS homes (id TEXT PRIMARY KEY, name TEXT NOT NULL, location TEXT NOT NULL, acquired_at TEXT NOT NULL, year_built INTEGER NOT NULL, design TEXT NOT NULL, living_area_sq_ft INTEGER NOT NULL, lot_sq_ft INTEGER NOT NULL, room_count INTEGER NOT NULL, bedrooms INTEGER NOT NULL, bathrooms INTEGER NOT NULL, quality_rating TEXT NOT NULL, condition_rating TEXT NOT NULL, source_label TEXT NOT NULL, source_date TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS entities (id TEXT PRIMARY KEY, home_id TEXT NOT NULL, name TEXT NOT NULL, kind TEXT NOT NULL, group_name TEXT NOT NULL, condition TEXT NOT NULL, detail TEXT NOT NULL, source_page INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, home_id TEXT NOT NULL, occurred_at TEXT NOT NULL, title TEXT NOT NULL, type TEXT NOT NULL, summary TEXT NOT NULL, condition_before TEXT, condition_after TEXT, cost_cents INTEGER, created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS event_tags (event_id TEXT NOT NULL, entity_id TEXT NOT NULL, PRIMARY KEY (event_id, entity_id))`,
  `CREATE TABLE IF NOT EXISTS evidence (id TEXT PRIMARY KEY, home_id TEXT NOT NULL, label TEXT NOT NULL, kind TEXT NOT NULL, source_ref TEXT NOT NULL, captured_at TEXT NOT NULL, visibility TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS event_evidence (event_id TEXT NOT NULL, evidence_id TEXT NOT NULL, PRIMARY KEY (event_id, evidence_id))`,
  `CREATE TABLE IF NOT EXISTS documents (id TEXT PRIMARY KEY, home_id TEXT NOT NULL, title TEXT NOT NULL, document_type TEXT NOT NULL, source_date TEXT NOT NULL, original_filename TEXT NOT NULL, mime_type TEXT NOT NULL, page_count INTEGER NOT NULL, object_key TEXT NOT NULL, sha256 TEXT NOT NULL, storage_status TEXT NOT NULL, visibility TEXT NOT NULL, created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS assertions (id TEXT PRIMARY KEY, home_id TEXT NOT NULL, document_id TEXT NOT NULL, report_item TEXT NOT NULL, source_page INTEGER NOT NULL, section TEXT NOT NULL, title TEXT NOT NULL, detail TEXT NOT NULL, severity TEXT NOT NULL, temporal_status TEXT NOT NULL, review_status TEXT NOT NULL, extraction_confidence REAL NOT NULL, entity_confidence REAL NOT NULL, temporal_confidence REAL NOT NULL, location_rationale TEXT NOT NULL, created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS assertion_entities (assertion_id TEXT NOT NULL, entity_id TEXT NOT NULL, relationship TEXT NOT NULL, confidence REAL NOT NULL, status TEXT NOT NULL, rationale TEXT NOT NULL, reviewed_at TEXT, PRIMARY KEY (assertion_id, entity_id))`,
  `CREATE TABLE IF NOT EXISTS media_assets (id TEXT PRIMARY KEY, document_id TEXT NOT NULL, label TEXT NOT NULL, kind TEXT NOT NULL, source_page INTEGER NOT NULL, object_key TEXT NOT NULL, mime_type TEXT NOT NULL, sha256 TEXT NOT NULL, storage_status TEXT NOT NULL, created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS assertion_evidence (assertion_id TEXT NOT NULL, media_id TEXT NOT NULL, PRIMARY KEY (assertion_id, media_id))`,
  `CREATE TABLE IF NOT EXISTS review_decisions (id TEXT PRIMARY KEY, assertion_id TEXT NOT NULL, entity_id TEXT NOT NULL, decision TEXT NOT NULL, previous_status TEXT NOT NULL, next_status TEXT NOT NULL, note TEXT NOT NULL, decided_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS spatial_zones (id TEXT PRIMARY KEY, home_id TEXT NOT NULL, entity_id TEXT, name TEXT NOT NULL, mode TEXT NOT NULL, zone_type TEXT NOT NULL, geometry_kind TEXT NOT NULL, x REAL NOT NULL, y REAL NOT NULL, z REAL NOT NULL, width REAL NOT NULL, height REAL NOT NULL, depth REAL NOT NULL, color TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS evidence_pins (id TEXT PRIMARY KEY, home_id TEXT NOT NULL, assertion_id TEXT NOT NULL, media_id TEXT, zone_id TEXT, entity_id TEXT, mode TEXT NOT NULL, x REAL NOT NULL, y REAL NOT NULL, z REAL NOT NULL, label TEXT NOT NULL, confidence REAL NOT NULL, status TEXT NOT NULL, rationale TEXT NOT NULL, created_at TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS events_date_idx ON events(home_id, occurred_at DESC)`,
  `CREATE INDEX IF NOT EXISTS event_tags_entity_idx ON event_tags(entity_id, event_id)`,
  `CREATE INDEX IF NOT EXISTS assertions_document_idx ON assertions(document_id, source_page)`,
  `CREATE INDEX IF NOT EXISTS assertions_review_idx ON assertions(review_status, severity)`,
  `CREATE INDEX IF NOT EXISTS assertion_entities_entity_idx ON assertion_entities(entity_id, status)`,
  `CREATE INDEX IF NOT EXISTS media_assets_document_idx ON media_assets(document_id, source_page)`,
  `CREATE INDEX IF NOT EXISTS spatial_zones_entity_idx ON spatial_zones(entity_id, mode)`,
  `CREATE INDEX IF NOT EXISTS evidence_pins_assertion_idx ON evidence_pins(assertion_id, status)`,
  `CREATE INDEX IF NOT EXISTS evidence_pins_zone_idx ON evidence_pins(zone_id, status)`,
];

export function getD1() {
  const env = runtimeBindings ?? cloudflareEnv;
  if (!env.DB) throw new Error("Home Intelligence database is unavailable.");
  return env.DB;
}

export function getEvidenceBucket() {
  const env = runtimeBindings ?? cloudflareEnv;
  const bucket = (env as unknown as { EVIDENCE_BUCKET?: R2Bucket }).EVIDENCE_BUCKET;
  if (!bucket) throw new Error("Private evidence storage is unavailable.");
  return bucket;
}

export async function runInChunks(statements: D1PreparedStatement[], size = 75) {
  const db = getD1();
  for (let index = 0; index < statements.length; index += size) {
    await db.batch(statements.slice(index, index + size));
  }
}

export async function ensureDatabase() {
  const db = getD1();
  await runInChunks(schemaStatements.map((sql) => db.prepare(sql)));

  const statements = [
    db.prepare("INSERT OR IGNORE INTO homes (id, name, location, acquired_at, year_built, design, living_area_sq_ft, lot_sq_ft, room_count, bedrooms, bathrooms, quality_rating, condition_rating, source_label, source_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(
      baselineHome.id, baselineHome.name, baselineHome.location, baselineHome.acquiredAt,
      baselineHome.yearBuilt, baselineHome.design, baselineHome.livingAreaSqFt,
      baselineHome.lotSqFt, baselineHome.roomCount, baselineHome.bedrooms,
      baselineHome.bathrooms, baselineHome.qualityRating, baselineHome.conditionRating,
      baselineHome.sourceLabel, baselineHome.sourceDate,
    ),
    ...baselineEntities.map((entity) => db.prepare("INSERT OR IGNORE INTO entities (id, home_id, name, kind, group_name, condition, detail, source_page) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(
      entity.id, entity.homeId, entity.name, entity.kind, entity.groupName,
      entity.condition, entity.detail, entity.sourcePage,
    )),
    db.prepare("UPDATE entities SET name = ?, detail = ? WHERE id = ?").bind("Upstairs hall bathroom", "The single upper-level hall bath sits at the end of the second-floor hallway.", "upstairs-hall-bathroom"),
    db.prepare("UPDATE entities SET detail = ? WHERE id = ?").bind("Laundry is positioned near the rear entry on the first floor in the corrected acquisition sketch.", "laundry"),
    db.prepare("UPDATE entities SET name = ?, detail = ? WHERE id = ?").bind("Upper-level bathroom (legacy)", "Legacy placeholder from the first draft model. Use Upstairs hall bathroom for new location tags.", "upper-level-bathroom"),
    ...baselineEvidence.map((item) => db.prepare("INSERT OR IGNORE INTO evidence (id, home_id, label, kind, source_ref, captured_at, visibility) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(
      item.id, item.homeId, item.label, item.kind, item.sourceRef, item.capturedAt, item.visibility,
    )),
    db.prepare("INSERT OR IGNORE INTO events (id, home_id, occurred_at, title, type, summary, condition_before, condition_after, cost_cents, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(
      baselineEvent.id, baselineEvent.homeId, baselineEvent.occurredAt, baselineEvent.title,
      baselineEvent.type, baselineEvent.summary, baselineEvent.conditionBefore,
      baselineEvent.conditionAfter, baselineEvent.costCents, baselineEvent.createdAt,
    ),
    ...baselineEvent.entityIds.map((entityId) => db.prepare("INSERT OR IGNORE INTO event_tags (event_id, entity_id) VALUES (?, ?)").bind(baselineEvent.id, entityId)),
    ...baselineEvent.evidenceIds.map((evidenceId) => db.prepare("INSERT OR IGNORE INTO event_evidence (event_id, evidence_id) VALUES (?, ?)").bind(baselineEvent.id, evidenceId)),
    db.prepare("INSERT OR REPLACE INTO documents (id, home_id, title, document_type, source_date, original_filename, mime_type, page_count, object_key, sha256, storage_status, visibility, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(
      drivePhotoWalkDocument.id, drivePhotoWalkDocument.homeId, drivePhotoWalkDocument.title,
      drivePhotoWalkDocument.documentType, drivePhotoWalkDocument.sourceDate,
      drivePhotoWalkDocument.originalFilename, drivePhotoWalkDocument.mimeType,
      drivePhotoWalkDocument.pageCount, drivePhotoWalkDocument.objectKey,
      drivePhotoWalkDocument.sha256, drivePhotoWalkDocument.storageStatus,
      drivePhotoWalkDocument.visibility, "2026-08-02T23:33:36.877Z",
    ),
    db.prepare("INSERT OR REPLACE INTO events (id, home_id, occurred_at, title, type, summary, condition_before, condition_after, cost_cents, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(
      drivePhotoWalkEvent.id, drivePhotoWalkEvent.homeId, drivePhotoWalkEvent.occurredAt,
      drivePhotoWalkEvent.title, drivePhotoWalkEvent.type, drivePhotoWalkEvent.summary,
      drivePhotoWalkEvent.conditionBefore, drivePhotoWalkEvent.conditionAfter,
      drivePhotoWalkEvent.costCents, drivePhotoWalkEvent.createdAt,
    ),
    ...drivePhotoWalkEvent.entityIds.map((entityId) => db.prepare("INSERT OR IGNORE INTO event_tags (event_id, entity_id) VALUES (?, ?)").bind(drivePhotoWalkEvent.id, entityId)),
    ...drivePhotoWalkEvent.evidenceIds.map((evidenceId) => db.prepare("INSERT OR IGNORE INTO event_evidence (event_id, evidence_id) VALUES (?, ?)").bind(drivePhotoWalkEvent.id, evidenceId)),
    ...drivePhotoWalkMedia.map((asset) => db.prepare("INSERT OR REPLACE INTO media_assets (id, document_id, label, kind, source_page, object_key, mime_type, sha256, storage_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(
      asset.id, asset.documentId, asset.label, asset.kind, asset.sourcePage,
      asset.objectKey, asset.mimeType, asset.sha256, asset.storageStatus,
      "2026-08-02T23:33:36.877Z",
    )),
    ...drivePhotoWalkAssertions.flatMap((assertion) => [
      db.prepare("INSERT OR REPLACE INTO assertions (id, home_id, document_id, report_item, source_page, section, title, detail, severity, temporal_status, review_status, extraction_confidence, entity_confidence, temporal_confidence, location_rationale, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(
        assertion.id, assertion.homeId, assertion.documentId, assertion.reportItem,
        assertion.sourcePage, assertion.section, assertion.title, assertion.detail,
        assertion.severity, assertion.temporalStatus, assertion.reviewStatus,
        assertion.extractionConfidence, assertion.entityConfidence,
        assertion.temporalConfidence, assertion.locationRationale,
        "2026-08-02T23:33:36.877Z",
      ),
      ...assertion.entityLinks.map((link) => db.prepare("INSERT OR REPLACE INTO assertion_entities (assertion_id, entity_id, relationship, confidence, status, rationale, reviewed_at) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(
        assertion.id, link.entityId, link.relationship, link.confidence,
        link.status, link.rationale, null,
      )),
      ...assertion.mediaIds.map((mediaId) => db.prepare("INSERT OR REPLACE INTO assertion_evidence (assertion_id, media_id) VALUES (?, ?)").bind(assertion.id, mediaId)),
    ]),
    ...baselineSpatialZones.map((zone) => db.prepare("INSERT OR IGNORE INTO spatial_zones (id, home_id, entity_id, name, mode, zone_type, geometry_kind, x, y, z, width, height, depth, color, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(
      zone.id, zone.homeId, zone.entityId, zone.name, zone.mode, zone.zoneType,
      zone.geometryKind, zone.x, zone.y, zone.z, zone.width, zone.height,
      zone.depth, zone.color, zone.status, zone.createdAt,
    )),
    ...drivePhotoWalkPins.map((pin) => db.prepare("INSERT OR IGNORE INTO evidence_pins (id, home_id, assertion_id, media_id, zone_id, entity_id, mode, x, y, z, label, confidence, status, rationale, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(
      pin.id, pin.homeId, pin.assertionId, pin.mediaId, pin.zoneId, pin.entityId,
      pin.mode, pin.x, pin.y, pin.z, pin.label, pin.confidence, pin.status,
      pin.rationale, pin.createdAt,
    )),
  ];
  await runInChunks(statements);
}

export async function readTwin(): Promise<TwinPayload> {
  await ensureDatabase();
  const db = getD1();
  const [homeResult, entityResult, eventResult, tagResult, evidenceResult, eventEvidenceResult, documentResult, assertionResult, assertionEntityResult, mediaResult, assertionEvidenceResult, zoneResult, pinResult] = await Promise.all([
    db.prepare("SELECT * FROM homes LIMIT 1").first<Record<string, unknown>>(),
    db.prepare("SELECT * FROM entities ORDER BY kind, group_name, name").all<Record<string, unknown>>(),
    db.prepare("SELECT * FROM events ORDER BY occurred_at DESC, created_at DESC").all<Record<string, unknown>>(),
    db.prepare("SELECT event_id, entity_id FROM event_tags").all<Record<string, string>>(),
    db.prepare("SELECT * FROM evidence ORDER BY captured_at DESC").all<Record<string, unknown>>(),
    db.prepare("SELECT event_id, evidence_id FROM event_evidence").all<Record<string, string>>(),
    db.prepare("SELECT * FROM documents ORDER BY source_date DESC").all<Record<string, unknown>>(),
    db.prepare("SELECT * FROM assertions ORDER BY source_page, report_item").all<Record<string, unknown>>(),
    db.prepare("SELECT * FROM assertion_entities").all<Record<string, unknown>>(),
    db.prepare("SELECT * FROM media_assets ORDER BY source_page, id").all<Record<string, unknown>>(),
    db.prepare("SELECT assertion_id, media_id FROM assertion_evidence").all<Record<string, string>>(),
    db.prepare("SELECT * FROM spatial_zones ORDER BY mode, zone_type, name").all<Record<string, unknown>>(),
    db.prepare("SELECT * FROM evidence_pins ORDER BY created_at DESC, label").all<Record<string, unknown>>(),
  ]);

  if (!homeResult) throw new Error("The home record could not be initialized.");
  const homeRow = homeResult;
  const home = {
    id: String(homeRow.id), name: String(homeRow.name), location: String(homeRow.location),
    acquiredAt: String(homeRow.acquired_at), yearBuilt: Number(homeRow.year_built),
    design: String(homeRow.design), livingAreaSqFt: Number(homeRow.living_area_sq_ft),
    lotSqFt: Number(homeRow.lot_sq_ft), roomCount: Number(homeRow.room_count),
    bedrooms: Number(homeRow.bedrooms), bathrooms: Number(homeRow.bathrooms),
    qualityRating: String(homeRow.quality_rating), conditionRating: String(homeRow.condition_rating),
    sourceLabel: String(homeRow.source_label), sourceDate: String(homeRow.source_date),
  };

  const entities = entityResult.results.map((row) => ({
    id: String(row.id), homeId: String(row.home_id), name: String(row.name),
    kind: String(row.kind) as TwinEntity["kind"], groupName: String(row.group_name),
    condition: String(row.condition), detail: String(row.detail), sourcePage: Number(row.source_page),
  }));
  const evidence = evidenceResult.results.map((row) => ({
    id: String(row.id), homeId: String(row.home_id), label: String(row.label),
    kind: String(row.kind), sourceRef: String(row.source_ref), capturedAt: String(row.captured_at),
    visibility: String(row.visibility),
  } satisfies Evidence));
  const events = eventResult.results.map((row) => ({
    id: String(row.id), homeId: String(row.home_id), occurredAt: String(row.occurred_at),
    title: String(row.title), type: String(row.type), summary: String(row.summary),
    conditionBefore: row.condition_before ? String(row.condition_before) : null,
    conditionAfter: row.condition_after ? String(row.condition_after) : null,
    costCents: row.cost_cents == null ? null : Number(row.cost_cents), createdAt: String(row.created_at),
    entityIds: tagResult.results.filter((tag) => tag.event_id === row.id).map((tag) => tag.entity_id),
    evidenceIds: eventEvidenceResult.results.filter((item) => item.event_id === row.id).map((item) => item.evidence_id),
  } satisfies TwinEvent));
  const documents = documentResult.results.map((row) => ({
    id: String(row.id), homeId: String(row.home_id), title: String(row.title),
    documentType: String(row.document_type), sourceDate: String(row.source_date),
    originalFilename: String(row.original_filename), mimeType: String(row.mime_type),
    pageCount: Number(row.page_count), storageStatus: String(row.storage_status),
  } satisfies SourceDocument));
  const mediaAssets = mediaResult.results.map((row) => ({
    id: String(row.id), documentId: String(row.document_id), label: String(row.label),
    kind: String(row.kind), sourcePage: Number(row.source_page), objectKey: String(row.object_key),
    mimeType: String(row.mime_type),
    storageStatus: String(row.storage_status),
  } satisfies MediaAsset));
  const assertions = assertionResult.results.map((row) => ({
    id: String(row.id), homeId: String(row.home_id), documentId: String(row.document_id),
    reportItem: String(row.report_item), sourcePage: Number(row.source_page), section: String(row.section),
    title: String(row.title), detail: String(row.detail), severity: String(row.severity) as InspectionAssertion["severity"],
    temporalStatus: String(row.temporal_status) as InspectionAssertion["temporalStatus"],
    reviewStatus: String(row.review_status) as InspectionAssertion["reviewStatus"],
    extractionConfidence: Number(row.extraction_confidence), entityConfidence: Number(row.entity_confidence),
    temporalConfidence: Number(row.temporal_confidence), locationRationale: String(row.location_rationale),
    entityLinks: assertionEntityResult.results.filter((link) => link.assertion_id === row.id).map((link) => ({
      entityId: String(link.entity_id), relationship: String(link.relationship), confidence: Number(link.confidence),
      status: String(link.status) as InspectionAssertion["entityLinks"][number]["status"], rationale: String(link.rationale),
    })),
    mediaIds: assertionEvidenceResult.results.filter((item) => item.assertion_id === row.id).map((item) => item.media_id),
  } satisfies InspectionAssertion));
  const spatialZones = zoneResult.results.map((row) => ({
    id: String(row.id), homeId: String(row.home_id),
    entityId: row.entity_id ? String(row.entity_id) : null,
    name: String(row.name), mode: String(row.mode) as SpatialZone["mode"],
    zoneType: String(row.zone_type) as SpatialZone["zoneType"],
    geometryKind: String(row.geometry_kind) as SpatialZone["geometryKind"],
    x: Number(row.x), y: Number(row.y), z: Number(row.z),
    width: Number(row.width), height: Number(row.height), depth: Number(row.depth),
    color: String(row.color), status: String(row.status) as SpatialZone["status"],
    createdAt: String(row.created_at),
  } satisfies SpatialZone));
  const evidencePins = pinResult.results.map((row) => ({
    id: String(row.id), homeId: String(row.home_id), assertionId: String(row.assertion_id),
    mediaId: row.media_id ? String(row.media_id) : null,
    zoneId: row.zone_id ? String(row.zone_id) : null,
    entityId: row.entity_id ? String(row.entity_id) : null,
    mode: String(row.mode) as EvidencePin["mode"],
    x: Number(row.x), y: Number(row.y), z: Number(row.z),
    label: String(row.label), confidence: Number(row.confidence),
    status: String(row.status) as EvidencePin["status"],
    rationale: String(row.rationale), createdAt: String(row.created_at),
  } satisfies EvidencePin));

  return { home, entities, events, evidence, documents, assertions, mediaAssets, spatialZones, evidencePins };
}
