import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import api from "./api/api";

// Components
import Home from "./components/Home";
import Transactions from "./components/Transactions";
import BudgetGoals from "./components/BudgetGoals";
import Navbar from "./components/Navbar";
import Login from "./components/Login";
import Register from "./components/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import Profile from "./components/Profile";

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
        {/* 🔐 HOME */}
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

        {/* 🔐 TRANSACTIONS */}
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


        {/* 🔐 BUDGET & GOALS */}
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

        {/* 🔓 AUTH */}
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

  // 🔥 FETCH TRANSACTIONS FROM DB (ONCE)
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await api.get("/transactions");
        setTransactions(res.data);
      } catch (err) {
        console.error("Failed to fetch transactions");
      }
    };

    fetchTransactions();
  }, []);

  return (
    <Router>
      {/* 🌙 DARK FINTECH BASE */}
      <div className="min-h-screen bg-[#0B0F19] text-gray-200">
        <Navbar />

        <main className="px-4 sm:px-6 py-6">
          <AnimatedRoutes
            budget={budget}
            goal={goal}
            transactions={transactions}
            setTransactions={setTransactions}
            setBudget={setBudget}
            setGoal={setGoal}
          />
        </main>
      </div>
    </Router>
  );
}

export default App;
