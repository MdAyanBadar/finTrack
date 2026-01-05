import { useState, useEffect, useMemo } from "react";
import api from "../api/api";

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [text, setText] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("General");

  // Filters
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  // Edit modal
  const [editingTx, setEditingTx] = useState(null);

  const categories = [
    { name: "General", icon: "📝", color: "text-gray-400" },
    { name: "Food", icon: "🍔", color: "text-yellow-400" },
    { name: "Travel", icon: "✈️", color: "text-blue-400" },
    { name: "Shopping", icon: "🛍️", color: "text-pink-400" },
    { name: "Bills", icon: "💡", color: "text-orange-400" },
    { name: "Entertainment", icon: "🎮", color: "text-purple-400" },
  ];

  const getCategoryIcon = (name) =>
    categories.find((c) => c.name === name)?.icon || "📝";

  const getCategoryColor = (name) =>
    categories.find((c) => c.name === name)?.color || "text-gray-400";

  /* ============================
     FETCH TRANSACTIONS
  ============================ */
  const fetchTransactions = async () => {
    try {
      const res = await api.get("/transactions");
      setTransactions(res.data);
    } catch (err) {
      console.error("Fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  /* ============================
     ADD TRANSACTION
  ============================ */
  const addTransaction = async () => {
    if (!text || !amount) return;

    const payload = {
      title: text,
      amount:
        type === "expense"
          ? -Math.abs(Number(amount))
          : Math.abs(Number(amount)),
      type,
      category,
      date: new Date().toISOString(),
    };

    try {
      const res = await api.post("/transactions", payload);
      setTransactions((prev) => [res.data, ...prev]);
      setText("");
      setAmount("");
      setCategory("General");
    } catch (err) {
      console.error("Add failed:", err);
    }
  };

  /* ============================
     DELETE TRANSACTION
  ============================ */
  const deleteTransaction = async (id) => {
    try {
      await api.delete(`/transactions/${id}`);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  /* ============================
     UPDATE TRANSACTION
  ============================ */
  const saveEdit = async () => {
    try {
      await api.put(`/transactions/${editingTx.id}`, {
        title: editingTx.title,
        amount: editingTx.amount,
        category: editingTx.category,
      });
      setEditingTx(null);
      fetchTransactions();
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  /* ============================
     FILTER + SORT
  ============================ */
  const filteredTransactions = useMemo(() => {
    let data = [...transactions];

    if (search)
      data = data.filter((t) =>
        t.title.toLowerCase().includes(search.toLowerCase())
      );

    if (filterType !== "all")
      data = data.filter((t) => t.type === filterType);

    if (filterCategory !== "all")
      data = data.filter((t) => t.category === filterCategory);

    if (sortBy === "amount")
      data.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
    else
      data.sort((a, b) => new Date(b.date) - new Date(a.date));

    return data;
  }, [transactions, search, filterType, filterCategory, sortBy]);

  const formatINR = (amt) =>
    amt.toLocaleString("en-IN", { style: "currency", currency: "INR" });

  const totalIncome = filteredTransactions
    .filter((t) => t.amount > 0)
    .reduce((s, t) => s + t.amount, 0);

  const totalExpense = Math.abs(
    filteredTransactions
      .filter((t) => t.amount < 0)
      .reduce((s, t) => s + t.amount, 0)
  );

  /* ============================
     UI (UNCHANGED)
  ============================ */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Loading transactions...
      </div>
    );
  }
  // ============================
  // UI
  // ============================
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

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full backdrop-blur-sm mb-4">
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-indigo-300 font-medium">Transaction Management</span>
          </div>
          <h2 className="text-5xl font-bold text-white mb-2">Transactions</h2>
          <p className="text-lg text-gray-400">
            Track, filter, and manage your income & expenses
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="group relative bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 hover:bg-white/[0.05] hover:border-blue-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/20">
            <div className="absolute -top-px -right-px w-24 h-24 bg-gradient-to-br from-blue-500/20 to-transparent rounded-tr-2xl blur-xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Total Transactions
                </p>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center text-xl border border-blue-500/20 group-hover:scale-110 transition-transform">
                  📊
                </div>
              </div>
              <p className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                {filteredTransactions.length}
              </p>
            </div>
          </div>

          <div className="group relative bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 hover:bg-white/[0.05] hover:border-green-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-green-500/20">
            <div className="absolute -bottom-px -left-px w-24 h-24 bg-gradient-to-tr from-green-500/20 to-transparent rounded-bl-2xl blur-xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Total Income
                </p>
                <div className="w-10 h-10 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl flex items-center justify-center text-xl border border-green-500/20 group-hover:scale-110 transition-transform">
                  💰
                </div>
              </div>
              <p className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                {formatINR(totalIncome)}
              </p>
            </div>
          </div>

          <div className="group relative bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 hover:bg-white/[0.05] hover:border-red-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-red-500/20">
            <div className="absolute -top-px -right-px w-24 h-24 bg-gradient-to-br from-red-500/20 to-transparent rounded-tr-2xl blur-xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Total Expenses
                </p>
                <div className="w-10 h-10 bg-gradient-to-br from-red-500/20 to-rose-500/20 rounded-xl flex items-center justify-center text-xl border border-red-500/20 group-hover:scale-110 transition-transform">
                  💸
                </div>
              </div>
              <p className="text-3xl font-bold bg-gradient-to-r from-red-400 to-rose-400 bg-clip-text text-transparent">
                {formatINR(totalExpense)}
              </p>
            </div>
          </div>
        </div>

        {/* ADD TRANSACTION */}
        <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-8 mb-8 hover:bg-white/[0.05] hover:border-indigo-500/30 transition-all duration-300">
          <div className="absolute -top-px -right-px w-32 h-32 bg-gradient-to-br from-indigo-500/20 to-transparent rounded-tr-3xl blur-2xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl flex items-center justify-center text-xl border border-indigo-500/20">
                ➕
              </div>
              <h3 className="text-2xl font-bold text-white">Add New Transaction</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Description
                </label>
                <input
                  placeholder="Enter description..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/[0.1] focus:border-indigo-500/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none transition-all focus:bg-white/[0.08] focus:shadow-lg focus:shadow-indigo-500/20"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Amount
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/[0.1] focus:border-indigo-500/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none transition-all focus:bg-white/[0.08] focus:shadow-lg focus:shadow-indigo-500/20"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Type
                </label>
                <select 
                  value={type} 
                  onChange={(e) => setType(e.target.value)} 
                  className="w-full bg-white/[0.05] border border-white/[0.1] focus:border-indigo-500/50 rounded-xl px-4 py-3 text-white outline-none transition-all focus:bg-white/[0.08] focus:shadow-lg focus:shadow-indigo-500/20"
                >
                  <option value="income">💰 Income</option>
                  <option value="expense">💸 Expense</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Category
                </label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)} 
                  className="w-full bg-white/[0.05] border border-white/[0.1] focus:border-indigo-500/50 rounded-xl px-4 py-3 text-white outline-none transition-all focus:bg-white/[0.08] focus:shadow-lg focus:shadow-indigo-500/20"
                >
                  {categories.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={addTransaction}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3.5 rounded-xl transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40"
            >
              <span className="flex items-center justify-center gap-2">
                ➕ Add Transaction
              </span>
            </button>
          </div>
        </div>

        {/* FILTERS */}
        <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-8 mb-8 hover:bg-white/[0.05] transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center text-xl border border-purple-500/20">
              🔍
            </div>
            <h3 className="text-2xl font-bold text-white">Filters & Search</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Search
              </label>
              <input 
                placeholder="Search transactions..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                className="w-full bg-white/[0.05] border border-white/[0.1] focus:border-purple-500/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none transition-all focus:bg-white/[0.08] focus:shadow-lg focus:shadow-purple-500/20"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Type Filter
              </label>
              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)} 
                className="w-full bg-white/[0.05] border border-white/[0.1] focus:border-purple-500/50 rounded-xl px-4 py-3 text-white outline-none transition-all focus:bg-white/[0.08] focus:shadow-lg focus:shadow-purple-500/20"
              >
                <option value="all">All Types</option>
                <option value="income">💰 Income Only</option>
                <option value="expense">💸 Expense Only</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Category Filter
              </label>
              <select 
                value={filterCategory} 
                onChange={(e) => setFilterCategory(e.target.value)} 
                className="w-full bg-white/[0.05] border border-white/[0.1] focus:border-purple-500/50 rounded-xl px-4 py-3 text-white outline-none transition-all focus:bg-white/[0.08] focus:shadow-lg focus:shadow-purple-500/20"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Sort By
              </label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)} 
                className="w-full bg-white/[0.05] border border-white/[0.1] focus:border-purple-500/50 rounded-xl px-4 py-3 text-white outline-none transition-all focus:bg-white/[0.08] focus:shadow-lg focus:shadow-purple-500/20"
              >
                <option value="date">📅 Latest First</option>
                <option value="amount">💵 Highest Amount</option>
              </select>
            </div>
          </div>
        </div>

        {/* TRANSACTIONS LIST HEADER */}
<div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
  <h3 className="text-xl font-semibold text-white">
    {filteredTransactions.length} Transaction{filteredTransactions.length !== 1 ? 's' : ''}
  </h3>
  {(search || filterType !== "all" || filterCategory !== "all") && (
    <button
      onClick={() => {
        setSearch("");
        setFilterType("all");
        setFilterCategory("all");
      }}
      className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-medium w-fit"
    >
      ✕ Clear Filters
    </button>
  )}
</div>

{filteredTransactions.length === 0 ? (
  <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-10 sm:p-20 text-center">
    <div className="text-5xl sm:text-6xl mb-4 opacity-30">📭</div>
    <p className="text-gray-300 text-lg sm:text-xl mb-2">No transactions found</p>
    <p className="text-gray-500 text-sm">
      {search || filterType !== "all" || filterCategory !== "all"
        ? "Try adjusting your filters"
        : "Start by adding your first transaction above"}
    </p>
  </div>
) : (
  <div className="space-y-4">
    {filteredTransactions.map((t) => (
      <div className="space-y-4">
  {filteredTransactions.map((t) => (
    <div
      key={t.id}
      className="group relative bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-4 sm:p-6 transition-all duration-300 overflow-hidden"
    >
      {/* Background Glow */}
      <div className={`absolute -top-px -right-px w-16 h-16 blur-xl opacity-20 ${t.amount > 0 ? "bg-green-500" : "bg-red-500"}`}></div>
      
      <div className="relative z-10 flex flex-col gap-4">
        {/* Top Row: Icon and Title */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 shrink-0 bg-white/[0.05] border border-white/[0.1] rounded-xl flex items-center justify-center text-xl">
            {getCategoryIcon(t.category)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <p className="font-bold text-white text-base sm:text-lg truncate max-w-[140px] sm:max-w-none">
                {t.title}
              </p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-tighter ${
                t.amount > 0 ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-red-500/10 border-red-500/30 text-red-400"
              }`}>
                {t.type}
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-gray-500 flex items-center gap-2">
              <span>📅 {new Date(t.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
              <span>•</span>
              <span>{t.category}</span>
            </p>
          </div>
        </div>

        {/* Bottom Row: Amount and Buttons (Responsive Flex) */}
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.05]">
          <div className={`text-xl sm:text-2xl font-bold ${
            t.amount > 0 ? "text-green-400" : "text-red-400"
          }`}>
            {t.amount > 0 ? "+" : ""}{formatINR(t.amount)}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setEditingTx(t)}
              className="p-2 sm:px-4 sm:py-2 bg-indigo-500/10 text-indigo-400 rounded-lg text-xs font-medium border border-indigo-500/20"
            >
              ✏️ <span className="hidden sm:inline ml-1">Edit</span>
            </button>
            <button
              onClick={() => deleteTransaction(t.id)}
              className="p-2 sm:px-4 sm:py-2 bg-red-500/10 text-red-400 rounded-lg text-xs font-medium border border-red-500/20"
            >
              🗑️ <span className="hidden sm:inline ml-1">Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  ))}
</div>
    ))}
  </div>
)}

        {/* EDIT MODAL */}
        {editingTx && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setEditingTx(null)}
          >
            <div
              className="relative bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-8 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute -top-px -right-px w-32 h-32 bg-gradient-to-br from-indigo-500/20 to-transparent rounded-tr-3xl blur-2xl"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-white">Edit Transaction</h3>
                  <button
                    onClick={() => setEditingTx(null)}
                    className="text-gray-400 hover:text-white text-2xl transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">
                      Description
                    </label>
                    <input
                      value={editingTx.title}
                      onChange={(e) =>
                        setEditingTx({ ...editingTx, title: e.target.value })
                      }
                      className="w-full bg-white/[0.05] border border-white/[0.1] focus:border-indigo-500/50 rounded-xl px-4 py-3 text-white outline-none transition-all focus:bg-white/[0.08] focus:shadow-lg focus:shadow-indigo-500/20"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">
                      Amount
                    </label>
                    <input
                      type="number"
                      value={Math.abs(editingTx.amount)}
                      onChange={(e) =>
                        setEditingTx({
                          ...editingTx,
                          amount:
                            editingTx.type === "expense"
                              ? -Math.abs(Number(e.target.value))
                              : Math.abs(Number(e.target.value)),
                        })
                      }
                      className="w-full bg-white/[0.05] border border-white/[0.1] focus:border-indigo-500/50 rounded-xl px-4 py-3 text-white outline-none transition-all focus:bg-white/[0.08] focus:shadow-lg focus:shadow-indigo-500/20"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">
                      Category
                    </label>
                    <select
                      value={editingTx.category}
                      onChange={(e) =>
                        setEditingTx({ ...editingTx, category: e.target.value })
                      }
                      className="w-full bg-white/[0.05] border border-white/[0.1] focus:border-indigo-500/50 rounded-xl px-4 py-3 text-white outline-none transition-all focus:bg-white/[0.08] focus:shadow-lg focus:shadow-indigo-500/20"
                    >
                      {categories.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.icon} {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={saveEdit}
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3.5 rounded-xl transition-all duration-300 hover::scale-[1.02] shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40"
                    >
                      💾 Save Changes
                    </button>

                    <button
                      onClick={() => setEditingTx(null)}
                      className="flex-1 bg-white/[0.05] hover:bg-white/[0.08] text-gray-300 font-semibold py-3.5 rounded-xl transition-all duration-300 border border-white/[0.1]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Transactions;
