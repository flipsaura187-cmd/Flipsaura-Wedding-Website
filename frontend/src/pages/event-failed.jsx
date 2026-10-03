"use client";
import { useState } from "react";
import { useSearchParams, useRouter } from "@/compat/navigation";
import Link from "@/compat/Link";
import api from "@/api/axios";

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function EventFailedPage() {
  const sp = useSearchParams();
  const router = useRouter();

  const regDocId = sp.get("regDocId");
  const initialError = sp.get("error") || "The payment transaction could not be completed.";

  const [retrying, setRetrying] = useState(false);
  const [errorMessage, setErrorMessage] = useState(initialError);

  const handleRetryPayment = async () => {
    if (!regDocId) {
      setErrorMessage("No pending registration session found to retry. Please start a new registration.");
      return;
    }

    setRetrying(true);
    setErrorMessage("");

    try {
      const isRzpReady = await loadRazorpayScript();
      if (!isRzpReady) {
        throw new Error("Unable to load Razorpay SDK. Please check your connection.");
      }

      // Call retry endpoint to get fresh order for the same registration
      const res = await api.post("/api/events/payment/retry-order", {
        registrationDocId: regDocId,
      });

      if (!res.data?.ok) {
        throw new Error(res.data?.error || "Could not re-initiate payment.");
      }

      if (res.data?.alreadyPaid) {
        router.push(`/events/registration/success?id=${encodeURIComponent(res.data.data.registrationId)}`);
        return;
      }

      const { orderId, amount, currency, keyId, event, primaryContact } = res.data.data;

      const options = {
        key: keyId,
        amount: amount,
        currency: currency || "INR",
        name: "FlipsAura",
        description: `Retry Payment: ${event?.title || "Event Registration"}`,
        order_id: orderId,
        prefill: {
          name: primaryContact?.fullName || "",
          email: primaryContact?.email || "",
          contact: primaryContact?.mobileNumber || "",
        },
        theme: {
          color: "#e63f87",
        },
        handler: async function (response) {
          try {
            const verifyRes = await api.post("/api/events/payment/verify", {
              registrationDocId: regDocId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.data?.ok) {
              const regId = verifyRes.data.data.registrationId;
              router.push(`/events/registration/success?id=${encodeURIComponent(regId)}`);
            } else {
              setErrorMessage(verifyRes.data?.message || "Signature verification failed.");
              setRetrying(false);
            }
          } catch (verErr) {
            setErrorMessage(verErr.response?.data?.error || verErr.message || "Verification failed.");
            setRetrying(false);
          }
        },
        modal: {
          ondismiss: function () {
            setRetrying(false);
            setErrorMessage("Payment checkout window was closed before completing.");
          },
        },
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.on("payment.failed", function (failResp) {
        setErrorMessage(failResp.error?.description || "Payment attempt failed.");
        setRetrying(false);
      });

      rzpInstance.open();
    } catch (err) {
      setErrorMessage(err.response?.data?.error || err.message || "Failed to retry payment.");
      setRetrying(false);
    }
  };

  return (
    <div style={{ minHeight: "85vh", background: "#faf7f9", padding: "60px 16px 80px" }}>
      <div className="container" style={{ maxWidth: "600px" }}>
        <div
          style={{
            background: "#ffffff",
            borderRadius: "20px",
            border: "1.5px solid #fecaca",
            padding: "40px 32px",
            textAlign: "center",
            boxShadow: "0 10px 30px rgba(220, 38, 38, 0.08)",
          }}
        >
          {/* Warning Icon */}
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "#fee2e2",
              color: "#dc2626",
              fontSize: "2rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            ✕
          </div>

          <h1
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "1.9rem",
              color: "var(--ink, #2a1726)",
              margin: "0 0 10px",
            }}
          >
            Payment Was Not Completed
          </h1>

          <p
            style={{
              fontSize: "1.05rem",
              color: "#dc2626",
              fontWeight: 600,
              margin: "0 0 14px",
            }}
          >
            Your registration is still pending payment.
          </p>

          <p style={{ color: "var(--muted)", fontSize: "0.95rem", lineHeight: 1.5, margin: "0 0 24px" }}>
            Don't worry, your registration form data is safely saved. You can retry payment below
            without having to re-enter your details.
          </p>

          {errorMessage && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #f87171",
                color: "#991b1b",
                padding: "12px 16px",
                borderRadius: "10px",
                fontSize: "0.88rem",
                textAlign: "left",
                marginBottom: "28px",
              }}
            >
              <strong>Reason: </strong> {errorMessage}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {regDocId && (
              <button
                type="button"
                onClick={handleRetryPayment}
                disabled={retrying}
                className="btn btn-primary"
                style={{
                  padding: "14px 24px",
                  fontSize: "1.05rem",
                  fontWeight: 700,
                  borderRadius: "10px",
                  boxShadow: "0 4px 16px rgba(230, 63, 135, 0.35)",
                  cursor: retrying ? "not-allowed" : "pointer",
                }}
              >
                {retrying ? "Opening Razorpay..." : "🔄 Retry Payment"}
              </button>
            )}

            <Link
              href="/events"
              to="/events"
              className="btn btn-outline"
              style={{
                padding: "12px 24px",
                fontSize: "0.95rem",
                fontWeight: 600,
                borderRadius: "10px",
                textDecoration: "none",
              }}
            >
              Browse Events
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
