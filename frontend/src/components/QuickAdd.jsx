import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";
import api from "../api/api";
import { useTransactions } from "../api/transactionStore";
import { knownCategories } from "../utils/categories";
import { onQuickAdd } from "../utils/quickAdd";
import { formatINR } from "../utils/format";
import { Sheet, Segmented, Chip, Button, inputClass } from "./ui";

// Title+amount+category combos logged at least twice, most frequent first
const frequentItems = (transactions) => {
  const groups = new Map();
  for (const t of transactions) {
    if (!t.title || t.recurringId || t.source) continue;
    const key = `${t.title.trim().toLowerCase()}|${t.amount}|${t.category}`;
    const g = groups.get(key) || { title: t.title.trim(), amount: t.amount, category: t.category, count: 0, last: 0 };
    g.count += 1;
    g.last = Math.max(g.last, new Date(t.date).getTime());
    groups.set(key, g);
  }
  return [...groups.values()]
    .filter((g) => g.count >= 2)
    .sort((a, b) => b.count - a.count || b.last - a.last)
    .slice(0, 4);
};

// Quick-add sheet, opened from the tab bar / top bar "+" (see utils/quickAdd)
function QuickAdd() {
  const { transactions, setTransactions } = useTransactions();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Food");
  const [custom, setCustom] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [lastAdded, setLastAdded] = useState(null);
  const amountRef = useRef(null);

  const frequent = useMemo(() => frequentItems(transactions), [transactions]);
  const categories = knownCategories().filter((c) => c !== "General").slice(0, 7);

  useEffect(() => onQuickAdd(() => setOpen(true)), []);

  useEffect(() => {
    if (open) setTimeout(() => amountRef.current?.focus(), 200);
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
    setCustom("");
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
      setToast(`Added ${payload.title} · ${formatINR(payload.amount, { sign: true })}`);
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
      setToast("Couldn't undo. Delete it from Activity.");
    }
  };

  const finalCategory = category === "__custom" ? custom.trim() : category;
  const onSubmit = (e) => {
    e.preventDefault();
    if (!finalCategory) return;
    submit({ title, amount, type, category: finalCategory });
  };

  return (
    <>
      {/* Confirmation toast, above the tab bar */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
            role="status"
            className="fixed z-[90] left-4 right-4 sm:left-auto sm:right-6 sm:w-96 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] sm:bottom-6 flex items-center justify-between gap-4 px-4 py-3.5 rounded-2xl bg-surface-3 text-sm text-ink shadow-2xl"
          >
            <span className="truncate">{toast}</span>
            {lastAdded && (
              <button onClick={undo} className="font-semibold text-accent-ink shrink-0">Undo</button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <Sheet open={open} onClose={() => setOpen(false)} title="Add transaction">
        <form onSubmit={onSubmit}>
          {frequent.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-medium text-ink-3 mb-2 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" /> One tap
              </p>
              <div className="flex flex-wrap gap-2">
                {frequent.map((f) => (
                  <button key={`${f.title}-${f.amount}-${f.category}`} type="button" disabled={saving}
                    onClick={() => submit({ ...f, type: f.amount < 0 ? "expense" : "income" })}
                    className="h-9 px-3.5 rounded-full bg-surface-2 hover:bg-surface-3 text-sm text-ink disabled:opacity-50 transition">
                    {f.title} <span className={`tabular ${f.amount < 0 ? "text-ink-3" : "text-pos"}`}>{formatINR(f.amount)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <Segmented value={type} onChange={setType}
            options={[{ value: "expense", label: "Expense" }, { value: "income", label: "Income" }]} />

          {/* Big amount */}
          <div className="flex items-baseline justify-center gap-1 py-6">
            <span className="text-3xl font-semibold text-ink-3">₹</span>
            <input ref={amountRef} type="number" inputMode="decimal" min="0" step="any" placeholder="0"
              aria-label="Amount" value={amount} onChange={(e) => setAmount(e.target.value)}
              style={{ width: `${Math.max(1, amount.length) + 0.5}ch` }}
              className="min-w-[1.5ch] max-w-[10ch] bg-transparent text-5xl font-bold text-ink tabular outline-none placeholder:text-surface-3" />
          </div>

          <input placeholder="What was it? (optional)" aria-label="Title" value={title}
            onChange={(e) => setTitle(e.target.value)} className={`${inputClass} mb-4`} />

          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((c) => (
              <Chip key={c} active={category === c} onClick={() => setCategory(c)}>{c}</Chip>
            ))}
            <Chip active={category === "__custom"} onClick={() => setCategory("__custom")}>Other…</Chip>
          </div>
          {category === "__custom" && (
            <input placeholder="Category name" aria-label="Custom category" value={custom}
              onChange={(e) => setCustom(e.target.value)} className={`${inputClass} -mt-2 mb-6`} />
          )}

          <Button type="submit" size="lg" className="w-full" disabled={saving || !(Number(amount) > 0) || !finalCategory}>
            {saving ? "Adding…" : type === "expense" ? "Add expense" : "Add income"}
          </Button>
        </form>
      </Sheet>
    </>
  );
}

export default QuickAdd;
