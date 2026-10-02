import {
  checkUserStatus,
  isUserSubscribed,
} from "@/services/userStatusApi";
import { PAYMENT_CONFIG } from "@/lib/config";
import { getPortalIdFromParams } from "@/utils/clickIdManager";

export const handleLoginSuccess = async (
  mobile: string,
  portalId: string = PAYMENT_CONFIG.DEFAULT_PORTAL_ID,
) => {
  if (!mobile || mobile.trim() === "") {
    return false;
  }

  const cleanMobile = mobile.trim();

  try {
    const statusData = await checkUserStatus(cleanMobile, portalId);
    const isActive = isUserSubscribed(statusData);

    if (isActive) {
      const newUrl = `${window.location.origin}/?msisdn=${cleanMobile}&id=${portalId}`;

      localStorage.setItem("isSubscribed", "true");
      localStorage.setItem("userMobile", cleanMobile);
      localStorage.setItem("subscriptionData", JSON.stringify(statusData));

      window.location.replace(newUrl);
      return true;
    }

    localStorage.removeItem("isSubscribed");
    localStorage.removeItem("subscriptionData");
    localStorage.setItem("userMobile", cleanMobile);
    return false;
  } catch {
    localStorage.removeItem("isSubscribed");
    localStorage.removeItem("subscriptionData");
    localStorage.setItem("userMobile", cleanMobile);
    return false;
  }
};

export const handleLoggedInUserPageLoad = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const hasClickId = urlParams.has("clickid");
  const hasMsisdn = urlParams.has("msisdn");

  if (!hasClickId || hasMsisdn) {
    return false;
  }

  const storedMobile = localStorage.getItem("userMobile");
  if (!storedMobile) {
    return false;
  }

  const portalId = getPortalIdFromParams() || PAYMENT_CONFIG.DEFAULT_PORTAL_ID;

  try {
    const statusData = await checkUserStatus(storedMobile, portalId);
    const isActive = isUserSubscribed(statusData);

    if (isActive) {
      const newUrl = `${window.location.origin}/?msisdn=${storedMobile}&id=${portalId}`;

      localStorage.setItem("isSubscribed", "true");
      localStorage.setItem("subscriptionData", JSON.stringify(statusData));

      window.location.replace(newUrl);
      return true;
    }

    localStorage.removeItem("isSubscribed");
    localStorage.removeItem("subscriptionData");
    return false;
  } catch {
    return false;
  }
};
