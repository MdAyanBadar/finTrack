import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, UtensilsCrossed, Car, ShoppingBag, Receipt, Clapperboard, HeartPulse, House,
  Wallet, CircleDot, Tag, ChevronRight,
} from "lucide-react";
import Portal from "./Portal";
import { formatINR } from "../utils/format";

/* =========================
   LAYOUT
========================= */
export function Page({ children, className = "" }) {
  return (
    <div className={`mx-auto w-full max-w-2xl px-4 sm:px-6 pt-6 sm:pt-10 pb-tabbar sm:pb-16 ${className}`}>
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle, right }) {
  return (
    <header className="flex items-start justify-between gap-4 mb-6">
      <div className="min-w-0">
        <h1 className="text-[28px] sm:text-3xl font-bold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="text-sm text-ink-3 mt-1">{subtitle}</p>}
      </div>
      {right}
    </header>
  );
}

export function Card({ children, className = "", as: Tag = "div", ...props }) {
  return (
    <Tag className={`bg-surface rounded-3xl border border-line/60 ${className}`} {...props}>
      {children}
    </Tag>
  );
}

// Section title with an optional "See all" style link
export function Section({ title, action, to, onAction, children, className = "" }) {
  return (
    <section className={`mt-8 ${className}`}>
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        {action && to && (
          <Link to={to} className="text-sm font-medium text-accent-ink flex items-center gap-0.5">
            {action} <ChevronRight className="w-4 h-4" />
          </Link>
        )}
        {action && onAction && (
          <button onClick={onAction} className="text-sm font-medium text-accent-ink">{action}</button>
        )}
      </div>
      {children}
    </section>
  );
}

/* =========================
   CONTROLS
========================= */
const BUTTON = {
  primary: "bg-accent text-white hover:brightness-110",
  secondary: "bg-surface-2 text-ink hover:bg-surface-3",
  ghost: "text-ink-2 hover:text-ink hover:bg-surface-2",
  danger: "bg-neg/10 text-neg hover:bg-neg/20",
};

export function Button({ variant = "primary", size = "md", className = "", ...props }) {
  const sizes = { sm: "h-9 px-3.5 text-sm rounded-xl", md: "h-12 px-5 text-[15px] rounded-2xl", lg: "h-14 px-6 text-base rounded-2xl" };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-semibold transition active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none ${sizes[size]} ${BUTTON[variant]} ${className}`}
      {...props}
    />
  );
}

export function IconButton({ label, className = "", ...props }) {
  return (
    <button
      aria-label={label}
      className={`w-10 h-10 inline-flex items-center justify-center rounded-full bg-surface-2 text-ink-2 hover:text-ink hover:bg-surface-3 transition ${className}`}
      {...props}
    />
  );
}

export const inputClass =
  "w-full h-12 bg-surface-2 border border-transparent focus:border-accent/60 rounded-2xl px-4 text-base text-ink placeholder:text-ink-3 outline-none transition";

export function Field({ label, hint, children }) {
  return (
    <label className="block">
      {label && <span className="block text-[13px] font-medium text-ink-2 mb-1.5 px-1">{label}</span>}
      {children}
      {hint && <span className="block text-xs text-ink-3 mt-1.5 px-1">{hint}</span>}
    </label>
  );
}

export function Input(props) {
  return <input {...props} className={`${inputClass} ${props.className || ""}`} />;
}

export function Select({ children, ...props }) {
  return (
    <select {...props} className={`${inputClass} appearance-none ${props.className || ""}`}>
      {children}
    </select>
  );
}

// Segmented control: [Expense | Income]
export function Segmented({ options, value, onChange }) {
  return (
    <div className="grid gap-1 p-1 bg-surface-2 rounded-2xl" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`h-10 rounded-xl text-sm font-semibold transition ${
            value === o.value ? "bg-surface-3 text-ink shadow-sm" : "text-ink-3 hover:text-ink-2"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Chip({ active, children, ...props }) {
  return (
    <button
      type="button"
      className={`h-9 px-3.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
        active ? "bg-ink text-bg" : "bg-surface-2 text-ink-2 hover:text-ink"
      }`}
      {...props}
    >
      {children}
    </button>
  );
}

/* =========================
   DATA DISPLAY
========================= */
export function Amount({ value, className = "", sign = true }) {
  const color = value > 0 ? "text-pos" : "text-ink";
  return <span className={`tabular font-semibold ${color} ${className}`}>{formatINR(value, { sign: sign && value > 0 })}</span>;
}

export function ProgressBar({ value, tone = "accent", className = "" }) {
  const tones = { accent: "bg-accent", pos: "bg-pos", warn: "bg-warn", neg: "bg-neg", ink: "bg-ink" };
  return (
    <div className={`h-1.5 w-full rounded-full bg-surface-3 overflow-hidden ${className}`}>
      <div className={`h-full rounded-full ${tones[tone]} transition-all duration-500`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

const CATEGORY_ICONS = {
  food: UtensilsCrossed, travel: Car, shopping: ShoppingBag, bills: Receipt,
  entertainment: Clapperboard, health: HeartPulse, housing: House, rent: House,
  income: Wallet, salary: Wallet, general: CircleDot,
};

export function CategoryIcon({ category, size = "md" }) {
  const Icon = CATEGORY_ICONS[(category || "").toLowerCase()] || Tag;
  const s = size === "sm" ? "w-9 h-9" : "w-11 h-11";
  return (
    <div className={`${s} shrink-0 rounded-full bg-surface-2 flex items-center justify-center`}>
      <Icon className="w-[18px] h-[18px] text-ink-2" />
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="text-center py-12 px-6">
      {Icon && (
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-surface-2 flex items-center justify-center">
          <Icon className="w-6 h-6 text-ink-3" />
        </div>
      )}
      <p className="text-ink font-semibold">{title}</p>
      {text && <p className="text-sm text-ink-3 mt-1 max-w-xs mx-auto">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-surface-2 rounded-2xl ${className}`} />;
}

/* =========================
   SHEET
   Bottom sheet on phones, centred dialog on larger screens.
========================= */
export function Sheet({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <Portal lockScroll={open}>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              role="dialog" aria-modal="true" aria-label={title}
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 320 }}
              className="relative w-full sm:max-w-md max-h-[92vh] flex flex-col bg-surface border-t sm:border border-line rounded-t-[28px] sm:rounded-[28px]"
              style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
              <div className="w-10 h-1 bg-surface-3 rounded-full mx-auto mt-3 sm:hidden" />
              <div className="flex items-center justify-between px-6 pt-4 pb-2">
                <h2 className="text-lg font-bold text-ink">{title}</h2>
                <IconButton label="Close" onClick={onClose}><X className="w-5 h-5" /></IconButton>
              </div>
              <div className="px-6 pb-6 overflow-y-auto overscroll-contain">{children}</div>
              {footer && <div className="px-6 pb-6">{footer}</div>}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
