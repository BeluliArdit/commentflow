import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { campaigns, discoveredPosts, comments } from "@/lib/db/schema";
import { eq, and, count } from "drizzle-orm";
import { requireSession } from "@/lib/session";

const updateSchema = z.object({
  brandName: z.string().min(1).optional(),
  productDescription: z.string().min(1).optional(),
  keywords: z.array(z.string()).min(1).optional(),
  subreddits: z.array(z.string()).min(1).optional(),
  tone: z.string().optional(),
  maxCommentsPerDay: z.number().int().min(1).max(50).optional(),
  autoApprove: z.boolean().optional(),
  status: z.enum(["active", "paused"]).optional(),
});

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(and(eq(campaigns.id, params.id), eq(campaigns.userId, session.user.id)));

    if (!campaign) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const [postCount] = await db.select({ count: count() }).from(discoveredPosts).where(eq(discoveredPosts.campaignId, campaign.id));
    const [commentCount] = await db.select({ count: count() }).from(comments).where(eq(comments.campaignId, campaign.id));

    return NextResponse.json({ ...campaign, _count: { discoveredPosts: postCount?.count ?? 0, comments: commentCount?.count ?? 0 } });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const data = updateSchema.parse(body);

    const [existing] = await db
      .select()
      .from(campaigns)
      .where(and(eq(campaigns.id, params.id), eq(campaigns.userId, session.user.id)));

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (data.brandName !== undefined) updateData.brandName = data.brandName;
    if (data.productDescription !== undefined) updateData.productDescription = data.productDescription;
    if (data.keywords !== undefined) updateData.keywords = JSON.stringify(data.keywords);
    if (data.subreddits !== undefined) updateData.subreddits = JSON.stringify(data.subreddits);
    if (data.tone !== undefined) updateData.tone = data.tone;
    if (data.maxCommentsPerDay !== undefined) updateData.maxCommentsPerDay = data.maxCommentsPerDay;
    if (data.autoApprove !== undefined) updateData.autoApprove = data.autoApprove;
    if (data.status !== undefined) updateData.status = data.status;

    const [campaign] = await db
      .update(campaigns)
      .set(updateData)
      .where(eq(campaigns.id, params.id))
      .returning();

    return NextResponse.json(campaign);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update campaign" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();

    const [existing] = await db
      .select()
      .from(campaigns)
      .where(and(eq(campaigns.id, params.id), eq(campaigns.userId, session.user.id)));

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await db.delete(campaigns).where(eq(campaigns.id, params.id));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete campaign" }, { status: 500 });
  }
}
