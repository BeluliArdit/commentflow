"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const PLANS = {
  extension: {
    name: "Extension",
    price: 20,
    features: [
      "3 campaigns",
      "150 comments/month",
      "Reddit & YouTube discovery",
      "AI comment generation",
      "Chrome extension auto-poster",
      "Manual & auto-approve",
      "Email support",
    ],
  },
  dfy: {
    name: "Done-For-You",
    price: 99,
    features: [
      "Unlimited campaigns",
      "1,000 comments/month",
      "Reddit & YouTube discovery",
      "AI comment generation",
      "Chrome extension auto-poster",
      "Auto-approve mode",
      "Campaign setup by our team",
      "Dedicated account manager",
      "Priority support",
    ],
  },
};

export default function BillingPage() {
  return (
    <Suspense fallback={<div><h1 className="text-lg font-semibold text-th-text mb-5">Billing</h1><div className="text-sm text-th-text-secondary">Loading...</div></div>}>
      <BillingContent />
    </Suspense>
  );
}

function BillingContent() {
  const searchParams = useSearchParams();
  const [sub, setSub] = useState<{
    subscriptionStatus: string;
    subscriptionPlan: string | null;
    stripeCustomerId: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");

  useEffect(() => {
    fetch("/api/user/subscription")
      .then((r) => r.json())
      .then(setSub)
      .finally(() => setLoading(false));
  }, []);

  async function handleCheckout(plan: string) {
    setCheckoutLoading(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      alert("Failed to start checkout. Please try again.");
    } finally {
      setCheckoutLoading(null);
    }
  }

  async function handlePortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      alert("Failed to open billing portal. Please try again.");
    } finally {
      setPortalLoading(false);
    }
  }

  const isActive = sub?.subscriptionStatus === "active";
  const currentPlan = sub?.subscriptionPlan;

  if (loading) {
    return (
      <div>
        <h1 className="text-lg font-semibold text-th-text mb-5">Billing</h1>
        <div className="text-sm text-th-text-secondary">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-th-text mb-5">Billing</h1>

      {success && (
        <div className="mb-5 px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-lg text-sm text-green-400">
          Subscription activated successfully! Welcome aboard.
        </div>
      )}
      {canceled && (
        <div className="mb-5 px-4 py-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm text-yellow-400">
          Checkout was canceled. You can try again anytime.
        </div>
      )}

      {/* Current plan status */}
      {isActive && currentPlan && (
        <div className="mb-6 bg-th-card border border-th-border rounded-lg p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-th-text-secondary mb-1">Current Plan</p>
              <p className="text-base font-semibold text-th-text">
                {PLANS[currentPlan as keyof typeof PLANS]?.name || currentPlan}{" "}
                <span className="text-sm font-normal text-th-text-secondary">
                  — ${PLANS[currentPlan as keyof typeof PLANS]?.price}/mo
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-green-500/10 text-green-400 text-xs font-semibold rounded-full">
                Active
              </span>
              <button
                onClick={handlePortal}
                disabled={portalLoading}
                className="px-4 py-2 text-sm font-medium text-th-text-secondary border border-th-border hover:bg-th-hover rounded-lg transition-colors disabled:opacity-50"
              >
                {portalLoading ? "Loading..." : "Manage Subscription"}
              </button>
            </div>
          </div>
        </div>
      )}

      {sub?.subscriptionStatus === "past_due" && (
        <div className="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
          Your payment is past due. Please update your payment method to continue using CommentFlow.
          <button
            onClick={handlePortal}
            className="ml-2 underline font-medium"
          >
            Update payment
          </button>
        </div>
      )}

      {/* Plan cards */}
      <div className="grid md:grid-cols-2 gap-5 max-w-2xl">
        {(Object.entries(PLANS) as [string, typeof PLANS.extension][]).map(
          ([key, plan]) => {
            const isCurrent = isActive && currentPlan === key;
            return (
              <div
                key={key}
                className={`bg-th-card border rounded-lg p-5 ${
                  key === "dfy"
                    ? "border-blue-500/40"
                    : "border-th-border"
                }`}
              >
                {key === "dfy" && (
                  <span className="inline-block px-2.5 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full mb-3 uppercase tracking-wide">
                    Most Popular
                  </span>
                )}
                <h3 className="text-sm font-semibold text-th-text">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-1 mb-4">
                  <span className="text-2xl font-bold text-th-text">${plan.price}</span>
                  <span className="text-xs text-th-text-secondary">/mo</span>
                </div>
                <ul className="space-y-2 mb-5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-th-text-secondary">
                      <svg
                        className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <div className="text-center py-2 text-xs font-semibold text-green-400">
                    Current Plan
                  </div>
                ) : (
                  <button
                    onClick={() => handleCheckout(key)}
                    disabled={checkoutLoading === key}
                    className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${
                      key === "dfy"
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-th-input hover:bg-th-hover text-th-text border border-th-border"
                    }`}
                  >
                    {checkoutLoading === key
                      ? "Loading..."
                      : isActive
                      ? "Switch Plan"
                      : "Subscribe"}
                  </button>
                )}
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}
