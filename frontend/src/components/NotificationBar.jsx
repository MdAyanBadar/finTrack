import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/api";
import { X, AlertTriangle, CheckCircle, AlertCircle, TrendingUp, Target, CreditCard, PieChart } from "lucide-react";

function NotificationBar({
  budget = 0,
  goal = 0,
  income = 0,
  expenses = 0,
  savings = 0,
  transactions = [],
}) {
  const [dismissedIds, setDismissedIds] = useState(new Set());
  const [serverAlerts, setServerAlerts] = useState([]);

  /* =========================
     FETCH ALERTS FROM BACKEND
  ========================= */
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await api.get("/alerts"); // optional backend
        setServerAlerts(res.data || []);
      } catch {
        setServerAlerts([]); // fallback to local logic
      }
    };

    fetchAlerts();
  }, []);

  /* =========================
     LOCAL (CLIENT) ALERTS
  ========================= */
  const computedAlerts = useMemo(() => {
    const alerts = [];

    if (expenses > income)
      alerts.push({
        id: "income_vs_expense",
        message: "Spending is higher than your income",
        type: "warning",
        icon: <TrendingUp className="w-5 h-5" />,
        action: "Review expenses",
      });

    if (budget > 0 && expenses > budget)
      alerts.push({
        id: "budget_exceeded",
        message: "You have exceeded your budget limit",
        type: "danger",
        icon: <AlertCircle className="w-5 h-5" />,
        action: "View budget",
      });

    if (goal > 0 && savings >= goal)
      alerts.push({
        id: "goal_completed",
        message: "Congratulations! You reached your savings goal",
        type: "success",
        icon: <Target className="w-5 h-5" />,
        action: "Set new goal",
      });

    if (goal > 0 && savings > 0 && savings < goal) {
      const progress = Math.floor((savings / goal) * 100);
      alerts.push({
        id: "goal_progress",
        message: `You've completed ${progress}% of your savings goal`,
        type: "success",
        icon: <Target className="w-5 h-5" />,
        action: "View progress",
        progress: progress,
      });
    }

    const LARGE_TX = 10000;
    const largeTx = transactions.find((t) => Math.abs(t.amount) >= LARGE_TX);

    if (largeTx)
      alerts.push({
        id: "large_transaction",
        message: `Large transaction detected: ₹${Math.abs(largeTx.amount).toLocaleString("en-IN")}`,
        type: "warning",
        icon: <CreditCard className="w-5 h-5" />,
        action: "Review transaction",
      });

    const categoryTotals = transactions.reduce((acc, t) => {
      if (t.amount < 0)
        acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
      return acc;
    }, {});

    Object.entries(categoryTotals).forEach(([cat, amount]) => {
      if (expenses > 0 && amount / expenses > 0.5) {
        alerts.push({
          id: `category_${cat}`,
          message: `High spending detected in ${cat}`,
          type: "warning",
          icon: <PieChart className="w-5 h-5" />,
          action: "Analyze category",
        });
      }
    });

    return alerts;
  }, [budget, goal, income, expenses, savings, transactions]);

  /* =========================
     FINAL ALERT LIST
  ========================= */
  const alerts = useMemo(() => {
    const combined = [...serverAlerts, ...computedAlerts];
    return combined.filter((a) => !dismissedIds.has(a.id));
  }, [serverAlerts, computedAlerts, dismissedIds]);

  const dismiss = (id) => setDismissedIds((prev) => new Set(prev).add(id));

  if (alerts.length === 0) return null;

  const styles = {
    warning: {
      bg: "from-amber-500/10 to-orange-500/10",
      border: "border-amber-500/30",
      text: "text-amber-400",
      glow: "shadow-amber-500/20",
      iconBg: "bg-amber-500/20",
      emoji: "⚠️",
      gradient: "from-amber-500 to-orange-500",
    },
    success: {
      bg: "from-emerald-500/10 to-green-500/10",
      border: "border-emerald-500/30",
      text: "text-emerald-400",
      glow: "shadow-emerald-500/20",
      iconBg: "bg-emerald-500/20",
      emoji: "🎉",
      gradient: "from-emerald-500 to-green-500",
    },
    danger: {
      bg: "from-rose-500/10 to-red-500/10",
      border: "border-rose-500/30",
      text: "text-rose-400",
      glow: "shadow-rose-500/20",
      iconBg: "bg-rose-500/20",
      emoji: "💥",
      gradient: "from-rose-500 to-red-500",
    },
  };

  return (
    <div className="space-y-3 mb-8">
      {alerts.length > 0 && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
            Active Alerts ({alerts.length})
          </h3>
          <button
            onClick={() => setDismissedIds(new Set(alerts.map(a => a.id)))}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/[0.05]"
          >
            Dismiss All
          </button>
        </div>
      )}

      <AnimatePresence mode="popLayout">
        {alerts.map((alert, index) => {
          const s = styles[alert.type];
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.95 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              layout
              className={`group relative overflow-hidden rounded-2xl border ${s.border} backdrop-blur-xl shadow-lg ${s.glow} hover:shadow-xl hover:${s.glow} transition-all duration-300`}
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${s.bg} opacity-80`}></div>
              
              {/* Animated Accent Bar */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${s.gradient}`}>
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>

              <div className="relative p-5 flex items-start gap-4">
                {/* Icon Container */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${s.iconBg} flex items-center justify-center border ${s.border} group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <div className={`${s.text} flex items-center justify-center`}>
                    {alert.icon || <span className="text-2xl">{s.emoji}</span>}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className={`text-sm font-medium ${s.text} leading-relaxed`}>
                      {alert.message}
                    </p>
                  </div>

                  {/* Progress Bar for Goal Progress */}
                  {alert.progress !== undefined && (
                    <div className="mt-3 mb-2">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-gray-400">Progress</span>
                        <span className={`font-semibold ${s.text}`}>{alert.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-white/[0.05] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${alert.progress}%` }}
                          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                          className={`h-full bg-gradient-to-r ${s.gradient} rounded-full relative overflow-hidden`}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                        </motion.div>
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  {alert.action && (
                    <button className={`mt-3 text-xs font-medium ${s.text} hover:underline flex items-center gap-1.5 group/action`}>
                      {alert.action}
                      <svg className="w-3 h-3 group-hover/action:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Dismiss Button */}
                <button
                  onClick={() => dismiss(alert.id)}
                  className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] flex items-center justify-center text-gray-400 hover:text-white transition-all group-hover:scale-105"
                  aria-label="Dismiss alert"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Hover Glow Effect */}
              <div className={`absolute inset-0 bg-gradient-to-r ${s.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none`}></div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}

export default NotificationBar;