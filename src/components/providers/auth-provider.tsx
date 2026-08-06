"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, EVENEMENT_SESSION_EXPIREE } from "@/lib/api";
import type { Utilisateur } from "@/lib/types";

interface AuthContextValue {
  /** Utilisateur connecte. Toujours defini a l'interieur du dashboard. */
  utilisateur: Utilisateur;
  /** Rechargement des donnees utilisateur (apres MAJ profil, solde, statut...). */
  rafraichir: () => Promise<void>;
  /** Deconnexion propre : purge des cookies, du jeton FCM puis retour au login. */
  deconnexion: () => Promise<void>;
  /** Vrai pendant un rafraichissement en arriere-plan. */
  chargement: boolean;
  /** Raccourcis de role, evite de repeter les tableaux d'inclusion partout. */
  estResponsable: boolean;
  estAdministrateur: boolean;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

const ROLES_RESPONSABLES = ["chef_service", "directeur", "administrateur"];

export function AuthProvider({
  utilisateur: utilisateurInitial,
  children,
}: {
  utilisateur: Utilisateur;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [utilisateur, setUtilisateur] = React.useState<Utilisateur>(utilisateurInitial);
  const [chargement, setChargement] = React.useState(false);
  const deconnexionEnCours = React.useRef(false);

  // L'utilisateur rendu par le serveur fait foi a chaque navigation serveur.
  React.useEffect(() => {
    setUtilisateur(utilisateurInitial);
  }, [utilisateurInitial]);

  const rafraichir = React.useCallback(async () => {
    setChargement(true);
    try {
      const donnees = await api.get<Utilisateur>("utilisateurs/me/");
      setUtilisateur(donnees);
    } catch (err) {
      // Un 401 est deja traite par le gestionnaire de session expiree.
      if (!(err instanceof ApiError) || err.status !== 401) {
        console.error("Rafraichissement du profil impossible", err);
      }
    } finally {
      setChargement(false);
    }
  }, []);

  const deconnexion = React.useCallback(async () => {
    if (deconnexionEnCours.current) return;
    deconnexionEnCours.current = true;

    let deviceToken: string | null = null;
    try {
      deviceToken = window.localStorage.getItem("mico_device_token");
    } catch {
      deviceToken = null;
    }

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_token: deviceToken }),
      });
    } catch {
      // On sort quand meme cote client.
    }

    try {
      window.localStorage.removeItem("mico_device_token");
    } catch {
      // stockage indisponible : sans consequence
    }

    router.replace("/login");
    router.refresh();
  }, [router]);

  /**
   * Session definitivement perdue (le refresh a echoue) : on sort une seule
   * fois, proprement. Le middleware ayant purge les cookies, /login ne peut
   * plus renvoyer vers / : la boucle de redirection est impossible.
   */
  React.useEffect(() => {
    function surSessionExpiree() {
      if (deconnexionEnCours.current) return;
      deconnexionEnCours.current = true;
      router.replace("/login?expire=1");
      router.refresh();
    }

    window.addEventListener(EVENEMENT_SESSION_EXPIREE, surSessionExpiree);
    return () => window.removeEventListener(EVENEMENT_SESSION_EXPIREE, surSessionExpiree);
  }, [router]);

  /**
   * Refresh preventif : l'access token vit 30 minutes, on le renouvelle toutes
   * les 20 minutes tant que l'onglet est ouvert, et au retour de veille.
   */
  React.useEffect(() => {
    async function renouveler() {
      if (document.visibilityState === "hidden") return;
      try {
        await fetch("/api/auth/refresh", { method: "POST" });
      } catch {
        // silencieux : la requete metier suivante declenchera le traitement
      }
    }

    const intervalle = setInterval(renouveler, 20 * 60 * 1000);
    document.addEventListener("visibilitychange", renouveler);
    return () => {
      clearInterval(intervalle);
      document.removeEventListener("visibilitychange", renouveler);
    };
  }, []);

  const valeur = React.useMemo<AuthContextValue>(
    () => ({
      utilisateur,
      rafraichir,
      deconnexion,
      chargement,
      estResponsable: ROLES_RESPONSABLES.includes(utilisateur.role),
      estAdministrateur: utilisateur.role === "administrateur",
    }),
    [utilisateur, rafraichir, deconnexion, chargement]
  );

  return <AuthContext.Provider value={valeur}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit etre utilise a l'interieur de AuthProvider.");
  return ctx;
}
