create table if not exists public.users (
  id text primary key,
  clerk_user_id text unique,
  name text not null,
  email text not null unique,
  role text not null check (role in ('user', 'developer')),
  status text not null default 'active' check (status in ('active', 'disabled')),
  created_at timestamptz not null default now()
);

alter table public.users add column if not exists clerk_user_id text unique;
alter table public.users add column if not exists status text not null default 'active' check (status in ('active', 'disabled'));

create table if not exists public.user_roles (
  user_id text not null references public.users(id) on delete cascade,
  role text not null check (role in ('owner', 'cargo_staff', 'travel_staff', 'esim_staff', 'finance_staff', 'support_staff', 'customer')),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create index if not exists user_roles_role_idx on public.user_roles (role);

create table if not exists public.login_codes (
  email text not null,
  code_hash text not null,
  expires_at bigint not null
);

create index if not exists login_codes_email_idx on public.login_codes (email);
create unique index if not exists login_codes_email_unique_idx on public.login_codes (email);

create table if not exists public.rate_limits (
  key text primary key,
  count integer not null,
  reset_at bigint not null
);

create index if not exists rate_limits_reset_at_idx on public.rate_limits (reset_at);

create or replace function public.consume_rate_limit(
  input_key text,
  input_limit integer,
  input_window_ms bigint,
  input_now bigint default ((extract(epoch from now()) * 1000)::bigint)
)
returns table (allowed boolean, remaining integer, retry_after_ms bigint)
language sql
as $$
  delete from public.rate_limits where reset_at <= input_now;

  with existing as (
    select key, count, reset_at
    from public.rate_limits
    where key = input_key
  ),
  upserted as (
    insert into public.rate_limits as rl (key, count, reset_at)
    values (input_key, 1, input_now + input_window_ms)
    on conflict (key) do update
    set
      count = case
        when rl.reset_at <= input_now then 1
        when rl.count < input_limit then rl.count + 1
        else rl.count
      end,
      reset_at = case
        when rl.reset_at <= input_now then input_now + input_window_ms
        else rl.reset_at
      end
    returning count, reset_at
  )
  select
    case
      when existing.key is null then true
      when existing.reset_at <= input_now then true
      when existing.count < input_limit then true
      else false
    end as allowed,
    case
      when existing.key is null then greatest(input_limit - upserted.count, 0)
      when existing.reset_at <= input_now then greatest(input_limit - upserted.count, 0)
      when existing.count < input_limit then greatest(input_limit - upserted.count, 0)
      else 0
    end as remaining,
    case
      when existing.key is null then 0
      when existing.reset_at <= input_now then 0
      when existing.count < input_limit then 0
      else greatest(upserted.reset_at - input_now, 0)
    end as retry_after_ms
  from upserted
  left join existing on true;
$$;

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
