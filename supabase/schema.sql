create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dramas (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  poster_url text default '',
  genres text[] not null default '{}',
  status text not null default 'Want to Watch',
  episodes integer not null default 0,
  priority text default 'Medium',
  notes text default '',
  rating numeric,
  date_started date,
  date_completed date,
  favorite_character text default '',
  watch_mood text default '',
  would_recommend text default '',
  review text default '',
  favorite_quote text default '',
  emotional_impact text default '',
  rewatchable text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invite_codes (
  code text primary key,
  label text default '',
  max_uses integer not null default 1,
  used_count integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.dramas enable row level security;
alter table public.invite_codes enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.dramas to authenticated;
grant select, insert, update, delete on public.invite_codes to service_role;

insert into storage.buckets (id, name, public)
values ('drama-posters', 'drama-posters', false)
on conflict (id) do nothing;

drop policy if exists "profiles are owner readable" on public.profiles;
create policy "profiles are owner readable"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "profiles are owner writable" on public.profiles;
create policy "profiles are owner writable"
on public.profiles for all
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "dramas are owner readable" on public.dramas;
create policy "dramas are owner readable"
on public.dramas for select
using (auth.uid() = user_id);

drop policy if exists "dramas are owner insertable" on public.dramas;
create policy "dramas are owner insertable"
on public.dramas for insert
with check (auth.uid() = user_id);

drop policy if exists "dramas are owner updatable" on public.dramas;
create policy "dramas are owner updatable"
on public.dramas for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "dramas are owner deletable" on public.dramas;
create policy "dramas are owner deletable"
on public.dramas for delete
using (auth.uid() = user_id);

drop policy if exists "invite codes are server managed" on public.invite_codes;
create policy "invite codes are server managed"
on public.invite_codes for all
using (false)
with check (false);

create or replace function public.consume_invite_code(invite_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_code text := upper(trim(invite_code));
  invite public.invite_codes%rowtype;
begin
  select * into invite
  from public.invite_codes
  where code = normalized_code
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'That invite code does not exist.');
  end if;

  if invite.active is false then
    return jsonb_build_object('ok', false, 'error', 'That invite code is not active anymore.');
  end if;

  if invite.used_count >= invite.max_uses then
    return jsonb_build_object('ok', false, 'error', 'That invite code has already been fully used.');
  end if;

  update public.invite_codes
  set used_count = used_count + 1,
      updated_at = now()
  where code = normalized_code;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.consume_invite_code(text) to authenticated;
grant execute on function public.consume_invite_code(text) to service_role;

drop policy if exists "users can read own poster files" on storage.objects;
create policy "users can read own poster files"
on storage.objects for select
to authenticated
using (bucket_id = 'drama-posters' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "users can upload own poster files" on storage.objects;
create policy "users can upload own poster files"
on storage.objects for insert
to authenticated
with check (bucket_id = 'drama-posters' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "users can update own poster files" on storage.objects;
create policy "users can update own poster files"
on storage.objects for update
to authenticated
using (bucket_id = 'drama-posters' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'drama-posters' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "users can delete own poster files" on storage.objects;
create policy "users can delete own poster files"
on storage.objects for delete
to authenticated
using (bucket_id = 'drama-posters' and (storage.foldername(name))[1] = auth.uid()::text);
