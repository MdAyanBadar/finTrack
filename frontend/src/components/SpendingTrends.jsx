import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

// Categorical slots validated against the dark surface (#0f172a); fixed order, never cycled
const SERIES_COLORS = ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181"];
const MAX_CYCLES = 6;

// Round axis steps to 1 / 2 / 2.5 / 5 x 10^n so ticks land on even amounts
const niceTicks = (max, count = 4) => {
  if (max <= 0) return [0];
  const raw = max / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw);
  return Array.from({ length: Math.ceil(max / step) + 1 }, (_, i) => i * step);
};

// Spending per category across recent pay cycles
const SpendingTrends = ({ history = [], formatINR }) => {
  const { data, categories, ticks } = useMemo(() => {
    const recent = history.slice(-MAX_CYCLES);
    const totals = {};
    recent.forEach((c) =>
      Object.entries(c.byCategory).forEach(([cat, v]) => (totals[cat] = (totals[cat] || 0) + v))
    );
    // Top 5 over the window; order (and so colour) is fixed for the whole chart
    const categories = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, SERIES_COLORS.length).map(([c]) => c);
    const data = recent.map((c) => ({
      cycle: c.start.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      label: c.label + (c.isCurrent ? " (so far)" : ""),
      ...Object.fromEntries(categories.map((cat) => [cat, c.byCategory[cat] || 0])),
    }));
    const max = Math.max(0, ...data.flatMap((d) => categories.map((c) => d[c])));
    return { data, categories, ticks: niceTicks(max) };
  }, [history]);

  const TrendTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-slate-900/95 border border-white/10 rounded-xl p-3 shadow-2xl text-sm">
        <p className="text-gray-400 text-xs mb-2">{payload[0].payload.label}</p>
        {[...payload].sort((a, b) => b.value - a.value).map((p) => (
          <p key={p.dataKey} className="flex items-center justify-between gap-6 text-gray-300">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
              {p.dataKey}
            </span>
            <span className="text-white font-semibold">{formatINR(p.value)}</span>
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 sm:p-8 mt-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
          <TrendingUp className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Spending Trends</h2>
          <p className="text-xs text-gray-500">Top categories over the last {MAX_CYCLES} pay cycles</p>
        </div>
      </div>

      {data.length < 2 || categories.length === 0 ? (
        <p className="text-sm text-gray-500 py-10 text-center">
          Trends appear once you have at least two pay cycles of spending.
        </p>
      ) : (
        <>
          {/* Legend */}
          <div className="flex flex-wrap gap-x-5 gap-y-2 mb-4">
            {categories.map((cat, i) => (
              <span key={cat} className="flex items-center gap-2 text-sm text-gray-300">
                <span className="w-3 h-[2px] rounded" style={{ background: SERIES_COLORS[i] }} />
                {cat}
              </span>
            ))}
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#ffffff" opacity={0.05} />
                <XAxis dataKey="cycle" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }}
                  ticks={ticks} domain={[0, ticks[ticks.length - 1]]}
                  tickFormatter={(v) => (v >= 1000 ? `₹${+(v / 1000).toFixed(1)}k` : `₹${v}`)} />
                <Tooltip content={<TrendTooltip />} cursor={{ stroke: "rgba(255,255,255,0.2)", strokeWidth: 1 }} />
                {categories.map((cat, i) => (
                  <Line key={cat} type="monotone" dataKey={cat} stroke={SERIES_COLORS[i]} strokeWidth={2}
                    dot={{ r: 4, fill: SERIES_COLORS[i], stroke: "#0f172a", strokeWidth: 2 }}
                    activeDot={{ r: 6, stroke: "#0f172a", strokeWidth: 2 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};

export default SpendingTrends;
