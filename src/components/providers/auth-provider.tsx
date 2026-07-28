"use client";

import * as React from "react";
import type { Utilisateur } from "@/lib/types";

interface AuthContextValue {
  utilisateur: Utilisateur;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({
  utilisateur,
  children,
}: {
  utilisateur: Utilisateur;
  children: React.ReactNode;
}) {
  return <AuthContext.Provider value={{ utilisateur }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit etre utilise a l'interieur de AuthProvider.");
  return ctx;
}
