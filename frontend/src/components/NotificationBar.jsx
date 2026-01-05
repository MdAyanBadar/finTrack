import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

function NotificationBar({
  budget = 0,
  goal = 0,
  income = 0,
  expenses = 0,
  savings = 0,
  transactions = [],
}) {
  const [dismissedIds, setDismissedIds] = useState(new Set());

  const alerts = useMemo(() => {
    const newAlerts = [];

    if (expenses > income)
      newAlerts.push({
        id: 1,
        message: "Spending is higher than your income",
        type: "warning",
      });

    if (budget > 0 && expenses > budget)
      newAlerts.push({
        id: 2,
        message: "You have exceeded your budget limit",
        type: "danger",
      });

    if (goal > 0 && savings >= goal)
      newAlerts.push({
        id: 3,
        message: "Congratulations! You reached your savings goal",
        type: "success",
      });

    if (goal > 0 && savings < goal && savings > 0) {
      const percent = Math.floor((savings / goal) * 100);
      newAlerts.push({
        id: 4,
        message: `You’ve completed ${percent}% of your savings goal`,
        type: "success",
      });
    }

    const LARGE_TRANSACTION_THRESHOLD = 10000;
    const largeTx = transactions.find(
      (t) => Math.abs(t.amount) >= LARGE_TRANSACTION_THRESHOLD
    );
    if (largeTx)
      newAlerts.push({
        id: 5,
        message: `Large transaction detected: ₹${Math.abs(
          largeTx.amount
        ).toLocaleString("en-IN")}`,
        type: "warning",
      });

    const categoryTotals = transactions.reduce((acc, t) => {
      if (t.amount < 0)
        acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
      return acc;
    }, {});

    Object.entries(categoryTotals).forEach(([cat, amount], idx) => {
      if (expenses > 0 && amount / expenses > 0.5)
        newAlerts.push({
          id: 100 + idx,
          message: `High spending detected in ${cat}`,
          type: "warning",
        });
    });

    return newAlerts.filter((alert) => !dismissedIds.has(alert.id));
  }, [budget, goal, income, expenses, savings, transactions, dismissedIds]);

  const removeAlert = (id) => {
    setDismissedIds((prev) => new Set(prev).add(id));
  };

  const styles = {
    warning: {
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/20",
      text: "text-yellow-400",
      icon: "⚠️",
    },
    success: {
      bg: "bg-green-500/10",
      border: "border-green-500/20",
      text: "text-green-400",
      icon: "🎉",
    },
    danger: {
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      text: "text-red-400",
      icon: "💥",
    },
  };

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-3 mb-6">
      <AnimatePresence>
        {alerts.map((alert) => {
          const s = styles[alert.type];
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className={`flex justify-between items-start gap-3 p-4 rounded-xl border ${s.bg} ${s.border}`}
            >
              <div className="flex gap-3">
                <span className="text-xl">{s.icon}</span>
                <p className={`text-sm ${s.text}`}>{alert.message}</p>
              </div>

              <button
                onClick={() => removeAlert(alert.id)}
                className="text-gray-400 hover:text-gray-200 transition"
                aria-label="Dismiss notification"
              >
                ✕
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export default NotificationBar;
