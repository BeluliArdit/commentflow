import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { discoveredPosts, campaigns } from "@/lib/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { requireSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await requireSession();

    const userCampaigns = db
      .select({ id: campaigns.id, brandName: campaigns.brandName })
      .from(campaigns)
      .where(eq(campaigns.userId, session.user.id))
      .all();

    if (userCampaigns.length === 0) {
      return NextResponse.json([]);
    }

    const campaignMap = Object.fromEntries(userCampaigns.map((c) => [c.id, c]));
    const campaignIds = userCampaigns.map((c) => c.id);

    const posts = db
      .select()
      .from(discoveredPosts)
      .where(inArray(discoveredPosts.campaignId, campaignIds))
      .orderBy(desc(discoveredPosts.relevanceScore), desc(discoveredPosts.createdAt))
      .limit(100)
      .all();

    const result = posts.map((p) => ({
      ...p,
      campaign: { brandName: campaignMap[p.campaignId]?.brandName ?? "" },
    }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
