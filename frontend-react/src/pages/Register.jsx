import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await register(form);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed. Try a different email."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] grid place-items-center px-5 py-12">
      <div className="w-full max-w-md animate-fade-up">
        <div className="text-center mb-8">
          <p className="eyebrow mb-2">Join the lab</p>
          <h1 className="font-display font-bold text-4xl tracking-tight">
            Create your account
          </h1>
        </div>

        <form onSubmit={submit} className="panel p-7 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label">Full name</label>
              <input
                className="field"
                placeholder="Virat Kohli"
                value={form.fullName}
                onChange={set("fullName")}
                required
              />
            </div>
            <div>
              <label className="field-label">Username</label>
              <input
                className="field"
                placeholder="vk18"
                value={form.username}
                onChange={set("username")}
                required
              />
            </div>
          </div>
          <div>
            <label className="field-label">Email</label>
            <input
              className="field"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={set("email")}
              required
            />
          </div>
          <div>
            <label className="field-label">Password</label>
            <input
              className="field"
              type="password"
              autoComplete="new-password"
              placeholder="at least 6 characters"
              value={form.password}
              onChange={set("password")}
              required
            />
          </div>

          {error && (
            <div className="rounded-xl border border-loss/40 bg-loss/10 px-4 py-3 text-loss text-sm">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-ball w-full py-3">
            {loading ? "Creating…" : "Create account"}
          </button>

          <p className="text-center text-sm text-muted pt-1">
            Already have an account?{" "}
            <Link to="/login" className="text-ball hover:text-ballHi">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
