# Home Intelligence Architecture

## Product model

Home Intelligence is an event-sourced record. The current condition of a place or system is derived from its acquisition baseline plus every later event tagged to it.

```text
Home
  -> Entities: places, site features, systems
  -> Events: baseline, inspection, maintenance, repair, improvement, observation
       -> Tags: one event can affect many entities
       -> Evidence: document, photo set, drawing, invoice, permit or note
```

## Phase 1: acquisition baseline

The appraisal establishes the first dated state on June 15, 2022. The public seed includes non-sensitive property facts, room and system inventory, reported condition, and page-level source references. The source appraisal stays outside Git.

## Phase 2: tagging model

Every update is attached to one or more stable entity IDs. Entities currently use three kinds:

- `place`: rooms and spatial groupings
- `site`: yard, patios and other exterior features
- `system`: structure, roof, windows, HVAC, plumbing, electrical and finishes

The taxonomy can grow without rewriting earlier events. The 3D model maps the same stable IDs to approximate report-derived geometry, so events and accepted assertions inherit a durable physical location.

Place assignment is confidence-gated:

- `>= 0.90`: may be accepted automatically when explicit report language and adjacent evidence agree
- `0.75-0.89`: retained as a candidate until human review
- `< 0.75`: not linked to a place; retain only at a confidently identified broad system or in the unassigned queue
- safety-critical findings: human review is mandatory regardless of score

### Spatial presentation contract

- A pin is rendered only when an assertion-to-entity link is `auto-accepted` or `approved`.
- Pending, rejected and unassigned links never appear on the house model.
- Broad system findings stay in the system evidence index unless they also have an independently accepted place link.
- A pin opens the accepted findings and dated events for that stable entity ID; the source page and temporal label remain visible.
- Model geometry is explicitly approximate until a measured survey replaces the acquisition sketch. Geometry revisions must preserve entity IDs or provide an audited mapping.

## Phase 3: event timeline

Events are append-only records with an occurrence date, type, summary, condition after the event, optional cost, tags and evidence references. Corrections should be represented as a new event that supersedes an earlier assertion rather than silently changing history.

## Storage

Cloudflare D1 stores structured records:

- `homes`
- `entities`
- `events`
- `event_tags`
- `evidence`
- `event_evidence`
- `documents`
- `assertions`
- `assertion_entities`
- `media_assets`
- `assertion_evidence`
- `review_decisions`

R2 stores original reports and private report-page images. D1 stores checksums, source dates, page references, confidence dimensions, candidate links and the append-only review audit. The API creates the schema and privacy-safe baseline idempotently, while Drizzle schema definitions generate deployment migrations.

## Privacy

The public repository excludes exact address, owner names, parcel and tax identifiers, original reports, extraction manifests and property photographs. Evidence bytes remain in the private R2 binding. The deployed site is private, and evidence responses are marked private and non-cacheable.

## Next extensions

1. Measured floor-plan geometry and calibrated room boundaries.
2. Before-and-after photo pairs and condition scoring.
3. Warranty, permit, contractor and appliance records.
4. Reminders generated from maintenance intervals and observed condition.
