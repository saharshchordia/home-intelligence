# Home Intelligence

Home Intelligence is a privacy-conscious, event-sourced digital twin for a home. It begins with a dated acquisition baseline and grows through tagged maintenance, repair, improvement, inspection and observation events.

The included demo baseline is derived from a June 15, 2022 appraisal. Exact addresses, owner names, parcel identifiers, tax details, original documents and property photographs are intentionally excluded from this public repository.

## What is included

- Phase 1: a structured acquisition snapshot covering core property facts, spaces, systems, condition and source-page references
- Phase 2: a reusable tagging model for places, site features and building systems
- Phase 3: an append-only timeline with condition changes, costs and evidence references
- A responsive dashboard for browsing the home and recording new events
- Cloudflare D1 persistence with a reproducible schema and seeded privacy-safe baseline

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

The twin stores stable home entities separately from dated events. Events link to one or more entities through tags and can reference private evidence without placing source documents in the public repository.

See [docs/architecture.md](docs/architecture.md) for the model, privacy boundary and extension path.

## Privacy boundary

Treat the repository as application source, not the evidence vault. Keep reports, invoices, photos, warranties and permits in private object storage. Commit only redacted or intentionally public metadata. The current release stores evidence references but does not upload files.

## License

MIT
