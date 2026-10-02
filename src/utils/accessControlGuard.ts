import {
  checkUserStatus,
  isUserSubscribed,
} from "@/services/userStatusApi";
import { PAYMENT_CONFIG } from "@/lib/config";
import { getPortalIdFromParams } from "@/utils/clickIdManager";

export const verifyAccessWithAPI = async (
  mobile: string,
  portalId: string,
) => {
  if (
    !mobile ||
    mobile.trim() === "" ||
    mobile === "undefined" ||
    mobile === "null"
  ) {
    return false;
  }

  if (!portalId) {
    return false;
  }

  try {
    const statusData = await checkUserStatus(mobile, portalId);
    return isUserSubscribed(statusData);
  } catch {
    return false;
  }
};

export const clearSubscriptionCache = () => {
  localStorage.removeItem("isSubscribed");
  localStorage.removeItem("subscriptionData");
};

export const getMobileForVerification = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const msisdn = urlParams.get("msisdn");

  if (
    msisdn &&
    msisdn.trim() !== "" &&
    msisdn !== "undefined" &&
    msisdn !== "null"
  ) {
    const cleanMobile = msisdn.trim();
    localStorage.setItem("userMobile", cleanMobile);
    return cleanMobile;
  }

  const storedMobile = localStorage.getItem("userMobile");
  if (
    storedMobile &&
    storedMobile.trim() !== "" &&
    storedMobile !== "undefined" &&
    storedMobile !== "null"
  ) {
    return storedMobile.trim();
  }

  return null;
};

export const getPortalIdForVerification = () => {
  return getPortalIdFromParams() || PAYMENT_CONFIG.DEFAULT_PORTAL_ID;
};
