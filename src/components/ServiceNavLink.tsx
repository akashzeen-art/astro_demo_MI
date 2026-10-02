import { ReactNode, MouseEvent } from "react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { isGatedPath } from "@/lib/subscription";

interface ServiceNavLinkProps {
  to: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

/** Intercepts gated service links and opens subscription modal when needed */
const ServiceNavLink = ({
  to,
  children,
  className,
  onClick,
}: ServiceNavLinkProps) => {
  const { hasAccess, requestService } = useSubscription();

  const handleClick = (e: MouseEvent) => {
    onClick?.();
    if (isGatedPath(to) && !hasAccess) {
      e.preventDefault();
      requestService(to);
    }
  };

  return (
    <a href={to} onClick={handleClick} className={className}>
      {children}
    </a>
  );
};

export default ServiceNavLink;
