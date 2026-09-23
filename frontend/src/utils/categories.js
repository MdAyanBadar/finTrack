const DEFAULT_CATEGORIES = ["General", "Food", "Travel", "Shopping", "Bills", "Entertainment"];

// Categories the user already uses (defaults + custom ones saved by the Transactions page)
export const knownCategories = (extra = []) => {
  let custom = [];
  try {
    custom = JSON.parse(localStorage.getItem("custom_categories") || "[]").map((c) => c.name);
  } catch {
    custom = [];
  }
  return [...new Set([...DEFAULT_CATEGORIES, ...custom, ...extra])];
};

// Chart colours, validated for contrast and colour-blind separation on the
// dark surface. Assigned by category (not rank) so a category keeps its colour.
export const SERIES_COLORS = ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#9085e9", "#e66767"];
export const OTHER_COLOR = "#52525b";

// Stable colour per category: ordered by all-time spend, so the biggest
// categories get the first (most distinct) colours and keep them everywhere
export const categoryColorMap = (transactions) => {
  const totals = {};
  for (const t of transactions) {
    if (t.amount < 0) totals[t.category || "General"] = (totals[t.category || "General"] || 0) - t.amount;
  }
  const ranked = Object.entries(totals).sort((a, b) => b[1] - a[1]).map(([c]) => c);
  return Object.fromEntries(ranked.map((c, i) => [c, SERIES_COLORS[i] ?? OTHER_COLOR]));
};

// Every category you've actually used, plus the defaults
export const allCategories = (transactions = []) =>
  [...new Set([...knownCategories(), ...transactions.map((t) => t.category).filter(Boolean)])].sort();
