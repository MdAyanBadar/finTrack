import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LogOut, Mail, Calendar, Shield, Settings, User, 
  ChevronRight, Check, Bell, Fingerprint, CreditCard, 
  ArrowUpRight, Zap 
} from "lucide-react";

function Profile() {
  const [user, setUser] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  // New State for UI Toggles
  const [settings, setSettings] = useState({
    notifications: true,
    twoFactor: false,
    weeklyReport: true
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/users/me");
        setUser(res.data);
      } catch {
        navigate("/login");
      }
    };
    fetchProfile();
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!user) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 pb-24">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="space-y-8"
      >
        {/* 1. MAIN IDENTITY CARD */}
        <div className="bg-slate-900/50 border border-white/[0.08] rounded-[2.5rem] overflow-hidden backdrop-blur-3xl shadow-2xl">
          <div className="h-32 bg-gradient-to-r from-indigo-600 to-purple-700 relative">
             <div className="absolute -bottom-12 left-8">
                <div className="w-24 h-24 rounded-3xl bg-slate-900 p-1">
                  <div className="w-full h-full rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-black text-white shadow-xl">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                </div>
             </div>
          </div>
          
          <div className="pt-16 pb-8 px-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tight">{user.name}</h2>
                <p className="text-slate-400 flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4" /> {user.email}
                </p>
              </div>
              <div className="flex gap-2">
                <span className="px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-black uppercase tracking-widest">
                  Premium Member
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 2. SECURITY & PREFERENCES (New Section) */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Preferences</h3>
            <div className="bg-slate-900/50 border border-white/[0.08] rounded-[2rem] p-4 space-y-2">
              <PreferenceToggle 
                icon={<Bell className="w-4 h-4" />} 
                title="Smart Notifications" 
                enabled={settings.notifications} 
                onClick={() => toggleSetting('notifications')}
              />
              <PreferenceToggle 
                icon={<Fingerprint className="w-4 h-4" />} 
                title="Biometric Security" 
                enabled={settings.twoFactor} 
                onClick={() => toggleSetting('twoFactor')}
              />
              <PreferenceToggle 
                icon={<Zap className="w-4 h-4" />} 
                title="Weekly AI Insights" 
                enabled={settings.weeklyReport} 
                onClick={() => toggleSetting('weeklyReport')}
              />
            </div>
          </div>

          {/* 3. QUICK STATS */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Overview</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/50 border border-white/[0.08] rounded-[2rem] p-6 text-center">
                <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Status</p>
                <p className="text-emerald-400 font-black">Active</p>
              </div>
              <div className="bg-slate-900/50 border border-white/[0.08] rounded-[2rem] p-6 text-center">
                <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Level</p>
                <p className="text-indigo-400 font-black">Lvl 12</p>
              </div>
            </div>
          </div>
        </div>

        {/* 4. LINKED METHODS (New Section) */}
        <div className="space-y-4">
          <div className="flex justify-between items-center ml-2">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em]">Linked Accounts</h3>
            <button className="text-indigo-400 text-xs font-bold hover:underline">Add New</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/20 rounded-3xl p-6 flex justify-between items-center group cursor-pointer hover:border-indigo-500/40 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-white">HDFC Bank</p>
                  <p className="text-xs text-slate-500 font-medium">•••• 4421</p>
                </div>
              </div>
              <ArrowUpRight className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 transition-colors" />
            </div>
            {/* Placeholder for empty state or second account */}
            <div className="border border-dashed border-white/10 rounded-3xl p-6 flex items-center justify-center text-slate-600 text-sm font-bold">
              + Link another source
            </div>
          </div>
        </div>

        {/* 5. DANGER ZONE */}
        <div className="pt-8">
           <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full py-5 rounded-[2rem] bg-rose-500/5 border border-rose-500/20 text-rose-500 font-black uppercase tracking-widest hover:bg-rose-500/10 transition-all flex items-center justify-center gap-3"
          >
            <LogOut className="w-5 h-5" />
            End Current Session
          </button>
        </div>

      </motion.div>

      {/* Logout Modal remains same as your original code */}
      <AnimatePresence>
        {showLogoutModal && (
          <LogoutModal onConfirm={logout} onCancel={() => setShowLogoutModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper Component for Preferences
function PreferenceToggle({ icon, title, enabled, onClick }) {
  return (
    <div className="flex items-center justify-between p-4 hover:bg-white/[0.02] rounded-2xl transition-all cursor-pointer" onClick={onClick}>
      <div className="flex items-center gap-4">
        <div className="text-slate-400">{icon}</div>
        <span className="text-sm font-bold text-slate-200">{title}</span>
      </div>
      <div className={`w-10 h-5 rounded-full transition-all relative ${enabled ? 'bg-indigo-600' : 'bg-slate-700'}`}>
        <motion.div 
          animate={{ x: enabled ? 20 : 2 }}
          className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-lg"
        />
      </div>
    </div>
  );
}

function LogoutModal({ onConfirm, onCancel }) {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-6">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-slate-900 border border-white/10 p-8 rounded-[3rem] max-w-sm w-full text-center">
                <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-500">
                    <LogOut className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-white mb-2">Logout?</h3>
                <p className="text-slate-500 font-medium mb-8">You will need to re-authenticate to access your dashboard.</p>
                <div className="flex gap-4">
                    <button onClick={onCancel} className="flex-1 py-4 rounded-2xl bg-white/5 font-bold">Cancel</button>
                    <button onClick={onConfirm} className="flex-1 py-4 rounded-2xl bg-rose-500 text-white font-black shadow-lg shadow-rose-500/20">Exit</button>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default Profile;