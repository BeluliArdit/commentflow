"use client";

import { useEffect, useState } from "react";

interface DiscoveredPost {
  id: string;
  platform: string;
  title: string;
  body: string;
  url: string;
  subreddit: string | null;
  relevanceScore: number;
  status: string;
  createdAt: string;
  campaign: { brandName: string };
}

export default function PostsPage() {
  const [posts, setPosts] = useState<DiscoveredPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/posts")
      .then((r) => r.json())
      .then((data) => {
        setPosts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function skipPost(id: string) {
    await fetch(`/api/posts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "skipped" }),
    });
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, status: "skipped" } : p)));
  }

  async function queuePost(id: string) {
    await fetch(`/api/posts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "queued" }),
    });
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, status: "queued" } : p)));
  }

  if (loading) return <div className="text-gray-400">Loading posts...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Discovered Posts</h1>
        <button
          onClick={async () => {
            const res = await fetch("/api/cron/discover", { method: "POST" });
            const data = await res.json();
            alert(`Discovered ${data.postsDiscovered} posts from ${data.campaignsProcessed} campaigns`);
            window.location.reload();
          }}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Run Discovery Now
        </button>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-xl">
          <p className="text-gray-400">No posts discovered yet. Create a campaign and run discovery.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-purple-400 font-medium">
                      {post.subreddit ? `r/${post.subreddit}` : post.platform}
                    </span>
                    <span className="text-xs text-gray-600">·</span>
                    <span className="text-xs text-gray-500">{post.campaign.brandName}</span>
                    <span className="text-xs text-gray-600">·</span>
                    <span
                      className={`text-xs font-medium ${
                        post.relevanceScore > 0.5
                          ? "text-green-400"
                          : post.relevanceScore > 0.25
                          ? "text-yellow-400"
                          : "text-gray-500"
                      }`}
                    >
                      {Math.round(post.relevanceScore * 100)}% relevant
                    </span>
                  </div>
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white font-medium hover:text-blue-400 transition-colors"
                  >
                    {post.title}
                  </a>
                  {post.body && (
                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">{post.body}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {post.status === "new" && (
                    <>
                      <button
                        onClick={() => queuePost(post.id)}
                        className="px-3 py-1.5 text-xs font-medium text-green-400 bg-green-500/10 hover:bg-green-500/20 rounded-lg transition-colors"
                      >
                        Queue
                      </button>
                      <button
                        onClick={() => skipPost(post.id)}
                        className="px-3 py-1.5 text-xs font-medium text-gray-400 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        Skip
                      </button>
                    </>
                  )}
                  {post.status !== "new" && (
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        post.status === "queued"
                          ? "bg-blue-500/10 text-blue-400"
                          : post.status === "commented"
                          ? "bg-green-500/10 text-green-400"
                          : "bg-gray-800 text-gray-500"
                      }`}
                    >
                      {post.status}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
