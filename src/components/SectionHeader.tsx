import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: string;
  badgeIcon?: LucideIcon;
  className?: string;
  align?: "center" | "left";
  ornament?: boolean;
}

const SectionHeader = ({
  eyebrow,
  title,
  subtitle,
  badgeIcon: BadgeIcon,
  className,
  align = "center",
  ornament = true,
}: SectionHeaderProps) => (
  <div
    className={cn(
      "mb-10 md:mb-12",
      align === "center" ? "text-center max-w-3xl mx-auto" : "text-left max-w-2xl",
      className
    )}
  >
    {eyebrow && (
      <Badge
        variant="outline"
        className="mb-4 px-3 py-1.5 text-xs sm:text-sm border-orange-500/40 text-teal-300/90 bg-teal-900/20"
      >
        {BadgeIcon && <BadgeIcon className="h-3.5 w-3.5 mr-1.5 inline" />}
        {eyebrow}
      </Badge>
    )}

    {ornament && align === "center" && (
      <div className="section-ornament" aria-hidden>
        <span className="font-display text-amber-400/40 text-lg">✦</span>
      </div>
    )}

    <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-amber-50 mb-3 leading-tight">
      {title}
    </h2>

    <div className={cn("sutra-divider mb-4", align === "center" ? "max-w-xs mx-auto" : "max-w-[8rem]")} />

    {subtitle && (
      <p className="text-sm md:text-base text-orange-100/55 leading-relaxed">{subtitle}</p>
    )}
  </div>
);

export default SectionHeader;
