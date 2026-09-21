import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Zap } from "lucide-react";
import api from "../api/api";
import { useTransactions } from "../api/transactionStore";
import { knownCategories } from "../utils/categories";

const HIDDEN_ON = ["/login", "/register"];

// Title+amount+category combos logged at least twice, most frequent first
const frequentItems = (transactions) => {
  const groups = new Map();
  for (const t of transactions) {
    if (!t.title || t.recurringId) continue;
    const key = `${t.title.trim().toLowerCase()}|${t.amount}|${t.category}`;
    const g = groups.get(key) || { title: t.title.trim(), amount: t.amount, category: t.category, type: t.type, count: 0, last: 0 };
    g.count += 1;
    g.last = Math.max(g.last, new Date(t.date).getTime());
    groups.set(key, g);
  }
  return [...groups.values()]
    .filter((g) => g.count >= 2)
    .sort((a, b) => b.count - a.count || b.last - a.last)
    .slice(0, 4);
};

const formatINR = (n) => `₹${Math.abs(n).toLocaleString("en-IN")}`;

// Floating "+" on every page: add a transaction in a couple of taps
function QuickAdd() {
  const location = useLocation();
  const loggedIn = Boolean(localStorage.getItem("token"));
  if (!loggedIn || HIDDEN_ON.includes(location.pathname)) return null;
  return <QuickAddSheet />;
}

function QuickAddSheet() {
  const { transactions, setTransactions } = useTransactions();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Food");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(""); // text
  const [lastAdded, setLastAdded] = useState(null); // for Undo
  const amountRef = useRef(null);

  const frequent = useMemo(() => frequentItems(transactions), [transactions]);
  const categories = knownCategories().filter((c) => c !== "General").slice(0, 8);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    setTimeout(() => amountRef.current?.focus(), 150);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => {
      setToast("");
      setLastAdded(null);
    }, 5000);
    return () => clearTimeout(id);
  }, [toast]);

  const reset = () => {
    setAmount("");
    setTitle("");
    setType("expense");
  };

  const submit = async (item) => {
    const value = Math.abs(Number(item.amount));
    if (!(value > 0)) return;
    const payload = {
      title: item.title?.trim() || item.category,
      amount: item.type === "expense" ? -value : value,
      type: item.type,
      category: item.category,
      date: new Date().toISOString(),
    };
    try {
      setSaving(true);
      const res = await api.post("/transactions", payload);
      setTransactions((prev) => [res.data, ...prev]);
      setLastAdded(res.data);
      setToast(`Added ${payload.title} · ${payload.amount < 0 ? "-" : "+"}${formatINR(value)}`);
      reset();
      setOpen(false);
    } catch (err) {
      setLastAdded(null);
      setToast(err.response?.data?.message || "Couldn't add transaction");
    } finally {
      setSaving(false);
    }
  };

  const undo = async () => {
    const tx = lastAdded;
    setLastAdded(null);
    try {
      await api.delete(`/transactions/${tx.id}`);
      setTransactions((prev) => prev.filter((t) => t.id !== tx.id));
      setToast(`Removed ${tx.title}`);
    } catch {
      setToast("Couldn't undo. Delete it from Transactions.");
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    submit({ title, amount, type, category });
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Quick add transaction"
        className="fixed z-40 bottom-5 right-5 sm:bottom-8 sm:right-8 w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-2xl shadow-indigo-600/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Confirmation toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            role="status"
            className="fixed z-50 bottom-24 right-5 sm:right-8 max-w-[calc(100%-2.5rem)] flex items-center gap-4 px-4 py-3 rounded-xl bg-slate-900/95 border border-white/10 text-sm text-white shadow-2xl"
          >
            <span>{toast}</span>
            {lastAdded && (
              <button onClick={undo} className="font-bold text-indigo-300 hover:text-indigo-200 uppercase text-xs tracking-wide">
                Undo
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sheet */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.form
              onSubmit={onSubmit}
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              role="dialog" aria-label="Quick add transaction"
              className="relative w-full max-w-md bg-slate-900 border-t sm:border border-white/10 rounded-t-[2rem] sm:rounded-[2rem] p-6 pb-8 shadow-2xl"
              style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}
            >
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-4 sm:hidden" />
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-white">Quick add</h2>
                <button type="button" onClick={() => setOpen(false)} aria-label="Close"
                  className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-gray-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* One-tap frequent items */}
              {frequent.length > 0 && (
                <div className="mb-5">
                  <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-2 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> One tap
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {frequent.map((f) => (
                      <button key={`${f.title}-${f.amount}-${f.category}`} type="button" disabled={saving}
                        onClick={() => submit({ ...f, type: f.amount < 0 ? "expense" : "income" })}
                        className="px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.1] text-sm text-white disabled:opacity-50">
                        {f.title} <span className={f.amount < 0 ? "text-rose-400" : "text-emerald-400"}>{formatINR(f.amount)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Expense / income */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-white/[0.04] rounded-xl mb-4">
                {["expense", "income"].map((t) => (
                  <button key={t} type="button" onClick={() => setType(t)}
                    className={`py-2 rounded-lg text-sm font-semibold capitalize transition-colors ${
                      type === t
                        ? t === "expense" ? "bg-rose-500/20 text-rose-300" : "bg-emerald-500/20 text-emerald-300"
                        : "text-gray-400 hover:text-white"
                    }`}>
                    {t}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 bg-white/[0.05] border border-white/[0.1] focus-within:border-indigo-500/50 rounded-xl px-4 mb-3">
                <span className="text-2xl text-gray-400">₹</span>
                <input ref={amountRef} type="number" inputMode="decimal" min="0" step="any" placeholder="0"
                  aria-label="Amount" value={amount} onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-transparent py-3 text-3xl font-bold text-white outline-none" />
              </div>
              <input placeholder="What was it? (optional)" aria-label="Title" value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.1] focus:border-indigo-500/50 rounded-xl px-4 py-3 text-white outline-none mb-4" />

              <div className="flex flex-wrap gap-2 mb-6">
                {categories.map((c) => (
                  <button key={c} type="button" onClick={() => setCategory(c)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                      category === c
                        ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-200"
                        : "bg-white/[0.03] border-white/[0.08] text-gray-400 hover:text-white"
                    }`}>
                    {c}
                  </button>
                ))}
              </div>

              <button type="submit" disabled={saving || !(Number(amount) > 0)}
                className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 transition-all">
                {saving ? "Adding…" : `Add ${type}`}
              </button>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default QuickAdd;
