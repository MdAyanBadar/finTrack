import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Mail, Calendar, DollarSign, Shield, Settings, User, ChevronRight, Check, Globe } from "lucide-react";
import { useCurrency } from "../context/CurrencyContext";

const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc', flag: '🇨🇭' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬' },
];

function Profile() {
  const [user, setUser] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useCurrency();
  const [isUpdatingCurrency, setIsUpdatingCurrency] = useState(false);
  const [currencyUpdateSuccess, setCurrencyUpdateSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/users/me");
        setUser(res.data);
        // Set currency from user data if available
        if (res.data.currency) {
          setSelectedCurrency(res.data.currency);
        }
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

  const handleCurrencyChange = async (currencyCode) => {
  setIsUpdatingCurrency(true);

  try {
    // Persist preference (optional but recommended)
    await api.put("/users/currency", { currency: currencyCode });
  } catch (err) {
    console.warn("Currency API failed, using local preference");
  }

  // 🔥 GLOBAL UPDATE (THIS IS THE IMPORTANT PART)
  updateCurrency(currencyCode);

  setCurrencyUpdateSuccess(true);

  setTimeout(() => {
    setCurrencyUpdateSuccess(false);
    setShowCurrencyModal(false);
  }, 1200);

  setIsUpdatingCurrency(false);
};

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-purple-500/20 border-b-purple-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        </div>
        <div className="text-center space-y-2">
          <p className="text-slate-300 font-medium text-lg">Loading your profile</p>
          <p className="text-slate-500 text-sm animate-pulse">Please wait a moment...</p>
        </div>
      </div>
    );
  }

  const accountAge = Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24));
  const currentCurrency = CURRENCIES.find(c => c.code === selectedCurrency) || CURRENCIES[0];

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        {/* Success Banner */}
        <AnimatePresence>
          {currencyUpdateSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-emerald-400 font-semibold">Currency updated successfully!</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Profile Card */}
        <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-white/[0.08] rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl">
          {/* Animated Header with Gradient */}
          <div className="h-40 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
            
            {/* Profile Avatar */}
            <div className="absolute -bottom-16 left-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="relative"
              >
                <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 border-4 border-slate-900 shadow-2xl flex items-center justify-center">
                  <span className="text-5xl font-bold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 rounded-full border-4 border-slate-900 flex items-center justify-center shadow-lg">
                  <Shield className="w-5 h-5 text-white" />
                </div>
              </motion.div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="pt-20 pb-8 px-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-3xl font-bold text-white mb-2">{user.name}</h2>
                <div className="flex items-center gap-2 text-slate-400">
                  <Mail className="w-4 h-4" />
                  <p>{user.email}</p>
                </div>
              </motion.div>
              
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-sm font-semibold border border-emerald-500/20 flex items-center gap-2 w-fit"
              >
                <Shield className="w-4 h-4" />
                Verified Account
              </motion.span>
            </div>

            {/* Stats Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
            >
              <div className="p-5 rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.08] hover:border-indigo-500/30 transition-all group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Calendar className="w-5 h-5 text-indigo-400" />
                  </div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Member Since</p>
                </div>
                <p className="text-slate-200 font-semibold text-lg">
                  {new Date(user.createdAt).toLocaleDateString("en-IN", { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                </p>
                <p className="text-slate-500 text-xs mt-1">{accountAge} days ago</p>
              </div>

              <div 
                onClick={() => setShowCurrencyModal(true)}
                className="p-5 rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.08] hover:border-purple-500/30 transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Globe className="w-5 h-5 text-purple-400" />
                    </div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Currency</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                </div>
                <p className="text-slate-200 font-semibold text-lg flex items-center gap-2">
                  <span className="text-2xl">{currentCurrency.flag}</span>
                  {currentCurrency.name}
                </p>
                <p className="text-slate-500 text-xs mt-1">{currentCurrency.code} ({currentCurrency.symbol})</p>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.08] hover:border-emerald-500/30 transition-all group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <User className="w-5 h-5 text-emerald-400" />
                  </div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Account Type</p>
                </div>
                <p className="text-slate-200 font-semibold text-lg">Premium</p>
                <p className="text-slate-500 text-xs mt-1">Full access</p>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-3"
            >
              <button className="w-full group relative overflow-hidden py-4 px-6 rounded-xl bg-gradient-to-r from-white/10 to-white/5 text-white font-medium border border-white/10 hover:border-indigo-500/30 transition-all hover:shadow-lg hover:shadow-indigo-500/10">
                <span className="relative z-10 flex items-center justify-between">
                  <span className="flex items-center gap-3">
                    <Settings className="w-5 h-5" />
                    Edit Profile Details
                  </span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/10 group-hover:to-purple-500/10 transition-all"></div>
              </button>

              <button
                onClick={() => setShowLogoutModal(true)}
                className="w-full group relative overflow-hidden py-4 px-6 rounded-xl bg-red-500/10 text-red-400 font-medium border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30 transition-all hover:shadow-lg hover:shadow-red-500/10"
              >
                <span className="relative z-10 flex items-center justify-between">
                  <span className="flex items-center gap-3">
                    <LogOut className="w-5 h-5" />
                    Logout from Device
                  </span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </motion.div>
          </div>
        </div>

        {/* Account Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-white/[0.08] rounded-3xl p-6 backdrop-blur-xl"
        >
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-indigo-400" />
            </div>
            Account Security
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <span className="text-slate-400 text-sm">Email Verified</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <span className="text-slate-400 text-sm">Secure Password</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <span className="text-slate-400 text-sm">Active Session</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
              <span className="text-slate-400 text-sm">2FA Available</span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Currency Selection Modal */}
      <AnimatePresence>
        {showCurrencyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => !isUpdatingCurrency && setShowCurrencyModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-white/[0.08] rounded-3xl p-8 max-w-2xl w-full shadow-2xl max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <Globe className="w-8 h-8 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Select Currency</h3>
                  <p className="text-slate-400 text-sm">Choose your preferred currency for transactions</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {CURRENCIES.map((currency) => (
                  <button
                    key={currency.code}
                    onClick={() => updateCurrency(currency.code)}
                    disabled={isUpdatingCurrency}
                    className={`p-4 rounded-xl border transition-all text-left ${
                      selectedCurrency === currency.code
                        ? 'bg-purple-500/20 border-purple-500/50 ring-2 ring-purple-500/30'
                        : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.05] hover:border-purple-500/30'
                    } ${isUpdatingCurrency ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-3xl">{currency.flag}</span>
                      {selectedCurrency === currency.code && (
                        <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-white font-semibold">{currency.name}</p>
                    <p className="text-slate-400 text-sm">{currency.code} ({currency.symbol})</p>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowCurrencyModal(false)}
                disabled={isUpdatingCurrency}
                className="w-full py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/15 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdatingCurrency ? 'Updating...' : 'Close'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowLogoutModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-white/[0.08] rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
                <LogOut className="w-8 h-8 text-red-400" />
              </div>
              
              <h3 className="text-2xl font-bold text-white text-center mb-3">Logout Confirmation</h3>
              <p className="text-slate-400 text-center mb-8">
                Are you sure you want to logout? You'll need to sign in again to access your account.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/15 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={logout}
                  className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-all shadow-lg shadow-red-500/30"
                >
                  Yes, Logout
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Profile;