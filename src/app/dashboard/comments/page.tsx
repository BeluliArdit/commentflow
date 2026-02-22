"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface Comment {
  id: string;
  generatedText: string;
  status: string;
  postedAt: string | null;
  platformUrl: string | null;
  createdAt: string;
  post: { title: string; url: string; subreddit: string | null; platform: string };
  campaign: { brandName: string };
}

const PAGE_SIZE = 20;

const filterTabs = [
  { key: "all", label: "All" },
  { key: "queued", label: "Queued" },
  { key: "pending_review", label: "Pending review" },
  { key: "approved", label: "Approved" },
  { key: "ready_to_post", label: "Ready to post" },
  { key: "posting", label: "Posting" },
  { key: "posted", label: "Posted" },
  { key: "failed", label: "Failed" },
];

export default function CommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [generating, setGenerating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/comments")
      .then((r) => r.json())
      .then((data) => {
        setComments(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  }, []);

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/comments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status } : c))
    );
  }

  async function saveEdit(id: string) {
    await fetch(`/api/comments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ generatedText: editText }),
    });
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, generatedText: editText } : c))
    );
    setEditingId(null);
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/cron/generate", { method: "POST" });
      const data = await res.json();
      if (data.error) {
        alert(`Generation failed: ${data.error}`);
      } else if (data.generated === 0) {
        alert("No comments generated. Make sure you have queued posts and a valid OPENAI_API_KEY in your .env file.");
      } else {
        alert(`Generated ${data.generated} comments!`);
        const r = await fetch("/api/comments");
        const fresh = await r.json();
        setComments(Array.isArray(fresh) ? fresh : []);
      }
    } catch {
      alert("Generation failed. Make sure OPENAI_API_KEY is set in your .env file.");
    } finally {
      setGenerating(false);
    }
  }

  const filtered = filter === "all" ? comments : comments.filter((c) => c.status === filter);
  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-th-card border border-th-border rounded-lg p-4 animate-pulse">
            <div className="h-3 bg-th-input rounded w-1/4 mb-3" />
            <div className="h-4 bg-th-input rounded w-1/2 mb-4" />
            <div className="h-12 bg-th-input rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-th-text">Comment Queue</h1>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-md transition-colors"
        >
          {generating ? "Generating..." : "Generate Comments"}
        </button>
      </div>

      {/* Underline-style filter tabs */}
      <div className="flex gap-0 border-b border-th-divider mb-4">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setFilter(tab.key); setVisibleCount(PAGE_SIZE); }}
            className={`px-3 py-2 text-xs font-medium transition-colors relative ${
              filter === tab.key
                ? "text-blue-400"
                : "text-th-text-muted hover:text-th-text-secondary"
            }`}
          >
            {tab.label}
            {filter === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 rounded-t" />
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-th-card border border-th-border rounded-lg">
          <p className="text-th-text-secondary text-sm mb-2">No comments here yet.</p>
          <p className="text-xs text-th-text-muted mb-4">
            To generate comments: go to{" "}
            <Link href="/dashboard/posts" className="text-blue-400 hover:text-blue-300">Discovered Posts</Link>
            , queue the posts you want, then come back and click <strong>Generate Comments</strong>.
          </p>
          <p className="text-xs text-th-text-muted">
            Make sure <code className="px-1.5 py-0.5 bg-th-input rounded text-th-text-label">OPENAI_API_KEY</code> is set in your .env file.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-th-card border border-th-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-th-divider">
                  <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider text-th-text-muted font-medium">Source</th>
                  <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider text-th-text-muted font-medium">Post</th>
                  <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider text-th-text-muted font-medium">Comment</th>
                  <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider text-th-text-muted font-medium">Status</th>
                  <th className="text-right px-4 py-2.5 text-[11px] uppercase tracking-wider text-th-text-muted font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((comment) => {
                  const isExpanded = expandedId === comment.id;
                  return (
                    <tr
                      key={comment.id}
                      className="border-b border-th-divider last:border-b-0 hover:bg-th-table-row-hover transition-colors align-top"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <span className={`text-xs font-medium ${comment.post.platform === "youtube" ? "text-red-400" : "text-blue-400"}`}>
                            {comment.post.platform === "youtube" ? "YouTube" : comment.post.subreddit ? `r/${comment.post.subreddit}` : "Reddit"}
                          </span>
                          <div className="text-[11px] text-th-text-muted mt-0.5">{comment.campaign.brandName}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        <a
                          href={comment.post.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-th-text font-medium hover:text-blue-400 transition-colors line-clamp-1"
                        >
                          {comment.post.title}
                        </a>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        {comment.status === "queued" ? (
                          <span className="text-xs text-th-text-muted italic">Awaiting generation</span>
                        ) : editingId === comment.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              rows={4}
                              className="w-full px-2 py-1.5 bg-th-input border border-th-border-input rounded-md text-th-text text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => saveEdit(comment.id)}
                                className="px-2 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="px-2 py-1 text-xs font-medium text-th-text-secondary border border-th-border hover:bg-th-hover rounded-md transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : comment.id)}
                            className="text-left w-full"
                          >
                            <p className={`text-xs text-th-text-label ${isExpanded ? "whitespace-pre-wrap" : "line-clamp-2"}`}>
                              {comment.generatedText}
                            </p>
                            {comment.generatedText.length > 100 && (
                              <span className="text-[11px] text-blue-400 mt-0.5 inline-block">
                                {isExpanded ? "Show less" : "Show more"}
                              </span>
                            )}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs whitespace-nowrap">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            comment.status === "posted" ? "bg-green-400"
                              : comment.status === "failed" || comment.status === "rejected" ? "bg-red-400"
                              : comment.status === "approved" || comment.status === "ready_to_post" ? "bg-blue-400"
                              : comment.status === "posting" ? "bg-yellow-400 animate-pulse"
                              : "bg-gray-400"
                          }`} />
                          <span className="text-th-text-secondary">{comment.status.replace(/_/g, " ")}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {comment.status === "pending_review" && editingId !== comment.id && (
                            <>
                              <button
                                onClick={() => updateStatus(comment.id, "approved")}
                                className="px-2.5 py-1 text-xs font-medium text-blue-400 border border-blue-500/30 hover:bg-blue-500/10 rounded-md transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setEditingId(comment.id);
                                  setEditText(comment.generatedText);
                                }}
                                className="px-2.5 py-1 text-xs font-medium text-th-text-secondary border border-th-border hover:bg-th-hover rounded-md transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => updateStatus(comment.id, "rejected")}
                                className="px-2.5 py-1 text-xs font-medium text-red-400 border border-red-500/30 hover:bg-red-500/10 rounded-md transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {comment.status === "approved" && (
                            <button
                              onClick={() => updateStatus(comment.id, "ready_to_post")}
                              className="px-2.5 py-1 text-xs font-medium text-blue-400 border border-blue-500/30 hover:bg-blue-500/10 rounded-md transition-colors"
                            >
                              Send to Extension
                            </button>
                          )}
                          {(comment.status === "failed" || comment.status === "posting") && (
                            <>
                              <button
                                onClick={() => updateStatus(comment.id, "ready_to_post")}
                                className="px-2.5 py-1 text-xs font-medium text-orange-400 border border-orange-500/30 hover:bg-orange-500/10 rounded-md transition-colors"
                              >
                                Retry
                              </button>
                              <button
                                onClick={() => {
                                  setEditingId(comment.id);
                                  setEditText(comment.generatedText);
                                }}
                                className="px-2.5 py-1 text-xs font-medium text-th-text-secondary border border-th-border hover:bg-th-hover rounded-md transition-colors"
                              >
                                Edit
                              </button>
                            </>
                          )}
                          {comment.platformUrl && (
                            <a
                              href={comment.platformUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-400 hover:text-blue-300"
                            >
                              View
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <div className="mt-4 text-center">
              <button
                onClick={loadMore}
                className="px-4 py-1.5 text-sm font-medium text-th-text-secondary border border-th-border hover:bg-th-hover rounded-md transition-colors"
              >
                Load more ({filtered.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
