import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comments, discoveredPosts, campaigns } from "@/lib/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { requireSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await requireSession();

    // Get existing generated comments
    const rows = db
      .select()
      .from(comments)
      .where(eq(comments.userId, session.user.id))
      .orderBy(desc(comments.createdAt))
      .limit(100)
      .all();

    const result = rows.map((c) => {
      const post = db.select().from(discoveredPosts).where(eq(discoveredPosts.id, c.postId)).get();
      const campaign = db.select().from(campaigns).where(eq(campaigns.id, c.campaignId)).get();
      return {
        ...c,
        post: post
          ? { title: post.title, url: post.url, subreddit: post.subreddit, platform: post.platform }
          : { title: "", url: "", subreddit: null, platform: "" },
        campaign: { brandName: campaign?.brandName ?? "" },
      };
    });

    // Get queued posts that don't have comments yet
    const userCampaigns = db
      .select({ id: campaigns.id, brandName: campaigns.brandName })
      .from(campaigns)
      .where(eq(campaigns.userId, session.user.id))
      .all();

    if (userCampaigns.length > 0) {
      const campaignIds = userCampaigns.map((c) => c.id);
      const campaignMap = Object.fromEntries(userCampaigns.map((c) => [c.id, c]));

      const queuedPosts = db
        .select()
        .from(discoveredPosts)
        .where(inArray(discoveredPosts.campaignId, campaignIds))
        .all()
        .filter((p) => p.status === "queued");

      // Only include queued posts that don't already have a comment
      const postIdsWithComments = new Set(rows.map((c) => c.postId));

      for (const p of queuedPosts) {
        if (postIdsWithComments.has(p.id)) continue;
        result.push({
          id: `queued-${p.id}`,
          userId: session.user.id,
          campaignId: p.campaignId,
          postId: p.id,
          generatedText: "",
          status: "queued",
          postedAt: null,
          platformUrl: null,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          post: { title: p.title, url: p.url, subreddit: p.subreddit, platform: p.platform },
          campaign: { brandName: campaignMap[p.campaignId]?.brandName ?? "" },
        } as typeof result[number]);
      }
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
