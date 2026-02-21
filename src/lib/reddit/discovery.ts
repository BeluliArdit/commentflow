interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  url: string;
  permalink: string;
  subreddit: string;
  created_utc: number;
  num_comments: number;
  score: number;
}

interface RedditSearchResult {
  data: {
    children: Array<{
      data: RedditPost;
    }>;
  };
}

export async function searchSubreddit(
  subreddit: string,
  query: string,
  sort = "new",
  limit = 25
): Promise<RedditPost[]> {
  const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(
    query
  )}&restrict_sr=1&sort=${sort}&limit=${limit}&t=week`;

  const res = await fetch(url, {
    headers: { "User-Agent": "CommentFlow/1.0" },
  });

  if (!res.ok) {
    console.error(`Reddit search failed for r/${subreddit}: ${res.status}`);
    return [];
  }

  const data: RedditSearchResult = await res.json();
  return data.data.children.map((c) => c.data);
}

export async function searchReddit(
  query: string,
  sort = "new",
  limit = 25
): Promise<RedditPost[]> {
  const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(
    query
  )}&sort=${sort}&limit=${limit}&t=week`;

  const res = await fetch(url, {
    headers: { "User-Agent": "CommentFlow/1.0" },
  });

  if (!res.ok) {
    console.error(`Reddit search failed: ${res.status}`);
    return [];
  }

  const data: RedditSearchResult = await res.json();
  return data.data.children.map((c) => c.data);
}

export function calculateRelevance(
  post: RedditPost,
  keywords: string[]
): number {
  const text = `${post.title} ${post.selftext}`.toLowerCase();
  let score = 0;

  for (const keyword of keywords) {
    const kw = keyword.toLowerCase();
    // Title matches are worth more
    if (post.title.toLowerCase().includes(kw)) score += 3;
    if (post.selftext.toLowerCase().includes(kw)) score += 1;
  }

  // Bonus for question posts (high intent)
  if (
    post.title.includes("?") ||
    text.includes("looking for") ||
    text.includes("recommend") ||
    text.includes("suggestions") ||
    text.includes("help me") ||
    text.includes("what do you use") ||
    text.includes("best way to")
  ) {
    score += 2;
  }

  // Bonus for engagement
  if (post.num_comments > 5) score += 1;
  if (post.score > 10) score += 1;

  // Normalize to 0-1
  const maxPossible = keywords.length * 4 + 4;
  return Math.min(score / maxPossible, 1);
}
