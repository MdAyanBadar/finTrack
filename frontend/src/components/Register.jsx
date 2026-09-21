import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/api";
import AuthLayout from "./AuthLayout";
import PasswordInput from "./PasswordInput";
import { Field, Input, Button, ProgressBar } from "./ui";

// 0-100 in steps of 25: length, mixed case, digit, symbol
const strengthOf = (pwd) =>
  (pwd.length >= 8 ? 25 : 0) +
  (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd) ? 25 : 0) +
  (/[0-9]/.test(pwd) ? 25 : 0) +
  (/[^a-zA-Z0-9]/.test(pwd) ? 25 : 0);

const STRENGTH = [
  [75, "Strong", "pos"], [50, "Good", "accent"], [25, "Weak", "warn"], [0, "Very weak", "neg"],
];

function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const strength = strengthOf(password);
  const [, strengthLabel, strengthTone] = STRENGTH.find(([min]) => strength >= min);

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
    if (strength < 50) {
      setError("Use at least 8 characters with a mix of letters, numbers or symbols");
      return;
    }
    try {
      setLoading(true);
      const res = await api.post("/auth/register", { name, email, password });
      localStorage.setItem("token", res.data.token);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Budget from one salary to the next."
      footer={<>Already have an account? <Link to="/login" className="text-accent-ink font-medium">Sign in</Link></>}>
      <form onSubmit={handleRegister} className="space-y-4">
        <Field label="Name">
          <Input autoComplete="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Email">
          <Input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password">
          <PasswordInput autoComplete="new-password" placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {password && (
          <div className="px-1 -mt-1">
            <ProgressBar value={Math.max(strength, 8)} tone={strengthTone} />
            <p className="text-xs text-ink-3 mt-1.5">{strengthLabel}</p>
          </div>
        )}
        <Field label="Confirm password">
          <PasswordInput autoComplete="new-password" placeholder="Type it again" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </Field>
        {error && <p className="text-sm text-neg">{error}</p>}
        <Button type="submit" size="lg" className="w-full !mt-6" disabled={loading}>{loading ? "Creating account…" : "Create account"}</Button>
      </form>
    </AuthLayout>
  );
}

export default Register;
