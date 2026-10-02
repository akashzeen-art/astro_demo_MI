import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { ReadingsProvider } from "@/contexts/ReadingsContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import ServiceGateRoute from "@/components/ServiceGateRoute";
import { handleLoggedInUserPageLoad } from "@/utils/loginSuccessHandler";
import { initializeClickId, getMsisdnFromUrl } from "@/utils/clickIdManager";
import { checkUserStatus, isUserSubscribed } from "@/services/userStatusApi";
import { hasActiveSubscription, syncSubscriptionFromApi } from "@/lib/subscription";
import { FEATURES, CALL_PAYMENT_CONFIG } from "@/lib/config";
import { hasCompleteBirthProfile, syncBirthProfileFromApi } from "@/services/userProfileApi";
import { activatePendingCallCredit } from "@/services/callPaymentApi";
import { startPanditStatusSocket } from "@/services/panditStatusSocket";

const CosmicBackground = lazy(() => import("./components/CosmicBackground"));
const LoadingOverlay = lazy(() => import("./components/LoadingOverlay"));
const SubscriptionGateModal = lazy(
  () => import("@/components/SubscriptionGateModal"),
);

const Index = lazy(() => import("./pages/Index"));
const PalmAnalysis = lazy(() => import("./pages/PalmAnalysis"));
const Numerology = lazy(() => import("./pages/Numerology"));
const AstrologyReading = lazy(() => import("./pages/AstrologyReading"));
const Horoscope = lazy(() => import("./pages/Horoscope"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));
const VideoBackgroundDemo = lazy(() => import("./pages/VideoBackgroundDemo"));
const KidsBoxPortal = lazy(() => import("./pages/KidsBoxPortal"));
const VideoTest = lazy(() => import("./pages/VideoTest"));
const Checkout = lazy(() => import("./pages/Checkout"));
const LiveConsultation = lazy(() => import("./pages/LiveConsultation"));
const Consultation = lazy(() => import("./pages/Consultation"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const MyAccount = lazy(() => import("./pages/MyAccount"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const ContactUs = lazy(() => import("./pages/ContactUs"));
const ProfileSetup = lazy(() => import("./pages/ProfileSetup"));

const CONSULTATION_PATHS = new Set([
  "/live-consultation",
  "/consultation",
  "/dashboard",
]);

function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div
        className="h-9 w-9 animate-spin rounded-full border-2 border-amber-400/25 border-t-amber-400"
        aria-label="Loading"
      />
    </div>
  );
}

function withSuspense(element: ReactNode) {
  return <Suspense fallback={<PageLoader />}>{element}</Suspense>;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function PaymentInitializer() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!FEATURES.PAYMENTS) return;

    const run = () => {
      const { portalId } = initializeClickId();
      const msisdn = getMsisdnFromUrl();

      if (portalId === CALL_PAYMENT_CONFIG.PORTAL_ID) {
        if (msisdn) localStorage.setItem("userMobile", msisdn);
        const credit = activatePendingCallCredit();
        const path = localStorage.getItem("postCallPath") || "/consultation";
        localStorage.removeItem("postCallPath");
        if (credit) {
          navigate(path, { replace: true });
          return;
        }
      }

      if (msisdn && portalId) {
        checkUserStatus(msisdn, portalId)
          .then(async (statusData) => {
            if (isUserSubscribed(statusData)) {
              localStorage.setItem("isSubscribed", "true");
              localStorage.setItem("userMobile", msisdn);
              localStorage.setItem("subscriptionData", JSON.stringify(statusData));
              syncSubscriptionFromApi(msisdn, statusData.packType);
              const profile = await syncBirthProfileFromApi(msisdn);
              if (!hasCompleteBirthProfile(profile ?? undefined)) {
                navigate("/profile/setup", { replace: true });
              }
            } else {
              localStorage.removeItem("isSubscribed");
              localStorage.removeItem("subscriptionData");
            }
          })
          .catch(() => {
            localStorage.removeItem("isSubscribed");
            localStorage.removeItem("subscriptionData");
          });
        return;
      }

      if (hasActiveSubscription() && localStorage.getItem("userMobile")) {
        return;
      }

      handleLoggedInUserPageLoad().then((wasRedirected) => {
        if (!wasRedirected) {
          const storedMobile = localStorage.getItem("userMobile");
          if (storedMobile && portalId) {
            checkUserStatus(storedMobile, portalId)
              .then(async (statusData) => {
                if (isUserSubscribed(statusData)) {
                  localStorage.setItem("isSubscribed", "true");
                  localStorage.setItem("subscriptionData", JSON.stringify(statusData));
                  syncSubscriptionFromApi(storedMobile, statusData.packType);
                  const profile = await syncBirthProfileFromApi(storedMobile);
                  if (!hasCompleteBirthProfile(profile ?? undefined)) {
                    navigate("/profile/setup", { replace: true });
                  }
                }
              })
              .catch(() => {});
          }
        }
      });
    };

    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(run, { timeout: 2500 });
      return () => window.cancelIdleCallback(id);
    }

    const timer = setTimeout(run, 800);
    return () => clearTimeout(timer);
  }, [navigate]);

  return null;
}

function PanditStatusSocketBootstrap() {
  const { pathname } = useLocation();
  const needsSocket = CONSULTATION_PATHS.has(pathname);

  useEffect(() => {
    if (!needsSocket) return;
    startPanditStatusSocket();
  }, [needsSocket]);

  return null;
}

function AppChrome() {
  const { pathname } = useLocation();
  const isHome = pathname === "/";

  return (
    <>
      {isHome && (
        <Suspense fallback={null}>
          <CosmicBackground />
        </Suspense>
      )}
      <Suspense fallback={null}>
        <LoadingOverlay />
      </Suspense>
    </>
  );
}

function AppRoutes() {
  const { setUserFromSubscription } = useAuth();

  return (
    <SubscriptionProvider onUserActivated={setUserFromSubscription}>
      <AppChrome />
      <PaymentInitializer />
      <PanditStatusSocketBootstrap />
      <Suspense fallback={null}>
        <SubscriptionGateModal />
      </Suspense>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={withSuspense(<Index />)} />
        <Route
          path="/palm-analysis"
          element={withSuspense(
            <ServiceGateRoute>
              <PalmAnalysis />
            </ServiceGateRoute>,
          )}
        />
        <Route
          path="/numerology"
          element={withSuspense(
            <ServiceGateRoute>
              <Numerology />
            </ServiceGateRoute>,
          )}
        />
        <Route
          path="/astrology"
          element={withSuspense(
            <ServiceGateRoute>
              <AstrologyReading />
            </ServiceGateRoute>,
          )}
        />
        <Route
          path="/horoscope"
          element={withSuspense(
            <ServiceGateRoute>
              <Horoscope />
            </ServiceGateRoute>,
          )}
        />
        <Route
          path="/dashboard"
          element={withSuspense(
            <ServiceGateRoute>
              <Dashboard />
            </ServiceGateRoute>,
          )}
        />
        <Route path="/checkout" element={withSuspense(<Checkout />)} />
        <Route
          path="/live-consultation"
          element={withSuspense(
            <ServiceGateRoute>
              <LiveConsultation />
            </ServiceGateRoute>,
          )}
        />
        <Route
          path="/consultation"
          element={withSuspense(
            <ServiceGateRoute>
              <Consultation />
            </ServiceGateRoute>,
          )}
        />
        <Route path="/admin" element={withSuspense(<AdminPanel />)} />
        <Route path="/my-account" element={withSuspense(<MyAccount />)} />
        <Route path="/profile/setup" element={withSuspense(<ProfileSetup />)} />
        <Route path="/about" element={withSuspense(<AboutUs />)} />
        <Route path="/contact" element={withSuspense(<ContactUs />)} />
        <Route path="/terms" element={withSuspense(<TermsAndConditions />)} />
        <Route path="/refund-policy" element={withSuspense(<RefundPolicy />)} />
        <Route path="/privacy-policy" element={withSuspense(<PrivacyPolicy />)} />
        <Route path="/video-demo" element={withSuspense(<VideoBackgroundDemo />)} />
        <Route path="/kids-portal" element={withSuspense(<KidsBoxPortal />)} />
        <Route path="/video-test" element={withSuspense(<VideoTest />)} />
        <Route path="*" element={withSuspense(<NotFound />)} />
      </Routes>
    </SubscriptionProvider>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <div className="relative z-[1]">
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <AuthProvider>
            <ReadingsProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <AppRoutes />
                </BrowserRouter>
              </TooltipProvider>
            </ReadingsProvider>
          </AuthProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </div>
);

export default App;
