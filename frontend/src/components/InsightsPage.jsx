import { useFinance } from "../hooks/useFinance";
import { Page, PageHeader, Section, Skeleton } from "./ui";
import CycleReport from "./CycleReport";
import CategoryBreakdown from "./CategoryBreakdown";
import SpendingCalendar from "./SpendingCalendar";
import SpendingTrends from "./SpendingTrends";
import CashFlowChart from "./CashFlowChart";

function InsightsPage() {
  const f = useFinance();

  if (f.loading) {
    return (
      <Page>
        <Skeleton className="h-8 w-40 mb-6" />
        <Skeleton className="h-72 mb-4" />
        <Skeleton className="h-80" />
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader title="Insights" subtitle={`Pay cycle ${f.cycle.label}`} />

      <Section title="Where it went" className="mt-0">
        <CategoryBreakdown spentByCategory={f.spentByCategory} colorMap={f.colorMap} transactions={f.cycleTx} />
      </Section>

      <Section title="Calendar">
        <SpendingCalendar transactions={f.transactions} salaryDay={f.salaryDay} budget={f.budget} dailyBudget={f.dailyBudget}
          noSpendKeys={f.streaks.noSpendKeys} />
      </Section>

      <Section title="Last cycle">
        <CycleReport history={f.history} budget={f.budget} />
      </Section>

      <Section title="Trends by category">
        <SpendingTrends history={f.history} colorMap={f.colorMap} />
      </Section>

      <Section title="Income vs spending">
        <CashFlowChart history={f.history} />
      </Section>
    </Page>
  );
}

export default InsightsPage;
