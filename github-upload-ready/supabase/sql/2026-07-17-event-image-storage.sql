insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'event-images',
  'event-images',
  true,
  5242880,
  array['image/jpeg', 'image/png']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read event images"
on storage.objects;

create policy "Public can read event images"
on storage.objects
for select
using (bucket_id = 'event-images');

drop policy if exists "Officers can upload event images"
on storage.objects;

create policy "Officers can upload event images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'event-images'
  and exists (
    select 1
    from officer_profiles
    where officer_profiles.auth_user_id = auth.uid()
  )
);

drop policy if exists "Officers can update event images"
on storage.objects;

create policy "Officers can update event images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'event-images'
  and exists (
    select 1
    from officer_profiles
    where officer_profiles.auth_user_id = auth.uid()
  )
)
with check (
  bucket_id = 'event-images'
  and exists (
    select 1
    from officer_profiles
    where officer_profiles.auth_user_id = auth.uid()
  )
);

drop policy if exists "Officers can delete event images"
on storage.objects;

create policy "Officers can delete event images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'event-images'
  and exists (
    select 1
    from officer_profiles
    where officer_profiles.auth_user_id = auth.uid()
  )
);
