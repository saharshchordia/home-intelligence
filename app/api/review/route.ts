import { ensureDatabase, getD1, readTwin } from "../../../lib/server/twin-store";

export async function POST(request: Request) {
  try {
    await ensureDatabase();
    const db = getD1();
    const payload = (await request.json()) as {
      assertionId?: string;
      entityId?: string;
      decision?: "approve" | "reject" | "move" | "add" | "remove";
      targetEntityId?: string;
      note?: string;
    };
    if (!payload.assertionId || !payload.decision) {
      return Response.json({ error: "Assertion and decision are required." }, { status: 400 });
    }
    const targetEntityId = payload.targetEntityId ?? payload.entityId;
    const needsExistingLink = payload.decision !== "add";
    if (needsExistingLink && !payload.entityId) {
      return Response.json({ error: "A current entity is required for this decision." }, { status: 400 });
    }
    if ((payload.decision === "move" || payload.decision === "add") && !targetEntityId) {
      return Response.json({ error: "A target entity is required for this decision." }, { status: 400 });
    }

    const existing = payload.entityId
      ? await db.prepare("SELECT status, confidence, relationship, rationale FROM assertion_entities WHERE assertion_id = ? AND entity_id = ?").bind(payload.assertionId, payload.entityId).first<Record<string, unknown>>()
      : null;
    if (needsExistingLink && !existing) return Response.json({ error: "Candidate link not found." }, { status: 404 });

    const decidedAt = new Date().toISOString();
    const statements: D1PreparedStatement[] = [];
    let acceptedEntityId: string | null = null;

    function recordDecision(entityId: string, decision: string, previousStatus: string, nextStatus: string) {
      statements.push(db.prepare("INSERT INTO review_decisions (id, assertion_id, entity_id, decision, previous_status, next_status, note, decided_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(
        `review-${crypto.randomUUID()}`, payload.assertionId, entityId, decision,
        previousStatus, nextStatus, payload.note?.trim() ?? "", decidedAt,
      ));
    }

    if (payload.decision === "approve" && payload.entityId && existing) {
      acceptedEntityId = payload.entityId;
      statements.push(db.prepare("UPDATE assertion_entities SET status = ?, reviewed_at = ? WHERE assertion_id = ? AND entity_id = ?").bind("approved", decidedAt, payload.assertionId, payload.entityId));
      recordDecision(payload.entityId, payload.decision, String(existing.status), "approved");
    }

    if ((payload.decision === "reject" || payload.decision === "remove") && payload.entityId && existing) {
      statements.push(db.prepare("UPDATE assertion_entities SET status = ?, reviewed_at = ? WHERE assertion_id = ? AND entity_id = ?").bind("rejected", decidedAt, payload.assertionId, payload.entityId));
      recordDecision(payload.entityId, payload.decision, String(existing.status), "rejected");
    }

    if (payload.decision === "move" && payload.entityId && targetEntityId && existing) {
      acceptedEntityId = targetEntityId;
      statements.push(db.prepare("UPDATE assertion_entities SET status = ?, reviewed_at = ? WHERE assertion_id = ? AND entity_id = ?").bind("rejected", decidedAt, payload.assertionId, payload.entityId));
      statements.push(db.prepare("INSERT OR REPLACE INTO assertion_entities (assertion_id, entity_id, relationship, confidence, status, rationale, reviewed_at) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(
        payload.assertionId, targetEntityId, "human-selected", 1, "approved", "Location selected during human review.", decidedAt,
      ));
      recordDecision(payload.entityId, payload.decision, String(existing.status), "rejected");
    }

    if (payload.decision === "add" && targetEntityId) {
      acceptedEntityId = targetEntityId;
      const targetExisting = await db.prepare("SELECT status FROM assertion_entities WHERE assertion_id = ? AND entity_id = ?").bind(payload.assertionId, targetEntityId).first<Record<string, unknown>>();
      statements.push(db.prepare("INSERT OR REPLACE INTO assertion_entities (assertion_id, entity_id, relationship, confidence, status, rationale, reviewed_at) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(
        payload.assertionId, targetEntityId, "human-selected", 1, "approved", "Location manually added by homeowner.", decidedAt,
      ));
      recordDecision(targetEntityId, payload.decision, targetExisting ? String(targetExisting.status) : "none", "approved");
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
