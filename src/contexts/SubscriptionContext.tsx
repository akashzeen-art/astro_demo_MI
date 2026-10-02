import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  createSubscription,
  hasActiveSubscription,
  isGatedPath,
  loadSubscription,
  syncSubscriptionFromApi,
  type PlanId,
  type Subscription,
} from "@/lib/subscription";
import { FEATURES, PAYMENT_CONFIG, STORAGE_KEYS } from "@/lib/config";
import type { User } from "@/lib/apiService";
import {
  clearSubscriptionCache,
  getMobileForVerification,
  getPortalIdForVerification,
  verifyAccessWithAPI,
} from "@/utils/accessControlGuard";
import { getOrGenerateClickId, getPortalIdFromUrl } from "@/utils/clickIdManager";
import { initiatePayment } from "@/services/paymentApi";
import { checkUserStatus, isUserSubscribed } from "@/services/userStatusApi";
import { hasCompleteBirthProfile, syncBirthProfileFromApi } from "@/services/userProfileApi";

interface SubscriptionContextType {
  subscription: Subscription | null;
  hasAccess: boolean;
  isModalOpen: boolean;
  pendingPath: string | null;
  modalStep: 1 | 2;
  portalId: string;
  clickId: string;
  requestService: (path: string) => void;
  openSubscribeModal: (path?: string) => void;
  closeModal: () => void;
  setModalStep: (step: 1 | 2) => void;
  subscribe: (mobile: string, planId: PlanId) => Promise<boolean>;
  initiateApiPayment: (mobile: string, packType: string, price: number) => void;
  checkApiAccess: (mobile: string) => Promise<boolean>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined,
);

export const useSubscription = (): SubscriptionContextType => {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error("useSubscription must be used within SubscriptionProvider");
  }
  return ctx;
};

function buildUserFromSubscription(sub: Subscription): User {
  const masked = `+91 ${sub.mobile.slice(0, 5)}*****`;
  return {
    id: `user_${sub.mobile}`,
    email: `${sub.mobile}@subscriber.local`,
    username: `user_${sub.mobile}`,
    first_name: "Subscriber",
    last_name: "",
    phone_number: masked,
    timezone: "Asia/Kolkata",
    current_plan: sub.planId,
    subscription_status: "active",
    subscription_start: sub.subscribedAt,
    subscription_end: sub.expiresAt,
    total_readings: 0,
    accuracy_score: 94,
    member_since: sub.subscribedAt,
    email_notifications: true,
    daily_horoscope: true,
    marketing_emails: false,
    profile_visibility: "private",
    is_premium: true,
    readings_this_month: 0,
    date_joined: sub.subscribedAt,
  };
}

interface SubscriptionProviderProps {
  children: React.ReactNode;
  onUserActivated?: (user: User) => void;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({
  children,
  onUserActivated,
}) => {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<Subscription | null>(() =>
    loadSubscription(),
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [modalStep, setModalStep] = useState<1 | 2>(1);
  const [apiAccess, setApiAccess] = useState(() => hasActiveSubscription());
  const [portalId, setPortalId] = useState(() => getPortalIdFromUrl());
  const [clickId, setClickId] = useState(() =>
    getOrGenerateClickId(getPortalIdFromUrl()),
  );
  const clickSent = useRef(false);

  const hasAccess = useMemo(
    () => apiAccess || hasActiveSubscription(),
    [apiAccess, subscription],
  );

  useEffect(() => {
    const onStorage = () => {
      setSubscription(loadSubscription());
      setApiAccess(hasActiveSubscription());
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("subscription-updated", onStorage);
    window.addEventListener("subscription-activated", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("subscription-updated", onStorage);
      window.removeEventListener("subscription-activated", onStorage);
    };
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      const path = window.location.pathname;
      if (path === "/my-account" || path === "/profile/setup") return;

      clearSubscriptionCache();
      const mobile = getMobileForVerification();
      const pid = getPortalIdForVerification();
      if (mobile) {
        verifyAccessWithAPI(mobile, pid).then((active) => {
          setApiAccess(active);
          if (active) {
            const sub = syncSubscriptionFromApi(mobile);
            setSubscription(sub);
          }
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (!FEATURES.PAYMENTS || clickSent.current) return;
    if (window.location.pathname === "/checkout") return;

    const pid = getPortalIdFromUrl();
    const cid = new URLSearchParams(window.location.search).get("clickid");
    if (!cid) return;

    const callKey = `${cid}-${pid}`;
    const tracker = (window as Window & { _apiCallTracker?: Record<string, boolean> })
      ._apiCallTracker;
    if (tracker?.[callKey]) return;

    if (!(window as Window & { _apiCallTracker?: Record<string, boolean> })._apiCallTracker) {
      (window as Window & { _apiCallTracker?: Record<string, boolean> })._apiCallTracker = {};
    }
    (window as Window & { _apiCallTracker?: Record<string, boolean> })._apiCallTracker![callKey] =
      true;

    clickSent.current = true;

    const trackingUrl = `${PAYMENT_CONFIG.BASE_URL}/portal/${pid}?clickid=${cid}`;
    fetch(trackingUrl)
      .then((response) => response.text())
      .catch(() => {});
  }, []);

  const activateUser = useCallback(
    (sub: Subscription) => {
      const user = buildUserFromSubscription(sub);
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, `standalone_${sub.mobile}`);
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      onUserActivated?.(user);
      window.dispatchEvent(
        new CustomEvent("subscription-activated", { detail: sub }),
      );
    },
    [onUserActivated],
  );

  const checkApiAccess = useCallback(async (mobile: string): Promise<boolean> => {
    const pid = getPortalIdForVerification();
    try {
      const statusData = await checkUserStatus(mobile, pid);
      if (isUserSubscribed(statusData)) {
        localStorage.setItem("isSubscribed", "true");
        localStorage.setItem("userMobile", mobile);
        localStorage.setItem("subscriptionData", JSON.stringify(statusData));
        const sub = syncSubscriptionFromApi(mobile, statusData.packType);
        setSubscription(sub);
        setApiAccess(true);
        activateUser(sub);
        return true;
      }
    } catch {
      // proceed to payment
    }
    return false;
  }, [activateUser]);

  const openSubscribeModal = useCallback((path?: string) => {
    const pid = getPortalIdFromUrl();
    const cid = getOrGenerateClickId(pid);
    setPortalId(pid);
    setClickId(cid);
    if (path) setPendingPath(path);
    setModalStep(1);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setModalStep(1);
    if (!hasActiveSubscription()) {
      setPendingPath(null);
    }
  }, []);

  const requestService = useCallback(
    (path: string) => {
      if (!isGatedPath(path)) {
        navigate(path);
        return;
      }
      if (hasAccess) {
        navigate(path);
        return;
      }
      setPendingPath(path);
      setModalStep(1);
      setIsModalOpen(true);
    },
    [navigate, hasAccess],
  );

  const initiateApiPayment = useCallback(
    (mobile: string, packType: string, price: number) => {
      localStorage.setItem("postProfilePath", pendingPath || "/");
      initiatePayment({
        portalId,
        clickId,
        mobile,
        packType,
        price,
      });
    },
    [portalId, clickId, pendingPath],
  );

  const subscribe = useCallback(
    async (mobile: string, planId: PlanId): Promise<boolean> => {
      if (FEATURES.PAYMENTS) {
        const alreadyActive = await checkApiAccess(mobile);
        if (alreadyActive) {
          setIsModalOpen(false);
          setModalStep(1);
          const target = pendingPath || "/dashboard";
          setPendingPath(null);
          const profile = await syncBirthProfileFromApi(mobile);
          if (hasCompleteBirthProfile(profile ?? undefined)) {
            navigate(target);
          } else {
            localStorage.setItem("postProfilePath", target);
            navigate("/profile/setup");
          }
          return true;
        }
        return false;
      }

      await new Promise((r) => setTimeout(r, 800));
      const sub = createSubscription(mobile, planId);
      setSubscription(sub);
      setApiAccess(true);
      activateUser(sub);

      setIsModalOpen(false);
      setModalStep(1);

      const target = pendingPath || "/dashboard";
      setPendingPath(null);
      const profile = await syncBirthProfileFromApi(mobile);
      if (hasCompleteBirthProfile(profile ?? undefined)) {
        navigate(target);
      } else {
        localStorage.setItem("postProfilePath", target);
        navigate("/profile/setup");
      }
      return true;
    },
    [navigate, pendingPath, checkApiAccess, activateUser],
  );

  const value: SubscriptionContextType = {
    subscription,
    hasAccess,
    isModalOpen,
    pendingPath,
    modalStep,
    portalId,
    clickId,
    requestService,
    openSubscribeModal,
    closeModal,
    setModalStep,
    subscribe,
    initiateApiPayment,
    checkApiAccess,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export default SubscriptionProvider;
