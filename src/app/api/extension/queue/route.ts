import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, comments, discoveredPosts } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { rateLimit } from "@/lib/rate-limit";
import { getUserSubscription } from "@/lib/subscription";

export async function GET(req: Request) {
  const token = req.headers.get("x-extension-token");
  if (!token) {
    return NextResponse.json({ error: "No token" }, { status: 401 });
  }

  const { success } = rateLimit(`ext:${token}`, 30, 60 * 1000);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const [user] = await db.select().from(users).where(eq(users.extensionToken, token));
  if (!user) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // Check subscription
  const sub = await getUserSubscription(user.id);
  if (!sub.isActive) {
    return NextResponse.json({ error: "Active subscription required" }, { status: 403 });
  }

  const allReady = await db
    .select()
    .from(comments)
    .where(eq(comments.status, "ready_to_post"))
    .orderBy(comments.createdAt)
    .limit(5);

  const readyComments = allReady.filter((c) => c.userId === user.id);

  // Mark as posting
  if (readyComments.length > 0) {
    await db.update(comments)
      .set({ status: "posting", updatedAt: new Date() })
      .where(inArray(comments.id, readyComments.map((c) => c.id)));
  }

  const result = await Promise.all(
    readyComments.map(async (c) => {
      const [post] = await db.select().from(discoveredPosts).where(eq(discoveredPosts.id, c.postId));
      return {
        id: c.id,
        text: c.generatedText,
        url: post?.url ?? "",
        platform: post?.platform ?? "",
        postTitle: post?.title ?? "",
        subreddit: post?.subreddit ?? null,
      };
    })
  );

  return NextResponse.json({ comments: result });
}
