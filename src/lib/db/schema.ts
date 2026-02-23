import { pgTable, text, integer, real, boolean, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  extensionToken: text("extension_token").unique(),
  stripeCustomerId: text("stripe_customer_id").unique(),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  stripePriceId: text("stripe_price_id"),
  subscriptionStatus: text("subscription_status").default("inactive"), // inactive | active | canceled | past_due
  subscriptionPlan: text("subscription_plan"), // extension | dfy
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const campaigns = pgTable("campaigns", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  brandName: text("brand_name").notNull(),
  productDescription: text("product_description").notNull(),
  keywords: text("keywords").notNull(), // JSON array
  subreddits: text("subreddits").notNull(), // JSON array
  tone: text("tone").notNull().default("helpful"),
  maxCommentsPerDay: integer("max_comments_per_day").notNull().default(5),
  autoApprove: boolean("auto_approve").notNull().default(false),
  status: text("status").notNull().default("active"), // active | paused
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const discoveredPosts = pgTable("discovered_posts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  campaignId: text("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(), // reddit | youtube
  platformPostId: text("platform_post_id").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  url: text("url").notNull(),
  subreddit: text("subreddit"),
  relevanceScore: real("relevance_score").notNull().default(0),
  status: text("status").notNull().default("new"), // new | queued | commented | skipped
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  uniqueIndex("campaign_post_unique").on(table.campaignId, table.platformPostId),
]);

export const comments = pgTable("comments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  campaignId: text("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  postId: text("post_id").notNull().references(() => discoveredPosts.id, { onDelete: "cascade" }),
  generatedText: text("generated_text").notNull(),
  status: text("status").notNull().default("pending_review"),
  postedAt: timestamp("posted_at"),
  platformUrl: text("platform_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
