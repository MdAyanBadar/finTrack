import { useState } from "react";
import { Gauge, Plus } from "lucide-react";
import api from "../api/api";
import { useResource } from "../api/resourceStore";
import { allCategories } from "../utils/categories";
import { useTransactions } from "../api/transactionStore";
import { formatINR } from "../utils/format";
import { toast } from "../utils/toast";
import { Card, Section, Sheet, Field, Input, Button, EmptyState } from "./ui";
import PickOrAdd from "./PickOrAdd";

// Spending limit per category for each pay cycle
function CategoryLimitsEditor() {
  const { data: limits, setData: setLimits } = useResource("/budget/categories", []);
  const { transactions } = useTransactions();
  const [form, setForm] = useState(null); // { original?, category, limit }
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const put = async (category, limit) => {
    const res = await api.put("/budget/categories", { category, limit });
    setLimits((prev) => {
      const rest = prev.filter((l) => l.category !== category);
      return limit > 0 ? [...rest, res.data] : rest;
    });
  };

  const save = async () => {
    const category = form.category.trim();
    const value = Number(form.limit);
    if (!category || !(value > 0)) {
      setError("Enter a category and a limit above 0");
      return;
    }
    try {
      setSaving(true);
      await put(category, value);
      if (form.original && form.original !== category) await put(form.original, 0); // renamed
      toast(`${category}: ${formatINR(value)} per cycle`);
      setForm(null);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't save");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      setSaving(true);
      await put(form.original, 0);
      toast(`${form.original} limit removed`);
      setForm(null);
    } catch {
      setError("Couldn't remove it");
    } finally {
      setSaving(false);
    }
  };

  const open = (l) => {
    setError("");
    setForm(l ? { original: l.category, category: l.category, limit: String(l.limit) } : { category: "", limit: "" });
  };

  const sorted = [...limits].sort((a, b) => a.category.localeCompare(b.category));

  return (
    <Section title="Category limits" action="Add" onAction={() => open(null)}>
      <Card className="divide-y divide-line/60 overflow-hidden">
        {sorted.length === 0 ? (
          <EmptyState icon={Gauge} title="No limits yet"
            text="Cap what you spend on things like Food or Shopping each pay cycle. You'll get a warning at 80%."
            action={<Button size="sm" onClick={() => open(null)}><Plus className="w-4 h-4" /> Add limit</Button>} />
        ) : (
          sorted.map((l) => (
            <button key={l.category} onClick={() => open(l)}
              className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-surface-2/60 transition">
              <span className="text-[15px] font-medium">{l.category}</span>
              <span className="tabular text-[15px] text-ink-2">{formatINR(l.limit)}</span>
            </button>
          ))
        )}
      </Card>

      <Sheet open={Boolean(form)} onClose={() => setForm(null)} title={form?.original ? "Edit limit" : "New limit"}>
        {form && (
          <div className="space-y-4">
            <Field label="Category">
              <PickOrAdd value={form.category} options={allCategories(transactions)}
                newLabel="New category…" placeholder="Category name"
                onChange={(v) => setForm({ ...form, category: v })} />
            </Field>
            <Field label="Limit per pay cycle (₹)">
              <Input type="number" inputMode="decimal" min="1" value={form.limit}
                onChange={(e) => setForm({ ...form, limit: e.target.value })} />
            </Field>
            {error && <p className="text-sm text-neg">{error}</p>}
            <div className="flex gap-3 pt-1">
              {form.original && <Button variant="danger" onClick={remove} disabled={saving}>Remove</Button>}
              <Button className="flex-1" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
            </div>
          </div>
        )}
      </Sheet>
    </Section>
  );
}

export default CategoryLimitsEditor;
