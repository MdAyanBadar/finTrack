import { useState } from "react";
import { HandCoins, ChevronDown } from "lucide-react";
import api from "../api/api";
import { useTransactions } from "../api/transactionStore";
import { formatINR, shortDate } from "../utils/format";
import { toast } from "../utils/toast";
import { Card, Section, CategoryIcon } from "./ui";

/* =========================
   MONEY PEOPLE OWE YOU
   Work expenses to claim back, or cash lent to a friend. Grouped by person;
   tap a person to see what makes up the amount. Kept out of your budget
   until it's repaid.
========================= */
function OwedCard({ items, total }) {
  const { setTransactions } = useTransactions();
  const [busyId, setBusyId] = useState(null);

  const byPerson = items.reduce((acc, t) => {
    (acc[t.owedBy] ||= []).push(t);
    return acc;
  }, {});
  const people = Object.entries(byPerson)
    .map(([name, rows]) => ({ name, rows, total: rows.reduce((a, t) => a + Math.abs(t.amount), 0) }))
    .sort((a, b) => b.total - a.total);

  // One person: show their items straight away. Several: start collapsed.
  const [open, setOpen] = useState(people.length === 1 ? people[0].name : null);

  const undo = async (tx) => {
    try {
      const res = await api.delete(`/transactions/${tx.id}/settle`);
      setTransactions((prev) => [res.data.transaction, ...prev.filter((t) => t.id !== tx.id && t.repaymentFor !== tx.id)]);
    } catch {
      toast("Couldn't undo it", "error");
    }
  };

  const settle = async (tx) => {
    try {
      setBusyId(tx.id);
      const res = await api.post(`/transactions/${tx.id}/settle`);
      const { transaction, repayment } = res.data;
      setTransactions((prev) => [repayment, ...prev.map((t) => (t.id === transaction.id ? transaction : t))]);
      toast(`${formatINR(Math.abs(tx.amount))} from ${tx.owedBy} received`, {
        action: { label: "Undo", onClick: () => undo(tx) },
      });
    } catch (err) {
      toast(err.response?.data?.message || "Couldn't mark it as repaid", "error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Section title="Owed to you">
      <Card className="overflow-hidden">
        {people.length > 1 && (
          <div className="flex items-center gap-3.5 px-4 pt-4 pb-3 border-b border-line/60">
            <div className="w-11 h-11 rounded-full bg-warn/10 flex items-center justify-center shrink-0">
              <HandCoins className="w-5 h-5 text-warn" />
            </div>
            <div>
              <p className="tabular text-xl font-bold">{formatINR(total)}</p>
              <p className="text-[13px] text-ink-3">from {people.length} people</p>
            </div>
          </div>
        )}

        <div className="divide-y divide-line/60">
          {people.map((p) => {
            const expanded = open === p.name;
            return (
              <div key={p.name}>
                <button onClick={() => setOpen(expanded ? null : p.name)}
                  aria-expanded={expanded}
                  className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left hover:bg-surface-2/60 transition">
                  <div className="w-11 h-11 rounded-full bg-warn/10 flex items-center justify-center shrink-0">
                    <HandCoins className="w-5 h-5 text-warn" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold truncate">
                      {p.name} owes you <span className="tabular">{formatINR(p.total)}</span>
                    </p>
                    <p className="text-[13px] text-ink-3">
                      {p.rows.length} {p.rows.length === 1 ? "item" : "items"}
                    </p>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-ink-3 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} />
                </button>

                {expanded && (
                  <div className="divide-y divide-line/60 bg-surface-2/30">
                    {p.rows.map((t) => (
                      <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                        <CategoryIcon category={t.category} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[15px] font-medium truncate">{t.title}</p>
                          <p className="text-[13px] text-ink-3 truncate">{t.category} · {shortDate(t.date)}</p>
                        </div>
                        <span className="tabular text-[15px] font-semibold shrink-0">{formatINR(Math.abs(t.amount))}</span>
                        <button onClick={() => settle(t)} disabled={busyId === t.id}
                          className="h-8 px-3 rounded-full bg-pos/15 text-pos text-[13px] font-semibold shrink-0 disabled:opacity-50">
                          {busyId === t.id ? "…" : "Received"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="px-4 py-3 text-[12px] text-ink-3 border-t border-line/60">
          Left out of your budget until it&apos;s repaid.
        </p>
      </Card>
    </Section>
  );
}

export default OwedCard;
