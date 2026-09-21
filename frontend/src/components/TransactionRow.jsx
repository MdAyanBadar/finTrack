import { Repeat, Mail } from "lucide-react";
import { CategoryIcon, Amount } from "./ui";

// One transaction line: icon · title / meta · amount
function TransactionRow({ t, meta, onClick }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag onClick={onClick}
      className={`w-full flex items-center gap-3.5 px-4 py-3 text-left ${onClick ? "hover:bg-surface-2/60 active:bg-surface-2 transition" : ""}`}>
      <CategoryIcon category={t.category} />
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-medium text-ink truncate">{t.title}</p>
        <p className="text-[13px] text-ink-3 truncate flex items-center gap-1.5">
          {t.recurringId && <Repeat className="w-3 h-3 shrink-0" aria-label="Recurring" />}
          {t.source && <Mail className="w-3 h-3 shrink-0" aria-label="Auto-imported" />}
          {meta ?? t.category}
        </p>
      </div>
      <Amount value={t.amount} className="text-[15px] shrink-0" />
    </Tag>
  );
}

export default TransactionRow;
