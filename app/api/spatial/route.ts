import { baselineHome } from "../../../lib/twin-data";
import { ensureDatabase, getD1, readTwin } from "../../../lib/server/twin-store";
import type { SpatialZone } from "../../../lib/twin-data";

function numberOr(value: unknown, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function validMode(value: unknown): value is SpatialZone["mode"] {
  return ["exterior", "first", "second", "lower", "garage"].includes(String(value));
}

export async function POST(request: Request) {
  try {
    await ensureDatabase();
    const db = getD1();
    const payload = (await request.json()) as {
      action?: "pin-evidence" | "create-zone";
      assertionId?: string;
      mediaId?: string | null;
      zoneId?: string | null;
      entityId?: string | null;
      mode?: SpatialZone["mode"];
      position?: { x?: number; y?: number; z?: number };
      name?: string;
      zoneType?: SpatialZone["zoneType"];
      geometryKind?: SpatialZone["geometryKind"];
      size?: { width?: number; height?: number; depth?: number };
      color?: string;
    };
    const createdAt = new Date().toISOString();

    if (payload.action === "pin-evidence") {
      if (!payload.assertionId || !validMode(payload.mode)) {
        return Response.json({ error: "Assertion and model view are required to place evidence." }, { status: 400 });
      }
      const assertion = await db.prepare("SELECT title FROM assertions WHERE id = ?").bind(payload.assertionId).first<Record<string, unknown>>();
      if (!assertion) return Response.json({ error: "Evidence item not found." }, { status: 404 });
      const x = numberOr(payload.position?.x, 0);
      const y = numberOr(payload.position?.y, 1);
      const z = numberOr(payload.position?.z, 0);
      await db.prepare("INSERT INTO evidence_pins (id, home_id, assertion_id, media_id, zone_id, entity_id, mode, x, y, z, label, confidence, status, rationale, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(
        `pin-${crypto.randomUUID()}`, baselineHome.id, payload.assertionId, payload.mediaId ?? null,
        payload.zoneId ?? null, payload.entityId ?? null, payload.mode, x, y, z,
        String(assertion.title), 1, "approved", "Precise model pin placed by homeowner review.", createdAt,
      ).run();
      if (payload.entityId) {
        await db.prepare("INSERT OR REPLACE INTO assertion_entities (assertion_id, entity_id, relationship, confidence, status, rationale, reviewed_at) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(
          payload.assertionId, payload.entityId, "spatial-pin", 1, "approved", "Location approved through precise model pin placement.", createdAt,
        ).run();
      }
      return Response.json(await readTwin());
    }

    if (payload.action === "create-zone") {
      const name = payload.name?.trim() ?? "";
      if (!name || !validMode(payload.mode)) {
        return Response.json({ error: "Zone name and model view are required." }, { status: 400 });
      }
      const zoneType = payload.zoneType ?? "custom";
      const geometryKind = payload.geometryKind ?? (payload.mode === "exterior" ? "plane" : "box");
      const zoneId = `zone-${crypto.randomUUID()}`;
      const x = numberOr(payload.position?.x, 0);
      const y = numberOr(payload.position?.y, payload.mode === "exterior" ? 0.08 : 0.42);
      const z = numberOr(payload.position?.z, 0);
      await db.prepare("INSERT INTO spatial_zones (id, home_id, entity_id, name, mode, zone_type, geometry_kind, x, y, z, width, height, depth, color, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(
        zoneId, baselineHome.id, payload.entityId ?? null, name, payload.mode, zoneType,
        geometryKind, x, y, z, numberOr(payload.size?.width, 8),
        numberOr(payload.size?.height, geometryKind === "plane" ? 0.1 : 3),
        numberOr(payload.size?.depth, 8), payload.color ?? "#dfece5", "active", createdAt,
      ).run();
      return Response.json(await readTwin(), { status: 201 });
    }

    return Response.json({ error: "Unsupported spatial action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update spatial model.";
    return Response.json({ error: message }, { status: 500 });
  }
}
