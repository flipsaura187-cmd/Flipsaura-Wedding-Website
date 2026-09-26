"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "@/compat/navigation";
import Link from "@/compat/Link";

export default function ResetPasswordPageCom() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");
    const [newPassword, setNewPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!token) setError("Missing reset token. Please use the link from your email.");
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newPassword !== confirm) {
            setError("Passwords do not match");
            return;
        }
        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }
        setLoading(true);
        setError("");
        setMessage("");
        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Reset failed");
            setMessage("Password reset successfully! Redirecting to login...");
            setTimeout(() => router.push("/login"), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!token && !error) return <div className="loading">Validating link...</div>;

    return (
        <div className="container">
            <div className="form-card">
                <h1>Create new password</h1>
                <p className="sub">Enter a strong password you haven't used before.</p>
                {message && <div className="success">{message}</div>}
                {error && <div className="error">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="field">
                        <label>New password</label>
                        <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                    </div>
                    <div className="field">
                        <label>Confirm password</label>
                        <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)} />
                    </div>
                    <button className="btn btn-primary btn-block" disabled={loading}>
                        {loading ? "Resetting..." : "Reset password"}
                    </button>
                </form>
                <p style={{ marginTop: 18, textAlign: "center" }}>
                    <Link href="/login" style={{ color: "var(--pink-700)" }}>Back to login</Link>
                </p>
            </div>
        </div>
    );
}