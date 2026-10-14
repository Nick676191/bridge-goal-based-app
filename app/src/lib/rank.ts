// How the feed and the Explore page decide what to show first.
// v1 keeps this simple on purpose (see "Screens" in the plan doc): a learned
// ranking needs real usage data, which only exists after launch.

import type { Category, Goal, Update } from '@/data/types';

const HOUR = 60 * 60 * 1000;

// Activity score: commits count most, then updates, then encouragements.
// Older activity fades, so a busy goal from last month doesn't sit on top.
export function activityScore(goal: Goal, updates: Update[], now = Date.now()) {
  const recentUpdates = updates.filter((u) => u.goalId === goal.id && now - u.createdAt < 7 * 24 * HOUR).length;
  const raw = goal.committed.length * 3 + recentUpdates * 2 + goal.encouraged.length;
  const ageHours = (now - goal.createdAt) / HOUR;
  return raw / Math.pow(ageHours + 2, 0.8);
}

// Home feed: posts from people you follow (and your own) first, then active
// posts in categories you picked, newest first within each group.
export function rankFeed(goals: Goal[], me: string, following: string[], interests: Category[]) {
  const fromFollowed = goals.filter((g) => g.author === me || following.includes(g.author));
  const fromInterests = goals.filter(
    (g) => !fromFollowed.includes(g) && g.status === 'active' && g.categories.some((c) => interests.includes(c))
  );
  const byNewest = (a: Goal, b: Goal) => b.createdAt - a.createdAt;
  return [...fromFollowed.sort(byNewest), ...fromInterests.sort(byNewest)];
}

// Explore: the top 5 active goals by activity score, across all categories.
export function trending(goals: Goal[], updates: Update[], count = 5) {
  return goals
    .filter((g) => g.status === 'active')
    .map((g) => ({ g, s: activityScore(g, updates) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, count)
    .map((x) => x.g);
}
