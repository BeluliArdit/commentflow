"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface Stats {
  campaigns: number;
  discoveredPosts: number;
  pendingComments: number;
  postedComments: number;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats>({
    campaigns: 0,
    discoveredPosts: 0,
    pendingComments: 0,
    postedComments: 0,
  });

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">
        Welcome back{session?.user?.name ? `, ${session.user.name}` : ""}
      </h1>
      <p className="text-gray-400 mb-8">Here&apos;s what&apos;s happening with your campaigns.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Active Campaigns", value: stats.campaigns, color: "blue" },
          { label: "Discovered Posts", value: stats.discoveredPosts, color: "purple" },
          { label: "Pending Comments", value: stats.pendingComments, color: "yellow" },
          { label: "Posted Comments", value: stats.postedComments, color: "green" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-gray-900 border border-gray-800 rounded-xl p-6"
          >
            <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
            <p className="text-3xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
