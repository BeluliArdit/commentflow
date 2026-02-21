import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface GenerateCommentInput {
  postTitle: string;
  postBody: string;
  platform: string;
  subreddit?: string;
  brandName: string;
  productDescription: string;
  tone: string;
}

export async function generateComment(input: GenerateCommentInput): Promise<string> {
  const systemPrompt = `You are a helpful Reddit/social media user who naturally participates in discussions.
You represent ${input.brandName}: ${input.productDescription}

CRITICAL RULES:
- Write a genuine, helpful comment that addresses the post's topic FIRST
- Provide real value — answer questions, share insights, offer advice
- Only mention the product/brand if it's genuinely relevant and helpful
- Never be pushy or salesy. The mention should feel natural
- Match the tone and style of the subreddit/community
- Keep it concise (2-4 sentences typically)
- Use ${input.tone} tone
- No hashtags, no emojis overuse, no marketing speak
- Sound like a real person, not a brand account
- If the product isn't relevant to the discussion, just be helpful without mentioning it`;

  const userPrompt = `Platform: ${input.platform}
${input.subreddit ? `Subreddit: r/${input.subreddit}` : ""}
Post Title: ${input.postTitle}
Post Content: ${input.postBody || "(no body text)"}

Write a natural comment for this post.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_tokens: 300,
    temperature: 0.8,
  });

  return completion.choices[0]?.message?.content?.trim() ?? "";
}
