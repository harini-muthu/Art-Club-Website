create table if not exists guests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (length(btrim(full_name)) > 0),
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table attendance_records
  add column if not exists guest_id uuid references guests(id) on delete set null;

create unique index if not exists guests_active_normalized_name_unique
on guests (lower(regexp_replace(btrim(full_name), '\s+', ' ', 'g')))
where archived_at is null;

create index if not exists attendance_records_guest_id_index
on attendance_records (guest_id);

drop trigger if exists guests_set_updated_at on guests;
create trigger guests_set_updated_at
before update on guests
for each row
execute function set_updated_at();

insert into guests (full_name)
select min(btrim(attendee_name))
from attendance_records
where member_id is null
  and guest_id is null
  and attendee_name is not null
  and btrim(attendee_name) <> ''
group by lower(regexp_replace(btrim(attendee_name), '\s+', ' ', 'g'))
on conflict do nothing;

update attendance_records
set guest_id = guests.id
from guests
where attendance_records.member_id is null
  and attendance_records.guest_id is null
  and lower(regexp_replace(btrim(attendance_records.attendee_name), '\s+', ' ', 'g')) =
      lower(regexp_replace(btrim(guests.full_name), '\s+', ' ', 'g'))
  and guests.archived_at is null;

alter table guests enable row level security;
grant select, insert, update, delete on guests to authenticated;

drop policy if exists "Officers can manage guests" on guests;
create policy "Officers can manage guests"
on guests
for all
to authenticated
using (is_current_officer())
with check (is_current_officer());

drop function if exists public.record_today_attendance(uuid, text, text);

create function public.record_today_attendance(
  meeting_id uuid,
  attendee_name text,
  honeypot text default ''
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  display_name text := btrim(coalesce(attendee_name, ''));
  normalized_name text;
  active_member_id uuid;
  matched_guest_id uuid;
  selected_meeting_id uuid := meeting_id;
  site_now timestamp without time zone := now() at time zone 'America/New_York';
  site_today date := site_now::date;
begin
  if btrim(coalesce(honeypot, '')) <> '' then return 'invalid'; end if;
  normalized_name := lower(regexp_replace(display_name, '\s+', ' ', 'g'));
  if normalized_name = '' or char_length(display_name) > 90 then return 'invalid'; end if;

  if not exists (
    select 1 from meetings
    where meetings.id = selected_meeting_id
      and meetings.meeting_date = site_today
      and site_now::time >= coalesce(meetings.starts_at, time '00:00')
      and site_now::time < coalesce(meetings.ends_at, time '24:00')
  ) then return 'closed'; end if;

  select members.id into active_member_id
  from members
  where lower(regexp_replace(btrim(members.full_name), '\s+', ' ', 'g')) = normalized_name
    and exists (
      select 1 from memberships
      where memberships.member_id = members.id
        and memberships.expires_on >= site_today
    )
  limit 1;

  if active_member_id is not null then
    if exists (select 1 from attendance_records where attendance_records.meeting_id = selected_meeting_id and attendance_records.member_id = active_member_id) then
      return 'already-checked-in';
    end if;
    insert into attendance_records (meeting_id, member_id, attendee_name)
    values (selected_meeting_id, active_member_id, display_name);
    return 'checked-in';
  end if;

  select guests.id into matched_guest_id
  from guests
  where lower(regexp_replace(btrim(guests.full_name), '\s+', ' ', 'g')) = normalized_name
    and guests.archived_at is null
  limit 1;

  if matched_guest_id is null then
    begin
      insert into guests (full_name) values (display_name) returning id into matched_guest_id;
    exception when unique_violation then
      select guests.id into matched_guest_id
      from guests
      where lower(regexp_replace(btrim(guests.full_name), '\s+', ' ', 'g')) = normalized_name
        and guests.archived_at is null;
    end;
  end if;

  if exists (select 1 from attendance_records where attendance_records.meeting_id = selected_meeting_id and attendance_records.guest_id = matched_guest_id) then
    return 'already-checked-in';
  end if;

  insert into attendance_records (meeting_id, guest_id, attendee_name)
  values (selected_meeting_id, matched_guest_id, display_name);
  return 'checked-in';
exception when unique_violation then
  return 'already-checked-in';
end;
$$;

create or replace function public.promote_active_guest_to_member(
  guest_id_input uuid,
  email_input text,
  notes_input text,
  membership_type_input text,
  starts_on_input date,
  expires_on_input date,
  paid_amount_input numeric,
  added_by_input text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  guest guests%rowtype;
  promoted_member_id uuid;
begin
  if not is_current_officer() then raise exception 'Officer access is required'; end if;
  select * into guest
  from guests as active_guest
  where active_guest.id = guest_id_input and active_guest.archived_at is null
  for update;
  if not found then raise exception 'Active guest was not found'; end if;

  select id into promoted_member_id from members
  where lower(regexp_replace(btrim(full_name), '\s+', ' ', 'g')) =
        lower(regexp_replace(btrim(guest.full_name), '\s+', ' ', 'g'))
  limit 1;

  if promoted_member_id is null then
    insert into members (full_name, email, notes)
    values (guest.full_name, nullif(btrim(email_input), ''), coalesce(nullif(btrim(notes_input), ''), guest.notes))
    returning id into promoted_member_id;
  else
    update members
    set email = coalesce(nullif(btrim(email_input), ''), email),
        notes = coalesce(nullif(btrim(notes_input), ''), notes)
    where id = promoted_member_id;
  end if;

  insert into memberships (member_id, membership_type, starts_on, expires_on, paid_amount, added_by)
  values (promoted_member_id, membership_type_input, starts_on_input, expires_on_input, paid_amount_input, added_by_input);

  delete from attendance_records guest_record
  where guest_record.guest_id = guest.id
    and exists (
      select 1 from attendance_records member_record
      where member_record.meeting_id = guest_record.meeting_id
        and member_record.member_id = promoted_member_id
    );

  update attendance_records
  set member_id = promoted_member_id, guest_id = null
  where guest_id = guest.id;

  update guests set archived_at = now() where id = guest.id;
  return promoted_member_id;
end;
$$;

create or replace function public.archive_active_guests()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare archived_count integer;
begin
  if not is_current_officer() then raise exception 'Officer access is required'; end if;
  update guests set archived_at = now() where archived_at is null;
  get diagnostics archived_count = row_count;
  return archived_count;
end;
$$;

create or replace function public.promote_active_guest_by_name(
  full_name_input text, email_input text, notes_input text, membership_type_input text,
  starts_on_input date, expires_on_input date, paid_amount_input numeric, added_by_input text
)
returns uuid language plpgsql security definer set search_path = public as $$
declare matched_guest_id uuid;
begin
  select id into matched_guest_id from guests
  where lower(regexp_replace(btrim(full_name), '\s+', ' ', 'g')) = lower(regexp_replace(btrim(full_name_input), '\s+', ' ', 'g'))
    and archived_at is null limit 1;
  if matched_guest_id is null then return null; end if;
  return promote_active_guest_to_member(matched_guest_id, email_input, notes_input, membership_type_input, starts_on_input, expires_on_input, paid_amount_input, added_by_input);
end;
$$;

revoke all on function public.record_today_attendance(uuid, text, text) from public;
revoke all on function public.promote_active_guest_to_member(uuid, text, text, text, date, date, numeric, text) from public;
revoke all on function public.archive_active_guests() from public;
revoke all on function public.promote_active_guest_by_name(text, text, text, text, date, date, numeric, text) from public;
grant execute on function public.record_today_attendance(uuid, text, text) to anon, authenticated;
grant execute on function public.promote_active_guest_to_member(uuid, text, text, text, date, date, numeric, text) to authenticated;
grant execute on function public.archive_active_guests() to authenticated;
grant execute on function public.promote_active_guest_by_name(text, text, text, text, date, date, numeric, text) to authenticated;
