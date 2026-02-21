"use client";

import CampaignForm from "@/components/CampaignForm";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function EditCampaignPage() {
  const params = useParams();
  const [campaign, setCampaign] = useState<null | {
    id: string;
    brandName: string;
    productDescription: string;
    keywords: string;
    subreddits: string;
    tone: string;
    maxCommentsPerDay: number;
    autoApprove: boolean;
  }>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/campaigns/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setCampaign(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="text-gray-400">Loading...</div>;
  if (!campaign) return <div className="text-red-400">Campaign not found</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Edit Campaign</h1>
      <CampaignForm initialData={campaign} />
    </div>
  );
}
