import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { formatINR } from "../utils/format";
import { OTHER_COLOR } from "../utils/categories";
import { Card } from "./ui";

// Donut + ranked list (the list doubles as the legend and the table view)
function CategoryBreakdown({ spentByCategory, colorMap }) {
  // Selection comes from taps/clicks; hover only previews (desktop).
  // Kept separate so a tap on a phone (which also fires hover) selects first time.
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const active = selected ?? hovered;
  const toggle = (name) => setSelected((s) => (s === name ? null : name));
  // Touch screens have no real hover (it would "stick" after a tap)
  const canHover = typeof window !== "undefined" && window.matchMedia?.("(hover: hover)").matches;
  const rows = Object.entries(spentByCategory)
    .map(([name, value]) => ({ name, value, color: colorMap[name] ?? OTHER_COLOR }))
    .sort((a, b) => b.value - a.value);
  const total = rows.reduce((a, r) => a + r.value, 0);
  const focus = rows.find((r) => r.name === active);
  const pct = (v) => { const p = (v / total) * 100; return p > 0 && p < 1 ? "<1%" : `${Math.round(p)}%`; };

  if (total === 0) {
    return <Card className="p-6 text-sm text-ink-3 text-center">No spending in this pay cycle yet.</Card>;
  }

  return (
    <Card className="p-5">
      <div className="relative h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={rows} dataKey="value" nameKey="name" innerRadius="68%" outerRadius="100%"
              paddingAngle={rows.length > 1 ? 2 : 0} stroke="#111113" strokeWidth={2} isAnimationActive={false}
              onMouseEnter={(d) => canHover && setHovered(d.name)} onMouseLeave={() => setHovered(null)}
              onClick={(d) => toggle(d.name)}>
              {rows.map((r) => (
                <Cell key={r.name} fill={r.color} opacity={!active || active === r.name ? 1 : 0.35} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-[13px] text-ink-3">{focus ? focus.name : "Spent"}</p>
          <p className="tabular text-2xl font-bold">{formatINR(focus ? focus.value : total)}</p>
          {focus && <p className="text-[13px] text-ink-3 tabular">{pct(focus.value)}</p>}
        </div>
      </div>

      <ul className="mt-5 space-y-1">
        {rows.map((r) => (
          <li key={r.name}>
            <button onClick={() => toggle(r.name)}
              className={`w-full flex items-center gap-3 px-2 py-2 rounded-xl text-left transition ${active === r.name ? "bg-surface-2" : "hover:bg-surface-2/60"}`}>
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: r.color }} />
              <span className="flex-1 text-sm text-ink truncate">{r.name}</span>
              <span className="tabular text-[13px] text-ink-3 w-10 text-right">{pct(r.value)}</span>
              <span className="tabular text-sm font-medium w-24 text-right">{formatINR(r.value)}</span>
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default CategoryBreakdown;
