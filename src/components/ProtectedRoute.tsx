import { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
}

// Authentication is disabled - just render children without any checks
const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  return <>{children}</>;
};

export default ProtectedRoute;

