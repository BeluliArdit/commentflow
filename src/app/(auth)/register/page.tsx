"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(typeof data.error === "string" ? data.error : "Please check your details and try again.");
        setLoading(false);
        return;
      }

      // Auto sign in immediately after registration
      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInRes?.error) {
        // Fallback: account was created, just redirect to dashboard via hard nav
        window.location.href = "/dashboard";
      } else {
        // Hard redirect to pick up the new session cookie
        window.location.href = "/dashboard";
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fb]">
      <div className="w-full max-w-[420px] mx-4">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 font-extrabold text-xl tracking-tight text-[#0f172a]">
            <div className="w-9 h-9 bg-[#0d6efd] rounded-lg flex items-center justify-center text-white text-sm font-bold">
              CF
            </div>
            Comment<span className="text-[#0d6efd]">Flow</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <h1 className="text-xl font-bold text-[#0f172a] mb-1">Create your account</h1>
          <p className="text-sm text-gray-500 mb-6">Get started free — no credit card required</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Name</label>
              <input
                name="name"
                type="text"
                required
                className="w-full px-4 py-2.5 bg-[#f8f9fb] border border-gray-200 rounded-xl text-[#0f172a] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0d6efd]/20 focus:border-[#0d6efd] transition-all"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Email</label>
              <input
                name="email"
                type="email"
                required
                className="w-full px-4 py-2.5 bg-[#f8f9fb] border border-gray-200 rounded-xl text-[#0f172a] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0d6efd]/20 focus:border-[#0d6efd] transition-all"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Password</label>
              <input
                name="password"
                type="password"
                required
                minLength={6}
                className="w-full px-4 py-2.5 bg-[#f8f9fb] border border-gray-200 rounded-xl text-[#0f172a] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0d6efd]/20 focus:border-[#0d6efd] transition-all"
                placeholder="Min. 6 characters"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#0d6efd] hover:bg-[#0b5ed7] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors shadow-sm shadow-blue-500/20"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account...
                </span>
              ) : (
                "Create account"
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="text-[#0d6efd] hover:text-[#0b5ed7] font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
