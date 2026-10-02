import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  highlight?: string;
  subtitle?: string;
  badge?: string;
  badgeIcon?: LucideIcon;
  backTo?: string;
  backLabel?: string;
}

const PageHeader = ({
  title,
  highlight,
  subtitle,
  badge,
  badgeIcon: BadgeIcon,
  backTo = "/",
  backLabel = "Back to Home",
}: PageHeaderProps) => (
  <div className="mb-8 md:mb-10">
    {backTo && (
      <div className="mb-4">
        <Link to={backTo}>
          <Button
            variant="outline"
            size="sm"
            className="border-orange-500/30 text-amber-300/80 hover:bg-orange-500/10 bg-orange-950/20 text-xs sm:text-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            {backLabel}
          </Button>
        </Link>
      </div>
    )}
    <div className="text-center max-w-3xl mx-auto">
      {badge && (
        <Badge
          variant="outline"
          className="mb-3 px-3 py-1.5 text-xs sm:text-sm border-orange-500/40 text-amber-300 bg-orange-500/10"
        >
          {BadgeIcon && <BadgeIcon className="h-3.5 w-3.5 mr-1.5 inline" />}
          {badge}
        </Badge>
      )}
      <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-amber-50 mb-3">
        {title}
        {highlight && (
          <>
            {" "}
            <span className="sutra-text">{highlight}</span>
          </>
        )}
      </h1>
      {subtitle && (
        <p className="text-sm md:text-base text-orange-100/55 leading-relaxed">{subtitle}</p>
      )}
    </div>
  </div>
);

export default PageHeader;
