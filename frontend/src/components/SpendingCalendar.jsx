import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getPayCycle, isInCycle, toDateKey } from "../utils/payCycle";
import { formatINR } from "../utils/format";
import { Card, Sheet, IconButton } from "./ui";
import TransactionRow from "./TransactionRow";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

// Pay-cycle calendar: each day tinted by spend vs the daily budget
function SpendingCalendar({ transactions, salaryDay = 1, budget = 0, dailyBudget = 0, noSpendKeys = new Set() }) {
  const [offset, setOffset] = useState(0); // 0 = current cycle, -1 = previous...
  const [selected, setSelected] = useState(null);

  // Shift a mid-cycle date by whole months so clamped short months can't repeat a cycle
  const current = getPayCycle(salaryDay);
  const s = current.start;
  const cycle = getPayCycle(salaryDay, new Date(s.getFullYear(), s.getMonth() + offset, s.getDate() + 15));
  const isCurrent = offset === 0;
  const todayKey = toDateKey(new Date());

  const cycleTx = transactions.filter((t) => isInCycle(t.date, cycle));
  const byDay = {};
  for (const t of cycleTx) {
    if (t.amount >= 0) continue;
    const k = toDateKey(t.date);
    (byDay[k] ||= { total: 0, items: [] }).total -= t.amount;
    byDay[k].items.push(t);
  }
  const cycleSpent = Object.values(byDay).reduce((a, d) => a + d.total, 0);

  // Past cycles: compare to an even share of the budget
  const limit = isCurrent ? dailyBudget : budget > 0 ? budget / cycle.totalDays : dailyBudget;

  const earliest = transactions.reduce((m, t) => (new Date(t.date) < m ? new Date(t.date) : m), new Date());
  const canGoBack = cycle.start > earliest;

  const days = Array.from({ length: cycle.totalDays }, (_, i) =>
    new Date(cycle.start.getFullYear(), cycle.start.getMonth(), cycle.start.getDate() + i)
  );
  const blanks = cycle.start.getDay();

  const tone = (spent) => {
    if (!spent) return "";
    if (limit > 0 && spent > limit * 1.2) return "bg-neg/20 text-ink";
    if (limit > 0 && spent > limit) return "bg-warn/20 text-ink";
    return "bg-pos/15 text-ink";
  };

  const selectedData = selected ? byDay[toDateKey(selected)] : null;

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[15px] font-semibold">{cycle.label}</p>
          <p className="text-[13px] text-ink-3 tabular">
            {formatINR(cycleSpent)} spent{budget > 0 && ` of ${formatINR(budget)}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isCurrent && (
            <button onClick={() => setOffset(0)} className="h-9 px-3 rounded-full bg-surface-2 text-[13px] font-medium text-accent-ink">
              Today
            </button>
          )}
          <IconButton label="Previous pay cycle" onClick={() => setOffset((o) => o - 1)} disabled={!canGoBack}
            className="disabled:opacity-30"><ChevronLeft className="w-5 h-5" /></IconButton>
          <IconButton label="Next pay cycle" onClick={() => setOffset((o) => o + 1)} disabled={isCurrent}
            className="disabled:opacity-30"><ChevronRight className="w-5 h-5" /></IconButton>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center">
        {WEEKDAYS.map((d, i) => <div key={i} className="text-[11px] font-medium text-ink-3 pb-1">{d}</div>)}
        {Array.from({ length: blanks }, (_, i) => <div key={`b${i}`} />)}
        {days.map((day, i) => {
          const key = toDateKey(day);
          const data = byDay[key];
          const isToday = key === todayKey;
          const isFuture = isCurrent && day > new Date();
          const showMonth = i === 0 || day.getDate() === 1;
          return (
            <button key={key} disabled={!data}
              onClick={() => setSelected(day)}
              aria-label={`${day.toDateString()}${data ? `, spent ${formatINR(data.total)}` : ""}`}
              className={`relative aspect-square rounded-xl flex flex-col items-center justify-center transition
                ${data ? `${tone(data.total)} active:scale-95` : "bg-surface-2/50"}
                ${isToday ? "ring-2 ring-accent" : ""}
                ${isFuture ? "opacity-40" : ""}`}>
              {showMonth && (
                <span className="absolute top-0.5 left-1 text-[8px] font-bold uppercase text-accent-ink">
                  {day.toLocaleString("en-IN", { month: "short" })}
                </span>
              )}
              <span className={`text-[13px] font-semibold ${data ? "" : "text-ink-3"}`}>{day.getDate()}</span>
              {!data && noSpendKeys.has(key) && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-pos" aria-label="No-spend day" />
              )}
              {data && (
                <span className="hidden sm:block text-[10px] text-ink-2 tabular leading-tight">
                  {data.total >= 1000 ? `₹${(data.total / 1000).toFixed(1)}k` : `₹${Math.round(data.total)}`}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-4 mt-4 text-[11px] text-ink-3">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-pos/40" />Within budget</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-warn/50" />Over</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-neg/50" />20%+ over</span>
        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-pos" />No spend</span>
      </div>

      <Sheet open={Boolean(selectedData)} onClose={() => setSelected(null)}
        title={selected ? selected.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" }) : ""}>
        {selectedData && (
          <>
            <p className="tabular text-3xl font-bold">{formatINR(selectedData.total)}</p>
            <p className="text-[13px] text-ink-3 mb-4">
              spent{limit > 0 && ` · daily budget ${formatINR(Math.floor(limit))}`}
            </p>
            <div className="-mx-4 divide-y divide-line/60">
              {selectedData.items.map((t) => (
                <TransactionRow key={t.id} t={t}
                  meta={`${t.category} · ${new Date(t.date).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}`} />
              ))}
            </div>
          </>
        )}
      </Sheet>
    </Card>
  );
}

export default SpendingCalendar;
