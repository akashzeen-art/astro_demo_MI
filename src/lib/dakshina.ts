/** User-facing label for call / checkout packs (Hindi + English). */
export const DAKSHINA = {
  title: "दक्षिणा",
  english: "Dakshina",
  chooseTitle: "दक्षिणा चुनें",
  chooseHint: "अपना दक्षिणा पैकेज चुनें और मोबाइल नंबर दर्ज करें",
  packages: "दक्षिणा पैकेज",
  payButton: "दक्षिणा दें",
  completeOrder: "दक्षिणा दें · ऑर्डर पूरा करें",
} as const;

/** UI label for break status (API still uses BREAK). */
export function panditStatusDisplayLabel(status: string): string {
  const s = (status || "").trim().toLowerCase();
  if (s === "break" || s === "on_break" || s === "onbreak") return "Away";
  if (s === "available" || s === "online" || s === "free") return "Available";
  if (s === "offline") return "Offline";
  if (s === "busy" || s === "on_call") return "Busy";
  const upper = (status || "").trim().toUpperCase();
  if (upper === "BREAK" || upper === "ON_BREAK") return "Away";
  if (upper === "AVAILABLE") return "Available";
  if (upper === "OFFLINE") return "Offline";
  if (upper === "BUSY") return "Busy";
  return status;
}
