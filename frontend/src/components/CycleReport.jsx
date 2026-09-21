import { FileBarChart, ArrowUpRight, ArrowDownRight } from "lucide-react";

// Summary of the last finished pay cycle, compared with the one before it
const CycleReport = ({ history = [], budget = 0, formatINR }) => {
  const finished = history.filter((c) => !c.isCurrent);
  const last = finished[finished.length - 1];
  const prev = finished[finished.length - 2];
  if (!last || last.count === 0) return null;

  const saved = Math.max(0, budget - last.spent);
  const change = prev && prev.spent > 0 ? ((last.spent - prev.spent) / prev.spent) * 100 : null;
  const top = Object.entries(last.byCategory).sort((a, b) => b[1] - a[1]).slice(0, 3);

  return (
    <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 sm:p-8 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
            <FileBarChart className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Last Cycle Report</h2>
            <p className="text-xs text-gray-500">{last.label}</p>
          </div>
        </div>
        {change !== null && (
          <span className={`inline-flex items-center gap-1 self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold border ${
            change > 0 ? "text-rose-400 bg-rose-500/10 border-rose-500/20" : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
          }`}>
            {change > 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            Spent {Math.abs(change).toFixed(0)}% {change > 0 ? "more" : "less"} than the cycle before
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          ["Income", formatINR(last.income), "text-emerald-400"],
          ["Spent", formatINR(last.spent), "text-rose-400"],
          ["Moved to savings", formatINR(saved), "text-purple-400"],
          ["Budget used", budget > 0 ? `${((last.spent / budget) * 100).toFixed(0)}%` : "—", "text-white"],
        ].map(([label, value, color]) => (
          <div key={label} className="p-4 bg-white/[0.03] rounded-2xl border border-white/[0.05]">
            <p className="text-[11px] text-gray-500 uppercase tracking-wide mb-1">{label}</p>
            <p className={`text-lg sm:text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {top.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Top categories</p>
          <div className="flex flex-wrap gap-2">
            {top.map(([cat, amt]) => (
              <span key={cat} className="px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-gray-300">
                {cat} <span className="text-white font-semibold">{formatINR(amt)}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CycleReport;
