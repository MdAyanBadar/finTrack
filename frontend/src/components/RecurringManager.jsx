import { useState } from "react";
import { Repeat, Plus } from "lucide-react";
import api from "../api/api";
import { useResource } from "../api/resourceStore";
import { loadTransactions, useTransactions } from "../api/transactionStore";
import { knownCategories } from "../utils/categories";
import { getPayCycle, missedThisCycle, toDateKey } from "../utils/payCycle";
import { formatINR, shortDate } from "../utils/format";
import { toast } from "../utils/toast";
import { Card, Section, Sheet, Segmented, Field, Input, Select, Button, EmptyState } from "./ui";

const ordinal = (n) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};
const formatMonth = (ym) =>
  new Date(`${ym}-01T00:00`).toLocaleDateString("en-IN", { month: "short", year: "numeric" });

const EMPTY = { title: "", amount: "", type: "expense", category: "Bills", dayOfMonth: "", repeat: "always", endMonth: "" };

// Rent, EMIs, subscriptions, salary... added automatically every month on their day
function RecurringManager({ salaryDay = 1 }) {
  const { data: items, setData: setItems } = useResource("/recurring", []);
  const { transactions } = useTransactions();

  // Already paid? Same amount recorded within a day of the due date
  // (added by hand or imported from a bank email) means nothing is missing.
  const alreadyRecorded = (item, date) =>
    transactions.some((t) => t.amount === item.amount && Math.abs(new Date(t.date) - date) <= 36 * 3600e3);
  const missingFor = (item) => {
    const d = missedThisCycle(item.dayOfMonth, salaryDay, item.startDate);
    return d && !alreadyRecorded(item, d) ? d : null;
  };
  const [form, setForm] = useState(null); // null = closed; { id?, ...fields }
  const [countThisCycle, setCountThisCycle] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const cycleStartKey = toDateKey(getPayCycle(salaryDay).start);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const sorted = [...items].sort((a, b) => a.dayOfMonth - b.dayOfMonth);

  const day = Number(form?.dayOfMonth);
  const validDay = Number.isInteger(day) && day >= 1 && day <= 31;
  // New item whose day already passed this cycle: offer to count it
  const newItemMissed = form && !form.id && validDay ? missedThisCycle(day, salaryDay) : null;

  const openNew = () => { setError(""); setCountThisCycle(true); setForm(EMPTY); };
  const openEdit = (i) => {
    setError("");
    setForm({
      id: i.id, title: i.title, amount: String(Math.abs(i.amount)), type: i.type, category: i.category,
      dayOfMonth: String(i.dayOfMonth), repeat: i.endMonth ? "until" : "always", endMonth: i.endMonth || "",
    });
  };

  const payloadFrom = (f) => ({
    title: f.title.trim(), amount: Number(f.amount), type: f.type, category: f.category.trim() || "General",
    dayOfMonth: Number(f.dayOfMonth), endMonth: f.repeat === "until" ? f.endMonth : null,
  });

  const save = async () => {
    if (!form.title.trim() || !(Number(form.amount) > 0) || !validDay) {
      setError("Enter a name, an amount and a day between 1 and 31");
      return;
    }
    if (form.repeat === "until" && !form.endMonth) {
      setError("Choose the last month it should run");
      return;
    }
    try {
      setSaving(true);
      const payload = { ...payloadFrom(form), ...(newItemMissed && countThisCycle && { startFrom: cycleStartKey }) };
      const res = form.id ? await api.put(`/recurring/${form.id}`, payload) : await api.post("/recurring", payload);
      setItems((prev) => [...prev.filter((i) => i.id !== res.data.id), res.data]);
      toast(form.id ? `${res.data.title} updated` : `${res.data.title} added on the ${ordinal(res.data.dayOfMonth)} of each month`);
      setForm(null);
      loadTransactions().catch(() => {});
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't save");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Stop "${form.title}"? Transactions already added are kept.`)) return;
    try {
      setSaving(true);
      await api.delete(`/recurring/${form.id}`);
      setItems((prev) => prev.filter((i) => i.id !== form.id));
      toast(`${form.title} stopped`);
      setForm(null);
    } catch {
      setError("Couldn't remove it");
    } finally {
      setSaving(false);
    }
  };

  // Add this cycle's missed payment for an item created after its day had passed
  const catchUp = async (item, date) => {
    try {
      setBusyId(item.id);
      const res = await api.put(`/recurring/${item.id}`, {
        ...payloadFrom({ ...item, amount: Math.abs(item.amount), dayOfMonth: item.dayOfMonth, repeat: item.endMonth ? "until" : "always", endMonth: item.endMonth || "" }),
        startFrom: cycleStartKey,
      });
      setItems((prev) => prev.map((i) => (i.id === item.id ? res.data : i)));
      await loadTransactions().catch(() => {});
      toast(`${item.title} for ${shortDate(date)} added to this pay cycle`);
    } catch (err) {
      toast(err.response?.data?.message || "Couldn't add the missed payment", "error");
    } finally {
      setBusyId(null);
    }
  };

  const thisMonth = new Date().toISOString().slice(0, 7);

  return (
    <Section title="Recurring" action="Add" onAction={openNew}>
      <Card className="divide-y divide-line/60 overflow-hidden">
        {sorted.length === 0 ? (
          <EmptyState icon={Repeat} title="No recurring items"
            text="Add rent, EMIs, subscriptions or salary. They're added automatically on their day."
            action={<Button size="sm" onClick={openNew}><Plus className="w-4 h-4" /> Add recurring</Button>} />
        ) : (
          sorted.map((i) => {
            const missed = missingFor(i);
            return (
              <div key={i.id} className="flex items-center gap-3.5 px-4 py-3">
                <button onClick={() => openEdit(i)} className="flex-1 min-w-0 flex items-center gap-3.5 text-left">
                  <div className="w-11 h-11 shrink-0 rounded-full bg-surface-2 flex flex-col items-center justify-center">
                    <span className="text-[15px] font-bold leading-none tabular">{i.dayOfMonth}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[15px] font-medium truncate">{i.title}</p>
                    <p className="text-[13px] text-ink-3 truncate">
                      {i.category} · {i.endMonth ? `until ${formatMonth(i.endMonth)}` : "every month"}
                    </p>
                    {missed && <p className="text-[12px] text-warn mt-0.5">{shortDate(missed)} not counted yet</p>}
                  </div>
                </button>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className={`tabular text-[15px] font-semibold ${i.amount > 0 ? "text-pos" : ""}`}>
                    {formatINR(i.amount, { sign: i.amount > 0 })}
                  </span>
                  {missed && (
                    <button onClick={() => catchUp(i, missed)} disabled={busyId === i.id}
                      className="h-7 px-2.5 rounded-full bg-warn/15 text-warn text-[12px] font-semibold disabled:opacity-50">
                      {busyId === i.id ? "Adding…" : `Count ${shortDate(missed)}`}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </Card>

      <Sheet open={Boolean(form)} onClose={() => setForm(null)} title={form?.id ? "Edit recurring" : "New recurring"}>
        {form && (
          <div className="space-y-4">
            <Segmented value={form.type} onChange={(v) => setForm({ ...form, type: v })}
              options={[{ value: "expense", label: "Expense" }, { value: "income", label: "Income" }]} />
            <Field label="Name"><Input placeholder="Rent, Netflix, Salary…" value={form.title} onChange={set("title")} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Amount (₹)"><Input type="number" inputMode="decimal" min="0" value={form.amount} onChange={set("amount")} /></Field>
              <Field label="Day of month"><Input type="number" inputMode="numeric" min="1" max="31" placeholder="1–31" value={form.dayOfMonth} onChange={set("dayOfMonth")} /></Field>
            </div>
            <Field label="Category">
              <Input list="recurring-categories" value={form.category} onChange={set("category")} />
              <datalist id="recurring-categories">{knownCategories().map((c) => <option key={c} value={c} />)}</datalist>
            </Field>
            <Field label="Repeats">
              <Select value={form.repeat} onChange={set("repeat")}>
                <option value="always">Every month, no end</option>
                <option value="until">Until a month…</option>
              </Select>
            </Field>
            {form.repeat === "until" && (
              <Field label="Last month it runs">
                <Input type="month" min={thisMonth} value={form.endMonth} onChange={set("endMonth")} className="[color-scheme:dark]" />
              </Field>
            )}
            {newItemMissed && (
              <label className="flex items-start gap-3 p-3 rounded-2xl bg-surface-2 cursor-pointer">
                <input type="checkbox" checked={countThisCycle} onChange={(e) => setCountThisCycle(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[#8b5cf6]" />
                <span className="text-sm">
                  Also count this cycle&apos;s payment on <b>{shortDate(newItemMissed)}</b>
                  <span className="block text-[13px] text-ink-3">Untick if you&apos;ve already added it as a transaction.</span>
                </span>
              </label>
            )}
            {form.id && <p className="text-[13px] text-ink-3">Changes apply from the next time it&apos;s added.</p>}
            {error && <p className="text-sm text-neg">{error}</p>}
            <div className="flex gap-3 pt-1">
              {form.id && <Button variant="danger" onClick={remove} disabled={saving}>Stop</Button>}
              <Button className="flex-1" onClick={save} disabled={saving}>{saving ? "Saving…" : form.id ? "Save" : "Add"}</Button>
            </div>
          </div>
        )}
      </Sheet>
    </Section>
  );
}

export default RecurringManager;
