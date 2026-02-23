import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - CommentFlow",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white text-[#0f172a]" style={{ fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" }}>
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2.5 font-extrabold text-lg tracking-tight">
            <div className="w-8 h-8 bg-[#0d6efd] rounded-lg flex items-center justify-center text-white text-sm font-bold">CF</div>
            Comment<span className="text-[#0d6efd]">Flow</span>
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-extrabold mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: February 2025</p>

        <div className="prose prose-gray max-w-none space-y-8 text-[15px] leading-relaxed text-gray-600">
          <section>
            <h2 className="text-xl font-bold text-[#0f172a] mb-3">1. Information We Collect</h2>
            <p>When you create an account, we collect your name, email address, and password (stored securely using bcrypt hashing). We do not store your password in plain text.</p>
            <p>When you use our service, we collect:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Campaign data you create (brand name, product descriptions, keywords, target subreddits)</li>
              <li>AI-generated comments and their posting status</li>
              <li>Discovered posts from public Reddit and YouTube data</li>
              <li>Extension authentication tokens for the Chrome extension</li>
              <li>Usage data such as login times and feature interactions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0f172a] mb-3">2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide and maintain the CommentFlow service</li>
              <li>Generate AI-powered comments based on your campaign settings</li>
              <li>Discover relevant posts on Reddit and YouTube matching your keywords</li>
              <li>Authenticate your Chrome extension for auto-posting</li>
              <li>Send you service-related communications</li>
              <li>Improve and optimize our platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0f172a] mb-3">3. Data Sharing</h2>
            <p>We do not sell your personal information. We may share data with:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>OpenAI</strong> &mdash; Post titles and content are sent to OpenAI&apos;s API to generate comments. This data is processed according to OpenAI&apos;s data usage policies.</li>
              <li><strong>Payment processors</strong> &mdash; If you subscribe to a paid plan, your payment information is handled by our payment processor (Stripe). We do not store your credit card details.</li>
              <li><strong>Service providers</strong> &mdash; We may use third-party services for hosting, analytics, and error tracking.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0f172a] mb-3">4. Data Security</h2>
            <p>We implement industry-standard security measures to protect your data, including encrypted passwords, secure HTTPS connections, and access controls. However, no method of electronic storage is 100% secure, and we cannot guarantee absolute security.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0f172a] mb-3">5. Data Retention</h2>
            <p>We retain your account data for as long as your account is active. Campaign data, discovered posts, and generated comments are retained for the duration of your subscription. You can delete your account and associated data by contacting us at support@commentflow.io.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0f172a] mb-3">6. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to or restrict processing of your data</li>
              <li>Export your data in a portable format</li>
            </ul>
            <p>To exercise these rights, contact us at support@commentflow.io.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0f172a] mb-3">7. Cookies</h2>
            <p>We use essential cookies for authentication and session management. We use localStorage to save your theme preference. We do not use third-party tracking cookies.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0f172a] mb-3">8. Third-Party Platforms</h2>
            <p>CommentFlow interacts with Reddit and YouTube through their public APIs. Your use of these platforms is subject to their respective privacy policies and terms of service. CommentFlow does not access your Reddit or YouTube account credentials &mdash; the Chrome extension operates within your existing browser session.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0f172a] mb-3">9. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of significant changes by email or through a notice on our website. Your continued use of the service after changes constitutes acceptance of the updated policy.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0f172a] mb-3">10. Contact Us</h2>
            <p>If you have questions about this Privacy Policy, contact us at <strong>support@commentflow.io</strong>.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
