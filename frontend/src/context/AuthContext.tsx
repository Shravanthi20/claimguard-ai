import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserRole } from "../types";
import { authService, RegisterResponse, LoginResponse } from "../services/authService";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResponse>;
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<RegisterResponse>;
  confirm: (email: string, code: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("claimguard_token");
      const storedUser = localStorage.getItem("claimguard_user");

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          // Verify with backend
          const res = await authService.getMe();
          if (res?.user) {
            setUser(res.user);
            localStorage.setItem("claimguard_user", JSON.stringify(res.user));
          }
        } catch {
          // Token expired or invalid
          localStorage.removeItem("claimguard_token");
          localStorage.removeItem("claimguard_user");
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();

    const handleLogoutEvent = () => {
      setUser(null);
    };

    window.addEventListener("auth_logout", handleLogoutEvent);
    return () => window.removeEventListener("auth_logout", handleLogoutEvent);
  }, []);

  const login = async (email: string, password: string): Promise<LoginResponse> => {
    const res = await authService.login(email, password);
    setUser(res.user);
    return res;
  };

  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<RegisterResponse> => {
    return authService.register(name, email, password);
  };

  const confirm = async (
    email: string,
    code: string
  ): Promise<{ success: boolean; message: string }> => {
    return authService.confirm(email, code);
  };

  const logout = () => {
    void authService.logout().finally(() => setUser(null));
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: Boolean(user),
    role: user?.role || null,
    loading,
    login,
    register,
    confirm,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
