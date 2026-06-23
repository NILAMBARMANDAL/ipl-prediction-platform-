import { Outlet, NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// MainLayout: persistent nav bar + an <Outlet/> where the active page renders.
// The nav adapts to auth state (shows Dashboard + Logout when logged in).
export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const navItem = ({ isActive }) =>
    `font-display uppercase tracking-wide text-sm px-3 py-2 rounded-lg transition ${
      isActive ? "text-ball" : "text-muted hover:text-flood"
    }`;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-night/80 border-b border-line">
        <nav className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <span className="inline-grid place-items-center w-8 h-8 rounded-lg bg-ball text-night font-display font-bold text-lg group-hover:bg-ballHi transition">
              ●
            </span>
            <span className="font-display font-bold text-xl tracking-tight">
              IPL<span className="text-ball">Lab</span>
            </span>
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
            <NavLink to="/" className={navItem} end>
              Home
            </NavLink>
            <NavLink to="/predictor" className={navItem}>
              Predictor
            </NavLink>
            {user && (
              <NavLink to="/dashboard" className={navItem}>
                Dashboard
              </NavLink>
            )}

            {user ? (
              <div className="flex items-center gap-3 ml-2 pl-3 border-l border-line">
                <span className="hidden sm:inline text-sm text-muted font-mono">
                  {user.username}
                </span>
                <button
                  onClick={handleLogout}
                  className="btn-ghost text-xs px-3 py-2"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn-ball text-xs px-4 py-2 ml-2">
                Sign in
              </Link>
            )}
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-line mt-16">
        <div className="max-w-6xl mx-auto px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted">
          <span className="font-mono">
            IPLLab — analytics on {""}
            <span className="text-flood">260,920</span> deliveries
          </span>
          <span>
            Built by Nilambar Mandal · model accuracy{" "}
            <span className="text-win font-mono">81.5%</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
