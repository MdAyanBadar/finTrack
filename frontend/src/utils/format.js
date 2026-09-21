// ₹13,638 (whole rupees) or ₹13,638.50 when there are paise
export const formatINR = (amount, { sign = false } = {}) => {
  const n = Number(amount) || 0;
  const abs = Math.abs(n);
  const text = abs.toLocaleString("en-IN", {
    minimumFractionDigits: Number.isInteger(abs) ? 0 : 2,
    maximumFractionDigits: 2,
  });
  const prefix = sign ? (n < 0 ? "−" : "+") : n < 0 ? "−" : "";
  return `${prefix}₹${text}`;
};

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

// "Today", "Yesterday", "Mon 21 Sep", or "21 Sep 2025" for other years
export const dayLabel = (value, now = new Date()) => {
  const d = new Date(value);
  const diff = Math.round((startOfDay(now) - startOfDay(d)) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString("en-IN", {
    weekday: diff < 7 && diff > 0 ? "short" : undefined,
    day: "numeric",
    month: "short",
    year: d.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
};

export const shortDate = (value) =>
  new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

export const greeting = (now = new Date()) => {
  const h = now.getHours();
  return h < 5 ? "Good night" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};
