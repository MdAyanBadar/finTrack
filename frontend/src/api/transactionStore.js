import { useEffect, useState } from "react";
import api from "./api";

/* =========================
   SHARED TRANSACTION CACHE
   Pages show the last loaded list instantly and refresh it in the background,
   so switching tabs doesn't wait on the network every time.
   The cache belongs to one login token and is dropped when the token changes.
========================= */

let cache = null; // { token, data }
let inflight = null;
const listeners = new Set();

const currentToken = () => localStorage.getItem("token");

const getCached = () => (cache && cache.token === currentToken() ? cache.data : null);

const publish = (data) => {
  cache = { token: currentToken(), data };
  listeners.forEach((fn) => fn(data));
};

// Fetch from the server (deduplicated while a request is running)
export const loadTransactions = () => {
  if (!currentToken()) return Promise.resolve([]);
  if (!inflight) {
    inflight = api
      .get("/transactions")
      .then((res) => {
        publish(res.data || []);
        return res.data || [];
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
};

// Start loading early, e.g. when the user hovers the Transactions tab
export const prefetchTransactions = () => {
  if (!getCached()) loadTransactions().catch(() => {});
};

export function useTransactions() {
  const [transactions, setLocal] = useState(() => getCached() ?? []);
  const [loading, setLoading] = useState(() => getCached() === null);

  useEffect(() => {
    listeners.add(setLocal);
    loadTransactions()
      .catch((err) => console.error("Fetch transactions failed:", err))
      .finally(() => setLoading(false));
    return () => listeners.delete(setLocal);
  }, []);

  // Same API as a useState setter; updates every page using the list
  const setTransactions = (next) =>
    publish(typeof next === "function" ? next(getCached() ?? []) : next);

  return { transactions, setTransactions, loading, refresh: loadTransactions };
}
