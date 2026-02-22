"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Campaign {
  id: string;
  brandName: string;
  productDescription: string;
  keywords: string;
  subreddits: string;
  tone: string;
  maxCommentsPerDay: number;
  status: string;
  createdAt: string;
  _count: { discoveredPosts: number; comments: number };
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((data) => {
        setCampaigns(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function toggleStatus(id: string, currentStatus: string) {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    await fetch(`/api/campaigns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setCampaigns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
    );
  }

  async function deleteCampaign(id: string) {
    if (!confirm("Delete this campaign? This will also delete all discovered posts and comments.")) return;
    await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
  }

  if (loading) {
    return <div className="text-th-text-secondary text-sm">Loading campaigns...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-th-text">Campaigns</h1>
        <Link
          href="/dashboard/campaigns/new"
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
        >
          New Campaign
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-16 bg-th-card border border-th-border rounded-lg">
          <p className="text-th-text-secondary text-sm mb-4">No campaigns yet. Create your first one!</p>
          <Link
            href="/dashboard/campaigns/new"
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
          >
            Create Campaign
          </Link>
        </div>
      ) : (
        <div className="bg-th-card border border-th-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-th-divider">
                <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider text-th-text-muted font-medium">Brand</th>
                <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider text-th-text-muted font-medium">Keywords</th>
                <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider text-th-text-muted font-medium">Subreddits</th>
                <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider text-th-text-muted font-medium">Status</th>
                <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider text-th-text-muted font-medium">Posts</th>
                <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider text-th-text-muted font-medium">Comments</th>
                <th className="text-right px-4 py-2.5 text-[11px] uppercase tracking-wider text-th-text-muted font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => {
                const keywords = JSON.parse(campaign.keywords) as string[];
                const subreddits = JSON.parse(campaign.subreddits) as string[];
                return (
                  <tr
                    key={campaign.id}
                    className="border-b border-th-divider last:border-b-0 hover:bg-th-table-row-hover transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-th-text">{campaign.brandName}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-th-text-secondary">{keywords.join(", ")}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-th-text-secondary">
                        {subreddits.length > 0 ? subreddits.map((s) => `r/${s}`).join(", ") : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        <span className={`w-1.5 h-1.5 rounded-full ${campaign.status === "active" ? "bg-green-400" : "bg-gray-400"}`} />
                        <span className="text-th-text-secondary capitalize">{campaign.status}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-th-text-secondary">{campaign._count.discoveredPosts}</td>
                    <td className="px-4 py-3 text-sm text-th-text-secondary">{campaign._count.comments}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => toggleStatus(campaign.id, campaign.status)}
                          className="px-2.5 py-1 text-xs font-medium text-th-text-secondary border border-th-border hover:bg-th-hover rounded-md transition-colors"
                        >
                          {campaign.status === "active" ? "Pause" : "Resume"}
                        </button>
                        <Link
                          href={`/dashboard/campaigns/${campaign.id}/edit`}
                          className="px-2.5 py-1 text-xs font-medium text-th-text-secondary border border-th-border hover:bg-th-hover rounded-md transition-colors"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => deleteCampaign(campaign.id)}
                          className="px-2.5 py-1 text-xs font-medium text-red-400 border border-red-500/30 hover:bg-red-500/10 rounded-md transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
