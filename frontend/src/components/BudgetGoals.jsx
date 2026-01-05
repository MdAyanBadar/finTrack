import { useState, useEffect } from "react";
import api from "../api/api";

function BudgetGoals({ budget, setBudget, goal, setGoal }) {
  const [newBudget, setNewBudget] = useState("");
  const [newGoal, setNewGoal] = useState("");
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
      } catch {
        setBudget(0);
        setGoal(0);
      } finally {
        setLoading(false);
      }
    };

    fetchBudget();
  }, [setBudget, setGoal]);

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

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-400">
        Loading budget details...
      </div>
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
                <h3 className="text-2xl font-bold text-white">Monthly Budget</h3>
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

        {/* MESSAGE */}
        {message.text && (
          <div
            className={`mt-8 max-w-xl mx-auto text-center text-sm px-6 py-3 rounded-xl border ${
              message.type === "success"
                ? "bg-green-500/10 text-green-400 border-green-500/20"
                : "bg-red-500/10 text-red-400 border-red-500/20"
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
