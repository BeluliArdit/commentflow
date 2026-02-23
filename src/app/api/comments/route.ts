import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comments, discoveredPosts, campaigns } from "@/lib/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { requireSession } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = await req.json();

    if (!body.postId || !body.generatedText) {
      return NextResponse.json({ error: "postId and generatedText required" }, { status: 400 });
    }

    const [post] = await db.select().from(discoveredPosts).where(eq(discoveredPosts.id, body.postId));
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const [inserted] = await db
      .insert(comments)
      .values({
        userId: session.user.id,
        campaignId: post.campaignId,
        postId: post.id,
        generatedText: body.generatedText,
        status: body.status || "pending_review",
      })
      .returning();

    await db.update(discoveredPosts)
      .set({ status: "commented", updatedAt: new Date() })
      .where(eq(discoveredPosts.id, post.id));

    return NextResponse.json(inserted);
  } catch {
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await requireSession();

    // Get existing generated comments
    const rows = await db
      .select()
      .from(comments)
      .where(eq(comments.userId, session.user.id))
      .orderBy(desc(comments.createdAt))
      .limit(100);

    const result = await Promise.all(
      rows.map(async (c) => {
        const [post] = await db.select().from(discoveredPosts).where(eq(discoveredPosts.id, c.postId));
        const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, c.campaignId));
        return {
          ...c,
          post: post
            ? { title: post.title, url: post.url, subreddit: post.subreddit, platform: post.platform }
            : { title: "", url: "", subreddit: null, platform: "" },
          campaign: { brandName: campaign?.brandName ?? "" },
        };
      })
    );

    // Get queued posts that don't have comments yet
    const userCampaigns = await db
      .select({ id: campaigns.id, brandName: campaigns.brandName })
      .from(campaigns)
      .where(eq(campaigns.userId, session.user.id));

    if (userCampaigns.length > 0) {
      const campaignIds = userCampaigns.map((c) => c.id);
      const campaignMap = Object.fromEntries(userCampaigns.map((c) => [c.id, c]));

      const allPosts = await db
        .select()
        .from(discoveredPosts)
        .where(inArray(discoveredPosts.campaignId, campaignIds));

      const queuedPosts = allPosts.filter((p) => p.status === "queued");

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
