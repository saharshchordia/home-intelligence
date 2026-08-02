import { baselineHome } from "../../../lib/twin-data";
import { ensureDatabase, getD1, readTwin } from "../../../lib/server/twin-store";

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
    const db = getD1();
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
      db.prepare("INSERT INTO events (id, home_id, occurred_at, title, type, summary, condition_after, cost_cents, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(
        id, baselineHome.id, occurredAt, title, payload.type ?? "Update", summary,
        payload.conditionAfter || null,
        typeof payload.cost === "number" ? Math.round(payload.cost * 100) : null,
        createdAt,
      ),
      ...entityIds.map((entityId) => db.prepare("INSERT INTO event_tags (event_id, entity_id) VALUES (?, ?)").bind(id, entityId)),
    ];
    if (evidenceId && evidenceNote) {
      statements.push(
        db.prepare("INSERT INTO evidence (id, home_id, label, kind, source_ref, captured_at, visibility) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(
          evidenceId, baselineHome.id, "Update evidence", "reference", evidenceNote, occurredAt, "private-source",
        ),
        db.prepare("INSERT INTO event_evidence (event_id, evidence_id) VALUES (?, ?)").bind(id, evidenceId),
      );
    }
    await db.batch(statements);
    return Response.json(await readTwin(), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save the update.";
    return Response.json({ error: message }, { status: 500 });
  }
}
