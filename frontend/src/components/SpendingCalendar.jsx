import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

function SpendingCalendar({ transactions = [], dailyBudget = 0 }) {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(null);

  const year = today.getFullYear();
  const month = today.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const dailySpendMap = useMemo(() => {
    return transactions.reduce((acc, t) => {
      if (t.amount < 0) {
        const key = new Date(t.date).toISOString().slice(0, 10);
        acc[key] = (acc[key] || 0) + Math.abs(t.amount);
      }
      return acc;
    }, {});
  }, [transactions]);

  const formatINR = (amt) =>
    amt.toLocaleString("en-IN", { style: "currency", currency: "INR" });

  const days = [];

  for (let i = 0; i < firstDay; i++) days.push(null);

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    const key = dateObj.toISOString().slice(0, 10);
    const spent = dailySpendMap[key] || 0;

    let color =
      spent === 0
        ? "bg-gray-800 text-gray-400"
        : spent <= dailyBudget
        ? "bg-green-500/15 text-green-400"
        : "bg-red-500/15 text-red-400";

    days.push({ day: d, key, spent, color });
  }

  const dayTransactions = selectedDate
    ? transactions.filter(
        (t) =>
          t.date.startsWith(selectedDate) && t.amount < 0
      )
    : [];

  return (
    <>
      {/* CALENDAR */}
      <div className="card-dark p-5">
        <h2 className="text-lg font-semibold text-gray-100 mb-4">
          Daily Spending Calendar
        </h2>

        <div className="grid grid-cols-7 text-center text-xs text-gray-400 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map((item, idx) =>
            item ? (
              <button
                key={idx}
                onClick={() => setSelectedDate(item.key)}
                className={`rounded-lg p-2 text-center transition hover:scale-105 ${item.color}`}
              >
                <p className="text-sm font-semibold">{item.day}</p>
                <p className="text-[11px] mt-1">
                  {item.spent > 0 ? formatINR(item.spent) : "—"}
                </p>
              </button>
            ) : (
              <div key={idx} />
            )
          )}
        </div>

        <div className="flex gap-4 mt-4 text-xs text-gray-400">
          <Legend color="bg-green-500/20" label="Under Budget" />
          <Legend color="bg-red-500/20" label="Over Budget" />
          <Legend color="bg-gray-700" label="No Spend" />
        </div>
      </div>

      {/* MODAL */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="card-dark p-5 w-[90%] max-w-md"
            >
              <h3 className="text-lg font-semibold text-gray-100 mb-2">
                Transactions on{" "}
                {new Date(selectedDate).toDateString()}
              </h3>

              {dayTransactions.length === 0 ? (
                <p className="text-gray-400 text-sm">
                  No expenses on this day 🎉
                </p>
              ) : (
                <ul className="space-y-2 mt-3 max-h-60 overflow-y-auto">
                  {dayTransactions.map((t) => (
                    <li
                      key={t.id}
                      className="flex justify-between items-center bg-gray-800 rounded p-2"
                    >
                      <span className="text-gray-300 text-sm">
                        {t.text}
                      </span>
                      <span className="text-red-400 font-medium text-sm">
                        {formatINR(Math.abs(t.amount))}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <button
                onClick={() => setSelectedDate(null)}
                className="mt-4 w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Legend({ color, label }) {
  return (
    <div className="flex items-center gap-1">
      <span className={`w-3 h-3 rounded ${color}`} />
      {label}
    </div>
  );
}

export default SpendingCalendar;
