alter table public.spatial_zones
  add column if not exists vertices jsonb not null default '[]'::jsonb;

comment on column public.spatial_zones.vertices is
  'Optional world-space vertices for homeowner-drawn polygon zones.';
