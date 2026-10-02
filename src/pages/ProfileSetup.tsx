import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  hasCompleteBirthProfile,
  loadBirthProfile,
  saveBirthProfile,
  syncBirthProfileFromApi,
  type BirthProfile,
  type BirthProfileInput,
} from "@/services/userProfileApi";
import { normalizeMobile } from "@/lib/subscription";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  UserRound,
} from "lucide-react";

const INDIAN_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

const MONTHS = [
  { value: "01", label: "Jan" },
  { value: "02", label: "Feb" },
  { value: "03", label: "Mar" },
  { value: "04", label: "Apr" },
  { value: "05", label: "May" },
  { value: "06", label: "Jun" },
  { value: "07", label: "Jul" },
  { value: "08", label: "Aug" },
  { value: "09", label: "Sep" },
  { value: "10", label: "Oct" },
  { value: "11", label: "Nov" },
  { value: "12", label: "Dec" },
];

const HOURS_12 = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => String(CURRENT_YEAR - i));

function daysInMonth(year: string, month: string): number {
  if (!year || !month) return 31;
  return new Date(Number(year), Number(month), 0).getDate();
}

function parseBirthDate(iso: string) {
  const [y = "", m = "", d = ""] = (iso || "").split("-");
  return { year: y, month: m, day: d };
}

function parseBirthTime(value: string) {
  if (!value) return { hour: "", minute: "", period: "AM" as const };
  const [hRaw = "", mRaw = "00"] = value.split(":");
  const h24 = Number(hRaw);
  if (Number.isNaN(h24)) return { hour: "", minute: "", period: "AM" as const };
  const period = h24 >= 12 ? ("PM" as const) : ("AM" as const);
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const minuteNum = Number(mRaw);
  const snapped = Math.round(minuteNum / 5) * 5;
  const minute = String(snapped === 60 ? 55 : snapped).padStart(2, "0");
  return { hour: String(h12).padStart(2, "0"), minute, period };
}

function toIsoDate(day: string, month: string, year: string) {
  if (!day || !month || !year) return "";
  return `${year}-${month}-${day.padStart(2, "0")}`;
}

function to24HourTime(hour: string, minute: string, period: "AM" | "PM") {
  if (!hour || !minute) return "";
  let h = Number(hour);
  if (period === "AM") {
    h = h === 12 ? 0 : h;
  } else {
    h = h === 12 ? 12 : h + 12;
  }
  return `${String(h).padStart(2, "0")}:${minute}`;
}

const fieldClass =
  "h-12 w-full rounded-xl border border-white/12 bg-black/25 px-3 text-sm text-amber-50 outline-none transition focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20";

const ProfileSetup = () => {
  const navigate = useNavigate();
  const existing = useMemo(() => loadBirthProfile(), []);
  const storedMobile = normalizeMobile(
    existing?.mobile || localStorage.getItem("userMobile") || "",
  );

  const initialDate = parseBirthDate(existing?.birthDate || "");
  const initialTime = parseBirthTime(existing?.birthTime || "");

  const [day, setDay] = useState(initialDate.day);
  const [month, setMonth] = useState(initialDate.month);
  const [year, setYear] = useState(initialDate.year);
  const [hour, setHour] = useState(initialTime.hour);
  const [minute, setMinute] = useState(initialTime.minute);
  const [period, setPeriod] = useState<"AM" | "PM">(initialTime.period);
  const [unknownTime, setUnknownTime] = useState(false);

  const [form, setForm] = useState({
    birthCity: existing?.birthCity || "",
    birthState: existing?.birthState || "",
    fullName: existing?.fullName || "",
    gender: existing?.gender || "",
    mobile: storedMobile,
    occupation: existing?.occupation || "",
    maritalStatus: existing?.maritalStatus || "",
    timezone: existing?.timezone || "Asia/Kolkata",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [syncPending, setSyncPending] = useState(false);
  const [hydrating, setHydrating] = useState(!hasCompleteBirthProfile(existing));

  const applyProfile = (profile: BirthProfile) => {
    const date = parseBirthDate(profile.birthDate);
    const time = parseBirthTime(profile.birthTime);
    setDay(date.day);
    setMonth(date.month);
    setYear(date.year);
    setHour(time.hour);
    setMinute(time.minute);
    setPeriod(time.period);
    setForm({
      birthCity: profile.birthCity || "",
      birthState: profile.birthState || "",
      fullName: profile.fullName || "",
      gender: profile.gender || "",
      mobile: normalizeMobile(profile.mobile || storedMobile),
      occupation: profile.occupation || "",
      maritalStatus: profile.maritalStatus || "",
      timezone: profile.timezone || "Asia/Kolkata",
    });
  };

  useEffect(() => {
    let cancelled = false;
    const mobile = normalizeMobile(
      existing?.mobile || localStorage.getItem("userMobile") || "",
    );

    if (hasCompleteBirthProfile(existing)) {
      setHydrating(false);
      return;
    }

    syncBirthProfileFromApi(mobile)
      .then((profile) => {
        if (cancelled || !profile) return;
        applyProfile(profile);
        // Already complete on server — skip form and continue
        if (hasCompleteBirthProfile(profile)) {
          const destination = localStorage.getItem("postProfilePath") || "/";
          localStorage.removeItem("postProfilePath");
          navigate(destination, { replace: true });
        }
      })
      .finally(() => {
        if (!cancelled) setHydrating(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maxDay = daysInMonth(year, month);
  const dayOptions = useMemo(
    () => Array.from({ length: maxDay }, (_, i) => String(i + 1).padStart(2, "0")),
    [maxDay],
  );

  const update = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
  };

  const onMonthOrYearChange = (nextMonth: string, nextYear: string) => {
    setMonth(nextMonth);
    setYear(nextYear);
    const max = daysInMonth(nextYear, nextMonth);
    if (day && Number(day) > max) setDay(String(max).padStart(2, "0"));
    setError("");
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const mobile = normalizeMobile(form.mobile);
    const birthDate = toIsoDate(day, month, year);
    const birthTime = unknownTime
      ? "12:00"
      : to24HourTime(hour, minute, period);

    if (
      !birthDate ||
      !birthTime ||
      !form.birthCity.trim() ||
      !form.birthState.trim() ||
      !form.fullName.trim() ||
      !form.gender ||
      mobile.length !== 10
    ) {
      setError("Please complete all required fields.");
      return;
    }

    const birthDateObj = new Date(`${birthDate}T12:00:00`);
    if (Number.isNaN(birthDateObj.getTime()) || birthDateObj > new Date()) {
      setError("Please enter a valid date of birth.");
      return;
    }

    const payload: BirthProfileInput = {
      birthDate,
      birthTime,
      birthCity: form.birthCity,
      birthState: form.birthState,
      fullName: form.fullName,
      gender: form.gender,
      mobile,
      occupation: form.occupation,
      maritalStatus: form.maritalStatus,
      timezone: form.timezone,
    };

    setSaving(true);
    const { synced } = await saveBirthProfile(payload);
    setSyncPending(!synced);
    localStorage.setItem("userMobile", mobile);
    localStorage.setItem("profileSetupComplete", "true");
    const destination = localStorage.getItem("postProfilePath") || "/";
    localStorage.removeItem("postProfilePath");
    setSaving(false);

    if (synced) {
      navigate(destination, { replace: true });
    } else {
      window.setTimeout(() => navigate(destination, { replace: true }), 1400);
    }
  };

  return (
    <Layout>
      <div className="sutra-page mx-auto max-w-xl px-4 py-6 sm:py-8">
        {hydrating ? (
          <div className="sutra-panel flex min-h-[40vh] flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-400/30 border-t-amber-400" />
            <p className="text-sm text-orange-100/50">Checking your saved profile...</p>
          </div>
        ) : (
        <div className="sutra-panel overflow-hidden p-0">
          <div className="border-b border-white/8 bg-gradient-to-br from-amber-500/10 via-transparent to-orange-500/5 px-5 py-6 text-center sm:px-7">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-amber-400/30 bg-amber-500/10">
              <UserRound className="h-6 w-6 text-amber-300" />
            </div>
            <h1 className="font-display text-2xl font-bold text-amber-50">
              Birth Profile
            </h1>
            <p className="mx-auto mt-1.5 max-w-sm text-sm leading-snug text-orange-100/50">
              Quick details for accurate Kundli, horoscope &amp; Pandit Ji guidance.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-5 px-5 py-6 sm:px-7">
            {/* DOB */}
            <section className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 text-xs font-bold text-amber-300">
                  1
                </span>
                <div>
                  <p className="text-sm font-semibold text-amber-50">Date of birth</p>
                  <p className="text-[11px] text-orange-100/40">Day · Month · Year</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <FieldSelect
                  ariaLabel="Day"
                  value={day}
                  onChange={setDay}
                  placeholder="Day"
                >
                  {dayOptions.map((d) => (
                    <option key={d} value={d}>
                      {Number(d)}
                    </option>
                  ))}
                </FieldSelect>
                <FieldSelect
                  ariaLabel="Month"
                  value={month}
                  onChange={(v) => onMonthOrYearChange(v, year)}
                  placeholder="Month"
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </FieldSelect>
                <FieldSelect
                  ariaLabel="Year"
                  value={year}
                  onChange={(v) => onMonthOrYearChange(month, v)}
                  placeholder="Year"
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </FieldSelect>
              </div>
            </section>

            {/* Time */}
            <section className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 text-xs font-bold text-amber-300">
                  2
                </span>
                <div>
                  <p className="text-sm font-semibold text-amber-50">Time of birth</p>
                  <p className="text-[11px] text-orange-100/40">Hour · Minute · AM/PM</p>
                </div>
              </div>

              <div
                className={cn(
                  "grid grid-cols-[1fr_1fr_auto] gap-2",
                  unknownTime && "pointer-events-none opacity-40",
                )}
              >
                <FieldSelect
                  ariaLabel="Hour"
                  value={hour}
                  onChange={setHour}
                  placeholder="Hour"
                  disabled={unknownTime}
                >
                  {HOURS_12.map((h) => (
                    <option key={h} value={h}>
                      {Number(h)}
                    </option>
                  ))}
                </FieldSelect>
                <FieldSelect
                  ariaLabel="Minute"
                  value={minute}
                  onChange={setMinute}
                  placeholder="Min"
                  disabled={unknownTime}
                >
                  {MINUTES.map((m) => (
                    <option key={m} value={m}>
                      :{m}
                    </option>
                  ))}
                </FieldSelect>
                <div className="flex rounded-xl border border-white/12 bg-black/25 p-1">
                  {(["AM", "PM"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      disabled={unknownTime}
                      onClick={() => {
                        setPeriod(p);
                        setError("");
                      }}
                      className={cn(
                        "h-10 min-w-[2.75rem] rounded-lg text-xs font-bold transition",
                        period === p
                          ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow"
                          : "text-orange-100/45 hover:text-amber-100",
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setUnknownTime((v) => !v);
                  setError("");
                }}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium transition",
                  unknownTime
                    ? "border-amber-400/40 bg-amber-500/15 text-amber-200"
                    : "border-white/10 bg-white/5 text-orange-100/50 hover:text-amber-100",
                )}
              >
                <Clock3 className="h-3.5 w-3.5" />
                {unknownTime ? "Using noon (12:00 PM) — tap to set exact time" : "I don't know exact time"}
              </button>
            </section>

            {/* Place */}
            <section className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 text-xs font-bold text-amber-300">
                  3
                </span>
                <div>
                  <p className="text-sm font-semibold text-amber-50">Place of birth</p>
                  <p className="text-[11px] text-orange-100/40">City and state</p>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-400/50" />
                  <Input
                    value={form.birthCity}
                    onChange={(e) => update("birthCity", e.target.value)}
                    placeholder="City"
                    className={cn(fieldClass, "pl-9")}
                    required
                  />
                </div>
                <FieldSelect
                  ariaLabel="State"
                  value={form.birthState}
                  onChange={(v) => update("birthState", v)}
                  placeholder="State / UT"
                >
                  {INDIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </FieldSelect>
              </div>
            </section>

            {/* Name + Gender */}
            <section className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 text-xs font-bold text-amber-300">
                  4
                </span>
                <div>
                  <p className="text-sm font-semibold text-amber-50">About you</p>
                  <p className="text-[11px] text-orange-100/40">Name and gender</p>
                </div>
              </div>
              <Input
                value={form.fullName}
                onChange={(e) => update("fullName", e.target.value)}
                placeholder="Full name"
                className={fieldClass}
                required
              />
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "male", label: "Male" },
                  { id: "female", label: "Female" },
                  { id: "other", label: "Other" },
                ].map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => update("gender", g.id)}
                    className={cn(
                      "h-11 rounded-xl border text-sm font-semibold transition",
                      form.gender === g.id
                        ? "border-amber-400/50 bg-amber-500/20 text-amber-100"
                        : "border-white/10 bg-black/20 text-orange-100/50 hover:border-amber-400/25 hover:text-amber-100",
                    )}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Mobile */}
            <section className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 text-xs font-bold text-amber-300">
                  5
                </span>
                <p className="text-sm font-semibold text-amber-50">Mobile number</p>
              </div>
              <div className="flex">
                <span className="flex h-12 items-center rounded-l-xl border border-r-0 border-white/12 bg-black/35 px-3 text-sm font-semibold text-amber-300">
                  +91
                </span>
                <Input
                  inputMode="numeric"
                  value={form.mobile}
                  onChange={(e) =>
                    update("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  placeholder="10-digit number"
                  className={cn(fieldClass, "rounded-l-none")}
                  required
                />
              </div>
            </section>

            {/* Optional */}
            <section className="space-y-2.5 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-3.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-orange-100/40">
                Optional
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  value={form.occupation}
                  onChange={(e) => update("occupation", e.target.value)}
                  placeholder="Occupation"
                  className={fieldClass}
                />
                <FieldSelect
                  ariaLabel="Marital status"
                  value={form.maritalStatus}
                  onChange={(v) => update("maritalStatus", v)}
                  placeholder="Marital status"
                >
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="divorced">Divorced</option>
                  <option value="widowed">Widowed</option>
                </FieldSelect>
              </div>
            </section>

            {error && (
              <p className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            )}
            {syncPending && (
              <p className="flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Saved on this device. Sync will retry when the API is available.
              </p>
            )}

            <Button
              type="submit"
              disabled={saving}
              className="h-12 w-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-sm font-bold text-white shadow-lg shadow-orange-500/25"
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? "Saving..." : "Save and Continue"}
            </Button>
            <p className="text-center text-[11px] text-orange-100/35">
              Used only to personalize your readings. Never shared publicly.
            </p>
          </form>
        </div>
        )}
      </div>
    </Layout>
  );
};

function FieldSelect({
  value,
  onChange,
  placeholder,
  children,
  ariaLabel,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  children: ReactNode;
  ariaLabel: string;
  disabled?: boolean;
}) {
  return (
    <select
      aria-label={ariaLabel}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        fieldClass,
        "appearance-none pr-8",
        !value && "text-orange-100/35",
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23fbbf24' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 0.75rem center",
      }}
    >
      <option value="" className="bg-slate-950">
        {placeholder}
      </option>
      {children}
    </select>
  );
}

export default ProfileSetup;
