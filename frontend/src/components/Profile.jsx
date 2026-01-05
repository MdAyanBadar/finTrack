import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { motion } from "framer-motion";

function Profile() {
  const [user, setUser] = useState(null);
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

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-slate-500 animate-pulse">Synchronizing profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/50 border border-white/[0.08] rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl"
      >
        {/* Header Decoration */}
        <div className="h-32 bg-gradient-to-r from-indigo-600 to-violet-600 relative">
           <div className="absolute -bottom-12 left-8 w-24 h-24 rounded-2xl bg-slate-900 border-4 border-slate-900 shadow-xl flex items-center justify-center text-3xl font-bold text-white">
             {user.name.charAt(0)}
           </div>
        </div>

        <div className="pt-16 pb-8 px-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white">{user.name}</h2>
              <p className="text-slate-400">{user.email}</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
              Verified Account
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Join Date</p>
              <p className="text-slate-200">{new Date(user.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Currency</p>
              <p className="text-slate-200">INR (₹)</p>
            </div>
          </div>

          <div className="space-y-3">
            <button className="w-full py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/15 transition-all">
              Edit Profile Details
            </button>
            <button
              onClick={logout}
              className="w-full py-3 rounded-xl bg-red-500/10 text-red-400 font-medium border border-red-500/20 hover:bg-red-500/20 transition-all"
            >
              Logout from Device
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default Profile;