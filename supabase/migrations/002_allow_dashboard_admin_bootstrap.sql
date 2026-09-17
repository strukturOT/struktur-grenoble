-- Allow the Supabase database owner to bootstrap the first administrator from
-- the dashboard/SQL editor, while keeping role changes blocked for browser users.

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
    and session_user not in ('postgres', 'supabase_admin')
    and not public.is_admin()
  then
    raise exception 'Only an administrator can change a user role';
  end if;
  return new;
end;
$$;
