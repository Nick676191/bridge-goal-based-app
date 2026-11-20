// Every call PYN makes to its Supabase database lives in this file. Screens
// don't call these directly; they go through the store (store.tsx), which
// calls these and then updates what's on screen.
//
// The database identifies people by an id (a long random string). The rest of
// the app identifies them by username, so this file translates between the two.

import { supabase } from '@/lib/supabase';
import type { AppNotification, Category, Goal, GoalStatus, Media, Message, NotificationKind, Reply, Tip, Update, User } from './types';

// Rows as the database returns them (column names use snake_case).
type ProfileRow = {
  id: string;
  username: string;
  name: string;
  bio: string;
  avatar_url: string | null;
  interests: string[];
};
type GoalRow = {
  id: string;
  author_id: string;
  subject: string;
  body: string;
  categories: string[];
  status: GoalStatus;
  media: Media[];
  created_at: string;
};
type FollowRow = { follower_id: string; followee_id: string };
type PairRow = { goal_id: string; user_id: string }; // commitments, encouragements
type TipRow = { id: string; goal_id: string; author_id: string; text: string; created_at: string };
type UpdateRow = TipRow & { setback: boolean };
type ReplyRow = { id: string; tip_id: string | null; update_id: string | null; author_id: string; text: string; created_at: string };
type StarRow = { item_kind: 'tip' | 'update' | 'reply'; item_id: string; user_id: string };
type NotificationRow = {
  id: string;
  actor_id: string | null;
  kind: NotificationKind;
  goal_id: string | null;
  read: boolean;
  created_at: string;
};
type MessageRow = {
  id: string;
  sender_id: string;
  recipient_id: string;
  text: string | null;
  goal_id: string | null;
  read: boolean;
  created_at: string;
};

// Everything the app needs after you log in.
export type Snapshot = {
  myId: string;
  me: string; // your username
  interests: Category[];
  users: User[];
  goals: Goal[];
  tips: Tip[];
  updates: Update[];
  replies: Reply[];
  notifications: AppNotification[];
  messages: Message[];
  idOf: Record<string, string>; // username -> database id
};

const time = (iso: string) => new Date(iso).getTime();

// Turns a Supabase error into an ordinary JavaScript error with a readable message.
function check<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

// ─── Accounts ───────────────────────────────────────────────────────────────

export const USERNAME_RULE = /^[a-z0-9._]{3,24}$/;

export async function usernameAvailable(username: string) {
  return check(await supabase.rpc('username_available', { candidate: username.toLowerCase() })) as boolean;
}

// Creates the account. The database copies username, name, bio and interests
// into the new profile (see handle_new_user in the SQL file). Returns whether
// you're logged in right away; if "Confirm email" is on in Supabase, you
// aren't until you click the link in the email.
export async function signUp(input: {
  email: string;
  password: string;
  username: string;
  name: string;
  bio: string;
  interests: Category[];
}) {
  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: {
      data: {
        username: input.username.trim().toLowerCase(),
        name: input.name.trim(),
        bio: input.bio.trim(),
        interests: input.interests,
      },
    },
  });
  if (error) throw new Error(friendlyAuthError(error.message));
  return { loggedIn: !!data.session };
}

export async function logIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw new Error(friendlyAuthError(error.message));
}

// ─── Forgot password ────────────────────────────────────────────────────────
// Three steps, all inside the app (no links to open):
//   1. sendResetCode: Supabase emails a one-time code to that address.
//   2. verifyResetCode: the code logs you in for this one purpose.
//   3. setNewPassword: saves the new password on your account.
// The code only arrives if the "Reset password" email template in Supabase
// includes {{ .Token }} (see the README).

export async function sendResetCode(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
  if (error) throw new Error(friendlyAuthError(error.message));
}

export async function verifyResetCode(email: string, code: string) {
  const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'recovery' });
  if (error) throw new Error(friendlyAuthError(error.message));
}

export async function setNewPassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new Error(friendlyAuthError(error.message));
}

export async function logOut() {
  await supabase.auth.signOut();
}

// Supabase's messages are written for developers; these read better on a phone.
function friendlyAuthError(message: string) {
  const m = message.toLowerCase();
  if (m.includes('invalid login')) return 'That email and password don’t match an account.';
  if (m.includes('email not confirmed')) return 'Confirm your email first: open the link we sent you, then log in.';
  if (m.includes('already registered')) return 'There’s already an account with that email. Try logging in.';
  if (m.includes('database error saving new user')) return 'That username was just taken. Go back and pick another.';
  if (m.includes('token has expired') || m.includes('otp') || m.includes('invalid token'))
    return 'That code is wrong or has expired. Check the newest email, or send a new code.';
  if (m.includes('different from the old')) return 'Pick a password you haven’t used on this account.';
  if (m.includes('password')) return message; // e.g. "Password should be at least 8 characters"
  if (m.includes('rate limit')) return 'Too many tries in a short time. Wait a minute and try again.';
  if (m.includes('network') || m.includes('fetch')) return 'Can’t reach PYN. Check your connection and try again.';
  return message;
}

// ─── Loading ────────────────────────────────────────────────────────────────

// Loads everything for the logged-in person: profiles, goals, follows,
// commits, encouragements, tips, updates, replies, stars, and your own
// notifications and messages. Returns null if nobody is logged in. For a
// small beta it's simplest to load it all at once; once PYN grows, this
// becomes paged ("load more as you scroll").
export async function loadSnapshot(): Promise<Snapshot | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const myId = sessionData.session?.user.id;
  if (!myId) return null;

  const [profiles, goals, follows, commitments, encouragements, tips, updates, replies, stars, notifications, messages] =
    await Promise.all([
      supabase.from('profiles').select('id, username, name, bio, avatar_url, interests').limit(2000),
      supabase
        .from('goals')
        .select('id, author_id, subject, body, categories, status, media, created_at')
        .order('created_at', { ascending: false })
        .limit(500),
      supabase.from('follows').select('follower_id, followee_id').limit(10000),
      supabase.from('commitments').select('goal_id, user_id').limit(10000),
      supabase.from('encouragements').select('goal_id, user_id').limit(10000),
      supabase.from('tips').select('id, goal_id, author_id, text, created_at').order('created_at').limit(5000),
      supabase.from('updates').select('id, goal_id, author_id, text, setback, created_at').order('created_at').limit(5000),
      supabase.from('replies').select('id, tip_id, update_id, author_id, text, created_at').order('created_at').limit(5000),
      supabase.from('stars').select('item_kind, item_id, user_id').limit(20000),
      // Only yours come back (row-level security), newest first.
      supabase
        .from('notifications')
        .select('id, actor_id, kind, goal_id, read, created_at')
        .order('created_at', { ascending: false })
        .limit(200),
      supabase
        .from('messages')
        .select('id, sender_id, recipient_id, text, goal_id, read, created_at')
        .order('created_at')
        .limit(3000),
    ]);
  const profileRows = check(profiles) as ProfileRow[];
  const goalRows = check(goals) as GoalRow[];
  const followRows = check(follows) as FollowRow[];
  const commitRows = check(commitments) as PairRow[];
  const encourageRows = check(encouragements) as PairRow[];
  const starRows = check(stars) as StarRow[];

  const usernameOf: Record<string, string> = {};
  const idOf: Record<string, string> = {};
  for (const p of profileRows) {
    usernameOf[p.id] = p.username;
    idOf[p.username] = p.id;
  }
  const mine = profileRows.find((p) => p.id === myId);
  // The account exists but its profile doesn't (shouldn't happen once the SQL
  // file has been run). Treat it as logged out rather than crash.
  if (!mine) throw new Error('Your profile is missing. Has the database setup been run in Supabase?');

  // Who did something to which goal or item, as usernames.
  const namesFor = (rows: PairRow[], goalId: string) =>
    rows.filter((r) => r.goal_id === goalId).map((r) => usernameOf[r.user_id]).filter(Boolean);
  const starredBy = (kind: StarRow['item_kind'], id: string) =>
    starRows.filter((r) => r.item_kind === kind && r.item_id === id).map((r) => usernameOf[r.user_id]).filter(Boolean);
  const known = (id: string | null) => !!id && !!usernameOf[id];

  const users: User[] = profileRows.map((p) => ({
    username: p.username,
    name: p.name,
    bio: p.bio,
    avatarUri: p.avatar_url ?? undefined,
    following: followRows.filter((f) => f.follower_id === p.id).map((f) => usernameOf[f.followee_id]).filter(Boolean),
  }));

  return {
    myId,
    me: mine.username,
    interests: mine.interests,
    users,
    goals: goalRows
      .filter((g) => known(g.author_id))
      .map((g) => ({
        ...toGoal(g, usernameOf[g.author_id]),
        committed: namesFor(commitRows, g.id),
        encouraged: namesFor(encourageRows, g.id),
      })),
    tips: (check(tips) as TipRow[])
      .filter((t) => known(t.author_id))
      .map((t) => ({ ...toTip(t, usernameOf[t.author_id]), encouraged: starredBy('tip', t.id) })),
    updates: (check(updates) as UpdateRow[])
      .filter((u) => known(u.author_id))
      .map((u) => ({ ...toUpdate(u, usernameOf[u.author_id]), encouraged: starredBy('update', u.id) })),
    replies: (check(replies) as ReplyRow[])
      .filter((r) => known(r.author_id))
      .map((r) => ({ ...toReply(r, usernameOf[r.author_id]), encouraged: starredBy('reply', r.id) })),
    notifications: (check(notifications) as NotificationRow[]).map((n) => ({
      id: n.id,
      kind: n.kind,
      to: mine.username,
      actor: n.actor_id ? usernameOf[n.actor_id] : undefined,
      goalId: n.goal_id ?? undefined,
      createdAt: time(n.created_at),
      read: n.read,
    })),
    messages: (check(messages) as MessageRow[])
      .filter((m) => known(m.sender_id) && known(m.recipient_id))
      .map((m) => toMessage(m, usernameOf[m.sender_id], usernameOf[m.recipient_id])),
    idOf,
  };
}

function toGoal(row: GoalRow, author: string): Goal {
  return {
    id: row.id,
    author,
    subject: row.subject,
    body: row.body,
    categories: row.categories,
    status: row.status,
    createdAt: time(row.created_at),
    committed: [],
    encouraged: [],
    media: row.media ?? [],
  };
}

const toTip = (r: TipRow, author: string): Tip => ({
  id: r.id,
  goalId: r.goal_id,
  author,
  text: r.text,
  createdAt: time(r.created_at),
  encouraged: [],
});
const toUpdate = (r: UpdateRow, author: string): Update => ({ ...toTip(r, author), setback: r.setback });
const toReply = (r: ReplyRow, author: string): Reply => ({
  id: r.id,
  parentId: (r.tip_id ?? r.update_id)!,
  author,
  text: r.text,
  createdAt: time(r.created_at),
  encouraged: [],
});
const toMessage = (r: MessageRow, from: string, to: string): Message => ({
  id: r.id,
  from,
  to,
  text: r.text ?? undefined,
  goalId: r.goal_id ?? undefined,
  createdAt: time(r.created_at),
  read: r.read,
});

// ─── Photos and videos ──────────────────────────────────────────────────────

// Uploads one photo or video from the phone into your folder in the "media"
// storage bucket and returns its public web address.
async function upload(myId: string, localUri: string, kind: 'photo' | 'video') {
  // Already uploaded (an https link): nothing to do.
  if (/^https?:\/\//.test(localUri)) return localUri;
  const ext = (localUri.split('?')[0].match(/\.([a-z0-9]+)$/i)?.[1] ?? (kind === 'video' ? 'mp4' : 'jpg')).toLowerCase();
  const contentType =
    kind === 'video'
      ? ext === 'mov'
        ? 'video/quicktime'
        : 'video/mp4'
      : ext === 'png'
        ? 'image/png'
        : ext === 'heic'
          ? 'image/heic'
          : 'image/jpeg';
  // Read the file from the phone into memory, then send it.
  const file = await (await fetch(localUri)).arrayBuffer();
  const path = `${myId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  check(await supabase.storage.from('media').upload(path, file, { contentType, upsert: false }));
  return supabase.storage.from('media').getPublicUrl(path).data.publicUrl;
}

// ─── Goals ──────────────────────────────────────────────────────────────────

export async function createGoal(
  myId: string,
  me: string,
  input: { subject: string; body: string; categories: Category[]; media: Media[] }
): Promise<Goal> {
  // Upload the photos and video first, then save the post with their links.
  const media: Media[] = [];
  for (const m of input.media) media.push({ ...m, uri: await upload(myId, m.uri, m.kind) });

  const row = check(
    await supabase
      .from('goals')
      .insert({
        author_id: myId,
        subject: input.subject.trim(),
        body: input.body.trim(),
        categories: input.categories,
        media,
      })
      .select('id, author_id, subject, body, categories, status, media, created_at')
      .single()
  ) as GoalRow;
  return toGoal(row, me);
}

export async function setGoalStatus(goalId: string, status: GoalStatus) {
  check(await supabase.from('goals').update({ status }).eq('id', goalId));
}

// ─── Profile ────────────────────────────────────────────────────────────────

export async function saveProfile(myId: string, name: string, bio: string) {
  check(await supabase.from('profiles').update({ name: name.trim(), bio: bio.trim() }).eq('id', myId));
}

// Uploads a new profile photo (or removes it when `localUri` is undefined)
// and returns the new address.
export async function saveAvatar(myId: string, localUri: string | undefined) {
  const url = localUri ? await upload(myId, localUri, 'photo') : null;
  check(await supabase.from('profiles').update({ avatar_url: url }).eq('id', myId));
  return url ?? undefined;
}

// ─── Follows ────────────────────────────────────────────────────────────────

export async function setFollowing(myId: string, theirId: string, follow: boolean) {
  if (follow) {
    const { error } = await supabase.from('follows').insert({ follower_id: myId, followee_id: theirId });
    // Already following (e.g. a double tap): that's fine.
    if (error && !error.message.includes('duplicate')) throw new Error(error.message);
  } else {
    check(await supabase.from('follows').delete().eq('follower_id', myId).eq('followee_id', theirId));
  }
}

// ─── Commits, encouragements and stars ──────────────────────────────────────

// Adds or removes one "I did this" row: a commit or encouragement on a goal.
async function setPair(table: 'commitments' | 'encouragements', myId: string, goalId: string, on: boolean) {
  if (on) {
    const { error } = await supabase.from(table).insert({ goal_id: goalId, user_id: myId });
    // Already there (e.g. a double tap): that's fine.
    if (error && !error.message.includes('duplicate')) throw new Error(error.message);
  } else {
    check(await supabase.from(table).delete().eq('goal_id', goalId).eq('user_id', myId));
  }
}

export const setCommitted = (myId: string, goalId: string, on: boolean) => setPair('commitments', myId, goalId, on);
export const setEncouraged = (myId: string, goalId: string, on: boolean) => setPair('encouragements', myId, goalId, on);

export async function setStar(myId: string, kind: 'tip' | 'update' | 'reply', itemId: string, on: boolean) {
  if (on) {
    const { error } = await supabase.from('stars').insert({ item_kind: kind, item_id: itemId, user_id: myId });
    if (error && !error.message.includes('duplicate')) throw new Error(error.message);
  } else {
    check(await supabase.from('stars').delete().eq('item_kind', kind).eq('item_id', itemId).eq('user_id', myId));
  }
}

// ─── Tips, updates and replies ──────────────────────────────────────────────

export async function createTip(myId: string, me: string, goalId: string, text: string): Promise<Tip> {
  const row = check(
    await supabase
      .from('tips')
      .insert({ goal_id: goalId, author_id: myId, text: text.trim() })
      .select('id, goal_id, author_id, text, created_at')
      .single()
  ) as TipRow;
  return toTip(row, me);
}

export async function createUpdate(myId: string, me: string, goalId: string, text: string, setback: boolean): Promise<Update> {
  const row = check(
    await supabase
      .from('updates')
      .insert({ goal_id: goalId, author_id: myId, text: text.trim(), setback })
      .select('id, goal_id, author_id, text, setback, created_at')
      .single()
  ) as UpdateRow;
  return toUpdate(row, me);
}

// `parentKind` says whether the reply is under a tip or an update.
export async function createReply(
  myId: string,
  me: string,
  parentKind: 'tip' | 'update',
  parentId: string,
  text: string
): Promise<Reply> {
  const row = check(
    await supabase
      .from('replies')
      .insert({ [parentKind === 'tip' ? 'tip_id' : 'update_id']: parentId, author_id: myId, text: text.trim() })
      .select('id, tip_id, update_id, author_id, text, created_at')
      .single()
  ) as ReplyRow;
  return toReply(row, me);
}

// ─── Notifications ──────────────────────────────────────────────────────────

export async function markNotificationsRead(myId: string) {
  check(await supabase.from('notifications').update({ read: true }).eq('recipient_id', myId).eq('read', false));
}

// ─── Messages ───────────────────────────────────────────────────────────────

// Sends the same message to one or more people (several when sharing a goal).
export async function sendMessages(
  myId: string,
  me: string,
  to: { username: string; id: string }[],
  text: string | undefined,
  goalId: string | undefined
): Promise<Message[]> {
  const rows = check(
    await supabase
      .from('messages')
      .insert(to.map((t) => ({ sender_id: myId, recipient_id: t.id, text: text?.trim() || null, goal_id: goalId ?? null })))
      .select('id, sender_id, recipient_id, text, goal_id, read, created_at')
  ) as MessageRow[];
  const nameOf = Object.fromEntries(to.map((t) => [t.id, t.username]));
  return rows.map((r) => toMessage(r, me, nameOf[r.recipient_id]));
}

// Marks everything someone sent you as read (when you open the conversation).
export async function markConversationRead(myId: string, otherId: string) {
  check(
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('recipient_id', myId)
      .eq('sender_id', otherId)
      .eq('read', false)
  );
}
