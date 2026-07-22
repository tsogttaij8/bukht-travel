-- Incremental, non-destructive video support for private commerce chat.
alter table public.messages add column if not exists duration_seconds numeric;
alter table public.messages add column if not exists attachment_kind text;

update public.messages set attachment_kind='image'
where attachment_path is not null and attachment_kind is null;

alter table public.messages drop constraint if exists messages_attachment_metadata_check;
alter table public.messages add constraint messages_attachment_metadata_check check (
  attachment_path is null or (
    attachment_kind in ('image','video') and original_filename is not null and
    ((attachment_kind='image' and mime_type in ('image/jpeg','image/png','image/webp','image/gif') and attachment_size between 1 and 10485760 and duration_seconds is null) or
     (attachment_kind='video' and mime_type in ('video/mp4','video/webm','video/quicktime') and attachment_size between 1 and 52428800 and duration_seconds > 0 and duration_seconds <= 60))
  )
) not valid;
alter table public.messages validate constraint messages_attachment_metadata_check;
create index if not exists messages_video_attachment_idx on public.messages(conversation_id, created_at) where attachment_kind='video';

update storage.buckets set public=false, file_size_limit=52428800,
  allowed_mime_types=array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime']
where id='chat-attachments';
