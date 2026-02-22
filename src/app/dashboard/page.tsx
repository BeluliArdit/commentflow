"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";

interface Comment {
  id: string;
  postId: string;
  generatedText: string;
  status: string;
  postedAt: string | null;
  platformUrl: string | null;
  createdAt: string;
  post: { title: string; url: string; subreddit: string | null; platform: string };
  campaign: { brandName: string };
}

interface Stats {
  campaigns: number;
  discoveredPosts: number;
  pendingComments: number;
  postedComments: number;
}

interface Toast {
  id: string;
  type: "success" | "error";
  message: string;
}

const REVIEW_STATUSES = ["pending_review", "approved", "queued"];
const INFLIGHT_STATUSES = ["ready_to_post", "posting"];
const DONE_STATUSES = ["posted"];
const FAIL_STATUSES = ["failed"];

function statusLabel(s: string) {
  if (s === "ready_to_post") return "Queued — waiting for extension";
  if (s === "posting") return "Posting now...";
  if (s === "posted") return "Posted";
  if (s === "failed") return "Failed";
  return s.replace(/_/g, " ");
}

function StatusTracker({ status }: { status: string }) {
  const steps = [
    { key: "queued", label: "Queued" },
    { key: "posting", label: "Posting" },
    { key: "posted", label: "Done" },
  ];
  const currentIdx =
    status === "ready_to_post" ? 0 :
    status === "posting" ? 1 :
    status === "posted" ? 2 : -1;
  if (currentIdx === -1) return null;
  return (
    <div className="flex items-center gap-1 mt-3">
      {steps.map((step, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={step.key} className="flex items-center gap-1">
            {i > 0 && <div className={`w-8 h-0.5 rounded ${done || active ? "bg-blue-500" : "bg-th-border"}`} />}
            <div className="flex items-center gap-1.5">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                done ? "bg-green-500 text-white" : active ? "bg-blue-500 text-white" : "bg-th-border text-th-text-muted"
              }`}>
                {done ? (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : active && status === "posting" ? (
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                ) : (i + 1)}
              </div>
              <span className={`text-[11px] font-medium ${done ? "text-green-400" : active ? "text-blue-400" : "text-th-text-muted"}`}>
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [stats, setStats] = useState<Stats>({ campaigns: 0, discoveredPosts: 0, pendingComments: 0, postedComments: 0 });
  const [loading, setLoading] = useState(true);
  const [finding, setFinding] = useState(false);
  const [findingStatus, setFindingStatus] = useState("");
  const [generating, setGenerating] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [tab, setTab] = useState<"review" | "activity" | "failed">("review");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [postingIds, setPostingIds] = useState<Set<string>>(new Set());
  const prevStatusRef = useRef<Record<string, string>>({});

  function addToast(type: "success" | "error", message: string) {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }

  const fetchData = useCallback(async (silent = false) => {
    try {
      const [commentsRes, statsRes] = await Promise.all([
        fetch("/api/comments"),
        fetch("/api/dashboard/stats"),
      ]);
      const commentsData = await commentsRes.json();
      const statsData = await statsRes.json();
      const fresh: Comment[] = Array.isArray(commentsData) ? commentsData : [];

      const prev = prevStatusRef.current;
      for (const c of fresh) {
        const old = prev[c.id];
        if (old && old !== c.status) {
          if (c.status === "posted") {
            addToast("success", `Comment posted to ${c.post.subreddit ? `r/${c.post.subreddit}` : "Reddit"}`);
            setPostingIds((s) => { const n = new Set(s); n.delete(c.id); return n; });
          } else if (c.status === "failed") {
            addToast("error", `Failed to post to ${c.post.subreddit ? `r/${c.post.subreddit}` : "Reddit"}`);
            setPostingIds((s) => { const n = new Set(s); n.delete(c.id); return n; });
          }
        }
      }
      prevStatusRef.current = Object.fromEntries(fresh.map((c) => [c.id, c.status]));
      setComments(fresh);
      setStats(statsData);
    } catch {}
    if (!silent) setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh — pause while editing
  useEffect(() => {
    if (editingId) return;
    const interval = setInterval(() => fetchData(true), 5000);
    return () => clearInterval(interval);
  }, [fetchData, editingId]);

  // ---- Actions ----

  async function handleFindPosts() {
    setFinding(true);
    try {
      setFindingStatus("Finding relevant posts...");
      await fetch("/api/cron/discover", { method: "POST" });

      setFindingStatus("Queuing posts...");
      const postsRes = await fetch("/api/posts");
      const posts = await postsRes.json();
      const newPosts = (Array.isArray(posts) ? posts : []).filter((p: { status: string }) => p.status === "new");
      for (const post of newPosts) {
        await fetch(`/api/posts/${post.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "queued" }),
        });
      }

      setFindingStatus("Writing comments...");
      const genRes = await fetch("/api/cron/generate", { method: "POST" });
      const genData = await genRes.json();
      const total = genData.generated || 0;
      if (total > 0) {
        addToast("success", `${total} new comment${total !== 1 ? "s" : ""} ready to review`);
        setTab("review");
      } else {
        addToast("error", "No new comments generated — try adding more keywords or subreddits");
      }
      await fetchData(true);
    } catch {
      addToast("error", "Something went wrong finding posts");
    }
    setFinding(false);
    setFindingStatus("");
  }

  async function handleGenerateAll() {
    setGenerating(true);
    try {
      const res = await fetch("/api/cron/generate", { method: "POST" });
      const data = await res.json();
      if (data.error) {
        addToast("error", data.error);
      } else if (data.generated > 0) {
        addToast("success", `Generated ${data.generated} comment${data.generated !== 1 ? "s" : ""}`);
      } else {
        addToast("error", "No comments to generate");
      }
      await fetchData(true);
    } catch {
      addToast("error", "Generation failed");
    }
    setGenerating(false);
  }

  async function handleRegenerate(comment: Comment) {
    setRegeneratingId(comment.id);
    try {
      if (!comment.id.startsWith("queued-")) {
        await fetch(`/api/comments/${comment.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "rejected" }),
        });
      }
      await fetch(`/api/posts/${comment.postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "queued" }),
      });
      const res = await fetch("/api/cron/generate", { method: "POST" });
      const data = await res.json();
      if (data.generated > 0) {
        addToast("success", "New comment generated");
      } else {
        addToast("error", data.error || "Could not regenerate");
      }
      await fetchData(true);
    } catch {
      addToast("error", "Regeneration failed");
    }
    setRegeneratingId(null);
  }

  async function postComment(id: string) {
    setPostingIds((s) => new Set(s).add(id));
    await fetch(`/api/comments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ready_to_post" }),
    });
    setComments((prev) => prev.map((c) => (c.id === id ? { ...c, status: "ready_to_post" } : c)));
  }

  async function skipComment(id: string) {
    if (id.startsWith("queued-")) {
      const comment = comments.find((c) => c.id === id);
      if (comment) {
        await fetch(`/api/posts/${comment.postId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "skipped" }),
        });
      }
    } else {
      await fetch(`/api/comments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });
    }
    setComments((prev) => prev.filter((c) => c.id !== id));
  }

  async function retryComment(id: string) {
    setPostingIds((s) => new Set(s).add(id));
    await fetch(`/api/comments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ready_to_post" }),
    });
    setComments((prev) => prev.map((c) => (c.id === id ? { ...c, status: "ready_to_post" } : c)));
  }

  async function saveEdit(id: string) {
    if (!editText.trim()) {
      addToast("error", "Comment can't be empty");
      return;
    }

    try {
      if (id.startsWith("queued-")) {
        // Create a real comment record for this queued post
        const comment = comments.find((c) => c.id === id);
        if (!comment) return;
        const res = await fetch("/api/comments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId: comment.postId, generatedText: editText }),
        });
        if (!res.ok) {
          addToast("error", "Failed to save");
          return;
        }
      } else {
        const res = await fetch(`/api/comments/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ generatedText: editText }),
        });
        if (!res.ok) {
          addToast("error", "Failed to save");
          return;
        }
      }
      addToast("success", "Comment saved");
      await fetchData(true);
    } catch {
      addToast("error", "Failed to save");
    }
    setEditingId(null);
  }

  // ---- Filtered lists ----
  const reviewList = comments.filter((c) => REVIEW_STATUSES.includes(c.status) || postingIds.has(c.id));
  const activityList = comments.filter((c) => [...DONE_STATUSES, ...INFLIGHT_STATUSES].includes(c.status) && !postingIds.has(c.id));
  const failedList = comments.filter((c) => FAIL_STATUSES.includes(c.status));
  const queuedCount = comments.filter((c) => c.status === "queued").length;
  const filtered = tab === "review" ? reviewList : tab === "activity" ? activityList : failedList;

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-th-card border border-th-border rounded-lg p-5 animate-pulse">
            <div className="h-4 bg-th-input rounded w-1/3 mb-3" />
            <div className="h-3 bg-th-input rounded w-2/3 mb-2" />
            <div className="h-12 bg-th-input rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Toasts */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-slide-in ${
                toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
              }`}
            >
              {toast.message}
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-th-text">
            {session?.user?.name ? `Hey ${session.user.name}` : "Dashboard"}
          </h1>
          <p className="text-sm text-th-text-secondary mt-0.5">
            {reviewList.length > 0
              ? `${reviewList.length} comment${reviewList.length !== 1 ? "s" : ""} to review`
              : "No comments to review right now"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {queuedCount > 0 && (
            <button
              onClick={handleGenerateAll}
              disabled={generating}
              className="px-3 py-2 bg-th-card border border-th-border hover:bg-th-hover disabled:opacity-50 text-th-text text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              {generating && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {generating ? "Generating..." : `Generate All (${queuedCount})`}
            </button>
          )}
          <button
            onClick={handleFindPosts}
            disabled={finding || stats.campaigns === 0}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
          >
            {finding && (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {finding ? findingStatus || "Working..." : "Find New Posts"}
          </button>
        </div>
      </div>

      {/* No campaigns nudge */}
      {stats.campaigns === 0 && (
        <div className="text-center py-12 bg-th-card border border-th-border rounded-lg mb-6">
          <p className="text-th-text text-sm font-medium mb-2">Create a campaign to get started</p>
          <p className="text-xs text-th-text-secondary mb-4">Tell us your brand, keywords, and target subreddits — we&apos;ll find relevant posts and write comments for you.</p>
          <Link
            href="/dashboard/campaigns/new"
            className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Create Campaign
          </Link>
        </div>
      )}

      {/* Quick stats */}
      {stats.campaigns > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-th-card border border-th-border rounded-lg px-4 py-3 text-center">
            <div className="text-2xl font-bold text-th-text">{stats.campaigns}</div>
            <div className="text-xs text-th-text-muted mt-0.5">Campaigns</div>
          </div>
          <div className="bg-th-card border border-th-border rounded-lg px-4 py-3 text-center">
            <div className="text-2xl font-bold text-th-text">{reviewList.length}</div>
            <div className="text-xs text-th-text-muted mt-0.5">To Review</div>
          </div>
          <div className="bg-th-card border border-th-border rounded-lg px-4 py-3 text-center">
            <div className="text-2xl font-bold text-green-400">{stats.postedComments}</div>
            <div className="text-xs text-th-text-muted mt-0.5">Posted</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      {stats.campaigns > 0 && (
        <>
          <div className="flex gap-0 border-b border-th-divider mb-4">
            {[
              { key: "review" as const, label: "To Review", count: reviewList.length },
              { key: "activity" as const, label: "Activity", count: activityList.length },
              { key: "failed" as const, label: "Failed", count: failedList.length },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                  tab === t.key ? "text-blue-400" : "text-th-text-muted hover:text-th-text-secondary"
                }`}
              >
                {t.label}
                {t.count > 0 && (
                  <span className={`ml-1.5 text-xs ${tab === t.key ? "text-blue-400" : "text-th-text-muted"}`}>{t.count}</span>
                )}
                {tab === t.key && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 rounded-t" />}
              </button>
            ))}
          </div>

          {/* Comment cards */}
          {filtered.length === 0 ? (
            <div className="text-center py-12 bg-th-card border border-th-border rounded-lg">
              <p className="text-sm text-th-text-secondary">
                {tab === "review"
                  ? "No comments to review. Click \"Find New Posts\" to get started."
                  : tab === "activity"
                  ? "No activity yet."
                  : "No failed comments."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((comment) => {
                const isQueued = comment.status === "queued";
                const isInflight = INFLIGHT_STATUSES.includes(comment.status);
                const isPosted = comment.status === "posted";
                const isFailed = comment.status === "failed";
                const isRegenerating = regeneratingId === comment.id;
                const hasText = comment.generatedText && comment.generatedText.trim().length > 0;

                return (
                  <div
                    key={comment.id}
                    className={`bg-th-card border rounded-lg p-4 transition-all ${
                      isInflight ? "border-yellow-500/40" :
                      isPosted ? "border-green-500/30" :
                      isFailed ? "border-red-500/30" :
                      "border-th-border"
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-blue-400">
                            {comment.post.subreddit ? `r/${comment.post.subreddit}` : "Reddit"}
                          </span>
                          <span className="text-xs text-th-text-muted">{comment.campaign.brandName}</span>
                        </div>
                        <a
                          href={comment.post.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-th-text hover:text-blue-400 transition-colors line-clamp-1"
                        >
                          {comment.post.title}
                        </a>
                      </div>

                      {(isInflight || isPosted || isFailed) && (
                        <span className={`shrink-0 text-[11px] px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5 ${
                          isPosted ? "bg-green-500/10 text-green-400" :
                          isFailed ? "bg-red-500/10 text-red-400" :
                          "bg-yellow-500/10 text-yellow-400"
                        }`}>
                          {isInflight && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />}
                          {statusLabel(comment.status)}
                        </span>
                      )}
                    </div>

                    {/* Comment text or edit */}
                    {editingId === comment.id ? (
                      <div className="mb-3">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={4}
                          placeholder="Write your comment..."
                          className="w-full px-3 py-2 bg-th-input border border-th-border-input rounded-lg text-sm text-th-text focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => saveEdit(comment.id)}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1.5 text-xs font-medium text-th-text-secondary border border-th-border hover:bg-th-hover rounded-md transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : hasText ? (
                      <p className="text-sm text-th-text-label leading-relaxed whitespace-pre-wrap">
                        {comment.generatedText}
                      </p>
                    ) : (
                      <p className="text-sm text-th-text-muted italic">
                        No comment yet — click Write or Generate
                      </p>
                    )}

                    {/* Progress tracker */}
                    {(isInflight || isPosted) && tab !== "activity" && <StatusTracker status={comment.status} />}

                    {/* Actions */}
                    {editingId !== comment.id && (
                      <div className="flex items-center gap-2 mt-3">
                        {/* Queued / no text — Write, Generate, Skip */}
                        {isQueued && (
                          <>
                            <button
                              onClick={() => { setEditingId(comment.id); setEditText(comment.generatedText || ""); }}
                              className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                            >
                              Write
                            </button>
                            <button
                              onClick={() => handleRegenerate(comment)}
                              disabled={isRegenerating}
                              className="px-3 py-1.5 text-xs font-medium text-th-text-secondary border border-th-border hover:bg-th-hover disabled:opacity-50 rounded-md transition-colors flex items-center gap-1.5"
                            >
                              {isRegenerating && (
                                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                              )}
                              {isRegenerating ? "Generating..." : "Generate"}
                            </button>
                            <button
                              onClick={() => skipComment(comment.id)}
                              className="px-3 py-1.5 text-xs font-medium text-th-text-muted hover:text-red-400 border border-th-border hover:border-red-500/30 rounded-md transition-colors"
                            >
                              Skip
                            </button>
                          </>
                        )}

                        {/* Has text, reviewable — Post, Edit, Regenerate, Skip */}
                        {!isQueued && REVIEW_STATUSES.includes(comment.status) && !isInflight && (
                          <>
                            <button
                              onClick={() => postComment(comment.id)}
                              className="px-3 py-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
                            >
                              Post
                            </button>
                            <button
                              onClick={() => { setEditingId(comment.id); setEditText(comment.generatedText); }}
                              className="px-3 py-1.5 text-xs font-medium text-th-text-secondary border border-th-border hover:bg-th-hover rounded-md transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleRegenerate(comment)}
                              disabled={isRegenerating}
                              className="px-3 py-1.5 text-xs font-medium text-th-text-secondary border border-th-border hover:bg-th-hover disabled:opacity-50 rounded-md transition-colors flex items-center gap-1.5"
                            >
                              {isRegenerating && (
                                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                              )}
                              {isRegenerating ? "Generating..." : "Regenerate"}
                            </button>
                            <button
                              onClick={() => skipComment(comment.id)}
                              className="px-3 py-1.5 text-xs font-medium text-th-text-muted hover:text-red-400 border border-th-border hover:border-red-500/30 rounded-md transition-colors"
                            >
                              Skip
                            </button>
                          </>
                        )}

                        {/* Failed — Retry, Edit */}
                        {isFailed && (
                          <>
                            <button
                              onClick={() => retryComment(comment.id)}
                              className="px-3 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-md transition-colors"
                            >
                              Retry
                            </button>
                            <button
                              onClick={() => { setEditingId(comment.id); setEditText(comment.generatedText); }}
                              className="px-3 py-1.5 text-xs font-medium text-th-text-secondary border border-th-border hover:bg-th-hover rounded-md transition-colors"
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
                            className="px-3 py-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors ml-auto"
                          >
                            View on Reddit
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <style jsx global>{`
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
      `}</style>
    </div>
  );
}
