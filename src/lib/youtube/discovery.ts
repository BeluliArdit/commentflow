interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  publishedAt: string;
  url: string;
}

interface YouTubeSearchResponse {
  items?: Array<{
    id: { videoId: string };
    snippet: {
      title: string;
      description: string;
      channelTitle: string;
      publishedAt: string;
    };
  }>;
  error?: { message: string };
}

export async function searchYouTube(
  query: string,
  maxResults = 15
): Promise<YouTubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return [];

  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
    query
  )}&type=video&order=relevance&maxResults=${maxResults}&key=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    console.error(`YouTube search failed: ${res.status}`, body);
    return [];
  }

  const data: YouTubeSearchResponse = await res.json();
  if (data.error) {
    console.error(`YouTube API error: ${data.error.message}`);
    return [];
  }

  console.log(`[YouTube] API returned ${data.items?.length ?? 0} results`);

  return (data.items || []).map((item) => ({
    id: item.id.videoId,
    title: item.snippet.title,
    description: item.snippet.description,
    channelTitle: item.snippet.channelTitle,
    publishedAt: item.snippet.publishedAt,
    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
  }));
}

export function calculateYouTubeRelevance(
  video: YouTubeVideo,
  keywords: string[]
): number {
  const text = `${video.title} ${video.description}`.toLowerCase();
  let score = 0;

  for (const keyword of keywords) {
    const kw = keyword.toLowerCase();
    if (video.title.toLowerCase().includes(kw)) score += 3;
    if (video.description.toLowerCase().includes(kw)) score += 1;
  }

  // Bonus for question/recommendation videos
  if (
    text.includes("?") ||
    text.includes("best") ||
    text.includes("top") ||
    text.includes("review") ||
    text.includes("vs") ||
    text.includes("how to") ||
    text.includes("which")
  ) {
    score += 2;
  }

  const maxPossible = keywords.length * 4 + 2;
  return Math.min(score / maxPossible, 1);
}

function getThirtyDaysAgo(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString();
}
