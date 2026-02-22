"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generateToken() {
    setLoading(true);
    const res = await fetch("/api/extension/auth", { method: "POST" });
    const data = await res.json();
    setToken(data.token);
    setLoading(false);
  }

  function copyToken() {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-th-text mb-5">Settings</h1>

      <div className="max-w-2xl space-y-6">
        {/* Extension Token */}
        <div className="bg-th-card border border-th-border rounded-lg p-5">
          <h2 className="text-sm font-semibold text-th-text mb-1.5">Chrome Extension</h2>
          <p className="text-xs text-th-text-secondary mb-4">
            Generate a token to connect the CommentFlow Chrome extension to your account.
            Paste this token into the extension popup to authenticate.
          </p>

          {token ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-th-input rounded-md text-xs text-green-400 font-mono break-all">
                  {token}
                </code>
                <button
                  onClick={copyToken}
                  className="px-3 py-1.5 text-xs font-medium text-th-text-secondary border border-th-border hover:bg-th-hover rounded-md transition-colors shrink-0"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <p className="text-xs text-yellow-400">
                Save this token — it won&apos;t be shown again. Generating a new one will invalidate the old one.
              </p>
            </div>
          ) : (
            <button
              onClick={generateToken}
              disabled={loading}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium rounded-md transition-colors"
            >
              {loading ? "Generating..." : "Generate Extension Token"}
            </button>
          )}
        </div>

        {/* API Info */}
        <div className="bg-th-card border border-th-border rounded-lg p-5">
          <h2 className="text-sm font-semibold text-th-text mb-1.5">API Endpoints</h2>
          <p className="text-xs text-th-text-secondary mb-4">
            These endpoints are used by the Chrome extension. Included here for reference.
          </p>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 bg-green-500/10 text-green-400 rounded text-[11px]">GET</span>
              <span className="text-th-text-label">/api/extension/queue</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[11px]">POST</span>
              <span className="text-th-text-label">/api/extension/report</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 bg-green-500/10 text-green-400 rounded text-[11px]">GET</span>
              <span className="text-th-text-label">/api/extension/auth</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
