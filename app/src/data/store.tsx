// The app's shared state for the prototype: every screen reads from and
// writes to this one store, so pressing Encourage on the feed also shows up on
// the goal page and the profile.
//
// It lives only in memory: closing the app resets everything to the fake data.
// In milestone 2 these same functions will read and write the database instead.

import React, { createContext, useContext, useMemo, useReducer } from 'react';
import * as mock from './mock';
import type { AppNotification, Category, Goal, GoalStatus, Tip, Update, User } from './types';

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
  notifications: AppNotification[];
  blocked: string[];
  interests: Category[];
  settings: Settings;
};

type Action =
  | { type: 'signIn'; username?: string; name?: string; originSport?: string; interests?: Category[] }
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
  | { type: 'updateProfile'; name: string; bio: string; originSport: string }
  | { type: 'setSetting'; key: keyof Settings; value: boolean };

const initialState: State = {
  me: mock.ME,
  signedIn: false,
  users: mock.users,
  goals: mock.goals,
  tips: mock.tips,
  updates: mock.updates,
  notifications: mock.notifications,
  blocked: [],
  interests: ['Running', 'Weightlifting', 'Triathlon'],
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
              originSport: action.originSport ?? u.originSport,
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
          { id: newId('t'), goalId: action.goalId, author: state.me, text: action.text, createdAt: Date.now() },
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
          },
        ],
      };
    case 'setStatus':
      return {
        ...state,
        goals: state.goals.map((g) => (g.id === action.goalId ? { ...g, status: action.status } : g)),
      };
    case 'markAllRead':
      return { ...state, notifications: state.notifications.map((n) => ({ ...n, read: true })) };
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
            ? { ...u, name: action.name, bio: action.bio, originSport: action.originSport || undefined }
            : u
        ),
      };
    case 'setSetting':
      return { ...state, settings: { ...state.settings, [action.key]: action.value } };
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
    return {
      user,
      meUser,
      goal: (id: string) => state.goals.find((g) => g.id === id),
      visibleGoals: state.goals.filter((g) => visible(g.author)),
      tipsFor: (goalId: string) => state.tips.filter((t) => t.goalId === goalId && visible(t.author)),
      updatesFor: (goalId: string) =>
        state.updates.filter((u) => u.goalId === goalId && visible(u.author)),
      isFollowing: (username: string) => meUser.following.includes(username),
      followers: (username: string) => state.users.filter((u) => u.following.includes(username)),
      canPostUpdate: (g: Goal) => g.author === state.me || g.committed.includes(state.me),
      unreadCount: state.notifications.filter((n) => !n.read).length,
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
