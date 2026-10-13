// The shapes of the data in the app. These mirror the database tables in the
// plan doc, so when the real backend (Supabase) arrives, the screens won't
// need to change much. In Python terms, each `type` here is like a dataclass.

// A category is any short name. The built-in list below covers most goals;
// people can also create their own when posting (see the Post screen).
export type Category = string;

export const CATEGORIES: Category[] = [
  'Running',
  'Weightlifting',
  'Calisthenics',
  'Hybrid',
  'Triathlon',
  'Cycling',
  'Swimming',
  'Sport', // any team or racquet sport: soccer, tennis, golf, and so on
  'Climbing',
  'Mobility',
];

export const CATEGORY_MAX = 24; // characters, for categories people create

export type User = {
  username: string;
  name: string;
  bio: string;
  avatarUri?: string; // profile photo; initials are shown when missing
  following: string[]; // usernames this user follows
};

export type GoalStatus = 'active' | 'achieved' | 'dropped';

// A photo or video attached to a goal post to help explain the plan.
// `uri` points at the file on the phone for now; in milestone 2 it becomes a
// link to the file in cloud storage.
export type Media = {
  kind: 'photo' | 'video';
  uri: string;
  width: number;
  height: number;
  durationSec?: number; // videos only
};

// Limits per post. Kept here so the composer and the database agree.
export const MAX_PHOTOS = 4;
export const MAX_VIDEO_SECONDS = 60;

export type Goal = {
  id: string;
  author: string; // username
  subject: string; // the goal itself, max 40 characters
  body: string; // the plan to start, max 500 characters
  category: Category;
  status: GoalStatus;
  createdAt: number; // milliseconds since 1970, like Python's time.time() * 1000
  committed: string[]; // usernames who pressed Commit
  encouraged: string[]; // usernames who pressed Encourage
  media?: Media[]; // up to 4 photos and 1 video, optional
};

// A reply in a goal's Tips thread. Anyone can post one.
export type Tip = {
  id: string;
  goalId: string;
  author: string;
  text: string;
  createdAt: number;
};

// A post in a goal's Updates thread. Only the goal's author and committed
// users can post one. `setback` marks the update with the amber tag.
export type Update = {
  id: string;
  goalId: string;
  author: string;
  text: string;
  setback: boolean;
  createdAt: number;
};

export type NotificationKind = 'encourage' | 'commit' | 'tip' | 'update' | 'reminder' | 'follow';

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  actor?: string; // who did it (missing for reminders)
  goalId?: string;
  createdAt: number;
  read: boolean;
};
