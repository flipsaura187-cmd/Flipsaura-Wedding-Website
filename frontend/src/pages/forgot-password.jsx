"use client";
import { useState } from "react";
import Link from "@/compat/Link";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setMessage("");
        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Something went wrong");
            setMessage(data.message || "Check your email for a reset link.");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <div className="form-card">
                <h1>Forgot password?</h1>
                <p className="sub">We'll send you a link to reset it.</p>
                {message && <div className="success">{message}</div>}
                {error && <div className="error">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="field">
                        <label>Email address</label>
                        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    <button className="btn btn-primary btn-block" disabled={loading}>
                        {loading ? "Sending..." : "Send reset link"}
                    </button>
                </form>
                <p style={{ marginTop: 18, textAlign: "center" }}>
                    Remembered? <Link href="/login" style={{ color: "var(--pink-700)" }}>Back to login</Link>
                </p>
            </div>
        </div>
    );
}