import { CheckCircle, XCircle } from "lucide-react";
import { LegalPage, LegalIntro, LegalSection } from "@/components/LegalPage";

const RefundPolicy = () => (
  <LegalPage title="Refund Policy" updated="09-06-2026">
    <LegalIntro>
      <p>Thank you for subscribing to Forte Digital Solutions LLP. We hope you are satisfied with our astrology services, but if not, we&apos;re here to help.</p>
    </LegalIntro>

    {[
      { title: "Free Trial", body: "Forte Digital Solutions LLP does not offer a free trial. Users can cancel their subscription at any time from their account page." },
      { title: "Cancellation Policy", body: "Subscribers may cancel their recurring subscription at any time. Upon cancellation, access remains active until the end of the current billing cycle." },
      { title: "Refund Eligibility", body: "To be eligible for a refund, you must submit a request within 2 days of your subscription start date. Refunds are granted on a case-by-case basis at the sole discretion of Forte Digital Solutions LLP." },
      { title: "Process for Requesting a Refund", body: "To request a refund, please contact our customer support team at info@fortedigitalsolutions.com. Include your account information, subscription details, and a brief explanation." },
      { title: "Refund Processing", body: "Once your refund request is received and reviewed, we will notify you of approval or rejection by email. If approved, your refund will be processed within 7 working days." },
      { title: "Changes to Refund Policy", body: "Forte Digital Solutions LLP reserves the right to modify this refund policy at any time. Changes take effect immediately upon posting on the website." },
      { title: "Contact Us", body: "If you have any questions about our refund policy, please contact us at info@fortedigitalsolutions.com." },
    ].map(({ title, body }) => (
      <LegalSection key={title} title={title}>
        <p>{body}</p>
      </LegalSection>
    ))}

    <LegalSection title="Refund Scenarios">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card rounded-xl border border-green-400/25 p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <h3 className="text-green-300 font-semibold text-sm">Refunds Would Typically Be Granted</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-white font-medium text-sm">Technical Issues</p>
              <p className="text-gray-400 text-xs mt-0.5">Persistent technical issues preventing use of the astrology service.</p>
            </div>
            <div>
              <p className="text-white font-medium text-sm">Billing Error</p>
              <p className="text-gray-400 text-xs mt-0.5">Incorrectly charged due to a billing error on our part.</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-xl border border-red-400/25 p-4">
          <div className="flex items-center gap-2 mb-3">
            <XCircle className="w-5 h-5 text-red-400" />
            <h3 className="text-red-300 font-semibold text-sm">Refunds Would Not Typically Be Granted</h3>
          </div>
          <div>
            <p className="text-white font-medium text-sm">Change of Mind</p>
            <p className="text-gray-400 text-xs mt-0.5">Customer decides they no longer want the astrology service after the refund eligibility period.</p>
          </div>
        </div>
      </div>
    </LegalSection>
  </LegalPage>
);

export default RefundPolicy;
