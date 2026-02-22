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

  if (loading) return <div className="text-th-text-secondary text-sm">Loading...</div>;
  if (!campaign) return <div className="text-red-400 text-sm">Campaign not found</div>;

  return (
    <div>
      <h1 className="text-lg font-semibold text-th-text mb-5">Edit Campaign</h1>
      <CampaignForm initialData={campaign} />
    </div>
  );
}
