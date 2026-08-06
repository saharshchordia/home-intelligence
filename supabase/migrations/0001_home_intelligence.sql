create extension if not exists "pgcrypto";

create table if not exists public.home_memberships (
  home_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (home_id, user_id)
);

create table if not exists public.homes (
  id text primary key,
  name text not null,
  location text not null,
  acquired_at date not null,
  year_built integer not null,
  design text not null,
  living_area_sq_ft integer not null,
  lot_sq_ft integer not null,
  room_count integer not null,
  bedrooms integer not null,
  bathrooms integer not null,
  quality_rating text not null,
  condition_rating text not null,
  source_label text not null,
  source_date date not null,
  owner_user_id uuid not null references auth.users(id) on delete cascade
);

create table if not exists public.entities (
  id text primary key,
  home_id text not null references public.homes(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('place', 'system', 'site')),
  group_name text not null,
  condition text not null,
  detail text not null,
  source_page integer not null
);

create table if not exists public.events (
  id text primary key,
  home_id text not null references public.homes(id) on delete cascade,
  occurred_at date not null,
  title text not null,
  type text not null,
  summary text not null,
  condition_before text,
  condition_after text,
  cost_cents integer,
  created_at timestamptz not null default now()
);

create table if not exists public.event_tags (
  event_id text not null references public.events(id) on delete cascade,
  entity_id text not null references public.entities(id) on delete cascade,
  primary key (event_id, entity_id)
);

create table if not exists public.evidence (
  id text primary key,
  home_id text not null references public.homes(id) on delete cascade,
  label text not null,
  kind text not null,
  source_ref text not null,
  captured_at date not null,
  visibility text not null
);

create table if not exists public.event_evidence (
  event_id text not null references public.events(id) on delete cascade,
  evidence_id text not null references public.evidence(id) on delete cascade,
  primary key (event_id, evidence_id)
);

create table if not exists public.documents (
  id text primary key,
  home_id text not null references public.homes(id) on delete cascade,
  title text not null,
  document_type text not null,
  source_date date not null,
  original_filename text not null,
  mime_type text not null,
  page_count integer not null,
  object_key text not null,
  sha256 text not null,
  storage_status text not null,
  visibility text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.assertions (
  id text primary key,
  home_id text not null references public.homes(id) on delete cascade,
  document_id text not null references public.documents(id) on delete cascade,
  report_item text not null,
  source_page integer not null,
  section text not null,
  title text not null,
  detail text not null,
  severity text not null check (severity in ('maintenance', 'recommendation', 'safety')),
  temporal_status text not null,
  review_status text not null,
  extraction_confidence numeric not null,
  entity_confidence numeric not null,
  temporal_confidence numeric not null,
  location_rationale text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.assertion_entities (
  assertion_id text not null references public.assertions(id) on delete cascade,
  entity_id text not null references public.entities(id) on delete cascade,
  relationship text not null,
  confidence numeric not null,
  status text not null check (status in ('auto-accepted', 'pending', 'approved', 'rejected')),
  rationale text not null,
  reviewed_at timestamptz,
  primary key (assertion_id, entity_id)
);

create table if not exists public.media_assets (
  id text primary key,
  document_id text not null references public.documents(id) on delete cascade,
  label text not null,
  kind text not null,
  source_page integer not null,
  object_key text not null,
  mime_type text not null,
  sha256 text not null,
  storage_status text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.assertion_evidence (
  assertion_id text not null references public.assertions(id) on delete cascade,
  media_id text not null references public.media_assets(id) on delete cascade,
  primary key (assertion_id, media_id)
);

create table if not exists public.review_decisions (
  id text primary key,
  assertion_id text not null references public.assertions(id) on delete cascade,
  entity_id text not null references public.entities(id) on delete cascade,
  decision text not null,
  previous_status text not null,
  next_status text not null,
  note text not null,
  decided_at timestamptz not null default now()
);

create table if not exists public.spatial_zones (
  id text primary key,
  home_id text not null references public.homes(id) on delete cascade,
  entity_id text references public.entities(id) on delete set null,
  name text not null,
  mode text not null,
  zone_type text not null,
  geometry_kind text not null,
  x numeric not null,
  y numeric not null,
  z numeric not null,
  width numeric not null,
  height numeric not null,
  depth numeric not null,
  color text not null,
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.evidence_pins (
  id text primary key,
  home_id text not null references public.homes(id) on delete cascade,
  assertion_id text not null references public.assertions(id) on delete cascade,
  media_id text references public.media_assets(id) on delete set null,
  zone_id text references public.spatial_zones(id) on delete set null,
  entity_id text references public.entities(id) on delete set null,
  mode text not null,
  x numeric not null,
  y numeric not null,
  z numeric not null,
  label text not null,
  confidence numeric not null,
  status text not null,
  rationale text not null,
  created_at timestamptz not null default now()
);

create index if not exists events_date_idx on public.events(home_id, occurred_at desc);
create index if not exists event_tags_entity_idx on public.event_tags(entity_id, event_id);
create index if not exists assertions_document_idx on public.assertions(document_id, source_page);
create index if not exists assertions_review_idx on public.assertions(review_status, severity);
create index if not exists assertion_entities_entity_idx on public.assertion_entities(entity_id, status);
create index if not exists media_assets_document_idx on public.media_assets(document_id, source_page);
create index if not exists spatial_zones_entity_idx on public.spatial_zones(entity_id, mode);
create index if not exists evidence_pins_assertion_idx on public.evidence_pins(assertion_id, status);
create index if not exists evidence_pins_zone_idx on public.evidence_pins(zone_id, status);

create or replace function public.can_access_home(target_home_id text)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1
    from public.home_memberships memberships
    where memberships.home_id = target_home_id
      and memberships.user_id = (select auth.uid())
  );
$$;

create or replace function public.can_edit_home(target_home_id text)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1
    from public.home_memberships memberships
    where memberships.home_id = target_home_id
      and memberships.user_id = (select auth.uid())
      and memberships.role in ('owner', 'editor')
  );
$$;

alter table public.home_memberships enable row level security;
alter table public.homes enable row level security;
alter table public.entities enable row level security;
alter table public.events enable row level security;
alter table public.event_tags enable row level security;
alter table public.evidence enable row level security;
alter table public.event_evidence enable row level security;
alter table public.documents enable row level security;
alter table public.assertions enable row level security;
alter table public.assertion_entities enable row level security;
alter table public.media_assets enable row level security;
alter table public.assertion_evidence enable row level security;
alter table public.review_decisions enable row level security;
alter table public.spatial_zones enable row level security;
alter table public.evidence_pins enable row level security;

create policy "members can read memberships" on public.home_memberships for select to authenticated
using (user_id = (select auth.uid()));

create policy "members can read homes" on public.homes for select to authenticated
using (public.can_access_home(id));

create policy "owners can update homes" on public.homes for update to authenticated
using (public.can_edit_home(id))
with check (public.can_edit_home(id));

create policy "members can read entities" on public.entities for select to authenticated
using (public.can_access_home(home_id));

create policy "editors can manage entities" on public.entities for all to authenticated
using (public.can_edit_home(home_id))
with check (public.can_edit_home(home_id));

create policy "members can read events" on public.events for select to authenticated
using (public.can_access_home(home_id));

create policy "editors can manage events" on public.events for all to authenticated
using (public.can_edit_home(home_id))
with check (public.can_edit_home(home_id));

create policy "members can read evidence" on public.evidence for select to authenticated
using (public.can_access_home(home_id));

create policy "editors can manage evidence" on public.evidence for all to authenticated
using (public.can_edit_home(home_id))
with check (public.can_edit_home(home_id));

create policy "members can read documents" on public.documents for select to authenticated
using (public.can_access_home(home_id));

create policy "editors can manage documents" on public.documents for all to authenticated
using (public.can_edit_home(home_id))
with check (public.can_edit_home(home_id));

create policy "members can read assertions" on public.assertions for select to authenticated
using (public.can_access_home(home_id));

create policy "editors can manage assertions" on public.assertions for all to authenticated
using (public.can_edit_home(home_id))
with check (public.can_edit_home(home_id));

create policy "members can read zones" on public.spatial_zones for select to authenticated
using (public.can_access_home(home_id));

create policy "editors can manage zones" on public.spatial_zones for all to authenticated
using (public.can_edit_home(home_id))
with check (public.can_edit_home(home_id));

create policy "members can read pins" on public.evidence_pins for select to authenticated
using (public.can_access_home(home_id));

create policy "editors can manage pins" on public.evidence_pins for all to authenticated
using (public.can_edit_home(home_id))
with check (public.can_edit_home(home_id));

create policy "members can read event tags" on public.event_tags for select to authenticated
using (
  exists (
    select 1 from public.events events
    where events.id = event_tags.event_id and public.can_access_home(events.home_id)
  )
);

create policy "editors can manage event tags" on public.event_tags for all to authenticated
using (
  exists (
    select 1 from public.events events
    where events.id = event_tags.event_id and public.can_edit_home(events.home_id)
  )
)
with check (
  exists (
    select 1 from public.events events
    where events.id = event_tags.event_id and public.can_edit_home(events.home_id)
  )
);

create policy "members can read event evidence" on public.event_evidence for select to authenticated
using (
  exists (
    select 1 from public.events events
    where events.id = event_evidence.event_id and public.can_access_home(events.home_id)
  )
);

create policy "editors can manage event evidence" on public.event_evidence for all to authenticated
using (
  exists (
    select 1 from public.events events
    where events.id = event_evidence.event_id and public.can_edit_home(events.home_id)
  )
)
with check (
  exists (
    select 1 from public.events events
    where events.id = event_evidence.event_id and public.can_edit_home(events.home_id)
  )
);

create policy "members can read assertion entities" on public.assertion_entities for select to authenticated
using (
  exists (
    select 1 from public.assertions assertions
    where assertions.id = assertion_entities.assertion_id and public.can_access_home(assertions.home_id)
  )
);

create policy "editors can manage assertion entities" on public.assertion_entities for all to authenticated
using (
  exists (
    select 1 from public.assertions assertions
    where assertions.id = assertion_entities.assertion_id and public.can_edit_home(assertions.home_id)
  )
)
with check (
  exists (
    select 1 from public.assertions assertions
    where assertions.id = assertion_entities.assertion_id and public.can_edit_home(assertions.home_id)
  )
);

create policy "members can read media assets" on public.media_assets for select to authenticated
using (
  exists (
    select 1 from public.documents documents
    where documents.id = media_assets.document_id and public.can_access_home(documents.home_id)
  )
);

create policy "editors can manage media assets" on public.media_assets for all to authenticated
using (
  exists (
    select 1 from public.documents documents
    where documents.id = media_assets.document_id and public.can_edit_home(documents.home_id)
  )
)
with check (
  exists (
    select 1 from public.documents documents
    where documents.id = media_assets.document_id and public.can_edit_home(documents.home_id)
  )
);

create policy "members can read assertion evidence" on public.assertion_evidence for select to authenticated
using (
  exists (
    select 1 from public.assertions assertions
    where assertions.id = assertion_evidence.assertion_id and public.can_access_home(assertions.home_id)
  )
);

create policy "editors can manage assertion evidence" on public.assertion_evidence for all to authenticated
using (
  exists (
    select 1 from public.assertions assertions
    where assertions.id = assertion_evidence.assertion_id and public.can_edit_home(assertions.home_id)
  )
)
with check (
  exists (
    select 1 from public.assertions assertions
    where assertions.id = assertion_evidence.assertion_id and public.can_edit_home(assertions.home_id)
  )
);

create policy "members can read decisions" on public.review_decisions for select to authenticated
using (
  exists (
    select 1 from public.assertions assertions
    where assertions.id = review_decisions.assertion_id and public.can_access_home(assertions.home_id)
  )
);

create policy "editors can create decisions" on public.review_decisions for insert to authenticated
with check (
  exists (
    select 1 from public.assertions assertions
    where assertions.id = review_decisions.assertion_id and public.can_edit_home(assertions.home_id)
  )
);

insert into storage.buckets (id, name, public)
values ('home-evidence', 'home-evidence', false)
on conflict (id) do nothing;

create policy "members can read home evidence files" on storage.objects for select to authenticated
using (
  bucket_id = 'home-evidence'
  and public.can_access_home((storage.foldername(name))[1])
);

create policy "editors can upload home evidence files" on storage.objects for insert to authenticated
with check (
  bucket_id = 'home-evidence'
  and public.can_edit_home((storage.foldername(name))[1])
);

create policy "editors can update home evidence files" on storage.objects for update to authenticated
using (
  bucket_id = 'home-evidence'
  and public.can_edit_home((storage.foldername(name))[1])
)
with check (
  bucket_id = 'home-evidence'
  and public.can_edit_home((storage.foldername(name))[1])
);
