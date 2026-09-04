alter table meetings
  add column if not exists attendance_count integer not null default 0
  check (attendance_count >= 0);

alter table attendance_records
  add column if not exists counts_toward_event_total boolean not null default false;

-- Existing records intentionally remain excluded from the new saved totals.
alter table attendance_records
  alter column counts_toward_event_total set default true;

create or replace function public.attendance_records_adjust_meeting_total()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' and new.counts_toward_event_total then
    update meetings
    set attendance_count = attendance_count + 1
    where id = new.meeting_id;
  elsif tg_op = 'DELETE' and old.counts_toward_event_total then
    update meetings
    set attendance_count = greatest(attendance_count - 1, 0)
    where id = old.meeting_id;
  end if;

  return null;
end;
$$;

drop trigger if exists attendance_records_adjust_meeting_total on attendance_records;

create trigger attendance_records_adjust_meeting_total
after insert or delete on attendance_records
for each row
execute function public.attendance_records_adjust_meeting_total();

create or replace function public.get_today_attendance_activity()
returns table (
  status text,
  meeting_id uuid,
  activity text,
  meeting_date date,
  starts_at time without time zone,
  location text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  site_now timestamp without time zone := now() at time zone 'America/New_York';
  site_today date := site_now::date;
begin
  return query
  select
    'open'::text,
    meetings.id,
    meetings.activity,
    meetings.meeting_date,
    meetings.starts_at,
    meetings.location
  from meetings
  where meetings.meeting_date = site_today
    and site_now::time >= coalesce(meetings.starts_at, time '00:00')
    and site_now::time < coalesce(meetings.ends_at, time '24:00')
  order by meetings.starts_at nulls first, meetings.activity;
end;
$$;

drop function if exists public.record_today_attendance(text, text);

create function public.record_today_attendance(
  meeting_id_input uuid,
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
  matched_member_count integer;
  matched_member_id uuid;
  normalized_name text;
  site_now timestamp without time zone := now() at time zone 'America/New_York';
  site_today date := site_now::date;
begin
  if btrim(coalesce(honeypot, '')) <> '' then
    return 'invalid';
  end if;

  normalized_name := lower(regexp_replace(display_name, '\s+', ' ', 'g'));

  if normalized_name = '' or char_length(display_name) > 90 then
    return 'invalid';
  end if;

  if not exists (
    select 1
    from meetings
    where meetings.id = meeting_id_input
      and meetings.meeting_date = site_today
      and site_now::time >= coalesce(meetings.starts_at, time '00:00')
      and (site_now::time < coalesce(meetings.ends_at, time '24:00'))
  ) then
    return 'closed';
  end if;

  select count(*)
  into matched_member_count
  from members
  where lower(regexp_replace(btrim(members.full_name), '\s+', ' ', 'g')) = normalized_name;

  if matched_member_count = 1 then
    select members.id
    into matched_member_id
    from members
    where lower(regexp_replace(btrim(members.full_name), '\s+', ' ', 'g')) = normalized_name
    limit 1;
  else
    matched_member_id := null;
  end if;

  if matched_member_id is not null then
    if exists (
      select 1 from attendance_records
      where attendance_records.meeting_id = meeting_id_input
        and attendance_records.member_id = matched_member_id
    ) then
      return 'already-checked-in';
    end if;

    insert into attendance_records (meeting_id, member_id, attendee_name)
    values (meeting_id_input, matched_member_id, display_name);
  else
    if exists (
      select 1 from attendance_records
      where attendance_records.meeting_id = meeting_id_input
        and attendance_records.member_id is null
        and lower(regexp_replace(btrim(attendance_records.attendee_name), '\s+', ' ', 'g')) = normalized_name
    ) then
      return 'already-checked-in';
    end if;

    insert into attendance_records (meeting_id, member_id, attendee_name)
    values (meeting_id_input, null, display_name);
  end if;

  return 'checked-in';
exception
  when unique_violation then
    return 'already-checked-in';
end;
$$;

revoke all on function public.get_today_attendance_activity() from public;
revoke all on function public.record_today_attendance(uuid, text, text) from public;

grant execute on function public.get_today_attendance_activity() to anon, authenticated;
grant execute on function public.record_today_attendance(uuid, text, text) to anon, authenticated;
