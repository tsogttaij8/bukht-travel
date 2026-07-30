-- Align the deployed products table with the canonical application contract.
-- Apply only after taking a database backup and reviewing the read-only audit.

alter table public.products
  add column if not exists image_urls jsonb not null default '[]'::jsonb;

update public.products
set image_urls = jsonb_build_array(image_url)
where image_url <> ''
  and image_urls = '[]'::jsonb;

alter table public.products
  alter column price type text using price::text;
