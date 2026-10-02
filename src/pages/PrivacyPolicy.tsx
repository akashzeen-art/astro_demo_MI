import { LegalPage, LegalIntro, LegalSection } from "@/components/LegalPage";

const PrivacyPolicy = () => (
  <LegalPage title="Privacy Policy" updated="09-06-2026">
    <LegalIntro>
      <p>This Privacy Policy describes how Forte Digital Solutions LLP collects, uses, and shares information about you when you use our astrology services.</p>
    </LegalIntro>

    {[
      { title: "Information We Collect", body: "We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support — including name, email, phone, payment info, usage data, and device information." },
      { title: "How We Use Your Information", body: "We use the information to provide, maintain, and improve our astrology Service; process transactions; send notices; respond to support requests; and personalise content." },
      { title: "Sharing of Information", body: "We may share information with service providers, in response to legal requests, to protect rights and safety, or in connection with a merger or acquisition." },
      { title: "Cookies", body: "We use cookies and similar tracking technologies. You can instruct your browser to refuse all cookies, though some portions of our Service may not function properly." },
      { title: "User-Generated Content", body: "Our Service may allow you to post content. You are responsible for the content you post, including its legality, reliability, and appropriateness." },
      { title: "Links to Other Sites", body: "Our Service may contain links to third-party sites. We have no control over and assume no responsibility for their content or privacy policies." },
      { title: "Children's Privacy", body: "Our Services are not intended for users under the age of 16. We do not knowingly collect personal data from children. If you believe a child has submitted personal information, please contact us immediately at info@fortedigitalsolutions.com." },
      { title: "Security and Data Retention", body: "We strive to use commercially acceptable means to protect your data. We retain your Personal Data only as long as necessary for the purposes set out in this policy." },
      { title: "Your Rights", body: "You have the right to access, correct, update, or delete the personal information we hold about you. Contact us through the information below." },
      { title: "Disclaimer", body: "The content provided on this platform, including all astrology readings, palm analyses, numerology readings, and related materials, is intended for general wellness and guidance purposes only. It is not a substitute for professional medical, legal, or financial advice. Individual results may vary." },
      { title: "Governing Law and Jurisdiction", body: "These Terms shall be governed and interpreted in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts located in Gurgaon, Haryana." },
      { title: "Updates to This Policy", body: "We may update our Privacy Policy from time to time. We will notify you of changes by posting the new policy on this page." },
    ].map(({ title, body }) => (
      <LegalSection key={title} title={title}>
        <p>{body}</p>
      </LegalSection>
    ))}

    <LegalSection title="Contact">
      <div className="glass-card rounded-lg border border-orange-500/15 p-4 space-y-1">
        <p>417, 4th Floor, Tower A, Spaze I Tech Park</p>
        <p>Sohna Road, Gurugram, Haryana - 122018</p>
        <a href="mailto:info@fortedigitalsolutions.com" className="text-amber-400 hover:text-amber-300">
          info@fortedigitalsolutions.com
        </a>
      </div>
    </LegalSection>
  </LegalPage>
);

export default PrivacyPolicy;
