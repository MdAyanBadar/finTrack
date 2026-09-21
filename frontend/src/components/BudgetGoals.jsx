import { useState, useEffect } from "react";
import api from "../api/api";
import LoadingScreen from "./LoadingScreen";
import { getPayCycle } from "../utils/payCycle";
import CategoryLimitsEditor from "./CategoryLimitsEditor";
import RecurringManager from "./RecurringManager";

function BudgetGoals({ budget, setBudget, goal, setGoal }) {
  const [newBudget, setNewBudget] = useState("");
  const [newGoal, setNewGoal] = useState("");
  const [salaryDay, setSalaryDay] = useState(1);
  const [newSalaryDay, setNewSalaryDay] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(true);

  /* =========================
     FETCH BUDGET FROM DB
  ========================= */
  useEffect(() => {
    const fetchBudget = async () => {
      try {
        const res = await api.get("/budget");
        setBudget(res.data.monthlyBudget || 0);
        setGoal(res.data.savingsGoal || 0);
        setSalaryDay(res.data.salaryDay || 1);
      } catch {
        setBudget(0);
        setGoal(0);
      } finally {
        setLoading(false);
      }
    };

    fetchBudget();
  }, [setBudget, setGoal]);

  // Messages show as a toast and clear themselves
  useEffect(() => {
    if (!message.text) return;
    const id = setTimeout(() => setMessage({ text: "", type: "" }), 4000);
    return () => clearTimeout(id);
  }, [message]);

  /* =========================
     UPDATE BUDGET
  ========================= */
  const updateBudget = async () => {
    const val = parseFloat(newBudget);
    if (isNaN(val) || val < 0) {
      setMessage({ text: "Please enter a valid budget amount", type: "error" });
      return;
    }

    try {
      await api.put("/budget", {
        monthlyBudget: val,
        savingsGoal: goal,
      });

      setBudget(val);
      setNewBudget("");
      setMessage({ text: "Budget updated successfully", type: "success" });
    } catch {
      setMessage({ text: "Failed to update budget", type: "error" });
    }
  };

  /* =========================
     UPDATE GOAL
  ========================= */
  const updateGoal = async () => {
    const val = parseFloat(newGoal);
    if (isNaN(val) || val < 0) {
      setMessage({ text: "Please enter a valid savings goal", type: "error" });
      return;
    }

    try {
      await api.put("/budget", {
        monthlyBudget: budget,
        savingsGoal: val,
      });

      setGoal(val);
      setNewGoal("");
      setMessage({ text: "Savings goal updated successfully", type: "success" });
    } catch {
      setMessage({ text: "Failed to update savings goal", type: "error" });
    }
  };

  /* =========================
     UPDATE SALARY DAY
  ========================= */
  const updateSalaryDay = async () => {
    const val = Number(newSalaryDay);
    if (!Number.isInteger(val) || val < 1 || val > 31) {
      setMessage({ text: "Salary day must be between 1 and 31", type: "error" });
      return;
    }

    try {
      await api.put("/budget", {
        monthlyBudget: budget,
        savingsGoal: goal,
        salaryDay: val,
      });

      setSalaryDay(val);
      setNewSalaryDay("");
      setMessage({ text: "Salary day updated successfully", type: "success" });
    } catch {
      setMessage({ text: "Failed to update salary day", type: "error" });
    }
  };

  const ordinal = (n) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  if (loading) {
    return (
      <LoadingScreen message="Loading your budget and goals..." />
    );
  }

  /* =========================
     UI (UPGRADED)
  ========================= */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full backdrop-blur-sm mb-4">
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-indigo-300 font-medium">
              Financial Planning
            </span>
          </div>

          <h1 className="text-5xl font-bold text-white mb-2">
            Budget & Goals
          </h1>
          <p className="text-lg text-gray-400">
            Control your spending and plan smarter savings
          </p>
        </div>

        {/* CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* BUDGET CARD */}
          <div className="group relative bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-8 hover:bg-white/[0.05] hover:border-indigo-500/30 transition-all duration-300 hover:scale-[1.01] hover:shadow-xl hover:shadow-indigo-500/20">
            <div className="absolute -top-px -right-px w-32 h-32 bg-gradient-to-br from-indigo-500/20 to-transparent rounded-tr-3xl blur-2xl"></div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Budget per Pay Cycle</h3>
                <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center text-2xl border border-indigo-500/20">
                  💰
                </div>
              </div>

              <p className="text-sm text-gray-400 mb-2">Current Budget</p>
              <p className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-6">
                ₹{budget.toLocaleString("en-IN")}
              </p>

              <input
                type="number"
                placeholder="Enter new budget amount"
                value={newBudget}
                onChange={(e) => setNewBudget(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.1] focus:border-indigo-500/50 rounded-xl px-4 py-3 text-white outline-none transition-all focus:bg-white/[0.08] focus:shadow-lg focus:shadow-indigo-500/20 mb-4"
              />

              <button
                onClick={updateBudget}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3 rounded-xl transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-indigo-500/30"
              >
                Update Budget
              </button>
            </div>
          </div>

          {/* GOAL CARD */}
          <div className="group relative bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-8 hover:bg-white/[0.05] hover:border-yellow-500/30 transition-all duration-300 hover:scale-[1.01] hover:shadow-xl hover:shadow-yellow-500/20">
            <div className="absolute -top-px -right-px w-32 h-32 bg-gradient-to-br from-yellow-500/20 to-transparent rounded-tr-3xl blur-2xl"></div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Savings Goal</h3>
                <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center text-2xl border border-yellow-500/20">
                  🎯
                </div>
              </div>

              <p className="text-sm text-gray-400 mb-2">Target Savings</p>
              <p className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-6">
                ₹{goal.toLocaleString("en-IN")}
              </p>

              <input
                type="number"
                placeholder="Enter new savings goal"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.1] focus:border-yellow-500/50 rounded-xl px-4 py-3 text-white outline-none transition-all focus:bg-white/[0.08] focus:shadow-lg focus:shadow-yellow-500/20 mb-4"
              />

              <button
                onClick={updateGoal}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-semibold py-3 rounded-xl transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-yellow-500/30"
              >
                Update Goal
              </button>
            </div>
          </div>
        </div>

        {/* SALARY DAY CARD */}
        <div className="group relative mt-8 bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-8 hover:bg-white/[0.05] hover:border-emerald-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/20">
          <div className="absolute -top-px -right-px w-32 h-32 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-tr-3xl blur-2xl"></div>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 md:items-end">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Salary Day</h3>
                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-2xl border border-emerald-500/20">
                  📆
                </div>
              </div>

              <p className="text-sm text-gray-400 mb-2">Your budget resets on the</p>
              <p className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-2">
                {ordinal(salaryDay)} of every month
              </p>
              <p className="text-sm text-gray-400">
                Current cycle: <span className="text-white">{getPayCycle(salaryDay).label}</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                If a month is shorter, its last day is used.
              </p>
            </div>

            <div>
              <input
                type="number"
                min="1"
                max="31"
                step="1"
                placeholder="Day salary is credited (1–31)"
                value={newSalaryDay}
                onChange={(e) => setNewSalaryDay(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.1] focus:border-emerald-500/50 rounded-xl px-4 py-3 text-white outline-none transition-all focus:bg-white/[0.08] focus:shadow-lg focus:shadow-emerald-500/20 mb-4"
              />

              <button
                onClick={updateSalaryDay}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold py-3 rounded-xl transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-emerald-500/30"
              >
                Update Salary Day
              </button>
            </div>
          </div>
        </div>

        <CategoryLimitsEditor onMessage={setMessage} />
        <RecurringManager onMessage={setMessage} />

        {/* MESSAGE */}
        {message.text && (
          <div
            role="status"
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-xl text-center text-sm px-6 py-3 rounded-xl border backdrop-blur-xl shadow-2xl ${
              message.type === "success"
                ? "bg-slate-900/90 text-green-400 border-green-500/30"
                : "bg-slate-900/90 text-red-400 border-red-500/30"
            }`}
          >
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}

export default BudgetGoals;
