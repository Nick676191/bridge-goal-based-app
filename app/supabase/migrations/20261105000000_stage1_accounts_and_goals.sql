-- PYN database, stage 1: accounts, profiles, goal posts, follows and media.
--
-- How to run it: in the Supabase dashboard, open SQL Editor, click "New query",
-- paste this whole file, and click Run. Run it once. (Running it a second time
-- stops with "already exists" errors and changes nothing.)
--
-- Every table here has row-level security (RLS) turned on. RLS is the set of
-- rules the database itself enforces about who can read and change each row,
-- so even if someone pulled the key out of the app, they could only do what
-- these rules allow. The rules, from the plan doc:
--   - Anyone signed in can read everything (PYN has no private accounts).
--   - You can only create, edit or delete your own things.
--
-- If you know Python: a table is like a list of dataclass instances with a
-- fixed shape, and each "policy" is a function that returns True or False for
-- "may this user do this to this row?".


-- ─── Profiles ───────────────────────────────────────────────────────────────
-- One row per account. Supabase keeps the email and password in its own
-- auth.users table; this table holds what other people see.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  -- lowercase letters, numbers, dots and underscores, 3 to 24 characters
  username text not null unique check (username ~ '^[a-z0-9._]{3,24}$'),
  name text not null check (char_length(name) between 1 and 50),
  bio text not null default '' check (char_length(bio) <= 160),
  avatar_url text,
  interests text[] not null default '{}', -- categories picked at sign-up
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are readable by signed-in users"
  on public.profiles for select to authenticated
  using (true);

create policy "You can edit your own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- New accounts get their profile row automatically. The app sends username,
-- name, bio and interests along with the sign-up, and this copies them over.
-- "security definer" lets it write the row before the new user has signed in.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username, name, bio, interests)
  values (
    new.id,
    lower(new.raw_user_meta_data ->> 'username'),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), new.raw_user_meta_data ->> 'username'),
    coalesce(new.raw_user_meta_data ->> 'bio', ''),
    coalesce(
      array(select jsonb_array_elements_text(coalesce(new.raw_user_meta_data -> 'interests', '[]'::jsonb))),
      '{}'
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Lets the sign-up screen check "is this username free?" before the account
-- exists. It only answers yes or no; it reveals nothing else.
create function public.username_available(candidate text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (select 1 from public.profiles where username = lower(candidate));
$$;

grant execute on function public.username_available(text) to anon, authenticated;


-- ─── Goals ──────────────────────────────────────────────────────────────────

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  subject text not null check (char_length(subject) between 1 and 40),
  body text not null default '' check (char_length(body) <= 500),
  -- 1 to 3 categories; the first is the main one
  categories text[] not null check (cardinality(categories) between 1 and 3),
  status text not null default 'active' check (status in ('active', 'achieved', 'dropped')),
  -- photos and video: a list like [{"kind": "photo", "uri": "https://...", "width": 1200, "height": 900}]
  media jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index goals_author_idx on public.goals (author_id);
create index goals_created_idx on public.goals (created_at desc);

alter table public.goals enable row level security;

create policy "Goals are readable by signed-in users"
  on public.goals for select to authenticated
  using (true);

create policy "You can post goals as yourself"
  on public.goals for insert to authenticated
  with check (author_id = (select auth.uid()));

create policy "You can edit your own goals"
  on public.goals for update to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));

create policy "You can delete your own goals"
  on public.goals for delete to authenticated
  using (author_id = (select auth.uid()));


-- ─── Follows ────────────────────────────────────────────────────────────────

create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  followee_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id) -- you can't follow yourself
);

create index follows_followee_idx on public.follows (followee_id);

alter table public.follows enable row level security;

create policy "Follows are readable by signed-in users"
  on public.follows for select to authenticated
  using (true);

create policy "You can follow people"
  on public.follows for insert to authenticated
  with check (follower_id = (select auth.uid()));

create policy "You can unfollow people"
  on public.follows for delete to authenticated
  using (follower_id = (select auth.uid()));


-- ─── Photos and videos ──────────────────────────────────────────────────────
-- A storage "bucket" is a folder in Supabase for files. Everything on PYN is
-- public, so files can be viewed by link. Each person uploads only into a
-- folder named after their own account id. 50 MB per file covers a
-- 60-second phone video.

insert into storage.buckets (id, name, public, file_size_limit)
values ('media', 'media', true, 52428800)
on conflict (id) do nothing;

create policy "Upload media into your own folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Replace media in your own folder"
  on storage.objects for update to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Delete media in your own folder"
  on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = (select auth.uid())::text);
