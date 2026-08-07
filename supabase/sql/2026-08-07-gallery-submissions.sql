create table if not exists gallery_submissions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  artist_name text not null,
  school_email text not null,
  title text not null,
  class_year text not null,
  medium text not null,
  dimensions text not null,
  statement text not null,
  private_image_path text not null,
  public_image_path text,
  public_image_url text,
  review_status text not null default 'pending' check (review_status in ('pending', 'approved', 'rejected', 'changes_needed')),
  reviewer_id uuid references officers(id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now()
);

create index if not exists gallery_submissions_status_created_at_idx
on gallery_submissions (review_status, created_at desc);

alter table gallery_submissions enable row level security;

drop policy if exists "Public can read approved gallery submissions" on gallery_submissions;
create policy "Public can read approved gallery submissions"
on gallery_submissions for select
using (review_status = 'approved');

drop policy if exists "Officers can read gallery submissions" on gallery_submissions;
create policy "Officers can read gallery submissions"
on gallery_submissions for select
using (is_current_officer());

drop policy if exists "Officers can manage gallery submissions" on gallery_submissions;
create policy "Officers can manage gallery submissions"
on gallery_submissions for all
using (is_current_officer())
with check (is_current_officer());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gallery-submissions', 'gallery-submissions', false, 1048576, array['image/jpeg', 'image/png'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gallery-images', 'gallery-images', true, 1048576, array['image/jpeg', 'image/png'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Officers can manage private gallery submissions" on storage.objects;
create policy "Officers can manage private gallery submissions"
on storage.objects for all to authenticated
using (bucket_id = 'gallery-submissions' and is_current_officer())
with check (bucket_id = 'gallery-submissions' and is_current_officer());

drop policy if exists "Officers can manage public gallery images" on storage.objects;
create policy "Officers can manage public gallery images"
on storage.objects for all to authenticated
using (bucket_id = 'gallery-images' and is_current_officer())
with check (bucket_id = 'gallery-images' and is_current_officer());
