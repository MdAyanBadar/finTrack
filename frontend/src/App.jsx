import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import AppShell from "./components/AppShell";
import QuickAdd from "./components/QuickAdd";
import Toaster from "./components/Toaster";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./components/Home";
import Transactions from "./components/Transactions";
import InsightsPage from "./components/InsightsPage";
import BudgetGoals from "./components/BudgetGoals";
import Profile from "./components/Profile";
import About from "./components/About";
import Login from "./components/Login";
import Register from "./components/Register";

// Opacity-only transition: transforms on page wrappers break fixed popups on iOS
const Fade = ({ children }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
    {children}
  </motion.div>
);

const protectedPage = (el) => <ProtectedRoute><Fade>{el}</Fade></ProtectedRoute>;

function App() {
  const location = useLocation();

  return (
    <AppShell>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={protectedPage(<Home />)} />
          <Route path="/transactions" element={protectedPage(<Transactions />)} />
          <Route path="/insights" element={protectedPage(<InsightsPage />)} />
          <Route path="/budget-goals" element={protectedPage(<BudgetGoals />)} />
          <Route path="/profile" element={protectedPage(<Profile />)} />
          <Route path="/about" element={<Fade><About /></Fade>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </AnimatePresence>
      <QuickAdd />
      <Toaster />
    </AppShell>
  );
}

export default App;
