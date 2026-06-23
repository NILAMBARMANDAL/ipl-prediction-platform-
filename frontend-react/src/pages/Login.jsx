import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const from = location.state?.from || "/dashboard";

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Check your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] grid place-items-center px-5 py-12">
      <div className="w-full max-w-md animate-fade-up">
        <div className="text-center mb-8">
          <p className="eyebrow mb-2">Welcome back</p>
          <h1 className="font-display font-bold text-4xl tracking-tight">
            Sign in to IPL<span className="text-ball">Lab</span>
          </h1>
        </div>

        <form onSubmit={submit} className="panel p-7 space-y-5">
          <div>
            <label className="field-label">Email</label>
            <input
              className="field"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="field-label">Password</label>
            <input
              className="field"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          {error && (
            <div className="rounded-xl border border-loss/40 bg-loss/10 px-4 py-3 text-loss text-sm">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-ball w-full py-3">
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <p className="text-center text-sm text-muted pt-1">
            New here?{" "}
            <Link to="/register" className="text-ball hover:text-ballHi">
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
