import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// ProtectedRoute: redirects unauthenticated users to /login. While the session
// check is still running (loading), we show a small placeholder so we don't
// flash the login page for already-logged-in users on refresh.
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <div className="font-mono text-muted text-sm animate-pulse">
          Checking session…
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
