/* =========================
   PAY CYCLE HELPERS
   A cycle runs from salary day up to (not including) the next salary day.
   If the salary day doesn't exist in a month (e.g. 31 in Feb),
   the last day of that month is used instead.
========================= */

const DAY_MS = 24 * 60 * 60 * 1000;

const salaryDateIn = (year, month, salaryDay) => {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(salaryDay, lastDay));
};

// Start of the pay cycle that contains `date`
export const getCycleStart = (date, salaryDay = 1) => {
  const d = new Date(date);
  const thisMonth = salaryDateIn(d.getFullYear(), d.getMonth(), salaryDay);
  return d >= thisMonth
    ? thisMonth
    : salaryDateIn(d.getFullYear(), d.getMonth() - 1, salaryDay);
};

export const getPayCycle = (salaryDay = 1, now = new Date()) => {
  const start = getCycleStart(now, salaryDay);
  const end = salaryDateIn(start.getFullYear(), start.getMonth() + 1, salaryDay);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return {
    start,
    end, // exclusive: next salary day
    totalDays: Math.round((end - start) / DAY_MS),
    remainingDays: Math.round((end - today) / DAY_MS), // includes today
    label: formatCycleLabel(start, end),
  };
};

export const isInCycle = (dateValue, cycle) => {
  const d = new Date(dateValue);
  return d >= cycle.start && d < cycle.end;
};

// Local YYYY-MM-DD (toISOString would shift dates across timezones)
export const toDateKey = (dateValue) => {
  const d = new Date(dateValue);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const formatCycleLabel = (start, end) => {
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate() - 1);
  const fmt = (d) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  return `${fmt(start)} – ${fmt(last)} ${last.getFullYear()}`;
};

/* =========================
   CYCLE HISTORY
   One entry per pay cycle from the first transaction up to the current cycle
   (empty cycles in between are kept so charts have a continuous axis).
========================= */
export const getCycleHistory = (transactions, salaryDay = 1, now = new Date()) => {
  const current = getPayCycle(salaryDay, now);
  if (transactions.length === 0) return [{ ...current, income: 0, spent: 0, byCategory: {}, count: 0, isCurrent: true }];

  const earliest = transactions.reduce(
    (min, t) => (new Date(t.date) < min ? new Date(t.date) : min),
    current.start
  );

  // Walk forward one cycle at a time from a date mid-way through the first cycle
  const first = getCycleStart(earliest, salaryDay);
  const cycles = [];
  for (let i = 0; i < 120; i++) {
    const c = getPayCycle(salaryDay, new Date(first.getFullYear(), first.getMonth() + i, first.getDate() + 15));
    cycles.push({ ...c, income: 0, spent: 0, byCategory: {}, count: 0, isCurrent: false });
    if (c.start.getTime() === current.start.getTime()) break;
  }
  cycles[cycles.length - 1].isCurrent = true;

  const byKey = new Map(cycles.map((c) => [toDateKey(c.start), c]));
  for (const t of transactions) {
    const c = byKey.get(toDateKey(getCycleStart(t.date, salaryDay)));
    if (!c) continue;
    c.count += 1;
    if (t.amount > 0) c.income += t.amount;
    else {
      const amt = Math.abs(t.amount);
      c.spent += amt;
      const cat = t.category || "General";
      c.byCategory[cat] = (c.byCategory[cat] || 0) + amt;
    }
  }
  return cycles;
};

// Unspent budget from each finished cycle moves into savings.
// Cycles with no transactions at all are skipped (app not in use then).
export const getSavedFromCycles = (history, budget) =>
  history
    .filter((c) => !c.isCurrent && c.count > 0)
    .reduce((acc, c) => acc + Math.max(0, budget - c.spent), 0);

/* =========================
   UPCOMING RECURRING ITEMS
   Occurrences after today and before `until` (e.g. next salary day).
========================= */
export const getUpcoming = (recurring, until, now = new Date()) => {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const items = [];

  for (const r of recurring) {
    const created = new Date(r.startDate);
    const startDay = new Date(created.getFullYear(), created.getMonth(), created.getDate());
    for (let m = 0; m < 3; m++) {
      const lastDay = new Date(today.getFullYear(), today.getMonth() + m + 1, 0).getDate();
      const date = new Date(today.getFullYear(), today.getMonth() + m, Math.min(r.dayOfMonth, lastDay));
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (date <= today || date < startDay) continue;
      if (date >= until) break;
      if (r.endMonth && month > r.endMonth) break;
      items.push({ ...r, date });
    }
  }
  return items.sort((a, b) => a.date - b.date);
};
