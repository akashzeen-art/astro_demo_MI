import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSubscription } from "@/contexts/SubscriptionContext";
import {
  hasCompleteBirthProfile,
  syncBirthProfileFromApi,
} from "@/services/userProfileApi";

interface ServiceGateRouteProps {
  children: ReactNode;
}

/**
 * Subscription overlay remains disabled. Active subscribers with no saved birth
 * profile are sent to the one-time profile form before using personalized tools.
 * First tries GET /api/astro/getdata for an existing remote profile.
 */
const ServiceGateRoute = ({ children }: ServiceGateRouteProps) => {
  const { hasAccess } = useSubscription();
  const location = useLocation();
  const [checking, setChecking] = useState(() => hasAccess && !hasCompleteBirthProfile());
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!hasAccess) {
      setChecking(false);
      setNeedsSetup(false);
      return;
    }

    if (hasCompleteBirthProfile()) {
      setChecking(false);
      setNeedsSetup(false);
      return;
    }

    setChecking(true);
    syncBirthProfileFromApi()
      .then((profile) => {
        if (cancelled) return;
        if (hasCompleteBirthProfile(profile ?? undefined)) {
          setNeedsSetup(false);
        } else {
          localStorage.setItem("postProfilePath", location.pathname);
          setNeedsSetup(true);
        }
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hasAccess, location.pathname]);

  if (!hasAccess) return <>{children}</>;
  if (checking) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-amber-400/30 border-t-amber-400" />
      </div>
    );
  }
  if (needsSetup) return <Navigate to="/profile/setup" replace />;

  return <>{children}</>;
};

export default ServiceGateRoute;
