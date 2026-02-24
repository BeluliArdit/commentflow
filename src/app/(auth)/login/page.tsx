"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);

    try {
      const res = await signIn("credentials", {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid email or password");
        setLoading(false);
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
          <h1 className="text-xl font-bold text-[#0f172a] mb-1">Welcome back</h1>
          <p className="text-sm text-gray-500 mb-6">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
                {error}
              </div>
            )}
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
                className="w-full px-4 py-2.5 bg-[#f8f9fb] border border-gray-200 rounded-xl text-[#0f172a] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0d6efd]/20 focus:border-[#0d6efd] transition-all"
                placeholder="Enter your password"
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
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-[#0d6efd] hover:text-[#0b5ed7] font-medium">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
