create unique index if not exists attendance_records_unique_meeting_member
on attendance_records (meeting_id, member_id)
where member_id is not null;

create unique index if not exists attendance_records_unique_meeting_attendee_name
on attendance_records (
  meeting_id,
  lower(regexp_replace(btrim(attendee_name), '\s+', ' ', 'g'))
)
where member_id is null and attendee_name is not null;

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
  activity_count integer;
  site_today date := (now() at time zone 'America/Los_Angeles')::date;
begin
  select count(*)
  into activity_count
  from meetings
  where meetings.meeting_date = site_today;

  if activity_count = 0 then
    return query
    select
      'closed'::text,
      null::uuid,
      null::text,
      null::date,
      null::time without time zone,
      null::text;
    return;
  end if;

  if activity_count > 1 then
    return query
    select
      'ambiguous'::text,
      null::uuid,
      null::text,
      null::date,
      null::time without time zone,
      null::text;
    return;
  end if;

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
  limit 1;
end;
$$;

create or replace function public.record_today_attendance(
  attendee_name text,
  honeypot text default ''
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  activity_count integer;
  display_name text := btrim(coalesce(attendee_name, ''));
  matched_member_count integer;
  matched_member_id uuid;
  normalized_name text;
  site_today date := (now() at time zone 'America/Los_Angeles')::date;
  today_meeting_id uuid;
begin
  if btrim(coalesce(honeypot, '')) <> '' then
    return 'invalid';
  end if;

  normalized_name := lower(regexp_replace(display_name, '\s+', ' ', 'g'));

  if normalized_name = '' or char_length(display_name) > 90 then
    return 'invalid';
  end if;

  select count(*)
  into activity_count
  from meetings
  where meetings.meeting_date = site_today;

  if activity_count <> 1 then
    return 'closed';
  end if;

  select meetings.id
  into today_meeting_id
  from meetings
  where meetings.meeting_date = site_today
  limit 1;

  select count(*)
  into matched_member_count
  from members
  where lower(regexp_replace(btrim(members.full_name), '\s+', ' ', 'g')) =
    normalized_name;

  if matched_member_count = 1 then
    select members.id
    into matched_member_id
    from members
    where lower(regexp_replace(btrim(members.full_name), '\s+', ' ', 'g')) =
      normalized_name
    limit 1;
  else
    matched_member_id := null;
  end if;

  if matched_member_id is not null then
    if exists (
      select 1
      from attendance_records
      where attendance_records.meeting_id = today_meeting_id
        and attendance_records.member_id = matched_member_id
    ) then
      return 'already-checked-in';
    end if;

    insert into attendance_records (meeting_id, member_id, attendee_name)
    values (today_meeting_id, matched_member_id, display_name);
  else
    if exists (
      select 1
      from attendance_records
      where attendance_records.meeting_id = today_meeting_id
        and attendance_records.member_id is null
        and lower(
          regexp_replace(btrim(attendance_records.attendee_name), '\s+', ' ', 'g')
        ) = normalized_name
    ) then
      return 'already-checked-in';
    end if;

    insert into attendance_records (meeting_id, member_id, attendee_name)
    values (today_meeting_id, null, display_name);
  end if;

  return 'checked-in';
exception
  when unique_violation then
    return 'already-checked-in';
end;
$$;

revoke all on function public.get_today_attendance_activity() from public;
revoke all on function public.record_today_attendance(text, text) from public;

grant execute on function public.get_today_attendance_activity() to anon, authenticated;
grant execute on function public.record_today_attendance(text, text) to anon, authenticated;
