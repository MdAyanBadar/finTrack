/* =========================
   LAST KNOWN DATA, KEPT ON THE DEVICE
   So the app shows your numbers offline (and instantly on a cold start).
   Stored per login token; a different account never sees it.
========================= */
const PREFIX = "fintrack:cache:";
const key = (name) => PREFIX + name;
const token = () => localStorage.getItem("token");

export const saveLocal = (name, data) => {
  try {
    localStorage.setItem(key(name), JSON.stringify({ token: token(), at: Date.now(), data }));
  } catch {
    /* private mode or storage full: caching is optional */
  }
};

export const loadLocal = (name) => {
  try {
    const raw = JSON.parse(localStorage.getItem(key(name)) || "null");
    if (!raw || raw.token !== token()) return null;
    return raw;
  } catch {
    return null;
  }
};

// Most recent time any data was saved, for the "last updated" line
export const lastSyncAt = () => {
  let newest = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k?.startsWith(PREFIX)) continue;
    try {
      const raw = JSON.parse(localStorage.getItem(k));
      if (raw?.token === token() && raw.at > newest) newest = raw.at;
    } catch { /* ignore a damaged entry */ }
  }
  return newest || null;
};

export const clearLocal = () => {
  for (const k of Object.keys(localStorage)) if (k.startsWith(PREFIX)) localStorage.removeItem(k);
};
