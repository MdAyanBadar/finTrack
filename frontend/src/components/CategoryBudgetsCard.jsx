import { Link } from "react-router-dom";
import { Gauge, AlertTriangle } from "lucide-react";

// This cycle's spending against each category limit
const CategoryBudgetsCard = ({ limits = [], spentByCategory = {}, formatINR }) => {
  const rows = limits
    .map((l) => {
      const spent = spentByCategory[l.category] || 0;
      return { ...l, spent, pct: l.limit > 0 ? (spent / l.limit) * 100 : 0 };
    })
    .sort((a, b) => b.pct - a.pct);

  const status = (pct) =>
    pct > 100
      ? { bar: "bg-rose-500", text: "text-rose-400", label: "Over limit" }
      : pct === 100
        ? { bar: "bg-rose-500", text: "text-rose-400", label: "Limit reached" }
        : pct >= 80
        ? { bar: "bg-amber-500", text: "text-amber-400", label: "Almost there" }
        : { bar: "bg-emerald-500", text: "text-emerald-400", label: "On track" };

  return (
    <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
          <Gauge className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Category Budgets</h2>
          <p className="text-xs text-gray-500">This pay cycle</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-gray-500 py-6 text-center">
          No category limits yet.{" "}
          <Link to="/budget-goals" className="text-indigo-400 hover:underline">Set some in Budget &amp; Goals</Link>.
        </p>
      ) : (
        <ul className="space-y-4">
          {rows.map((r) => {
            const s = status(r.pct);
            return (
              <li key={r.category}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-white font-semibold flex items-center gap-1.5">
                    {r.pct >= 80 && <AlertTriangle className={`w-3.5 h-3.5 ${s.text}`} aria-hidden />}
                    {r.category}
                  </span>
                  <span className="text-gray-400">
                    <span className="text-white font-semibold">{formatINR(r.spent)}</span> / {formatINR(r.limit)}
                  </span>
                </div>
                <div className="w-full h-2 bg-white/[0.05] rounded-full overflow-hidden">
                  <div className={`h-2 rounded-full ${s.bar} transition-all duration-500`} style={{ width: `${Math.min(r.pct, 100)}%` }} />
                </div>
                <p className={`text-[11px] mt-1 ${s.text}`}>
                  {s.label}
                  {r.pct > 100 && ` · ${formatINR(r.spent - r.limit)} over`}
                  {r.pct < 100 && ` · ${formatINR(r.limit - r.spent)} left`}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default CategoryBudgetsCard;
