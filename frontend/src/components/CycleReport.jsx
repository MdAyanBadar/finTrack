import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { formatINR } from "../utils/format";
import { Card } from "./ui";

// Summary of the last finished pay cycle, compared with the one before it
function CycleReport({ history = [], budget = 0 }) {
  const finished = history.filter((c) => !c.isCurrent);
  const last = finished[finished.length - 1];
  const prev = finished[finished.length - 2];
  if (!last || last.count === 0) {
    return <Card className="p-6 text-sm text-ink-3 text-center">Your first report appears after your next salary day.</Card>;
  }

  const saved = Math.max(0, budget - last.spent);
  const change = prev && prev.spent > 0 ? ((last.spent - prev.spent) / prev.spent) * 100 : null;
  const top = Object.entries(last.byCategory).sort((a, b) => b[1] - a[1]).slice(0, 3);

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] text-ink-3">{last.label}</p>
          <p className="tabular text-3xl font-bold mt-1">{formatINR(last.spent)}</p>
          <p className="text-[13px] text-ink-3">spent</p>
        </div>
        {change !== null && (
          <span className={`inline-flex items-center gap-1 h-7 px-2.5 rounded-full text-xs font-semibold ${
            change > 0 ? "bg-neg/10 text-neg" : "bg-pos/10 text-pos"
          }`}>
            {change > 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {Math.abs(change).toFixed(0)}% vs previous
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 mt-5">
        {[
          ["Income", formatINR(last.income), last.income > 0 ? "text-pos" : ""],
          ["Saved", formatINR(saved), ""],
          ["Budget used", budget > 0 ? `${Math.round((last.spent / budget) * 100)}%` : "—", ""],
        ].map(([label, value, color]) => (
          <div key={label} className="bg-surface-2 rounded-2xl p-3">
            <p className="text-xs text-ink-3">{label}</p>
            <p className={`tabular text-[15px] font-semibold mt-0.5 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {top.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {top.map(([cat, amt]) => (
            <span key={cat} className="h-8 px-3 rounded-full bg-surface-2 text-[13px] text-ink-2 flex items-center gap-1.5">
              {cat} <span className="tabular text-ink font-medium">{formatINR(amt)}</span>
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}

export default CycleReport;
