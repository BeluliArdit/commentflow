import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, comments, discoveredPosts } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";

export async function GET(req: Request) {
  const token = req.headers.get("x-extension-token");
  if (!token) {
    return NextResponse.json({ error: "No token" }, { status: 401 });
  }

  const user = db.select().from(users).where(eq(users.extensionToken, token)).get();
  if (!user) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const readyComments = db
    .select()
    .from(comments)
    .where(eq(comments.status, "ready_to_post"))
    .orderBy(comments.createdAt)
    .limit(5)
    .all()
    .filter((c) => c.userId === user.id);

  // Mark as posting
  if (readyComments.length > 0) {
    db.update(comments)
      .set({ status: "posting", updatedAt: new Date() })
      .where(inArray(comments.id, readyComments.map((c) => c.id)))
      .run();
  }

  const result = readyComments.map((c) => {
    const post = db.select().from(discoveredPosts).where(eq(discoveredPosts.id, c.postId)).get();
    return {
      id: c.id,
      text: c.generatedText,
      url: post?.url ?? "",
      platform: post?.platform ?? "",
      postTitle: post?.title ?? "",
      subreddit: post?.subreddit ?? null,
    };
  });

  return NextResponse.json({ comments: result });
}
