import { useState } from "react";
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
import Insights from "./Insights";
function Home({ budget = 50000, goal = 20000, transactions = [] }) {
  /* =========================
     CALCULATIONS
  ========================= */
  const totalIncome = transactions
    .filter((t) => t.amount > 0)
    .reduce((acc, t) => acc + t.amount, 0);

  const totalSpent = transactions
    .filter((t) => t.amount < 0)
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = budget + totalIncome + totalSpent;
  const savings = totalIncome - Math.abs(totalSpent);

  const formatINR = (amount) =>
    amount.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
    });

  const goalProgress =
    goal > 0 ? Math.min((savings / goal) * 100, 100) : 0;

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
     PIE TOOLTIP
  ========================= */
  function CustomPieTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const { name, value } = payload[0];

    return (
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.1] rounded-xl p-4 text-sm shadow-2xl">
        <div className="flex items-center gap-2 mb-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: payload[0].payload.fill }}
          />
          <p className="font-bold text-white">{name}</p>
        </div>
        <p className="text-white font-bold text-lg mb-1">
          {formatINR(value)}
        </p>
        <div className="flex items-center justify-between gap-4">
          <p className="text-gray-400 text-xs">
            {((value / totalExpenseValue) * 100).toFixed(1)}% of total
          </p>
          <div className="px-2 py-0.5 bg-white/[0.05] rounded text-xs text-gray-300">
            Rank #{chartData.findIndex(item => item.name === name) + 1}
          </div>
        </div>
      </div>
    );
  }

  function CustomBarTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;

    return (
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.1] rounded-xl p-4 shadow-2xl min-w-[200px]">
        <p className="font-bold text-white mb-3 text-sm uppercase tracking-wide">
          {payload[0].payload.month}
        </p>
        <div className="space-y-2">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.fill }}
                />
                <span className="text-gray-300 text-sm capitalize">{entry.dataKey}</span>
              </div>
              <span className="font-bold text-white text-sm">
                {formatINR(entry.value)}
              </span>
            </div>
          ))}
        </div>
        {payload.length === 2 && (
          <div className="mt-3 pt-3 border-t border-white/[0.1]">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs">Net</span>
              <span 
                className={`font-bold text-sm ${
                  payload[0].value - payload[1].value >= 0 
                    ? 'text-green-400' 
                    : 'text-red-400'
                }`}
              >
                {formatINR(payload[0].value - payload[1].value)}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  const COLORS = [
    "#6366F1", "#F59E0B", "#10B981", "#EF4444",
    "#8B5CF6", "#EC4899", "#06B6D4", "#F97316",
  ];

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

        {/* PIE CHART */}
        <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-8 mb-8 hover:bg-white/[0.05] hover:border-indigo-500/30 transition-all duration-300 overflow-hidden">
          <div className="absolute -top-px -right-px w-40 h-40 bg-gradient-to-br from-indigo-500/20 to-transparent rounded-tr-3xl blur-2xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  Expenses by Category
                </h2>
                <p className="text-sm text-gray-400">Visual breakdown of your spending patterns</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl flex items-center justify-center text-2xl border border-indigo-500/20">
                📊
              </div>
            </div>

            {chartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="text-6xl mb-4 opacity-30">📭</div>
                <p className="text-gray-400 text-lg">No expenses recorded yet</p>
                <p className="text-gray-500 text-sm mt-2">Start adding transactions to see your spending breakdown</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 h-80 relative">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={chartData}
                        dataKey="value"
                        innerRadius={75}
                        outerRadius={115}
                        paddingAngle={3}
                        animationBegin={0}
                        animationDuration={800}
                      >
                        {chartData.map((_, i) => (
                          <Cell 
                            key={i} 
                            fill={COLORS[i % COLORS.length]}
                            stroke="#1e1b4b"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Total Spent</p>
                    <p className="text-3xl font-bold text-white mt-1">
                      {formatINR(totalExpenseValue)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      across {chartData.length} categories
                    </p>
                  </div>
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                  {chartData
                    .sort((a, b) => b.value - a.value)
                    .map((item, i) => {
                      const percentage = ((item.value / totalExpenseValue) * 100).toFixed(1);
                      return (
                        <div 
                          key={item.name} 
                          className="bg-white/[0.03] hover:bg-white/[0.05] rounded-xl p-4 transition-all duration-200 border border-white/[0.05] hover:border-white/[0.1]"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full shadow-lg" 
                                style={{ backgroundColor: COLORS[chartData.findIndex(c => c.name === item.name) % COLORS.length] }}
                              />
                              <span className="text-sm font-semibold text-white">{item.name}</span>
                            </div>
                            <span className="text-xs bg-white/[0.05] px-2 py-0.5 rounded text-gray-300">
                              #{i + 1}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-base font-bold text-white">
                              {formatINR(item.value)}
                            </span>
                            <span className="text-sm text-gray-400">
                              {percentage}%
                            </span>
                          </div>
                          <div className="w-full bg-white/[0.05] rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full transition-all duration-500"
                              style={{ 
                                width: `${percentage}%`,
                                backgroundColor: COLORS[chartData.findIndex(c => c.name === item.name) % COLORS.length]
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* BAR CHART */}
        <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-8 hover:bg-white/[0.05] hover:border-green-500/30 transition-all duration-300">
          <div className="absolute -bottom-px -left-px w-40 h-40 bg-gradient-to-tr from-green-500/20 to-transparent rounded-bl-3xl blur-2xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  Monthly Income vs Expenses
                </h2>
                <p className="text-sm text-gray-400">Compare your earnings and spending trends</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl flex items-center justify-center text-2xl border border-green-500/20">
                📈
              </div>
            </div>

            {monthlyChartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="text-6xl mb-4 opacity-30">📉</div>
                <p className="text-gray-400 text-lg">No monthly data yet</p>
                <p className="text-gray-500 text-sm mt-2">Transaction history will appear here</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer height={320}>
                  <BarChart data={monthlyChartData} barGap={8}>
                    <CartesianGrid stroke="#374151" strokeDasharray="3 3" opacity={0.2} />
                    <XAxis 
                      dataKey="month" 
                      stroke="#9CA3AF" 
                      tick={{ fill: '#D1D5DB', fontSize: 12 }}
                      axisLine={{ stroke: '#4B5563' }}
                    />
                    <YAxis 
                      stroke="#9CA3AF"
                      tick={{ fill: '#D1D5DB', fontSize: 12 }}
                      axisLine={{ stroke: '#4B5563' }}
                      tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<CustomBarTooltip />} cursor={{ fill: '#374151', opacity: 0.1 }} />
                    <Bar 
                      dataKey="income" 
                      fill="#22C55E" 
                      radius={[8, 8, 0, 0]}
                      animationBegin={0}
                      animationDuration={800}
                    />
                    <Bar 
                      dataKey="expense" 
                      fill="#EF4444" 
                      radius={[8, 8, 0, 0]}
                      animationBegin={0}
                      animationDuration={800}
                    />
                  </BarChart>
                </ResponsiveContainer>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/[0.08]">
                  <div className="text-center">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total Income</p>
                    <p className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                      {formatINR(monthlyChartData.reduce((sum, m) => sum + m.income, 0))}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total Expenses</p>
                    <p className="text-xl font-bold bg-gradient-to-r from-red-400 to-rose-400 bg-clip-text text-transparent">
                      {formatINR(monthlyChartData.reduce((sum, m) => sum + m.expense, 0))}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Net Balance</p>
                    <p className={`text-xl font-bold bg-gradient-to-r ${
                      monthlyChartData.reduce((sum, m) => sum + m.income - m.expense, 0) >= 0 
                        ? 'from-green-400 to-emerald-400' 
                        : 'from-red-400 to-rose-400'
                    } bg-clip-text text-transparent`}>
                      {formatINR(monthlyChartData.reduce((sum, m) => sum + m.income - m.expense, 0))}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
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