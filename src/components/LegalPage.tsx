import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Layout from "@/components/Layout";
import { BRAND } from "@/lib/brand";

interface LegalPageProps {
  title: string;
  subtitle?: string;
  updated?: string;
  children: React.ReactNode;
}

export const LegalPage = ({ title, subtitle, updated, children }: LegalPageProps) => (
  <Layout>
    <div className="max-w-3xl mx-auto sutra-page">
      <Link to="/" className="inline-flex items-center gap-2 sutra-link mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <div className="glass-card rounded-2xl border border-orange-500/20 p-6 md:p-8 mb-6">
        <h1 className="font-display text-3xl font-bold text-amber-50 mb-2">{title}</h1>
        {subtitle && <p className="text-amber-400/80 font-medium">{subtitle}</p>}
        {updated && <p className="text-sm text-orange-200/40 mt-2">Last Updated: {updated}</p>}
      </div>

      <div className="space-y-4 text-sm leading-relaxed text-orange-100/65">{children}</div>

      <p className="mt-10 text-xs text-orange-400/40 text-center">© 2026 {BRAND.COMPANY}</p>
    </div>
  </Layout>
);

export const LegalIntro = ({ children }: { children: React.ReactNode }) => (
  <div className="glass-card rounded-xl border border-orange-500/15 p-5 md:p-6 space-y-3">{children}</div>
);

export const LegalSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="glass-card rounded-xl border border-orange-500/15 p-5 md:p-6">
    <h2 className="font-display text-lg text-amber-100 font-semibold mb-3">{title}</h2>
    {children}
  </section>
);

export const LegalList = ({ items }: { items: string[] }) => (
  <ul className="space-y-2">
    {items.map((item) => (
      <li key={item} className="flex items-start gap-2">
        <span className="text-amber-400 mt-0.5 shrink-0">›</span>
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

export default LegalPage;
