import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy — Parsli",
  description: "How Parsli collects, uses, and protects your personal data.",
  alternates: {
    canonical: "https://parsli.co/privacy",
  },
}

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 prose prose-neutral dark:prose-invert">
      <h1>Privacy Policy</h1>
      <p className="text-sm text-muted-foreground">Last updated: 7 March 2026</p>

      <p>
        Parsli (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is operated by BYTEBEAMAGENCY LTD, a company
        registered in England and Wales. This Privacy Policy explains how we collect, use, disclose,
        and safeguard your information when you use our document extraction service at{" "}
        <a href="https://parsli.co">parsli.co</a> (the &quot;Service&quot;).
      </p>

      <h2>1. Data Controller</h2>
      <p>
        BYTEBEAMAGENCY LTD is the data controller for the personal data processed through the Service.
        For questions or requests, contact us at{" "}
        <a href="mailto:talal@bytebeam.co">talal@bytebeam.co</a>.
      </p>

      <h2>2. Legal Basis for Processing</h2>
      <p>We process personal data under the following lawful bases:</p>
      <ul>
        <li><strong>Contractual necessity</strong> — to provide the Service you signed up for.</li>
        <li><strong>Legitimate interests</strong> — to improve our Service, prevent fraud, and ensure security.</li>
        <li><strong>Legal compliance</strong> — to meet our legal and regulatory obligations.</li>
        <li><strong>Consent</strong> — where you have explicitly opted in (e.g., marketing emails).</li>
      </ul>

      <h2>3. Personal Data We Collect</h2>
      <h3>Data you provide directly</h3>
      <ul>
        <li><strong>Account data</strong> — name, email address, password (hashed).</li>
        <li><strong>Billing data</strong> — processed and stored by Stripe; we do not store card details.</li>
        <li><strong>Documents</strong> — files you upload for extraction. We process these to deliver
          the Service and do not use your document content for any other purpose.</li>
        <li><strong>Support enquiries</strong> — any information you provide when contacting us.</li>
      </ul>
      <h3>Data collected automatically</h3>
      <ul>
        <li><strong>Usage data</strong> — pages extracted, API calls, feature usage.</li>
        <li><strong>Technical data</strong> — IP address, browser type, device information, operating system.</li>
        <li><strong>Cookies</strong> — essential session cookies and optional analytics cookies (see Section 8).</li>
      </ul>

      <h2>4. How We Use Your Data</h2>
      <ul>
        <li>To provide, operate, and maintain the Service.</li>
        <li>To process your subscription and billing.</li>
        <li>To send transactional emails (account, billing, and security notifications).</li>
        <li>To monitor usage for credit metering and abuse prevention.</li>
        <li>To improve the Service through aggregated, anonymised analytics.</li>
        <li>To respond to support requests.</li>
        <li>To comply with legal obligations.</li>
      </ul>
      <p>
        <strong>We do not use your uploaded documents to train AI models.</strong> Documents are
        processed solely to return extraction results to you.
      </p>

      <h2>5. Disclosure to Third Parties</h2>
      <p>We share personal data only with the following categories of service providers:</p>
      <table>
        <thead>
          <tr><th>Provider</th><th>Purpose</th><th>Data shared</th></tr>
        </thead>
        <tbody>
          <tr><td>Supabase (US)</td><td>Database &amp; authentication</td><td>Account data, usage data</td></tr>
          <tr><td>Stripe (US)</td><td>Payment processing</td><td>Billing data, email</td></tr>
          <tr><td>Google / OpenRouter (US)</td><td>AI extraction (LLM)</td><td>Document content (for extraction only)</td></tr>
          <tr><td>Vercel (US)</td><td>Application hosting</td><td>Technical data, IP address</td></tr>
          <tr><td>Resend (US)</td><td>Transactional email</td><td>Email address, name</td></tr>
        </tbody>
      </table>
      <p>
        We do not sell your personal data to any third party. We may disclose data if required by law
        or to protect our rights and safety.
      </p>

      <h2>6. International Data Transfers</h2>
      <p>
        Your data may be transferred to and processed in the United States by our service providers.
        Where applicable, we rely on Standard Contractual Clauses (SCCs) or other approved transfer
        mechanisms to ensure adequate protection under UK GDPR and EU GDPR.
      </p>

      <h2>7. Data Retention</h2>
      <ul>
        <li><strong>Account data</strong> — retained while your account is active, deleted within 30 days of account deletion.</li>
        <li><strong>Uploaded documents</strong> — processed in memory for extraction and not permanently stored unless you
          explicitly save results. Extraction results are retained until you delete them or your account.</li>
        <li><strong>Billing records</strong> — retained for 7 years as required by UK tax regulations.</li>
        <li><strong>Usage logs</strong> — retained for 90 days, then anonymised.</li>
      </ul>

      <h2>8. Cookies</h2>
      <p>We use the following types of cookies:</p>
      <ul>
        <li><strong>Strictly necessary</strong> — authentication session cookies required for the Service to function.</li>
        <li><strong>Analytics</strong> — anonymised usage analytics to improve the Service (can be opted out).</li>
      </ul>
      <p>We do not use advertising or marketing cookies.</p>

      <h2>9. Data Security</h2>
      <p>
        We implement industry-standard security measures including encryption in transit (TLS 1.2+),
        encryption at rest (AES-256), secure authentication, and regular security reviews. However,
        no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
      </p>

      <h2>10. Your Rights</h2>
      <p>Under UK GDPR and EU GDPR, you have the right to:</p>
      <ul>
        <li><strong>Access</strong> — request a copy of your personal data.</li>
        <li><strong>Rectification</strong> — correct inaccurate or incomplete data.</li>
        <li><strong>Erasure</strong> — request deletion of your personal data.</li>
        <li><strong>Restriction</strong> — request restricted processing of your data.</li>
        <li><strong>Portability</strong> — receive your data in a structured, machine-readable format.</li>
        <li><strong>Object</strong> — object to processing based on legitimate interests.</li>
        <li><strong>Withdraw consent</strong> — where processing is based on consent.</li>
      </ul>
      <p>
        To exercise any of these rights, email{" "}
        <a href="mailto:talal@bytebeam.co">talal@bytebeam.co</a>. We will respond within 30 days.
      </p>

      <h2>11. Age Restriction</h2>
      <p>
        The Service is not intended for users under 18 years of age. We do not knowingly collect data
        from minors. If we become aware that a minor has provided us with personal data, we will
        delete it promptly.
      </p>

      <h2>12. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will notify you of material changes
        by email or by posting a notice on the Service. Your continued use of the Service after
        changes constitutes acceptance of the updated policy.
      </p>

      <h2>13. Contact</h2>
      <p>
        BYTEBEAMAGENCY LTD<br />
        Email: <a href="mailto:talal@bytebeam.co">talal@bytebeam.co</a>
      </p>
      <p>
        If you are unsatisfied with our response, you have the right to lodge a complaint with
        the UK Information Commissioner&apos;s Office (ICO) at{" "}
        <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">ico.org.uk</a>.
      </p>
    </div>
  )
}
