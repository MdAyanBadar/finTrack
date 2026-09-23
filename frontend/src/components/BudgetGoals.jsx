import { useState } from "react";
import { ChevronRight, Wallet, CalendarDays, PiggyBank } from "lucide-react";
import api from "../api/api";
import { useResource } from "../api/resourceStore";
import { getPayCycle } from "../utils/payCycle";
import { formatINR } from "../utils/format";
import { toast } from "../utils/toast";
import { Page, PageHeader, Card, Sheet, Field, Input, Button, Skeleton } from "./ui";
import RecurringManager from "./RecurringManager";
import CategoryLimitsEditor from "./CategoryLimitsEditor";
import SavingsPots from "./SavingsPots";
import SplitGroups from "./SplitGroups";

const ordinal = (n) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const SETTINGS = {
  monthlyBudget: {
    icon: Wallet, label: "Budget per pay cycle", title: "Budget per pay cycle",
    hint: "What you plan to spend between one salary and the next.",
    format: (v) => (v > 0 ? formatINR(v) : "Not set"),
    parse: (s) => { const n = Number(s); return Number.isFinite(n) && n >= 0 ? n : null; },
    error: "Enter an amount of 0 or more",
  },
  salaryDay: {
    icon: CalendarDays, label: "Salary day", title: "Salary day",
    hint: "Your budget resets on this day each month. In shorter months, the last day is used.",
    format: (v) => `${ordinal(v)} of the month`,
    parse: (s) => { const n = Number(s); return Number.isInteger(n) && n >= 1 && n <= 31 ? n : null; },
    error: "Enter a day from 1 to 31",
  },
  savingsGoal: {
    icon: PiggyBank, label: "Savings goal", title: "Savings goal",
    hint: "Unspent budget moves toward this at the end of each pay cycle.",
    format: (v) => (v > 0 ? formatINR(v) : "Not set"),
    parse: (s) => { const n = Number(s); return Number.isFinite(n) && n >= 0 ? n : null; },
    error: "Enter an amount of 0 or more",
  },
};

function BudgetGoals() {
  const { data: budget, setData: setBudget, loading } = useResource("/budget", { monthlyBudget: 0, savingsGoal: 0, salaryDay: 1 });
  const [editing, setEditing] = useState(null); // key of SETTINGS
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const salaryDay = budget?.salaryDay ?? 1;
  const cycle = getPayCycle(salaryDay);

  const open = (key) => {
    setError("");
    setEditing(key);
    setValue(String(budget?.[key] ?? ""));
  };

  const save = async () => {
    const spec = SETTINGS[editing];
    const parsed = spec.parse(value);
    if (parsed === null) {
      setError(spec.error);
      return;
    }
    try {
      setSaving(true);
      const res = await api.put("/budget", {
        monthlyBudget: budget.monthlyBudget ?? 0,
        savingsGoal: budget.savingsGoal ?? 0,
        [editing]: parsed,
        ...(editing === "salaryDay" && { salaryDay: parsed }),
      });
      setBudget(res.data);
      toast(`${spec.label} updated`);
      setEditing(null);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Page>
      <PageHeader title="Plan" subtitle={`Current pay cycle · ${cycle.label}`} />

      {loading ? (
        <Skeleton className="h-48" />
      ) : (
        <Card className="divide-y divide-line/60 overflow-hidden">
          {Object.entries(SETTINGS).map(([key, spec]) => (
            <button key={key} onClick={() => open(key)}
              className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left hover:bg-surface-2/60 transition">
              <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center shrink-0">
                <spec.icon className="w-[18px] h-[18px] text-ink-2" />
              </div>
              <span className="flex-1 text-[15px] font-medium">{spec.label}</span>
              <span className="tabular text-[15px] text-ink-2">{spec.format(budget?.[key] ?? 0)}</span>
              <ChevronRight className="w-4 h-4 text-ink-3" />
            </button>
          ))}
        </Card>
      )}

      <RecurringManager salaryDay={salaryDay} />
      <CategoryLimitsEditor />
      <SavingsPots />
      <SplitGroups />

      <Sheet open={Boolean(editing)} onClose={() => setEditing(null)} title={editing ? SETTINGS[editing].title : ""}>
        {editing && (
          <div className="space-y-4">
            <Field hint={SETTINGS[editing].hint}>
              <Input type="number" inputMode={editing === "salaryDay" ? "numeric" : "decimal"} autoFocus
                min={editing === "salaryDay" ? 1 : 0} max={editing === "salaryDay" ? 31 : undefined}
                value={value} onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && save()} className="text-lg" />
            </Field>
            {editing === "salaryDay" && Number(value) >= 1 && Number(value) <= 31 && (
              <p className="text-[13px] text-ink-3">Cycle would be {getPayCycle(Number(value)).label}</p>
            )}
            {error && <p className="text-sm text-neg">{error}</p>}
            <Button className="w-full" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </div>
        )}
      </Sheet>
    </Page>
  );
}

export default BudgetGoals;
