import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { campaigns, discoveredPosts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { searchSubreddit, calculateRelevance } from "@/lib/reddit/discovery";

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (
    process.env.NODE_ENV === "production" &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allCampaigns = db
    .select()
    .from(campaigns)
    .where(eq(campaigns.status, "active"))
    .all();

  let totalDiscovered = 0;

  for (const campaign of allCampaigns) {
    const keywords = JSON.parse(campaign.keywords) as string[];
    const subreddits = JSON.parse(campaign.subreddits) as string[];

    for (const subreddit of subreddits) {
      for (const keyword of keywords) {
        try {
          const posts = await searchSubreddit(subreddit, keyword);

          for (const post of posts) {
            const relevance = calculateRelevance(post, keywords);
            if (relevance < 0.1) continue;

            // Check if already exists
            const existing = db
              .select()
              .from(discoveredPosts)
              .where(
                and(
                  eq(discoveredPosts.campaignId, campaign.id),
                  eq(discoveredPosts.platformPostId, post.id)
                )
              )
              .get();

            if (existing) {
              db.update(discoveredPosts)
                .set({ relevanceScore: relevance, updatedAt: new Date() })
                .where(eq(discoveredPosts.id, existing.id))
                .run();
            } else {
              db.insert(discoveredPosts)
                .values({
                  campaignId: campaign.id,
                  platform: "reddit",
                  platformPostId: post.id,
                  title: post.title,
                  body: post.selftext.slice(0, 2000),
                  url: `https://www.reddit.com${post.permalink}`,
                  subreddit: post.subreddit,
                  relevanceScore: relevance,
                  status: "new",
                })
                .run();
            }
            totalDiscovered++;
          }

          // Rate limit between requests
          await new Promise((r) => setTimeout(r, 1000));
        } catch (error) {
          console.error(`Error searching r/${subreddit} for "${keyword}":`, error);
        }
      }
    }
  }

  return NextResponse.json({
    ok: true,
    campaignsProcessed: allCampaigns.length,
    postsDiscovered: totalDiscovered,
  });
}
