import { useState } from "react";
import { PiggyBank, Plus, Check } from "lucide-react";
import api from "../api/api";
import { useResource } from "../api/resourceStore";
import { loadTransactions, useTransactions } from "../api/transactionStore";
import { formatINR, shortDate } from "../utils/format";
import { toast } from "../utils/toast";
import { potStats } from "../utils/pots";
import { Card, Section, Sheet, Field, Input, Button, EmptyState, ProgressBar } from "./ui";
import TransactionRow from "./TransactionRow";

const EMPTY = { name: "", monthlyAmount: "", months: "" };

/* =========================
   SAVINGS POTS (BC / chit groups, or money simply put aside)
   Payments still leave your account, so they count as spending. The pot shows
   how much of that was actually saved, and what you'll get back.
========================= */
function SavingsPots() {
  const { data: pots, setData: setPots } = useResource("/pots", []);
  const { transactions } = useTransactions();
  const [form, setForm] = useState(null); // { id?, name, monthlyAmount }
  const [detail, setDetail] = useState(null); // pot being viewed
  const [payout, setPayout] = useState(""); // amount received
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const refreshPots = async () => setPots(await api.get("/pots").then((r) => r.data));

  const save = async () => {
    const body = { name: form.name.trim(), monthlyAmount: form.monthlyAmount, months: form.months };
    if (!body.name) {
      setError("Give the pot a name");
      return;
    }
    try {
      setSaving(true);
      if (form.id) await api.put(`/pots/${form.id}`, body);
      else await api.post("/pots", body);
      await refreshPots();
      toast(form.id ? "Pot updated" : `${body.name} created`);
      setForm(null);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't save the pot");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete "${form.name}"? Payments already recorded are kept.`)) return;
    try {
      setSaving(true);
      await api.delete(`/pots/${form.id}`);
      await refreshPots();
      await loadTransactions().catch(() => {});
      setForm(null);
    } catch {
      setError("Couldn't delete the pot");
    } finally {
      setSaving(false);
    }
  };

  // Taking money out doesn't end the pot; with a BC you keep paying the rest
  const withdraw = async () => {
    const amount = Number(payout);
    if (!(amount > 0)) {
      setError("Enter the amount you took out");
      return;
    }
    try {
      setSaving(true);
      await api.post(`/pots/${detail.id}/payout`, { amount });
      await refreshPots();
      await loadTransactions().catch(() => {});
      toast(`${formatINR(amount)} withdrawn from ${detail.name}`);
      setDetail(null);
      setPayout("");
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't record the withdrawal");
    } finally {
      setSaving(false);
    }
  };

  const undoWithdrawal = async () => {
    await api.delete(`/pots/${detail.id}/payout`).catch(() => {});
    await refreshPots();
    await loadTransactions().catch(() => {});
    setDetail(null);
  };

  const setClosed = async (pot, closed) => {
    await api[closed ? "post" : "delete"](`/pots/${pot.id}/close`).catch(() => {});
    await refreshPots();
    setDetail(null);
  };

  const stats = detail ? potStats(detail) : null;

  const potRows = (pot) =>
    transactions
      .filter((t) => t.potId === pot.id)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

  const open = pots.filter((p) => !p.closedAt);
  const closed = pots.filter((p) => p.closedAt);

  const PotRow = ({ p }) => {
    const s = potStats(p);
    return (
      <button onClick={() => { setError(""); setDetail(p); setPayout(String(potStats(p).canWithdraw || "")); }}
        className="w-full px-4 py-3.5 text-left hover:bg-surface-2/60 transition">
        <div className="flex items-center gap-3.5">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${p.closedAt ? "bg-pos/10" : "bg-surface-2"}`}>
            {p.closedAt ? <Check className="w-5 h-5 text-pos" /> : <PiggyBank className="w-5 h-5 text-ink-2" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-medium truncate">{p.name}</p>
            <p className="text-[13px] text-ink-3 truncate">
              {p.months > 0 ? `${p.payments} of ${p.months} months` : `${p.payments} ${p.payments === 1 ? "payment" : "payments"}`}
              {p.monthlyAmount > 0 && ` · ${formatINR(p.monthlyAmount)}/month`}
              {s.takenOut > 0 && ` · took out ${formatINR(s.takenOut)}`}
            </p>
          </div>
          <div className="shrink-0 text-right">
            {/* Saving up: what's in the pot. Settling: what's left to pay. */}
            <span className={`tabular text-[15px] font-semibold ${s.settling ? "text-warn" : ""}`}>
              {formatINR(s.settling ? s.toPay : s.paidIn)}
            </span>
            <p className="tabular text-[11px] text-ink-3">
              {s.settled ? "settled" : s.settling ? "left to pay" : s.target > 0 ? `of ${formatINR(s.target)}` : "saved"}
            </p>
          </div>
        </div>
        {!p.closedAt && s.target > 0 && (
          <ProgressBar value={s.progress} tone={s.settled ? "pos" : s.settling ? "warn" : "accent"} className="mt-2.5" />
        )}
      </button>
    );
  };

  return (
    <Section title="Savings pots" action="Add" onAction={() => { setError(""); setForm(EMPTY); }}>
      <Card className="divide-y divide-line/60 overflow-hidden">
        {pots.length === 0 ? (
          <EmptyState icon={PiggyBank} title="No savings pots"
            text="Track a BC or chit group, or any money you put aside. Payments still count as money leaving your account, but you can see what's saved."
            action={<Button size="sm" onClick={() => setForm(EMPTY)}><Plus className="w-4 h-4" /> Add a pot</Button>} />
        ) : (
          [...open, ...closed].map((p) => <PotRow key={p.id} p={p} />)
        )}
      </Card>

      {/* Create / edit */}
      <Sheet open={Boolean(form)} onClose={() => setForm(null)} title={form?.id ? "Edit pot" : "New savings pot"}>
        {form && (
          <div className="space-y-4">
            <Field label="Name" hint="For example: BC · Ramesh group">
              <Input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Amount per month">
                <Input type="number" inputMode="decimal" min="0" placeholder="7000" value={form.monthlyAmount}
                  onChange={(e) => setForm({ ...form, monthlyAmount: e.target.value })} />
              </Field>
              <Field label="For how many months">
                <Input type="number" inputMode="numeric" min="1" max="120" placeholder="12" value={form.months}
                  onChange={(e) => setForm({ ...form, months: e.target.value })} />
              </Field>
            </div>
            {Number(form.monthlyAmount) > 0 && Number(form.months) > 0 && (
              <p className="text-[13px] text-ink-3 -mt-2">
                Total over {form.months} months: <span className="tabular text-ink">{formatINR(Number(form.monthlyAmount) * Number(form.months))}</span>
              </p>
            )}
            {error && <p className="text-sm text-neg">{error}</p>}
            <div className="flex gap-3 pt-1">
              {form.id && <Button variant="danger" onClick={remove} disabled={saving}>Delete</Button>}
              <Button className="flex-1" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
            </div>
          </div>
        )}
      </Sheet>

      {/* One pot: payments, and receiving the pot */}
      <Sheet open={Boolean(detail)} onClose={() => setDetail(null)} title={detail?.name || ""}>
        {detail && (
          <div className="space-y-4">
            <div className="bg-surface-2 rounded-2xl p-4">
              <p className="text-[13px] text-ink-3">
                {stats.settled ? "Settled" : stats.settling ? "Left to pay" : "Saved so far"}
              </p>
              <p className={`tabular text-3xl font-bold ${stats.settling ? "text-warn" : ""}`}>
                {formatINR(stats.settling ? stats.toPay : stats.paidIn)}
              </p>
              <p className="tabular text-[13px] text-ink-3 mt-1">
                {formatINR(stats.paidIn)} paid of {formatINR(stats.target || stats.takenOut)}
                {stats.takenOut > 0 && ` · ${formatINR(stats.takenOut)} taken out`}
              </p>
              {stats.settling && stats.monthsLeft > 0 && (
                <p className="text-[13px] text-warn mt-0.5">
                  about {stats.monthsLeft} more {stats.monthsLeft === 1 ? "payment" : "payments"} of {formatINR(detail.monthlyAmount)}
                </p>
              )}
              {stats.settled && <p className="text-[13px] text-pos mt-0.5">All payments made</p>}
            </div>
            {stats.target > 0 && !detail.closedAt && (
              <ProgressBar value={stats.progress} tone={stats.settled ? "pos" : stats.settling ? "warn" : "accent"} />
            )}

            {detail.closedAt ? (
              <div className="p-3 rounded-2xl bg-surface-2 text-sm">
                <p className="text-pos font-medium">Closed on {shortDate(detail.closedAt)}</p>
                <button onClick={() => setClosed(detail, false)} className="text-[13px] font-semibold text-accent-ink mt-1">
                  Reopen this pot
                </button>
              </div>
            ) : stats.canWithdraw > 0 ? (
              <Field label="Take money out"
                hint="Recorded as money received today. You keep paying the monthly amount afterwards to settle it.">
                <div className="flex gap-2">
                  <Input type="number" inputMode="decimal" min="0" placeholder={String(stats.canWithdraw || "")}
                    value={payout} onChange={(e) => setPayout(e.target.value)} />
                  <Button variant="secondary" type="button" className="shrink-0"
                    onClick={() => setPayout(String(stats.canWithdraw))}>
                    Full {formatINR(stats.canWithdraw)}
                  </Button>
                </div>
              </Field>
            ) : (
              <p className="text-[13px] text-ink-3">
                You&apos;ve taken the full amount. Keep paying {formatINR(detail.monthlyAmount || 0)} a month until it&apos;s settled.
              </p>
            )}
            {error && <p className="text-sm text-neg">{error}</p>}

            {!detail.closedAt && stats.canWithdraw > 0 && (
              <Button className="w-full" onClick={withdraw} disabled={saving}>
                {saving ? "Saving…" : "Withdraw"}
              </Button>
            )}
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => { setDetail(null); setForm({ id: detail.id, name: detail.name, monthlyAmount: detail.monthlyAmount ?? "", months: detail.months ?? "" }); }}>
                Edit
              </Button>
              {detail.received > 0 && (
                <Button variant="ghost" onClick={undoWithdrawal} disabled={saving}>Undo last withdrawal</Button>
              )}
              {!detail.closedAt && (
                <Button variant="ghost" onClick={() => setClosed(detail, true)} disabled={saving}>Close pot</Button>
              )}
            </div>

            {potRows(detail).length > 0 && (
              <div>
                <p className="text-[13px] font-medium text-ink-3 mb-1 mt-2">Payments</p>
                <div className="-mx-4 divide-y divide-line/60 max-h-64 overflow-y-auto overscroll-contain">
                  {potRows(detail).map((t) => (
                    <TransactionRow key={t.id} t={t} meta={shortDate(t.date)} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Sheet>
    </Section>
  );
}

export default SavingsPots;
