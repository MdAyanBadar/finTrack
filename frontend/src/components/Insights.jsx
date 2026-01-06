import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/api";

function Insights({ budget = 0, goal = 0, transactions = [] }) {
  const [apiInsights, setApiInsights] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true);
        const res = await api.get("/insights");
        if (Array.isArray(res.data?.insights)) {
          setApiInsights(res.data.insights);
        }
      } catch (err) {
        console.log("Insights API not available, using local insights");
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, []);

  const computedInsights = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    const totalIncome = transactions
      .filter((t) => t.amount > 0)
      .reduce((a, b) => a + b.amount, 0);

    const totalSpent = transactions
      .filter((t) => t.amount < 0)
      .reduce((a, b) => a + Math.abs(b.amount), 0);

    // ✅ TRUE balance (Starting budget + income - expenses)
    const balance = budget + totalIncome - totalSpent;
    const savings = Math.max(0, balance);

    // ✅ PROJECTED MONTHLY SAVINGS
    // Logic: If you budgeted 7000 and spent 4934, you are saving 2066/month.
    // If you have no budget set, it falls back to actual Net Income (Income - Spent).
    const monthlySavingPower = budget > 0 
      ? (budget - totalSpent) 
      : (totalIncome - totalSpent);

    const amountToGoal = goal - savings;
    
    let projected;
    if (savings >= goal) {
      projected = 0;
    } else if (monthlySavingPower <= 0) {
      projected = "N/A"; // If spending exceeds budget/income, goal is unreachable
    } else {
      projected = Math.ceil(amountToGoal / monthlySavingPower);
    }

    const budgetUsedPercent = budget > 0 ? (totalSpent / budget) * 100 : 0;

    const categoryTotals = transactions.reduce((acc, t) => {
      if (t.amount < 0)
        acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
      return acc;
    }, {});

    const topCategory =
      Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      "None";

    return [
      {
        title: "Goal Timeline",
        value: projected === "N/A" ? "N/A" : `${projected} Months`,
        description: projected === 0 
          ? "Goal reached!" 
          : `At your current rate of saving ${monthlySavingPower.toLocaleString("en-IN", { style: "currency", currency: "INR" })} per month, you'll hit your goal soon.`,
        type: projected === "N/A" ? "bad" : "good",
        emoji: "🎯",
        rawPercent: Math.min((savings / (goal || 1)) * 100, 100)
      },
      {
        title: "Top Category",
        value: topCategory,
        description: "You are spending the most on this category.",
        type: "caution",
        emoji: "💳",
      },
      {
        title: "Budget Status",
        value: `${budgetUsedPercent.toFixed(1)}%`,
        description: budgetUsedPercent > 100 ? "You have exceeded your budget!" : "Monthly budget usage tracking.",
        type: budgetUsedPercent > 90 ? "bad" : budgetUsedPercent > 70 ? "caution" : "good",
        emoji: "🏦",
        rawPercent: budgetUsedPercent
      },
      {
        title: "Savings Health",
        value: savings.toLocaleString("en-IN", {
          style: "currency",
          currency: "INR",
        }),
        description: "Total available liquidity.",
        type: savings >= 0 ? "good" : "bad",
        emoji: "💎",
      },
    ];
  }, [budget, goal, transactions]);

  const insights = apiInsights ?? computedInsights;

  return (
    <div className="relative bg-[#0f172a]/40 backdrop-blur-2xl border border-white/[0.08] mt-6 rounded-[2rem] p-6 sm:p-10 hover:border-purple-500/20 transition-all duration-500 group overflow-hidden">
      {/* Enhanced Dynamic Background Glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-600/10 rounded-full blur-[100px] group-hover:bg-purple-600/20 transition-all duration-700"></div>
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-600/5 rounded-full blur-[120px] group-hover:bg-blue-600/10 transition-all duration-700"></div>
      
      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="flex h-2.5 w-2.5 rounded-full bg-purple-400 animate-pulse shadow-lg shadow-purple-500/50"></span>
              <h2 className="text-3xl font-bold text-white tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Smart Insights
              </h2>
            </div>
            <p className="text-sm text-gray-400 font-medium pl-5">
              AI-driven analysis of your financial footprint
            </p>
          </div>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="self-start sm:self-center px-5 py-2.5 bg-gradient-to-r from-purple-500/10 to-purple-600/10 border border-purple-500/30 rounded-xl flex items-center gap-2.5 text-purple-300 text-sm font-bold backdrop-blur-md shadow-lg shadow-purple-500/5"
          >
            <motion.span 
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="text-base"
            >
              ✨
            </motion.span>
            <span className="bg-gradient-to-r from-purple-300 to-purple-400 bg-clip-text text-transparent">
              Intelligence Active
            </span>
          </motion.div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="h-32 bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl animate-pulse border border-white/10 backdrop-blur-sm"
              >
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-xl"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-white/10 rounded w-1/3"></div>
                      <div className="h-4 bg-white/10 rounded w-2/3"></div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div 
            initial="hidden"
            animate="show"
            variants={{
              show: { transition: { staggerChildren: 0.08 } }
            }}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >
            {insights.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="col-span-full py-20 text-center"
              >
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-5xl mb-6 opacity-20"
                >
                  📊
                </motion.div>
                <p className="text-gray-400 font-semibold text-xl mb-2">Not enough data to generate insights yet.</p>
                <p className="text-gray-600 text-sm">Add more transactions to see the magic ✨</p>
              </motion.div>
            ) : (
              insights.map((insight, idx) => (
                <InsightCard key={idx} insight={insight} index={idx} />
              ))
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function InsightCard({ insight, index }) {
  const [expanded, setExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const styleMap = {
    good: {
      accent: "bg-emerald-400",
      gradient: "from-emerald-500/[0.05] to-emerald-600/[0.02]",
      border: "hover:border-emerald-500/40",
      text: "text-emerald-400",
      glow: "group-hover:shadow-[0_0_30px_-5px_rgba(52,211,153,0.2)]",
      iconBg: "bg-emerald-500/10 border-emerald-500/20",
      progressGlow: "shadow-[0_0_10px_rgba(52,211,153,0.3)]"
    },
    caution: {
      accent: "bg-amber-400",
      gradient: "from-amber-500/[0.05] to-amber-600/[0.02]",
      border: "hover:border-amber-500/40",
      text: "text-amber-400",
      glow: "group-hover:shadow-[0_0_30px_-5px_rgba(251,191,36,0.2)]",
      iconBg: "bg-amber-500/10 border-amber-500/20",
      progressGlow: "shadow-[0_0_10px_rgba(251,191,36,0.3)]"
    },
    bad: {
      accent: "bg-rose-400",
      gradient: "from-rose-500/[0.05] to-rose-600/[0.02]",
      border: "hover:border-rose-500/40",
      text: "text-rose-400",
      glow: "group-hover:shadow-[0_0_30px_-5px_rgba(251,113,113,0.2)]",
      iconBg: "bg-rose-500/10 border-rose-500/20",
      progressGlow: "shadow-[0_0_10px_rgba(251,113,133,0.3)]"
    },
  };

  const style = styleMap[insight.type] || styleMap.good;

  return (
    <motion.div
      layout
      variants={{
        hidden: { opacity: 0, y: 20, scale: 0.95 },
        show: { 
          opacity: 1, 
          y: 0, 
          scale: 1,
          transition: { type: "spring", stiffness: 100 }
        }
      }}
      whileHover={{ scale: 1.02 }}
      onClick={() => setExpanded(!expanded)}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`group relative border border-white/[0.08] bg-gradient-to-br ${style.gradient} rounded-2xl p-6 cursor-pointer transition-all duration-300 backdrop-blur-sm ${style.border} ${style.glow} overflow-hidden`}
    >
      {/* Animated gradient overlay on hover */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        className={`absolute inset-0 bg-gradient-to-br ${style.gradient} opacity-50`}
      />

      <div className="flex items-center justify-between relative z-10 mb-4">
        <div className="flex gap-4 items-center flex-1">
          <motion.div 
            whileHover={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.5 }}
            className={`w-14 h-14 ${style.iconBg} border rounded-xl flex items-center justify-center text-3xl shadow-lg backdrop-blur-sm`}
          >
            {insight.emoji}
          </motion.div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase text-gray-500 font-bold tracking-widest mb-1 flex items-center gap-2">
              {insight.title}
              {index === 0 && (
                <span className="text-[8px] px-2 py-0.5 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300">
                  NEW
                </span>
              )}
            </p>
            <motion.p 
              layout
              className={`text-2xl font-bold tracking-tight ${style.text} truncate`}
            >
              {insight.value}
            </motion.p>
          </div>
        </div>
        
        <motion.div 
          animate={{ rotate: expanded ? 180 : 0 }}
          whileHover={{ scale: 1.1 }}
          className="w-9 h-9 rounded-xl bg-white/[0.08] flex items-center justify-center text-xs text-gray-400 border border-white/10 hover:border-white/20 transition-colors flex-shrink-0 ml-2"
        >
          ▼
        </motion.div>
      </div>

      {/* Enhanced Progress bar */}
      {insight.rawPercent !== undefined && (
        <div className="relative z-10 w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden mb-1">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(insight.rawPercent, 100)}%` }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
            className={`h-full ${style.accent} ${style.progressGlow}`}
          />
        </div>
      )}

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden relative z-10"
          >
            <motion.div 
              initial={{ y: -10 }}
              animate={{ y: 0 }}
              className="mt-5 pt-5 border-t border-white/[0.08]"
            >
              <p className="text-sm text-gray-300 leading-relaxed font-medium">
                {insight.description}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Enhanced Accent Line */}
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: isHovered ? "50%" : "0%" }}
        className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[3px] ${style.accent} transition-all duration-500 rounded-full ${style.progressGlow}`}
      />

      {/* Corner accent */}
      <div className={`absolute top-0 right-0 w-20 h-20 ${style.accent} opacity-5 rounded-bl-full transition-opacity duration-500 group-hover:opacity-10`} />
    </motion.div>
  );
}

export default Insights;