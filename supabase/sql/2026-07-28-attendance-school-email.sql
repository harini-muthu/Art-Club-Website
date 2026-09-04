alter table attendance_records
  add column if not exists school_email text;

alter table guests
  add column if not exists school_email text;

drop index if exists guests_active_normalized_name_unique;
create unique index if not exists guests_active_normalized_school_email_unique
on guests (lower(btrim(school_email)))
where archived_at is null and nullif(btrim(school_email), '') is not null;

drop index if exists attendance_records_unique_meeting_attendee_name;
create unique index if not exists attendance_records_unique_meeting_school_email
on attendance_records (meeting_id, lower(btrim(school_email)))
where nullif(btrim(school_email), '') is not null;

do $$
begin
  if exists (
    select 1
    from members
    where nullif(btrim(email), '') is not null
    group by lower(btrim(email))
    having count(*) > 1
  ) then
    raise exception 'Cannot use school-email attendance: duplicate member emails must be resolved first';
  end if;
end;
$$;

create unique index if not exists members_normalized_email_unique
on members (lower(btrim(email)))
where nullif(btrim(email), '') is not null;

drop function if exists public.record_today_attendance(uuid, text, text);
drop function if exists public.record_today_attendance(uuid, text, text, text);

create function public.record_today_attendance(
  meeting_id uuid,
  attendee_name text,
  school_email text,
  honeypot text default ''
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_meeting_id uuid := meeting_id;
  display_name text := btrim(coalesce(attendee_name, ''));
  normalized_name text;
  normalized_school_email text;
  active_member_id uuid;
  matched_guest_id uuid;
  canonical_name text;
  site_now timestamp without time zone := now() at time zone 'America/New_York';
  site_today date := site_now::date;
begin
  if btrim(coalesce(honeypot, '')) <> '' then return 'invalid'; end if;

  normalized_name := lower(regexp_replace(display_name, '\s+', ' ', 'g'));
  normalized_school_email := lower(btrim(coalesce(school_email, '')));
  if normalized_name = '' or char_length(display_name) > 90 or normalized_school_email = '' then return 'invalid'; end if;

  if not exists (
    select 1 from meetings
    where meetings.id = selected_meeting_id
      and meetings.meeting_date = site_today
      and site_now::time >= coalesce(meetings.starts_at, time '00:00')
      and site_now::time < coalesce(meetings.ends_at, time '24:00')
  ) then return 'closed'; end if;

  select members.id, members.full_name into active_member_id, canonical_name
  from members
  where lower(btrim(members.email)) = normalized_school_email
    and exists (
      select 1 from memberships
      where memberships.member_id = members.id
        and memberships.expires_on >= site_today
    )
  limit 1;

  if active_member_id is not null then
    if exists (
      select 1 from attendance_records
      where attendance_records.meeting_id = selected_meeting_id
        and lower(btrim(attendance_records.school_email)) = normalized_school_email
    ) then return 'already-checked-in'; end if;

    insert into attendance_records (meeting_id, member_id, attendee_name, school_email)
    values (selected_meeting_id, active_member_id, canonical_name, normalized_school_email);
    return 'checked-in';
  end if;

  select guests.id, guests.full_name into matched_guest_id, canonical_name
  from guests
  where lower(btrim(guests.school_email)) = normalized_school_email
    and guests.archived_at is null
  limit 1;

  if matched_guest_id is null then
    begin
      insert into guests (full_name, school_email)
      values (display_name, normalized_school_email)
      returning id, full_name into matched_guest_id, canonical_name;
    exception when unique_violation then
      select guests.id, guests.full_name into matched_guest_id, canonical_name
      from guests
      where lower(btrim(guests.school_email)) = normalized_school_email
        and guests.archived_at is null;
    end;
  end if;

  if exists (
    select 1 from attendance_records
    where attendance_records.meeting_id = selected_meeting_id
      and lower(btrim(attendance_records.school_email)) = normalized_school_email
  ) then return 'already-checked-in'; end if;

  insert into attendance_records (meeting_id, guest_id, attendee_name, school_email)
  values (selected_meeting_id, matched_guest_id, canonical_name, normalized_school_email);
  return 'checked-in';
exception when unique_violation then
  return 'already-checked-in';
end;
$$;

drop function if exists public.promote_active_guest_by_name(text, text, text, text, date, date, numeric, text);

create or replace function public.promote_active_guest_by_email(
  email_input text, notes_input text, membership_type_input text,
  starts_on_input date, expires_on_input date, paid_amount_input numeric, added_by_input text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare matched_guest_id uuid;
begin
  if btrim(coalesce(email_input, '')) = '' then return null; end if;
  select id into matched_guest_id from guests
  where lower(btrim(school_email)) = lower(btrim(email_input))
    and archived_at is null
  limit 1;
  if matched_guest_id is null then return null; end if;
  return promote_active_guest_to_member(matched_guest_id, email_input, notes_input, membership_type_input, starts_on_input, expires_on_input, paid_amount_input, added_by_input);
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
  normalized_school_email text := lower(btrim(email_input));
begin
  if not is_current_officer() then raise exception 'Officer access is required'; end if;
  select * into guest from guests as active_guest
  where active_guest.id = guest_id_input and active_guest.archived_at is null
  for update;
  if not found then raise exception 'Active guest was not found'; end if;

  select id into promoted_member_id from members
  where lower(btrim(email)) = normalized_school_email
  limit 1;

  if promoted_member_id is null then
    insert into members (full_name, email, notes)
    values (guest.full_name, nullif(btrim(email_input), ''), coalesce(nullif(btrim(notes_input), ''), guest.notes))
    returning id into promoted_member_id;
  else
    update members set email = coalesce(nullif(btrim(email_input), ''), email),
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

  update attendance_records set member_id = promoted_member_id, guest_id = null
  where guest_id = guest.id;
  update guests set archived_at = now() where id = guest.id;
  return promoted_member_id;
end;
$$;

revoke all on function public.record_today_attendance(uuid, text, text, text) from public;
revoke all on function public.promote_active_guest_by_email(text, text, text, date, date, numeric, text) from public;
grant execute on function public.record_today_attendance(uuid, text, text, text) to anon, authenticated;
grant execute on function public.promote_active_guest_by_email(text, text, text, date, date, numeric, text) to authenticated;
