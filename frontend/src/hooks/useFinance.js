import { useMemo } from "react";
import { useTransactions } from "../api/transactionStore";
import { useResource } from "../api/resourceStore";
import {
  getPayCycle, isInCycle, toDateKey, getCycleHistory, getSavedFromCycles, getUpcoming, getStreaks,
} from "../utils/payCycle";
import { categoryColorMap } from "../utils/categories";

const BUDGET_FALLBACK = { monthlyBudget: 0, savingsGoal: 0, salaryDay: 1 };

/* =========================
   EVERYTHING THE DASHBOARD / INSIGHTS NEED, IN ONE PLACE
   All "this cycle" figures cover salary day -> day before next salary.
========================= */
export function useFinance() {
  const { transactions, loading: txLoading } = useTransactions();
  const { data: budgetRes, loading: budgetLoading } = useResource("/budget", BUDGET_FALLBACK);
  const { data: recurring } = useResource("/recurring", []);
  const { data: limits } = useResource("/budget/categories", []);

  const budget = budgetRes?.monthlyBudget ?? 0;
  const goal = budgetRes?.savingsGoal ?? 0;
  const salaryDay = budgetRes?.salaryDay ?? 1;

  return useMemo(() => {
    const now = new Date();
    const cycle = getPayCycle(salaryDay, now);

    // Money owed back to you (and its repayment when it arrives) is not your
    // own spending, so it stays out of every budget figure.
    const personal = transactions.filter((t) => !t.owedBy && !t.repaymentFor);
    // Someone owes you either a whole transaction, or their share of a split bill
    const owedItems = [
      ...transactions
        .filter((t) => t.owedBy && !t.settledAt)
        .map((t) => ({
          key: t.id, txId: t.id, shareId: null, person: t.owedBy,
          amount: Math.abs(t.amount), title: t.title, category: t.category, date: t.date,
        })),
      ...transactions.flatMap((t) =>
        (t.shares ?? [])
          .filter((s) => !s.settledAt)
          .map((s) => ({
            key: s.id, txId: t.id, shareId: s.id, person: s.person,
            amount: s.amount, title: t.title, category: t.category, date: t.date, split: true,
          }))
      ),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));
    const owedTotal = owedItems.reduce((a, t) => a + t.amount, 0);

    const cycleTx = personal.filter((t) => isInCycle(t.date, cycle));
    const history = getCycleHistory(personal, salaryDay, now);

    const income = cycleTx.filter((t) => t.amount > 0).reduce((a, t) => a + t.amount, 0);
    const spent = cycleTx.filter((t) => t.amount < 0).reduce((a, t) => a - t.amount, 0);
    // Budget is the starting balance for the cycle
    const balance = budget + income - spent;

    const upcoming = getUpcoming(recurring, cycle.end, now);
    const nextCycle = getPayCycle(salaryDay, cycle.end);
    const afterSalary = getUpcoming(recurring, nextCycle.end, now).filter((u) => u.date >= cycle.end);
    const upcomingDue = upcoming.filter((u) => u.amount < 0).reduce((a, u) => a - u.amount, 0);

    const todayKey = toDateKey(now);
    const todaySpent = cycleTx
      .filter((t) => t.amount < 0 && toDateKey(t.date) === todayKey)
      .reduce((a, t) => a - t.amount, 0);

    // Money promised to bills before salary isn't free to spend
    const spendable = balance - upcomingDue;
    // Today's allowance is fixed at the start of the day (today's spending added
    // back), so each purchase comes straight off it and it can reach 0 or go
    // negative. Overspending shrinks tomorrow's allowance instead.
    const startOfDaySpendable = spendable + todaySpent;
    const dailyBudget =
      cycle.remainingDays > 0 && startOfDaySpendable > 0 ? startOfDaySpendable / cycle.remainingDays : 0;
    const leftToday = dailyBudget - todaySpent;

    const spentByCategory = {};
    for (const t of cycleTx) {
      if (t.amount < 0) spentByCategory[t.category || "General"] = (spentByCategory[t.category || "General"] || 0) - t.amount;
    }

    // Part of this cycle's spending that went into a savings pot (BC/chit)
    const savedToPots = cycleTx
      .filter((t) => t.amount < 0 && t.potId)
      .reduce((a, t) => a - t.amount, 0);

    const savings = getSavedFromCycles(history, budget);
    const streaks = getStreaks(personal, salaryDay, budget, now);

    return {
      loading: txLoading || budgetLoading,
      transactions, personal, cycleTx, history, cycle, nextCycle, owedItems, owedTotal,
      budget, goal, salaryDay, recurring, limits,
      income, spent, balance, upcoming, afterSalary, upcomingDue, spendable,
      dailyBudget, todaySpent, leftToday, spentByCategory, savings, streaks, savedToPots,
      colorMap: categoryColorMap(personal),
      dayOfCycle: cycle.totalDays - cycle.remainingDays + 1,
    };
  }, [transactions, recurring, limits, budget, goal, salaryDay, txLoading, budgetLoading]);
}
