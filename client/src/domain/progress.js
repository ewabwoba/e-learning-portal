// Pure progress rules shared by the demo repository and the UI.

export const percent = (done, total) => (total ? Math.round((done / total) * 100) : 0);

const dayKey = (d) => new Date(d).toISOString().slice(0, 10);

/** Consecutive days with learning activity, ending today (or yesterday, so the streak survives until midnight). */
export function calculateStreak(isoDates, now = new Date()) {
  const days = new Set(isoDates.map(dayKey));
  let cursor = new Date(now);
  if (!days.has(dayKey(cursor))) cursor.setUTCDate(cursor.getUTCDate() - 1);
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

/** Minutes learned per day for the last 7 days, oldest first. [{label, minutes}] */
export function weeklyMinutes(entries, now = new Date()) {
  const out = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    const key = dayKey(d);
    out.push({
      label: d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
      minutes: entries.filter((e) => dayKey(e.at) === key).reduce((s, e) => s + e.minutes, 0),
    });
  }
  return out;
}
