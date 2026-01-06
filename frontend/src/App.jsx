import { useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

// Components
import Home from "./components/Home";
import Transactions from "./components/Transactions";
import BudgetGoals from "./components/BudgetGoals";
import Navbar from "./components/Navbar";
import Login from "./components/Login";
import Register from "./components/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import Profile from "./components/Profile";
import Footer from "./components/Footer";

/* =========================
   ANIMATED ROUTES
========================= */
function AnimatedRoutes({
  budget,
  goal,
  transactions,
  setTransactions,
  setBudget,
  setGoal,
}) {
  const location = useLocation();

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 },
  };

  const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.35,
  };

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
              >
                <Home
                  budget={budget}
                  goal={goal}
                  transactions={transactions}
                />
              </motion.div>
            </ProtectedRoute>
          }
        />

        <Route
          path="/transactions"
          element={
            <ProtectedRoute>
              <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
              >
                <Transactions
                  transactions={transactions}
                  setTransactions={setTransactions}
                />
              </motion.div>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/budget-goals"
          element={
            <ProtectedRoute>
              <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
              >
                <BudgetGoals
                  budget={budget}
                  setBudget={setBudget}
                  goal={goal}
                  setGoal={setGoal}
                />
              </motion.div>
            </ProtectedRoute>
          }
        />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </AnimatePresence>
  );
}

/* =========================
   APP ROOT
========================= */
function App() {
  const [transactions, setTransactions] = useState([]);
  const [budget, setBudget] = useState(0);
  const [goal, setGoal] = useState(0);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-200">
      <Navbar />

      <main className="">
        <AnimatedRoutes
          budget={budget}
          goal={goal}
          transactions={transactions}
          setTransactions={setTransactions}
          setBudget={setBudget}
          setGoal={setGoal}
        />
      </main>
      <Footer />
    </div>
  );
}

export default App;
