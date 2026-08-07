-- Server-only cache for on-demand message translations.
-- Translation writes must not modify messages or emit chat Realtime events.

create table if not exists public.message_translations (
  message_id text not null references public.messages(id) on delete cascade,
  target_language text not null check (target_language in ('mn', 'zh-CN')),
  translated_text text not null check (char_length(btrim(translated_text)) > 0),
  created_at timestamptz not null default now(),
  primary key (message_id, target_language)
);

alter table public.message_translations enable row level security;

-- The browser does not access the translation cache directly.
revoke all on table public.message_translations from anon;
revoke all on table public.message_translations from authenticated;

grant select, insert, update, delete
  on table public.message_translations
  to service_role;
