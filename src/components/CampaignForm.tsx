"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface CampaignFormProps {
  initialData?: {
    id: string;
    brandName: string;
    productDescription: string;
    keywords: string;
    subreddits: string;
    tone: string;
    maxCommentsPerDay: number;
    autoApprove: boolean;
  };
}

export default function CampaignForm({ initialData }: CampaignFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEdit = !!initialData;

  const [brandName, setBrandName] = useState(initialData?.brandName ?? "");
  const [productDescription, setProductDescription] = useState(
    initialData?.productDescription ?? ""
  );
  const [keywordsStr, setKeywordsStr] = useState(
    initialData ? (JSON.parse(initialData.keywords) as string[]).join(", ") : ""
  );
  const [subredditsStr, setSubredditsStr] = useState(
    initialData ? (JSON.parse(initialData.subreddits) as string[]).join(", ") : ""
  );
  const [tone, setTone] = useState(initialData?.tone ?? "helpful");
  const [maxCommentsPerDay, setMaxCommentsPerDay] = useState(
    initialData?.maxCommentsPerDay ?? 5
  );
  const [autoApprove, setAutoApprove] = useState(initialData?.autoApprove ?? false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const keywords = keywordsStr
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
    const subreddits = subredditsStr
      .split(",")
      .map((s) => s.trim().replace(/^r\//, ""))
      .filter(Boolean);

    if (keywords.length === 0) {
      setError("At least one keyword is required");
      setLoading(false);
      return;
    }

    const body = { brandName, productDescription, keywords, subreddits, tone, maxCommentsPerDay, autoApprove };

    const url = isEdit ? `/api/campaigns/${initialData.id}` : "/api/campaigns";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Something went wrong");
      setLoading(false);
      return;
    }

    router.push("/dashboard/campaigns");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
      {error && (
        <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-sm">
          {typeof error === "string" ? error : "Validation error"}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-th-text-label mb-1">Brand Name</label>
        <input
          value={brandName}
          onChange={(e) => setBrandName(e.target.value)}
          required
          className="w-full px-3 py-2 bg-th-input border border-th-border-input rounded-md text-sm text-th-text placeholder-th-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Acme Corp"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-th-text-label mb-1">Product Description</label>
        <textarea
          value={productDescription}
          onChange={(e) => setProductDescription(e.target.value)}
          required
          rows={3}
          className="w-full px-3 py-2 bg-th-input border border-th-border-input rounded-md text-sm text-th-text placeholder-th-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Describe your product or service..."
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-th-text-label mb-1">
          Keywords <span className="text-th-text-muted">(comma-separated)</span>
        </label>
        <input
          value={keywordsStr}
          onChange={(e) => setKeywordsStr(e.target.value)}
          className="w-full px-3 py-2 bg-th-input border border-th-border-input rounded-md text-sm text-th-text placeholder-th-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="project management, team collaboration, task tracking"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-th-text-label mb-1">
          Subreddits <span className="text-th-text-muted">(comma-separated, optional — leave empty for global search)</span>
        </label>
        <input
          value={subredditsStr}
          onChange={(e) => setSubredditsStr(e.target.value)}
          className="w-full px-3 py-2 bg-th-input border border-th-border-input rounded-md text-sm text-th-text placeholder-th-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="startups, SaaS, productivity"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-th-text-label mb-1">Tone</label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="w-full px-3 py-2 bg-th-input border border-th-border-input rounded-md text-sm text-th-text focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="helpful">Helpful</option>
            <option value="casual">Casual</option>
            <option value="professional">Professional</option>
            <option value="enthusiastic">Enthusiastic</option>
            <option value="technical">Technical</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-th-text-label mb-1">Max Comments/Day</label>
          <input
            type="number"
            value={maxCommentsPerDay}
            onChange={(e) => setMaxCommentsPerDay(Number(e.target.value))}
            min={1}
            max={50}
            className="w-full px-3 py-2 bg-th-input border border-th-border-input rounded-md text-sm text-th-text focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="autoApprove"
          checked={autoApprove}
          onChange={(e) => setAutoApprove(e.target.checked)}
          className="w-4 h-4 rounded bg-th-input border-th-border-input text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="autoApprove" className="text-xs text-th-text-label">
          Auto-approve generated comments (skip manual review)
        </label>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-md transition-colors"
        >
          {loading ? "Saving..." : isEdit ? "Update Campaign" : "Create Campaign"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm font-medium text-th-text-secondary border border-th-border hover:bg-th-hover rounded-md transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
