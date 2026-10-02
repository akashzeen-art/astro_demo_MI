import { CALL_PAYMENT_CONFIG, PAYMENT_CONFIG } from "@/lib/config";

const STORAGE_PREFIX = "myastrosutra";

const generateUUID = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const generateClickId = () => `0000${generateUUID()}`;

export const validateClickId = (clickId: string | null) => {
  if (
    !clickId ||
    clickId === "null" ||
    clickId === "undefined" ||
    clickId === "NaN" ||
    clickId === ""
  ) {
    return false;
  }
  return true;
};

export const getOrGenerateClickId = (portalId: string) => {
  const storageKey = `${STORAGE_PREFIX}_clickid_${portalId}`;
  const storedClickId = localStorage.getItem(storageKey);
  if (storedClickId && validateClickId(storedClickId)) {
    return storedClickId;
  }
  const newClickId = generateClickId();
  localStorage.setItem(storageKey, newClickId);
  return newClickId;
};

export const getClickIdFromUrl = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("clickid");
};

/** Portal is fixed to PAYMENT_CONFIG.DEFAULT_PORTAL_ID; only the call-pack payment return (id=1015) is honoured */
export const getPortalIdFromParams = (searchParams?: URLSearchParams) => {
  const params = searchParams ?? new URLSearchParams(window.location.search);
  const fromUrl = params.get("id") || params.get("portalId");
  return fromUrl === CALL_PAYMENT_CONFIG.PORTAL_ID ? fromUrl : PAYMENT_CONFIG.DEFAULT_PORTAL_ID;
};

export const getPortalIdFromUrl = () => {
  const portalId = getPortalIdFromParams();
  localStorage.setItem(`${STORAGE_PREFIX}_portal_id`, portalId);
  return portalId;
};

export const getMsisdnFromUrl = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("msisdn");
};

export const updateUrlWithClickId = (clickId: string, portalId: string) => {
  const url = new URL(window.location.href);
  const existingMsisdn = url.searchParams.get("msisdn");

  url.searchParams.delete("clickid");
  url.searchParams.delete("id");
  url.searchParams.delete("portalId");
  if (existingMsisdn) {
    url.searchParams.set("msisdn", existingMsisdn);
  }

  window.history.replaceState({}, "", url.toString());
};

export const initializeClickId = () => {
  const url = new URL(window.location.href);
  const portalId = getPortalIdFromParams(url.searchParams);
  const clickId = url.searchParams.get("clickid");
  const msisdn = url.searchParams.get("msisdn");

  const storageKey = `${STORAGE_PREFIX}_clickid_${portalId}`;

  if (validateClickId(clickId)) {
    localStorage.setItem(storageKey, clickId!);
  }

  localStorage.setItem(`${STORAGE_PREFIX}_portal_id`, portalId);
  url.searchParams.delete("clickid");
  url.searchParams.delete("id");
  url.searchParams.delete("portalId");
  if (msisdn) url.searchParams.set("msisdn", msisdn);
  window.history.replaceState({}, "", url.toString());

  if (validateClickId(clickId)) {
    return { clickId: clickId!, portalId };
  }

  const storedClickId = localStorage.getItem(storageKey);
  if (validateClickId(storedClickId)) {
    return { clickId: storedClickId!, portalId };
  }

  const newClickId = generateClickId();
  localStorage.setItem(storageKey, newClickId);
  return { clickId: newClickId, portalId };
};
