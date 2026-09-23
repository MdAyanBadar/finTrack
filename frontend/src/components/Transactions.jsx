import { useMemo, useState } from "react";
import { Search, ArrowLeftRight, Repeat, Mail, HandCoins } from "lucide-react";
import api from "../api/api";
import { useTransactions, deleteWithUndo } from "../api/transactionStore";
import { toast } from "../utils/toast";
import { useResource } from "../api/resourceStore";
import { getPayCycle, isInCycle, toDateKey } from "../utils/payCycle";
import { allCategories } from "../utils/categories";
import { formatINR, dayLabel } from "../utils/format";
import { openQuickAdd } from "../utils/quickAdd";
import {
  Page, PageHeader, Card, Chip, Sheet, Segmented, Field, Input, Button, EmptyState, Skeleton, inputClass,
} from "./ui";
import TransactionRow from "./TransactionRow";
import SwipeRow from "./SwipeRow";
import PickOrAdd from "./PickOrAdd";

const PERIODS = [
  { value: "cycle", label: "This cycle" },
  { value: "last", label: "Last cycle" },
  { value: "all", label: "All time" },
];
const TYPES = [
  { value: "all", label: "All" },
  { value: "expense", label: "Spent" },
  { value: "income", label: "Received" },
  { value: "owed", label: "Owed to you" },
];

// datetime-local value in local time
const toLocalInput = (value) => {
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function Transactions() {
  const { transactions, setTransactions, loading, refresh } = useTransactions();
  const { data: budget } = useResource("/budget", { salaryDay: 1 });
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("cycle");
  const [type, setType] = useState("all");
  const [category, setCategory] = useState("all");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const salaryDay = budget?.salaryDay ?? 1;
  const cycle = getPayCycle(salaryDay);
  const lastCycle = getPayCycle(salaryDay, new Date(cycle.start.getTime() - 86400000));

  const inPeriod = useMemo(() => {
    if (period === "all") return transactions;
    const c = period === "cycle" ? cycle : lastCycle;
    return transactions.filter((t) => isInCycle(t.date, c));
  }, [transactions, period, cycle.start.getTime()]); // eslint-disable-line react-hooks/exhaustive-deps

  const categories = useMemo(
    () => [...new Set(inPeriod.map((t) => t.category))].sort(),
    [inPeriod]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return inPeriod
      .filter((t) =>
        type === "all" ? true
          : type === "owed" ? t.owedBy && !t.settledAt
          : type === "expense" ? t.amount < 0 && !t.owedBy
          : t.amount > 0 && !t.repaymentFor
      )
      .filter((t) => category === "all" || t.category === category)
      .filter((t) => !q || t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [inPeriod, search, type, category]);

  // Group by calendar day (local time)
  const groups = useMemo(() => {
    const map = new Map();
    for (const t of filtered) {
      const key = toDateKey(t.date);
      if (!map.has(key)) map.set(key, { key, date: t.date, items: [], net: 0 });
      const g = map.get(key);
      g.items.push(t);
      g.net += t.amount;
    }
    return [...map.values()];
  }, [filtered]);

  // Owed money and its repayment cancel out, so they're left out of the totals
  const totalOut = filtered.filter((t) => t.amount < 0 && !t.owedBy).reduce((a, t) => a - t.amount, 0);
  const totalIn = filtered.filter((t) => t.amount > 0 && !t.repaymentFor).reduce((a, t) => a + t.amount, 0);
  const totalOwed = filtered.filter((t) => t.owedBy && !t.settledAt).reduce((a, t) => a - t.amount, 0);

  const startEdit = (t) => {
    setError("");
    setEditing({
      id: t.id,
      title: t.title,
      amount: String(Math.abs(t.amount)),
      type: t.amount < 0 ? "expense" : "income",
      category: t.category,
      date: toLocalInput(t.date),
      recurring: Boolean(t.recurringId),
      source: t.source,
      originalCategory: t.category,
      remember: Boolean(t.source),
      owedBy: t.owedBy || "",
      settledAt: t.settledAt,
    });
  };

  const save = async () => {
    const value = Number(editing.amount);
    if (!editing.title.trim() || !(value > 0) || !editing.category.trim()) {
      setError("Enter a title, an amount above 0 and a category");
      return;
    }
    try {
      setSaving(true);
      const res = await api.put(`/transactions/${editing.id}`, {
        title: editing.title.trim(),
        amount: editing.type === "expense" ? -value : value,
        type: editing.type,
        category: editing.category.trim(),
        date: new Date(editing.date).toISOString(),
        rememberPayee: categoryChanged && editing.remember,
        owedBy: editing.type === "expense" ? editing.owedBy.trim() || null : null,
      });
      const { rememberedCount, ...saved } = res.data;
      if (rememberedCount > 0) {
        // Earlier imports from this payee were re-categorised on the server too
        refresh().catch(() => {});
      } else {
        setTransactions((prev) => prev.map((t) => (t.id === saved.id ? saved : t)));
      }
      if (categoryChanged && editing.remember) {
        toast(`${saved.title} will always go to ${saved.category}${rememberedCount ? ` · ${rememberedCount} earlier updated` : ""}`);
      }
      setEditing(null);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't save changes");
    } finally {
      setSaving(false);
    }
  };

  // People who already owe you something, for the suggestions list
  const owedPeople = [...new Set(transactions.filter((t) => t.owedBy).map((t) => t.owedBy))].sort();

  const settle = async () => {
    try {
      setSaving(true);
      const res = await api.post(`/transactions/${editing.id}/settle`);
      const { transaction, repayment } = res.data;
      setTransactions((prev) => [repayment, ...prev.map((t) => (t.id === transaction.id ? transaction : t))]);
      setEditing(null);
      toast(`${formatINR(Math.abs(transaction.amount))} from ${transaction.owedBy} received`);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't mark it as repaid");
    } finally {
      setSaving(false);
    }
  };

  const unsettle = async () => {
    try {
      setSaving(true);
      const res = await api.delete(`/transactions/${editing.id}/settle`);
      setTransactions((prev) => [
        res.data.transaction,
        ...prev.filter((t) => t.id !== editing.id && t.repaymentFor !== editing.id),
      ]);
      setEditing(null);
    } catch {
      setError("Couldn't undo it");
    } finally {
      setSaving(false);
    }
  };

  // Deleted at once, with Undo for 5 seconds
  const removeTx = (t) => {
    const undo = deleteWithUndo(t, { onError: () => toast("Couldn't delete it. Try again.", "error") });
    toast(`Deleted ${t.title}`, { action: { label: "Undo", onClick: undo } });
  };

  const remove = () => {
    const t = transactions.find((x) => x.id === editing.id);
    setEditing(null);
    if (t) removeTx(t);
  };

  const categoryChanged = editing && editing.category.trim() && editing.category.trim() !== editing.originalCategory;

  return (
    <Page>
      <PageHeader title="Activity"
        subtitle={period === "cycle" ? cycle.label : period === "last" ? lastCycle.label : "Everything you've recorded"} />

      {/* Totals for the current view */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <Card className="p-4">
          <p className="text-[13px] text-ink-3">Spent</p>
          <p className="tabular text-xl font-semibold mt-1">{formatINR(totalOut)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[13px] text-ink-3">Received</p>
          <p className={`tabular text-xl font-semibold mt-1 ${totalIn > 0 ? "text-pos" : ""}`}>{formatINR(totalIn)}</p>
        </Card>
      </div>

      {totalOwed > 0 && (
        <p className="text-[13px] text-warn -mt-3 mb-4 px-1 tabular">
          + {formatINR(totalOwed)} owed back to you (not counted above)
        </p>
      )}

      {/* Search + filters */}
      <div className="relative mb-3">
        <Search className="w-[18px] h-[18px] text-ink-3 absolute left-4 top-1/2 -translate-y-1/2" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search"
          aria-label="Search transactions" className={`${inputClass} pl-11`} />
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
        {PERIODS.map((p) => <Chip key={p.value} active={period === p.value} onClick={() => setPeriod(p.value)}>{p.label}</Chip>)}
        <span className="w-px bg-line shrink-0 mx-1" />
        {TYPES.map((t) => <Chip key={t.value} active={type === t.value} onClick={() => setType(t.value)}>{t.label}</Chip>)}
      </div>
      {categories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 mt-2 pb-1">
          <Chip active={category === "all"} onClick={() => setCategory("all")}>All categories</Chip>
          {categories.map((c) => <Chip key={c} active={category === c} onClick={() => setCategory(c)}>{c}</Chip>)}
        </div>
      )}

      {/* List */}
      <div className="mt-6 space-y-6">
        {loading ? (
          <>
            <Skeleton className="h-40" />
            <Skeleton className="h-28" />
          </>
        ) : groups.length === 0 ? (
          <Card>
            <EmptyState icon={ArrowLeftRight}
              title={transactions.length ? "Nothing matches" : "No transactions yet"}
              text={transactions.length ? "Try a different period, filter or search." : "Tap + to add your first one."}
              action={!transactions.length && <Button onClick={openQuickAdd}>Add transaction</Button>} />
          </Card>
        ) : (
          groups.map((g) => (
            <section key={g.key}>
              <div className="flex items-center justify-between px-1 mb-2 text-[13px]">
                <span className="font-medium text-ink-2">{dayLabel(g.date)}</span>
                <span className="tabular text-ink-3">{formatINR(g.net, { sign: g.net > 0 })}</span>
              </div>
              <Card className="divide-y divide-line/60 overflow-hidden">
                {g.items.map((t) => (
                  <SwipeRow key={t.id} onDelete={() => removeTx(t)}>
                    <TransactionRow t={t} onClick={() => startEdit(t)}
                      meta={`${t.category} · ${new Date(t.date).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}`} />
                  </SwipeRow>
                ))}
              </Card>
            </section>
          ))
        )}
      </div>

      {/* Edit sheet */}
      <Sheet open={Boolean(editing)} onClose={() => setEditing(null)} title="Edit transaction">
        {editing && (
          <div className="space-y-4">
            {(editing.recurring || editing.source) && (
              <p className="text-[13px] text-ink-3 flex items-center gap-1.5">
                {editing.recurring ? <><Repeat className="w-3.5 h-3.5" /> Added by a recurring item</> : <><Mail className="w-3.5 h-3.5" /> Imported from a bank {editing.source}</>}
              </p>
            )}
            <Segmented value={editing.type} onChange={(v) => setEditing({ ...editing, type: v })}
              options={[{ value: "expense", label: "Expense" }, { value: "income", label: "Income" }]} />
            <Field label="Amount (₹)">
              <Input type="number" inputMode="decimal" min="0" step="any" value={editing.amount}
                onChange={(e) => setEditing({ ...editing, amount: e.target.value })} />
            </Field>
            <Field label="Title">
              <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
            </Field>
            <Field label="Category">
              <PickOrAdd value={editing.category} options={allCategories(transactions)}
                newLabel="New category…" placeholder="Category name"
                onChange={(v) => setEditing({ ...editing, category: v })} />
            </Field>
            {categoryChanged && (
              <label className="flex items-start gap-3 p-3 rounded-2xl bg-surface-2 cursor-pointer">
                <input type="checkbox" checked={editing.remember}
                  onChange={(e) => setEditing({ ...editing, remember: e.target.checked })}
                  className="mt-0.5 w-4 h-4 accent-[#8b5cf6]" />
                <span className="text-sm">
                  Always use <b>{editing.category.trim()}</b> for <b>{editing.title.trim()}</b>
                  <span className="block text-[13px] text-ink-3">Applies to future bank imports and updates earlier ones from this payee.</span>
                </span>
              </label>
            )}
            {/* Work expense / money lent: stays out of the budget until repaid */}
            {editing.type === "expense" && !editing.settledAt && (
              <Field label="Owed back by" hint="A work expense to claim, or money you lent. It won't count against your budget until it's repaid.">
                <PickOrAdd value={editing.owedBy} options={owedPeople} allowEmpty emptyLabel="Nobody — my own spending"
                  newLabel="Someone else…" placeholder="Acme, Rahul…"
                  onChange={(v) => setEditing({ ...editing, owedBy: v })} />
              </Field>
            )}
            {editing.owedBy && !editing.settledAt && (
              <Button variant="secondary" className="w-full" onClick={settle} disabled={saving}>
                <HandCoins className="w-4 h-4" /> Mark as repaid by {editing.owedBy}
              </Button>
            )}
            {editing.settledAt && (
              <div className="p-3 rounded-2xl bg-surface-2 text-sm">
                <p className="text-pos font-medium">Repaid by {editing.owedBy}</p>
                <p className="text-[13px] text-ink-3 mb-2">A matching income entry was added on {dayLabel(editing.settledAt)}.</p>
                <button onClick={unsettle} className="text-[13px] font-semibold text-accent-ink">Undo repayment</button>
              </div>
            )}
            <Field label="Date & time">
              <Input type="datetime-local" value={editing.date} className="[color-scheme:dark]"
                onChange={(e) => setEditing({ ...editing, date: e.target.value })} />
            </Field>
            {error && <p className="text-sm text-neg">{error}</p>}
            <div className="flex gap-3 pt-2">
              <Button variant="danger" onClick={remove} disabled={saving}>Delete</Button>
              <Button className="flex-1" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
            </div>
          </div>
        )}
      </Sheet>
    </Page>
  );
}

export default Transactions;
