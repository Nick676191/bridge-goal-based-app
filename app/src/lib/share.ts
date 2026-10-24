// The text that goes out when someone shares a goal outside the app.

import type { Goal, User } from '@/data/types';
import { APP_NAME } from '@/theme';

// A link that opens this goal in the app ("tenet://goal/g1"). For now it
// only works on phones that have the app installed. Before launch this
// becomes a web link (for example on the app's own website) that opens the
// app if it's installed and the App Store page if it isn't.
export function goalLink(goal: Goal) {
  return `${APP_NAME.toLowerCase()}://goal/${goal.id}`;
}

export function shareText(goal: Goal, author: User | undefined, note: string) {
  const who = author ? author.name.split(' ')[0] : 'Someone';
  const intro = note.trim() ? `${note.trim()}\n\n` : '';
  return `${intro}${who} is going for "${goal.subject}" on ${APP_NAME}. Follow along or commit with them: ${goalLink(goal)}`;
}
