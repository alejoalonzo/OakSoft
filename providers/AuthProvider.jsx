"use client";

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";
import { useDisconnect } from "wagmi";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { disconnect } = useDisconnect();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const logout = useCallback(async () => {
    try {
      console.log("[Auth] logout: Firebase + wagmi disconnect");

      // 1) Firebase logout
      await signOut(auth);

      // 2) Disconnect wallet in this dApp (same base logic AppKit uses)
      await disconnect();

      console.log("[Auth] logout done");
    } catch (err) {
      console.error("Logout error:", err);
    }
  }, [disconnect]);


  const value = useMemo(
    () => ({ user, loading, logout }),
    [user, loading, logout]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
