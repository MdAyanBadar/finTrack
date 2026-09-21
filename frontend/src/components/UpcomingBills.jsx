import { CalendarClock, Repeat } from "lucide-react";

// Recurring items still to come before the next salary day
const UpcomingBills = ({ upcoming = [], cycle, balance = 0, formatINR }) => {
  const dueOut = upcoming.filter((u) => u.amount < 0).reduce((a, u) => a + Math.abs(u.amount), 0);
  const nextSalary = cycle.end.toLocaleDateString("en-IN", { day: "numeric", month: "short" });

  return (
    <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center border border-orange-500/20">
          <CalendarClock className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Upcoming Bills</h2>
          <p className="text-xs text-gray-500">Before your salary on {nextSalary}</p>
        </div>
      </div>

      {upcoming.length === 0 ? (
        <p className="text-sm text-gray-500 py-6 text-center">
          Nothing else due before salary. Add rent, EMIs and subscriptions under
          Budget &amp; Goals → Recurring.
        </p>
      ) : (
        <ul className="space-y-3">
          {upcoming.map((u) => (
            <li key={`${u.id}-${u.date.getTime()}`} className="flex items-center justify-between p-3 bg-white/[0.03] rounded-xl border border-white/[0.05]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="text-center w-11 shrink-0">
                  <p className="text-lg font-black text-white leading-none">{u.date.getDate()}</p>
                  <p className="text-[10px] font-bold uppercase text-gray-500">
                    {u.date.toLocaleString("en-IN", { month: "short" })}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{u.title}</p>
                  <p className="text-[11px] text-gray-500 flex items-center gap-1">
                    <Repeat className="w-3 h-3" /> {u.category}
                  </p>
                </div>
              </div>
              <p className={`font-bold text-sm shrink-0 ${u.amount < 0 ? "text-rose-400" : "text-emerald-400"}`}>
                {u.amount < 0 ? "-" : "+"}{formatINR(Math.abs(u.amount))}
              </p>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 pt-4 border-t border-white/[0.06] grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wide">Still due</p>
          <p className="text-rose-400 font-bold">{formatINR(dueOut)}</p>
        </div>
        <div className="text-right">
          <p className="text-gray-500 text-xs uppercase tracking-wide">Left after bills</p>
          <p className={`font-bold ${balance - dueOut >= 0 ? "text-white" : "text-rose-400"}`}>
            {formatINR(balance - dueOut)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default UpcomingBills;
