import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { motion } from "framer-motion";

const CashFlowAnalysis = ({ monthlyChartData = [] }) => {
  const formatINR = (amt) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amt);

  // Custom Tooltip with Glass Effect
  const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const income = payload[0].value;
      const expense = payload[1].value;
      const savings = income - expense;

      return (
        <div className="bg-slate-950/80 backdrop-blur-2xl border border-white/10 p-5 rounded-[2rem] shadow-2xl min-w-[200px]">
          <p className="text-xs text-gray-500 uppercase font-black tracking-widest mb-3 border-b border-white/5 pb-2">
            {label} Report
          </p>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-emerald-400 font-bold">Income</span>
              <span className="text-white font-bold">{formatINR(income)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-rose-400 font-bold">Expense</span>
              <span className="text-white font-bold">{formatINR(expense)}</span>
            </div>
            <div className={`flex justify-between items-center pt-2 border-t border-white/5 ${savings >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              <span className="text-xs font-black uppercase">Net Savings</span>
              <span className="font-black">{formatINR(savings)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative bg-[#0f172a]/30 backdrop-blur-3xl border border-white/[0.08] rounded-[3rem] p-6 sm:p-10 transition-all duration-500 hover:border-emerald-500/20 group overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/[0.03] rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-black text-emerald-400 uppercase tracking-widest">
              Live Cashflow
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">Income <span className="text-gray-600">vs</span> Expenses</h2>
            <p className="text-sm text-gray-500 font-medium">Monthly performance and capital retention</p>
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-gray-500 font-black uppercase">Health Score</span>
              <span className="text-2xl font-black text-emerald-400">Excellent</span>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-[1.2rem] flex items-center justify-center text-2xl border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
              📊
            </div>
          </div>
        </div>

        {monthlyChartData.length === 0 ? (
          <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[2.5rem]">
            <span className="text-5xl opacity-20 block mb-4">📉</span>
            <p className="text-gray-500 font-bold">Awaiting monthly transaction cycles...</p>
          </div>
        ) : (
          <>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }} barGap={12}>
                  <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.6} />
                    </linearGradient>
                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity={1} />
                      <stop offset="100%" stopColor="#e11d48" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#ffffff" opacity={0.03} />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }}
                    dy={15}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                    tickFormatter={(v) => `₹${v / 1000}k`}
                  />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 10 }} />
                  <Bar 
                    dataKey="income" 
                    fill="url(#incomeGradient)" 
                    radius={[10, 10, 4, 4]} 
                    barSize={24}
                  />
                  <Bar 
                    dataKey="expense" 
                    fill="url(#expenseGradient)" 
                    radius={[10, 10, 4, 4]} 
                    barSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Premium Stat Footer */}
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <SummaryBox 
                label="Aggregate Income" 
                value={monthlyChartData.reduce((s, m) => s + m.income, 0)} 
                color="emerald" 
                format={formatINR}
              />
              <SummaryBox 
                label="Aggregate Outflow" 
                value={monthlyChartData.reduce((s, m) => s + m.expense, 0)} 
                color="rose" 
                format={formatINR}
              />
              <SummaryBox 
                label="Net Capital Gain" 
                value={monthlyChartData.reduce((s, m) => s + m.income - m.expense, 0)} 
                color="indigo" 
                format={formatINR}
                isBold
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const SummaryBox = ({ label, value, color, format, isBold = false }) => {
  const themes = {
    emerald: "from-emerald-400 to-teal-500 border-emerald-500/10 bg-emerald-500/5",
    rose: "from-rose-400 to-pink-500 border-rose-500/10 bg-rose-500/5",
    indigo: "from-indigo-400 to-purple-500 border-indigo-500/10 bg-indigo-500/5",
  };

  return (
    <div className={`p-6 rounded-[2rem] border ${themes[color]} transition-all duration-300 hover:scale-[1.02]`}>
      <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-2">{label}</p>
      <p className={`text-2xl font-black bg-gradient-to-r ${themes[color]} bg-clip-text text-transparent`}>
        {format(value)}
      </p>
      <div className="mt-3 flex items-center gap-2">
         <span className={`w-1.5 h-1.5 rounded-full bg-current ${themes[color].split(' ')[0].replace('from-', 'text-')}`}></span>
         <span className="text-[10px] text-gray-600 font-bold uppercase">Updated just now</span>
      </div>
    </div>
  );
};

export default CashFlowAnalysis;