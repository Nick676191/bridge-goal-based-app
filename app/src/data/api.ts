// Every call PYN makes to its Supabase database lives in this file. Screens
// don't call these directly; they go through the store (store.tsx), which
// calls these and then updates what's on screen.
//
// The database identifies people by an id (a long random string). The rest of
// the app identifies them by username, so this file translates between the two.

import { supabase } from '@/lib/supabase';
import type { Category, Goal, GoalStatus, Media, User } from './types';

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

// Everything the app needs after you log in.
export type Snapshot = {
  myId: string;
  me: string; // your username
  interests: Category[];
  users: User[];
  goals: Goal[];
  idOf: Record<string, string>; // username -> database id
};

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
  if (m.includes('password')) return message; // e.g. "Password should be at least 8 characters"
  if (m.includes('rate limit')) return 'Too many tries in a short time. Wait a minute and try again.';
  if (m.includes('network') || m.includes('fetch')) return 'Can’t reach PYN. Check your connection and try again.';
  return message;
}

// ─── Loading ────────────────────────────────────────────────────────────────

// Loads profiles, goals and follows for the logged-in person. Returns null if
// nobody is logged in. For a small beta it's simplest to load everyone; once
// PYN grows, this becomes paged ("load more as you scroll").
export async function loadSnapshot(): Promise<Snapshot | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const myId = sessionData.session?.user.id;
  if (!myId) return null;

  const [profiles, goals, follows] = await Promise.all([
    supabase.from('profiles').select('id, username, name, bio, avatar_url, interests').limit(2000),
    supabase
      .from('goals')
      .select('id, author_id, subject, body, categories, status, media, created_at')
      .order('created_at', { ascending: false })
      .limit(500),
    supabase.from('follows').select('follower_id, followee_id').limit(10000),
  ]);
  const profileRows = check(profiles) as ProfileRow[];
  const goalRows = check(goals) as GoalRow[];
  const followRows = check(follows) as FollowRow[];

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
    goals: goalRows.filter((g) => usernameOf[g.author_id]).map((g) => toGoal(g, usernameOf[g.author_id])),
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
    createdAt: new Date(row.created_at).getTime(),
    // Commits and encouragements are saved to the database in stage 2; for
    // now they live on this phone only.
    committed: [],
    encouraged: [],
    media: row.media ?? [],
  };
}

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
