import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { discoveredPosts, campaigns, comments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateComment } from "@/lib/ai/generate";
import { requireSession } from "@/lib/session";
import { getUserSubscription } from "@/lib/subscription";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSession();

    // Check subscription
    const sub = await getUserSubscription(session.user.id);
    if (!sub.isActive) {
      return NextResponse.json(
        { error: "Active subscription required to generate comments." },
        { status: 403 }
      );
    }

    const [post] = await db
      .select()
      .from(discoveredPosts)
      .where(eq(discoveredPosts.id, params.id));

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, post.campaignId));

    if (!campaign || campaign.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not set in .env" },
        { status: 500 }
      );
    }

    // Queue the post
    await db.update(discoveredPosts)
      .set({ status: "queued", updatedAt: new Date() })
      .where(eq(discoveredPosts.id, post.id));

    // Generate comment
    const commentText = await generateComment({
      postTitle: post.title,
      postBody: post.body,
      platform: post.platform,
      subreddit: post.subreddit ?? undefined,
      brandName: campaign.brandName,
      productDescription: campaign.productDescription,
      tone: campaign.tone,
    });

    if (!commentText) {
      return NextResponse.json({ error: "AI returned empty comment" }, { status: 500 });
    }

    const status = campaign.autoApprove ? "ready_to_post" : "pending_review";

    const [comment] = await db
      .insert(comments)
      .values({
        userId: session.user.id,
        campaignId: post.campaignId,
        postId: post.id,
        generatedText: commentText,
        status,
      })
      .returning();

    await db.update(discoveredPosts)
      .set({ status: "commented", updatedAt: new Date() })
      .where(eq(discoveredPosts.id, post.id));

    return NextResponse.json({ ok: true, comment });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Generate error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
