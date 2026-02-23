import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { users, comments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { rateLimit } from "@/lib/rate-limit";

const reportSchema = z.object({
  commentId: z.string(),
  success: z.boolean(),
  platformUrl: z.string().optional(),
  error: z.string().optional(),
});

export async function POST(req: Request) {
  const token = req.headers.get("x-extension-token");
  if (!token) {
    return NextResponse.json({ error: "No token" }, { status: 401 });
  }

  const { success: allowed } = rateLimit(`ext:${token}`, 30, 60 * 1000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const [user] = await db.select().from(users).where(eq(users.extensionToken, token));
  if (!user) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { commentId, success, platformUrl } = reportSchema.parse(body);

    const [comment] = await db
      .select()
      .from(comments)
      .where(and(eq(comments.id, commentId), eq(comments.userId, user.id)));

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    await db.update(comments)
      .set({
        status: success ? "posted" : "failed",
        postedAt: success ? new Date() : null,
        platformUrl: platformUrl ?? null,
        updatedAt: new Date(),
      })
      .where(eq(comments.id, commentId));

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
