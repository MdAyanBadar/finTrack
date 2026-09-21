import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatINR } from "../utils/format";
import { OTHER_COLOR } from "../utils/categories";
import { Card } from "./ui";
import { niceTicks, shortRupees } from "../utils/chart";

const MAX_CYCLES = 6;
const MAX_SERIES = 5;

function TrendTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-3 rounded-xl p-3 shadow-2xl text-[13px] min-w-40">
      <p className="text-ink-3 mb-1.5">{payload[0].payload.label}</p>
      {[...payload].sort((a, b) => b.value - a.value).map((p) => (
        <p key={p.dataKey} className="flex items-center justify-between gap-5 text-ink-2">
          <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: p.color }} />{p.dataKey}</span>
          <span className="tabular text-ink font-medium">{formatINR(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

// Spending per category across recent pay cycles
function SpendingTrends({ history = [], colorMap = {} }) {
  const { data, categories, ticks } = useMemo(() => {
    const recent = history.slice(-MAX_CYCLES);
    const totals = {};
    recent.forEach((c) => Object.entries(c.byCategory).forEach(([k, v]) => (totals[k] = (totals[k] || 0) + v)));
    const categories = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, MAX_SERIES).map(([k]) => k);
    const data = recent.map((c) => ({
      cycle: c.start.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      label: c.label + (c.isCurrent ? " (so far)" : ""),
      ...Object.fromEntries(categories.map((k) => [k, c.byCategory[k] || 0])),
    }));
    const max = Math.max(0, ...data.flatMap((d) => categories.map((k) => d[k])));
    return { data, categories, ticks: niceTicks(max) };
  }, [history]);

  if (data.length < 2 || categories.length === 0) {
    return <Card className="p-6 text-sm text-ink-3 text-center">Trends appear once you have two pay cycles of spending.</Card>;
  }

  return (
    <Card className="p-5">
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-4">
        {categories.map((k) => (
          <span key={k} className="flex items-center gap-2 text-[13px] text-ink-2">
            <span className="w-3 h-[2px] rounded" style={{ background: colorMap[k] ?? OTHER_COLOR }} />{k}
          </span>
        ))}
      </div>
      <div className="h-56 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#26262b" />
            <XAxis dataKey="cycle" axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 11 }} dy={6} />
            <YAxis axisLine={false} tickLine={false} width={44} tick={{ fill: "#71717a", fontSize: 11 }}
              ticks={ticks} domain={[0, ticks[ticks.length - 1]]} tickFormatter={shortRupees} />
            <Tooltip content={<TrendTooltip />} cursor={{ stroke: "#3f3f46", strokeWidth: 1 }} />
            {categories.map((k) => (
              <Line key={k} type="monotone" dataKey={k} stroke={colorMap[k] ?? OTHER_COLOR} strokeWidth={2}
                dot={{ r: 4, fill: colorMap[k] ?? OTHER_COLOR, stroke: "#111113", strokeWidth: 2 }}
                activeDot={{ r: 6, stroke: "#111113", strokeWidth: 2 }} isAnimationActive={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export default SpendingTrends;
