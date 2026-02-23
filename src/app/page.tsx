"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

function CountdownTimer() {
  const [time, setTime] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    // Set target to next Sunday
    function getNextSunday() {
      const now = new Date();
      const target = new Date(now);
      target.setDate(now.getDate() + (7 - now.getDay()));
      target.setHours(23, 59, 59, 0);
      return target;
    }

    const target = getNextSunday();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = target.getTime() - now;
      if (diff <= 0) return;
      setTime({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        mins: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        secs: Math.floor((diff % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center gap-3">
      {[
        { val: time.days, label: "Days" },
        { val: time.hours, label: "Hours" },
        { val: time.mins, label: "Min" },
        { val: time.secs, label: "Sec" },
      ].map((t) => (
        <div key={t.label} className="flex flex-col items-center">
          <div className="w-16 h-16 bg-[#cf2e2e] rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            {String(t.val).padStart(2, "0")}
          </div>
          <span className="text-xs text-gray-500 mt-1 font-medium">{t.label}</span>
        </div>
      ))}
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-200">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left"
      >
        <span className="text-[15px] font-semibold text-[#0f172a]">{q}</span>
        <svg
          className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <p className="pb-5 text-sm text-gray-500 leading-relaxed">{a}</p>}
    </div>
  );
}

const logos = [
  "Reddit", "HubSpot", "Notion", "Shopify", "Stripe", "Intercom", "Webflow", "Zapier",
  "Ahrefs", "Semrush", "Buffer", "Hootsuite", "Mailchimp", "ConvertKit",
];

const testimonials = [
  {
    quote: "CommentFlow paid for itself in the first week. We got 3 demo bookings from Reddit comments alone.",
    name: "Sarah Chen",
    role: "Head of Growth, TaskFlow",
    stat: "+340%",
    statLabel: "Reddit Traffic Increase",
  },
  {
    quote: "I was spending 2 hours a day manually commenting on Reddit. CommentFlow does it in minutes with better copy than I could write.",
    name: "Marcus Johnson",
    role: "Founder, DevToolkit",
    stat: "15hrs",
    statLabel: "Saved Per Week",
  },
  {
    quote: "The AI writes comments that actually sound human. We've never had a single one flagged as spam.",
    name: "Emily Park",
    role: "Marketing Lead, CloudBase",
    stat: "+127%",
    statLabel: "Organic Signups",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-[#0f172a]" style={{ fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" }}>
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-extrabold text-lg tracking-tight">
            <div className="w-8 h-8 bg-[#0d6efd] rounded-lg flex items-center justify-center text-white text-sm font-bold">
              CF
            </div>
            Comment<span className="text-[#0d6efd]">Flow</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-gray-500 hover:text-[#0f172a] transition-colors font-medium">
              Sign in
            </Link>
            <Link
              href="/register"
              className="px-5 py-2.5 bg-[#0d6efd] hover:bg-[#0654c4] text-white text-sm font-semibold rounded-full transition-colors shadow-md shadow-blue-500/20"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d6efd]/5 via-white to-purple-50" />
        <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#cf2e2e]/10 border border-[#cf2e2e]/20 rounded-full text-[#cf2e2e] text-sm font-semibold mb-6">
            Special 50% Discount for Lifetime
          </div>
          <h1 className="text-4xl md:text-[56px] font-extrabold leading-[1.1] mb-6 max-w-4xl mx-auto tracking-tight">
            Auto-Post AI Comments on Reddit{" "}
            <span className="text-[#0d6efd]">Without Lifting a Finger</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8 leading-relaxed">
            CommentFlow discovers relevant Reddit posts, generates natural AI-powered comments that mention your product, and auto-posts them using a Chrome extension. Fully hands-free.
          </p>

          <div className="mb-8">
            <p className="text-sm text-[#cf2e2e] font-semibold mb-3">Offer expires Sunday — don&apos;t miss it</p>
            <CountdownTimer />
          </div>

          <Link
            href="/register"
            className="inline-block px-8 py-4 bg-[#0d6efd] hover:bg-[#0654c4] text-white text-base font-bold rounded-full transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5"
          >
            GIVE ME INSTANT ACCESS
          </Link>
          <p className="mt-3 text-xs text-gray-400">No credit card required. Cancel anytime.</p>
        </div>
      </section>

      {/* Trust bar */}
      <section className="bg-[#f6f7f9] border-y border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500 font-medium">
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            1,200+ Active Users
          </span>
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            50,000+ Comments Posted
          </span>
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            0% Spam Detection Rate
          </span>
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
            4.9/5 Avg Rating
          </span>
        </div>
      </section>

      {/* Value prop: two columns */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold leading-tight mb-6 tracking-tight">
              Drive Organic Traffic from Reddit Without the Manual Grind
            </h2>
            <p className="text-gray-500 mb-6 leading-relaxed">
              Every day, thousands of people ask for product recommendations on Reddit. CommentFlow uses AI to find those conversations and reply with genuine, helpful comments that naturally mention your product.
            </p>
            <ul className="space-y-4 mb-8">
              {[
                "AI discovers high-intent posts in your niche automatically",
                "Comments sound human — never flagged as spam or self-promotion",
                "Chrome extension posts using your own logged-in Reddit session",
                "Full dashboard to review, edit, and approve before posting",
                "Works while you sleep — fully automated pipeline",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[15px] text-gray-600">{item}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className="inline-block px-7 py-3.5 bg-[#0d6efd] hover:bg-[#0654c4] text-white font-bold rounded-full transition-all shadow-md shadow-blue-500/20"
            >
              GIVE ME INSTANT ACCESS
            </Link>
          </div>
          <div className="bg-[#f6f7f9] rounded-2xl border border-gray-200 p-8 shadow-xl shadow-gray-200/50">
            <div className="space-y-4">
              {/* Mock dashboard preview */}
              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-500 text-xs font-bold">r/</div>
                  <div>
                    <p className="text-sm font-semibold text-[#0f172a]">r/startups</p>
                    <p className="text-xs text-gray-400">Relevance: 94%</p>
                  </div>
                  <span className="ml-auto px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Posted</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">&quot;What tools are you using for customer acquisition? Looking for something that doesn&apos;t require a huge team...&quot;</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-500 text-xs font-bold">r/</div>
                  <div>
                    <p className="text-sm font-semibold text-[#0f172a]">r/SaaS</p>
                    <p className="text-xs text-gray-400">Relevance: 87%</p>
                  </div>
                  <span className="ml-auto px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">Pending</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">&quot;Best way to get early traction for a B2B SaaS? We have a great product but no marketing budget...&quot;</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-500 text-xs font-bold">r/</div>
                  <div>
                    <p className="text-sm font-semibold text-[#0f172a]">r/Entrepreneur</p>
                    <p className="text-xs text-gray-400">Relevance: 91%</p>
                  </div>
                  <span className="ml-auto px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">Approved</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">&quot;How do you guys handle organic marketing? Paid ads are getting way too expensive...&quot;</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logo marquee */}
      <section className="py-12 bg-white overflow-hidden">
        <p className="text-center text-sm text-gray-400 font-medium mb-8">TRUSTED BY TEAMS AT</p>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent z-10" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent z-10" />
          <div className="flex animate-marquee gap-12 whitespace-nowrap">
            {[...logos, ...logos].map((logo, i) => (
              <div
                key={`${logo}-${i}`}
                className="flex items-center justify-center px-6 py-3 bg-[#f6f7f9] border border-gray-100 rounded-full text-sm font-semibold text-gray-400 shrink-0"
              >
                {logo}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-[#f6f7f9] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4 tracking-tight">How CommentFlow Works</h2>
          <p className="text-center text-gray-500 mb-14 max-w-xl mx-auto">From setup to posted comments in under 10 minutes. Zero manual work required after that.</p>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Create a Campaign", desc: "Add your brand, product description, target keywords, and subreddits. Set your preferred tone and daily limits.", color: "bg-blue-500" },
              { step: "02", title: "AI Discovers Posts", desc: "Our engine scans Reddit for high-intent discussions matching your keywords. Relevance scoring filters the best opportunities.", color: "bg-purple-500" },
              { step: "03", title: "Generate Comments", desc: "OpenAI crafts natural, helpful replies tailored to each post. Review, edit, or auto-approve them from your dashboard.", color: "bg-teal-500" },
              { step: "04", title: "Auto-Post", desc: "The Chrome extension picks up approved comments and posts them with human-like typing and natural timing.", color: "bg-orange-500" },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-2xl border border-gray-200 p-7 shadow-sm hover:shadow-lg transition-shadow">
                <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center text-white text-lg font-bold mb-5`}>
                  {item.step}
                </div>
                <h3 className="text-lg font-bold mb-2 text-[#0f172a]">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key features / why CommentFlow */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4 tracking-tight">Smarter Reddit Marketing, Made Simple</h2>
        <p className="text-center text-gray-500 mb-14 max-w-xl mx-auto">Everything you need to turn Reddit conversations into customers.</p>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { title: "Smart Post Discovery", desc: "Automatically scans target subreddits for posts matching your keywords. Relevance scoring ensures you only engage with the highest-potential discussions.", emoji: "🔍" },
            { title: "AI Comment Generation", desc: "OpenAI generates comments that are genuinely helpful, platform-native, and subtly mention your product only when relevant. Configurable tone from casual to professional.", emoji: "🤖" },
            { title: "Chrome Extension Auto-Poster", desc: "Lightweight Manifest V3 extension posts comments using your logged-in Reddit session. Human-like typing delays and natural timing prevent detection.", emoji: "⚡" },
            { title: "Full Comment Queue", desc: "Review, edit, approve, or reject every AI-generated comment before it gets posted. Or enable auto-approve for hands-free operation.", emoji: "📋" },
            { title: "Campaign Management", desc: "Run multiple campaigns for different products, each with their own keywords, subreddits, tone, and daily limits. Pause or resume anytime.", emoji: "🎯" },
            { title: "Real-Time Analytics", desc: "Track discovered posts, pending comments, posted comments, and success rates. See exactly what's working across all campaigns.", emoji: "📊" },
            { title: "Relevance Scoring", desc: "Every discovered post is scored for relevance based on keyword density, question intent, and engagement metrics. Focus on what matters.", emoji: "🎰" },
            { title: "Anti-Detection", desc: "Randomized delays, typing simulation, and human-like timing patterns. Your comments look and feel like they came from a real person.", emoji: "🛡️" },
            { title: "Multi-Subreddit Targeting", desc: "Target as many subreddits as you want per campaign. CommentFlow searches each one for relevant discussions automatically.", emoji: "🌐" },
          ].map((feature) => (
            <div key={feature.title} className="bg-[#f6f7f9] border border-gray-100 rounded-2xl p-6 hover:border-gray-200 hover:shadow-md transition-all">
              <div className="text-2xl mb-3">{feature.emoji}</div>
              <h3 className="text-base font-bold mb-2 text-[#0f172a]">{feature.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Countdown + urgency mid-page */}
      <section className="bg-[#0f172a] py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-[#cf2e2e] font-bold text-sm mb-2">⚠️ LIMITED TIME OFFER</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-2 tracking-tight">Get 50% Off — Lifetime Deal</h2>
          <p className="text-gray-400 mb-8">This is the last time we&apos;re offering this. Once the timer runs out, prices go back to normal.</p>
          <CountdownTimer />
          <div className="mt-8">
            <Link
              href="/register"
              className="inline-block px-8 py-4 bg-[#0d6efd] hover:bg-[#0654c4] text-white text-base font-bold rounded-full transition-all shadow-lg shadow-blue-500/30"
            >
              GIVE ME INSTANT ACCESS
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-[#f6f7f9]">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4 tracking-tight">What Our Users Say</h2>
          <p className="text-center text-gray-500 mb-14">Real results from real marketers using CommentFlow.</p>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl border border-gray-200 p-7 shadow-sm hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-6">&quot;{t.quote}&quot;</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-[#0f172a]">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-extrabold text-[#0d6efd]">{t.stat}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">{t.statLabel}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4 tracking-tight">Simple, Transparent Pricing</h2>
        <p className="text-center text-gray-500 mb-14 max-w-xl mx-auto">All plans include the Chrome extension, AI generation, and full dashboard access.</p>
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {[
            {
              name: "Extension",
              price: "$20",
              featured: false,
              description: "Everything you need to run Reddit comment campaigns yourself.",
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
            {
              name: "Done-For-You",
              price: "$99",
              featured: true,
              badge: "BEST VALUE",
              description: "We set up and manage your campaigns. You just watch the traffic roll in.",
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
          ].map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-8 relative ${
                plan.featured
                  ? "bg-white border-2 border-[#0d6efd] shadow-xl shadow-blue-500/10"
                  : "bg-white border border-gray-200 shadow-sm"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#0d6efd] text-white text-xs font-bold rounded-full">
                  {plan.badge}
                </div>
              )}
              <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
              <div className="flex items-baseline gap-2 mb-2">
                <p className="text-4xl font-extrabold text-[#0f172a]">{plan.price}</p>
                <span className="text-sm text-gray-400 font-medium">/mo</span>
              </div>
              <p className="text-sm text-gray-500 mb-6">{plan.description}</p>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className={`block text-center py-3 rounded-full font-bold text-sm transition-all ${
                  plan.featured
                    ? "bg-[#0d6efd] hover:bg-[#0654c4] text-white shadow-md shadow-blue-500/20"
                    : "bg-[#f6f7f9] hover:bg-gray-200 text-[#0f172a] border border-gray-200"
                }`}
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-[#f6f7f9] py-20">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4 tracking-tight">We&apos;re Here to Answer All Your Questions</h2>
          <p className="text-center text-gray-500 mb-12">Everything you need to know about CommentFlow.</p>
          <div className="bg-white rounded-2xl border border-gray-200 px-8 shadow-sm">
            <FAQItem q="How does CommentFlow find relevant Reddit posts?" a="CommentFlow uses Reddit's public JSON endpoints to search your target subreddits for posts matching your campaign keywords. Each post is scored for relevance based on keyword density, question intent signals (like 'looking for', 'recommend', '?'), and engagement metrics." />
            <FAQItem q="Will my Reddit account get banned?" a="CommentFlow is designed to minimize detection risk. The Chrome extension posts using your own logged-in session with human-like typing simulation, randomized delays, and natural timing patterns. Comments are written by AI to sound genuinely helpful, not promotional. That said, always follow subreddit rules and Reddit's terms of service." />
            <FAQItem q="How does the Chrome extension work?" a="It's a lightweight Manifest V3 extension. Once connected to your CommentFlow account, it periodically checks for approved comments. When it finds one, it opens the Reddit post in a background tab, types the comment with realistic delays, and clicks submit. It then reports the result back to your dashboard." />
            <FAQItem q="Can I review comments before they're posted?" a="Absolutely. By default, every AI-generated comment goes through a 'pending review' state where you can approve, edit, or reject it. If you trust the AI, you can enable auto-approve mode per campaign to skip manual review." />
            <FAQItem q="What AI model generates the comments?" a="We use OpenAI's GPT-4o-mini for comment generation. It's fast, affordable, and produces natural-sounding text. The system prompt is engineered to prioritize helpfulness over promotion — your product is only mentioned when genuinely relevant." />
            <FAQItem q="How many comments can I post per day?" a="Each campaign has a configurable daily limit (up to 50). We recommend starting with 3-5 per day per campaign to maintain a natural posting pattern. The Extension plan supports 150/month and the Done-For-You plan supports 1,000/month." />
            <FAQItem q="Can I target multiple subreddits?" a="Yes. Each campaign can target as many subreddits as you want. You can also run multiple campaigns for different products or brands, each with their own set of subreddits and keywords." />
            <FAQItem q="What if I want to cancel?" a="You can cancel anytime from your account settings. There are no long-term contracts or cancellation fees. If you cancel, you'll retain access through the end of your billing period." />
            <FAQItem q="Do you support platforms besides Reddit?" a="Reddit is fully supported today. YouTube support is in development for the Chrome extension. The web app already has YouTube discovery capabilities that will be enabled soon." />
            <FAQItem q="Is there a free trial?" a="Yes! You can sign up and explore the dashboard, create campaigns, and run discovery for free. You'll need an active plan to generate AI comments and use the Chrome extension auto-poster." />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 tracking-tight">
            Start Today — Your Customers Are on Reddit.{" "}
            <span className="text-[#0d6efd]">Are You?</span>
          </h2>
          <p className="text-gray-500 mb-10 max-w-xl mx-auto leading-relaxed">
            Join thousands of marketers using CommentFlow to drive organic traffic, build brand awareness, and convert Reddit discussions into paying customers.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="px-8 py-4 bg-[#0d6efd] hover:bg-[#0654c4] text-white text-base font-bold rounded-full transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl"
            >
              GIVE ME INSTANT ACCESS
            </Link>
            <Link
              href="#how-it-works"
              className="px-8 py-4 bg-white hover:bg-gray-50 text-[#0f172a] text-base font-bold rounded-full transition-all border border-gray-200 shadow-sm"
            >
              See How It Works
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-gray-400">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              Cancel anytime
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              50% off for limited time
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 font-extrabold text-sm text-gray-400">
            <div className="w-6 h-6 bg-[#0d6efd] rounded-md flex items-center justify-center text-white text-[10px] font-bold">CF</div>
            CommentFlow
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <Link href="/terms" className="hover:text-gray-600 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-gray-600 transition-colors">Privacy</Link>
            <a href="mailto:support@commentflow.io" className="hover:text-gray-600 transition-colors">Support</a>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
