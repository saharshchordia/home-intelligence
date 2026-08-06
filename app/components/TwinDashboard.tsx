"use client";

import {
  AlertTriangle,
  Bath,
  BedDouble,
  Building2,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  House,
  Layers3,
  MapPin,
  Pencil,
  Plus,
  Ruler,
  Search,
  ShieldCheck,
  ShieldAlert,
  Tag,
  Wrench,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { EntityKind, InspectionAssertion, MediaAsset, TwinPayload } from "../../lib/twin-data";
import { modelModes, modelPlacements, type ModelMode } from "../../lib/model-layout";
import HouseModel from "./HouseModel";
import type { ModelPin } from "./HouseModel";

const tabs = ["Home model", "Overview", "Places", "Systems", "Timeline", "Evidence review"] as const;
type Tab = (typeof tabs)[number];
type ReviewDecision = "approve" | "reject" | "move" | "add" | "remove";
type EvidenceFilter = "needs-review" | "accepted" | "all";
type DashboardMode = "live" | "static";

const conditionTone: Record<string, string> = {
  C3: "green",
  Good: "green",
  Updated: "blue",
  Operational: "blue",
  Average: "amber",
  Fair: "amber",
  "Needs attention": "coral",
  Unknown: "neutral",
  "Reported at acquisition": "amber",
  Documented: "blue",
};

const acceptedLinkStatuses = new Set(["auto-accepted", "approved"]);
const retiredLocationIds = new Set(["upper-level-bathroom"]);

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${date}T12:00:00`));
}

function entityIcon(kind: EntityKind) {
  if (kind === "system") return Wrench;
  if (kind === "site") return MapPin;
  return Layers3;
}

function driveFileId(objectKey: string) {
  return objectKey.startsWith("drive://") ? objectKey.replace("drive://", "") : null;
}

function mediaPreviewUrl(media: MediaAsset | undefined, mode: DashboardMode, apiBaseUrl?: string) {
  if (!media) return null;
  const fileId = driveFileId(media.objectKey);
  if (fileId) return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
  if (mode === "static" && !apiBaseUrl) return null;
  if (media.storageStatus === "stored") return `${apiBaseUrl ?? ""}/api/evidence?id=${media.id}`;
  return null;
}

function mediaOpenUrl(media: MediaAsset | undefined, mode: DashboardMode, apiBaseUrl?: string) {
  if (!media) return null;
  const fileId = driveFileId(media.objectKey);
  if (fileId) return `https://drive.google.com/file/d/${fileId}/view`;
  if (mode === "static" && !apiBaseUrl) return null;
  if (media.storageStatus === "stored") return `${apiBaseUrl ?? ""}/api/evidence?id=${media.id}`;
  return null;
}

function EvidencePreview({ media, alt, className, mode, apiBaseUrl }: { media?: MediaAsset; alt: string; className: string; mode: DashboardMode; apiBaseUrl?: string }) {
  const src = mediaPreviewUrl(media, mode, apiBaseUrl);
  const href = mediaOpenUrl(media, mode, apiBaseUrl);
  if (!src || !href) return null;
  return (
    <a className={className} href={href} target="_blank" rel="noreferrer">
      <img src={src} alt={alt} loading="lazy" decoding="async" />
      {media && <span>{media.documentId === "physical-ai-exterior-2026-08-02" ? `Frame ${media.sourcePage}` : `Report page ${media.sourcePage}`}</span>}
    </a>
  );
}

function sourceLabel(assertion: InspectionAssertion, twin: TwinPayload) {
  const document = twin.documents.find((item) => item.id === assertion.documentId);
  if (document?.documentType === "photo-walk") return `Exterior baseline · ${formatDate(document.sourceDate)}`;
  return `Reported at acquisition · Page ${assertion.sourcePage}`;
}

export function TwinDashboard({ initialTwin, mode = "live", apiBaseUrl, apiToken }: { initialTwin: TwinPayload; mode?: DashboardMode; apiBaseUrl?: string; apiToken?: string }) {
  const [twin, setTwin] = useState(initialTwin);
  const [activeTab, setActiveTab] = useState<Tab>("Home model");
  const [selectedEntityId, setSelectedEntityId] = useState("home");
  const [modelMode, setModelMode] = useState<ModelMode>("exterior");
  const [modelDrawerEntityId, setModelDrawerEntityId] = useState<string | null>(null);
  const [modelDrawerAssertionId, setModelDrawerAssertionId] = useState<string | null>(null);
  const [showSpatialZones, setShowSpatialZones] = useState(true);
  const [placementAssertionId, setPlacementAssertionId] = useState<string | null>(null);
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [evidenceFilter, setEvidenceFilter] = useState<EvidenceFilter>("needs-review");
  const [focusedAssertionId, setFocusedAssertionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const normalizedApiBaseUrl = apiBaseUrl?.replace(/\/$/, "");
  const isStaticMode = mode === "static" && !normalizedApiBaseUrl;
  const apiUrl = (path: string) => `${normalizedApiBaseUrl ?? ""}${path}`;
  const apiHeaders = {
    "content-type": "application/json",
    ...(apiToken ? { authorization: `Bearer ${apiToken}` } : {}),
  };

  useEffect(() => {
    if (isStaticMode) return;
    fetch(apiUrl("/api/twin"))
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Database preview unavailable")))
      .then((payload: TwinPayload) => setTwin(payload))
      .catch(() => undefined);
  }, [isStaticMode, normalizedApiBaseUrl]);

  const selectedEntity = twin.entities.find((entity) => entity.id === selectedEntityId) ?? twin.entities[0];
  const locationEntities = useMemo(() => twin.entities.filter((entity) => entity.kind !== "system" && !retiredLocationIds.has(entity.id)), [twin.entities]);
  const visibleEntities = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return twin.entities.filter((entity) => {
      if (retiredLocationIds.has(entity.id)) return false;
      const tabMatch = activeTab === "Places" ? entity.kind !== "system" : activeTab === "Systems" ? entity.kind === "system" : true;
      const queryMatch = !normalizedQuery || `${entity.name} ${entity.groupName} ${entity.detail}`.toLowerCase().includes(normalizedQuery);
      return tabMatch && queryMatch;
    });
  }, [activeTab, query, twin.entities]);

  const visibleEvents = useMemo(() => {
    if (selectedEntityId === "home") return twin.events;
    return twin.events.filter((event) => event.entityIds.includes(selectedEntityId));
  }, [selectedEntityId, twin.events]);

  const entityAssertions = useMemo(() => twin.assertions.filter((assertion) =>
    assertion.entityLinks.some((link) => link.entityId === selectedEntityId && acceptedLinkStatuses.has(link.status)),
  ), [selectedEntityId, twin.assertions]);

  const pendingReviews = useMemo(() => twin.assertions.flatMap((assertion) =>
    assertion.entityLinks.filter((link) => link.status === "pending").map((link) => ({ assertion, link })),
  ), [twin.assertions]);
  const reviewAssertions = useMemo(() => {
    const filtered = twin.assertions.filter((assertion) => {
      if (evidenceFilter === "needs-review") return assertion.entityLinks.some((link) => link.status === "pending");
      if (evidenceFilter === "accepted") return assertion.entityLinks.some((link) => acceptedLinkStatuses.has(link.status));
      return true;
    });
    return filtered.sort((a, b) => {
      if (a.id === focusedAssertionId) return -1;
      if (b.id === focusedAssertionId) return 1;
      return a.sourcePage - b.sourcePage || a.reportItem.localeCompare(b.reportItem);
    });
  }, [evidenceFilter, focusedAssertionId, twin.assertions]);

  const inspectionAssertions = useMemo(() => twin.assertions.filter((item) => item.documentId !== "physical-ai-exterior-2026-08-02"), [twin.assertions]);
  const inspectionCounts = useMemo(() => ({
    total: inspectionAssertions.length,
    safety: inspectionAssertions.filter((item) => item.severity === "safety").length,
    recommendations: inspectionAssertions.filter((item) => item.severity === "recommendation").length,
    maintenance: inspectionAssertions.filter((item) => item.severity === "maintenance").length,
  }), [inspectionAssertions]);
  const photoWalkAssertions = useMemo(() => twin.assertions
    .filter((assertion) => assertion.documentId === "physical-ai-exterior-2026-08-02")
    .sort((a, b) => a.sourcePage - b.sourcePage), [twin.assertions]);

  const modelPins = useMemo<ModelPin[]>(() => {
    const severityRank = { maintenance: 0, recommendation: 1, safety: 2 } as const;
    const entityPins = Object.entries(modelPlacements).flatMap<ModelPin>(([entityId, placement]) => {
      const acceptedAssertions = twin.assertions.filter((assertion) => assertion.entityLinks.some(
        (link) => link.entityId === entityId && acceptedLinkStatuses.has(link.status),
      ));
      const laterEvents = twin.events.filter((event) => event.type !== "Baseline" && !event.id.startsWith("evt-acquisition") && event.entityIds.includes(entityId));
      const count = acceptedAssertions.length + laterEvents.length;
      if (count === 0) return [];
      const severity = acceptedAssertions.reduce<ModelPin["severity"]>((highest, assertion) => (
        severityRank[assertion.severity] > severityRank[highest] ? assertion.severity : highest
      ), "maintenance");
      return [{
        id: `entity-${entityId}`,
        entityId,
        label: twin.entities.find((entity) => entity.id === entityId)?.name ?? entityId,
        count,
        severity,
        mode: placement.mode,
        position: placement.position,
        kind: "entity",
      }];
    });
    const evidencePins = twin.evidencePins.map<ModelPin>((pin) => {
      const assertion = twin.assertions.find((item) => item.id === pin.assertionId);
      return {
        id: pin.id,
        entityId: pin.entityId,
        assertionId: pin.assertionId,
        label: assertion?.title ?? pin.label,
        count: 1,
        severity: assertion?.severity ?? "maintenance",
        mode: pin.mode,
        position: [pin.x, pin.y, pin.z],
        kind: "evidence",
      };
    });
    return [...entityPins, ...evidencePins];
  }, [twin.assertions, twin.entities, twin.events, twin.evidencePins]);

  const systemEvidence = useMemo(() => twin.entities
    .filter((entity) => entity.kind === "system")
    .map((entity) => ({
      entity,
      count: twin.assertions.filter((assertion) => assertion.entityLinks.some(
        (link) => link.entityId === entity.id && acceptedLinkStatuses.has(link.status),
      )).length,
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count), [twin.assertions, twin.entities]);

  const modelDrawerEntity = twin.entities.find((entity) => entity.id === modelDrawerEntityId);
  const modelDrawerAssertion = twin.assertions.find((assertion) => assertion.id === modelDrawerAssertionId);
  const modelDrawerPin = modelDrawerAssertion ? twin.evidencePins.find((pin) => pin.assertionId === modelDrawerAssertion.id) : null;
  const modelDrawerAssertions = useMemo(() => modelDrawerEntityId ? twin.assertions.filter((assertion) => assertion.entityLinks.some(
    (link) => link.entityId === modelDrawerEntityId && acceptedLinkStatuses.has(link.status),
  )) : [], [modelDrawerEntityId, twin.assertions]);
  const modelDrawerEvents = useMemo(() => modelDrawerEntityId ? twin.events.filter((event) => event.entityIds.includes(modelDrawerEntityId)) : [], [modelDrawerEntityId, twin.events]);

  function changeModelMode(mode: ModelMode) {
    setModelMode(mode);
    setModelDrawerEntityId(null);
    setModelDrawerAssertionId(null);
  }

  function selectModelPin(pin: ModelPin) {
    if (pin.kind === "evidence" && pin.assertionId) {
      setModelDrawerAssertionId(pin.assertionId);
      setModelDrawerEntityId(null);
      return;
    }
    if (pin.entityId) {
      setSelectedEntityId(pin.entityId);
      setModelDrawerEntityId(pin.entityId);
      setModelDrawerAssertionId(null);
    }
  }

  function openEvidenceManager(assertionId: string) {
    setFocusedAssertionId(assertionId);
    setEvidenceFilter("all");
    setActiveTab("Evidence review");
  }

  function startPinPlacement(assertionId: string) {
    const existingPin = twin.evidencePins.find((pin) => pin.assertionId === assertionId);
    setPlacementAssertionId(assertionId);
    setFocusedAssertionId(assertionId);
    setModelMode(existingPin?.mode ?? "exterior");
    setModelDrawerAssertionId(assertionId);
    setModelDrawerEntityId(null);
    setActiveTab("Home model");
  }

  async function placeEvidenceOnModel(placement: { mode: ModelMode; position: [number, number, number]; entityId?: string | null; zoneId?: string | null }) {
    if (!placementAssertionId) return;
    if (isStaticMode) {
      setError("GitHub Pages preview is read-only. Location edits will be enabled after the standalone backend is connected.");
      setPlacementAssertionId(null);
      return;
    }
    const assertion = twin.assertions.find((item) => item.id === placementAssertionId);
    setError(null);
    try {
      const response = await fetch(apiUrl("/api/spatial"), {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify({
          action: "pin-evidence",
          assertionId: placementAssertionId,
          mediaId: assertion?.mediaIds[0] ?? null,
          entityId: placement.entityId ?? null,
          zoneId: placement.zoneId ?? null,
          mode: placement.mode,
          position: { x: placement.position[0], y: placement.position[1], z: placement.position[2] },
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to place evidence on the model.");
      setTwin(payload as TwinPayload);
      setPlacementAssertionId(null);
      setModelDrawerAssertionId(assertion?.id ?? null);
    } catch (pinError) {
      setError(pinError instanceof Error ? pinError.message : "Unable to place evidence on the model.");
    }
  }

  async function submitZone(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isStaticMode) {
      setError("GitHub Pages preview is read-only. Zone creation will be enabled after the standalone backend is connected.");
      return;
    }
    const form = new FormData(event.currentTarget);
    setError(null);
    try {
      const response = await fetch(apiUrl("/api/spatial"), {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify({
          action: "create-zone",
          name: form.get("name"),
          mode: modelMode,
          zoneType: form.get("zoneType"),
          geometryKind: form.get("geometryKind"),
          entityId: form.get("entityId") || null,
          position: { x: Number(form.get("x")), y: Number(form.get("y")), z: Number(form.get("z")) },
          size: { width: Number(form.get("width")), height: Number(form.get("height")), depth: Number(form.get("depth")) },
          color: form.get("color"),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to create zone.");
      setTwin(payload as TwinPayload);
      setIsZoneModalOpen(false);
      setShowSpatialZones(true);
    } catch (zoneError) {
      setError(zoneError instanceof Error ? zoneError.message : "Unable to create zone.");
    }
  }

  async function submitReview(assertionId: string, entityId: string | undefined, decision: ReviewDecision, targetEntityId?: string) {
    if (isStaticMode) {
      setError("GitHub Pages preview is read-only. Evidence tag edits will be enabled after the standalone backend is connected.");
      setFocusedAssertionId(assertionId);
      return;
    }
    setReviewingId(`${assertionId}:${entityId ?? targetEntityId ?? "new"}:${decision}`);
    setError(null);
    try {
      const response = await fetch(apiUrl("/api/review"), {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify({ assertionId, entityId, decision, targetEntityId }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to save the review decision.");
      setTwin(payload as TwinPayload);
      setFocusedAssertionId(assertionId);
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : "Unable to save the review decision.");
    } finally {
      setReviewingId(null);
    }
  }

  async function submitUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isStaticMode) {
      setError("GitHub Pages preview is read-only. New history updates will be enabled after the standalone backend is connected.");
      return;
    }
    setIsSaving(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const entityIds = form.getAll("entityIds").map(String);
    try {
      const response = await fetch(apiUrl("/api/twin"), {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify({
          occurredAt: form.get("occurredAt"),
          title: form.get("title"),
          type: form.get("type"),
          summary: form.get("summary"),
          conditionAfter: form.get("conditionAfter"),
          evidenceNote: form.get("evidenceNote"),
          cost: form.get("cost") ? Number(form.get("cost")) : undefined,
          entityIds,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to save the update.");
      setTwin(payload as TwinPayload);
      setIsModalOpen(false);
      setActiveTab("Timeline");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save the update.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Home Intelligence home" onClick={() => setActiveTab("Home model")}>
          <span className="brand-mark"><House size={18} strokeWidth={2.2} /></span>
          <span>Home Intelligence</span>
        </a>
        <div className="home-identity">
          <span>{twin.home.name}</span>
          <span className="identity-location"><MapPin size={14} /> {twin.home.location}</span>
        </div>
        <button className="primary-button" disabled={isStaticMode} onClick={() => setIsModalOpen(true)} title={isStaticMode ? "Read-only GitHub Pages preview" : "Add update"}>
          {isStaticMode ? <><ShieldCheck size={17} /> Read-only</> : <><Plus size={17} /> Add update</>}
        </button>
      </header>

      <nav className="tabbar" aria-label="Home record sections">
        {tabs.map((tab) => (
          <button key={tab} className={activeTab === tab ? "tab active" : "tab"} onClick={() => setActiveTab(tab)}>
            {tab}{tab === "Evidence review" && pendingReviews.length > 0 ? <span className="tab-count">{pendingReviews.length}</span> : null}
          </button>
        ))}
        <span className="private-source"><ShieldCheck size={15} /> {isStaticMode ? "Static GitHub Pages preview" : "Private evidence"}</span>
      </nav>

      {activeTab === "Home model" ? (
        <main id="top" className="model-workspace">
          <HouseModel
            mode={modelMode}
            pins={modelPins}
            zones={twin.spatialZones}
            showZones={showSpatialZones}
            placementAssertionId={placementAssertionId}
            selectedEntityId={selectedEntityId}
            onModeChange={changeModelMode}
            onSelectEntity={setSelectedEntityId}
            onSelectPin={selectModelPin}
            onPlaceEvidence={placeEvidenceOnModel}
          />
          <aside className="model-index-panel" aria-label="Home model index">
            <span className="eyebrow">Physical record</span>
            <h1>{twin.home.name}</h1>
            <p>{twin.home.livingAreaSqFt.toLocaleString()} sq ft represented from the acquisition sketch. Interior geometry is approximate.</p>
            <div className="model-facts">
              <span><strong>{twin.evidencePins.length}</strong><small>Evidence pins</small></span>
              <span><strong>{modelModes.find((item) => item.id === modelMode)?.label}</strong><small>Current view</small></span>
            </div>
            <div className="spatial-tools">
              <button className={showSpatialZones ? "active" : ""} onClick={() => setShowSpatialZones((value) => !value)}><Layers3 size={14} /> Zones</button>
              <button disabled={isStaticMode} onClick={() => setIsZoneModalOpen(true)}><Plus size={14} /> Create zone</button>
              {placementAssertionId && <button className="danger" onClick={() => setPlacementAssertionId(null)}><X size={14} /> Cancel pin</button>}
            </div>
            {placementAssertionId && <p className="placement-note">Click a precise spot on the current 3D view to pin the selected evidence.</p>}
            <div className="system-evidence-index">
              <div className="model-panel-heading">
                <span>System evidence</span>
                <small>{systemEvidence.reduce((sum, item) => sum + item.count, 0)}</small>
              </div>
              {systemEvidence.slice(0, 5).map(({ entity, count }) => (
                <button key={entity.id} onClick={() => { setSelectedEntityId(entity.id); setActiveTab("Systems"); }}>
                  <Wrench size={14} />
                  <span>{entity.name}</span>
                  <strong>{count}</strong>
                </button>
              ))}
              {systemEvidence.length > 5 && (
                <button onClick={() => setActiveTab("Systems")}><Layers3 size={14} /><span>All systems</span><strong>{systemEvidence.length}</strong></button>
              )}
            </div>
          </aside>

          {modelDrawerEntity && (
            <aside className="model-evidence-drawer" aria-label={`${modelDrawerEntity.name} evidence history`}>
              <div className="model-drawer-header">
                <div><span className="eyebrow">Pinned location</span><h2>{modelDrawerEntity.name}</h2></div>
                <button className="icon-button" title="Close evidence" aria-label="Close evidence" onClick={() => setModelDrawerEntityId(null)}><X size={18} /></button>
              </div>
              <p className="model-entity-detail">{modelDrawerEntity.detail}</p>
              <div className="model-history-summary">
                <span>{modelDrawerAssertions.length} accepted findings</span>
                <span>{modelDrawerEvents.length} dated events</span>
              </div>
              <div className="model-history-list">
                {modelDrawerAssertions.map((assertion) => {
                  const media = twin.mediaAssets.find((item) => assertion.mediaIds.includes(item.id));
                  return (
                    <article className="model-finding" key={assertion.id}>
                      <EvidencePreview media={media} alt={`Evidence for ${assertion.title}`} className="model-photo-link" mode={mode} apiBaseUrl={normalizedApiBaseUrl} />
                      <div>
                        <span className={`severity ${assertion.severity}`}>{assertion.severity === "safety" ? <ShieldAlert size={13} /> : <FileText size={13} />}{assertion.severity}</span>
                        <h3>{assertion.title}</h3>
                        <p>{assertion.detail}</p>
                        <small>{sourceLabel(assertion, twin)}</small>
                        <button className="text-action" onClick={() => openEvidenceManager(assertion.id)}><Pencil size={13} /> Manage location</button>
                      </div>
                    </article>
                  );
                })}
                {modelDrawerEvents.map((event) => (
                  <article className="model-event" key={event.id}>
                    <span>{formatDate(event.occurredAt)}</span>
                    <h3>{event.title}</h3>
                    <p>{event.summary}</p>
                  </article>
                ))}
              </div>
            </aside>
          )}

          {modelDrawerAssertion && (
            <aside className="model-evidence-drawer" aria-label={`${modelDrawerAssertion.title} evidence pin`}>
              <div className="model-drawer-header">
                <div><span className="eyebrow">Pinned evidence</span><h2>{modelDrawerAssertion.title}</h2></div>
                <button className="icon-button" title="Close evidence" aria-label="Close evidence" onClick={() => setModelDrawerAssertionId(null)}><X size={18} /></button>
              </div>
              <div className="model-history-list">
                <article className="model-finding">
                  <EvidencePreview media={twin.mediaAssets.find((item) => modelDrawerAssertion.mediaIds.includes(item.id))} alt={`Evidence for ${modelDrawerAssertion.title}`} className="model-photo-link" mode={mode} apiBaseUrl={normalizedApiBaseUrl} />
                  <div>
                    <span className={`severity ${modelDrawerAssertion.severity}`}>{modelDrawerAssertion.severity === "safety" ? <ShieldAlert size={13} /> : <FileText size={13} />}{modelDrawerAssertion.severity}</span>
                    <h3>{modelDrawerAssertion.title}</h3>
                    <p>{modelDrawerAssertion.detail}</p>
                    {modelDrawerPin && (
                      <small>
                        {twin.spatialZones.find((zone) => zone.id === modelDrawerPin.zoneId)?.name ?? "Exact model point"} · {Math.round(modelDrawerPin.confidence * 100)}% spatial confidence
                      </small>
                    )}
                    <button className="text-action" disabled={isStaticMode} onClick={() => startPinPlacement(modelDrawerAssertion.id)}><MapPin size={13} /> Re-pin on model</button>
                    <button className="text-action" onClick={() => openEvidenceManager(modelDrawerAssertion.id)}><Pencil size={13} /> Manage tags</button>
                  </div>
                </article>
              </div>
            </aside>
          )}
        </main>
      ) : (
      <main id="top" className="workspace">
        <aside className="entity-rail">
          <div className="rail-heading">
            <div>
              <span className="eyebrow">Digital twin</span>
              <h1>{activeTab === "Systems" ? "Systems" : activeTab === "Timeline" ? "Event scope" : activeTab === "Evidence review" ? "Review scope" : "Home map"}</h1>
            </div>
            <span className="count-badge">{visibleEntities.length}</span>
          </div>
          <label className="search-field">
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a place or system" />
          </label>
          <div className="entity-list">
            {visibleEntities.map((entity) => {
              const Icon = entityIcon(entity.kind);
              return (
                <button
                  key={entity.id}
                  className={selectedEntityId === entity.id ? "entity-row selected" : "entity-row"}
                  onClick={() => setSelectedEntityId(entity.id)}
                >
                  <span className={`entity-icon ${entity.kind}`}><Icon size={16} /></span>
                  <span className="entity-label">
                    <strong>{entity.name}</strong>
                    <small>{entity.groupName}</small>
                  </span>
                  <span className={`condition-dot ${conditionTone[entity.condition] ?? "neutral"}`} title={entity.condition} />
                </button>
              );
            })}
          </div>
        </aside>

        <section className="record-surface">
          <div className="record-header">
            <div>
              <span className="eyebrow">{activeTab === "Evidence review" ? "Confidence-gated evidence" : `Record since ${formatDate(twin.home.acquiredAt)}`}</span>
              <h2>{activeTab === "Evidence review" ? "Inspection review" : selectedEntity?.name ?? twin.home.name}</h2>
              <p>{activeTab === "Evidence review" ? "Review, correct, and add evidence-to-place links while keeping a decision trail." : selectedEntity?.detail ?? "The complete home record."}</p>
            </div>
            <div className="record-condition">
              <span>{activeTab === "Evidence review" ? "Awaiting review" : "Baseline state"}</span>
              <strong className={`condition-pill ${conditionTone[selectedEntity?.condition ?? ""] ?? "neutral"}`}>
                {activeTab === "Evidence review" ? <ShieldCheck size={14} /> : <Check size={14} />} {activeTab === "Evidence review" ? pendingReviews.length : selectedEntity?.condition ?? twin.home.conditionRating}
              </strong>
            </div>
            <div className="record-art" aria-hidden="true">
              <img src="og.png" alt="" loading="eager" />
            </div>
          </div>

          {twin.documents.length > 0 && activeTab === "Overview" && (
            <section className="inspection-overview" aria-label="Acquisition inspection summary">
              <div className="inspection-heading">
                <div>
                  <span className="eyebrow">Reported at acquisition</span>
                  <h3>Inspection evidence is now part of the record</h3>
                  <p>Every finding remains historical until a later observation or repair verifies its present status.</p>
                </div>
                <a className="secondary-button" href={isStaticMode ? undefined : apiUrl(`/api/evidence?id=${twin.documents[0].id}`)} aria-disabled={isStaticMode} target="_blank" rel="noreferrer">
                  <FileText size={15} /> Open private report
                </a>
              </div>
              <div className="inspection-stats">
                <span><strong>{inspectionCounts.total}</strong><small>Findings</small></span>
                <span className="safety-stat"><strong>{inspectionCounts.safety}</strong><small>Safety hazards</small></span>
                <span><strong>{inspectionCounts.recommendations}</strong><small>Recommendations</small></span>
                <span><strong>{inspectionCounts.maintenance}</strong><small>Maintenance items</small></span>
                <span><strong>{pendingReviews.length}</strong><small>Links to review</small></span>
              </div>
            </section>
          )}

          {photoWalkAssertions.length > 0 && activeTab === "Overview" && (
            <section className="photo-walk-section" aria-label="Exterior baseline photo walk">
              <div className="section-title">
                <div>
                  <span className="eyebrow">Physical AI / Google Drive</span>
                  <h3>Exterior baseline photo walk</h3>
                </div>
                <button className="secondary-button" onClick={() => { setEvidenceFilter("all"); setActiveTab("Evidence review"); }}>
                  <Pencil size={15} /> Review locations
                </button>
              </div>
              <div className="photo-walk-strip">
                {photoWalkAssertions.map((assertion) => {
                  const media = twin.mediaAssets.find((item) => assertion.mediaIds.includes(item.id));
                  const accepted = assertion.entityLinks.some((link) => acceptedLinkStatuses.has(link.status));
                  const pending = assertion.entityLinks.some((link) => link.status === "pending");
                  return (
                    <article className="photo-frame" key={assertion.id}>
                      <EvidencePreview media={media} alt={`Exterior photo walk frame ${assertion.sourcePage}`} className="photo-frame-image" mode={mode} apiBaseUrl={normalizedApiBaseUrl} />
                      <div>
                        <span className={accepted ? "link-status auto-accepted" : pending ? "link-status pending" : "link-status"}>{accepted ? "linked" : pending ? "review" : "unassigned"}</span>
                        <strong>{assertion.title}</strong>
                        <small>Frame {assertion.sourcePage} · {Math.round(assertion.entityConfidence * 100)}% route confidence</small>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {(activeTab === "Overview" || activeTab === "Places" || activeTab === "Systems") && (
            <>
              <div className="metric-strip" aria-label="Home baseline facts">
                <div className="metric"><Building2 size={18} /><span><strong>{twin.home.yearBuilt}</strong><small>{twin.home.design}</small></span></div>
                <div className="metric"><Ruler size={18} /><span><strong>{twin.home.livingAreaSqFt.toLocaleString()} sq ft</strong><small>Living area</small></span></div>
                <div className="metric"><BedDouble size={18} /><span><strong>{twin.home.bedrooms} bedrooms</strong><small>{twin.home.roomCount} total rooms</small></span></div>
                <div className="metric"><Bath size={18} /><span><strong>{twin.home.bathrooms} bathrooms</strong><small>At acquisition</small></span></div>
              </div>

              <section className="condition-section">
                <div className="section-title">
                  <div><span className="eyebrow">Condition history</span><h3>How this part of the home has changed</h3></div>
                  <span className="date-chip"><CalendarDays size={14} /> As of {formatDate(visibleEvents[0]?.occurredAt ?? twin.home.acquiredAt)}</span>
                </div>
                <div className="condition-track">
                  {visibleEvents.slice().reverse().map((event, index) => (
                    <div className="condition-point" key={event.id}>
                      <span className={`track-dot ${index === visibleEvents.length - 1 ? "latest" : ""}`} />
                      <strong>{event.conditionAfter ?? "Documented"}</strong>
                      <small>{formatDate(event.occurredAt)}</small>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {activeTab !== "Evidence review" && entityAssertions.length > 0 && (
            <section className="place-evidence-section">
              <div className="section-title">
                <div><span className="eyebrow">Dated source material</span><h3>Reported at acquisition</h3></div>
                <span className="event-count">{entityAssertions.length} accepted {entityAssertions.length === 1 ? "finding" : "findings"}</span>
              </div>
              <div className="place-evidence-grid">
                {entityAssertions.map((assertion) => {
                  const media = twin.mediaAssets.find((item) => assertion.mediaIds.includes(item.id));
                  return (
                    <article className="finding-card" key={assertion.id}>
                      <EvidencePreview media={media} alt={`Evidence for ${assertion.title}`} className="finding-image" mode={mode} apiBaseUrl={normalizedApiBaseUrl} />
                      <div className="finding-body">
                        <div className="finding-meta">
                          <span className={`severity ${assertion.severity}`}>{assertion.severity === "safety" ? <ShieldAlert size={13} /> : <FileText size={13} />}{assertion.severity}</span>
                          <span>{Math.round(assertion.entityConfidence * 100)}% location confidence</span>
                        </div>
                        <h4>{assertion.title}</h4>
                        <p>{assertion.detail}</p>
                        <small>{assertion.reportItem} · {sourceLabel(assertion, twin)}</small>
                        <button className="text-action" onClick={() => openEvidenceManager(assertion.id)}><Pencil size={13} /> Manage location</button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {activeTab === "Evidence review" && (
            <section className="review-section">
              <div className="review-rule">
                <ShieldCheck size={18} />
                <p><strong>Placement rule:</strong> 90% and above may be linked automatically, 75-89% needs approval, and lower-confidence observations stay unassigned. Homeowner edits are recorded as approved manual links.</p>
              </div>
              <div className="review-filters" aria-label="Evidence location filters">
                <button className={evidenceFilter === "needs-review" ? "active" : ""} onClick={() => setEvidenceFilter("needs-review")}>Needs review <span>{pendingReviews.length}</span></button>
                <button className={evidenceFilter === "accepted" ? "active" : ""} onClick={() => setEvidenceFilter("accepted")}>Linked <span>{twin.assertions.filter((assertion) => assertion.entityLinks.some((link) => acceptedLinkStatuses.has(link.status))).length}</span></button>
                <button className={evidenceFilter === "all" ? "active" : ""} onClick={() => setEvidenceFilter("all")}>All <span>{twin.assertions.length}</span></button>
              </div>
              {error && <p className="form-error">{error}</p>}
              {reviewAssertions.length === 0 ? (
                <div className="review-empty"><CheckCircle2 size={28} /><h3>Nothing in this view</h3><p>Switch filters to manage pending, linked, or all evidence locations.</p></div>
              ) : (
                <div className="review-list">
                  {reviewAssertions.map((assertion) => {
                    const media = twin.mediaAssets.find((item) => assertion.mediaIds.includes(item.id));
                    const currentLinks = assertion.entityLinks.filter((link) => link.status !== "rejected");
                    return (
                      <article className={focusedAssertionId === assertion.id ? "review-card focused" : "review-card"} key={assertion.id}>
                        <EvidencePreview media={media} alt={`Source evidence for ${assertion.title}`} className="review-image" mode={mode} apiBaseUrl={normalizedApiBaseUrl} />
                        <div className="review-content">
                          <div className="finding-meta">
                            <span className={`severity ${assertion.severity}`}>{assertion.severity === "safety" ? <ShieldAlert size={13} /> : <AlertTriangle size={13} />}{assertion.severity}</span>
                            <span>{assertion.reportItem} · page {assertion.sourcePage}</span>
                          </div>
                          <h3>{assertion.title}</h3>
                          <p>{assertion.detail}</p>
                          <div className="location-stack">
                            {currentLinks.length === 0 ? (
                              <div className="proposal-line muted">
                                <span>No place linked</span>
                                <strong>Unassigned</strong>
                                <span className="confidence-value">0%</span>
                              </div>
                            ) : currentLinks.map((link) => {
                              const entity = twin.entities.find((item) => item.id === link.entityId);
                              const reviewKey = `${assertion.id}:${link.entityId}`;
                              return (
                                <div className="location-link-row" key={reviewKey}>
                                  <div className="proposal-line">
                                    <span>{link.status === "pending" ? "Proposed place" : "Linked place"}</span>
                                    <strong>{entity?.name ?? link.entityId}</strong>
                                    <span className={`link-status ${link.status}`}>{link.status === "auto-accepted" ? "auto" : link.status}</span>
                                    <span className="confidence-value">{Math.round(link.confidence * 100)}%</span>
                                  </div>
                                  <small className="rationale">{link.rationale}</small>
                                  <div className="review-actions">
                                    {link.status === "pending" ? (
                                      <>
                                        <button className="primary-button" disabled={isStaticMode || reviewingId === `${reviewKey}:approve`} onClick={() => submitReview(assertion.id, link.entityId, "approve")}><Check size={15} /> Approve</button>
                                        <button className="secondary-button" disabled={isStaticMode || reviewingId === `${reviewKey}:reject`} onClick={() => submitReview(assertion.id, link.entityId, "reject")}><X size={15} /> Reject</button>
                                      </>
                                    ) : (
                                      <button className="secondary-button" disabled={isStaticMode || reviewingId === `${reviewKey}:remove`} onClick={() => submitReview(assertion.id, link.entityId, "remove")}><X size={15} /> Remove</button>
                                    )}
                                    <form onSubmit={(event) => {
                                      event.preventDefault();
                                      const target = new FormData(event.currentTarget).get("targetEntityId");
                                      if (target) submitReview(assertion.id, link.entityId, "move", String(target));
                                    }}>
                                      <select name="targetEntityId" defaultValue={link.entityId} aria-label="Choose a different place">
                                        {locationEntities.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                                      </select>
                                      <button className="secondary-button" disabled={isStaticMode || reviewingId === `${reviewKey}:move`}><Pencil size={15} /> Change</button>
                                    </form>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <form className="add-location-form" onSubmit={(event) => {
                            event.preventDefault();
                            const target = new FormData(event.currentTarget).get("targetEntityId");
                            if (target) submitReview(assertion.id, undefined, "add", String(target));
                          }}>
                            <select name="targetEntityId" defaultValue="" aria-label="Add another place">
                              <option value="" disabled>Add another place</option>
                              {locationEntities.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                            </select>
                            <button className="primary-button" disabled={isStaticMode || reviewingId?.startsWith(`${assertion.id}:`)}><Plus size={15} /> Add location</button>
                            <button type="button" className="secondary-button" disabled={isStaticMode} onClick={() => startPinPlacement(assertion.id)}><MapPin size={15} /> Pin on model</button>
                          </form>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {activeTab !== "Evidence review" && <section className="timeline-section">
            <div className="section-title">
              <div><span className="eyebrow">Append-only history</span><h3>{selectedEntityId === "home" ? "All home events" : `${selectedEntity?.name} events`}</h3></div>
              <span className="event-count">{visibleEvents.length} {visibleEvents.length === 1 ? "event" : "events"}</span>
            </div>
            <div className="timeline">
              {visibleEvents.map((event) => (
                <article className="event-row" key={event.id}>
                  <div className="event-date"><strong>{new Date(`${event.occurredAt}T12:00:00`).getFullYear()}</strong><span>{formatDate(event.occurredAt).replace(/, \d{4}/, "")}</span></div>
                  <div className="event-marker"><span /></div>
                  <div className="event-content">
                    <div className="event-heading">
                      <span className="event-type">{event.type}</span>
                      {event.conditionAfter && <span className={`condition-pill small ${conditionTone[event.conditionAfter] ?? "neutral"}`}>{event.conditionAfter}</span>}
                    </div>
                    <h4>{event.title}</h4>
                    <p>{event.summary}</p>
                    <div className="tag-list">
                      {event.entityIds.slice(0, 6).map((entityId) => {
                        const entity = twin.entities.find((item) => item.id === entityId);
                        return entity ? <span key={entityId}><Tag size={12} /> {entity.name}</span> : null;
                      })}
                      {event.entityIds.length > 6 && <span>+{event.entityIds.length - 6} more</span>}
                    </div>
                    {event.evidenceIds.length > 0 && (
                      <div className="evidence-list">
                        {event.evidenceIds.map((evidenceId) => {
                          const item = twin.evidence.find((evidence) => evidence.id === evidenceId);
                          return item ? (
                            item.id === "ev-acquisition-inspection" ? (
                              isStaticMode ? <span key={item.id}><FileText size={14} /> {item.label}<small>{item.sourceRef}</small></span> : <a className="evidence-link" key={item.id} href={apiUrl("/api/evidence?id=inspection-acquisition-2022")} target="_blank" rel="noreferrer"><FileText size={14} /> {item.label}<small>{item.sourceRef}</small></a>
                            ) : <span key={item.id}><FileText size={14} /> {item.label}<small>{item.sourceRef}</small></span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="event-chevron" size={18} />
                </article>
              ))}
            </div>
          </section>}
        </section>
      </main>
      )}

      {isModalOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setIsModalOpen(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="update-title">
            <div className="modal-header">
              <div><span className="eyebrow">New home event</span><h2 id="update-title">Add an update</h2></div>
              <button className="icon-button" title="Close" aria-label="Close" onClick={() => setIsModalOpen(false)}><X size={19} /></button>
            </div>
            <form onSubmit={submitUpdate}>
              <div className="form-grid two">
                <label>Date<input name="occurredAt" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} /></label>
                <label>Event type<select name="type" defaultValue="Maintenance"><option>Maintenance</option><option>Repair</option><option>Improvement</option><option>Inspection</option><option>Observation</option></select></label>
              </div>
              <label>Title<input name="title" required placeholder="Roof inspection" /></label>
              <label>Summary<textarea name="summary" required rows={3} placeholder="What changed, what was found, and what happens next" /></label>
              <div className="form-grid two">
                <label>Condition after<select name="conditionAfter" defaultValue="Good"><option>Excellent</option><option>Good</option><option>Fair</option><option>Needs attention</option><option>Operational</option><option>Updated</option></select></label>
                <label>Cost, optional<input name="cost" type="number" min="0" step="0.01" placeholder="0.00" /></label>
              </div>
              <fieldset>
                <legend>Place and system tags</legend>
                <div className="tag-picker">
                  {twin.entities.map((entity) => (
                    <label key={entity.id}><input type="checkbox" name="entityIds" value={entity.id} defaultChecked={entity.id === selectedEntityId} /><span>{entity.name}</span></label>
                  ))}
                </div>
              </fieldset>
              <label>Evidence reference, optional<div className="input-with-icon"><Camera size={16} /><input name="evidenceNote" placeholder="Invoice, photo set, permit or note" /></div></label>
              {error && <p className="form-error">{error}</p>}
              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button className="primary-button" disabled={isSaving}>{isSaving ? <><Clock3 size={16} /> Saving</> : <><Plus size={16} /> Add to history</>}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isZoneModalOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setIsZoneModalOpen(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="zone-title">
            <div className="modal-header">
              <div><span className="eyebrow">Spatial model</span><h2 id="zone-title">Create a zone</h2></div>
              <button className="icon-button" title="Close" aria-label="Close" onClick={() => setIsZoneModalOpen(false)}><X size={19} /></button>
            </div>
            <form onSubmit={submitZone}>
              <label>Zone name<input name="name" required placeholder="Rear left foundation" /></label>
              <div className="form-grid two">
                <label>Zone type<select name="zoneType" defaultValue={modelMode === "exterior" ? "facade" : "room"}><option value="room">Room</option><option value="facade">Facade</option><option value="yard">Yard</option><option value="roof">Roof</option><option value="system-area">System area</option><option value="custom">Custom</option></select></label>
                <label>Shape<select name="geometryKind" defaultValue={modelMode === "exterior" ? "box" : "box"}><option value="box">Box</option><option value="plane">Ground plane</option></select></label>
              </div>
              <label>Optional linked place<select name="entityId" defaultValue=""><option value="">No existing place</option>{locationEntities.map((entity) => <option key={entity.id} value={entity.id}>{entity.name}</option>)}</select></label>
              <div className="form-grid three">
                <label>X<input name="x" type="number" step="0.1" defaultValue="0" /></label>
                <label>Y<input name="y" type="number" step="0.1" defaultValue={modelMode === "exterior" ? "1" : "0.4"} /></label>
                <label>Z<input name="z" type="number" step="0.1" defaultValue="0" /></label>
              </div>
              <div className="form-grid three">
                <label>Width<input name="width" type="number" min="0.5" step="0.1" defaultValue="8" /></label>
                <label>Height<input name="height" type="number" min="0.1" step="0.1" defaultValue={modelMode === "exterior" ? "5" : "0.9"} /></label>
                <label>Depth<input name="depth" type="number" min="0.5" step="0.1" defaultValue="8" /></label>
              </div>
              <label>Color<input name="color" type="color" defaultValue="#dfece5" /></label>
              {error && <p className="form-error">{error}</p>}
              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={() => setIsZoneModalOpen(false)}>Cancel</button>
                <button className="primary-button"><Plus size={16} /> Create zone</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
