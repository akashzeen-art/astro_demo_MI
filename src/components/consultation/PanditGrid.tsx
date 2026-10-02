import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  Phone,
  PhoneOff,
  Star,
  Clock,
  ShieldCheck,
  BadgeCheck,
  Languages,
  Users,
  Loader2,
  Coffee,
  Power,
  ListOrdered,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  canCallPandit,
  canJoinQueue,
  canStartSession,
  getShuffledRoster,
  isPinnedPandit,
  sessionSortRank,
  type PanditProfile,
  type PanditStatus,
} from "@/data/pandits";
import { fetchRealPandits } from "@/services/panditApi";
import {
  applyWsOverridesToPandits,
  isPanditStatusSocketConnected,
  onPanditWsStatus,
  startPanditStatusSocket,
} from "@/services/panditStatusSocket";

type RosterItem = PanditProfile & { status: PanditStatus };
type FilterMode = "all" | "available";

interface PanditGridProps {
  onCall: (pandit: RosterItem) => void;
}

const PanditGrid = ({ onCall }: PanditGridProps) => {
  const [tick, setTick] = useState(() => Date.now());
  const [filter, setFilter] = useState<FilterMode>("all");
  const [realPandits, setRealPandits] = useState<PanditProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    startPanditStatusSocket();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    fetchRealPandits()
      .then((list) => {
        if (!cancelled) setRealPandits(applyWsOverridesToPandits(list));
      })
      .catch(() => {
        if (!cancelled) {
          setRealPandits([]);
          setError("Could not load live Pandit Ji. Showing offline roster.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Live WS: update matching Pandit Ji by mobile → Available / busy / break
  useEffect(() => {
    return onPanditWsStatus(({ mobile, status }) => {
      setRealPandits((prev) =>
        prev.map((p) =>
          p.phoneNumber && p.phoneNumber === mobile
            ? { ...p, baseAvailability: status }
            : p,
        ),
      );
      setTick(Date.now());
    });
  }, []);

  // REST poll: every 15s if SockJS down, every 60s if connected (after initial load)
  useEffect(() => {
    if (loading) return;

    const refresh = () => {
      setTick(Date.now());
      fetchRealPandits({ force: true })
        .then((list) => setRealPandits(applyWsOverridesToPandits(list)))
        .catch(() => {});
    };

    let timer: number | null = null;
    const schedule = () => {
      const ms = isPanditStatusSocketConnected() ? 60_000 : 15_000;
      timer = window.setTimeout(() => {
        refresh();
        schedule();
      }, ms);
    };
    schedule();

    return () => {
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [loading]);

  const roster = useMemo(
    () => getShuffledRoster(realPandits, tick),
    [realPandits, tick],
  );

  const availableCount = roster.filter((p) => p.status === "available").length;
  const busyCount = roster.filter((p) => p.status === "busy").length;
  const breakCount = roster.filter((p) => p.status === "break").length;
  const offlineCount = roster.filter((p) => p.status === "offline").length;

  const featured =
    roster.find((p) => isPinnedPandit(p)) ||
    roster.find((p) => p.featured && p.status === "available") ||
    roster.find((p) => p.kind === "real" && p.status === "available") ||
    roster.find((p) => p.kind === "real") ||
    roster[0];

  const gridList = useMemo(() => {
    const withoutDup = featured
      ? roster.filter((p) => p.id !== featured.id)
      : roster;
    const list =
      filter === "available"
        ? withoutDup.filter((p) => p.status === "available")
        : withoutDup;
    return [...list].sort(
      (a, b) =>
        Number(isPinnedPandit(b)) - Number(isPinnedPandit(a)) ||
        sessionSortRank(a) - sessionSortRank(b),
    );
  }, [roster, featured, filter]);

  if (loading && realPandits.length === 0) {
    return (
      <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03]">
        <Loader2 className="h-7 w-7 animate-spin text-amber-300" />
        <p className="text-sm text-orange-100/50">Loading Pandit Ji...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100/80">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <StatChip
          icon={<Users className="h-3.5 w-3.5" />}
          label={`${roster.length} Pandit Ji`}
        />
        <StatChip
          tone="green"
          icon={<span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />}
          label={`${availableCount} free`}
        />
        <StatChip
          tone="rose"
          icon={<PhoneOff className="h-3 w-3" />}
          label={`${busyCount} on call`}
        />
        <StatChip
          tone="sky"
          icon={<Coffee className="h-3 w-3" />}
          label={`${breakCount} away`}
        />
        {offlineCount > 0 && (
          <StatChip
            tone="zinc"
            icon={<span className="h-2 w-2 rounded-full bg-zinc-500" />}
            label={`${offlineCount} offline`}
          />
        )}
      </div>

      {featured && (
        <FeaturedCard pandit={featured} onCall={() => onCall(featured)} />
      )}

      <div className="sticky top-[4.25rem] z-20 -mx-1 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[hsl(16_28%_8%/0.82)] px-2 py-2 backdrop-blur-xl sm:mx-0 sm:px-3">
        <div className="flex rounded-full bg-black/25 p-1">
          {(
            [
              { id: "all", label: "All" },
              { id: "available", label: "Available" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
                filter === tab.id
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow"
                  : "text-orange-100/45 hover:text-amber-100",
              )}
            >
              {tab.label}
              {tab.id === "available" ? ` (${availableCount})` : ""}
            </button>
          ))}
        </div>
        <p className="pr-1 text-[11px] text-orange-100/35">
          {gridList.length} shown
        </p>
      </div>

      {gridList.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-14 text-center">
          <Clock className="mx-auto mb-3 h-8 w-8 text-orange-100/30" />
          <p className="font-display text-lg text-amber-100/80">No one free right now</p>
          <p className="mt-1 text-sm text-orange-100/40">
            Availability updates every minute.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-5 border-white/15 text-amber-100"
            onClick={() => setFilter("all")}
          >
            Show all Pandit Ji
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 xl:grid-cols-5">
          {gridList.map((pandit, index) => (
            <PanditCard
              key={pandit.id}
              pandit={pandit}
              onCall={() => onCall(pandit)}
              style={{ animationDelay: `${Math.min(index, 14) * 35}ms` }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

function StatChip({
  label,
  icon,
  tone = "neutral",
}: {
  label: string;
  icon: ReactNode;
  tone?: "neutral" | "green" | "rose" | "sky" | "red" | "amber" | "zinc";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur-sm",
        tone === "green" && "border-green-500/30 bg-green-500/12 text-green-300",
        tone === "rose" && "border-rose-500/35 bg-rose-500/15 text-rose-200",
        tone === "sky" && "border-sky-500/35 bg-sky-500/15 text-sky-200",
        tone === "red" && "border-red-500/25 bg-red-500/10 text-red-300/90",
        tone === "amber" && "border-amber-500/25 bg-amber-500/10 text-amber-200",
        tone === "zinc" && "border-zinc-600/40 bg-zinc-800/30 text-zinc-400",
        tone === "neutral" && "border-white/10 bg-white/5 text-orange-100/65",
      )}
    >
      {icon}
      {label}
    </span>
  );
}

function FeaturedCard({
  pandit,
  onCall,
}: {
  pandit: RosterItem;
  onCall: () => void;
}) {
  const canCall = canCallPandit(pandit.status);
  const canQueue = canJoinQueue(pandit);
  const canAct = canStartSession(pandit);
  const langs = (pandit.languages || ["Hindi", "English"]).join(" · ");

  return (
    <article className="relative overflow-hidden rounded-3xl border border-amber-400/30 bg-[linear-gradient(120deg,rgba(90,35,12,0.72),rgba(28,16,12,0.82)_55%,rgba(12,18,28,0.75))] shadow-[0_24px_70px_-28px_rgba(0,0,0,0.75)]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 12% 18%, rgba(251,191,36,0.2), transparent 38%), radial-gradient(circle at 90% 80%, rgba(249,115,22,0.12), transparent 34%)",
        }}
        aria-hidden
      />

      <div className="relative grid gap-0 lg:grid-cols-[220px_1fr]">
        <div className="relative">
          <img
            src={pandit.image}
            alt=""
            className="h-72 w-full object-cover object-[center_15%] sm:h-80 lg:h-full lg:min-h-[420px]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10 lg:bg-gradient-to-r lg:from-transparent lg:via-black/10 lg:to-[rgba(20,12,8,0.7)]" />
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            <span className="rounded-full border border-amber-300/45 bg-amber-500/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-50 backdrop-blur-md">
              ★ Top pick
            </span>
            <StatusPill status={pandit.status} />
          </div>
        </div>

        <div className="flex flex-col justify-center p-4 sm:p-5">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {isPinnedPandit(pandit) && (
              <span className="inline-flex items-center gap-1 rounded-full border border-orange-400/40 bg-orange-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-100">
                Guru Maharaj
              </span>
            )}
            {pandit.verified && (
              <span className="inline-flex items-center gap-1 rounded-full border border-teal-400/25 bg-teal-500/10 px-2 py-0.5 text-[10px] font-medium text-teal-200">
                <BadgeCheck className="h-3 w-3" />
                Verified
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-orange-100/60">
              <Languages className="h-3 w-3" />
              {langs}
            </span>
          </div>

          <h2 className="font-display text-xl font-bold leading-none text-amber-50 sm:text-2xl">
            {pandit.name}
          </h2>
          <p className="mt-0.5 text-xs font-medium text-amber-300/85">{pandit.title}</p>
          <p className="mt-1 max-w-xl text-xs leading-snug text-orange-100/55">
            {pandit.specialty} · private live voice guidance
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <MetaBadge>
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {pandit.rating.toFixed(1)}
            </MetaBadge>
            <MetaBadge>{pandit.sessions.toLocaleString()}+ sessions</MetaBadge>
            <MetaBadge>{pandit.experienceYears}+ yrs</MetaBadge>
            {pandit.trusted && (
              <MetaBadge>
                <ShieldCheck className="h-3 w-3 text-teal-300" />
                Trusted
              </MetaBadge>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              onClick={onCall}
              disabled={!canAct}
              className={cn(
                "h-11 min-w-[200px] rounded-full px-6 text-sm font-bold shadow-lg",
                canCall
                  ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-green-500/30 hover:from-green-600 hover:to-emerald-600 animate-call-blink"
                  : canQueue
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-amber-500/30 hover:from-amber-400 hover:to-orange-400 animate-queue-blink"
                    : pandit.status === "break"
                    ? "cursor-not-allowed border border-sky-400/25 bg-sky-500/15 text-sky-100/70 shadow-none"
                    : pandit.status === "offline"
                      ? "cursor-not-allowed border border-zinc-600/40 bg-zinc-800/30 text-zinc-400 shadow-none"
                      : "cursor-not-allowed border border-rose-400/25 bg-rose-500/15 text-rose-100/70 shadow-none",
              )}
            >
              {canCall ? (
                <>
                  <Phone className="mr-2 h-4 w-4" />
                  Click to Call
                </>
              ) : canQueue ? (
                <>
                  <ListOrdered className="mr-2 h-4 w-4" />
                  Queued
                </>
              ) : pandit.status === "break" ? (
                <>
                  <Coffee className="mr-2 h-4 w-4" />
                  Away — try later
                </>
              ) : pandit.status === "offline" ? (
                <>
                  <Power className="mr-2 h-4 w-4" />
                  Offline
                </>
              ) : (
                <>
                  <PhoneOff className="mr-2 h-4 w-4" />
                  On a Call — busy
                </>
              )}
            </Button>
            <p className="text-[11px] text-orange-100/40">
              {canCall
                ? "Choose a talk pack · instant connect"
                : canQueue
                  ? "Join the queue · connect when free"
                  : pandit.status === "break"
                  ? "Away for a while · pick another Pandit Ji"
                  : pandit.status === "offline"
                    ? "Currently offline · pick another Pandit Ji"
                    : "Speaking with someone · pick another Pandit Ji"}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

function PanditCard({
  pandit,
  onCall,
  style,
}: {
  pandit: RosterItem;
  onCall: () => void;
  style?: CSSProperties;
}) {
  const canCall = canCallPandit(pandit.status);
  const canQueue = canJoinQueue(pandit);
  const canAct = canStartSession(pandit);

  return (
    <button
      type="button"
      onClick={() => {
        if (canAct) onCall();
      }}
      disabled={!canAct}
      style={style}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border text-left transition-all duration-300",
        "bg-white/[0.03] shadow-[0_12px_36px_-20px_rgba(0,0,0,0.8)] animate-[fadeUp_0.45s_ease_both]",
        canCall
          ? "border-green-500/25 hover:-translate-y-1.5 hover:border-green-400/50 hover:shadow-[0_20px_44px_-16px_rgba(34,197,94,0.35)] cursor-pointer"
          : canQueue
            ? "border-amber-500/35 hover:-translate-y-1 hover:border-amber-400/55 cursor-pointer"
            : pandit.status === "break"
            ? "border-sky-500/30 opacity-90 cursor-not-allowed"
            : pandit.status === "offline"
              ? "border-zinc-600/30 opacity-75 cursor-not-allowed"
              : "border-rose-500/30 opacity-90 cursor-not-allowed",
      )}
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={pandit.image}
          alt=""
          className={cn(
            "h-full w-full object-cover object-top transition-transform duration-500",
            canCall && "group-hover:scale-[1.05]",
            canQueue && "group-hover:scale-[1.02]",
            pandit.status === "busy" && !canQueue && "grayscale-[35%] brightness-[0.65] saturate-50",
            pandit.status === "busy" && canQueue && "brightness-[0.8] saturate-80",
            pandit.status === "break" && "brightness-[0.75] saturate-75",
            pandit.status === "offline" && "grayscale-[60%] brightness-[0.5] saturate-25",
          )}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
        {/* Status color wash */}
        {pandit.status === "busy" && (
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-rose-950/55 via-rose-900/15 to-transparent"
            aria-hidden
          />
        )}
        {pandit.status === "break" && (
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-sky-950/50 via-sky-900/10 to-transparent"
            aria-hidden
          />
        )}
        {pandit.status === "offline" && (
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/60 via-zinc-900/20 to-transparent"
            aria-hidden
          />
        )}
        {canCall && (
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-green-950/35 via-transparent to-transparent"
            aria-hidden
          />
        )}

        <div className="absolute left-2 top-2">
          <StatusPill status={pandit.status} compact />
        </div>
        <div className="absolute right-2 top-2 rounded-full border border-white/15 bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-amber-100 backdrop-blur-sm">
          <span className="inline-flex items-center gap-0.5">
            <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
            {pandit.rating.toFixed(1)}
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-0 space-y-0.5 p-2.5">
          <p className="font-display text-[12px] font-semibold leading-tight text-white line-clamp-2 sm:text-[13px]">
            {pandit.name}
          </p>
          <p className="text-[10px] leading-tight text-amber-100/65 line-clamp-1">
            {pandit.title}
          </p>
          <div className="flex items-center justify-between gap-2 text-[10px] text-white/45">
            <span>{pandit.experienceYears}+ yrs</span>
            <span>
              {pandit.sessions >= 1000
                ? `${(pandit.sessions / 1000).toFixed(1)}k`
                : pandit.sessions}
              +
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-white/5 p-2.5">
        {canCall ? (
          <span className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-[11px] font-bold text-white shadow-md shadow-green-500/25 transition animate-call-blink group-hover:from-green-400 group-hover:to-emerald-500">
            <Phone className="h-3.5 w-3.5" />
            Click to Call
          </span>
        ) : canQueue ? (
          <span className="flex h-9 w-full flex-col items-center justify-center gap-0 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-md shadow-amber-500/25 animate-queue-blink">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold">
              <ListOrdered className="h-3.5 w-3.5" />
              Queued
            </span>
            <span className="text-[9px] font-semibold">Tap to join queue</span>
          </span>
        ) : pandit.status === "break" ? (
          <span className="flex h-9 w-full flex-col items-center justify-center gap-0 rounded-xl border border-sky-400/35 bg-sky-500/15 text-sky-100">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold">
              <Coffee className="h-3.5 w-3.5" />
              Away
            </span>
            <span className="text-[9px] font-medium text-sky-200/70">Back shortly</span>
          </span>
        ) : pandit.status === "offline" ? (
          <span className="flex h-9 w-full flex-col items-center justify-center gap-0 rounded-xl border border-zinc-600/35 bg-zinc-800/30 text-zinc-400">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold">
              <Power className="h-3.5 w-3.5" />
              Offline
            </span>
          </span>
        ) : (
          <span className="flex h-9 w-full flex-col items-center justify-center gap-0 rounded-xl border border-rose-400/35 bg-rose-500/15 text-rose-100">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold">
              <PhoneOff className="h-3.5 w-3.5" />
              On a Call
            </span>
            <span className="text-[9px] font-medium text-rose-200/70">Busy now</span>
          </span>
        )}
      </div>
    </button>
  );
}

function StatusPill({
  status,
  compact = false,
}: {
  status: PanditStatus;
  compact?: boolean;
}) {
  if (status === "available") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border font-semibold backdrop-blur-md shadow",
          "border-green-400/45 bg-green-500/30 text-green-50",
          compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]",
        )}
      >
        <span
          className={cn(
            "rounded-full bg-green-400 animate-pulse",
            compact ? "h-1.5 w-1.5" : "h-2 w-2",
          )}
        />
        Available
      </span>
    );
  }

  if (status === "break") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full border font-semibold backdrop-blur-md shadow",
          "border-sky-400/45 bg-sky-600/40 text-sky-50",
          compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]",
        )}
      >
        <Coffee className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
        Away
      </span>
    );
  }

  // busy
  if (status === "busy") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full border font-semibold backdrop-blur-md shadow",
          "border-rose-400/45 bg-rose-600/40 text-rose-50",
          compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]",
        )}
      >
        <PhoneOff className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
        On Call
      </span>
    );
  }

  // offline
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-semibold backdrop-blur-md shadow",
        "border-zinc-500/45 bg-zinc-700/40 text-zinc-300",
        compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]",
      )}
    >
      <Power className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
      Offline
    </span>
  );
}

function MetaBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-[10px] text-orange-100/70 backdrop-blur-sm">
      {children}
    </span>
  );
}

export default PanditGrid;
export type { RosterItem };
