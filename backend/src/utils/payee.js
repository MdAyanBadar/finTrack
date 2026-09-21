// "KARTHIK  G" and "Karthik G" are the same payee
export const normalizePayee = (s) => String(s ?? "").toLowerCase().replace(/\s+/g, " ").trim();
