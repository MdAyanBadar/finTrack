import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

function Insights({ budget = 0, goal = 0, transactions = [] }) {
  const insights = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    const totalIncome = transactions
      .filter((t) => t.amount > 0)
      .reduce((acc, t) => acc + t.amount, 0);

    const totalSpent = transactions
      .filter((t) => t.amount < 0)
      .reduce((acc, t) => acc + t.amount, 0);

    const savings = totalIncome - Math.abs(totalSpent);

    const projected =
      savings > 0 && goal > 0
        ? Math.max(Math.ceil((goal - savings) / savings), 0)
        : "N/A";

    const categoryTotals = transactions.reduce((acc, t) => {
      if (t.amount < 0)
        acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
      return acc;
    }, {});

    const topCategory =
      Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      "None";

    const budgetUsedPercent =
      budget > 0 ? (Math.abs(totalSpent) / budget) * 100 : 0;

    const months = [
      ...new Set(transactions.map((t) => new Date(t.date).getMonth())),
    ];
    const avgMonthlySpent = months.length
      ? Math.abs(totalSpent) / months.length
      : 0;

    const monthlyData = transactions.reduce((acc, t) => {
      const m = new Date(t.date).getMonth();
      acc[m] = (acc[m] || 0) + (t.amount < 0 ? Math.abs(t.amount) : 0);
      return acc;
    }, {});

    const today = new Date();
    const trend =
      (monthlyData[today.getMonth()] || 0) >
      (monthlyData[today.getMonth() - 1] || 0)
        ? "⬆️ High spending"
        : "⬇️ Spending is down";

    return [
      {
        title: "Goal Timeline",
        value: projected === "N/A" ? "N/A" : `${projected} Months`,
        description: "Based on current savings, this is how long you'll take to hit your target.",
        type: "good",
        emoji: "🎯"
      },
      {
        title: "Top Category",
        value: topCategory,
        description: "You spend the most here. Consider if this aligns with your priorities.",
        type: "caution",
        emoji: "💳"
      },
      {
        title: "Budget Status",
        value: `${budgetUsedPercent.toFixed(1)}%`,
        description: "Your total spending relative to your initial monthly budget.",
        type: budgetUsedPercent > 80 ? "bad" : "good",
        emoji: "🏦"
      },
      {
        title: "Monthly Avg",
        value: avgMonthlySpent.toLocaleString("en-IN", {
          style: "currency",
          currency: "INR",
        }),
        description: "This is your baseline monthly burn rate.",
        type: "caution",
        emoji: "📊"
      },
      {
        title: "Spend Trend",
        value: trend,
        description: "How your current monthly spending compares to the previous month.",
        type: trend.includes("⬆️") ? "caution" : "good",
        emoji: "🔥"
      },
    ];
  }, [budget, goal, transactions]);

  return (
    <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-8 hover:bg-white/[0.05] hover:border-purple-500/30 transition-all duration-300 overflow-hidden">
      {/* Visual background flare */}
      <div className="absolute -top-px -right-px w-40 h-40 bg-gradient-to-br from-purple-500/10 to-transparent rounded-tr-3xl blur-2xl"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Smart Insights</h2>
            <p className="text-sm text-gray-400">AI-powered analysis of your financial health</p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-xl flex items-center justify-center text-2xl border border-purple-500/20 shadow-lg shadow-purple-500/10">
            ✨
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.length === 0 ? (
            <div className="col-span-full py-10 text-center text-gray-500 bg-white/[0.02] rounded-2xl border border-dashed border-white/10">
              Not enough data for insights. Add more transactions!
            </div>
          ) : (
            insights.map((insight, idx) => (
              <InsightCard key={idx} insight={insight} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function InsightCard({ insight }) {
  const [expanded, setExpanded] = useState(false);

  const styles = {
    good: {
      bg: "bg-emerald-500/5",
      text: "text-emerald-400",
      border: "border-emerald-500/20",
      glow: "shadow-emerald-500/5",
      accent: "bg-emerald-500"
    },
    caution: {
      bg: "bg-amber-500/5",
      text: "text-amber-400",
      border: "border-amber-500/20",
      glow: "shadow-amber-500/5",
      accent: "bg-amber-500"
    },
    bad: {
      bg: "bg-rose-500/5",
      text: "text-rose-400",
      border: "border-rose-500/20",
      glow: "shadow-rose-500/5",
      accent: "bg-rose-500"
    },
  };

  const style = styles[insight.type];

  return (
    <motion.div
      layout
      onClick={() => setExpanded(!expanded)}
      className={`group relative overflow-hidden border ${style.border} ${style.bg} ${style.glow} rounded-2xl p-5 cursor-pointer hover:bg-white/[0.05] transition-all duration-300 shadow-xl`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-xl grayscale group-hover:grayscale-0 transition-all border border-white/5">
            {insight.emoji}
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-0.5">{insight.title}</p>
            <p className={`text-lg font-bold ${style.text}`}>{insight.value}</p>
          </div>
        </div>
        <motion.div 
           animate={{ rotate: expanded ? 180 : 0 }}
           className="text-gray-600 group-hover:text-gray-400"
        >
          ▼
        </motion.div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <p className="mt-4 pt-4 border-t border-white/5 text-sm leading-relaxed text-gray-400">
              {insight.description}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default Insights;