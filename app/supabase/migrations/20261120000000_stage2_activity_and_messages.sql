-- PYN database, stage 2: commits, encouragements, tips, updates, replies,
-- stars, notifications and direct messages.
--
-- How to run it: in the Supabase dashboard, open SQL Editor, click "New
-- query", paste this whole file, and click Run. Run it once, after the two
-- earlier files in this folder.
--
-- Same rules as stage 1, enforced by the database (row-level security):
--   - Anyone signed in can read goal activity (PYN is public).
--   - You can only add or remove your own things.
--   - Only a goal's author and the people committed to it can post updates.
--   - Notifications and messages are private: you only see your own.
-- Notifications are created by the database itself (the "triggers" near the
-- bottom), so the app can't fake one and nobody can send them to others.


-- ─── Commits and encouragements on goals ────────────────────────────────────

create table public.commitments (
  goal_id uuid not null references public.goals (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (goal_id, user_id)
);
create index commitments_user_idx on public.commitments (user_id);

create table public.encouragements (
  goal_id uuid not null references public.goals (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (goal_id, user_id)
);

alter table public.commitments enable row level security;
alter table public.encouragements enable row level security;

create policy "Commitments are readable by signed-in users"
  on public.commitments for select to authenticated using (true);
-- You commit as yourself, and not to your own goal (it's already yours).
create policy "You can commit to other people's goals"
  on public.commitments for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and not exists (select 1 from public.goals g where g.id = goal_id and g.author_id = (select auth.uid()))
  );
create policy "You can take back your commitment"
  on public.commitments for delete to authenticated using (user_id = (select auth.uid()));

create policy "Encouragements are readable by signed-in users"
  on public.encouragements for select to authenticated using (true);
create policy "You can encourage goals"
  on public.encouragements for insert to authenticated with check (user_id = (select auth.uid()));
create policy "You can take back your encouragement"
  on public.encouragements for delete to authenticated using (user_id = (select auth.uid()));


-- ─── Tips and updates (the two threads under every goal) ────────────────────

create table public.tips (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  text text not null check (char_length(text) between 1 and 300),
  created_at timestamptz not null default now()
);
create index tips_goal_idx on public.tips (goal_id);

create table public.updates (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  text text not null check (char_length(text) between 1 and 300),
  setback boolean not null default false,
  created_at timestamptz not null default now()
);
create index updates_goal_idx on public.updates (goal_id);

alter table public.tips enable row level security;
alter table public.updates enable row level security;

create policy "Tips are readable by signed-in users"
  on public.tips for select to authenticated using (true);
create policy "Anyone signed in can leave a tip"
  on public.tips for insert to authenticated with check (author_id = (select auth.uid()));
create policy "You can delete your own tips"
  on public.tips for delete to authenticated using (author_id = (select auth.uid()));

create policy "Updates are readable by signed-in users"
  on public.updates for select to authenticated using (true);
-- Only the goal's author or someone committed to it.
create policy "The author and committed people can post updates"
  on public.updates for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and (
      exists (select 1 from public.goals g where g.id = goal_id and g.author_id = (select auth.uid()))
      or exists (select 1 from public.commitments c where c.goal_id = updates.goal_id and c.user_id = (select auth.uid()))
    )
  );
create policy "You can delete your own updates"
  on public.updates for delete to authenticated using (author_id = (select auth.uid()));


-- ─── Replies under a tip or an update (one level deep) ──────────────────────
-- Exactly one of tip_id or update_id is set: the thing being replied to.

create table public.replies (
  id uuid primary key default gen_random_uuid(),
  tip_id uuid references public.tips (id) on delete cascade,
  update_id uuid references public.updates (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  text text not null check (char_length(text) between 1 and 300),
  created_at timestamptz not null default now(),
  check ((tip_id is null) <> (update_id is null))
);
create index replies_tip_idx on public.replies (tip_id);
create index replies_update_idx on public.replies (update_id);

alter table public.replies enable row level security;

create policy "Replies are readable by signed-in users"
  on public.replies for select to authenticated using (true);
create policy "Anyone signed in can reply"
  on public.replies for insert to authenticated with check (author_id = (select auth.uid()));
create policy "You can delete your own replies"
  on public.replies for delete to authenticated using (author_id = (select auth.uid()));


-- ─── Stars on tips, updates and replies ─────────────────────────────────────

create table public.stars (
  item_kind text not null check (item_kind in ('tip', 'update', 'reply')),
  item_id uuid not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (item_kind, item_id, user_id)
);

alter table public.stars enable row level security;

create policy "Stars are readable by signed-in users"
  on public.stars for select to authenticated using (true);
create policy "You can star things"
  on public.stars for insert to authenticated with check (user_id = (select auth.uid()));
create policy "You can take back your star"
  on public.stars for delete to authenticated using (user_id = (select auth.uid()));


-- ─── Notifications (the Activity tab) ───────────────────────────────────────

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('encourage', 'commit', 'tip', 'update', 'reply', 'follow', 'achieved', 'reminder')),
  goal_id uuid references public.goals (id) on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_recipient_idx on public.notifications (recipient_id, created_at desc);

alter table public.notifications enable row level security;

create policy "You see only your own notifications"
  on public.notifications for select to authenticated using (recipient_id = (select auth.uid()));
-- The app can only mark them read (see the grants at the bottom).
create policy "You can mark your notifications read"
  on public.notifications for update to authenticated
  using (recipient_id = (select auth.uid())) with check (recipient_id = (select auth.uid()));


-- ─── Direct messages ────────────────────────────────────────────────────────
-- Plain text, a shared goal, or both.

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  text text check (char_length(text) between 1 and 1000),
  goal_id uuid references public.goals (id) on delete set null,
  read boolean not null default false,
  created_at timestamptz not null default now(),
  check (sender_id <> recipient_id),
  check (text is not null or goal_id is not null)
);
create index messages_recipient_idx on public.messages (recipient_id, created_at desc);
create index messages_sender_idx on public.messages (sender_id, created_at desc);

alter table public.messages enable row level security;

create policy "You see messages you sent or received"
  on public.messages for select to authenticated
  using (sender_id = (select auth.uid()) or recipient_id = (select auth.uid()));
create policy "You can send messages as yourself"
  on public.messages for insert to authenticated with check (sender_id = (select auth.uid()));
-- The recipient marks them read when they open the conversation.
create policy "You can mark messages to you as read"
  on public.messages for update to authenticated
  using (recipient_id = (select auth.uid())) with check (recipient_id = (select auth.uid()));


-- ─── Automatic notifications ────────────────────────────────────────────────
-- Each of these runs inside the database when something happens and adds a
-- row to the recipient's Activity tab. Nobody is notified about their own
-- actions.

create function public.notify(recipient uuid, actor uuid, what text, goal uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notifications (recipient_id, actor_id, kind, goal_id)
  select recipient, actor, what, goal
  where recipient is not null and recipient <> actor;
$$;
revoke execute on function public.notify(uuid, uuid, text, uuid) from public, anon, authenticated;

-- Someone encouraged or committed to your goal, or left a tip on it.
create function public.notify_goal_author()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  author uuid;
  actor uuid;
  what text := tg_argv[0];
begin
  select g.author_id into author from public.goals g where g.id = new.goal_id;
  -- Commits and encouragements store the person as user_id; tips and updates as author_id.
  actor := coalesce((to_jsonb(new) ->> 'user_id')::uuid, (to_jsonb(new) ->> 'author_id')::uuid);
  perform public.notify(author, actor, what, new.goal_id);
  return new;
end;
$$;

create trigger notify_on_encourage after insert on public.encouragements
  for each row execute function public.notify_goal_author('encourage');
create trigger notify_on_commit after insert on public.commitments
  for each row execute function public.notify_goal_author('commit');
create trigger notify_on_tip after insert on public.tips
  for each row execute function public.notify_goal_author('tip');
-- Someone committed to your goal posted an update on it.
create trigger notify_on_update after insert on public.updates
  for each row execute function public.notify_goal_author('update');

-- Someone replied to your tip or update.
create function public.notify_on_reply()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  parent_author uuid;
  goal uuid;
begin
  if new.tip_id is not null then
    select t.author_id, t.goal_id into parent_author, goal from public.tips t where t.id = new.tip_id;
  else
    select u.author_id, u.goal_id into parent_author, goal from public.updates u where u.id = new.update_id;
  end if;
  perform public.notify(parent_author, new.author_id, 'reply', goal);
  return new;
end;
$$;

create trigger notify_on_reply after insert on public.replies
  for each row execute function public.notify_on_reply();

-- Someone followed you.
create function public.notify_on_follow()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.notify(new.followee_id, new.follower_id, 'follow', null);
  return new;
end;
$$;

create trigger notify_on_follow after insert on public.follows
  for each row execute function public.notify_on_follow();

-- A goal you committed to was marked achieved: everyone committed hears.
create function public.notify_on_achieved()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'achieved' and old.status <> 'achieved' then
    insert into public.notifications (recipient_id, actor_id, kind, goal_id)
    select c.user_id, new.author_id, 'achieved', new.id
    from public.commitments c
    where c.goal_id = new.id and c.user_id <> new.author_id;
  end if;
  return new;
end;
$$;

create trigger notify_on_achieved after update of status on public.goals
  for each row execute function public.notify_on_achieved();


-- ─── Let the app reach the new tables ───────────────────────────────────────
-- (Newer Supabase projects need these; see the 20261106 file.)

grant select, insert, delete on public.commitments to authenticated;
grant select, insert, delete on public.encouragements to authenticated;
grant select, insert, delete on public.tips to authenticated;
grant select, insert, delete on public.updates to authenticated;
grant select, insert, delete on public.replies to authenticated;
grant select, insert, delete on public.stars to authenticated;
grant select on public.notifications to authenticated;
grant update (read) on public.notifications to authenticated; -- only the read flag
grant select, insert on public.messages to authenticated;
grant update (read) on public.messages to authenticated; -- only the read flag
