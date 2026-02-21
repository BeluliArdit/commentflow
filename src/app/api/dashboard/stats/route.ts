import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { campaigns, discoveredPosts, comments } from "@/lib/db/schema";
import { eq, and, inArray, count } from "drizzle-orm";
import { requireSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await requireSession();
    const userId = session.user.id;

    const campaignCount = db
      .select({ count: count() })
      .from(campaigns)
      .where(and(eq(campaigns.userId, userId), eq(campaigns.status, "active")))
      .get()?.count ?? 0;

    const userCampaignIds = db
      .select({ id: campaigns.id })
      .from(campaigns)
      .where(eq(campaigns.userId, userId))
      .all()
      .map((c) => c.id);

    let postCount = 0;
    let pendingCount = 0;
    let postedCount = 0;

    if (userCampaignIds.length > 0) {
      postCount = db
        .select({ count: count() })
        .from(discoveredPosts)
        .where(inArray(discoveredPosts.campaignId, userCampaignIds))
        .get()?.count ?? 0;
    }

    pendingCount = db
      .select({ count: count() })
      .from(comments)
      .where(
        and(
          eq(comments.userId, userId),
          inArray(comments.status, ["pending_review", "approved", "ready_to_post"])
        )
      )
      .get()?.count ?? 0;

    postedCount = db
      .select({ count: count() })
      .from(comments)
      .where(and(eq(comments.userId, userId), eq(comments.status, "posted")))
      .get()?.count ?? 0;

    return NextResponse.json({
      campaigns: campaignCount,
      discoveredPosts: postCount,
      pendingComments: pendingCount,
      postedComments: postedCount,
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
