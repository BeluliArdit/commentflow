import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { discoveredPosts, campaigns, comments } from "@/lib/db/schema";
import { eq, and, gte, count } from "drizzle-orm";
import { generateComment } from "@/lib/ai/generate";

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (
    process.env.NODE_ENV === "production" &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not set. Add it to your .env file." },
      { status: 500 }
    );
  }

  // Get queued posts that don't have comments yet
  const posts = db
    .select()
    .from(discoveredPosts)
    .where(eq(discoveredPosts.status, "queued"))
    .orderBy(discoveredPosts.relevanceScore)
    .limit(20)
    .all();

  if (posts.length === 0) {
    return NextResponse.json({
      ok: true,
      generated: 0,
      message: "No queued posts found. Queue some posts from the Discovered Posts page first.",
    });
  }

  // Filter out posts that already have comments
  const postsToProcess = posts.filter((p) => {
    const existing = db
      .select({ count: count() })
      .from(comments)
      .where(eq(comments.postId, p.id))
      .get();
    return (existing?.count ?? 0) === 0;
  });

  if (postsToProcess.length === 0) {
    return NextResponse.json({
      ok: true,
      generated: 0,
      message: "All queued posts already have comments generated.",
    });
  }

  let generated = 0;
  const errors: string[] = [];

  for (const post of postsToProcess) {
    try {
      const campaign = db.select().from(campaigns).where(eq(campaigns.id, post.campaignId)).get();
      if (!campaign) continue;

      // Check daily limit
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayCount = db
        .select({ count: count() })
        .from(comments)
        .where(
          and(eq(comments.campaignId, post.campaignId), gte(comments.createdAt, today))
        )
        .get()?.count ?? 0;

      if (todayCount >= campaign.maxCommentsPerDay) continue;

      const commentText = await generateComment({
        postTitle: post.title,
        postBody: post.body,
        platform: post.platform,
        subreddit: post.subreddit ?? undefined,
        brandName: campaign.brandName,
        productDescription: campaign.productDescription,
        tone: campaign.tone,
      });

      if (!commentText) continue;

      const status = campaign.autoApprove ? "ready_to_post" : "pending_review";

      db.insert(comments)
        .values({
          userId: campaign.userId,
          campaignId: post.campaignId,
          postId: post.id,
          generatedText: commentText,
          status,
        })
        .run();

      db.update(discoveredPosts)
        .set({ status: "commented", updatedAt: new Date() })
        .where(eq(discoveredPosts.id, post.id))
        .run();

      generated++;
      await new Promise((r) => setTimeout(r, 500));
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`Error generating comment for post ${post.id}:`, msg);
      errors.push(msg);
    }
  }

  if (generated === 0 && errors.length > 0) {
    return NextResponse.json(
      { error: `Generation failed: ${errors[0]}`, generated: 0 },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, generated });
}
