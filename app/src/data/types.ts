// The shapes of the data in the app. These mirror the database tables in the
// plan doc, so when the real backend (Supabase) arrives, the screens won't
// need to change much. In Python terms, each `type` here is like a dataclass.

export type Category =
  | 'Running'
  | 'Weightlifting'
  | 'Calisthenics'
  | 'Golf'
  | 'Tennis'
  | 'Soccer'
  | 'Cycling'
  | 'Swimming'
  | 'Triathlon'
  | 'Hybrid'
  | 'Climbing'
  | 'Mobility';

export const CATEGORIES: Category[] = [
  'Running',
  'Weightlifting',
  'Calisthenics',
  'Hybrid',
  'Triathlon',
  'Cycling',
  'Swimming',
  'Golf',
  'Tennis',
  'Soccer',
  'Climbing',
  'Mobility',
];

export type User = {
  username: string;
  name: string;
  bio: string;
  originSport?: string; // optional; never shown on posts, only on profiles
  following: string[]; // usernames this user follows
};

export type GoalStatus = 'active' | 'achieved' | 'dropped';

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
