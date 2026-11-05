// The app's shared state for the prototype: every screen reads from and
// writes to this one store, so pressing Encourage on the feed also shows up on
// the goal page and the profile.
//
// It lives only in memory: closing the app resets everything to the fake data.
// In milestone 2 these same functions will read and write the database instead.

import React, { createContext, useContext, useMemo, useReducer } from 'react';
import * as mock from './mock';
import { CATEGORIES, type AppNotification, type Category, type Goal, type GoalStatus, type Message, type Reply, type Tip, type Update, type User } from './types';

type Settings = {
  dailyReminderCap: boolean; // at most one reminder a day across all goals
  quietHours: boolean; // no notifications 10pm to 7am
};

type State = {
  me: string;
  signedIn: boolean;
  users: User[];
  goals: Goal[];
  tips: Tip[];
  updates: Update[];
  replies: Reply[];
  notifications: AppNotification[];
  messages: Message[];
  blocked: string[];
  interests: Category[];
  customCategories: Category[]; // categories people created when posting
  settings: Settings;
};

type Action =
  | { type: 'signIn'; username?: string; name?: string; bio?: string; interests?: Category[] }
  | { type: 'signOut' }
  | { type: 'toggleEncourage'; goalId: string }
  | { type: 'toggleCommit'; goalId: string }
  | { type: 'toggleFollow'; username: string }
  | { type: 'addGoal'; goal: Goal }
  | { type: 'addTip'; goalId: string; text: string }
  | { type: 'addUpdate'; goalId: string; text: string; setback: boolean }
  | { type: 'setStatus'; goalId: string; status: GoalStatus }
  | { type: 'markAllRead' }
  | { type: 'block'; username: string }
  | { type: 'unblock'; username: string }
  | { type: 'updateProfile'; name: string; bio: string }
  | { type: 'setSetting'; key: keyof Settings; value: boolean }
  | { type: 'addCategory'; name: string }
  | { type: 'addReply'; parentId: string; text: string }
  | { type: 'shareGoal'; goalId: string; to: string[]; message: string }
  | { type: 'sendMessage'; to: string; text: string }
  | { type: 'readConversation'; with: string }
  | { type: 'toggleItemEncourage'; kind: 'tip' | 'update' | 'reply'; id: string }
  | { type: 'setAvatar'; uri: string | undefined };

const initialState: State = {
  me: mock.ME,
  signedIn: false,
  users: mock.users,
  goals: mock.goals,
  tips: mock.tips,
  updates: mock.updates,
  replies: mock.replies,
  notifications: mock.notifications,
  messages: mock.messages,
  blocked: [],
  interests: ['Running', 'Weightlifting', 'Triathlon'],
  customCategories: [],
  settings: { dailyReminderCap: true, quietHours: true },
};

let counter = 100;
const newId = (prefix: string) => `${prefix}${counter++}`;

// Adds `item` to the list if it's missing, removes it if it's there.
const toggle = (list: string[], item: string) =>
  list.includes(item) ? list.filter((x) => x !== item) : [...list, item];

// A reducer takes the current state and an action and returns the new state.
// It never edits the old state in place; it builds a new copy.
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'signIn': {
      const users = state.users.map((u) =>
        u.username === state.me
          ? {
              ...u,
              name: action.name || u.name,
              bio: action.bio ?? u.bio,
            }
          : u
      );
      return {
        ...state,
        signedIn: true,
        users,
        interests: action.interests?.length ? action.interests : state.interests,
      };
    }
    case 'signOut':
      return { ...initialState };
    case 'toggleEncourage':
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.goalId ? { ...g, encouraged: toggle(g.encouraged, state.me) } : g
        ),
      };
    case 'toggleCommit':
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.goalId ? { ...g, committed: toggle(g.committed, state.me) } : g
        ),
      };
    case 'toggleFollow':
      return {
        ...state,
        users: state.users.map((u) =>
          u.username === state.me ? { ...u, following: toggle(u.following, action.username) } : u
        ),
      };
    case 'addGoal':
      return { ...state, goals: [action.goal, ...state.goals] };
    case 'addTip':
      return {
        ...state,
        tips: [
          ...state.tips,
          { id: newId('t'), goalId: action.goalId, author: state.me, text: action.text, createdAt: Date.now(), encouraged: [] },
        ],
      };
    case 'addUpdate':
      return {
        ...state,
        updates: [
          ...state.updates,
          {
            id: newId('u'),
            goalId: action.goalId,
            author: state.me,
            text: action.text,
            setback: action.setback,
            createdAt: Date.now(),
            encouraged: [],
          },
        ],
      };
    case 'setStatus': {
      const goal = state.goals.find((g) => g.id === action.goalId);
      if (!goal) return state;
      // When a goal becomes achieved, tell everyone who committed to it.
      // (In the real app this also sends a push notification to their phone.)
      const newlyAchieved = action.status === 'achieved' && goal.status !== 'achieved';
      const alerts: AppNotification[] = newlyAchieved
        ? goal.committed
            .filter((u) => u !== goal.author)
            .map((u) => ({
              id: newId('n'),
              kind: 'achieved' as const,
              to: u,
              actor: goal.author,
              goalId: goal.id,
              createdAt: Date.now(),
              read: false,
            }))
        : [];
      return {
        ...state,
        goals: state.goals.map((g) => (g.id === action.goalId ? { ...g, status: action.status } : g)),
        notifications: [...alerts, ...state.notifications],
      };
    }
    case 'markAllRead':
      return {
        ...state,
        notifications: state.notifications.map((n) => (n.to === state.me ? { ...n, read: true } : n)),
      };
    case 'block':
      return {
        ...state,
        blocked: [...new Set([...state.blocked, action.username])],
        users: state.users.map((u) =>
          u.username === state.me ? { ...u, following: u.following.filter((f) => f !== action.username) } : u
        ),
      };
    case 'unblock':
      return { ...state, blocked: state.blocked.filter((b) => b !== action.username) };
    case 'updateProfile':
      return {
        ...state,
        users: state.users.map((u) =>
          u.username === state.me
            ? { ...u, name: action.name, bio: action.bio }
            : u
        ),
      };
    case 'setSetting':
      return { ...state, settings: { ...state.settings, [action.key]: action.value } };
    case 'addCategory': {
      const name = action.name.trim();
      const exists = [...CATEGORIES, ...state.customCategories].some((c) => c.toLowerCase() === name.toLowerCase());
      return exists || !name ? state : { ...state, customCategories: [...state.customCategories, name] };
    }
    case 'shareGoal':
      // Each person you send it to gets it as a direct message, with your
      // note (if any) attached. It shows up in their Messages inbox.
      return {
        ...state,
        messages: [
          ...state.messages,
          ...action.to.map((u) => ({
            id: newId('m'),
            from: state.me,
            to: u,
            goalId: action.goalId,
            text: action.message.trim() || undefined,
            createdAt: Date.now(),
            read: false,
          })),
        ],
      };
    case 'sendMessage':
      return {
        ...state,
        messages: [
          ...state.messages,
          { id: newId('m'), from: state.me, to: action.to, text: action.text.trim(), createdAt: Date.now(), read: false },
        ],
      };
    case 'readConversation':
      // Opening a conversation marks everything they sent you as read.
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.from === action.with && m.to === state.me && !m.read ? { ...m, read: true } : m
        ),
      };
    case 'addReply':
      return {
        ...state,
        replies: [
          ...state.replies,
          { id: newId('r'), parentId: action.parentId, author: state.me, text: action.text, createdAt: Date.now(), encouraged: [] },
        ],
      };
    case 'toggleItemEncourage': {
      // Same idea as encouraging a goal, for a single tip, update or reply.
      const flip = <T extends { id: string; encouraged: string[] }>(list: T[]) =>
        list.map((x) => (x.id === action.id ? { ...x, encouraged: toggle(x.encouraged, state.me) } : x));
      if (action.kind === 'tip') return { ...state, tips: flip(state.tips) };
      if (action.kind === 'update') return { ...state, updates: flip(state.updates) };
      return { ...state, replies: flip(state.replies) };
    }
    case 'setAvatar':
      return {
        ...state,
        users: state.users.map((u) => (u.username === state.me ? { ...u, avatarUri: action.uri } : u)),
      };
  }
}

type Store = ReturnType<typeof useStoreValue>;
const StoreContext = createContext<Store | null>(null);

function useStoreValue() {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Helpers so screens can ask questions instead of digging through lists.
  const helpers = useMemo(() => {
    const visible = (username: string) => !state.blocked.includes(username);
    const user = (username: string) => state.users.find((u) => u.username === username);
    const meUser = user(state.me)!;

    // Direct messages, grouped into one conversation per person. Blocked
    // people's conversations are hidden. Newest conversation first.
    const myMessages = state.messages.filter(
      (m) => (m.from === state.me || m.to === state.me) && visible(m.from === state.me ? m.to : m.from)
    );
    const byPerson = new Map<string, Message[]>();
    for (const m of myMessages) {
      const other = m.from === state.me ? m.to : m.from;
      byPerson.set(other, [...(byPerson.get(other) ?? []), m]);
    }
    const conversations = [...byPerson.entries()]
      .map(([withUser, list]) => {
        const sorted = [...list].sort((a, b) => a.createdAt - b.createdAt);
        return {
          with: withUser,
          last: sorted[sorted.length - 1],
          unread: sorted.filter((m) => m.to === state.me && !m.read).length,
        };
      })
      .sort((a, b) => b.last.createdAt - a.last.createdAt);

    return {
      conversations,
      // Every message between you and one person, oldest first.
      messagesWith: (username: string) =>
        myMessages
          .filter((m) => m.from === username || m.to === username)
          .sort((a, b) => a.createdAt - b.createdAt),
      // How many conversations have something you haven't read (for the badge).
      unreadConversations: conversations.filter((c) => c.unread > 0).length,
      user,
      meUser,
      goal: (id: string) => state.goals.find((g) => g.id === id),
      visibleGoals: state.goals.filter((g) => visible(g.author)),
      tipsFor: (goalId: string) => state.tips.filter((t) => t.goalId === goalId && visible(t.author)),
      updatesFor: (goalId: string) =>
        state.updates.filter((u) => u.goalId === goalId && visible(u.author)),
      isFollowing: (username: string) => meUser.following.includes(username),
      followers: (username: string) => state.users.filter((u) => u.following.includes(username)),
      // Replies under one tip or update, oldest first so they read as a conversation.
      repliesFor: (parentId: string) =>
        state.replies.filter((r) => r.parentId === parentId && visible(r.author)),
      canPostUpdate: (g: Goal) => g.author === state.me || g.committed.includes(state.me),
      // Only your own notifications (others' are kept for when the backend sends them).
      myNotifications: state.notifications.filter((n) => n.to === state.me),
      unreadCount: state.notifications.filter((n) => n.to === state.me && !n.read).length,
      // Everyone who has been told a goal was achieved (used to show the
      // author who was notified).
      notifiedOf: (goalId: string) =>
        state.notifications.filter((n) => n.kind === 'achieved' && n.goalId === goalId).map((n) => n.to),
      // Built-in categories first, then ones people created.
      allCategories: [...CATEGORIES, ...state.customCategories],
      // Finds an existing category ignoring capitalization ("sport" -> "Sport").
      findCategory: (name: string) =>
        [...CATEGORIES, ...state.customCategories].find((c) => c.toLowerCase() === name.trim().toLowerCase()),
    };
  }, [state]);

  return { state, dispatch, ...helpers };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const value = useStoreValue();
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

// Any screen calls `const store = useStore()` to read data or dispatch actions.
export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}

export { newId };
