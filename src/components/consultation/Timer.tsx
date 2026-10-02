import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TimerProps {
  totalSeconds: number;
  onWarning?: () => void;
  onExpired?: () => void;
  warningAt?: number;
  onTick?: (remaining: number) => void;
}

const Timer = ({
  totalSeconds,
  onWarning,
  onExpired,
  warningAt = 120,
  onTick,
}: TimerProps) => {
  const [remaining, setRemaining] = useState(totalSeconds);
  const [warned, setWarned] = useState(false);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    setRemaining(totalSeconds);
    setWarned(false);
  }, [totalSeconds]);

  useEffect(() => {
    if (remaining <= 0) {
      onExpired?.();
      return;
    }
    if (remaining <= warningAt && !warned) {
      setWarned(true);
      onWarning?.();
    }

    const t = window.setTimeout(() => {
      setRemaining((r) => r - 1);
      setPulse(true);
      window.setTimeout(() => setPulse(false), 180);
    }, 1000);

    return () => window.clearTimeout(t);
  }, [remaining, warned, warningAt, onWarning, onExpired]);

  useEffect(() => {
    onTick?.(remaining);
  }, [remaining, onTick]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const display = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  const pct = Math.max(0, Math.min(100, (remaining / Math.max(totalSeconds, 1)) * 100));
  const isCritical = remaining <= 60;
  const isLow = remaining <= warningAt;
  const size = 168;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={isCritical ? "#f87171" : isLow ? "#fbbf24" : "#4ade80"}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-1000 ease-linear"
            style={{
              filter: isLow
                ? "drop-shadow(0 0 8px rgba(251,191,36,0.45))"
                : "drop-shadow(0 0 8px rgba(74,222,128,0.35))",
            }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p
            className={cn(
              "font-mono text-4xl font-bold tracking-[0.12em] tabular-nums transition-transform duration-150",
              isCritical && "text-red-400 animate-pulse",
              isLow && !isCritical && "text-amber-300",
              !isLow && "text-white",
              pulse && "scale-105",
            )}
          >
            {display}
          </p>
          <p
            className={cn(
              "mt-1 text-[11px] font-medium uppercase tracking-[0.18em]",
              isCritical ? "text-red-300/80" : isLow ? "text-amber-200/70" : "text-white/45",
            )}
          >
            {isCritical ? "Ending soon" : isLow ? "Low time" : "Remaining"}
          </p>
        </div>
      </div>

      <div className="w-52 space-y-1.5">
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-1000 ease-linear",
              isCritical ? "bg-red-400" : isLow ? "bg-amber-400" : "bg-green-400",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-center text-xs text-white/45">
          {mins > 0 ? `${mins} min ${secs} sec left` : `${secs} sec left`}
        </p>
      </div>
    </div>
  );
};

export default Timer;
