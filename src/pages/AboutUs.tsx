import { CheckCircle, Building2, MapPin, Phone, Mail } from "lucide-react";
import { LegalPage, LegalIntro, LegalSection } from "@/components/LegalPage";
import { BRAND } from "@/lib/brand";

const AboutUs = () => (
  <LegalPage title="About Us" subtitle={BRAND.COMPANY}>
    <LegalIntro>
      <p>{BRAND.NAME} is a premium digital astrology platform focused on Vedic astrology, palm reading, and numerology. Our mission is to make expert-led cosmic guidance accessible to everyone.</p>
      <p>Our platform covers astrology readings, palm analysis, numerology insights, and live consultations with expert pandits — with new content added regularly.</p>
    </LegalIntro>

    <LegalSection title="What We Offer">
      <ul className="space-y-2">
        {[
          "Premium astrology and palm reading consultations",
          "Unlimited access on any device",
          "Expert-led numerology and Vedic astrology programs",
          "Live Pandit Ji consultations",
          "Flexible subscription plans",
        ].map((item) => (
          <li key={item} className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-teal-400 shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </LegalSection>

    <LegalSection title="Company Details">
      <div className="space-y-4">
        {[
          { icon: Building2, label: "Registered Name", value: BRAND.COMPANY },
          { icon: MapPin, label: "Address", value: "417, 4th Floor, Tower A, Spaze I Tech Park, Sohna Road, Gurugram, Haryana - 122018" },
          { icon: Phone, label: "Phone", value: "+91 8929728030", href: "tel:+918929728030" },
          { icon: Mail, label: "Email", value: "info@fortedigitalsolutions.com", href: "mailto:info@fortedigitalsolutions.com" },
        ].map(({ icon: Icon, label, value, href }) => (
          <div key={label} className="flex items-start gap-3">
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
                <p className="text-amber-100 text-sm font-medium">{value}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </LegalSection>
  </LegalPage>
);

export default AboutUs;
