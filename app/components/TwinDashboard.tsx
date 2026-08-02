"use client";

import {
  Bath,
  BedDouble,
  Building2,
  CalendarDays,
  Camera,
  Check,
  ChevronRight,
  Clock3,
  FileText,
  House,
  Layers3,
  MapPin,
  Plus,
  Ruler,
  Search,
  ShieldCheck,
  Tag,
  Wrench,
  X,
} from "lucide-react";
import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { EntityKind, TwinEntity, TwinPayload } from "../../lib/twin-data";

const tabs = ["Overview", "Places", "Systems", "Timeline"] as const;
type Tab = (typeof tabs)[number];

const conditionTone: Record<string, string> = {
  C3: "green",
  Good: "green",
  Updated: "blue",
  Operational: "blue",
  Average: "amber",
  Fair: "amber",
  "Needs attention": "coral",
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${date}T12:00:00`));
}

function entityIcon(kind: EntityKind) {
  if (kind === "system") return Wrench;
  if (kind === "site") return MapPin;
  return Layers3;
}

export function TwinDashboard({ initialTwin }: { initialTwin: TwinPayload }) {
  const [twin, setTwin] = useState(initialTwin);
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [selectedEntityId, setSelectedEntityId] = useState("home");
  const [query, setQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/twin")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Database preview unavailable")))
      .then((payload: TwinPayload) => setTwin(payload))
      .catch(() => undefined);
  }, []);

  const selectedEntity = twin.entities.find((entity) => entity.id === selectedEntityId) ?? twin.entities[0];
  const visibleEntities = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return twin.entities.filter((entity) => {
      const tabMatch = activeTab === "Places" ? entity.kind !== "system" : activeTab === "Systems" ? entity.kind === "system" : true;
      const queryMatch = !normalizedQuery || `${entity.name} ${entity.groupName} ${entity.detail}`.toLowerCase().includes(normalizedQuery);
      return tabMatch && queryMatch;
    });
  }, [activeTab, query, twin.entities]);

  const visibleEvents = useMemo(() => {
    if (selectedEntityId === "home") return twin.events;
    return twin.events.filter((event) => event.entityIds.includes(selectedEntityId));
  }, [selectedEntityId, twin.events]);

  async function submitUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const entityIds = form.getAll("entityIds").map(String);
    try {
      const response = await fetch("/api/twin", {
        method: "POST",
        headers: { "content-type": "application/json" },
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
        <a className="brand" href="#top" aria-label="Home Intelligence home">
          <span className="brand-mark"><House size={18} strokeWidth={2.2} /></span>
          <span>Home Intelligence</span>
        </a>
        <div className="home-identity">
          <span>{twin.home.name}</span>
          <span className="identity-location"><MapPin size={14} /> {twin.home.location}</span>
        </div>
        <button className="primary-button" onClick={() => setIsModalOpen(true)}>
          <Plus size={17} /> Add update
        </button>
      </header>

      <nav className="tabbar" aria-label="Home record sections">
        {tabs.map((tab) => (
          <button key={tab} className={activeTab === tab ? "tab active" : "tab"} onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
        <span className="private-source"><ShieldCheck size={15} /> Private evidence</span>
      </nav>

      <main id="top" className="workspace">
        <aside className="entity-rail">
          <div className="rail-heading">
            <div>
              <span className="eyebrow">Digital twin</span>
              <h1>{activeTab === "Systems" ? "Systems" : activeTab === "Timeline" ? "Event scope" : "Home map"}</h1>
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
              <span className="eyebrow">Record since {formatDate(twin.home.acquiredAt)}</span>
              <h2>{selectedEntity?.name ?? twin.home.name}</h2>
              <p>{selectedEntity?.detail ?? "The complete home record."}</p>
            </div>
            <div className="record-condition">
              <span>Current state</span>
              <strong className={`condition-pill ${conditionTone[selectedEntity?.condition ?? ""] ?? "neutral"}`}>
                <Check size={14} /> {selectedEntity?.condition ?? twin.home.conditionRating}
              </strong>
            </div>
            <div className="record-art" aria-hidden="true">
              <Image src="/og.png" alt="" fill sizes="260px" priority />
            </div>
          </div>

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

          <section className="timeline-section">
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
                            <span key={item.id}><FileText size={14} /> {item.label}<small>{item.sourceRef}</small></span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="event-chevron" size={18} />
                </article>
              ))}
            </div>
          </section>
        </section>
      </main>

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
    </div>
  );
}
