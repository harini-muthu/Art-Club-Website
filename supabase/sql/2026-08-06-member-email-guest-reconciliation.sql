create or replace function public.reconcile_member_email_with_active_guest()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_member_email text := lower(btrim(coalesce(new.email, '')));
  matched_guest_id uuid;
begin
  if normalized_member_email = '' then
    return new;
  end if;

  select active_guest.id
  into matched_guest_id
  from guests as active_guest
  where lower(btrim(active_guest.school_email)) = normalized_member_email
    and active_guest.archived_at is null
  for update;

  if matched_guest_id is null then
    return new;
  end if;

  delete from attendance_records as guest_record
  where guest_record.guest_id = matched_guest_id
    and exists (
      select 1
      from attendance_records as member_record
      where member_record.meeting_id = guest_record.meeting_id
        and member_record.member_id = new.id
    );

  update attendance_records
  set member_id = new.id, guest_id = null
  where guest_id = matched_guest_id;

  update guests
  set archived_at = now()
  where id = matched_guest_id;

  return new;
end;
$$;

drop trigger if exists members_reconcile_email_with_active_guest on members;

create trigger members_reconcile_email_with_active_guest
after update of email on members
for each row
when (old.email is distinct from new.email)
execute function public.reconcile_member_email_with_active_guest();
