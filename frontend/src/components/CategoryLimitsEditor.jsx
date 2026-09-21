import { useEffect, useState } from "react";
import { Trash2, Pencil, Check, X } from "lucide-react";
import api from "../api/api";
import { knownCategories } from "../utils/categories";

const inputCls =
  "w-full bg-white/[0.05] border border-white/[0.1] focus:border-indigo-500/50 rounded-xl px-4 py-3 text-white outline-none transition-all focus:bg-white/[0.08]";

// Set a spending limit per category for each pay cycle
function CategoryLimitsEditor({ onMessage }) {
  const [limits, setLimits] = useState([]);
  const [category, setCategory] = useState("");
  const [limit, setLimit] = useState("");
  const [editing, setEditing] = useState(null); // { original, category, limit }

  useEffect(() => {
    api.get("/budget/categories").then((res) => setLimits(res.data || [])).catch(() => setLimits([]));
  }, []);

  const save = async (cat, value) => {
    try {
      const res = await api.put("/budget/categories", { category: cat, limit: value });
      setLimits((prev) => {
        const rest = prev.filter((l) => l.category !== cat);
        return value > 0 ? [...rest, res.data].sort((a, b) => a.category.localeCompare(b.category)) : rest;
      });
      return true;
    } catch (err) {
      onMessage({ text: err.response?.data?.message || "Failed to save category limit", type: "error" });
      return false;
    }
  };

  const add = async () => {
    const value = Number(limit);
    if (!category.trim() || !Number.isFinite(value) || value <= 0) {
      onMessage({ text: "Pick a category and enter a limit above 0", type: "error" });
      return;
    }
    if (await save(category.trim(), value)) {
      setCategory("");
      setLimit("");
      onMessage({ text: `Limit set for ${category.trim()}`, type: "success" });
    }
  };

  const saveEdit = async () => {
    const newCat = editing.category.trim();
    const value = Number(editing.limit);
    if (!newCat || !Number.isFinite(value) || value <= 0) {
      onMessage({ text: "Enter a category and a limit above 0", type: "error" });
      return;
    }
    if (!(await save(newCat, value))) return;
    // Renamed: remove the limit stored under the old name
    if (newCat !== editing.original) await save(editing.original, 0);
    onMessage({ text: `Limit updated for ${newCat}`, type: "success" });
    setEditing(null);
  };

  const onEditKey = (e) => {
    if (e.key === "Enter") saveEdit();
    if (e.key === "Escape") setEditing(null);
  };

  return (
    <div className="relative mt-8 bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-8">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-2xl font-bold text-white">Category Limits</h3>
        <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center text-2xl border border-indigo-500/20">📊</div>
      </div>
      <p className="text-sm text-gray-400 mb-6">Maximum to spend per category in each pay cycle. You&apos;ll see a warning at 80%.</p>

      {limits.length > 0 && (
        <ul className="space-y-2 mb-6">
          {limits.map((l) =>
            editing?.original === l.category ? (
              <li key={l.category} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/30">
                <input list="limit-categories" value={editing.category} autoFocus onKeyDown={onEditKey}
                  aria-label="Category" onChange={(e) => setEditing((ed) => ({ ...ed, category: e.target.value }))}
                  className={`${inputCls} py-2`} />
                <input type="number" min="1" value={editing.limit} onKeyDown={onEditKey}
                  aria-label="Limit per cycle" onChange={(e) => setEditing((ed) => ({ ...ed, limit: e.target.value }))}
                  className={`${inputCls} py-2`} />
                <span className="flex gap-2 justify-end">
                  <button onClick={saveEdit} aria-label="Save limit"
                    className="p-2.5 bg-emerald-500/15 text-emerald-400 rounded-lg hover:bg-emerald-500/25 transition-colors">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditing(null)} aria-label="Cancel editing"
                    className="p-2.5 bg-white/[0.05] text-gray-300 rounded-lg hover:bg-white/[0.1] transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </span>
              </li>
            ) : (
            <li key={l.category} className="flex items-center justify-between gap-3 p-3 bg-white/[0.03] rounded-xl border border-white/[0.05]">
              <span className="text-white font-semibold">{l.category}</span>
              <span className="flex items-center gap-3">
                <span className="text-indigo-300 font-bold">₹{l.limit.toLocaleString("en-IN")}</span>
                <button onClick={() => setEditing({ original: l.category, category: l.category, limit: String(l.limit) })}
                  aria-label={`Edit ${l.category} limit`}
                  className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg hover:bg-indigo-500/20 transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => save(l.category, 0)} aria-label={`Remove ${l.category} limit`}
                  className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </span>
            </li>
            )
          )}
        </ul>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3">
        <input list="limit-categories" placeholder="Category (e.g. Food)" value={category}
          onChange={(e) => setCategory(e.target.value)} className={inputCls} />
        <datalist id="limit-categories">
          {knownCategories().map((c) => <option key={c} value={c} />)}
        </datalist>
        <input type="number" min="1" placeholder="Limit per cycle (₹)" value={limit}
          onChange={(e) => setLimit(e.target.value)} className={inputCls} />
        <button onClick={add}
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all">
          Set limit
        </button>
      </div>
    </div>
  );
}

export default CategoryLimitsEditor;
