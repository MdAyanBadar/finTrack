import prisma from "../prisma.js";
import { cycleFor, localDayNumber, occurrencesBetween } from "../utils/cycle.js";

/* =========================
   TODAY'S NUMBERS FOR ONE USER (same rules as the dashboard)
========================= */
export const financeToday = async (userId, timeZone, now = new Date()) => {
  const budgetRow = await prisma.budget.findUnique({ where: { userId } });
  const budget = budgetRow?.monthlyBudget ?? 0;
  const salaryDay = budgetRow?.salaryDay ?? 1;

  const today = localDayNumber(now, timeZone);
  const cycle = cycleFor(salaryDay, today);

  // Only this cycle's transactions (plus a day of slack for timezones)
  const since = new Date((cycle.start - 1) * 86400000);
  const [txs, recurring, limits] = await Promise.all([
    prisma.transaction.findMany({ where: { userId, date: { gte: since } } }),
    prisma.recurringTransaction.findMany({ where: { userId } }),
    prisma.categoryBudget.findMany({ where: { userId } }),
  ]);

  const cycleTx = txs.filter((t) => {
    const n = localDayNumber(t.date, timeZone);
    return n >= cycle.start && n < cycle.end;
  });
  const income = cycleTx.filter((t) => t.amount > 0).reduce((a, t) => a + t.amount, 0);
  const spent = cycleTx.filter((t) => t.amount < 0).reduce((a, t) => a - t.amount, 0);
  const balance = budget + income - spent;

  const upcomingDue = recurring
    .filter((r) => r.amount < 0)
    .reduce((a, r) => a + occurrencesBetween(r, today + 1, cycle.end, timeZone).length * -r.amount, 0);

  const todaySpent = cycleTx
    .filter((t) => t.amount < 0 && localDayNumber(t.date, timeZone) === today)
    .reduce((a, t) => a - t.amount, 0);

  const startOfDaySpendable = balance - upcomingDue + todaySpent;
  const dailyBudget = cycle.remainingDays > 0 && startOfDaySpendable > 0 ? startOfDaySpendable / cycle.remainingDays : 0;

  const spentByCategory = {};
  for (const t of cycleTx) if (t.amount < 0) spentByCategory[t.category] = (spentByCategory[t.category] || 0) - t.amount;

  return { today, cycle, budget, salaryDay, income, spent, balance, todaySpent, dailyBudget,
    leftToday: dailyBudget - todaySpent, spentByCategory, limits, recurring };
};
