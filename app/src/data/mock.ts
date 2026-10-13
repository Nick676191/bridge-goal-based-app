// Fake data for the clickable prototype. Nothing here is real; it exists so
// every screen has something believable to show. In milestone 2 this file is
// replaced by reads from the database.

import type { AppNotification, Goal, Reply, Tip, Update, User } from './types';

export const ME = 'nick';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const now = Date.now();
const ago = (ms: number) => now - ms;

export const users: User[] = [
  {
    username: 'nick',
    name: 'Nick',
    bio: 'Building Bridge. Learning to run long after years of running short.',
    following: ['maya.runs', 'dre_lifts', 'tess.tri', 'coach_jo'],
  },
  {
    username: 'maya.runs',
    name: 'Maya Okafor',
    bio: 'Four years of D1 midfield. Now chasing a marathon time instead of a ball.',
    following: ['nick', 'tess.tri'],
  },
  {
    username: 'dre_lifts',
    name: 'Andre Wallace',
    bio: 'Ex-point guard. Turns out I like picking heavy things up.',
    following: ['nick', 'priya.moves'],
  },
  {
    username: 'tess.tri',
    name: 'Tess Lindqvist',
    bio: 'Swam freestyle in college. Learning to bike and run without hating it.',
    following: ['maya.runs'],
  },
  {
    username: 'priya.moves',
    name: 'Priya Raman',
    bio: 'Outside hitter turned bar athlete. Muscle-up or bust.',
    following: ['dre_lifts'],
  },
  {
    username: 'coach_jo',
    name: 'Jordan Ellis',
    bio: 'Catcher for 12 years. Now trying to break 80 on a real course.',
    following: ['nick'],
  },
  {
    username: 'benji.h',
    name: 'Ben Harlow',
    bio: 'Played hockey until my knees said stop. Training for my first Hyrox.',
    following: [],
  },
];

export const goals: Goal[] = [
  {
    id: 'g1',
    author: 'maya.runs',
    subject: 'Run a sub-4 hour marathon',
    body: 'Chicago, October next year. 18-week plan starting in June, building from 25 to 50 miles a week. Long runs on Sundays, one speed session midweek. My longest run ever is 9 miles, so the first goal is just getting comfortable past 13.',
    category: 'Running',
    status: 'active',
    createdAt: ago(3 * HOUR),
    committed: ['tess.tri', 'nick'],
    encouraged: ['dre_lifts', 'coach_jo', 'priya.moves', 'benji.h'],
  },
  {
    id: 'g2',
    author: 'dre_lifts',
    subject: 'Deadlift 2x bodyweight (370 lb)',
    body: 'Currently at 315 for a single. Running a 12-week block, 3 lifting days a week, deadlifting twice. Filming every top set so you all can roast my form.',
    category: 'Weightlifting',
    status: 'active',
    createdAt: ago(9 * HOUR),
    committed: ['benji.h'],
    encouraged: ['nick', 'priya.moves'],
  },
  {
    id: 'g3',
    author: 'priya.moves',
    subject: 'First strict muscle-up by March 1',
    body: 'I can do 8 pull-ups and 12 dips. Missing the transition. Working false grip holds and high pulls 4x a week, plus band-assisted muscle-ups at the end of each session.',
    category: 'Calisthenics',
    status: 'active',
    createdAt: ago(1 * DAY + 2 * HOUR),
    committed: [],
    encouraged: ['dre_lifts', 'maya.runs', 'nick'],
  },
  {
    id: 'g4',
    author: 'nick',
    subject: 'Run a half marathon under 1:45',
    body: 'Spring race, date TBD. Three runs a week to start: one easy, one tempo, one long. Haven\'t run more than 5 miles since preseason conditioning, so the first month is just base building.',
    category: 'Running',
    status: 'active',
    createdAt: ago(4 * DAY),
    committed: ['maya.runs'],
    encouraged: ['maya.runs', 'tess.tri', 'coach_jo'],
  },
  {
    id: 'g5',
    author: 'tess.tri',
    subject: 'Finish a sprint triathlon',
    body: 'The swim is the easy part. Bike: ride 3x a week, one with a brick run after. Run: walk-run intervals until 5K feels fine. Race is in 14 weeks.',
    category: 'Triathlon',
    status: 'active',
    createdAt: ago(2 * DAY),
    committed: ['maya.runs'],
    encouraged: ['nick', 'benji.h'],
  },
  {
    id: 'g6',
    author: 'coach_jo',
    subject: 'Break 80 on a par-72 course',
    body: 'Best round is 86. Short game is costing me 5+ strokes a round. Plan: 2 range sessions and 1 short-game session a week, 9 holes every Saturday, tracking putts and up-and-downs.',
    category: 'Sport',
    status: 'active',
    createdAt: ago(3 * DAY),
    committed: [],
    encouraged: ['nick'],
  },
  {
    id: 'g7',
    author: 'benji.h',
    subject: 'Finish my first Hyrox under 1:30',
    body: 'Race in Dallas in 10 weeks. Two compromised-running sessions a week (run, then sled or wall balls), one long run, one strength day. Knees permitting.',
    category: 'Hybrid',
    status: 'active',
    createdAt: ago(5 * HOUR),
    committed: ['dre_lifts'],
    encouraged: ['priya.moves'],
  },
  {
    id: 'g8',
    author: 'maya.runs',
    subject: 'Run 5K without walking',
    body: 'Week one of running for fun instead of for a coach. Couch-to-5K style, 3 days a week.',
    category: 'Running',
    status: 'achieved',
    createdAt: ago(60 * DAY),
    committed: [],
    encouraged: ['tess.tri', 'nick', 'dre_lifts'],
  },
];

export const tips: Tip[] = [
  {
    id: 't1',
    goalId: 'g1',
    author: 'coach_jo',
    text: 'Run your long runs slower than feels right. Most first-timers blow up because every run is a medium-hard run.',
    createdAt: ago(2 * HOUR),
    encouraged: ['maya.runs', 'nick'],
  },
  {
    id: 't2',
    goalId: 'g1',
    author: 'benji.h',
    text: 'Practice fueling on long runs, not just on race day. Gels every 40 minutes worked for me.',
    createdAt: ago(1 * HOUR),
    encouraged: ['maya.runs'],
  },
  {
    id: 't3',
    goalId: 'g2',
    author: 'priya.moves',
    text: 'Film from the side, not the front. Hard to see bar path otherwise.',
    createdAt: ago(6 * HOUR),
    encouraged: [],
  },
  {
    id: 't4',
    goalId: 'g4',
    author: 'tess.tri',
    text: 'For a 1:45 you want tempo runs around 7:45-7:55 per mile. Do them on a flat loop so you can actually hold pace.',
    createdAt: ago(3 * DAY),
    encouraged: ['nick', 'maya.runs'],
  },
  {
    id: 't5',
    goalId: 'g3',
    author: 'dre_lifts',
    text: 'Explosive pull-ups to the chest helped me more than band work did. Get the bar to your sternum first.',
    createdAt: ago(20 * HOUR),
    encouraged: ['priya.moves'],
  },
];

export const updates: Update[] = [
  {
    id: 'u1',
    goalId: 'g1',
    author: 'maya.runs',
    text: 'First 10-miler done. Legs felt fine until mile 8, then everything hurt. Still counts.',
    setback: false,
    createdAt: ago(2 * HOUR),
    encouraged: [],
  },
  {
    id: 'u2',
    goalId: 'g1',
    author: 'tess.tri',
    text: 'Skipped my long run Sunday. Bad week at work, then bad sleep, then I just didn\'t go. Back on it this weekend.',
    setback: true,
    createdAt: ago(1 * HOUR),
    encouraged: ['maya.runs', 'nick', 'coach_jo'],
  },
  {
    id: 'u3',
    goalId: 'g2',
    author: 'dre_lifts',
    text: 'Missed 335 twice today. Lockout is the weak point. Adding block pulls.',
    setback: true,
    createdAt: ago(8 * HOUR),
    encouraged: ['benji.h'],
  },
  {
    id: 'u4',
    goalId: 'g4',
    author: 'nick',
    text: 'Week 1: three runs, 11 miles total. The tempo run was humbling.',
    setback: false,
    createdAt: ago(2 * DAY),
    encouraged: ['maya.runs', 'tess.tri'],
  },
  {
    id: 'u5',
    goalId: 'g4',
    author: 'maya.runs',
    text: 'Did your Thursday tempo with you remotely. 7:58 pace for 3 miles. Next week we hold 7:50.',
    setback: false,
    createdAt: ago(1 * DAY),
    encouraged: [],
  },
  {
    id: 'u6',
    goalId: 'g8',
    author: 'maya.runs',
    text: 'Ran the whole 5K. 27:41. Marking this one done.',
    setback: false,
    createdAt: ago(40 * DAY),
    encouraged: [],
  },
];

export const replies: Reply[] = [
  {
    id: 'r1',
    parentId: 'u2',
    author: 'maya.runs',
    text: 'Happens to everyone. Want to do Saturday together? I can push my long run a day.',
    createdAt: ago(40 * 60 * 1000),
    encouraged: ['tess.tri'],
  },
  {
    id: 'r2',
    parentId: 'u2',
    author: 'tess.tri',
    text: 'Yes. 7am at the lakefront?',
    createdAt: ago(20 * 60 * 1000),
    encouraged: [],
  },
  {
    id: 'r3',
    parentId: 't4',
    author: 'nick',
    text: 'That flat loop tip is a good one. My route has a big hill at mile 2.',
    createdAt: ago(2 * DAY + 5 * HOUR),
    encouraged: ['tess.tri'],
  },
];

export const notifications: AppNotification[] = [
  { id: 'n1', kind: 'reminder', goalId: 'g4', createdAt: ago(30 * 60 * 1000), read: false },
  { id: 'n2', kind: 'update', actor: 'maya.runs', goalId: 'g4', createdAt: ago(1 * DAY), read: false },
  { id: 'n3', kind: 'encourage', actor: 'coach_jo', goalId: 'g4', createdAt: ago(1 * DAY + 3 * HOUR), read: true },
  { id: 'n4', kind: 'tip', actor: 'tess.tri', goalId: 'g4', createdAt: ago(3 * DAY), read: true },
  { id: 'n5', kind: 'commit', actor: 'maya.runs', goalId: 'g4', createdAt: ago(3 * DAY + 5 * HOUR), read: true },
  { id: 'n6', kind: 'follow', actor: 'coach_jo', createdAt: ago(4 * DAY), read: true },
];
