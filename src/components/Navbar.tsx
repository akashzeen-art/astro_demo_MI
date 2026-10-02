import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Menu, X, Home, Hand, Calculator, Star, User, Sparkles,
  Info, FileText, RefreshCw, Shield, Phone, ChevronRight,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { isGatedPath } from "@/lib/subscription";
import AuthModal from "./AuthModal";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

const PRIMARY_NAV = [
  { path: "/", label: "Home", icon: Home },
  { path: "/live-consultation", label: "Pandit Ji", icon: Phone },
  { path: "/palm-analysis", label: "Palm", icon: Hand },
  { path: "/numerology", label: "Numbers", icon: Calculator },
  { path: "/astrology", label: "Kundli", icon: Star },
  { path: "/horoscope", label: "Horoscope", icon: Sparkles },
];

const MORE_NAV = [
  { path: "/my-account", label: "My Account", icon: User },
  { path: "/about", label: "About", icon: Info },
  { path: "/terms", label: "Terms and Conditions", icon: FileText },
  { path: "/refund-policy", label: "Refund Policy", icon: RefreshCw },
  { path: "/privacy-policy", label: "Privacy Policy", icon: Shield },
  { path: "/contact", label: "Contact Us", icon: Phone },
];

const DESKTOP_MORE = MORE_NAV.filter((item) =>
  item.path === "/my-account" || item.path === "/about"
);

const Navbar = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const { hasAccess, requestService } = useSubscription();

  const handleNavClick = (path: string, e: React.MouseEvent) => {
    if (isGatedPath(path) && !hasAccess) {
      e.preventDefault();
      requestService(path);
    }
  };

  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  useEffect(() => {
    const handler = () => setIsAuthModalOpen(true);
    window.addEventListener("open-auth-modal", handler);
    return () => window.removeEventListener("open-auth-modal", handler);
  }, []);

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const pillClass = (active: boolean) =>
    cn(
      "sutra-pill shrink-0",
      active && "sutra-pill-active"
    );

  const subtleLinkClass = (active: boolean) =>
    cn(
      "sutra-pill-subtle shrink-0",
      active && "sutra-pill-subtle-active"
    );

  return (
    <>
      {/* Top accent */}
      <div
        className="fixed top-0 left-0 right-0 z-[60] h-1 bg-gradient-to-r from-amber-600 via-orange-500 to-teal-600"
        aria-hidden
      />

      <header className="fixed top-1 left-0 right-0 z-50 border-b border-orange-900/30 bg-[hsl(16_32%_9%/0.55)] backdrop-blur-xl safe-area-top">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6">
          {/* Single aligned row — desktop */}
          <div className="flex h-16 items-center gap-3 lg:gap-4">
            {/* Brand */}
            <Link
              to="/"
              className="flex min-w-0 shrink-0 items-center gap-2.5 sm:gap-3"
            >
              <img
                src={BRAND.LOGO}
                alt={BRAND.NAME}
                className="h-10 w-10 shrink-0 rounded-xl border border-orange-500/35 bg-orange-950/40 object-contain p-0.5 shadow-sm"
              />
              <div className="min-w-0 leading-tight">
                <p className="font-display text-base font-semibold text-amber-50 truncate sm:text-lg">
                  {BRAND.NAME}
                </p>
                <p className="hidden sm:block text-[10px] leading-snug text-orange-300/65 truncate max-w-[11rem] md:max-w-none">
                  {BRAND.TAGLINE}
                </p>
              </div>
            </Link>

            {/* Center nav — desktop only */}
            <nav
              className="hidden lg:flex flex-1 items-center justify-center gap-1.5 min-w-0 px-2"
              aria-label="Main navigation"
            >
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full">
                {PRIMARY_NAV.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={(e) => handleNavClick(item.path, e)}
                    className={pillClass(isActive(item.path))}
                  >
                    <item.icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>

              <span className="mx-1 h-5 w-px shrink-0 bg-orange-800/50" aria-hidden />

              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {DESKTOP_MORE.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={subtleLinkClass(isActive(item.path))}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </nav>

            {/* Header actions */}
            <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDrawerOpen(true)}
                className="h-9 w-9 text-orange-200 hover:text-amber-100 hover:bg-orange-500/10 lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Fixed Pandit CTA — edge-to-edge full width (all screen sizes) */}
      {!location.pathname.startsWith("/live-consultation") &&
        !location.pathname.startsWith("/consultation") && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom pointer-events-none"
          aria-label="Talk to Pandit Ji"
        >
          <Button
            size="lg"
            onClick={() => requestService("/live-consultation")}
            className="pointer-events-auto flex h-14 w-full rounded-none rounded-t-2xl border-0 border-t border-orange-400/20 bg-gradient-to-r from-orange-500 to-red-500 px-6 text-base font-semibold text-white shadow-[0_-8px_32px_rgba(249,115,22,0.35)] hover:from-orange-600 hover:to-red-600"
          >
            <Phone className="mr-2 h-5 w-5" />
            Talk to Pandit Ji
          </Button>
        </div>
      )}

      {/* Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[55]">
          <div
            className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
          <aside
            className="absolute bottom-0 left-0 right-0 flex max-h-[85vh] flex-col overflow-hidden rounded-t-2xl border border-orange-800/30 bg-[hsl(14_30%_8%/0.42)] backdrop-blur-xl shadow-2xl lg:bottom-auto lg:left-auto lg:right-0 lg:top-[calc(4rem+1px)] lg:w-80 lg:max-h-[calc(100vh-4rem-1px)] lg:rounded-none lg:rounded-bl-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <div className="flex items-center justify-between border-b border-orange-900/25 bg-orange-950/10 px-5 py-4">
              <span className="font-display text-lg text-amber-100">Sacred Menu</span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded-lg p-1.5 text-orange-300/60 hover:bg-orange-500/10 hover:text-amber-200"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {[...PRIMARY_NAV, ...MORE_NAV].map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={(e) => {
                    handleNavClick(item.path, e);
                    setDrawerOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-3 px-5 py-3.5 text-sm transition-colors",
                    isActive(item.path)
                      ? "border-r-2 border-orange-500 bg-orange-500/10 text-amber-300"
                      : "text-orange-100/70 hover:bg-orange-500/5 hover:text-amber-100"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                  {item.label}
                  <ChevronRight className="ml-auto h-4 w-4 shrink-0 opacity-30" aria-hidden />
                </Link>
              ))}
            </div>
            <div className="space-y-2 border-t border-orange-900/25 bg-orange-950/10 p-4">
              <p className="pt-1 text-center text-[10px] text-orange-400/40">
                © 2026 {BRAND.COMPANY}
              </p>
            </div>
          </aside>
        </div>
      )}

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
};

export default Navbar;
