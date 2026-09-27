"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = () => {
    const headers = { "Content-Type": "application/json" };
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("fa_token");
      if (token) headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  };

  const refresh = useCallback(async () => {
    try {
      const headers = {};
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("fa_token");
        if (token) headers["Authorization"] = `Bearer ${token}`;
      }

      const r = await fetch("/api/auth/me", {
        cache: "no-store",
        credentials: "include",
        headers,
      });
      const j = await r.json();
      setUser(j.ok && j.data?.user ? j.data.user : null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (email, password) => {
    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || "Login failed");

    if (j.data?.token && typeof window !== "undefined") {
      localStorage.setItem("fa_token", j.data.token);
    }

    setUser(j.data.user);
    return j.data.user;
  };

  const register = async (payload) => {
    const r = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || "Register failed");

    if (j.data?.token && typeof window !== "undefined") {
      localStorage.setItem("fa_token", j.data.token);
    }

    setUser(j.data.user);
    return j.data.user;
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch (e) {
      console.warn("Logout error:", e);
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("fa_token");
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh, getAuthHeaders }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
