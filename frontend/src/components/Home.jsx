import { Link } from "react-router-dom";
import { AlertTriangle, ArrowLeftRight, Repeat, Flame, Leaf } from "lucide-react";
import { useFinance } from "../hooks/useFinance";
import { formatINR, shortDate, greeting } from "../utils/format";
import { openQuickAdd } from "../utils/quickAdd";
import { useResource } from "../api/resourceStore";
import { Page, Card, Section, ProgressBar, EmptyState, Button, Skeleton } from "./ui";
import { Avatar } from "./AppShell";
import TransactionRow from "./TransactionRow";
import OwedCard from "./OwedCard";

function Home() {
  const f = useFinance();
  const { data: user } = useResource("/users/me", null);

  if (f.loading) {
    return (
      <Page>
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-56 mb-4" />
        <Skeleton className="h-24 mb-4" />
        <Skeleton className="h-64" />
      </Page>
    );
  }

  const {
    cycle, dailyBudget, todaySpent, leftToday, spent, balance, income, budget, upcoming, afterSalary,
    limits, spentByCategory, goal, savings, cycleTx, transactions, dayOfCycle, streaks, owedItems, owedTotal,
  } = f;

  const cycleProgress = (dayOfCycle / cycle.totalDays) * 100;
  const todayProgress = dailyBudget > 0 ? (todaySpent / dailyBudget) * 100 : todaySpent > 0 ? 100 : 0;
  const nextBills = [...upcoming, ...afterSalary].slice(0, 3);
  const recent = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  const limitRows = limits
    .map((l) => ({ ...l, spent: spentByCategory[l.category] || 0 }))
    .map((l) => ({ ...l, pct: l.limit > 0 ? (l.spent / l.limit) * 100 : 0 }))
    .sort((a, b) => b.pct - a.pct);
  const warnings = limitRows.filter((l) => l.pct >= 80);

  return (
    <Page>
      {/* Greeting */}
      <header className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-ink-3">{greeting()}</p>
          <h1 className="text-2xl font-bold tracking-tight">{user?.name?.split(" ")[0] || "Welcome"}</h1>
        </div>
        <div className="sm:hidden"><Avatar /></div>
      </header>

      {/* Hero: the one number that matters today */}
      <Card className="p-6">
        <p className="text-sm font-medium text-ink-2">{leftToday < 0 ? "Over today's budget" : "Safe to spend today"}</p>
        <p className={`tabular text-[52px] leading-none font-bold tracking-tight mt-2 ${leftToday < 0 ? "text-neg" : "text-ink"}`}>
          {leftToday < 0 ? formatINR(Math.ceil(-leftToday)) : formatINR(Math.floor(leftToday))}
        </p>
        <div className="mt-4">
          <ProgressBar value={todayProgress} tone={todayProgress > 100 ? "neg" : todayProgress > 80 ? "warn" : "pos"} />
          <p className="text-[13px] text-ink-3 mt-2 tabular">
            {formatINR(todaySpent)} spent of {formatINR(Math.floor(dailyBudget))} today
          </p>
        </div>

        <div className="mt-6 pt-5 border-t border-line/70">
          <div className="flex items-center justify-between text-[13px] mb-2">
            <span className="text-ink-2">Day {dayOfCycle} of {cycle.totalDays}</span>
            <span className="text-ink-3">
              {cycle.remainingDays} {cycle.remainingDays === 1 ? "day" : "days"} to salary · {shortDate(cycle.end)}
            </span>
          </div>
          <ProgressBar value={cycleProgress} tone="ink" />
        </div>
      </Card>

      {/* Cycle numbers */}
      <div className="grid grid-cols-3 gap-3 mt-3">
        {[
          ["Spent", formatINR(spent), "text-ink"],
          ["Left", formatINR(balance), balance < 0 ? "text-neg" : "text-ink"],
          ["Income", formatINR(income), income > 0 ? "text-pos" : "text-ink"],
        ].map(([label, value, color]) => (
          <Card key={label} className="p-4">
            <p className="text-[13px] text-ink-3">{label}</p>
            <p className={`tabular text-[17px] font-semibold mt-1 truncate ${color}`}>{value}</p>
          </Card>
        ))}
      </div>
      {/* Streaks */}
      {(streaks.underBudget > 0 || streaks.noSpendDays > 0) && (
        <div className="grid grid-cols-2 gap-3 mt-3">
          <Card className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-warn/10 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 text-warn" />
            </div>
            <div className="min-w-0">
              <p className="tabular text-xl font-bold leading-tight">{streaks.underBudget}</p>
              <p className="text-[12px] text-ink-3 leading-tight">{streaks.underBudget === 1 ? "day" : "days"} under budget</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-pos/10 flex items-center justify-center shrink-0">
              <Leaf className="w-5 h-5 text-pos" />
            </div>
            <div className="min-w-0">
              <p className="tabular text-xl font-bold leading-tight">{streaks.noSpendDays}</p>
              <p className="text-[12px] text-ink-3 leading-tight">no-spend {streaks.noSpendDays === 1 ? "day" : "days"} this cycle</p>
            </div>
          </Card>
        </div>
      )}

      {budget === 0 && (
        <Link to="/budget-goals" className="block mt-3 text-[13px] text-accent-ink px-1">
          Set your budget and salary day in Plan →
        </Link>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <Card className="mt-4 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warn shrink-0 mt-0.5" />
          <div className="text-sm">
            {warnings.map((w) => (
              <p key={w.category} className="text-ink-2">
                <span className="text-ink font-medium">{w.category}</span>{" "}
                {w.pct > 100 ? `is ${formatINR(w.spent - w.limit)} over its limit` : `is at ${Math.round(w.pct)}% of its limit`}
              </p>
            ))}
          </div>
        </Card>
      )}

      {owedItems.length > 0 && <OwedCard items={owedItems} total={owedTotal} />}

      {/* Upcoming bills */}
      {nextBills.length > 0 && (
        <Section title="Upcoming" action="Manage" to="/budget-goals">
          <Card className="divide-y divide-line/60 overflow-hidden">
            {nextBills.map((u) => (
              <div key={`${u.id}-${u.date.getTime()}`} className="flex items-center gap-3.5 px-4 py-3">
                <div className="w-11 text-center shrink-0">
                  <p className="text-lg font-bold leading-none tabular">{u.date.getDate()}</p>
                  <p className="text-[11px] font-medium uppercase text-ink-3 mt-0.5">
                    {u.date.toLocaleString("en-IN", { month: "short" })}
                  </p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium truncate">{u.title}</p>
                  <p className="text-[13px] text-ink-3 flex items-center gap-1.5">
                    <Repeat className="w-3 h-3" /> {u.date >= cycle.end ? "After salary" : "Before salary"}
                  </p>
                </div>
                <span className={`tabular text-[15px] font-semibold ${u.amount > 0 ? "text-pos" : "text-ink"}`}>
                  {formatINR(u.amount, { sign: u.amount > 0 })}
                </span>
              </div>
            ))}
          </Card>
        </Section>
      )}

      {/* Category limits */}
      {limitRows.length > 0 && (
        <Section title="Limits this cycle" action="Edit" to="/budget-goals">
          <Card className="p-4 space-y-4">
            {limitRows.map((l) => (
              <div key={l.category}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="font-medium">{l.category}</span>
                  <span className="tabular text-ink-3">
                    <span className="text-ink">{formatINR(l.spent)}</span> / {formatINR(l.limit)}
                  </span>
                </div>
                <ProgressBar value={l.pct} tone={l.pct >= 100 ? "neg" : l.pct >= 80 ? "warn" : "accent"} />
              </div>
            ))}
          </Card>
        </Section>
      )}

      {/* Savings goal */}
      {goal > 0 && (
        <Section title="Savings goal" action="Edit" to="/budget-goals">
          <Card className="p-4">
            <div className="flex items-baseline justify-between mb-2">
              <span className="tabular text-xl font-bold">{formatINR(savings)}</span>
              <span className="tabular text-sm text-ink-3">of {formatINR(goal)}</span>
            </div>
            <ProgressBar value={(savings / goal) * 100} tone="pos" />
            <p className="text-[13px] text-ink-3 mt-2">Unspent budget moves here at the end of each pay cycle.</p>
          </Card>
        </Section>
      )}

      {/* Recent */}
      <Section title="Recent" action={recent.length ? "See all" : undefined} to="/transactions">
        <Card className="divide-y divide-line/60 overflow-hidden">
          {recent.length === 0 ? (
            <EmptyState icon={ArrowLeftRight} title="No transactions yet"
              text="Add your first expense or income to get started."
              action={<Button onClick={openQuickAdd}>Add transaction</Button>} />
          ) : (
            recent.map((t) => (
              <TransactionRow key={t.id} t={t}
                meta={`${t.category} · ${new Date(t.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`} />
            ))
          )}
        </Card>
        {cycleTx.length > 0 && (
          <p className="text-[13px] text-ink-3 mt-3 px-1">{cycleTx.length} transactions this pay cycle · {cycle.label}</p>
        )}
      </Section>
    </Page>
  );
}

export default Home;
