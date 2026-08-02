import { env } from "cloudflare:workers";
import {
  baselineEntities,
  baselineEvent,
  baselineEvidence,
  baselineHome,
  type Evidence,
  type TwinEntity,
  type TwinEvent,
  type TwinPayload,
} from "../../../lib/twin-data";

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS homes (id TEXT PRIMARY KEY, name TEXT NOT NULL, location TEXT NOT NULL, acquired_at TEXT NOT NULL, year_built INTEGER NOT NULL, design TEXT NOT NULL, living_area_sq_ft INTEGER NOT NULL, lot_sq_ft INTEGER NOT NULL, room_count INTEGER NOT NULL, bedrooms INTEGER NOT NULL, bathrooms INTEGER NOT NULL, quality_rating TEXT NOT NULL, condition_rating TEXT NOT NULL, source_label TEXT NOT NULL, source_date TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS entities (id TEXT PRIMARY KEY, home_id TEXT NOT NULL, name TEXT NOT NULL, kind TEXT NOT NULL, group_name TEXT NOT NULL, condition TEXT NOT NULL, detail TEXT NOT NULL, source_page INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, home_id TEXT NOT NULL, occurred_at TEXT NOT NULL, title TEXT NOT NULL, type TEXT NOT NULL, summary TEXT NOT NULL, condition_before TEXT, condition_after TEXT, cost_cents INTEGER, created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS event_tags (event_id TEXT NOT NULL, entity_id TEXT NOT NULL, PRIMARY KEY (event_id, entity_id))`,
  `CREATE TABLE IF NOT EXISTS evidence (id TEXT PRIMARY KEY, home_id TEXT NOT NULL, label TEXT NOT NULL, kind TEXT NOT NULL, source_ref TEXT NOT NULL, captured_at TEXT NOT NULL, visibility TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS event_evidence (event_id TEXT NOT NULL, evidence_id TEXT NOT NULL, PRIMARY KEY (event_id, evidence_id))`,
  `CREATE INDEX IF NOT EXISTS events_date_idx ON events(home_id, occurred_at DESC)`,
  `CREATE INDEX IF NOT EXISTS event_tags_entity_idx ON event_tags(entity_id, event_id)`,
];

async function ensureDatabase() {
  if (!env.DB) {
    throw new Error("Home Intelligence database is unavailable.");
  }

  await env.DB.batch(schemaStatements.map((sql) => env.DB.prepare(sql)));
  const existing = await env.DB.prepare("SELECT COUNT(*) AS count FROM homes").first<{ count: number }>();
  if ((existing?.count ?? 0) > 0) return;

  const statements = [
    env.DB.prepare("INSERT INTO homes (id, name, location, acquired_at, year_built, design, living_area_sq_ft, lot_sq_ft, room_count, bedrooms, bathrooms, quality_rating, condition_rating, source_label, source_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(
      baselineHome.id, baselineHome.name, baselineHome.location, baselineHome.acquiredAt,
      baselineHome.yearBuilt, baselineHome.design, baselineHome.livingAreaSqFt,
      baselineHome.lotSqFt, baselineHome.roomCount, baselineHome.bedrooms,
      baselineHome.bathrooms, baselineHome.qualityRating, baselineHome.conditionRating,
      baselineHome.sourceLabel, baselineHome.sourceDate,
    ),
    ...baselineEntities.map((entity) => env.DB.prepare("INSERT INTO entities (id, home_id, name, kind, group_name, condition, detail, source_page) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(
      entity.id, entity.homeId, entity.name, entity.kind, entity.groupName,
      entity.condition, entity.detail, entity.sourcePage,
    )),
    ...baselineEvidence.map((item) => env.DB.prepare("INSERT INTO evidence (id, home_id, label, kind, source_ref, captured_at, visibility) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(
      item.id, item.homeId, item.label, item.kind, item.sourceRef, item.capturedAt, item.visibility,
    )),
    env.DB.prepare("INSERT INTO events (id, home_id, occurred_at, title, type, summary, condition_before, condition_after, cost_cents, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(
      baselineEvent.id, baselineEvent.homeId, baselineEvent.occurredAt, baselineEvent.title,
      baselineEvent.type, baselineEvent.summary, baselineEvent.conditionBefore,
      baselineEvent.conditionAfter, baselineEvent.costCents, baselineEvent.createdAt,
    ),
    ...baselineEvent.entityIds.map((entityId) => env.DB.prepare("INSERT INTO event_tags (event_id, entity_id) VALUES (?, ?)").bind(baselineEvent.id, entityId)),
    ...baselineEvent.evidenceIds.map((evidenceId) => env.DB.prepare("INSERT INTO event_evidence (event_id, evidence_id) VALUES (?, ?)").bind(baselineEvent.id, evidenceId)),
  ];

  await env.DB.batch(statements);
}

async function readTwin(): Promise<TwinPayload> {
  await ensureDatabase();
  const [homeResult, entityResult, eventResult, tagResult, evidenceResult, eventEvidenceResult] = await Promise.all([
    env.DB.prepare("SELECT * FROM homes LIMIT 1").first<Record<string, unknown>>(),
    env.DB.prepare("SELECT * FROM entities ORDER BY kind, group_name, name").all<Record<string, unknown>>(),
    env.DB.prepare("SELECT * FROM events ORDER BY occurred_at DESC, created_at DESC").all<Record<string, unknown>>(),
    env.DB.prepare("SELECT event_id, entity_id FROM event_tags").all<Record<string, string>>(),
    env.DB.prepare("SELECT * FROM evidence ORDER BY captured_at DESC").all<Record<string, unknown>>(),
    env.DB.prepare("SELECT event_id, evidence_id FROM event_evidence").all<Record<string, string>>(),
  ]);

  const homeRow = homeResult!;
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

  return { home, entities, events, evidence };
}

export async function GET() {
  try {
    return Response.json(await readTwin());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to read the home record.";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureDatabase();
    const payload = (await request.json()) as {
      title?: string;
      occurredAt?: string;
      type?: string;
      summary?: string;
      conditionAfter?: string;
      entityIds?: string[];
      evidenceNote?: string;
      cost?: number;
    };
    const title = payload.title?.trim() ?? "";
    const occurredAt = payload.occurredAt?.trim() ?? "";
    const summary = payload.summary?.trim() ?? "";
    const entityIds = [...new Set(payload.entityIds ?? [])];
    if (!title || !occurredAt || !summary || entityIds.length === 0) {
      return Response.json({ error: "Date, title, summary and at least one tag are required." }, { status: 400 });
    }

    const id = `evt-${crypto.randomUUID()}`;
    const createdAt = new Date().toISOString();
    const evidenceNote = payload.evidenceNote?.trim();
    const evidenceId = evidenceNote ? `ev-${crypto.randomUUID()}` : null;
    const statements = [
      env.DB.prepare("INSERT INTO events (id, home_id, occurred_at, title, type, summary, condition_after, cost_cents, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(
        id, baselineHome.id, occurredAt, title, payload.type ?? "Update", summary,
        payload.conditionAfter || null,
        typeof payload.cost === "number" ? Math.round(payload.cost * 100) : null,
        createdAt,
      ),
      ...entityIds.map((entityId) => env.DB.prepare("INSERT INTO event_tags (event_id, entity_id) VALUES (?, ?)").bind(id, entityId)),
    ];
    if (evidenceId && evidenceNote) {
      statements.push(
        env.DB.prepare("INSERT INTO evidence (id, home_id, label, kind, source_ref, captured_at, visibility) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(
          evidenceId, baselineHome.id, "Update evidence", "reference", evidenceNote, occurredAt, "private-source",
        ),
        env.DB.prepare("INSERT INTO event_evidence (event_id, evidence_id) VALUES (?, ?)").bind(id, evidenceId),
      );
    }
    await env.DB.batch(statements);
    return Response.json(await readTwin(), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save the update.";
    return Response.json({ error: message }, { status: 500 });
  }
}
