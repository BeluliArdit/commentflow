import Stripe from "stripe";

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    typescript: true,
  });
}

// Lazy singleton
let _stripe: Stripe | null = null;
export function stripe() {
  if (!_stripe) _stripe = getStripe();
  return _stripe;
}

export const PLANS = {
  extension: {
    name: "Extension",
    priceId: process.env.STRIPE_EXTENSION_PRICE_ID!,
    price: 20,
    features: [
      "3 campaigns",
      "150 comments/month",
      "Reddit & YouTube discovery",
      "AI comment generation",
      "Chrome extension auto-poster",
      "Manual & auto-approve",
      "Email support",
    ],
  },
  dfy: {
    name: "Done-For-You",
    priceId: process.env.STRIPE_DFY_PRICE_ID!,
    price: 99,
    features: [
      "Unlimited campaigns",
      "1,000 comments/month",
      "Reddit & YouTube discovery",
      "AI comment generation",
      "Chrome extension auto-poster",
      "Auto-approve mode",
      "Campaign setup by our team",
      "Dedicated account manager",
      "Priority support",
    ],
  },
} as const;

export type PlanKey = keyof typeof PLANS;
