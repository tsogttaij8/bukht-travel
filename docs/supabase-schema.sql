create table if not exists public.users (
  id text primary key,
  name text not null,
  email text not null unique,
  role text not null check (role in ('user', 'developer')),
  created_at timestamptz not null default now()
);

create table if not exists public.login_codes (
  email text not null,
  code_hash text not null,
  expires_at bigint not null
);

create index if not exists login_codes_email_idx on public.login_codes (email);

create table if not exists public.shipments (
  id text primary key,
  tracking_code text not null unique,
  customer_name text not null,
  customer_email text not null,
  origin text not null,
  destination text not null,
  current_status text not null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shipments_tracking_code_idx on public.shipments (tracking_code);

create table if not exists public.shipment_events (
  id text primary key,
  shipment_id text not null references public.shipments(id) on delete cascade,
  status text not null,
  details text not null,
  location text not null,
  happened_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists shipment_events_shipment_id_idx on public.shipment_events (shipment_id);
