"use client";

import { useEffect, useState, useCallback } from "react";

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

const PAGE_SIZE = 20;

export default function PostsPage() {
  const [posts, setPosts] = useState<DiscoveredPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [discovering, setDiscovering] = useState(false);

  useEffect(() => {
    fetch("/api/posts")
      .then((r) => r.json())
      .then((data) => {
        setPosts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
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

  const visible = posts.slice(0, visibleCount);
  const hasMore = visibleCount < posts.length;

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-th-card border border-th-border rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-th-input rounded w-1/3 mb-3" />
            <div className="h-5 bg-th-input rounded w-2/3 mb-2" />
            <div className="h-4 bg-th-input rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-th-text">Discovered Posts</h1>
        <button
          onClick={async () => {
            setDiscovering(true);
            try {
              const res = await fetch("/api/cron/discover", { method: "POST" });
              const data = await res.json();
              alert(`Discovered ${data.postsDiscovered} posts from ${data.campaignsProcessed} campaigns`);
              window.location.reload();
            } catch {
              alert("Discovery failed. Check your console for errors.");
            } finally {
              setDiscovering(false);
            }
          }}
          disabled={discovering}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-md transition-colors"
        >
          {discovering ? "Discovering..." : "Run Discovery Now"}
        </button>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-16 bg-th-card border border-th-border rounded-lg">
          <p className="text-th-text-secondary text-sm">No posts discovered yet. Create a campaign and run discovery.</p>
        </div>
      ) : (
        <>
          <div className="bg-th-card border border-th-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-th-divider">
                  <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider text-th-text-muted font-medium">Source</th>
                  <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider text-th-text-muted font-medium">Title</th>
                  <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider text-th-text-muted font-medium">Campaign</th>
                  <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider text-th-text-muted font-medium">Status</th>
                  <th className="text-right px-4 py-2.5 text-[11px] uppercase tracking-wider text-th-text-muted font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((post) => (
                  <tr
                    key={post.id}
                    className="border-b border-th-divider last:border-b-0 hover:bg-th-table-row-hover transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${post.platform === "youtube" ? "text-red-400" : "text-blue-400"}`}>
                        {post.platform === "youtube" ? "YouTube" : post.subreddit ? `r/${post.subreddit}` : "Reddit"}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-md">
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-th-text font-medium hover:text-blue-400 transition-colors line-clamp-1"
                      >
                        {post.title}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-sm text-th-text-secondary">{post.campaign.brandName}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          post.status === "new" ? "bg-blue-400"
                            : post.status === "queued" ? "bg-green-400"
                            : post.status === "commented" ? "bg-green-400"
                            : "bg-gray-400"
                        }`} />
                        <span className="text-th-text-secondary capitalize">{post.status}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {post.status === "new" && (
                          <>
                            <button
                              onClick={() => queuePost(post.id)}
                              className="px-2.5 py-1 text-xs font-medium text-blue-400 border border-blue-500/30 hover:bg-blue-500/10 rounded-md transition-colors"
                            >
                              Queue
                            </button>
                            <button
                              onClick={() => skipPost(post.id)}
                              className="px-2.5 py-1 text-xs font-medium text-th-text-secondary border border-th-border hover:bg-th-hover rounded-md transition-colors"
                            >
                              Skip
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <div className="mt-4 text-center">
              <button
                onClick={loadMore}
                className="px-4 py-1.5 text-sm font-medium text-th-text-secondary border border-th-border hover:bg-th-hover rounded-md transition-colors"
              >
                Load more ({posts.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
