import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatINR } from "../utils/format";
import { Card } from "./ui";
import { niceTicks, shortRupees } from "../utils/chart";

const IN = "#4ade80";
const OUT = "#8b5cf6";

function FlowTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-surface-3 rounded-xl p-3 shadow-2xl text-[13px] min-w-40">
      <p className="text-ink-3 mb-1.5">{d.label}</p>
      <p className="flex justify-between gap-5 text-ink-2"><span>Income</span><span className="tabular text-ink">{formatINR(d.income)}</span></p>
      <p className="flex justify-between gap-5 text-ink-2"><span>Spent</span><span className="tabular text-ink">{formatINR(d.spent)}</span></p>
      <p className="flex justify-between gap-5 text-ink-2 mt-1 pt-1 border-t border-line"><span>Net</span>
        <span className={`tabular ${d.income - d.spent >= 0 ? "text-pos" : "text-neg"}`}>{formatINR(d.income - d.spent, { sign: true })}</span></p>
    </div>
  );
}

// Income vs spending for each of the last 6 pay cycles
function CashFlowChart({ history = [] }) {
  const { data, ticks } = useMemo(() => {
    const data = history.slice(-6).map((c) => ({
      cycle: c.start.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      label: c.label + (c.isCurrent ? " (so far)" : ""),
      income: c.income,
      spent: c.spent,
    }));
    return { data, ticks: niceTicks(Math.max(0, ...data.flatMap((d) => [d.income, d.spent]))) };
  }, [history]);

  if (!data.some((d) => d.income || d.spent)) {
    return <Card className="p-6 text-sm text-ink-3 text-center">No income or spending recorded yet.</Card>;
  }

  return (
    <Card className="p-5">
      <div className="flex gap-4 mb-4 text-[13px] text-ink-2">
        <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: IN }} />Income</span>
        <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: OUT }} />Spent</span>
      </div>
      <div className="h-56 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2} barCategoryGap="28%">
            <CartesianGrid vertical={false} stroke="#26262b" />
            <XAxis dataKey="cycle" axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 11 }} dy={6} />
            <YAxis axisLine={false} tickLine={false} width={44} tick={{ fill: "#71717a", fontSize: 11 }}
              ticks={ticks} domain={[0, ticks[ticks.length - 1]]} tickFormatter={shortRupees} />
            <Tooltip content={<FlowTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <Bar dataKey="income" fill={IN} radius={[4, 4, 0, 0]} maxBarSize={18} isAnimationActive={false} />
            <Bar dataKey="spent" fill={OUT} radius={[4, 4, 0, 0]} maxBarSize={18} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export default CashFlowChart;
