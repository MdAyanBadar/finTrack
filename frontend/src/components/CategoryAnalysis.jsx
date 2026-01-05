import React, { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { motion, AnimatePresence } from "framer-motion";

const CategoryAnalysis = ({ chartData = [], totalExpenseValue = 0 }) => {
  const [activeTab, setActiveTab] = useState("chart"); // 'chart' or 'list' for mobile
  const [activeIndex, setActiveIndex] = useState(null);

  const COLORS = ["#6366f1", "#a855f7", "#ec4899", "#f43f5e", "#f59e0b", "#10b981"];

  const formatINR = (amt) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amt);

  // Custom Tooltip for the Pie Chart
  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl">
          <p className="text-xs text-gray-400 uppercase font-bold mb-1">{payload[0].name}</p>
          <p className="text-xl font-bold text-white">{formatINR(payload[0].value)}</p>
          <p className="text-xs text-indigo-400 font-medium">
            {((payload[0].value / totalExpenseValue) * 100).toFixed(1)}% of total
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative bg-white/[0.02] backdrop-blur-3xl border border-white/[0.08] rounded-[2.5rem] p-5 sm:p-8 mb-8 overflow-hidden group transition-all duration-500 hover:border-indigo-500/20">
      {/* Dynamic Background Orbs */}
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-indigo-600/15 transition-all duration-700"></div>
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-purple-600/15 transition-all duration-700"></div>

      <div className="relative z-10">
        {/* Header with Mobile Tab Switcher */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20 shadow-inner">
                <span className="text-xl">📊</span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Analytics</h2>
            </div>
            <p className="text-sm text-gray-400 font-medium ml-13">Spending distribution by category</p>
          </div>

          {/* Desktop/Mobile Toggle */}
          <div className="flex bg-white/[0.05] p-1 rounded-2xl border border-white/[0.08] w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("chart")}
              className={`flex-1 sm:flex-none px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === "chart" ? "bg-indigo-600 text-white shadow-lg" : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Visual
            </button>
            <button
              onClick={() => setActiveTab("list")}
              className={`flex-1 sm:flex-none px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === "list" ? "bg-indigo-600 text-white shadow-lg" : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Details
            </button>
          </div>
        </div>

        {chartData.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Visual Section (Chart + Quick Stats) */}
            <div className={`lg:col-span-7 space-y-8 ${activeTab === "list" ? "hidden lg:block" : "block"}`}>
              {/* Main Chart Container */}
              <div className="relative h-[350px] sm:h-[400px] bg-white/[0.02] rounded-[2rem] border border-white/[0.05] p-4 flex items-center justify-center overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      innerRadius="65%"
                      outerRadius="90%"
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                      onMouseEnter={(_, index) => setActiveIndex(index)}
                      onMouseLeave={() => setActiveIndex(null)}
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          className="transition-all duration-300 outline-none"
                          style={{
                            filter: activeIndex === index ? `drop-shadow(0 0 12px ${COLORS[index % COLORS.length]}80)` : "none",
                            opacity: activeIndex === null || activeIndex === index ? 1 : 0.4,
                          }}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Center Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                  >
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-black mb-1">Total Outflow</p>
                    <p className="text-4xl font-black text-white">{formatINR(totalExpenseValue)}</p>
                    <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                      <span className="text-[10px] text-emerald-400 font-bold uppercase">{chartData.length} Categories</span>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Quick Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <MetricCard 
                  label="Average/Cat" 
                  value={formatINR(totalExpenseValue / chartData.length)} 
                  sub="Mean spending"
                  color="indigo" 
                />
                <MetricCard 
                  label="Biggest Leak" 
                  value={chartData.sort((a,b) => b.value - a.value)[0]?.name} 
                  sub="Requires attention"
                  color="rose" 
                />
                <MetricCard 
                  label="Spread" 
                  value={chartData.length > 5 ? 'High' : 'Low'} 
                  sub="Diversity index"
                  color="purple" 
                  className="hidden sm:flex"
                />
              </div>
            </div>

            {/* List Section (Legend) */}
            <div className={`lg:col-span-5 space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar ${activeTab === "chart" ? "hidden lg:block" : "block"}`}>
              {chartData
                .sort((a, b) => b.value - a.value)
                .map((item, i) => (
                  <CategoryListItem 
                    key={item.name}
                    item={item}
                    index={i}
                    total={totalExpenseValue}
                    color={COLORS[i % COLORS.length]}
                  />
                ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(99,102,241,0.4); }
      `}</style>
    </div>
  );
};

/* --- Sub-Components --- */

const MetricCard = ({ label, value, sub, color, className = "" }) => (
  <div className={`bg-white/[0.03] border border-white/[0.06] p-4 rounded-2xl flex flex-col justify-center ${className}`}>
    <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1">{label}</p>
    <p className="text-lg font-bold text-white truncate">{value}</p>
    <p className="text-[10px] text-gray-600 font-medium mt-1">{sub}</p>
  </div>
);

const CategoryListItem = ({ item, index, total, color }) => {
  const percent = ((item.value / total) * 100).toFixed(1);
  return (
    <motion.div 
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: index * 0.05 }}
      className="group relative bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] hover:border-white/10 rounded-2xl p-4 transition-all duration-300"
    >
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]" style={{ backgroundColor: color }} />
          <span className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">{item.name}</span>
        </div>
        <span className="text-xs font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">{percent}%</span>
      </div>
      
      <div className="flex justify-between items-end mb-3">
        <span className="text-lg font-black text-white">{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(item.value)}</span>
        <span className="text-[10px] text-gray-500 font-bold uppercase mb-1">{item.count || 0} Trx</span>
      </div>

      {/* Modern Segmented Progress Bar */}
      <div className="flex gap-1 h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </motion.div>
  );
};

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-24 h-24 bg-white/[0.03] rounded-full flex items-center justify-center mb-6 border border-white/5">
      <span className="text-5xl opacity-20">📉</span>
    </div>
    <h3 className="text-xl font-bold text-white mb-2">No Data Insights</h3>
    <p className="text-gray-500 text-sm max-w-xs">We need some transactions to calculate your spending distribution.</p>
  </div>
);

export default CategoryAnalysis;