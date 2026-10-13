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
    <div className="min-h-[85vh] bg-surface py-16 px-4 sm:px-6 lg:px-8 pb-20">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-3xl border border-rose-200 p-8 sm:p-10 text-center shadow-xl shadow-rose-950/5">
          {/* Warning Icon */}
          <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 text-2xl font-bold flex items-center justify-center mx-auto mb-4">
            ✕
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl text-ink font-bold mb-2">
            Payment Was Not Completed
          </h1>

          <p className="text-sm sm:text-base text-rose-600 font-semibold mb-3">
            Your registration is still pending payment.
          </p>

          <p className="text-sm text-muted leading-relaxed mb-6">
            Don't worry, your registration form data is safely saved. You can retry payment below
            without having to re-enter your details.
          </p>

          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-xs sm:text-sm text-left mb-6 leading-relaxed">
              <strong>Reason: </strong> {errorMessage}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {regDocId && (
              <button
                type="button"
                onClick={handleRetryPayment}
                disabled={retrying}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white font-bold text-sm sm:text-base shadow-lg shadow-brand-600/30 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {retrying ? "Opening Razorpay..." : "🔄 Retry Payment"}
              </button>
            )}

            <Link
              href="/events"
              to="/events"
              className="w-full block py-3 px-6 rounded-xl border border-brand-200 hover:bg-brand-50 text-ink font-semibold text-sm transition"
            >
              Browse Events
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
