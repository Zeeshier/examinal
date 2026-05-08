import { createContext, useContext, useState, useEffect, useCallback } from "react";
import API from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await API.get("/api/auth/me");
      setUser(data);
    } catch {
      localStorage.clear();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const login = async (username, password) => {
    const form = new URLSearchParams();
    form.append("username", username);
    form.append("password", password);
    const { data } = await API.post("/api/auth/login", form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    await fetchUser();
  };

  const register = async (payload) => {
    await API.post("/api/auth/register", payload);
  };

  // ── Server-side logout — revoke the refresh token ──
  const logout = async () => {
    const refresh = localStorage.getItem("refresh_token");
    if (refresh) {
      try {
        await API.post("/api/auth/logout", { refresh_token: refresh });
      } catch {
        // Best-effort: still clear client even if server call fails
      }
    }
    localStorage.clear();
    setUser(null);
  };

  // ── Forgot password ──
  const forgotPassword = async (email) => {
    await API.post("/api/auth/forgot-password", { email });
  };

  // ── Reset password (from email link) ──
  const resetPassword = async (token, new_password) => {
    await API.post("/api/auth/reset-password", { token, new_password });
  };

  // ── Change password (while logged in) ──
  const changePassword = async (current_password, new_password) => {
    await API.post("/api/auth/change-password", { current_password, new_password });
    // Force re-login since all sessions are revoked
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user, loading,
      login, register, logout,
      forgotPassword, resetPassword, changePassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
