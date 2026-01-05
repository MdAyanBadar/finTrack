import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  /* =========================
     PASSWORD STRENGTH
  ========================= */
  const calculatePasswordStrength = (pwd) => {
    let strength = 0;
    if (pwd.length >= 8) strength += 25;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength += 25;
    if (/[0-9]/.test(pwd)) strength += 25;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength += 25;
    return strength;
  };

  const getStrengthColor = () => {
    if (passwordStrength >= 75) return "bg-green-500";
    if (passwordStrength >= 50) return "bg-yellow-500";
    if (passwordStrength >= 25) return "bg-orange-500";
    return "bg-red-500";
  };

  const getStrengthText = () => {
    if (passwordStrength >= 75) return "Strong";
    if (passwordStrength >= 50) return "Good";
    if (passwordStrength >= 25) return "Weak";
    return "Very Weak";
  };

  const handlePasswordChange = (e) => {
    const pwd = e.target.value;
    setPassword(pwd);
    setPasswordStrength(calculatePasswordStrength(pwd));
  };

  /* =========================
     REGISTER (REAL API)
  ========================= */
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password) {
      setError("All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (passwordStrength < 50) {
      setError("Please use a stronger password");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/auth/register", {
        name,
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    { icon: "💰", title: "Track Expenses", desc: "Understand where every rupee goes." },
    { icon: "📊", title: "Smart Insights", desc: "Visual reports & analytics." },
    { icon: "🎯", title: "Budget Goals", desc: "Set limits & savings goals." },
    { icon: "🔔", title: "Alerts", desc: "Real-time spending awareness." },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

        {/* LEFT INFO */}
        <div className="hidden lg:flex flex-col space-y-8">
          <h1 className="text-5xl font-bold text-white">
            Take control of your <br />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              finances
            </span>
          </h1>

          <div className="space-y-4">
            {benefits.map((b, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="text-2xl">{b.icon}</div>
                <div>
                  <h3 className="text-white font-semibold">{b.title}</h3>
                  <p className="text-gray-400 text-sm">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* REGISTER CARD */}
        <form
          onSubmit={handleRegister}
          className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-8 shadow-2xl max-w-md mx-auto w-full"
        >
          <h2 className="text-3xl font-bold text-white mb-1">Create Account</h2>
          <p className="text-gray-400 mb-6">Start managing money smarter</p>

          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-300 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* NAME */}
          <input
            className="input-dark mb-3"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          {/* EMAIL */}
          <input
            className="input-dark mb-3"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* PASSWORD */}
          <div className="relative mb-3">
            <input
              className="input-dark pr-12"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={handlePasswordChange}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              👁️
            </button>
          </div>

          {/* STRENGTH */}
          {password && (
            <>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Password strength</span>
                <span className="font-medium">{getStrengthText()}</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full mb-3">
                <div
                  className={`h-full rounded-full ${getStrengthColor()}`}
                  style={{ width: `${passwordStrength}%` }}
                />
              </div>
            </>
          )}

          {/* CONFIRM */}
          <div className="relative mb-5">
            <input
              className="input-dark pr-12"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              👁️
            </button>
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>

          {/* LOGIN LINK */}
          <p className="text-sm text-gray-400 text-center mt-4">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-indigo-400 hover:underline"
            >
              Login
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register;
