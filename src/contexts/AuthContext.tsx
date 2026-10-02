import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiService } from "@/lib/apiService";
import type { User } from "@/lib/apiService";
import { STORAGE_KEYS } from "@/lib/config";
import { hasActiveSubscription, loadSubscription } from "@/lib/subscription";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUserFromSubscription: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

function loadUserFromStorage(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    if (!raw) return null;
    const user = JSON.parse(raw) as User;
    if (hasActiveSubscription()) return user;
    return null;
  } catch {
    return null;
  }
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => loadUserFromStorage());
  const [isLoading, setIsLoading] = useState(false);

  const setUserFromSubscription = useCallback((u: User) => {
    setUser(u);
  }, []);

  useEffect(() => {
    const onActivated = () => {
      const stored = loadUserFromStorage();
      if (stored) setUser(stored);
    };
    window.addEventListener("subscription-activated", onActivated);
    return () => window.removeEventListener("subscription-activated", onActivated);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { user: loggedIn } = await apiService.login(email, password);
      setUser(loggedIn);
      return true;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    apiService.logout();
    localStorage.removeItem(STORAGE_KEYS.SUBSCRIPTION);
    localStorage.removeItem("isSubscribed");
    localStorage.removeItem("userMobile");
    localStorage.removeItem("subscriptionData");
    setUser(null);
    window.dispatchEvent(new CustomEvent("subscription-updated"));
  };

  const refreshUser = async (): Promise<void> => {
    const sub = loadSubscription();
    if (sub && hasActiveSubscription()) {
      const stored = loadUserFromStorage();
      if (stored) setUser(stored);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user && hasActiveSubscription(),
    login,
    logout,
    refreshUser,
    setUserFromSubscription,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
