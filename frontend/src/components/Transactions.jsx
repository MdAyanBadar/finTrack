import { useState, useEffect, useMemo } from "react";
import api from "../api/api";
import LoadingScreen from "./LoadingScreen";

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // Form state
  const [text, setText] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("General");
  const [customCategory, setCustomCategory] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  // Edit modal
  const [editingTx, setEditingTx] = useState(null);

  /* ============================
     CATEGORY MANAGEMENT
  ============================ */
  const defaultCategories = [
    { name: "General", icon: "📝", color: "text-gray-400" },
    { name: "Food", icon: "🍔", color: "text-yellow-400" },
    { name: "Travel", icon: "✈️", color: "text-blue-400" },
    { name: "Shopping", icon: "🛍️", color: "text-pink-400" },
    { name: "Bills", icon: "💡", color: "text-orange-400" },
    { name: "Entertainment", icon: "🎮", color: "text-purple-400" },
  ];

  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem("custom_categories");
    return saved ? JSON.parse(saved) : defaultCategories;
  });

  useEffect(() => {
    localStorage.setItem("custom_categories", JSON.stringify(categories));
  }, [categories]);

  const getCategoryIcon = (name) =>
    categories.find((c) => c.name === name)?.icon || "📝";

  const getCategoryColor = (name) =>
    categories.find((c) => c.name === name)?.color || "text-gray-400";

  /* ============================
     API OPERATIONS
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

  const addTransaction = async () => {
    if (!text || !amount) return;

    let finalCategory = category;
    if (category === "Custom") {
      if (!customCategory) return;
      finalCategory = customCategory.trim();
      
      // Save for next time if it doesn't exist
      if (!categories.find(c => c.name.toLowerCase() === finalCategory.toLowerCase())) {
        setCategories(prev => [...prev, { name: finalCategory, icon: "✨", color: "text-indigo-400" }]);
      }
    }

    const payload = {
      title: text,
      amount: type === "expense" ? -Math.abs(Number(amount)) : Math.abs(Number(amount)),
      type,
      category: finalCategory,
      date: new Date().toISOString(),
    };

    try {
      setIsAdding(true);
      const res = await api.post("/transactions", payload);
      setTransactions((prev) => [res.data, ...prev]);
      // Reset Form
      setText("");
      setAmount("");
      setCategory("General");
      setCustomCategory("");
    } catch (err) {
      console.error("Add failed:", err);
    } finally {
      setIsAdding(false);
    }
  };

  const deleteTransaction = async (id) => {
    try {
      await api.delete(`/transactions/${id}`);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

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
     COMPUTED DATA
  ============================ */
  const filteredTransactions = useMemo(() => {
    let data = [...transactions];
    if (search) data = data.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));
    if (filterType !== "all") data = data.filter(t => t.type === filterType);
    if (filterCategory !== "all") data = data.filter(t => t.category === filterCategory);
    if (sortBy === "amount") data.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
    else data.sort((a, b) => new Date(b.date) - new Date(a.date));
    return data;
  }, [transactions, search, filterType, filterCategory, sortBy]);

  const formatINR = (amt) => amt.toLocaleString("en-IN", { style: "currency", currency: "INR" });
  const totalIncome = filteredTransactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalExpense = Math.abs(filteredTransactions.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0));

  if (loading) return <LoadingScreen message="Loading Financial Data..." />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full backdrop-blur-sm mb-4">
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-indigo-300 font-medium">Finance Reimagined</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-2">Transactions</h2>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <StatCard title="Total Volume" value={filteredTransactions.length} icon="📊" color="blue" />
          <StatCard title="Total Income" value={formatINR(totalIncome)} icon="💰" color="green" />
          <StatCard title="Total Expense" value={formatINR(totalExpense)} icon="💸" color="red" />
        </div>

        {/* ADD TRANSACTION FORM */}
        <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 sm:p-8 mb-8">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="p-2 bg-indigo-500/20 rounded-lg">➕</span> Add New Transaction
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 ml-1">Description</label>
              <input 
                placeholder="What for?" 
                value={text} 
                onChange={(e) => setText(e.target.value)} 
                className="w-full bg-white/[0.05] border border-white/[0.1] focus:border-indigo-500/50 rounded-xl px-4 py-3 text-white outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 ml-1">Amount</label>
              <input 
                type="number" 
                placeholder="0.00" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                className="w-full bg-white/[0.05] border border-white/[0.1] focus:border-indigo-500/50 rounded-xl px-4 py-3 text-white outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 ml-1">Type</label>
              <div className="relative flex p-1 bg-white/[0.05] border border-white/[0.1] rounded-xl h-[50px]">
                <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] transition-all duration-300 rounded-lg ${type === 'income' ? 'left-1 bg-green-500/20 border border-green-500/30' : 'left-[calc(50%+1px)] bg-red-500/20 border border-red-500/30'}`} />
                <button onClick={() => setType('income')} className={`relative z-10 flex-1 text-sm font-bold transition-colors ${type === 'income' ? 'text-green-400' : 'text-gray-500'}`}>Income</button>
                <button onClick={() => setType('expense')} className={`relative z-10 flex-1 text-sm font-bold transition-colors ${type === 'expense' ? 'text-red-400' : 'text-gray-500'}`}>Expense</button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 ml-1">Category</label>
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)} 
                className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-white outline-none appearance-none"
              >
                {categories.map((c) => (
                  <option key={c.name} value={c.name} className="bg-slate-900">{c.icon} {c.name}</option>
                ))}
                <option value="Custom" className="bg-slate-900">✨ Custom...</option>
              </select>
            </div>
          </div>

          {category === "Custom" && (
            <div className="mb-6 animate-in slide-in-from-top-2">
              <label className="text-sm font-medium text-indigo-400 mb-2 block">Custom Category Name</label>
              <input
                placeholder="e.g. Health, Gym..."
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="w-full sm:w-1/2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl px-4 py-3 text-white outline-none"
              />
            </div>
          )}

          <button
            onClick={addTransaction}
            disabled={isAdding}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-indigo-500/20"
          >
            {isAdding ? "Adding Transaction..." : "Confirm Transaction"}
          </button>
        </div>

        {/* FILTERS SECTION */}
        <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-white outline-none" />
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-white outline-none">
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-white outline-none">
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-white outline-none">
              <option value="date">Latest First</option>
              <option value="amount">Highest Amount</option>
            </select>
          </div>
        </div>

        {/* TRANSACTION LIST */}
        <div className="space-y-4">
          {filteredTransactions.map((t) => (
            <div key={t.id} className="group relative bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-4 sm:p-6 transition-all hover:bg-white/[0.05]">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/[0.05] rounded-xl flex items-center justify-center text-xl">{getCategoryIcon(t.category)}</div>
                  <div>
                    <h4 className="text-white font-bold text-lg">{t.title}</h4>
                    <p className="text-sm text-gray-500">{new Date(t.date).toLocaleDateString()} • {t.category}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between w-full sm:w-auto gap-6">
                  <div className={`text-xl font-bold ${t.amount > 0 ? "text-green-400" : "text-red-400"}`}>
                    {t.amount > 0 ? "+" : ""}{formatINR(t.amount)}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingTx(t)} className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg hover:bg-indigo-500/20 transition-colors">✏️</button>
                    <button onClick={() => deleteTransaction(t.id)} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors">🗑️</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filteredTransactions.length === 0 && (
            <div className="text-center py-20 bg-white/[0.02] rounded-3xl border border-dashed border-white/10 text-gray-500">
              No transactions found matching your filters.
            </div>
          )}
        </div>
      </div>

      {/* EDIT MODAL (KEEPING YOUR LOGIC) */}
      {editingTx && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setEditingTx(null)}>
          <div className="bg-[#0f172a] border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-bold text-white mb-6">Edit Record</h3>
            <div className="space-y-4">
              <input value={editingTx.title} onChange={e => setEditingTx({...editingTx, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none" />
              <input type="number" value={Math.abs(editingTx.amount)} onChange={e => setEditingTx({...editingTx, amount: editingTx.type === 'expense' ? -Number(e.target.value) : Number(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none" />
              <button onClick={saveEdit} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-500 transition-all">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-component for clean code
function StatCard({ title, value, icon, color }) {
  const colors = {
    blue: "border-blue-500/20 from-blue-500/10",
    green: "border-green-500/20 from-green-500/10",
    red: "border-red-500/20 from-red-500/10"
  };
  return (
    <div className={`relative bg-white/[0.03] border ${colors[color]} rounded-2xl p-6 overflow-hidden`}>
      <div className={`absolute -right-4 -top-4 w-20 h-20 bg-gradient-to-br ${colors[color]} blur-2xl opacity-50`}></div>
      <div className="relative flex justify-between items-center">
        <div>
          <p className="text-xs text-gray-500 uppercase font-bold mb-1">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );
}

export default Transactions;