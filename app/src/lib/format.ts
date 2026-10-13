// Small text helpers shared across screens.

// "3h", "2d", "just now": the short timestamps used next to posts.
export function timeAgo(ms: number, now = Date.now()) {
  const s = Math.max(0, Math.round((now - ms) / 1000));
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d`;
  const w = Math.round(d / 7);
  return `${w}w`;
}

export function plural(n: number, word: string, pluralWord = `${word}s`) {
  return `${n} ${n === 1 ? word : pluralWord}`;
}

// The goal composer nudges toward a SMART goal. These checks are rough on
// purpose: they look for a number (Measurable) and a time (Timely) in the
// subject and plan, and light up a hint when they find one. They never block
// posting.
const MONTHS =
  /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\b|\b(by|before|within|in \d+)\b|\bweeks?\b|\bmonths?\b|\bdays?\b|\b20\d\d\b|\bspring|summer|fall|autumn|winter\b/i;

export function smartChecks(subject: string, body: string) {
  const text = `${subject} ${body}`;
  return {
    specific: subject.trim().split(/\s+/).filter(Boolean).length >= 3,
    measurable: /\d/.test(subject),
    timely: MONTHS.test(text),
    plan: body.trim().length >= 40,
  };
}
