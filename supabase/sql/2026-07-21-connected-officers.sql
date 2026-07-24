create extension if not exists pgcrypto;

create table if not exists officers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  role text not null check (length(btrim(role)) > 0),
  email text not null unique check (
    email = lower(email)
    and email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  focus text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists officers_set_updated_at on officers;

create trigger officers_set_updated_at
before update on officers
for each row
execute function set_updated_at();

insert into officers (name, role, email)
select
  officer_profiles.full_name,
  officer_profiles.role,
  lower(auth.users.email)
from officer_profiles
join auth.users on auth.users.id = officer_profiles.auth_user_id
where auth.users.email is not null
on conflict (email) do update
set
  name = excluded.name,
  role = excluded.role;

alter table officers enable row level security;

grant select, insert, update, delete on officers to authenticated;

create or replace function is_current_officer()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from officers
    where officers.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

drop policy if exists "Officers can read officers" on officers;
drop policy if exists "Officers can read their own officer row" on officers;
drop policy if exists "Officers can insert officers" on officers;
drop policy if exists "Officers can update officers" on officers;
drop policy if exists "Officers can delete officers" on officers;

create policy "Officers can read their own officer row"
on officers
for select
to authenticated
using (email = lower(coalesce(auth.jwt() ->> 'email', '')));

create policy "Officers can read officers"
on officers
for select
to authenticated
using (is_current_officer());

create policy "Officers can insert officers"
on officers
for insert
to authenticated
with check (is_current_officer());

create policy "Officers can update officers"
on officers
for update
to authenticated
using (is_current_officer())
with check (is_current_officer());

create policy "Officers can delete officers"
on officers
for delete
to authenticated
using (is_current_officer());

create or replace view public_officers as
select id, name, role, focus
from officers;

grant select on public_officers to anon, authenticated;

drop policy if exists "Officers can insert members" on members;
drop policy if exists "Officers can update members" on members;
drop policy if exists "Officers can delete members" on members;
drop policy if exists "Officers can insert memberships" on memberships;
drop policy if exists "Officers can update memberships" on memberships;
drop policy if exists "Officers can delete memberships" on memberships;
drop policy if exists "Officers can insert meetings" on meetings;
drop policy if exists "Officers can update meetings" on meetings;
drop policy if exists "Officers can delete meetings" on meetings;
drop policy if exists "Officers can insert attendance records" on attendance_records;

create policy "Officers can insert members"
on members
for insert
to authenticated
with check (is_current_officer());

create policy "Officers can update members"
on members
for update
to authenticated
using (is_current_officer())
with check (is_current_officer());

create policy "Officers can delete members"
on members
for delete
to authenticated
using (is_current_officer());

create policy "Officers can insert memberships"
on memberships
for insert
to authenticated
with check (is_current_officer());

create policy "Officers can update memberships"
on memberships
for update
to authenticated
using (is_current_officer())
with check (is_current_officer());

create policy "Officers can delete memberships"
on memberships
for delete
to authenticated
using (is_current_officer());

create policy "Officers can insert meetings"
on meetings
for insert
to authenticated
with check (is_current_officer());

create policy "Officers can update meetings"
on meetings
for update
to authenticated
using (is_current_officer())
with check (is_current_officer());

create policy "Officers can delete meetings"
on meetings
for delete
to authenticated
using (is_current_officer());

create policy "Officers can insert attendance records"
on attendance_records
for insert
to authenticated
with check (is_current_officer());

drop policy if exists "Officers can upload event images" on storage.objects;
drop policy if exists "Officers can update event images" on storage.objects;
drop policy if exists "Officers can delete event images" on storage.objects;

create policy "Officers can upload event images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'event-images'
  and is_current_officer()
);

create policy "Officers can update event images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'event-images'
  and is_current_officer()
)
with check (
  bucket_id = 'event-images'
  and is_current_officer()
);

create policy "Officers can delete event images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'event-images'
  and is_current_officer()
);
