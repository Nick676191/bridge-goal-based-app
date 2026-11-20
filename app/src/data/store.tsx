// The app's shared state: every screen reads from and writes to this one
// store, so pressing Follow on a profile also shows up in the feed.
//
// Everything here is saved in the Supabase database: accounts, profiles,
// goals, follows, photos, commits, encouragements, tips, updates, replies,
// stars, notifications and messages. It loads when you log in (and when you
// pull to refresh), and every change is sent to the database through the
// async functions near the bottom (see api.ts).
//
// On this phone only, for now: blocked people and the notification settings.
// Those move to the database in stage 3 (safety).

import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import { ActivityIndicator, Platform, Alert, View } from 'react-native';
import * as api from './api';
import { supabase } from '@/lib/supabase';
import { colors } from '@/theme';
import { CATEGORIES, type AppNotification, type Category, type Goal, type GoalStatus, type Message, type Reply, type Tip, type Update, type User } from './types';

type Settings = {
  dailyReminderCap: boolean; // at most one reminder a day across all goals
  quietHours: boolean; // no notifications 10pm to 7am
};

type State = {
  ready: boolean; // finished checking whether someone is already logged in
  me: string; // your username ('' when logged out)
  myId: string; // your account id in the database
  idOf: Record<string, string>; // username -> account id
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
  | { type: 'loaded'; snapshot: api.Snapshot }
  | { type: 'ready' }
  | { type: 'signOut' }
  | { type: 'toggleEncourage'; goalId: string }
  | { type: 'toggleCommit'; goalId: string }
  | { type: 'toggleFollow'; username: string }
  | { type: 'addGoal'; goal: Goal }
  | { type: 'addTip'; tip: Tip }
  | { type: 'addUpdate'; update: Update }
  | { type: 'setStatus'; goalId: string; status: GoalStatus }
  | { type: 'removeGoal'; goalId: string }
  | { type: 'markAllRead' }
  | { type: 'block'; username: string }
  | { type: 'unblock'; username: string }
  | { type: 'updateProfile'; name: string; bio: string }
  | { type: 'setSetting'; key: keyof Settings; value: boolean }
  | { type: 'addCategory'; name: string }
  | { type: 'addReply'; reply: Reply }
  | { type: 'addMessages'; messages: Message[] }
  | { type: 'readConversation'; with: string }
  | { type: 'toggleItemEncourage'; kind: 'tip' | 'update' | 'reply'; id: string }
  | { type: 'setAvatar'; uri: string | undefined };

// Logged out: nothing loaded yet.
const initialState: State = {
  ready: false,
  me: '',
  myId: '',
  idOf: {},
  signedIn: false,
  users: [],
  goals: [],
  tips: [],
  updates: [],
  replies: [],
  notifications: [],
  messages: [],
  blocked: [],
  interests: [],
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
    case 'loaded': {
      // Fresh data from the database after logging in (or pulling to refresh).
      const { snapshot } = action;
      return {
        ...state,
        ready: true,
        signedIn: true,
        me: snapshot.me,
        myId: snapshot.myId,
        idOf: snapshot.idOf,
        users: snapshot.users,
        interests: snapshot.interests,
        goals: snapshot.goals,
        tips: snapshot.tips,
        updates: snapshot.updates,
        replies: snapshot.replies,
        notifications: snapshot.notifications,
        messages: snapshot.messages,
      };
    }
    case 'ready':
      return { ...state, ready: true };
    case 'signOut':
      return { ...initialState, ready: true };
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
    case 'removeGoal':
      return { ...state, goals: state.goals.filter((g) => g.id !== action.goalId) };
    case 'addTip':
      return { ...state, tips: [...state.tips, action.tip] };
    case 'addUpdate':
      return { ...state, updates: [...state.updates, action.update] };
    case 'setStatus':
      // When a goal becomes achieved, the database notifies everyone who
      // committed to it (see notify_on_achieved in the stage 2 SQL).
      return {
        ...state,
        goals: state.goals.map((g) => (g.id === action.goalId ? { ...g, status: action.status } : g)),
      };
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
    case 'addMessages':
      return { ...state, messages: [...state.messages, ...action.messages] };
    case 'readConversation':
      // Opening a conversation marks everything they sent you as read.
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.from === action.with && m.to === state.me && !m.read ? { ...m, read: true } : m
        ),
      };
    case 'addReply':
      return { ...state, replies: [...state.replies, action.reply] };
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
    // Only screens behind the login use this, so it's always there for them.
    const meUser = user(state.me)!;
    const knownCategories = [
      ...new Set([...CATEGORIES, ...state.goals.flatMap((g) => g.categories), ...state.customCategories]),
    ];

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
      myNotifications: state.notifications.filter((n) => n.to === state.me),
      unreadCount: state.notifications.filter((n) => n.to === state.me && !n.read).length,
      // Everyone told that a goal was achieved: the people committed to it
      // (the database notifies them when it's marked achieved).
      notifiedOf: (goalId: string) => {
        const g = state.goals.find((x) => x.id === goalId);
        return g && g.status === 'achieved' ? g.committed.filter((u) => u !== g.author) : [];
      },
      // Built-in categories first, then ones people created (on any goal, or
      // just now on the Post screen).
      allCategories: knownCategories,
      // Finds an existing category ignoring capitalization ("sport" -> "Sport").
      findCategory: (name: string) => knownCategories.find((c) => c.toLowerCase() === name.trim().toLowerCase()),
    };
  }, [state]);

  // Loads everything from the database and puts it on screen. Used after
  // logging in and when you pull down on the Home feed.
  const refresh = useCallback(async () => {
    const snapshot = await api.loadSnapshot();
    dispatch(snapshot ? { type: 'loaded', snapshot } : { type: 'signOut' });
  }, []);

  // When the app opens: if you logged in before, load your data; otherwise
  // show the welcome screen. Also notices when you're logged out (for
  // example, if your session expired).
  useEffect(() => {
    let alive = true;
    api
      .loadSnapshot()
      .then((snapshot) => alive && dispatch(snapshot ? { type: 'loaded', snapshot } : { type: 'ready' }))
      .catch((e: Error) => {
        if (!alive) return;
        dispatch({ type: 'ready' });
        showError('Couldn’t load PYN', e.message);
      });
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') dispatch({ type: 'signOut' });
    });
    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);

  // Things that talk to the database. Each one saves to Supabase and updates
  // the screen. Quick toggles (follow, goal status) update the screen first
  // and undo themselves if saving fails, so taps feel instant.
  const actions = useMemo(() => {
    const { myId, me, idOf } = state;
    return {
      refresh,

      logIn: async (email: string, password: string) => {
        await api.logIn(email, password);
        await refresh();
      },

      // Returns false if the account needs its email confirmed before logging in.
      signUp: async (input: Parameters<typeof api.signUp>[0]) => {
        const { loggedIn } = await api.signUp(input);
        if (loggedIn) {
          try {
            await refresh();
          } catch (e) {
            // The account exists; only loading failed. Say so, so nobody
            // tries to sign up again with the same email.
            throw new Error(`Your account was created, but PYN couldn’t load it: ${(e as Error).message}. Try logging in.`);
          }
        }
        return loggedIn;
      },

      // Forgot password, step 2 and 3 together: check the emailed code, save
      // the new password, then load everything (you're now logged in).
      // `verified` skips the code if it already worked and only saving the
      // password failed, since each code works once.
      resetPassword: async (email: string, code: string, password: string, verified: boolean) => {
        if (!verified) await api.verifyResetCode(email, code);
        try {
          await api.setNewPassword(password);
        } catch (e) {
          throw Object.assign(e as Error, { verified: true });
        }
        await refresh();
      },

      logOut: async () => {
        await api.logOut();
        dispatch({ type: 'signOut' });
      },

      publishGoal: async (input: Parameters<typeof api.createGoal>[2]) => {
        const goal = await api.createGoal(myId, me, input);
        dispatch({ type: 'addGoal', goal });
        return goal;
      },

      changeStatus: async (goalId: string, status: GoalStatus) => {
        const before = state.goals.find((g) => g.id === goalId)?.status;
        dispatch({ type: 'setStatus', goalId, status });
        try {
          await api.setGoalStatus(goalId, status);
        } catch (e) {
          if (before) dispatch({ type: 'setStatus', goalId, status: before });
          showError('Couldn’t update the goal', (e as Error).message);
        }
      },

      toggleFollow: async (username: string) => {
        const following = state.users.find((u) => u.username === me)?.following.includes(username) ?? false;
        dispatch({ type: 'toggleFollow', username });
        try {
          await api.setFollowing(myId, idOf[username], !following);
        } catch (e) {
          dispatch({ type: 'toggleFollow', username }); // undo
          showError(following ? 'Couldn’t unfollow' : 'Couldn’t follow', (e as Error).message);
        }
      },

      // Commit and Encourage on a goal, and the star on a tip, update or reply:
      // the screen changes right away and changes back if saving fails.
      toggleCommit: async (goalId: string) => {
        const on = !state.goals.find((g) => g.id === goalId)?.committed.includes(me);
        dispatch({ type: 'toggleCommit', goalId });
        try {
          await api.setCommitted(myId, goalId, on);
        } catch (e) {
          dispatch({ type: 'toggleCommit', goalId });
          showError(on ? 'Couldn’t commit' : 'Couldn’t take back your commit', (e as Error).message);
        }
      },

      toggleEncourage: async (goalId: string) => {
        const on = !state.goals.find((g) => g.id === goalId)?.encouraged.includes(me);
        dispatch({ type: 'toggleEncourage', goalId });
        try {
          await api.setEncouraged(myId, goalId, on);
        } catch (e) {
          dispatch({ type: 'toggleEncourage', goalId });
          showError('Couldn’t save that', (e as Error).message);
        }
      },

      toggleStar: async (kind: 'tip' | 'update' | 'reply', id: string) => {
        const list = kind === 'tip' ? state.tips : kind === 'update' ? state.updates : state.replies;
        const on = !list.find((x) => x.id === id)?.encouraged.includes(me);
        dispatch({ type: 'toggleItemEncourage', kind, id });
        try {
          await api.setStar(myId, kind, id, on);
        } catch (e) {
          dispatch({ type: 'toggleItemEncourage', kind, id });
          showError('Couldn’t save that', (e as Error).message);
        }
      },

      // Posting waits for the database so the new post has its real id.
      // These throw on failure; the goal screen keeps your text and says so.
      postTip: async (goalId: string, text: string) => {
        dispatch({ type: 'addTip', tip: await api.createTip(myId, me, goalId, text) });
      },

      postUpdate: async (goalId: string, text: string, setback: boolean) => {
        dispatch({ type: 'addUpdate', update: await api.createUpdate(myId, me, goalId, text, setback) });
      },

      // `parentId` is the tip or update being answered.
      postReply: async (parentId: string, text: string) => {
        const kind = state.tips.some((t) => t.id === parentId) ? 'tip' : 'update';
        dispatch({ type: 'addReply', reply: await api.createReply(myId, me, kind, parentId, text) });
      },

      markAllRead: async () => {
        if (!state.notifications.some((n) => !n.read)) return;
        dispatch({ type: 'markAllRead' });
        try {
          await api.markNotificationsRead(myId);
        } catch {
          // Not worth an alert: they'll just show as unread next time.
        }
      },

      // Messages, including goals shared from the Share screen.
      sendMessage: async (to: string[], text: string | undefined, goalId?: string) => {
        const people = to.map((username) => ({ username, id: idOf[username] }));
        dispatch({ type: 'addMessages', messages: await api.sendMessages(myId, me, people, text, goalId) });
      },

      readConversation: async (username: string) => {
        dispatch({ type: 'readConversation', with: username });
        try {
          await api.markConversationRead(myId, idOf[username]);
        } catch {
          // They'll show as unread again after a refresh; no alert needed.
        }
      },

      saveProfile: async (name: string, bio: string) => {
        await api.saveProfile(myId, name, bio);
        dispatch({ type: 'updateProfile', name: name.trim(), bio: bio.trim() });
      },

      // Pass a photo from the phone, or undefined to remove it.
      changeAvatar: async (localUri: string | undefined) => {
        const url = await api.saveAvatar(myId, localUri);
        dispatch({ type: 'setAvatar', uri: url });
      },
    };
  }, [state, refresh]);

  return { state, dispatch, ...helpers, ...actions };
}

// A pop-up error message. (The web preview has no native alerts.)
export function showError(title: string, message: string) {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const value = useStoreValue();
  // While checking for a saved login, show a plain blue screen with a spinner
  // instead of flashing the welcome screen.
  if (!value.state.ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.carolina, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.navy} size="large" />
      </View>
    );
  }
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

// Any screen calls `const store = useStore()` to read data or dispatch actions.
export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}

export { newId };
