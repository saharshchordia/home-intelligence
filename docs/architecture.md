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

The taxonomy can grow without rewriting earlier events. A future floor-plan layer can map these same IDs to geometry.

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

The API creates the schema and privacy-safe baseline when the database is empty. Drizzle schema definitions generate deployment migrations.

## Privacy

The public repository excludes exact address, owner names, parcel and tax identifiers, original appraisal pages and home photographs. Evidence records currently store references only. A later document phase should add private R2 storage, metadata extraction, redaction review and explicit access controls before uploads are enabled.

## Next extensions

1. Private document and photo uploads with R2.
2. Floor-plan geometry linked to existing entity IDs.
3. Before-and-after photo pairs and condition scoring.
4. Warranty, permit, contractor and appliance records.
5. Reminders generated from maintenance intervals and observed condition.
