import React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  blur?: "sm" | "md" | "lg";
  opacity?: "low" | "medium" | "high";
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = "",
}) => (
  <div className={cn("sutra-card transition-all duration-300", className)}>
    {children}
  </div>
);

export default GlassCard;
