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
        // Hide anything waiting to be deleted (see deleteWithUndo)
        const data = (res.data || []).filter((t) => !pendingDeletes.has(t.id));
        publish(data);
        return data;
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

/* =========================
   DELETE WITH UNDO
   The transaction disappears at once; the server delete is sent after a
   few seconds unless undone. Pending deletes are flushed if the page closes.
========================= */
const pendingDeletes = new Map(); // id -> { timer, tx }

const sendDelete = (id, keepalive = false) =>
  keepalive
    ? fetch(`${api.defaults.baseURL}/transactions/${id}`, {
        method: "DELETE",
        keepalive: true,
        headers: { Authorization: `Bearer ${currentToken()}` },
      })
    : api.delete(`/transactions/${id}`);

export const deleteWithUndo = (tx, { delay = 5000, onError } = {}) => {
  publish((getCached() ?? []).filter((t) => t.id !== tx.id));
  const timer = setTimeout(() => {
    pendingDeletes.delete(tx.id);
    sendDelete(tx.id).catch(() => {
      publish([tx, ...(getCached() ?? [])]); // put it back
      onError?.();
    });
  }, delay);
  pendingDeletes.set(tx.id, { timer, tx });

  // Undo
  return () => {
    const p = pendingDeletes.get(tx.id);
    if (!p) return false;
    clearTimeout(p.timer);
    pendingDeletes.delete(tx.id);
    publish([tx, ...(getCached() ?? [])]);
    return true;
  };
};

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => {
    for (const [id, { timer }] of pendingDeletes) {
      clearTimeout(timer);
      sendDelete(id, true);
    }
    pendingDeletes.clear();
  });
}
