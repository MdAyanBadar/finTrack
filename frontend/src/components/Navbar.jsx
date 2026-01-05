import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/api";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const profileRef = useRef(null);

  // --- ADDED: Click Outside Logic ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      // If the click is outside the profileRef container, close the dropdown
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    // Only attach the listener if the dropdown is actually open
    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileOpen]);
  // ----------------------------------

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const res = await api.get("/users/me");
          setUser(res.data);
        }
      } catch (err) {
        console.error("Navbar Auth Error:", err);
      }
    };
    fetchUser();
  }, [location.pathname]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  if (location.pathname === "/login" || location.pathname === "/register") return null;

  const links = [
    { path: "/", label: "Dashboard" },
    { path: "/transactions", label: "Transactions" },
    { path: "/budget-goals", label: "Budget & Goal" },
  ];

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-[100] w-full bg-[#020617] border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
        
        {/* LOGO */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-bold text-white">
            ₹
          </div>
          <span className="text-xl font-bold text-white">FinTrack</span>
        </Link>

        {/* DESKTOP MENU */}
        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center bg-white/[0.03] p-1 rounded-xl border border-white/[0.05]">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-4 py-2 text-sm font-medium transition-colors ${
                  location.pathname === link.path ? "text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                {location.pathname === link.path && (
                  <motion.div layoutId="activeNav" className="absolute inset-0 bg-indigo-500/10 border border-indigo-500/20 rounded-lg" />
                )}
                <span className="relative z-10">{link.label}</span>
              </Link>
            ))}
          </div>

          {/* DESKTOP PROFILE */}
          <div className="relative" ref={profileRef}>
            <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2 p-1 pr-3 rounded-full bg-white/[0.05] border border-white/[0.1]">
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white">
                {user ? user.name.charAt(0).toUpperCase() : "?"}
              </div>
              <span className="text-sm font-medium text-slate-300">Account</span>
            </button>
            
            <AnimatePresence>
              {profileOpen && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 mt-4 w-60 bg-slate-900 border border-white/[0.1] rounded-2xl shadow-2xl py-2 overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/[0.05] bg-white/[0.02]">
                    <p className="text-sm font-semibold text-white">{user?.name || "User"}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  </div>
                  <Link to="/profile" className="block px-4 py-2.5 text-sm text-slate-300 hover:bg-white/[0.05]">👤 Profile Settings</Link>
                  <button onClick={logout} className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10">🚪 Sign Out</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* MOBILE HAMBURGER BUTTON */}
        <button 
          onClick={() => setIsOpen(true)} 
          className="md:hidden p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
      </div>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/80 z-[110]"
            />

            <motion.div 
              initial={{ x: "100%" }} 
              animate={{ x: 0 }} 
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed inset-y-0 right-0 h-full w-[280px] bg-[#0f172a] z-[120] shadow-2xl flex flex-col border-l border-white/[0.1]"
            >
              <div className="p-6 border-b border-white/[0.05] flex justify-between items-center bg-[#1e293b]">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-bold text-white shadow-lg">
                    {user ? user.name.charAt(0).toUpperCase() : "U"}
                   </div>
                   <div className="overflow-hidden">
                     <p className="text-white font-bold truncate w-32">{user?.name || "Guest"}</p>
                     <p className="text-[10px] text-indigo-400 uppercase font-bold tracking-widest">FinTrack Pro</p>
                   </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:text-white bg-white/[0.05] rounded-lg">✕</button>
              </div>

              <div className="p-4 space-y-2 flex-grow overflow-y-auto">
                {links.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-4 px-5 py-4 rounded-xl text-base font-medium transition-all ${
                      location.pathname === link.path 
                      ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" 
                      : "text-slate-300 hover:bg-white/[0.03]"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="p-4 border-t border-white/[0.05] bg-[#020617] space-y-2">
                <Link 
                  to="/profile" 
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-5 py-4 rounded-xl bg-white/[0.03] text-slate-300 text-sm border border-white/[0.05]"
                >
                  👤 Profile Settings
                </Link>
                <button 
                  onClick={logout} 
                  className="w-full flex items-center gap-3 px-5 py-4 rounded-xl bg-red-500/10 text-red-400 text-sm font-semibold border border-red-500/20"
                >
                  🚪 Logout
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default Navbar;