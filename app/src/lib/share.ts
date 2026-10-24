// The message that goes out when someone shares a goal outside the app.

import type { Goal, User } from '@/data/types';
import { APP_NAME } from '@/theme';

// A link that opens this goal in the app ("tenet://goal/g1"). For now it
// only works on phones that have the app installed. Before launch this
// becomes a web link (for example on the app's own website) that opens the
// app if it's installed and the App Store page if it isn't.
export function goalLink(goal: Goal) {
  return `${APP_NAME.toLowerCase()}://goal/${goal.id}`;
}

// "Check out Maya Okafor's goal that they posted on TENET. Follow along with
// their progress here: <link>". Sharing your own goal reads "my goal".
// A note, if the sharer wrote one, goes on top.
export function shareText(goal: Goal, author: User | undefined, note: string, me?: string) {
  const intro = note.trim() ? `${note.trim()}\n\n` : '';
  const link = goalLink(goal);
  if (me && goal.author === me) {
    return `${intro}Check out my goal on ${APP_NAME}. Follow along with my progress here: ${link}`;
  }
  if (!author) {
    return `${intro}Check out this goal on ${APP_NAME}. Follow along with the progress here: ${link}`;
  }
  return `${intro}Check out ${author.name}'s goal that they posted on ${APP_NAME}. Follow along with their progress here: ${link}`;
}
