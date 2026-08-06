# Home Intelligence

Home Intelligence is a privacy-conscious, event-sourced digital twin for a home. It begins with a dated acquisition baseline and grows through tagged maintenance, repair, improvement, inspection and observation events.

The included demo baseline is derived from a June 15, 2022 appraisal. Exact addresses, owner names, parcel identifiers, tax details, original documents and property photographs are intentionally excluded from this public repository.

## What is included

- Phase 1: a structured acquisition snapshot covering core property facts, spaces, systems, condition and source-page references
- Phase 2: a reusable tagging model for places, site features and building systems
- Phase 3: an append-only timeline with condition changes, costs and evidence references
- A responsive dashboard for browsing the home and recording new events
- Supabase Postgres persistence with a reproducible schema and seeded privacy-safe baseline
- Private Supabase Storage for source reports and report-page imagery
- Confidence-gated assertions with a human review queue for uncertain or safety-critical place links

## Run locally

Requirements: Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open the local URL printed by the development server. The default local app renders the seeded baseline from source data.

## Validate

```bash
npm run db:generate
npm run build
npm run build:pages
npm test
```

## GitHub Pages preview

The repository can also publish a read-only frontend to GitHub Pages:

```bash
npm run build:pages
```

This build renders the same 3D home model, zones, evidence pins, timeline and seeded evidence metadata from `lib/twin-data.ts`. Without an API URL it stays read-only. Set `VITE_HOME_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` and `VITE_SITE_URL` to enable Supabase-backed reads and edits.

## Supabase backend

Home Intelligence can run as a GitHub Pages frontend backed by Supabase Auth,
Postgres, Storage and an Edge Function.

Supabase pieces:

- `supabase/migrations/0001_home_intelligence.sql` creates the Postgres schema,
  RLS policies and private `home-evidence` storage bucket.
- `supabase/functions/home-api/index.ts` exposes the dashboard API surface behind
  Supabase Auth.
- GitHub Pages needs `VITE_HOME_API_BASE_URL`, `VITE_SUPABASE_URL`,
  `VITE_SUPABASE_PUBLISHABLE_KEY` and `VITE_SITE_URL` at build time.

The API base URL should look like:

```text
https://<project-ref>.functions.supabase.co/home-api
```

Supabase Auth URL Configuration should set the Site URL to:

```text
https://saharshchordia.github.io/home-intelligence/
```

Add the same value to Redirect URLs for magic-link callbacks.

The frontend uses the publishable key only. Do not put the Supabase service role
or secret key in GitHub repository variables or frontend source.

## Data model

The twin stores stable home entities separately from dated events. Imported documents produce evidence-backed assertions before they become place links. Location confidence of 90% or greater may be accepted automatically, 75-89% requires review, and lower-confidence proposals remain unassigned. Safety findings always require review.

See [docs/architecture.md](docs/architecture.md) for the model, privacy boundary and extension path.

## Privacy boundary

Treat the repository as application source, not the evidence vault. Reports, report pages, photos, warranties and permits live in private object storage, with searchable provenance in Supabase Postgres. The one-time acquisition import manifest is generated outside the repository and is never committed.

## License

MIT
