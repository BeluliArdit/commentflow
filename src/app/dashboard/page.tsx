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

  const statItems = [
    { label: "Active Campaigns", value: stats.campaigns },
    { label: "Discovered Posts", value: stats.discoveredPosts },
    { label: "Pending Comments", value: stats.pendingComments },
    { label: "Posted Comments", value: stats.postedComments },
  ];

  return (
    <div>
      <h1 className="text-lg font-semibold text-th-text mb-1">
        Welcome back{session?.user?.name ? `, ${session.user.name}` : ""}
      </h1>
      <p className="text-sm text-th-text-secondary mb-6">Here&apos;s what&apos;s happening with your campaigns.</p>

      <div className="bg-th-card border border-th-border rounded-lg flex divide-x divide-th-divider">
        {statItems.map((stat) => (
          <div key={stat.label} className="flex-1 px-6 py-5">
            <p className="text-xs uppercase tracking-wide text-th-text-muted mb-1">{stat.label}</p>
            <p className="text-2xl font-semibold text-th-text">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
