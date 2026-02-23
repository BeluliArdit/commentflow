import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";

export type SubscriptionInfo = {
  isActive: boolean;
  plan: string | null;
  status: string;
};

export async function getUserSubscription(userId: string): Promise<SubscriptionInfo> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) {
    return { isActive: false, plan: null, status: "inactive" };
  }

  return {
    isActive: user.subscriptionStatus === "active",
    plan: user.subscriptionPlan,
    status: user.subscriptionStatus || "inactive",
  };
}

export function getPlanLimits(plan: string | null) {
  switch (plan) {
    case "dfy":
      return { maxCampaigns: Infinity, maxCommentsPerMonth: 1000 };
    case "extension":
      return { maxCampaigns: 3, maxCommentsPerMonth: 150 };
    default:
      return { maxCampaigns: 0, maxCommentsPerMonth: 0 };
  }
}
