import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getCurrentUser, loginAccount, logoutAccount, registerAccount } from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const result = await getCurrentUser();
      setUser(result.user || null);
      return result.user || null;
    } catch {
      setUser(null);
      return null;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const register = async (details) => {
    const result = await registerAccount(details);
    setUser(result.user);
    return result;
  };

  const login = async (details) => {
    const result = await loginAccount(details);
    setUser(result.user);
    return result;
  };

  const logout = async () => {
    try {
      await logoutAccount();
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, authLoading, register, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
