create or replace function enforce_officer_president_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  president_count integer;
  future_president_count integer;
begin
  perform pg_advisory_xact_lock(hashtext('officers-president-count'));

  if tg_op = 'UPDATE' then
    if new.email is distinct from old.email then
      raise exception 'Officer email addresses cannot be changed';
    end if;

    if not is_current_president() then
      if new.role is distinct from old.role then
        raise exception 'Only a president can change an officer title';
      end if;

      if new.id is distinct from old.id
        or new.created_at is distinct from old.created_at
        or new.updated_at is distinct from old.updated_at then
        raise exception 'Officers may update only their name and focus';
      end if;
    end if;
  end if;

  select count(*)
  into president_count
  from officers
  where lower(btrim(role)) = 'president';

  future_president_count := president_count;

  if tg_op = 'INSERT' then
    if lower(btrim(new.role)) = 'president' then
      future_president_count := future_president_count + 1;
    end if;
  elsif tg_op = 'UPDATE' then
    if lower(btrim(old.role)) = 'president' then
      future_president_count := future_president_count - 1;
    end if;
    if lower(btrim(new.role)) = 'president' then
      future_president_count := future_president_count + 1;
    end if;
  elsif tg_op = 'DELETE' and lower(btrim(old.role)) = 'president' then
    future_president_count := future_president_count - 1;
  end if;

  if future_president_count < 1 then
    raise exception 'At least one president must remain';
  end if;

  if future_president_count > 2 then
    raise exception 'No more than two presidents are allowed';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;
