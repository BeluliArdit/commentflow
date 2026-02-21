"use client";

import { useEffect, useState } from "react";

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

const statusColors: Record<string, string> = {
  pending_review: "bg-yellow-500/10 text-yellow-400",
  approved: "bg-blue-500/10 text-blue-400",
  ready_to_post: "bg-purple-500/10 text-purple-400",
  posting: "bg-blue-500/10 text-blue-300",
  posted: "bg-green-500/10 text-green-400",
  failed: "bg-red-500/10 text-red-400",
  rejected: "bg-gray-800 text-gray-500",
};

export default function CommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/comments")
      .then((r) => r.json())
      .then((data) => {
        setComments(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
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

  const filtered = filter === "all" ? comments : comments.filter((c) => c.status === filter);

  if (loading) return <div className="text-gray-400">Loading comments...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Comment Queue</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              const res = await fetch("/api/cron/generate", { method: "POST" });
              const data = await res.json();
              alert(`Generated ${data.generated} comments`);
              window.location.reload();
            }}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Generate Comments
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {["all", "pending_review", "approved", "ready_to_post", "posted", "failed"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filter === f
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            {f === "all" ? "All" : f.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-xl">
          <p className="text-gray-400">No comments found. Queue some posts and run generation.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((comment) => (
            <div
              key={comment.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-purple-400 font-medium">
                      {comment.post.subreddit ? `r/${comment.post.subreddit}` : comment.post.platform}
                    </span>
                    <span className="text-xs text-gray-600">·</span>
                    <span className="text-xs text-gray-500">{comment.campaign.brandName}</span>
                  </div>
                  <a
                    href={comment.post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-white font-medium hover:text-blue-400 transition-colors"
                  >
                    {comment.post.title}
                  </a>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${statusColors[comment.status] || "bg-gray-800 text-gray-400"}`}>
                  {comment.status.replace(/_/g, " ")}
                </span>
              </div>

              {editingId === comment.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(comment.id)}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 text-xs font-medium text-gray-400 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-800/50 rounded-lg p-3 mb-3">
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">{comment.generatedText}</p>
                </div>
              )}

              {comment.status === "pending_review" && editingId !== comment.id && (
                <div className="flex gap-2">
                  <button
                    onClick={() => updateStatus(comment.id, "approved")}
                    className="px-3 py-1.5 text-xs font-medium text-green-400 bg-green-500/10 hover:bg-green-500/20 rounded-lg transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(comment.id);
                      setEditText(comment.generatedText);
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => updateStatus(comment.id, "rejected")}
                    className="px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    Reject
                  </button>
                </div>
              )}
              {comment.status === "approved" && (
                <button
                  onClick={() => updateStatus(comment.id, "ready_to_post")}
                  className="px-3 py-1.5 text-xs font-medium text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 rounded-lg transition-colors"
                >
                  Send to Extension
                </button>
              )}
              {comment.platformUrl && (
                <a
                  href={comment.platformUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  View posted comment
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
