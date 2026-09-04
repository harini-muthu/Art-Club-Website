do $$
declare
  harini_officer_count integer;
  other_president_count integer;
begin
  select count(*)
  into harini_officer_count
  from officers
  where name = 'Harini Muthu';

  if harini_officer_count <> 1 then
    raise exception 'Expected exactly one officer named Harini Muthu; found %', harini_officer_count;
  end if;

  select count(*)
  into other_president_count
  from officers
  where lower(btrim(role)) = 'president'
    and name <> 'Harini Muthu';

  if other_president_count <> 0 then
    raise exception 'Cannot initialize Harini Muthu as president while another president exists';
  end if;

  update officers
  set role = 'President'
  where name = 'Harini Muthu';
end;
$$;

create or replace function is_current_president()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from officers
    where officers.email = lower(coalesce(auth.jwt() ->> 'email', ''))
      and lower(btrim(officers.role)) = 'president'
  );
$$;

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

  if tg_op = 'UPDATE'
    and not is_current_president() then
    if new.role is distinct from old.role then
      raise exception 'Only a president can change an officer title';
    end if;

    if new.id is distinct from old.id
      or new.created_at is distinct from old.created_at
      or new.updated_at is distinct from old.updated_at then
      raise exception 'Officers may update only their name, email, and focus';
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

drop trigger if exists officers_enforce_president_rules on officers;

create trigger officers_enforce_president_rules
before insert or update or delete on officers
for each row
execute function enforce_officer_president_rules();

drop policy if exists "Officers can insert officers" on officers;
drop policy if exists "Officers can update officers" on officers;
drop policy if exists "Officers can delete officers" on officers;
drop policy if exists "Presidents can insert officers" on officers;
drop policy if exists "Presidents can update officers" on officers;
drop policy if exists "Presidents can delete officers" on officers;
drop policy if exists "Officers can update their own profile" on officers;

create policy "Presidents can insert officers"
on officers
for insert
to authenticated
with check (is_current_president());

create policy "Presidents can update officers"
on officers
for update
to authenticated
using (is_current_president())
with check (is_current_officer());

create policy "Officers can update their own profile"
on officers
for update
to authenticated
using (email = lower(coalesce(auth.jwt() ->> 'email', '')))
with check (true);

create policy "Presidents can delete officers"
on officers
for delete
to authenticated
using (is_current_president());
