import { ensureDatabase, getD1, getEvidenceBucket } from "../../../lib/server/twin-store";

export async function GET(request: Request) {
  try {
    await ensureDatabase();
    const id = new URL(request.url).searchParams.get("id")?.trim();
    if (!id) return Response.json({ error: "Evidence id is required." }, { status: 400 });
    const db = getD1();
    const asset = await db.prepare("SELECT object_key, mime_type, label FROM media_assets WHERE id = ?").bind(id).first<Record<string, unknown>>();
    const document = asset ? null : await db.prepare("SELECT object_key, mime_type, title AS label FROM documents WHERE id = ?").bind(id).first<Record<string, unknown>>();
    const row = asset ?? document;
    if (!row) return Response.json({ error: "Evidence not found." }, { status: 404 });

    const object = await getEvidenceBucket().get(String(row.object_key));
    if (!object?.body) return Response.json({ error: "Evidence file is not available." }, { status: 404 });
    const filename = String(row.label).replace(/[^a-z0-9._-]+/gi, "-").toLowerCase();
    return new Response(object.body, {
      headers: {
        "content-type": String(row.mime_type),
        "content-disposition": `inline; filename="${filename}"`,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to read private evidence.";
    return Response.json({ error: message }, { status: 500 });
  }
}
