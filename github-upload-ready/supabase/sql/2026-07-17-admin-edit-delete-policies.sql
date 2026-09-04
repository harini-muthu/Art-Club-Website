drop policy if exists "Officers can update members" on members;
drop policy if exists "Officers can delete members" on members;
drop policy if exists "Officers can update memberships" on memberships;
drop policy if exists "Officers can delete memberships" on memberships;
drop policy if exists "Officers can update meetings" on meetings;
drop policy if exists "Officers can delete meetings" on meetings;

create policy "Officers can update members"
on members
for update
to authenticated
using (
  exists (
    select 1
    from officer_profiles
    where officer_profiles.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from officer_profiles
    where officer_profiles.auth_user_id = auth.uid()
  )
);

create policy "Officers can delete members"
on members
for delete
to authenticated
using (
  exists (
    select 1
    from officer_profiles
    where officer_profiles.auth_user_id = auth.uid()
  )
);

create policy "Officers can update memberships"
on memberships
for update
to authenticated
using (
  exists (
    select 1
    from officer_profiles
    where officer_profiles.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from officer_profiles
    where officer_profiles.auth_user_id = auth.uid()
  )
);

create policy "Officers can delete memberships"
on memberships
for delete
to authenticated
using (
  exists (
    select 1
    from officer_profiles
    where officer_profiles.auth_user_id = auth.uid()
  )
);

create policy "Officers can update meetings"
on meetings
for update
to authenticated
using (
  exists (
    select 1
    from officer_profiles
    where officer_profiles.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from officer_profiles
    where officer_profiles.auth_user_id = auth.uid()
  )
);

create policy "Officers can delete meetings"
on meetings
for delete
to authenticated
using (
  exists (
    select 1
    from officer_profiles
    where officer_profiles.auth_user_id = auth.uid()
  )
);
