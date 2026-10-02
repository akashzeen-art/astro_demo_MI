import { ReactNode, MouseEvent } from "react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { isGatedPath } from "@/lib/subscription";

interface ServiceButtonProps {
  to: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

/** Button wrapper that gates service navigation behind subscription */
const ServiceButton = ({ to, children, className, onClick }: ServiceButtonProps) => {
  const { requestService } = useSubscription();

  const handleClick = (e: MouseEvent) => {
    e.preventDefault();
    onClick?.();
    if (isGatedPath(to)) {
      requestService(to);
    } else {
      requestService(to);
    }
  };

  return (
    <button type="button" onClick={handleClick} className={className}>
      {children}
    </button>
  );
};

export default ServiceButton;
