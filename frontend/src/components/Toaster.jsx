import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { onToast } from "../utils/toast";

// Renders messages sent with toast(); sits above the tab bar on phones
function Toaster() {
  const [msg, setMsg] = useState(null);

  useEffect(() => onToast((m) => setMsg({ ...m, id: Date.now() })), []);
  useEffect(() => {
    if (!msg) return;
    const id = setTimeout(() => setMsg(null), msg.duration ?? (msg.action ? 5000 : 3500));
    return () => clearTimeout(id);
  }, [msg]);

  return (
    <AnimatePresence>
      {msg && (
        <motion.div key={msg.id} role="status"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
          className={`fixed z-[90] left-4 right-4 sm:left-auto sm:right-6 sm:w-96 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] sm:bottom-6 px-4 py-3.5 rounded-2xl bg-surface-3 text-sm shadow-2xl ${
            msg.type === "error" ? "text-neg" : "text-ink"
          }`}>
          <span className="flex items-center justify-between gap-4">
            <span className="truncate">{msg.text}</span>
            {msg.action && (
              <button className="font-semibold text-accent-ink shrink-0"
                onClick={() => { msg.action.onClick(); setMsg(null); }}>
                {msg.action.label}
              </button>
            )}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Toaster;
