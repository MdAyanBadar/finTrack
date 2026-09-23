import { Repeat, Mail, HandCoins, Users } from "lucide-react";
import { CategoryIcon, Amount } from "./ui";
import { formatINR } from "../utils/format";

// One transaction line: icon · title / meta · amount
function TransactionRow({ t, meta, onClick }) {
  const Tag = onClick ? "button" : "div";
  const shares = t.shares ?? [];
  const owedFromSplit = shares.filter((s) => !s.settledAt).reduce((a, s) => a + s.amount, 0);
  const owedPending = (t.owedBy && !t.settledAt) || owedFromSplit > 0;
  return (
    <Tag onClick={onClick}
      className={`w-full flex items-center gap-3.5 px-4 py-3 text-left ${onClick ? "hover:bg-surface-2/60 active:bg-surface-2 transition" : ""}`}>
      <CategoryIcon category={t.category} />
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-medium text-ink truncate">{t.title}</p>
        <p className="text-[13px] text-ink-3 truncate flex items-center gap-1.5">
          {t.recurringId && <Repeat className="w-3 h-3 shrink-0" aria-label="Recurring" />}
          {t.source && <Mail className="w-3 h-3 shrink-0" aria-label="Auto-imported" />}
          {shares.length > 0 && <Users className="w-3 h-3 shrink-0" aria-label="Split bill" />}
          {t.owedBy && (
            <HandCoins className={`w-3 h-3 shrink-0 ${t.settledAt ? "text-pos" : "text-warn"}`}
              aria-label={t.settledAt ? "Repaid" : "Owed back"} />
          )}
          {meta ?? t.category}
        </p>
      </div>
      <div className="shrink-0 text-right">
        {/* Owed money is dimmed: it's not really your spending */}
        <Amount value={t.amount} className={`text-[15px] ${owedPending ? "opacity-60" : ""}`} />
        {t.owedBy && (
          <p className={`text-[11px] ${t.settledAt ? "text-pos" : "text-warn"}`}>
            {t.settledAt ? "repaid" : `${t.owedBy} owes`}
          </p>
        )}
        {owedFromSplit > 0 && (
          <p className="tabular text-[11px] text-warn">
            {formatINR(owedFromSplit)} owed by {shares.filter((s) => !s.settledAt).map((s) => s.person).join(", ")}
          </p>
        )}
        {shares.length > 0 && owedFromSplit === 0 && <p className="text-[11px] text-pos">all paid back</p>}
      </div>
    </Tag>
  );
}

export default TransactionRow;
