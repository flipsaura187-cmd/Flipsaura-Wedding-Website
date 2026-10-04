"use client";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import HomePage from "@/pages/home";

export default function AboutPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (user) {
      const role = String(user.role || "").toLowerCase();
      if (role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else if (role === "vendor") {
        navigate("/vendor/dashboard", { replace: true });
      } else {
        // Customer / regular user
        navigate("/", { replace: true });
      }
    } else {
      // Guest / unauthenticated visitor (e.g., coming from Google search)
      navigate("/", { replace: true });
    }
  }, [user, loading, navigate]);

  // Immediately render the default HomePage so visitors arriving at /about
  // see the complete platform, categories, listings, and services with zero delay
  return <HomePage />;
}