
import { useState, useEffect, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { X } from "lucide-react";

// Mock API for demonstration
import api from "../api/api";
import Insights from "./Insights";
import LoadingScreen from "./LoadingScreen";
import NotificationBar from "./NotificationBar";
import CategoryAnalysis from "./CategoryAnalysis";
import CashFlowAnalysis from "./CashFlowAnalysis";
import SpendingCalendar from "./SpendingCalendar";

function Home() {
  /* =========================
     STATE (BACKEND SOURCE)
  ========================= */
  const [transactions, setTransactions] = useState([]);
  const [budget, setBudget] = useState(0);
  const [goal, setGoal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const { categoryData, totalExpense } = useMemo(() => {
    // 1. Filter for expenses only
    const expenses = transactions.filter((t) => t.amount < 0);

    // 2. Group by category
    const grouped = expenses.reduce((acc, t) => {
      const cat = t.category || "General";
      if (!acc[cat]) {
        acc[cat] = { name: cat, value: 0, count: 0 };
      }
      acc[cat].value += Math.abs(t.amount);
      acc[cat].count += 1;
      return acc;
    }, {});

    const categoryData = Object.values(grouped);
    const totalExpense = categoryData.reduce((sum, item) => sum + item.value, 0);

    return { categoryData, totalExpense };
  }, [transactions]);

  /* =========================
     FETCH DASHBOARD DATA
  ========================= */
  useEffect(() => {
  const fetchDashboard = async () => {
    try {
      const [txRes, budgetRes] = await Promise.all([
        api.get("/transactions"),
        api.get("/budget"),
      ]);

      setTransactions(txRes.data || []);
      setBudget(budgetRes.data?.monthlyBudget ?? 0);
      setGoal(budgetRes.data?.savingsGoal ?? 0);
    } catch (err) {
      console.error("Dashboard fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  fetchDashboard();
}, []);

// ... existing states




  if (loading) {
    return (
      <LoadingScreen message="Preparing your dashboard..." />
    );
  }

  /* =========================
     CALCULATIONS
  ========================= */
const totalIncome = transactions
  .filter((t) => t.amount > 0)
  .reduce((acc, t) => acc + t.amount, 0);

const totalSpent = transactions
  .filter((t) => t.amount < 0)
  .reduce((acc, t) => acc + Math.abs(t.amount), 0);

// ✅ FIXED
const balance = budget + totalIncome - totalSpent;

// ✅ REAL savings
const savings = Math.max(0, balance);

// ✅ Goal progress
const goalProgress =
  goal > 0 ? Math.min((savings / goal) * 100, 100) : 0;


  const formatINR = (amount) =>
    amount.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
    });

  /* =========================
     DAILY BUDGET
  ========================= */
  const now = new Date();
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0
  ).getDate();

  const remainingDays = daysInMonth - now.getDate() + 1;
  const dailyBudget =
    remainingDays > 0 && balance > 0 ? balance / remainingDays : 0;

  const todayStr = now.toISOString().slice(0, 10);
  const todaySpent = transactions
    .filter((t) => t.date?.startsWith(todayStr) && t.amount < 0)
    .reduce((acc, t) => acc + Math.abs(t.amount), 0);

  const dailyProgressPercent =
    dailyBudget > 0
      ? Math.min((todaySpent / dailyBudget) * 100, 100)
      : 0;

  let dailyColor = "#22C55E";
  if (todaySpent > dailyBudget && todaySpent <= dailyBudget * 1.2)
    dailyColor = "#FACC15";
  else if (todaySpent > dailyBudget * 1.2)
    dailyColor = "#EF4444";

  /* =========================
     CATEGORY PIE DATA
  ========================= */
  const categoryTotals = transactions.reduce((acc, t) => {
    if (t.amount < 0) {
      acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
    }
    return acc;
  }, {});

  const chartData = Object.entries(categoryTotals).map(([name, value]) => ({
    name,
    value,
  }));

  const totalExpenseValue = chartData.reduce((a, b) => a + b.value, 0);

  /* =========================
     MONTHLY BAR DATA
  ========================= */
  const monthlyData = transactions.reduce((acc, t) => {
    const month = new Date(t.date).toLocaleString("en-IN", {
      month: "short",
    });
    if (!acc[month]) acc[month] = { month, income: 0, expense: 0 };
    if (t.amount > 0) acc[month].income += t.amount;
    else acc[month].expense += Math.abs(t.amount);
    return acc;
  }, {});

  const monthlyChartData = Object.values(monthlyData);

  /* =========================
     CALENDAR DATA
  ========================= */
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  };

  const getSpendingForDay = (day) => {
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayTransactions = transactions.filter(
      t => t.date?.startsWith(dateStr) && t.amount < 0
    );
    const totalSpent = dayTransactions.reduce((acc, t) => acc + Math.abs(t.amount), 0);
    return { totalSpent, transactions: dayTransactions };
  };

  const { daysInMonth: totalDays, startingDayOfWeek } = getDaysInMonth(now);
  const calendarDays = Array.from({ length: totalDays }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: startingDayOfWeek }, (_, i) => i);

  const handleDayClick = (day) => {
    const { totalSpent, transactions: dayTransactions } = getSpendingForDay(day);
    if (dayTransactions.length > 0) {
      setSelectedDay({ day, totalSpent, transactions: dayTransactions });
      setShowModal(true);
    }
  };

  const COLORS = [
    "#6366F1", "#F59E0B", "#10B981", "#EF4444",
    "#8B5CF6", "#EC4899", "#06B6D4", "#F97316",
  ];

  function CustomPieTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const { name, value } = payload[0];

    return (
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.1] rounded-xl p-4 text-sm shadow-2xl">
        <p className="font-bold text-white">{name}</p>
        <p className="text-white font-bold text-lg">
          ₹{value.toLocaleString("en-IN")}
        </p>
      </div>
    );
  }

  function CustomBarTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;

    return (
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.1] rounded-xl p-4 shadow-2xl">
        {payload.map((p, i) => (
          <p key={i} className="text-white text-sm">
            {p.dataKey}: ₹{p.value.toLocaleString("en-IN")}
          </p>
        ))}
      </div>
    );
  }
  

  /* =========================
     UI
  ========================= */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 relative overflow-hidden">

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '700ms' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-3xl"></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]"></div>
    
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <div className="relative z-30 max-w-7xl mx-auto px-4 pt-6">
    <NotificationBar
      budget={budget}
      goal={goal}
      income={totalIncome}
      expenses={Math.abs(totalSpent)}
      savings={savings}
      transactions={transactions}
    />
  </div>
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full backdrop-blur-sm mb-4">
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-indigo-300 font-medium">Real-time Financial Overview</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-2">
            Dashboard
          </h1>
          <p className="text-lg text-gray-400">
            Track your finances and achieve your goals
          </p>
        </div>

        {/* BUDGET + GOAL */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="group relative bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-8 hover:bg-white/[0.05] hover:border-indigo-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-indigo-500/20">
            <div className="absolute -top-px -right-px w-32 h-32 bg-gradient-to-br from-indigo-500/20 to-transparent rounded-tr-3xl blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-gray-400 uppercase tracking-wide">Total Budget</p>
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl flex items-center justify-center text-2xl border border-indigo-500/20 group-hover:scale-110 transition-transform">
                  💰
                </div>
              </div>
              <p className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
                {formatINR(budget)}
              </p>
              <p className="text-sm text-gray-400">Starting balance for the month</p>
            </div>
          </div>

          <div className="group relative bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-8 hover:bg-white/[0.05] hover:border-yellow-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-yellow-500/20">
            <div className="absolute -bottom-px -left-px w-32 h-32 bg-gradient-to-tr from-yellow-500/20 to-transparent rounded-bl-3xl blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-gray-400 uppercase tracking-wide">Savings Goal</p>
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl flex items-center justify-center text-2xl border border-yellow-500/20 group-hover:scale-110 transition-transform">
                  🎯
                </div>
              </div>
              <p className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-4">
                {formatINR(goal)}
              </p>

              <div className="relative w-full bg-white/[0.05] rounded-full h-3 overflow-hidden">
                <div
                  className="h-3 bg-gradient-to-r from-yellow-500 to-orange-400 rounded-full transition-all duration-500 relative"
                  style={{ width: `${goalProgress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <p className="text-sm text-gray-400">
                  {goalProgress.toFixed(1)}% achieved
                </p>
                <p className="text-sm font-semibold text-yellow-400">
                  {formatINR(Math.max(0, goal - savings))} to go
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[
            ["Income", totalIncome, "from-green-400 to-emerald-400", "green", "📈"],
            ["Expenses", Math.abs(totalSpent), "from-red-400 to-rose-400", "red", "📉"],
            ["Balance", balance, "from-blue-400 to-cyan-400", "blue", "💵"],
            ["Savings", savings, "from-purple-400 to-pink-400", "purple", "💎"],
            ["Daily Budget", dailyBudget, "from-orange-400 to-amber-400", "orange", "📅"],
          ].map(([label, value, gradient, color, emoji]) => (
            <div key={label} className="group relative bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 hover:bg-white/[0.05] hover:border-white/[0.15] transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
                <span className="text-2xl">{emoji}</span>
              </div>
              <p className={`text-2xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent mb-1`}>
                {formatINR(value)}
              </p>

              {label === "Daily Budget" && (
                <>
                  <div className="relative w-full bg-white/[0.05] rounded-full h-2 mt-3 overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${dailyProgressPercent}%`,
                        backgroundColor: dailyColor,
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2 flex items-center justify-between">
                    <span>{formatINR(todaySpent)} today</span>
                    <span className="font-semibold" style={{ color: dailyColor }}>
                      {dailyProgressPercent > 100 ? `${(dailyProgressPercent - 100).toFixed(0)}% over` : `${(100 - dailyProgressPercent).toFixed(0)}% left`}
                    </span>
                  </p>
                </>
              )}
            </div>
          ))}
        </div>

        {/* CALENDAR */}
        <SpendingCalendar 
          transactions={transactions} 
          dailyBudget={dailyBudget} 
          formatINR={formatINR} 
        />

        {/* DAY DETAIL MODAL */}
        {showModal && selectedDay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
            <div 
              className="relative bg-gradient-to-br from-slate-900 to-indigo-950 border border-white/[0.1] rounded-3xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-6 right-6 w-10 h-10 bg-white/[0.05] hover:bg-white/[0.1] rounded-xl flex items-center justify-center transition-all duration-200 border border-white/[0.1] hover:border-white/[0.2]"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>

              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full backdrop-blur-sm mb-4">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-purple-300 font-medium">
                    {now.toLocaleString('en-IN', { month: 'long' })} {selectedDay.day}, {now.getFullYear()}
                  </span>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Daily Transactions
                </h2>
                <p className="text-lg text-gray-400">
                  Total spent: <span className="font-bold text-red-400">{formatINR(selectedDay.totalSpent)}</span>
                </p>
              </div>

              <div className="space-y-3">
                {selectedDay.transactions.map((transaction, idx) => (
                  <div 
                    key={idx}
                    className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 hover:bg-white/[0.05] hover:border-white/[0.15] transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {transaction.description || 'Expense'}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="inline-block px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-lg text-xs font-medium text-indigo-300">
                            {transaction.category}
                          </span>
                          {transaction.date && (
                            <span className="text-xs text-gray-500">
                              {new Date(transaction.date).toLocaleTimeString('en-IN', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-red-400">
                          -{formatINR(Math.abs(transaction.amount))}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedDay.transactions.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4 opacity-30">📭</div>
                  <p className="text-gray-400">No transactions on this day</p>
                </div>
              )}
            </div>
          </div>
        )}


        {/* PIE CHART */}
        <section className="grid grid-cols-1 gap-8">
          <CategoryAnalysis 
        chartData={categoryData} 
        totalExpenseValue={totalExpense} 
      />
        </section>

        {/* BAR CHART */}
        <section className="grid grid-cols-1 gap-8">
           <CashFlowAnalysis monthlyChartData={monthlyChartData} />
        </section>
        {/* INSIGHTS */}
        <Insights 
          budget={budget} 
          goal={goal} 
          transactions={transactions} 
        />
      </div>
    </div>
  );
}

export default Home;