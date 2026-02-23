import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { campaigns, discoveredPosts, comments } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { requireSession } from "@/lib/session";
import { getUserSubscription, getPlanLimits } from "@/lib/subscription";

const campaignSchema = z.object({
  brandName: z.string().min(1),
  productDescription: z.string().min(1),
  keywords: z.array(z.string()).min(1),
  subreddits: z.array(z.string()).default([]),
  tone: z.string().default("helpful"),
  maxCommentsPerDay: z.number().int().min(1).max(50).default(5),
  autoApprove: z.boolean().default(false),
});

export async function GET() {
  try {
    const session = await requireSession();
    const rows = await db.select().from(campaigns).where(eq(campaigns.userId, session.user.id));

    const result = await Promise.all(
      rows.map(async (c) => {
        const [postCount] = await db
          .select({ count: count() })
          .from(discoveredPosts)
          .where(eq(discoveredPosts.campaignId, c.id));
        const [commentCount] = await db
          .select({ count: count() })
          .from(comments)
          .where(eq(comments.campaignId, c.id));

        return { ...c, _count: { discoveredPosts: postCount?.count ?? 0, comments: commentCount?.count ?? 0 } };
      })
    );

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession();

    // Check subscription
    const sub = await getUserSubscription(session.user.id);
    if (!sub.isActive) {
      return NextResponse.json(
        { error: "Active subscription required. Please subscribe to create campaigns." },
        { status: 403 }
      );
    }

    // Check campaign limit
    const limits = getPlanLimits(sub.plan);
    const [existing] = await db
      .select({ count: count() })
      .from(campaigns)
      .where(eq(campaigns.userId, session.user.id));
    if ((existing?.count ?? 0) >= limits.maxCampaigns) {
      return NextResponse.json(
        { error: `Your ${sub.plan} plan allows up to ${limits.maxCampaigns} campaigns. Upgrade for more.` },
        { status: 403 }
      );
    }

    const body = await req.json();
    const data = campaignSchema.parse(body);

    const [campaign] = await db
      .insert(campaigns)
      .values({
        userId: session.user.id,
        brandName: data.brandName,
        productDescription: data.productDescription,
        keywords: JSON.stringify(data.keywords),
        subreddits: JSON.stringify(data.subreddits),
        tone: data.tone,
        maxCommentsPerDay: data.maxCommentsPerDay,
        autoApprove: data.autoApprove,
      })
      .returning();

    return NextResponse.json(campaign);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}
