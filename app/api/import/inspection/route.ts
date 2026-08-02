import { baselineHome } from "../../../../lib/twin-data";
import { ensureDatabase, getD1, getEvidenceBucket, readTwin, runInChunks } from "../../../../lib/server/twin-store";

type ImportLink = {
  entityId: string;
  relationship: string;
  confidence: number;
  rationale: string;
};

type ImportAssertion = {
  id: string;
  reportItem: string;
  sourcePage: number;
  section: string;
  title: string;
  detail: string;
  severity: "maintenance" | "recommendation" | "safety";
  extractionConfidence: number;
  entityConfidence: number;
  temporalConfidence: number;
  locationRationale: string;
  links: ImportLink[];
  mediaIds: string[];
};

type InspectionManifest = {
  document: {
    id: string;
    title: string;
    documentType: string;
    sourceDate: string;
    originalFilename: string;
    mimeType: string;
    pageCount: number;
    objectKey: string;
    sha256: string;
  };
  event: { id: string; title: string; summary: string };
  mediaAssets: Array<{
    id: string;
    label: string;
    kind: string;
    sourcePage: number;
    objectKey: string;
    mimeType: string;
    sha256: string;
    fieldName: string;
  }>;
  assertions: ImportAssertion[];
};

function isPrivateObjectKey(value: string) {
  return value.startsWith("private/") && !value.includes("..") && !value.includes("\\");
}

async function digestHex(bytes: ArrayBuffer) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function clampConfidence(value: number) {
  return Math.min(1, Math.max(0, Number(value) || 0));
}

export async function POST(request: Request) {
  try {
    await ensureDatabase();
    const db = getD1();
    const bucket = getEvidenceBucket();
    const form = await request.formData();
    const manifestValue = form.get("manifest");
    const reportValue = form.get("report");
    if (typeof manifestValue !== "string") {
      return Response.json({ error: "An inspection manifest is required." }, { status: 400 });
    }

    const manifest = JSON.parse(manifestValue) as InspectionManifest;
    if (manifest.document.id !== "inspection-acquisition-2022" || manifest.document.sourceDate !== "2022-06-15") {
      return Response.json({ error: "This importer only accepts the approved acquisition inspection." }, { status: 400 });
    }
    if (!isPrivateObjectKey(manifest.document.objectKey) || manifest.mediaAssets.some((asset) => !isPrivateObjectKey(asset.objectKey))) {
      return Response.json({ error: "Evidence objects must use private storage keys." }, { status: 400 });
    }

    let reportHash = manifest.document.sha256;
    if (reportValue instanceof File) {
      const reportBytes = await reportValue.arrayBuffer();
      reportHash = await digestHex(reportBytes);
      if (manifest.document.sha256 && manifest.document.sha256 !== reportHash) {
        return Response.json({ error: "The inspection report checksum does not match the approved manifest." }, { status: 400 });
      }
      await bucket.put(manifest.document.objectKey, reportBytes, {
        httpMetadata: { contentType: manifest.document.mimeType },
        customMetadata: { documentId: manifest.document.id, sourceDate: manifest.document.sourceDate },
      });
    } else if (!(await bucket.head(manifest.document.objectKey))) {
      return Response.json({ error: "The private inspection report must be uploaded before importing its manifest." }, { status: 400 });
    }

    const storedAssets = new Set<string>();
    for (const asset of manifest.mediaAssets) {
      const value = form.get(asset.fieldName);
      if (value instanceof File) {
        const bytes = await value.arrayBuffer();
        const hash = await digestHex(bytes);
        if (asset.sha256 && asset.sha256 !== hash) throw new Error(`Checksum mismatch for ${asset.id}.`);
        await bucket.put(asset.objectKey, bytes, {
          httpMetadata: { contentType: asset.mimeType },
          customMetadata: { documentId: manifest.document.id, sourcePage: String(asset.sourcePage) },
        });
        storedAssets.add(asset.id);
      } else if (await bucket.head(asset.objectKey)) {
        storedAssets.add(asset.id);
      }
    }

    const createdAt = new Date().toISOString();
    const statements: D1PreparedStatement[] = [
      db.prepare("INSERT OR REPLACE INTO documents (id, home_id, title, document_type, source_date, original_filename, mime_type, page_count, object_key, sha256, storage_status, visibility, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(
        manifest.document.id, baselineHome.id, manifest.document.title, manifest.document.documentType,
        manifest.document.sourceDate, manifest.document.originalFilename, manifest.document.mimeType,
        manifest.document.pageCount, manifest.document.objectKey, reportHash, "stored", "private", createdAt,
      ),
      db.prepare("INSERT OR REPLACE INTO evidence (id, home_id, label, kind, source_ref, captured_at, visibility) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(
        "ev-acquisition-inspection", baselineHome.id, "Acquisition inspection report", "document",
        "Private inspection report, 60 pages", manifest.document.sourceDate, "private-source",
      ),
      db.prepare("INSERT OR REPLACE INTO events (id, home_id, occurred_at, title, type, summary, condition_before, condition_after, cost_cents, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(
        manifest.event.id, baselineHome.id, manifest.document.sourceDate, manifest.event.title, "Inspection",
        manifest.event.summary, null, "Reported at acquisition", null, createdAt,
      ),
      db.prepare("INSERT OR IGNORE INTO event_tags (event_id, entity_id) VALUES (?, ?)").bind(manifest.event.id, "home"),
      db.prepare("INSERT OR IGNORE INTO event_evidence (event_id, evidence_id) VALUES (?, ?)").bind(manifest.event.id, "ev-acquisition-inspection"),
    ];

    for (const asset of manifest.mediaAssets) {
      const stored = storedAssets.has(asset.id);
      statements.push(db.prepare("INSERT OR REPLACE INTO media_assets (id, document_id, label, kind, source_page, object_key, mime_type, sha256, storage_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(
        asset.id, manifest.document.id, asset.label, asset.kind, asset.sourcePage, asset.objectKey,
        asset.mimeType, asset.sha256, stored ? "stored" : "referenced", createdAt,
      ));
    }

    for (const assertion of manifest.assertions) {
      const links = assertion.links.map((link) => ({ ...link, confidence: clampConfidence(link.confidence) }));
      const acceptedLinks = links.filter((link) => link.confidence >= 0.9 && assertion.severity !== "safety");
      const pendingLinks = links.filter((link) => link.confidence >= 0.75 && (link.confidence < 0.9 || assertion.severity === "safety"));
      const reviewStatus = pendingLinks.length > 0 ? "pending" : acceptedLinks.length > 0 ? "accepted" : "unassigned";
      statements.push(db.prepare("INSERT OR REPLACE INTO assertions (id, home_id, document_id, report_item, source_page, section, title, detail, severity, temporal_status, review_status, extraction_confidence, entity_confidence, temporal_confidence, location_rationale, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(
        assertion.id, baselineHome.id, manifest.document.id, assertion.reportItem, assertion.sourcePage,
        assertion.section, assertion.title, assertion.detail, assertion.severity, "reported-at-acquisition",
        reviewStatus, clampConfidence(assertion.extractionConfidence), clampConfidence(assertion.entityConfidence),
        clampConfidence(assertion.temporalConfidence), assertion.locationRationale, createdAt,
      ));
      for (const link of links.filter((item) => item.confidence >= 0.75)) {
        const status = link.confidence >= 0.9 && assertion.severity !== "safety" ? "auto-accepted" : "pending";
        statements.push(db.prepare("INSERT OR REPLACE INTO assertion_entities (assertion_id, entity_id, relationship, confidence, status, rationale, reviewed_at) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(
          assertion.id, link.entityId, link.relationship, link.confidence, status, link.rationale, null,
        ));
        if (status === "auto-accepted") {
          statements.push(db.prepare("INSERT OR IGNORE INTO event_tags (event_id, entity_id) VALUES (?, ?)").bind(manifest.event.id, link.entityId));
        }
      }
      for (const mediaId of assertion.mediaIds) {
        statements.push(db.prepare("INSERT OR REPLACE INTO assertion_evidence (assertion_id, media_id) VALUES (?, ?)").bind(assertion.id, mediaId));
      }
    }

    await runInChunks(statements);
    return Response.json({
      imported: true,
      findings: manifest.assertions.length,
      mediaAssets: manifest.mediaAssets.length,
      twin: await readTwin(),
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to import the inspection report.";
    return Response.json({ error: message }, { status: 500 });
  }
}
