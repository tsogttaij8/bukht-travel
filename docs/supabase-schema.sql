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

create table if not exists public.products (
  id text primary key,
  name text not null,
  category text not null,
  price text not null,
  moq text not null,
  origin text not null,
  lead_time text not null,
  badge text not null default 'New',
  summary text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_updated_at_idx on public.products (updated_at);

create table if not exists public.user_profiles (
  user_id text primary key references public.users(id) on delete cascade,
  email text not null unique,
  phone text not null default '',
  company_name text not null default '',
  telegram_handle text not null default '',
  customer_types jsonb not null default '[]'::jsonb,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_profiles_email_idx on public.user_profiles (email);

create table if not exists public.service_requests (
  id text primary key,
  user_id text not null references public.users(id) on delete cascade,
  service_type text not null check (service_type in ('travel', 'cargo', 'esim', 'product_sourcing')),
  status text not null check (status in ('new', 'contacted', 'quoted', 'confirmed', 'completed', 'cancelled')),
  title text not null,
  details text not null,
  budget text not null default '',
  travel_date text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists service_requests_user_id_idx on public.service_requests (user_id);
create index if not exists service_requests_status_idx on public.service_requests (status);
