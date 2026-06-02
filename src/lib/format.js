// Date / number helpers shared across server and client.

const LOCALE = { sv: 'sv-SE', en: 'en-GB' };

export function todayISO() {
  return new Date().toISOString().split('T')[0];
}

export function addDaysISO(days, from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function atMidnight(iso) {
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function today00() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function fmtDate(iso, lang = 'sv') {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(LOCALE[lang] || 'sv-SE', { day: 'numeric', month: 'short' });
}

export function fmtDateLong(iso, lang = 'sv') {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(LOCALE[lang] || 'sv-SE', { weekday: 'short', day: 'numeric', month: 'long' });
}

export function fmtMoney(value, lang = 'sv') {
  const n = Number(value || 0);
  return new Intl.NumberFormat(LOCALE[lang] || 'sv-SE').format(n) + ' kr';
}

export function getWeekNumber(input) {
  const date = new Date(input);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

export function mondayOf(offsetWeeks = 0) {
  const d = today00();
  const diff = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - diff + offsetWeeks * 7);
  return d;
}

// Age targeting → display string
export function ageLabel(item, t) {
  if (item.ageAll) return t('age.all');
  const from = item.ageFrom;
  const to = item.ageTo;
  if (from != null && to != null) return `${from}–${to} ${t('age.years')}`;
  if (from != null) return `${from}+ ${t('age.years')}`;
  if (to != null) return `0–${to} ${t('age.years')}`;
  return t('age.all');
}

// Lifecycle predicates (operate on a publication `item`)
export function isOverdue(item) {
  if (item.status === 'publicerad') return false;
  if (!item.starts) return false;
  return atMidnight(item.starts) < today00();
}

export function isLive(item) {
  if (item.status !== 'publicerad') return false;
  const now = today00();
  const s = item.starts ? atMidnight(item.starts) : null;
  const e = item.ends ? atMidnight(item.ends) : null;
  if (s && s > now) return false;
  if (e && e < now) return false;
  return true;
}

export function isScheduled(item) {
  return item.status === 'publicerad' && item.starts && atMidnight(item.starts) > today00();
}

export function isExpired(item) {
  return item.status === 'publicerad' && item.ends && atMidnight(item.ends) < today00();
}

export function isToday(item) {
  if (!item.starts) return false;
  return atMidnight(item.starts).getTime() === today00().getTime();
}

export function isUpcoming(item, withinDays = 7) {
  if (!item.starts) return false;
  const s = atMidnight(item.starts);
  const now = today00();
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + withinDays);
  return s >= now && s <= horizon;
}
