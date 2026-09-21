import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar as CalendarIcon, ChevronRight, ChevronLeft } from "lucide-react";
import { getPayCycle, isInCycle, toDateKey } from "../utils/payCycle";

const SpendingCalendar = ({ transactions, salaryDay = 1, budget = 0, dailyBudget, formatINR }) => {
  const [selectedDay, setSelectedDay] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [cycleOffset, setCycleOffset] = useState(0); // 0 = current pay cycle, -1 = previous, ...

  const todayKey = toDateKey(new Date());

  // Pick a date mid-cycle and shift it by whole months, so short months
  // (salary day clamped to the month's last day) can't land in the same cycle twice
  const currentCycle = getPayCycle(salaryDay);
  const mid = currentCycle.start;
  const cycle = getPayCycle(
    salaryDay,
    new Date(mid.getFullYear(), mid.getMonth() + cycleOffset, mid.getDate() + 15)
  );
  const isCurrentCycle = cycleOffset === 0;

  const cycleTransactions = transactions.filter((t) => isInCycle(t.date, cycle));
  const cycleSpent = cycleTransactions
    .filter((t) => t.amount < 0)
    .reduce((acc, t) => acc + Math.abs(t.amount), 0);

  // Past cycles are coloured against an even daily share of the budget
  const dayLimit = isCurrentCycle
    ? dailyBudget
    : budget > 0
      ? budget / cycle.totalDays
      : dailyBudget;

  const earliest = transactions.reduce(
    (min, t) => (t.date && new Date(t.date) < min ? new Date(t.date) : min),
    new Date()
  );
  const canGoBack = cycle.start > earliest;

  // Every date in the pay cycle (salary day -> day before next salary day)
  const calendarDays = Array.from({ length: cycle.totalDays }, (_, i) =>
    new Date(cycle.start.getFullYear(), cycle.start.getMonth(), cycle.start.getDate() + i)
  );
  const emptyDays = Array.from({ length: cycle.start.getDay() }, (_, i) => i);

  const formatDayTitle = (date) =>
    date.toLocaleDateString("en-IN", { day: "numeric", month: "long" });

  // Data Fetcher for specific day
  const getSpendingForDay = (date) => {
    const dateStr = toDateKey(date);
    const dayTransactions = cycleTransactions.filter(
      (t) => t.date && toDateKey(t.date) === dateStr && t.amount < 0
    );
    const totalSpent = dayTransactions.reduce((acc, t) => acc + Math.abs(t.amount), 0);
    return { totalSpent, transactions: dayTransactions };
  };

  const handleDayClick = (day) => {
    const data = getSpendingForDay(day);
    if (data.transactions.length > 0) {
      setSelectedDay({ day, ...data });
      setShowModal(true);
    }
  };

  return (
    <div className="relative bg-white/[0.02] backdrop-blur-3xl border border-white/[0.08] rounded-[2rem] p-4 sm:p-8 mb-8 overflow-hidden group">
      {/* Background Glow */}
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20 shadow-inner">
              <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Calendar</h2>
              <p className="text-xs sm:text-sm text-gray-500 font-medium">{cycle.label}</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                Spent <span className="font-bold text-rose-400">{formatINR(cycleSpent)}</span>
                {budget > 0 && <span className="text-gray-500"> of {formatINR(budget)}</span>}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
             {!isCurrentCycle && (
               <button
                 onClick={() => setCycleOffset(0)}
                 className="px-3 py-2 text-xs font-bold text-indigo-300 bg-indigo-500/10 rounded-lg border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
               >
                 Today
               </button>
             )}
             <button
               onClick={() => setCycleOffset((o) => o - 1)}
               disabled={!canGoBack}
               aria-label="Previous pay cycle"
               className="p-2 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
             >
               <ChevronLeft className="w-4 h-4 text-white" />
             </button>
             <button
               onClick={() => setCycleOffset((o) => o + 1)}
               disabled={isCurrentCycle}
               aria-label="Next pay cycle"
               className="p-2 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
             >
               <ChevronRight className="w-4 h-4 text-white" />
             </button>
          </div>
        </div>

        {/* Main Grid Container */}
        <div className="bg-black/20 rounded-[1.5rem] p-2 sm:p-6 border border-white/[0.05]">
          {/* Days Header */}
          <div className="grid grid-cols-7 mb-4">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-[10px] sm:text-xs font-black text-gray-600 uppercase tracking-widest">
                {day.charAt(0)}{/* Shows S M T W T F S on small mobile */}
                <span className="hidden sm:inline">{day.slice(1)}</span>
              </div>
            ))}
          </div>

          {/* Calendar Body */}
          <div className="grid grid-cols-7 gap-1 sm:gap-3">
            {emptyDays.map((i) => (
              <div key={`empty-${i}`} className="aspect-square opacity-0" />
            ))}

            {calendarDays.map((day, i) => {
              const { totalSpent } = getSpendingForDay(day);
              const isToday = toDateKey(day) === todayKey;
              // Show the month on the first cell and whenever the month changes
              const showMonth = i === 0 || day.getDate() === 1;
              const hasSpending = totalSpent > 0;
              
              // Intensity Logic
              let statusColor = "bg-white/[0.05]";
              if (hasSpending) {
                if (totalSpent > dayLimit * 1.2) statusColor = "bg-rose-500/20 border-rose-500/30";
                else if (totalSpent > dayLimit) statusColor = "bg-amber-500/20 border-amber-500/30";
                else statusColor = "bg-emerald-500/20 border-emerald-500/30";
              }

              return (
                <motion.button
                  key={toDateKey(day)}
                  whileTap={hasSpending ? { scale: 0.95 } : {}}
                  onClick={() => handleDayClick(day)}
                  className={`relative aspect-square rounded-lg sm:rounded-2xl border flex flex-col items-center justify-center transition-all duration-300 
                    ${statusColor} 
                    ${isToday ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-950 z-10" : "border-white/[0.05]"}
                    ${!hasSpending ? "cursor-default opacity-40" : "hover:border-white/20 hover:bg-white/[0.08]"}
                  `}
                >
                  <span className={`text-xs sm:text-base font-bold ${isToday ? "text-indigo-400" : "text-white"}`}>
                    {day.getDate()}
                  </span>
                  {showMonth && (
                    <span className="absolute top-0.5 left-1 sm:top-1 sm:left-2 text-[8px] sm:text-[10px] font-black uppercase text-indigo-400">
                      {day.toLocaleString("en-IN", { month: "short" })}
                    </span>
                  )}

                  {/* Desktop Amount / Mobile Dot */}
                  {hasSpending && (
                    <>
                      <span className="hidden sm:block text-[10px] text-gray-400 mt-1 font-medium">
                        ₹{(totalSpent).toLocaleString("en-IN")}
                      </span>
                      <div className={`sm:hidden w-1.5 h-1.5 rounded-full mt-1 
                        ${totalSpent > dayLimit ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                      />
                    </>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* --- MOBILE OPTIMIZED MODAL --- */}
      <AnimatePresence>
        {showModal && selectedDay && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative bg-slate-900 border-t sm:border border-white/10 rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag Handle for Mobile */}
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-4 mb-2 sm:hidden" />
              
              <div className="p-6 sm:p-8">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-white">{formatDayTitle(selectedDay.day)}</h3>
                    <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">Daily Summary</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-rose-500">-{formatINR(selectedDay.totalSpent)}</p>
                    <p className="text-[10px] text-gray-600 font-black uppercase">Outflow</p>
                  </div>
                </div>

                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                  {selectedDay.transactions.map((t, idx) => (
                    <div key={idx} className="group flex items-center justify-between p-4 bg-white/[0.03] rounded-2xl border border-white/[0.05] hover:bg-white/[0.06] transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-lg border border-indigo-500/20">
                          {t.type === 'expense' ? '💸' : '📦'}
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm leading-tight">{t.title || t.description}</p>
                          <p className="text-[10px] text-indigo-400 font-black uppercase mt-1">{t.category}</p>
                        </div>
                      </div>
                      <p className="text-white font-black text-sm">{formatINR(Math.abs(t.amount))}</p>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => setShowModal(false)}
                  className="w-full mt-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98]"
                >
                  DONE
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SpendingCalendar;