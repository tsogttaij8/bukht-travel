-- Incremental, non-destructive migration for private product chat Realtime + images.
alter table public.messages alter column body drop not null;
alter table public.messages add column if not exists attachment_path text;
alter table public.messages add column if not exists original_filename text;
alter table public.messages add column if not exists mime_type text;
alter table public.messages add column if not exists attachment_size bigint;
alter table public.messages add column if not exists width integer;
alter table public.messages add column if not exists height integer;
alter table public.messages add column if not exists client_nonce text;

create unique index if not exists messages_sender_nonce_idx
  on public.messages(sender_email, client_nonce) where client_nonce is not null;
create index if not exists messages_conversation_cursor_idx
  on public.messages(conversation_id, created_at, id);

do $$ begin
  alter table public.messages add constraint messages_content_check check (
    (body is not null and char_length(btrim(body)) between 1 and 2000) or attachment_path is not null
  ) not valid;
exception when duplicate_object then null; end $$;
alter table public.messages validate constraint messages_content_check;

do $$ begin
  alter table public.messages add constraint messages_attachment_metadata_check check (
    attachment_path is null or (
      mime_type in ('image/jpeg','image/png','image/webp','image/gif') and
      attachment_size between 1 and 10485760 and
      original_filename is not null
    )
  ) not valid;
exception when duplicate_object then null; end $$;
alter table public.messages validate constraint messages_attachment_metadata_check;

create or replace function public.broadcast_commerce_message_change()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, realtime
as $$
begin
  perform realtime.broadcast_changes(
    'conversation:' || coalesce(new.conversation_id, old.conversation_id)::text,
    'message_changed', tg_op, tg_table_name, tg_table_schema, new, old
  );
  return coalesce(new, old);
end;
$$;

drop trigger if exists messages_realtime_broadcast on public.messages;
create trigger messages_realtime_broadcast
after insert or update on public.messages
for each row execute function public.broadcast_commerce_message_change();

alter table realtime.messages enable row level security;
do $$ begin
  create policy "conversation participants receive private broadcasts"
  on realtime.messages for select to authenticated
  using (
    exists (
      select 1 from public.conversations c
      join public.users u on u.email in (c.buyer_email, c.seller_email)
      where ('conversation:' || c.id::text) = realtime.topic()
        and u.clerk_user_id = (auth.jwt() ->> 'sub')
        and u.status = 'active'
    )
  );
exception when duplicate_object then null; end $$;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('chat-attachments','chat-attachments',false,10485760,array['image/jpeg','image/png','image/webp','image/gif'])
on conflict(id) do update set public=false, file_size_limit=10485760,
  allowed_mime_types=array['image/jpeg','image/png','image/webp','image/gif'];

do $$ begin
  create policy "conversation participants read chat attachments"
  on storage.objects for select to authenticated
  using (
    bucket_id='chat-attachments' and (storage.foldername(name))[1]='conversations' and
    exists (
      select 1 from public.conversations c
      join public.users u on u.email in (c.buyer_email,c.seller_email)
      where c.id::text=(storage.foldername(name))[2]
        and u.clerk_user_id=(auth.jwt()->>'sub') and u.status='active'
    )
  );
exception when duplicate_object then null; end $$;

-- Signed upload tokens are issued only after server-side membership checks.
-- Direct arbitrary browser inserts remain denied because no INSERT policy is granted.
