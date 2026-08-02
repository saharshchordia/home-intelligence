import { ensureDatabase, getD1, readTwin } from "../../../lib/server/twin-store";

export async function POST(request: Request) {
  try {
    await ensureDatabase();
    const db = getD1();
    const payload = (await request.json()) as {
      assertionId?: string;
      entityId?: string;
      decision?: "approve" | "reject" | "move";
      targetEntityId?: string;
      note?: string;
    };
    if (!payload.assertionId || !payload.entityId || !payload.decision) {
      return Response.json({ error: "Assertion, entity and decision are required." }, { status: 400 });
    }
    const existing = await db.prepare("SELECT status, confidence, relationship, rationale FROM assertion_entities WHERE assertion_id = ? AND entity_id = ?").bind(payload.assertionId, payload.entityId).first<Record<string, unknown>>();
    if (!existing) return Response.json({ error: "Candidate link not found." }, { status: 404 });

    const decidedAt = new Date().toISOString();
    const nextStatus = payload.decision === "approve" ? "approved" : "rejected";
    const statements = [
      db.prepare("UPDATE assertion_entities SET status = ?, reviewed_at = ? WHERE assertion_id = ? AND entity_id = ?").bind(nextStatus, decidedAt, payload.assertionId, payload.entityId),
      db.prepare("INSERT INTO review_decisions (id, assertion_id, entity_id, decision, previous_status, next_status, note, decided_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(
        `review-${crypto.randomUUID()}`, payload.assertionId, payload.entityId, payload.decision,
        String(existing.status), nextStatus, payload.note?.trim() ?? "", decidedAt,
      ),
    ];
    let acceptedEntityId = payload.decision === "approve" ? payload.entityId : null;
    if (payload.decision === "move" && payload.targetEntityId) {
      acceptedEntityId = payload.targetEntityId;
      statements.push(
        db.prepare("INSERT OR REPLACE INTO assertion_entities (assertion_id, entity_id, relationship, confidence, status, rationale, reviewed_at) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(
          payload.assertionId, payload.targetEntityId, "human-selected", 1, "approved", "Location selected during human review.", decidedAt,
        ),
      );
    }
    if (acceptedEntityId) {
      statements.push(db.prepare("INSERT OR IGNORE INTO event_tags (event_id, entity_id) VALUES (?, ?)").bind("evt-acquisition-inspection", acceptedEntityId));
    }
    await db.batch(statements);

    const pending = await db.prepare("SELECT COUNT(*) AS count FROM assertion_entities WHERE assertion_id = ? AND status = 'pending'").bind(payload.assertionId).first<{ count: number }>();
    const accepted = await db.prepare("SELECT COUNT(*) AS count FROM assertion_entities WHERE assertion_id = ? AND status IN ('approved', 'auto-accepted')").bind(payload.assertionId).first<{ count: number }>();
    const reviewStatus = (pending?.count ?? 0) > 0 ? "pending" : (accepted?.count ?? 0) > 0 ? "reviewed" : "unassigned";
    await db.prepare("UPDATE assertions SET review_status = ? WHERE id = ?").bind(reviewStatus, payload.assertionId).run();
    return Response.json(await readTwin());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save the review decision.";
    return Response.json({ error: message }, { status: 500 });
  }
}
