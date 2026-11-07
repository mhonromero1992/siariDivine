/**
 * Liturgical dates and the Hour of Mercy, computed rather than typed in, so the site
 * never shows a stale year. All times are Philippine time (Asia/Manila, UTC+8, no DST).
 */

const MANILA_OFFSET_MIN = 8 * 60;
const DAY = 86400000;

/** Gregorian Easter Sunday (Meeus/Jones/Butcher). Returns a UTC-midnight Date. */
export function easter(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

const addDays = (date, n) => new Date(date.getTime() + n * DAY);

/** Third Sunday of January: the Feast of the Santo Niño in the Philippines. */
function thirdSundayOfJanuary(year) {
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const firstSunday = 1 + ((7 - jan1.getUTCDay()) % 7);
  return new Date(Date.UTC(year, 0, firstSunday + 14));
}

/** The observances the shrine's calendar follows, for one year. */
export function feastsOfYear(year) {
  const E = easter(year);
  return [
    {
      id: 'santo-nino',
      date: thirdSundayOfJanuary(year),
      name: 'Feast of the Santo Niño',
      note: 'Third Sunday of January in the Philippines; Santo Niño is the patron of the parish in Siari.',
    },
    { id: 'ash-wednesday', date: addDays(E, -46), name: 'Ash Wednesday', note: 'Lent begins.' },
    { id: 'palm-sunday', date: addDays(E, -7), name: 'Palm Sunday', note: 'Holy Week begins.' },
    {
      id: 'good-friday',
      date: addDays(E, -2),
      name: 'Good Friday',
      note: 'The Divine Mercy Novena begins today, at the hour of His death: three in the afternoon.',
    },
    { id: 'easter', date: E, name: 'Easter Sunday', note: 'The Resurrection of the Lord.' },
    {
      id: 'novena-end',
      date: addDays(E, 6),
      name: 'Last day of the Novena',
      note: 'The ninth day of the Divine Mercy Novena, the eve of Divine Mercy Sunday.',
    },
    {
      id: 'divine-mercy-sunday',
      date: addDays(E, 7),
      name: 'Divine Mercy Sunday',
      note: 'The Second Sunday of Easter, the shrine’s great feast.',
      major: true,
    },
    {
      id: 'faustina',
      date: new Date(Date.UTC(year, 9, 5)),
      name: 'St. Faustina Kowalska',
      note: 'Memorial of the Apostle of Divine Mercy, who died on this day in 1938.',
    },
    { id: 'christmas', date: new Date(Date.UTC(year, 11, 25)), name: 'Christmas Day', note: 'The Nativity of the Lord.' },
  ].sort((a, b) => a.date - b.date);
}

/** Current calendar day in Manila as a UTC-midnight Date. */
export function manilaToday(now = new Date()) {
  const local = new Date(now.getTime() + MANILA_OFFSET_MIN * 60000);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()));
}

/** The next `count` observances from today (inclusive), across the year boundary. */
export function upcomingFeasts(count = 6, now = new Date()) {
  const today = manilaToday(now);
  const y = today.getUTCFullYear();
  return [...feastsOfYear(y), ...feastsOfYear(y + 1)]
    .filter((f) => f.date >= today)
    .slice(0, count);
}

export function nextDivineMercySunday(now = new Date()) {
  return upcomingFeasts(12, now).find((f) => f.id === 'divine-mercy-sunday');
}

const fmt = (opts) => new Intl.DateTimeFormat('en-PH', { timeZone: 'UTC', ...opts });
export const formatLong = (d) => fmt({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d);
export const formatDay = (d) => fmt({ day: 'numeric' }).format(d);
export const formatMonth = (d) => fmt({ month: 'long' }).format(d);
export const formatWeekday = (d) => fmt({ weekday: 'long' }).format(d);
export const formatYear = (d) => fmt({ year: 'numeric' }).format(d);
export const isoDate = (d) => d.toISOString().slice(0, 10);

/**
 * The Hour of Mercy: three in the afternoon, Manila time.
 * Returns whether it is the hour now, and the minutes until the next one begins.
 */
export function hourOfMercy(now = new Date()) {
  const local = new Date(now.getTime() + MANILA_OFFSET_MIN * 60000);
  const minutesNow = local.getUTCHours() * 60 + local.getUTCMinutes();
  const start = 15 * 60;
  const inHour = minutesNow >= start && minutesNow < start + 60;
  let until = start - minutesNow;
  if (until <= 0) until += 24 * 60;
  return { inHour, minutesUntil: inHour ? 0 : until, manilaHour: local.getUTCHours(), manilaMinute: local.getUTCMinutes() };
}

export function describeWait(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}
