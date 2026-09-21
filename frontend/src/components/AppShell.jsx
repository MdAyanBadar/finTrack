import { NavLink, Link, useLocation } from "react-router-dom";
import { House, ArrowLeftRight, ChartPie, Target, Plus } from "lucide-react";
import { openQuickAdd } from "../utils/quickAdd";
import { prefetchTransactions } from "../api/transactionStore";
import { useResource } from "../api/resourceStore";

const TABS = [
  { to: "/", label: "Home", icon: House, end: true },
  { to: "/transactions", label: "Activity", icon: ArrowLeftRight, prefetch: true },
  { to: "/insights", label: "Insights", icon: ChartPie },
  { to: "/budget-goals", label: "Plan", icon: Target },
];

const HIDDEN_ON = ["/login", "/register"];

export function Avatar({ size = "md" }) {
  const { data: user } = useResource("/users/me", null);
  const s = size === "sm" ? "w-8 h-8 text-sm" : "w-10 h-10 text-base";
  return (
    <Link to="/profile" aria-label="Profile"
      className={`${s} shrink-0 rounded-full bg-surface-2 border border-line flex items-center justify-center font-semibold text-ink hover:border-ink-3 transition`}>
      {user?.name?.charAt(0).toUpperCase() || "·"}
    </Link>
  );
}

// Slim top bar, desktop and tablets only
function TopBar() {
  return (
    <header className="hidden sm:block sticky top-0 z-40 bg-bg/80 backdrop-blur-xl border-b border-line/60">
      <div className="mx-auto max-w-5xl h-16 px-6 flex items-center gap-8">
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <span className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center text-white font-bold">₹</span>
          <span className="font-bold text-ink tracking-tight">FinTrack</span>
        </Link>
        <nav className="flex items-center gap-1">
          {TABS.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.end}
              onMouseEnter={t.prefetch ? prefetchTransactions : undefined}
              className={({ isActive }) =>
                `h-9 px-3.5 rounded-full text-sm font-medium flex items-center transition ${
                  isActive ? "bg-surface-2 text-ink" : "text-ink-3 hover:text-ink"
                }`}>
              {t.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <button onClick={openQuickAdd}
            className="h-9 pl-3 pr-4 rounded-full bg-accent text-white text-sm font-semibold flex items-center gap-1.5 hover:brightness-110 transition">
            <Plus className="w-4 h-4" /> Add
          </button>
          <Avatar size="sm" />
        </div>
      </div>
    </header>
  );
}

// Bottom tab bar, phones only
function TabBar() {
  const left = TABS.slice(0, 2);
  const right = TABS.slice(2);
  const Tab = ({ t }) => (
    <NavLink to={t.to} end={t.end}
      onTouchStart={t.prefetch ? prefetchTransactions : undefined}
      className={({ isActive }) =>
        `flex-1 flex flex-col items-center justify-center gap-1 h-full text-[11px] font-medium transition ${
          isActive ? "text-ink" : "text-ink-3"
        }`}>
      {({ isActive }) => (
        <>
          <t.icon className="w-6 h-6" strokeWidth={isActive ? 2.25 : 1.75} />
          {t.label}
        </>
      )}
    </NavLink>
  );

  return (
    <nav aria-label="Main"
      className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-bg/90 backdrop-blur-xl border-t border-line/60"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="h-16 flex items-center px-2">
        {left.map((t) => <Tab key={t.to} t={t} />)}
        <div className="flex-1 flex justify-center">
          <button onClick={openQuickAdd} aria-label="Add transaction"
            className="w-12 h-12 rounded-2xl bg-accent text-white flex items-center justify-center shadow-lg shadow-accent/30 active:scale-95 transition">
            <Plus className="w-6 h-6" strokeWidth={2.5} />
          </button>
        </div>
        {right.map((t) => <Tab key={t.to} t={t} />)}
      </div>
    </nav>
  );
}

function AppShell({ children }) {
  const { pathname } = useLocation();
  const showNav = Boolean(localStorage.getItem("token")) && !HIDDEN_ON.includes(pathname);

  return (
    <div className="min-h-dvh bg-bg">
      {showNav && <TopBar />}
      <main>{children}</main>
      {showNav && <TabBar />}
    </div>
  );
}

export default AppShell;
