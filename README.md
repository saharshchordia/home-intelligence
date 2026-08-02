# Home Intelligence

Home Intelligence is a privacy-conscious, event-sourced digital twin for a home. It begins with a dated acquisition baseline and grows through tagged maintenance, repair, improvement, inspection and observation events.

The included demo baseline is derived from a June 15, 2022 appraisal. Exact addresses, owner names, parcel identifiers, tax details, original documents and property photographs are intentionally excluded from this public repository.

## What is included

- Phase 1: a structured acquisition snapshot covering core property facts, spaces, systems, condition and source-page references
- Phase 2: a reusable tagging model for places, site features and building systems
- Phase 3: an append-only timeline with condition changes, costs and evidence references
- A responsive dashboard for browsing the home and recording new events
- Cloudflare D1 persistence with a reproducible schema and seeded privacy-safe baseline
- Private R2 storage for source reports and report-page imagery
- Confidence-gated assertions with a human review queue for uncertain or safety-critical place links

## Run locally

Requirements: Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open the local URL printed by the development server. The API creates and seeds the local D1 database on first use.

## Validate

```bash
npm run db:generate
npm run build
npm test
```

## Data model

The twin stores stable home entities separately from dated events. Imported documents produce evidence-backed assertions before they become place links. Location confidence of 90% or greater may be accepted automatically, 75-89% requires review, and lower-confidence proposals remain unassigned. Safety findings always require review.

See [docs/architecture.md](docs/architecture.md) for the model, privacy boundary and extension path.

## Privacy boundary

Treat the repository as application source, not the evidence vault. Reports, report pages, photos, warranties and permits live in private object storage, with searchable provenance in D1. The one-time acquisition import manifest is generated outside the repository and is never committed.

## License

MIT
