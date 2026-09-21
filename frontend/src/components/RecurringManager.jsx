import { useEffect, useRef, useState } from "react";
import { Trash2, Repeat, Pencil } from "lucide-react";
import api from "../api/api";
import { loadTransactions } from "../api/transactionStore";
import { knownCategories } from "../utils/categories";

const inputCls =
  "w-full bg-white/[0.05] border border-white/[0.1] focus:border-orange-500/50 rounded-xl px-4 py-3 text-white outline-none transition-all focus:bg-white/[0.08] [color-scheme:dark]";

const ordinal = (n) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const formatMonth = (ym) =>
  new Date(`${ym}-01T00:00`).toLocaleDateString("en-IN", { month: "short", year: "numeric" });

// Rent, EMIs, subscriptions... added automatically every month on the chosen day
const EMPTY_FORM = {
  title: "", amount: "", type: "expense", category: "Bills", dayOfMonth: "", repeat: "always", endMonth: "",
};

function RecurringManager({ onMessage }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const formRef = useRef(null);

  useEffect(() => {
    api.get("/recurring").then((res) => setItems(res.data || [])).catch(() => setItems([]));
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      amount: String(Math.abs(item.amount)),
      type: item.type,
      category: item.category,
      dayOfMonth: String(item.dayOfMonth),
      repeat: item.endMonth ? "until" : "always",
      endMonth: item.endMonth || "",
    });
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const save = async () => {
    const day = Number(form.dayOfMonth);
    if (!form.title.trim() || !(Number(form.amount) > 0) || !Number.isInteger(day) || day < 1 || day > 31) {
      onMessage({ text: "Enter a name, an amount and a day between 1 and 31", type: "error" });
      return;
    }
    if (form.repeat === "until" && !form.endMonth) {
      onMessage({ text: "Choose the last month it should run", type: "error" });
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title: form.title.trim(),
        amount: Number(form.amount),
        type: form.type,
        category: form.category.trim() || "General",
        dayOfMonth: day,
        endMonth: form.repeat === "until" ? form.endMonth : null,
      };
      const res = editingId
        ? await api.put(`/recurring/${editingId}`, payload)
        : await api.post("/recurring", payload);

      setItems((prev) =>
        [...prev.filter((i) => i.id !== res.data.id), res.data].sort((a, b) => a.dayOfMonth - b.dayOfMonth)
      );
      onMessage({
        text: editingId
          ? `${res.data.title} updated. Past entries are unchanged.`
          : `${res.data.title} will be added on the ${ordinal(day)} of each month`,
        type: "success",
      });
      setEditingId(null);
      setForm(EMPTY_FORM);
      // Saving may have posted an entry that's already due
      loadTransactions().catch(() => {});
    } catch (err) {
      onMessage({ text: err.response?.data?.message || "Failed to save recurring item", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/recurring/${id}`);
      setItems((prev) => prev.filter((i) => i.id !== id));
      if (editingId === id) cancelEdit();
      onMessage({ text: "Stopped. Transactions already added are kept.", type: "success" });
    } catch {
      onMessage({ text: "Failed to remove recurring item", type: "error" });
    }
  };

  const thisMonth = new Date().toISOString().slice(0, 7);

  return (
    <div className="relative mt-8 bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-8">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-2xl font-bold text-white">Recurring</h3>
        <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center border border-orange-500/20">
          <Repeat className="w-6 h-6 text-orange-400" />
        </div>
      </div>
      <p className="text-sm text-gray-400 mb-6">
        Rent, EMIs, subscriptions or income that repeat monthly. They&apos;re added to your transactions automatically on the day.
      </p>

      {items.length > 0 && (
        <ul className="space-y-2 mb-6">
          {items.map((i) => (
            <li key={i.id} className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${
              editingId === i.id ? "bg-orange-500/10 border-orange-500/30" : "bg-white/[0.03] border-white/[0.05]"
            }`}>
              <div className="min-w-0">
                <p className="text-white font-semibold truncate">{i.title}</p>
                <p className="text-xs text-gray-500">
                  {ordinal(i.dayOfMonth)} of every month · {i.category} ·{" "}
                  {i.endMonth ? `until ${formatMonth(i.endMonth)}` : "always"}
                </p>
              </div>
              <span className="flex items-center gap-3 shrink-0">
                <span className={`font-bold ${i.amount < 0 ? "text-rose-400" : "text-emerald-400"}`}>
                  {i.amount < 0 ? "-" : "+"}₹{Math.abs(i.amount).toLocaleString("en-IN")}
                </span>
                <button onClick={() => startEdit(i)} aria-label={`Edit ${i.title}`}
                  className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg hover:bg-indigo-500/20 transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => remove(i.id)} aria-label={`Stop ${i.title}`}
                  className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {editingId && (
        <p className="text-sm text-orange-300 mb-3">
          Editing <span className="font-semibold">{items.find((i) => i.id === editingId)?.title}</span>. Changes apply from the next time it&apos;s added.
        </p>
      )}
      <div ref={formRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <input placeholder="Name (e.g. Rent, Netflix)" value={form.title} onChange={set("title")} className={inputCls} />
        <input type="number" min="1" placeholder="Amount (₹)" value={form.amount} onChange={set("amount")} className={inputCls} />
        <select value={form.type} onChange={set("type")} className={inputCls}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        <input list="recurring-categories" placeholder="Category" value={form.category} onChange={set("category")} className={inputCls} />
        <datalist id="recurring-categories">
          {knownCategories().map((c) => <option key={c} value={c} />)}
        </datalist>
        <input type="number" min="1" max="31" placeholder="Day of month (1–31)" value={form.dayOfMonth} onChange={set("dayOfMonth")} className={inputCls} />
        <select value={form.repeat} onChange={set("repeat")} className={inputCls}>
          <option value="always">Repeats always</option>
          <option value="until">Repeats until a month…</option>
        </select>
        {form.repeat === "until" && (
          <label className="sm:col-span-2 lg:col-span-3 flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-400">
            Last month it runs:
            <input type="month" min={thisMonth} value={form.endMonth} onChange={set("endMonth")} className={`${inputCls} sm:max-w-xs`} />
          </label>
        )}
      </div>

      <div className="flex gap-3 mt-4">
        <button onClick={save} disabled={saving}
          className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 disabled:opacity-60 text-black font-semibold py-3 rounded-xl transition-all">
          {saving ? "Saving…" : editingId ? "Save changes" : "Add recurring"}
        </button>
        {editingId && (
          <button onClick={cancelEdit}
            className="px-6 py-3 bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.1] text-white font-semibold rounded-xl transition-all">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

export default RecurringManager;
