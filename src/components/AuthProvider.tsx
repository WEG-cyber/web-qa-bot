"use client";

import { User, onAuthStateChanged } from "firebase/auth";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { auth, isFirebaseConfigured } from "@/lib/firebase/client";

type AuthState = { user: User | null; loading: boolean; configured: boolean };
const AuthContext = createContext<AuthState>({ user: null, loading: true, configured: false });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
  }, []);

  const value = useMemo(
    () => ({ user, loading, configured: isFirebaseConfigured }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
