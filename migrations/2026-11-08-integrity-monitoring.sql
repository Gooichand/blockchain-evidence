-- M5: scheduled integrity re-verification (alerts + scan run history)
-- Applied to the live database on 2026-11-08; committed here for parity.

-- Open alerts produced when re-verification finds a stored file whose
-- recomputed SHA-256 no longer matches the intake hash.
create table if not exists public.integrity_alerts (
  id bigint generated always as identity primary key,
  evidence_id bigint not null,
  case_id integer,
  expected_hash text,
  actual_hash text,
  check_source text not null default 'nightly_scan',
  detected_at timestamptz not null default now(),
  acknowledged boolean not null default false,
  acknowledged_by text,
  acknowledged_at timestamptz
);

-- One open alert per evidence item at a time.
create unique index if not exists integrity_alerts_one_open
  on public.integrity_alerts(evidence_id) where acknowledged = false;

-- Service-role only: the API enforces per-user access in the controller.
alter table public.integrity_alerts enable row level security;
revoke all on public.integrity_alerts from anon, authenticated;

-- Alert notifications use their own type.
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type = any (array['evidence_upload','evidence_verification','evidence_assignment','comment','mention','system','urgent','integrity_alert']));

-- Durable scan history: start/counts/finish per run, so a restart or a
-- sleeping service cannot silently skip the nightly verification.
create table if not exists public.integrity_scan_runs (
  id bigint generated always as identity primary key,
  source text not null,
  status text not null default 'running',
  checked integer not null default 0,
  mismatches integer not null default 0,
  errors integer not null default 0,
  detail text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

alter table public.integrity_scan_runs enable row level security;
revoke all on public.integrity_scan_runs from anon, authenticated;

NOTIFY pgrst, 'reload schema';
