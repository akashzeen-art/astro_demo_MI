import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import { BRAND } from "@/lib/brand";

const Footer = ({ noMobileFabPad = false }: { noMobileFabPad?: boolean }) => (
  <footer
    className={`relative z-[1] border-t border-orange-900/30 bg-[hsl(14_28%_6%/0.25)] backdrop-blur-md py-10 ${
      noMobileFabPad ? "" : "mobile-nav-offset"
    }`}
  >
    <div className="container mx-auto px-4">
      <div className="grid gap-8 md:grid-cols-3 text-center md:text-left">
        <div className="flex flex-col items-center md:items-start">
          <img
            src={BRAND.LOGO}
            alt={BRAND.NAME}
            className="h-12 w-12 mb-3 rounded-xl border border-orange-500/30 bg-orange-950/40 object-contain p-1"
          />
          <p className="font-display text-2xl font-semibold sutra-text mb-2">{BRAND.NAME}</p>
          <p className="text-sm text-orange-200/50">{BRAND.TAGLINE}</p>
        </div>
        <div className="flex flex-wrap justify-center md:justify-center gap-x-4 gap-y-2 text-sm">
          <Link to="/live-consultation" className="text-orange-200/50 hover:text-amber-300 transition-colors">Live Pandit Ji</Link>
          <Link to="/terms" className="text-orange-200/50 hover:text-amber-300 transition-colors">Terms and Conditions</Link>
          <Link to="/refund-policy" className="text-orange-200/50 hover:text-amber-300 transition-colors">Refund Policy</Link>
          <Link to="/privacy-policy" className="text-orange-200/50 hover:text-amber-300 transition-colors">Privacy Policy</Link>
          <Link to="/contact" className="text-orange-200/50 hover:text-amber-300 transition-colors">Contact Us</Link>
        </div>
        <div className="text-sm text-orange-200/40 md:text-right">
          <p>Powered by {BRAND.COMPANY}</p>
          <p className="mt-1 text-xs">© 2026 All Rights Reserved</p>
        </div>
      </div>
    </div>
  </footer>
);

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
  /** Hide bottom mobile nav padding on full-bleed pages */
  fullBleed?: boolean;
  /** Skip bottom FAB padding (e.g. live consultation page) */
  noMobileFabPad?: boolean;
}

const Layout = ({ children, className = "", fullBleed = false, noMobileFabPad = false }: LayoutProps) => (
  <div className={`relative min-h-screen flex flex-col ${className}`}>
    <Navbar />
    <main
      className={`relative z-[1] flex-1 pt-[calc(4rem+1px)] ${
        fullBleed || noMobileFabPad ? "" : "mobile-nav-scroll-pad"
      }`}
    >
      {children}
    </main>
    <Footer noMobileFabPad={noMobileFabPad} />
  </div>
);

export { Footer };
export default Layout;
