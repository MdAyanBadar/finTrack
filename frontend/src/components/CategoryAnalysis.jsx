import React, { useState, useEffect, useRef } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { motion, AnimatePresence } from "framer-motion";

const CategoryAnalysis = ({ chartData = [], totalExpenseValue = 0 }) => {
  const [activeTab, setActiveTab] = useState("chart"); // 'chart' (Visual) or 'list' (Details)
  const [selectedCategory, setSelectedCategory] = useState(null);
  const chartContainerRef = useRef(null);

  const COLORS = ["#6366f1", "#a855f7", "#ec4899", "#f43f5e", "#f59e0b", "#10b981"];

  const formatINR = (amt) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amt);

  const sortedChartData = [...chartData].sort((a, b) => b.value - a.value);

  // Handle clicks outside the pie chart
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (chartContainerRef.current && !chartContainerRef.current.contains(event.target)) {
        setSelectedCategory(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle pie slice click
  const handlePieClick = (data, index) => {
    if (selectedCategory?.name === data.name) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(data);
    }
  };

  // Display value based on selection
  const displayValue = selectedCategory ? selectedCategory.value : totalExpenseValue;
  const displayLabel = selectedCategory ? selectedCategory.name : "Total Outflow";



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

          {/* Tab Switcher Logic */}
         <div className="flex bg-white/[0.05] p-1 rounded-2xl border border-white/[0.08] w-full sm:w-auto relative lg:hidden">
            <button
              onClick={() => setActiveTab("chart")}
              className={`relative z-10 flex-1 sm:flex-none px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                activeTab === "chart" ? "text-white" : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Visual
              {activeTab === "chart" && (
                <motion.div layoutId="tab" className="absolute inset-0 bg-indigo-600 rounded-xl -z-10 shadow-lg" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("list")}
              className={`relative z-10 flex-1 sm:flex-none px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                activeTab === "list" ? "text-white" : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Details
              {activeTab === "list" && (
                <motion.div layoutId="tab" className="absolute inset-0 bg-indigo-600 rounded-xl -z-10 shadow-lg" />
              )}
            </button>
          </div>
        </div>

        {chartData.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* --- VISUAL SECTION --- */}
            <div className={`space-y-8 lg:col-span-7 transition-all duration-500 ${
              activeTab === "chart" ? "block animate-in fade-in slide-in-from-left-4" : "hidden lg:block"
            }`}>
              <div ref={chartContainerRef} className="relative h-[350px] sm:h-[400px] bg-white/[0.02] rounded-[2rem] border border-white/[0.05] p-4 flex items-center justify-center overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      innerRadius="65%"
                      outerRadius="90%"
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                      onClick={handlePieClick}
                      style={{ cursor: 'pointer' }}
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          style={{
                            filter: selectedCategory?.name === entry.name 
                              ? `drop-shadow(0 0 12px ${COLORS[index % COLORS.length]}80)` 
                              : "none",
                            opacity: selectedCategory === null || selectedCategory?.name === entry.name ? 1 : 0.4,
                          }}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <motion.div
                    key={displayLabel}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-center"
                  >
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-black mb-1">
                      {displayLabel}
                    </p>
                    <p className="text-4xl font-black text-white">{formatINR(displayValue)}</p>
                    {selectedCategory && (
                      <p className="text-xs text-indigo-400 font-medium mt-1">
                        {((selectedCategory.value / totalExpenseValue) * 100).toFixed(1)}% of total
                      </p>
                    )}
                  </motion.div>
                </div>
              </div>

              {/* Quick Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <MetricCard label="Average/Cat" value={formatINR(totalExpenseValue / chartData.length)} sub="Mean spending" />
                <MetricCard label="Biggest Leak" value={sortedChartData[0]?.name || 'N/A'} sub="Requires attention" color="rose" />
                <MetricCard label="Spread" value={chartData.length > 5 ? 'High' : 'Low'} sub="Diversity index" className="hidden sm:flex" />
              </div>
            </div>

            {/* --- DETAILS SECTION --- */}
            <div className={`space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar lg:col-span-5 transition-all duration-500 ${
              activeTab === "list" ? "block animate-in fade-in slide-in-from-right-4" : "hidden lg:block"
            }`}>
              {sortedChartData.map((item, i) => (
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
  const avgPerTransaction = item.count > 0 ? item.value / item.count : 0;
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <motion.div 
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: index * 0.05 }}
      className="group relative bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] hover:border-white/10 rounded-2xl p-4 transition-all duration-300"
    >
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-3">
          <div 
            className="w-3 h-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] animate-pulse" 
            style={{ backgroundColor: color }} 
          />
          <span className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">{item.name}</span>
        </div>
        <span className="text-xs font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">{percent}%</span>
      </div>
      
      <div className="flex justify-between items-end mb-3">
        <span className="text-lg font-black text-white">{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(item.value)}</span>
        <span className="text-[10px] text-gray-500 font-bold uppercase mb-1">{item.count || 0} Transactions</span>
      </div>

      {/* Modern Segmented Progress Bar */}
      <div className="flex gap-1 h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden mb-3">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          className="h-full rounded-full"
          style={{ 
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}40`
          }}
        />
      </div>

      {/* Additional Stats Row */}
      <div className="flex items-center justify-between text-[10px] pt-2 border-t border-white/[0.05]">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-gray-600 uppercase font-bold">Avg/Trx:</span>
            <span className="text-indigo-300 font-black ml-1">
              {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(avgPerTransaction)}
            </span>
          </div>
          {index === 0 && (
            <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 rounded-md font-bold border border-rose-500/20">
              ⚠️ Highest
            </span>
          )}
          {percent < 5 && (
            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-md font-bold border border-emerald-500/20">
              ✓ Low Impact
            </span>
          )}
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-500 hover:text-indigo-400 transition-colors"
        >
          {isExpanded ? '▲' : '▼'}
        </button>
      </div>

      {/* Expandable Section */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-white/[0.05] space-y-2">
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-white/[0.02] rounded-lg p-2 border border-white/[0.05]">
                  <div className="text-gray-600 uppercase font-bold mb-1">Share of Total</div>
                  <div className="text-white font-black text-sm">{percent}%</div>
                </div>
                <div className="bg-white/[0.02] rounded-lg p-2 border border-white/[0.05]">
                  <div className="text-gray-600 uppercase font-bold mb-1">Total Spent</div>
                  <div className="text-white font-black text-sm">
                    ₹{(item.value / 1000).toFixed(1)}K
                  </div>
                </div>
                <div className="bg-white/[0.02] rounded-lg p-2 border border-white/[0.05]">
                  <div className="text-gray-600 uppercase font-bold mb-1">Frequency</div>
                  <div className="text-white font-black text-sm">{item.count || 0}x</div>
                </div>
                <div className="bg-white/[0.02] rounded-lg p-2 border border-white/[0.05]">
                  <div className="text-gray-600 uppercase font-bold mb-1">Avg Amount</div>
                  <div className="text-white font-black text-sm">
                    ₹{(avgPerTransaction / 1000).toFixed(1)}K
                  </div>
                </div>
              </div>
              
              {/* Insight Message */}
              <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-lg p-2 mt-2">
                <div className="text-[10px] text-indigo-300 font-medium">
                  💡 {percent > 30 
                    ? `This category represents a major portion of your expenses. Consider reviewing for savings opportunities.`
                    : percent > 15 
                    ? `Moderate spending category. Monitor transactions regularly.`
                    : `Low-impact category with minimal budget allocation.`
                  }
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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