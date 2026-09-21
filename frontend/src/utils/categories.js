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
