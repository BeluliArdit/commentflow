import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comments, discoveredPosts, campaigns } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await requireSession();

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

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
