import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api.js";

// AuthContext is the single source of truth for who's logged in. It checks the
// session on startup (via the httpOnly cookie), and exposes login/logout/register
// so any component can read auth state through the useAuth() hook.
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while we check the session

  // On mount, ask the backend who we are. If the cookie is valid, we get a user;
  // otherwise we stay logged out. Either way, loading flips to false when done.
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/users/current-user");
        setUser(data.data);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (credentials) => {
    const { data } = await api.post("/users/login", credentials);
    setUser(data.data.user);
    return data.data.user;
  };

  const register = async (details) => {
    await api.post("/users/register", details);
    // After registering, log in automatically for a smooth flow.
    return login({ email: details.email, password: details.password });
  };

  const logout = async () => {
    try {
      await api.post("/users/logout");
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
