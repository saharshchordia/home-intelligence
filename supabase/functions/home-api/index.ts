import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.95.0";

type Db = ReturnType<typeof createAuthedClient>;

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,PUT,OPTIONS",
  "access-control-allow-headers": "authorization,content-type,x-content-sha256",
};

function createAuthedClient(request: Request) {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: request.headers.get("authorization") ?? "" } } },
  );
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}

function fail(message: string, status = 400) {
  return json({ error: message }, status);
}

function routePath(request: Request) {
  const url = new URL(request.url);
  return url.pathname.replace(/^\/home-api/, "") || "/";
}

function byKey<T extends Record<string, unknown>>(rows: T[], key: keyof T, value: unknown) {
  return rows.filter((row) => row[key] === value);
}

function homeFrom(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    acquiredAt: row.acquired_at,
    yearBuilt: row.year_built,
    design: row.design,
    livingAreaSqFt: row.living_area_sq_ft,
    lotSqFt: row.lot_sq_ft,
    roomCount: row.room_count,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    qualityRating: row.quality_rating,
    conditionRating: row.condition_rating,
    sourceLabel: row.source_label,
    sourceDate: row.source_date,
  };
}

async function selectAll(db: Db, table: string, query = "*") {
  const { data, error } = await db.from(table).select(query);
  if (error) throw error;
  return data ?? [];
}

async function readTwin(db: Db) {
  const [
    homes,
    entities,
    events,
    eventTags,
    evidence,
    eventEvidence,
    documents,
    assertions,
    assertionEntities,
    mediaAssets,
    assertionEvidence,
    spatialZones,
    evidencePins,
  ] = await Promise.all([
    selectAll(db, "homes"),
    selectAll(db, "entities"),
    selectAll(db, "events"),
    selectAll(db, "event_tags"),
    selectAll(db, "evidence"),
    selectAll(db, "event_evidence"),
    selectAll(db, "documents"),
    selectAll(db, "assertions"),
    selectAll(db, "assertion_entities"),
    selectAll(db, "media_assets"),
    selectAll(db, "assertion_evidence"),
    selectAll(db, "spatial_zones"),
    selectAll(db, "evidence_pins"),
  ]);
  const homeRow = homes[0];
  if (!homeRow) throw new Error("No home record is available for this user.");

  return {
    home: homeFrom(homeRow),
    entities: entities.map((row) => ({
      id: row.id,
      homeId: row.home_id,
      name: row.name,
      kind: row.kind,
      groupName: row.group_name,
      condition: row.condition,
      detail: row.detail,
      sourcePage: row.source_page,
    })),
    events: events.map((row) => ({
      id: row.id,
      homeId: row.home_id,
      occurredAt: row.occurred_at,
      title: row.title,
      type: row.type,
      summary: row.summary,
      conditionBefore: row.condition_before,
      conditionAfter: row.condition_after,
      costCents: row.cost_cents,
      createdAt: row.created_at,
      entityIds: byKey(eventTags, "event_id", row.id).map((tag) => tag.entity_id),
      evidenceIds: byKey(eventEvidence, "event_id", row.id).map((item) => item.evidence_id),
    })),
    evidence: evidence.map((row) => ({
      id: row.id,
      homeId: row.home_id,
      label: row.label,
      kind: row.kind,
      sourceRef: row.source_ref,
      capturedAt: row.captured_at,
      visibility: row.visibility,
    })),
    documents: documents.map((row) => ({
      id: row.id,
      homeId: row.home_id,
      title: row.title,
      documentType: row.document_type,
      sourceDate: row.source_date,
      originalFilename: row.original_filename,
      mimeType: row.mime_type,
      pageCount: row.page_count,
      storageStatus: row.storage_status,
    })),
    assertions: assertions.map((row) => ({
      id: row.id,
      homeId: row.home_id,
      documentId: row.document_id,
      reportItem: row.report_item,
      sourcePage: row.source_page,
      section: row.section,
      title: row.title,
      detail: row.detail,
      severity: row.severity,
      temporalStatus: row.temporal_status,
      reviewStatus: row.review_status,
      extractionConfidence: Number(row.extraction_confidence),
      entityConfidence: Number(row.entity_confidence),
      temporalConfidence: Number(row.temporal_confidence),
      locationRationale: row.location_rationale,
      entityLinks: byKey(assertionEntities, "assertion_id", row.id).map((link) => ({
        entityId: link.entity_id,
        relationship: link.relationship,
        confidence: Number(link.confidence),
        status: link.status,
        rationale: link.rationale,
      })),
      mediaIds: byKey(assertionEvidence, "assertion_id", row.id).map((item) => item.media_id),
    })),
    mediaAssets: mediaAssets.map((row) => ({
      id: row.id,
      documentId: row.document_id,
      label: row.label,
      kind: row.kind,
      sourcePage: row.source_page,
      objectKey: row.object_key,
      mimeType: row.mime_type,
      storageStatus: row.storage_status,
    })),
    spatialZones: spatialZones.map((row) => ({
      id: row.id,
      homeId: row.home_id,
      entityId: row.entity_id,
      name: row.name,
      mode: row.mode,
      zoneType: row.zone_type,
      geometryKind: row.geometry_kind,
      x: Number(row.x),
      y: Number(row.y),
      z: Number(row.z),
      width: Number(row.width),
      height: Number(row.height),
      depth: Number(row.depth),
      vertices: Array.isArray(row.vertices) ? row.vertices : [],
      color: row.color,
      status: row.status,
      createdAt: row.created_at,
    })),
    evidencePins: evidencePins.map((row) => ({
      id: row.id,
      homeId: row.home_id,
      assertionId: row.assertion_id,
      mediaId: row.media_id,
      zoneId: row.zone_id,
      entityId: row.entity_id,
      mode: row.mode,
      x: Number(row.x),
      y: Number(row.y),
      z: Number(row.z),
      label: row.label,
      confidence: Number(row.confidence),
      status: row.status,
      rationale: row.rationale,
      createdAt: row.created_at,
    })),
  };
}

async function createEvent(db: Db, request: Request) {
  const payload = await request.json();
  const entityIds = [...new Set(payload.entityIds ?? [])];
  if (!payload.title || !payload.occurredAt || !payload.summary || entityIds.length === 0) {
    return fail("Date, title, summary and at least one tag are required.");
  }
  const homeId = payload.homeId ?? "willow-house";
  const eventId = `evt-${crypto.randomUUID()}`;
  const evidenceId = payload.evidenceNote ? `ev-${crypto.randomUUID()}` : null;
  const { error } = await db.from("events").insert({
    id: eventId,
    home_id: homeId,
    occurred_at: payload.occurredAt,
    title: payload.title,
    type: payload.type ?? "Update",
    summary: payload.summary,
    condition_after: payload.conditionAfter || null,
    cost_cents: typeof payload.cost === "number" ? Math.round(payload.cost * 100) : null,
  });
  if (error) throw error;
  const { error: tagError } = await db.from("event_tags").insert(entityIds.map((entityId) => ({ event_id: eventId, entity_id: entityId })));
  if (tagError) throw tagError;
  if (evidenceId) {
    const { error: evidenceError } = await db.from("evidence").insert({
      id: evidenceId,
      home_id: homeId,
      label: "Update evidence",
      kind: "reference",
      source_ref: payload.evidenceNote,
      captured_at: payload.occurredAt,
      visibility: "private-source",
    });
    if (evidenceError) throw evidenceError;
    const { error: linkError } = await db.from("event_evidence").insert({ event_id: eventId, evidence_id: evidenceId });
    if (linkError) throw linkError;
  }
  return json(await readTwin(db), 201);
}

async function updateReview(db: Db, request: Request) {
  const payload = await request.json();
  if (!payload.assertionId || !payload.decision) return fail("Assertion and decision are required.");
  const targetEntityId = payload.targetEntityId ?? payload.entityId;
  const now = new Date().toISOString();

  if (payload.decision === "approve" && payload.entityId) {
    const { error } = await db.from("assertion_entities")
      .update({ status: "approved", reviewed_at: now })
      .eq("assertion_id", payload.assertionId)
      .eq("entity_id", payload.entityId);
    if (error) throw error;
  } else if ((payload.decision === "reject" || payload.decision === "remove") && payload.entityId) {
    const { error } = await db.from("assertion_entities")
      .update({ status: "rejected", reviewed_at: now })
      .eq("assertion_id", payload.assertionId)
      .eq("entity_id", payload.entityId);
    if (error) throw error;
  } else if ((payload.decision === "move" || payload.decision === "add") && targetEntityId) {
    if (payload.entityId) {
      const { error } = await db.from("assertion_entities")
        .update({ status: "rejected", reviewed_at: now })
        .eq("assertion_id", payload.assertionId)
        .eq("entity_id", payload.entityId);
      if (error) throw error;
    }
    const { error } = await db.from("assertion_entities").upsert({
      assertion_id: payload.assertionId,
      entity_id: targetEntityId,
      relationship: "human-selected",
      confidence: 1,
      status: "approved",
      rationale: payload.decision === "add" ? "Location manually added by homeowner." : "Location selected during human review.",
      reviewed_at: now,
    });
    if (error) throw error;
  } else {
    return fail("Unsupported review decision.");
  }

  const { data: links, error: linkError } = await db.from("assertion_entities").select("status").eq("assertion_id", payload.assertionId);
  if (linkError) throw linkError;
  const hasPending = links?.some((link) => link.status === "pending");
  const hasAccepted = links?.some((link) => ["approved", "auto-accepted"].includes(link.status));
  const { error: statusError } = await db.from("assertions")
    .update({ review_status: hasPending ? "pending" : hasAccepted ? "reviewed" : "unassigned" })
    .eq("id", payload.assertionId);
  if (statusError) throw statusError;
  return json(await readTwin(db));
}

async function updateSpatial(db: Db, request: Request) {
  const payload = await request.json();
  const homeId = payload.homeId ?? "willow-house";
  const now = new Date().toISOString();
  if (payload.action === "pin-evidence") {
    const { data: assertion, error: assertionError } = await db.from("assertions").select("title").eq("id", payload.assertionId).single();
    if (assertionError) throw assertionError;
    const { error } = await db.from("evidence_pins").insert({
      id: `pin-${crypto.randomUUID()}`,
      home_id: homeId,
      assertion_id: payload.assertionId,
      media_id: payload.mediaId ?? null,
      zone_id: payload.zoneId ?? null,
      entity_id: payload.entityId ?? null,
      mode: payload.mode,
      x: Number(payload.position?.x ?? 0),
      y: Number(payload.position?.y ?? 1),
      z: Number(payload.position?.z ?? 0),
      label: assertion.title,
      confidence: 1,
      status: "approved",
      rationale: "Precise model pin placed by homeowner review.",
      created_at: now,
    });
    if (error) throw error;
    return json(await readTwin(db));
  }
  if (payload.action === "create-zone") {
    const vertices = Array.isArray(payload.vertices)
      ? payload.vertices
        .map((vertex: unknown) => Array.isArray(vertex) && vertex.length === 3
          ? vertex.map((value) => Number(value))
          : null)
        .filter((vertex: unknown): vertex is number[] => Array.isArray(vertex) && vertex.every(Number.isFinite))
      : [];
    if (!payload.name || !payload.mode || (payload.geometryKind === "polygon" && vertices.length < 3)) {
      return fail("A zone name, model view, and at least three points are required.");
    }
    const xs = vertices.map((vertex: number[]) => vertex[0]);
    const ys = vertices.map((vertex: number[]) => vertex[1]);
    const zs = vertices.map((vertex: number[]) => vertex[2]);
    const min = (values: number[], fallback: number) => values.length ? Math.min(...values) : fallback;
    const max = (values: number[], fallback: number) => values.length ? Math.max(...values) : fallback;
    const center = (values: number[], fallback: number) => (min(values, fallback) + max(values, fallback)) / 2;
    const { error } = await db.from("spatial_zones").insert({
      id: `zone-${crypto.randomUUID()}`,
      home_id: homeId,
      entity_id: payload.entityId ?? null,
      name: payload.name,
      mode: payload.mode,
      zone_type: payload.zoneType ?? "custom",
      geometry_kind: payload.geometryKind ?? "box",
      x: center(xs, Number(payload.position?.x ?? 0)),
      y: center(ys, Number(payload.position?.y ?? 0.4)),
      z: center(zs, Number(payload.position?.z ?? 0)),
      width: Math.max(0.5, max(xs, 0) - min(xs, 0) || Number(payload.size?.width ?? 8)),
      height: Number(payload.size?.height ?? (payload.geometryKind === "polygon" ? 0.12 : 3)),
      depth: Math.max(0.5, max(zs, 0) - min(zs, 0) || Number(payload.size?.depth ?? 8)),
      vertices,
      color: payload.color ?? "#dfece5",
      status: "active",
      created_at: now,
    });
    if (error) throw error;
    return json(await readTwin(db), 201);
  }
  if (payload.action === "move-pins") {
    const moves = Array.isArray(payload.moves) ? payload.moves : [];
    if (moves.length === 0) return fail("Select at least one evidence pin to move.");
    const { data: zoneRows, error: zoneError } = await db.from("spatial_zones")
      .select("id,entity_id,mode,geometry_kind,x,y,z,width,height,depth,vertices")
      .eq("home_id", homeId);
    if (zoneError) throw zoneError;
    const containsPoint = (zone: Record<string, unknown>, position: number[]) => {
      if (zone.geometry_kind === "polygon" && Array.isArray(zone.vertices)) {
        const vertices = zone.vertices.filter(Array.isArray) as number[][];
        let inside = false;
        for (let index = 0, prior = vertices.length - 1; index < vertices.length; prior = index++) {
          const [x1, , z1] = vertices[index];
          const [x2, , z2] = vertices[prior];
          if ((z1 > position[2]) !== (z2 > position[2]) && position[0] < ((x2 - x1) * (position[2] - z1)) / (z2 - z1) + x1) inside = !inside;
        }
        return inside;
      }
      return Math.abs(position[0] - Number(zone.x)) <= Number(zone.width) / 2
        && Math.abs(position[1] - Number(zone.y)) <= Number(zone.height) / 2 + 0.5
        && Math.abs(position[2] - Number(zone.z)) <= Number(zone.depth) / 2;
    };
    for (const move of moves) {
      const position = Array.isArray(move?.position) ? move.position.map(Number) : [];
      if (!move?.id || position.length !== 3 || !position.every(Number.isFinite)) return fail("Each pin move needs a valid three-dimensional point.");
      const mode = String(move.mode ?? "");
      const matches = (zoneRows ?? []).filter((zone) => zone.mode === mode && containsPoint(zone, position));
      const zone = matches.sort((left, right) => Number(left.width) * Number(left.height) * Number(left.depth) - Number(right.width) * Number(right.height) * Number(right.depth))[0];
      const { data: pin, error: pinError } = await db.from("evidence_pins").select("assertion_id").eq("id", move.id).single();
      if (pinError) throw pinError;
      const { error: updateError } = await db.from("evidence_pins").update({
        mode,
        x: position[0], y: position[1], z: position[2],
        zone_id: zone?.id ?? null,
        entity_id: zone?.entity_id ?? null,
        confidence: 1,
        status: "approved",
        rationale: "Precise model location manually positioned by homeowner review.",
      }).eq("id", move.id);
      if (updateError) throw updateError;
      if (zone?.entity_id) {
        const { error: linkError } = await db.from("assertion_entities").upsert({
          assertion_id: pin.assertion_id,
          entity_id: zone.entity_id,
          relationship: "spatial-pin",
          confidence: 1,
          status: "approved",
          rationale: "Location confirmed by manual evidence-pin placement on the home model.",
          reviewed_at: now,
        });
        if (linkError) throw linkError;
      }
    }
    return json(await readTwin(db));
  }
  return fail("Unsupported spatial action.");
}

async function getEvidence(db: Db, request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return fail("Evidence id is required.");
  const { data: media } = await db.from("media_assets").select("object_key,mime_type,label").eq("id", id).maybeSingle();
  const { data: document } = media ? { data: null } : await db.from("documents").select("object_key,mime_type,title").eq("id", id).maybeSingle();
  const row = media ?? document;
  if (!row) return fail("Evidence not found.", 404);
  const objectKey = row.object_key;
  if (objectKey.startsWith("drive://")) {
    const driveId = objectKey.replace("drive://", "").replace("folders/", "");
    const target = objectKey.startsWith("drive://folders/")
      ? `https://drive.google.com/drive/folders/${driveId}`
      : `https://drive.google.com/file/d/${driveId}/view`;
    return Response.redirect(target, 302);
  }
  const { data, error } = await db.storage.from("home-evidence").download(objectKey);
  if (error) throw error;
  return new Response(data, {
    headers: {
      ...corsHeaders,
      "content-type": row.mime_type,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  try {
    const db = createAuthedClient(request);
    const path = routePath(request);
    const route = `${request.method} ${path}`;
    if (route === "GET /api/twin") return json(await readTwin(db));
    if (route === "POST /api/twin") return createEvent(db, request);
    if (route === "POST /api/review") return updateReview(db, request);
    if (route === "POST /api/spatial") return updateSpatial(db, request);
    if (route === "GET /api/evidence") return getEvidence(db, request);
    return fail("Not found.", 404);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Home Intelligence API failed.", 500);
  }
});
