import { NextRequest, NextResponse } from "next/server";
import { stripe as getStripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.subscription && session.customer) {
        const subscription = await getStripe().subscriptions.retrieve(
          session.subscription as string
        );
        const priceId = subscription.items.data[0]?.price.id;
        const plan = subscription.metadata.plan || determinePlan(priceId);

        await db
          .update(users)
          .set({
            stripeSubscriptionId: subscription.id,
            stripePriceId: priceId,
            subscriptionStatus: "active",
            subscriptionPlan: plan,
            updatedAt: new Date(),
          })
          .where(eq(users.stripeCustomerId, session.customer as string));
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const priceId = subscription.items.data[0]?.price.id;
      const status = mapSubscriptionStatus(subscription.status);
      const plan = subscription.metadata.plan || determinePlan(priceId);

      await db
        .update(users)
        .set({
          stripePriceId: priceId,
          subscriptionStatus: status,
          subscriptionPlan: plan,
          updatedAt: new Date(),
        })
        .where(eq(users.stripeSubscriptionId, subscription.id));
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await db
        .update(users)
        .set({
          subscriptionStatus: "canceled",
          subscriptionPlan: null,
          updatedAt: new Date(),
        })
        .where(eq(users.stripeSubscriptionId, subscription.id));
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const subId = (invoice as any).subscription as string | null;
      if (subId) {
        await db
          .update(users)
          .set({
            subscriptionStatus: "past_due",
            updatedAt: new Date(),
          })
          .where(eq(users.stripeSubscriptionId, subId));
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}

function mapSubscriptionStatus(status: Stripe.Subscription.Status): string {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
    case "unpaid":
      return "canceled";
    default:
      return "inactive";
  }
}

function determinePlan(priceId: string): string {
  if (priceId === process.env.STRIPE_EXTENSION_PRICE_ID) return "extension";
  if (priceId === process.env.STRIPE_DFY_PRICE_ID) return "dfy";
  return "extension";
}
