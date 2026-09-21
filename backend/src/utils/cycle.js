/* =========================
   SERVER-SIDE PAY CYCLE MATHS (timezone aware)
   Mirrors frontend/src/utils/payCycle.js. Dates are handled as local
   calendar days in the user's timezone, as day numbers since 1970.
========================= */

const DAY = 86400000;

// Local calendar date of `date` in `timeZone` -> { y, m (1-12), d }
export const localParts = (date, timeZone) => {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" })
    .formatToParts(date);
  const get = (t) => Number(parts.find((p) => p.type === t).value);
  return { y: get("year"), m: get("month"), d: get("day") };
};

export const dayNumber = (y, m, d) => Date.UTC(y, m - 1, d) / DAY;
export const keyOf = (n) => new Date(n * DAY).toISOString().slice(0, 10);
export const localDayNumber = (date, timeZone) => {
  const { y, m, d } = localParts(date, timeZone);
  return dayNumber(y, m, d);
};

const daysInMonth = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();
// Salary day in a month, clamped to the month's last day. m may overflow (13 -> Jan next year)
const salaryDayNumber = (y, m, salaryDay) => {
  const d = new Date(Date.UTC(y, m - 1, 1));
  const yy = d.getUTCFullYear();
  const mm = d.getUTCMonth() + 1;
  return dayNumber(yy, mm, Math.min(salaryDay, daysInMonth(yy, mm)));
};

// Pay cycle containing `today` (a local day number)
export const cycleFor = (salaryDay, today) => {
  const t = new Date(today * DAY);
  const y = t.getUTCFullYear();
  const m = t.getUTCMonth() + 1;
  const thisMonth = salaryDayNumber(y, m, salaryDay);
  const [sy, sm] = today >= thisMonth ? [y, m] : [y, m - 1];
  const start = salaryDayNumber(sy, sm, salaryDay);
  const s = new Date(start * DAY);
  const end = salaryDayNumber(s.getUTCFullYear(), s.getUTCMonth() + 2, salaryDay); // exclusive
  return { start, end, totalDays: end - start, remainingDays: end - today };
};

// Day numbers on which a monthly recurring item falls between `from` and `to` (exclusive)
export const occurrencesBetween = (item, from, to, timeZone) => {
  const out = [];
  const startDay = localDayNumber(item.startDate, timeZone);
  const f = new Date(from * DAY);
  for (let i = 0; i < 3; i++) {
    const y = f.getUTCFullYear();
    const m = f.getUTCMonth() + 1 + i;
    const n = salaryDayNumber(y, m, item.dayOfMonth);
    const ym = keyOf(n).slice(0, 7);
    if (item.endMonth && ym > item.endMonth) break;
    if (n >= from && n < to && n >= startDay) out.push(n);
  }
  return out;
};
