import { useEffect, useState } from "react";
import api from "./api";
import { saveLocal, loadLocal } from "./persist";

/* =========================
   SMALL SHARED CACHE FOR GET ENDPOINTS
   Same idea as transactionStore: show the last value instantly, refresh in
   the background, and drop everything when the login token changes.
========================= */
const caches = new Map(); // path -> { token, data }
const inflight = new Map();
const listeners = new Map(); // path -> Set(fn)

const token = () => localStorage.getItem("token");
const cached = (path) => {
  const c = caches.get(path);
  if (c && c.token === token()) return c.data;
  const stored = loadLocal(`res:${path}`);
  if (stored) {
    caches.set(path, { token: token(), data: stored.data });
    return stored.data;
  }
  return undefined;
};
const publish = (path, data) => {
  caches.set(path, { token: token(), data });
  saveLocal(`res:${path}`, data);
  listeners.get(path)?.forEach((fn) => fn(data));
};

export const loadResource = (path) => {
  if (!inflight.has(path)) {
    inflight.set(
      path,
      api
        .get(path)
        .then((res) => {
          publish(path, res.data);
          return res.data;
        })
        .finally(() => inflight.delete(path))
    );
  }
  return inflight.get(path);
};

export function useResource(path, fallback) {
  const [data, setLocal] = useState(() => cached(path) ?? fallback);
  const [loading, setLoading] = useState(() => cached(path) === undefined);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!listeners.has(path)) listeners.set(path, new Set());
    listeners.get(path).add(setLocal);
    loadResource(path)
      .then(() => setError(null))
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
    return () => listeners.get(path)?.delete(setLocal);
  }, [path]);

  // Update locally (after a save) for every component using this path
  const setData = (next) =>
    publish(path, typeof next === "function" ? next(cached(path) ?? fallback) : next);

  return { data: data ?? fallback, setData, loading, error, refresh: () => loadResource(path) };
}
