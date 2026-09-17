-- Operational back office: customer directory, inbox and safe administrator control.

alter table public.profiles add column if not exists email text;

update public.profiles as profile
set email = users.email
from auth.users as users
where users.id = profile.id
  and profile.email is distinct from users.email;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    lower(new.email),
    'customer'
  );
  return new;
end;
$$;

create type public.contact_message_status as enum ('new', 'read', 'closed');

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  full_name text not null check (char_length(trim(full_name)) > 0),
  email text not null check (char_length(trim(email)) > 3),
  message text not null check (char_length(trim(message)) between 2 and 5000),
  status public.contact_message_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index contact_messages_status_created_idx on public.contact_messages(status, created_at desc);
create trigger contact_messages_set_updated_at before update on public.contact_messages for each row execute function public.set_updated_at();

alter table public.contact_messages enable row level security;
revoke all on table public.contact_messages from anon, authenticated;
grant insert on public.contact_messages to anon, authenticated;
grant select, update, delete on public.contact_messages to authenticated;

create policy "visitors can send a contact message" on public.contact_messages
  for insert to anon, authenticated
  with check (user_id is null or user_id = (select auth.uid()));

create policy "admins manage contact messages" on public.contact_messages
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- An admin can manage roles in the dashboard, but the final administrator
-- cannot demote themselves or leave the shop without an administrator.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if session_user not in ('postgres', 'supabase_admin') and not public.is_admin() then
      raise exception 'Only an administrator can change a user role';
    end if;

    if old.role = 'admin'
      and new.role <> 'admin'
      and (select count(*) from public.profiles where role = 'admin') <= 1 then
      raise exception 'At least one administrator must remain assigned';
    end if;
  end if;
  return new;
end;
$$;
