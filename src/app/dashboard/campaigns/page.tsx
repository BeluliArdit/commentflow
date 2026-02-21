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
    return <div className="text-gray-400">Loading campaigns...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Campaigns</h1>
        <Link
          href="/dashboard/campaigns/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          New Campaign
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-xl">
          <p className="text-gray-400 mb-4">No campaigns yet. Create your first one!</p>
          <Link
            href="/dashboard/campaigns/new"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Create Campaign
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign) => {
            const keywords = JSON.parse(campaign.keywords) as string[];
            const subreddits = JSON.parse(campaign.subreddits) as string[];
            return (
              <div
                key={campaign.id}
                className="bg-gray-900 border border-gray-800 rounded-xl p-6"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-lg font-semibold text-white">{campaign.brandName}</h2>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          campaign.status === "active"
                            ? "bg-green-500/10 text-green-400"
                            : "bg-yellow-500/10 text-yellow-400"
                        }`}
                      >
                        {campaign.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mb-3 max-w-xl">
                      {campaign.productDescription}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {keywords.map((kw) => (
                        <span
                          key={kw}
                          className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded-full"
                        >
                          {kw}
                        </span>
                      ))}
                      {subreddits.map((sr) => (
                        <span
                          key={sr}
                          className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-xs rounded-full"
                        >
                          r/{sr}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">
                      {campaign._count.discoveredPosts} posts discovered · {campaign._count.comments} comments
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleStatus(campaign.id, campaign.status)}
                      className="px-3 py-1.5 text-xs font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      {campaign.status === "active" ? "Pause" : "Resume"}
                    </button>
                    <Link
                      href={`/dashboard/campaigns/${campaign.id}/edit`}
                      className="px-3 py-1.5 text-xs font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => deleteCampaign(campaign.id)}
                      className="px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
