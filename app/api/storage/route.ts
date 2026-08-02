import { getEvidenceBucket } from "../../../lib/server/twin-store";

function validKey(value: string) {
  return value.startsWith("private/") && !value.includes("..") && !value.includes("\\");
}

export async function PUT(request: Request) {
  try {
    const url = new URL(request.url);
    const key = url.searchParams.get("key") ?? "";
    const uploadId = url.searchParams.get("uploadId");
    const partNumber = Number(url.searchParams.get("partNumber"));
    if (!validKey(key) || !request.body) {
      return Response.json({ error: "A valid private object key and body are required." }, { status: 400 });
    }
    const bucket = getEvidenceBucket();
    if (uploadId && Number.isInteger(partNumber) && partNumber > 0) {
      const part = await bucket.resumeMultipartUpload(key, uploadId).uploadPart(partNumber, request.body);
      return Response.json({ partNumber: part.partNumber, etag: part.etag });
    }
    await bucket.put(key, request.body, {
      httpMetadata: { contentType: request.headers.get("content-type") ?? "application/octet-stream" },
      customMetadata: { sha256: request.headers.get("x-content-sha256") ?? "" },
    });
    return Response.json({ stored: true, key });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to store private evidence.";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      action?: "begin" | "complete" | "abort";
      key?: string;
      mimeType?: string;
      uploadId?: string;
      parts?: Array<{ partNumber: number; etag: string }>;
    };
    if (!payload.key || !validKey(payload.key)) {
      return Response.json({ error: "A valid private object key is required." }, { status: 400 });
    }
    const bucket = getEvidenceBucket();
    if (payload.action === "begin") {
      const upload = await bucket.createMultipartUpload(payload.key, {
        httpMetadata: { contentType: payload.mimeType ?? "application/octet-stream" },
      });
      return Response.json({ key: upload.key, uploadId: upload.uploadId });
    }
    if (!payload.uploadId) return Response.json({ error: "Upload id is required." }, { status: 400 });
    const upload = bucket.resumeMultipartUpload(payload.key, payload.uploadId);
    if (payload.action === "complete" && payload.parts?.length) {
      const object = await upload.complete(payload.parts);
      return Response.json({ stored: true, key: object.key, size: object.size });
    }
    if (payload.action === "abort") {
      await upload.abort();
      return Response.json({ aborted: true });
    }
    return Response.json({ error: "Unsupported storage action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to manage private evidence upload.";
    return Response.json({ error: message }, { status: 500 });
  }
}
