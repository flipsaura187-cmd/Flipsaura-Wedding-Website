"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";

import api from "@/api/axios";
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
      const { data: j } = await api.get("/api/auth/me", {
        headers: { "Cache-Control": "no-cache" },
      });
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
    const { data: j } = await api.post("/api/auth/login", { email, password });
    if (!j.ok) throw new Error(j.error || "Login failed");

    if (j.data?.token && typeof window !== "undefined") {
      localStorage.setItem("fa_token", j.data.token);
    }

    setUser(j.data.user);
    return j.data.user;
  };

  const register = async (payload) => {
    const { data: j } = await api.post("/api/auth/register", payload);
    if (!j.ok) throw new Error(j.error || "Register failed");

    // Do NOT auto-login upon registration
    if (typeof window !== "undefined") {
      localStorage.removeItem("fa_token");
    }
    setUser(null);

    return j.data?.user;
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout");
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
