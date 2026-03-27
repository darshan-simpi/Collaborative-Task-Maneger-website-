import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import type { User } from "@workspace/api-client-react";
import { useLocation } from "wouter";

type AuthContextType = {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
  isManager: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(localStorage.getItem("task_manager_token"));
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // We only enable the query if a token exists
  const { data: user, isLoading, isError } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      enabled: !!token,
      retry: false,
    },
  });

  // Handle invalid token automatically
  useEffect(() => {
    if (isError && token) {
      logout();
    }
  }, [isError, token]);

  const login = (newToken: string) => {
    localStorage.setItem("task_manager_token", newToken);
    setTokenState(newToken);
    queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    setLocation("/");
  };

  const logout = () => {
    localStorage.removeItem("task_manager_token");
    setTokenState(null);
    queryClient.clear();
    setLocation("/login");
  };

  const isManager = user?.role === "manager";

  return (
    <AuthContext.Provider
      value={{
        token,
        user: user || null,
        isLoading: isLoading && !!token,
        login,
        logout,
        isManager,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
