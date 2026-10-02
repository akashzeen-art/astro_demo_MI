import { Link } from "react-router-dom";
import { ArrowLeft, Building2, MapPin, Phone, Mail, Zap } from "lucide-react";
import Layout from "@/components/Layout";
import { LegalSection } from "@/components/LegalPage";

const ContactUs = () => (
  <Layout>
    <div className="max-w-3xl mx-auto sutra-page">
      <Link to="/" className="inline-flex items-center gap-2 sutra-link mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <div className="glass-card rounded-2xl border border-orange-500/20 p-6 md:p-8 mb-6">
        <h1 className="font-display text-3xl font-bold text-amber-50 mb-2">Contact Us</h1>
        <p className="text-orange-100/60 text-sm">We&apos;d love to hear from you. Feel free to reach out.</p>
      </div>

      <LegalSection title="Get In Touch">
        <div className="space-y-5">
          {[
            { icon: Building2, label: "Company", value: "Forte Digital Solutions LLP" },
            { icon: MapPin, label: "Address", value: "417, 4th Floor, Tower A, Spaze I Tech Park, Sohna Road, Gurugram, Haryana - 122018" },
            { icon: Phone, label: "Phone", value: "+91 8929728030", href: "tel:+918929728030" },
            { icon: Mail, label: "Email", value: "info@fortedigitalsolutions.com", href: "mailto:info@fortedigitalsolutions.com" },
          ].map(({ icon: Icon, label, value, href }) => (
            <div key={label} className={`flex items-${label === "Address" ? "start" : "center"} gap-4`}>
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/25 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-orange-200/40 text-xs uppercase tracking-widest mb-0.5">{label}</p>
                {href ? (
                  <a href={href} className="text-amber-100 text-sm font-medium hover:text-amber-300 transition-colors">
                    {value}
                  </a>
                ) : (
                  <p className="text-amber-100 text-sm">{value}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </LegalSection>

      <div className="glass-card rounded-xl border border-orange-500/15 p-6 my-4">
        <a
          href="https://forms.gle/CJS6wXQis9hKe7Da8"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sutra-btn-primary py-3 rounded-xl font-semibold text-sm uppercase tracking-widest flex items-center justify-center gap-2"
        >
          <Mail className="w-4 h-4" /> Send Us a Message
        </a>
      </div>

      <div className="glass-card rounded-xl border border-amber-400/20 p-5 flex items-start gap-3">
        <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-orange-100/70 text-sm">
          Need faster support? Email us at{" "}
          <a href="mailto:info@fortedigitalsolutions.com" className="text-amber-400 hover:underline">
            info@fortedigitalsolutions.com
          </a>{" "}
          for the quickest response.
        </p>
      </div>
    </div>
  </Layout>
);

export default ContactUs;
