import { sqliteTable, text, integer, real, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  extensionToken: text("extension_token").unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const campaigns = sqliteTable("campaigns", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  brandName: text("brand_name").notNull(),
  productDescription: text("product_description").notNull(),
  keywords: text("keywords").notNull(), // JSON array
  subreddits: text("subreddits").notNull(), // JSON array
  tone: text("tone").notNull().default("helpful"),
  maxCommentsPerDay: integer("max_comments_per_day").notNull().default(5),
  autoApprove: integer("auto_approve", { mode: "boolean" }).notNull().default(false),
  status: text("status").notNull().default("active"), // active | paused
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const discoveredPosts = sqliteTable("discovered_posts", {
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
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
}, (table) => [
  uniqueIndex("campaign_post_unique").on(table.campaignId, table.platformPostId),
]);

export const comments = sqliteTable("comments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  campaignId: text("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  postId: text("post_id").notNull().references(() => discoveredPosts.id, { onDelete: "cascade" }),
  generatedText: text("generated_text").notNull(),
  status: text("status").notNull().default("pending_review"),
  postedAt: integer("posted_at", { mode: "timestamp" }),
  platformUrl: text("platform_url"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});
