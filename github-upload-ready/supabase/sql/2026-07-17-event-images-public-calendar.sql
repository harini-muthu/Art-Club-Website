alter table meetings
  add column if not exists image_url text,
  add column if not exists image_alt text;

drop policy if exists "Public can read calendar meetings" on meetings;

create policy "Public can read calendar meetings"
on meetings
for select
to anon, authenticated
using (show_on_calendar is true);
