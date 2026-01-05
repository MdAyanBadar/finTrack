import { motion } from "framer-motion";

function LoadingScreen({ message = "Loading your financial data..." }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
      <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-3xl px-10 py-12 shadow-2xl text-center overflow-hidden">

        {/* Glow */}
        <div className="absolute -top-20 -left-20 w-60 h-60 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-700" />

        {/* Loader Ring */}
        <div className="relative flex items-center justify-center mb-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
            className="w-16 h-16 rounded-full border-4 border-indigo-500/30 border-t-indigo-400"
          />
          <div className="absolute text-xl font-bold text-indigo-400">
            ₹
          </div>
        </div>

        {/* Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-gray-300 font-medium"
        >
          {message}
        </motion.p>

        <p className="text-xs text-gray-500 mt-2">
          Please wait a moment
        </p>
      </div>
    </div>
  );
}

export default LoadingScreen;
