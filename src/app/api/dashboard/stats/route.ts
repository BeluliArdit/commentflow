import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { campaigns, discoveredPosts, comments } from "@/lib/db/schema";
import { eq, and, inArray, count } from "drizzle-orm";
import { requireSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await requireSession();
    const userId = session.user.id;

    const [campaignCount] = await db
      .select({ count: count() })
      .from(campaigns)
      .where(and(eq(campaigns.userId, userId), eq(campaigns.status, "active")));

    const userCampaignIds = (
      await db
        .select({ id: campaigns.id })
        .from(campaigns)
        .where(eq(campaigns.userId, userId))
    ).map((c) => c.id);

    let postCount = 0;

    if (userCampaignIds.length > 0) {
      const [pc] = await db
        .select({ count: count() })
        .from(discoveredPosts)
        .where(inArray(discoveredPosts.campaignId, userCampaignIds));
      postCount = pc?.count ?? 0;
    }

    const [pendingCount] = await db
      .select({ count: count() })
      .from(comments)
      .where(
        and(
          eq(comments.userId, userId),
          inArray(comments.status, ["pending_review", "approved", "ready_to_post"])
        )
      );

    const [postedCount] = await db
      .select({ count: count() })
      .from(comments)
      .where(and(eq(comments.userId, userId), eq(comments.status, "posted")));

    return NextResponse.json({
      campaigns: campaignCount?.count ?? 0,
      discoveredPosts: postCount,
      pendingComments: pendingCount?.count ?? 0,
      postedComments: postedCount?.count ?? 0,
    });
  } catch {
    return NextResponse.json({
      campaigns: 0,
      discoveredPosts: 0,
      pendingComments: 0,
      postedComments: 0,
    });
  }
}
