import { createClient } from "@supabase/supabase-js";
import {
  baselineTwin,
  drivePhotoWalkDocument,
  drivePhotoWalkMedia,
} from "../lib/twin-data";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ownerUserId = process.env.HOME_OWNER_USER_ID;

if (!supabaseUrl || !serviceRoleKey || !ownerUserId) {
  throw new Error("SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and HOME_OWNER_USER_ID are required.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

async function upsert(table: string, rows: unknown[]) {
  if (rows.length === 0) return;
  const { error } = await supabase.from(table).upsert(rows);
  if (error) throw new Error(`${table}: ${error.message}`);
}

async function main() {
  const { home } = baselineTwin;

  await upsert("home_memberships", [{
    home_id: home.id,
    user_id: ownerUserId,
    role: "owner",
  }]);

  await upsert("homes", [{
    id: home.id,
    name: home.name,
    location: home.location,
    acquired_at: home.acquiredAt,
    year_built: home.yearBuilt,
    design: home.design,
    living_area_sq_ft: home.livingAreaSqFt,
    lot_sq_ft: home.lotSqFt,
    room_count: home.roomCount,
    bedrooms: home.bedrooms,
    bathrooms: home.bathrooms,
    quality_rating: home.qualityRating,
    condition_rating: home.conditionRating,
    source_label: home.sourceLabel,
    source_date: home.sourceDate,
    owner_user_id: ownerUserId,
  }]);

  await upsert("entities", baselineTwin.entities.map((entity) => ({
    id: entity.id,
    home_id: entity.homeId,
    name: entity.name,
    kind: entity.kind,
    group_name: entity.groupName,
    condition: entity.condition,
    detail: entity.detail,
    source_page: entity.sourcePage,
  })));

  await upsert("evidence", baselineTwin.evidence.map((item) => ({
    id: item.id,
    home_id: item.homeId,
    label: item.label,
    kind: item.kind,
    source_ref: item.sourceRef,
    captured_at: item.capturedAt,
    visibility: item.visibility,
  })));

  await upsert("events", baselineTwin.events.map((event) => ({
    id: event.id,
    home_id: event.homeId,
    occurred_at: event.occurredAt,
    title: event.title,
    type: event.type,
    summary: event.summary,
    condition_before: event.conditionBefore,
    condition_after: event.conditionAfter,
    cost_cents: event.costCents,
    created_at: event.createdAt,
  })));

  await upsert("event_tags", baselineTwin.events.flatMap((event) =>
    event.entityIds.map((entityId) => ({ event_id: event.id, entity_id: entityId })),
  ));

  await upsert("event_evidence", baselineTwin.events.flatMap((event) =>
    event.evidenceIds.map((evidenceId) => ({ event_id: event.id, evidence_id: evidenceId })),
  ));

  await upsert("documents", [{
    id: drivePhotoWalkDocument.id,
    home_id: drivePhotoWalkDocument.homeId,
    title: drivePhotoWalkDocument.title,
    document_type: drivePhotoWalkDocument.documentType,
    source_date: drivePhotoWalkDocument.sourceDate,
    original_filename: drivePhotoWalkDocument.originalFilename,
    mime_type: drivePhotoWalkDocument.mimeType,
    page_count: drivePhotoWalkDocument.pageCount,
    object_key: drivePhotoWalkDocument.objectKey,
    sha256: drivePhotoWalkDocument.sha256,
    storage_status: drivePhotoWalkDocument.storageStatus,
    visibility: drivePhotoWalkDocument.visibility,
    created_at: "2026-08-02T23:33:36.877Z",
  }]);

  await upsert("media_assets", drivePhotoWalkMedia.map((asset) => ({
    id: asset.id,
    document_id: asset.documentId,
    label: asset.label,
    kind: asset.kind,
    source_page: asset.sourcePage,
    object_key: asset.objectKey,
    mime_type: asset.mimeType,
    sha256: asset.sha256,
    storage_status: asset.storageStatus,
    created_at: "2026-08-02T23:33:36.877Z",
  })));

  await upsert("assertions", baselineTwin.assertions.map((assertion) => ({
    id: assertion.id,
    home_id: assertion.homeId,
    document_id: assertion.documentId,
    report_item: assertion.reportItem,
    source_page: assertion.sourcePage,
    section: assertion.section,
    title: assertion.title,
    detail: assertion.detail,
    severity: assertion.severity,
    temporal_status: assertion.temporalStatus,
    review_status: assertion.reviewStatus,
    extraction_confidence: assertion.extractionConfidence,
    entity_confidence: assertion.entityConfidence,
    temporal_confidence: assertion.temporalConfidence,
    location_rationale: assertion.locationRationale,
    created_at: "2026-08-02T23:33:36.877Z",
  })));

  await upsert("assertion_entities", baselineTwin.assertions.flatMap((assertion) =>
    assertion.entityLinks.map((link) => ({
      assertion_id: assertion.id,
      entity_id: link.entityId,
      relationship: link.relationship,
      confidence: link.confidence,
      status: link.status,
      rationale: link.rationale,
      reviewed_at: null,
    })),
  ));

  await upsert("assertion_evidence", baselineTwin.assertions.flatMap((assertion) =>
    assertion.mediaIds.map((mediaId) => ({ assertion_id: assertion.id, media_id: mediaId })),
  ));

  await upsert("spatial_zones", baselineTwin.spatialZones.map((zone) => ({
    id: zone.id,
    home_id: zone.homeId,
    entity_id: zone.entityId,
    name: zone.name,
    mode: zone.mode,
    zone_type: zone.zoneType,
    geometry_kind: zone.geometryKind,
    x: zone.x,
    y: zone.y,
    z: zone.z,
    width: zone.width,
    height: zone.height,
    depth: zone.depth,
    color: zone.color,
    status: zone.status,
    created_at: zone.createdAt,
  })));

  await upsert("evidence_pins", baselineTwin.evidencePins.map((pin) => ({
    id: pin.id,
    home_id: pin.homeId,
    assertion_id: pin.assertionId,
    media_id: pin.mediaId,
    zone_id: pin.zoneId,
    entity_id: pin.entityId,
    mode: pin.mode,
    x: pin.x,
    y: pin.y,
    z: pin.z,
    label: pin.label,
    confidence: pin.confidence,
    status: pin.status,
    rationale: pin.rationale,
    created_at: pin.createdAt,
  })));

  console.log(`Seeded ${home.name} into ${supabaseUrl}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
