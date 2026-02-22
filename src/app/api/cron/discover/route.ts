import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { campaigns, discoveredPosts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { searchSubreddit, searchReddit, calculateRelevance } from "@/lib/reddit/discovery";
import { searchYouTube, calculateYouTubeRelevance } from "@/lib/youtube/discovery";

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

    // --- Reddit: Subreddit-specific search ---
    for (const subreddit of subreddits) {
      for (const keyword of keywords) {
        try {
          const posts = await searchSubreddit(subreddit, keyword);
          totalDiscovered += upsertRedditPosts(posts, campaign.id, keywords);
          await new Promise((r) => setTimeout(r, 1500));
        } catch (error) {
          console.error(`Error searching r/${subreddit} for "${keyword}":`, error);
        }
      }
    }

    // --- Reddit: Global search ---
    try {
      const globalQuery = keywords.join(" OR ");
      const posts = await searchReddit(globalQuery);
      totalDiscovered += upsertRedditPosts(posts, campaign.id, keywords);
      await new Promise((r) => setTimeout(r, 1500));
    } catch (error) {
      console.error(`Error in global Reddit search for campaign ${campaign.id}:`, error);
    }

    // --- YouTube search ---
    console.log(`[YouTube] API key present: ${!!process.env.YOUTUBE_API_KEY}`);
    if (process.env.YOUTUBE_API_KEY) {
      try {
        const uniqueKeywords = [...new Set(keywords.map(k => k.toLowerCase()))];
        const ytQuery = uniqueKeywords.join(" ");
        console.log(`[YouTube] Searching for: "${ytQuery}"`);
        const videos = await searchYouTube(ytQuery);
        console.log(`[YouTube] Found ${videos.length} videos`);
        for (const video of videos) {
          const relevance = calculateYouTubeRelevance(video, keywords);
          if (relevance < 0.1) continue;

          const existing = db
            .select()
            .from(discoveredPosts)
            .where(
              and(
                eq(discoveredPosts.campaignId, campaign.id),
                eq(discoveredPosts.platformPostId, video.id)
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
                platform: "youtube",
                platformPostId: video.id,
                title: video.title,
                body: video.description.slice(0, 2000),
                url: video.url,
                subreddit: null,
                relevanceScore: relevance,
                status: "new",
              })
              .run();
          }
          totalDiscovered++;
        }
      } catch (error) {
        console.error(`Error in YouTube search for campaign ${campaign.id}:`, error);
      }
    }
  }

  return NextResponse.json({
    ok: true,
    campaignsProcessed: allCampaigns.length,
    postsDiscovered: totalDiscovered,
  });
}

function upsertRedditPosts(
  posts: Awaited<ReturnType<typeof searchReddit>>,
  campaignId: string,
  keywords: string[]
): number {
  let count = 0;
  for (const post of posts) {
    const relevance = calculateRelevance(post, keywords);
    if (relevance < 0.1) continue;

    const existing = db
      .select()
      .from(discoveredPosts)
      .where(
        and(
          eq(discoveredPosts.campaignId, campaignId),
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
          campaignId,
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
    count++;
  }
  return count;
}
