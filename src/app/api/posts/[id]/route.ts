import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { discoveredPosts, campaigns } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireSession } from "@/lib/session";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    const body = await req.json();

    // Verify ownership via campaign
    const [post] = await db.select().from(discoveredPosts).where(eq(discoveredPosts.id, params.id));
    if (!post) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(and(eq(campaigns.id, post.campaignId), eq(campaigns.userId, session.user.id)));

    if (!campaign) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const [updated] = await db
      .update(discoveredPosts)
      .set({ status: body.status, updatedAt: new Date() })
      .where(eq(discoveredPosts.id, params.id))
      .returning();

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}
