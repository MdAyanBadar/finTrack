import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/api";
import AuthLayout from "./AuthLayout";
import PasswordInput from "./PasswordInput";
import { Field, Input, Button } from "./ui";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
    try {
      setLoading(true);
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to see where your money goes, salary to salary."
      footer={<>New to FinTrack? <Link to="/register" className="text-accent-ink font-medium">Create an account</Link></>}>
      <form onSubmit={handleLogin} className="space-y-4">
        <Field label="Email">
          <Input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password">
          <PasswordInput autoComplete="current-password" placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {error && <p className="text-sm text-neg">{error}</p>}
        <Button type="submit" size="lg" className="w-full !mt-6" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</Button>
      </form>
    </AuthLayout>
  );
}

export default Login;
