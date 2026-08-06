"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  CLE_STOCKAGE_DEVICE_TOKEN,
  ecouterMessagesPremierPlan,
  firebaseConfigure,
  obtenirDeviceToken,
  pushSupporte,
} from "@/lib/firebase";

interface PushContextValue {
  /** Etat de la permission navigateur. */
  permission: NotificationPermission | "indisponible";
  /** Jeton FCM enregistre pour cet appareil (null si absent). */
  deviceToken: string | null;
  /** Declenche la demande de permission puis l'enregistrement du jeton. */
  activerNotifications: () => Promise<boolean>;
  /** Faux si le navigateur ou la configuration ne permettent pas le push. */
  disponible: boolean;
}

const PushContext = React.createContext<PushContextValue | null>(null);

export function PushProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [permission, setPermission] = React.useState<NotificationPermission | "indisponible">(
    "indisponible"
  );
  const [deviceToken, setDeviceToken] = React.useState<string | null>(null);
  const enregistrementEnCours = React.useRef(false);

  const disponible = React.useMemo(() => pushSupporte() && firebaseConfigure(), []);

  /** Enregistre (ou reenregistre) le jeton de cet appareil aupres du backend. */
  const enregistrerJeton = React.useCallback(async (): Promise<boolean> => {
    if (!disponible || enregistrementEnCours.current) return false;
    enregistrementEnCours.current = true;

    try {
      const token = await obtenirDeviceToken();
      if (!token) return false;

      const dejaEnvoye = window.localStorage.getItem(CLE_STOCKAGE_DEVICE_TOKEN);

      // Le backend fait un update_or_create : on renvoie le jeton si celui
      // stocke localement a change (rotation FCM, reinstallation, nouvel appareil).
      if (dejaEnvoye !== token) {
        await api.post("notifications/devices/", { token, plateforme: "web" });
        window.localStorage.setItem(CLE_STOCKAGE_DEVICE_TOKEN, token);
      }

      setDeviceToken(token);
      return true;
    } catch (err) {
      console.error("Enregistrement du jeton de notification impossible", err);
      return false;
    } finally {
      enregistrementEnCours.current = false;
    }
  }, [disponible]);

  const activerNotifications = React.useCallback(async () => {
    const reussi = await enregistrerJeton();
    setPermission(typeof Notification !== "undefined" ? Notification.permission : "indisponible");
    if (reussi) {
      toast.success("Notifications activees sur cet appareil.");
    }
    return reussi;
  }, [enregistrerJeton]);

  // Au montage : si la permission est deja accordee, on (re)synchronise le
  // jeton silencieusement. Sinon on attend une action explicite de l'utilisateur.
  React.useEffect(() => {
    if (!disponible) {
      setPermission("indisponible");
      return;
    }
    setPermission(Notification.permission);
    if (Notification.permission === "granted") {
      enregistrerJeton();
    }
  }, [disponible, enregistrerJeton]);

  // Notifications recues pendant que l'onglet est actif : le navigateur
  // n'affiche rien, on presente donc un toast cliquable.
  React.useEffect(() => {
    if (!disponible) return;

    let desabonner: (() => void) | undefined;

    ecouterMessagesPremierPlan(({ titre, message, lien }) => {
      toast(titre ?? "Nouvelle notification", {
        description: message,
        action: {
          label: "Voir",
          onClick: () => router.push(lien ?? "/notifications"),
        },
      });
      // Rafraichit la cloche sans attendre le prochain sondage.
      window.dispatchEvent(new CustomEvent("mico:notification-recue"));
    }).then((fn) => {
      desabonner = fn;
    });

    return () => desabonner?.();
  }, [disponible, router]);

  const valeur = React.useMemo<PushContextValue>(
    () => ({ permission, deviceToken, activerNotifications, disponible }),
    [permission, deviceToken, activerNotifications, disponible]
  );

  return <PushContext.Provider value={valeur}>{children}</PushContext.Provider>;
}

export function usePush() {
  const ctx = React.useContext(PushContext);
  if (!ctx) throw new Error("usePush doit etre utilise a l'interieur de PushProvider.");
  return ctx;
}
