"use client";

/**
 * Integration Firebase Cloud Messaging (web push).
 *
 * Toutes les cles sont lues depuis les variables d'environnement : il suffit de
 * completer le fichier `.env.local` (voir `.env.example`) pour que la chaine
 * complete fonctionne, sans toucher au code.
 *
 * Chaine complete :
 *   1. enregistrement du service worker `public/firebase-messaging-sw.js`
 *   2. demande de permission de notification a l'utilisateur
 *   3. recuperation du jeton FCM (avec la VAPID key)
 *   4. envoi du jeton au backend : POST /api/notifications/devices/
 *   5. reception des messages au premier plan (onMessage)
 */
import type { FirebaseApp } from "firebase/app";
import type { Messaging } from "firebase/messaging";

export const CLE_STOCKAGE_DEVICE_TOKEN = "mico_device_token";

export const configFirebase = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ?? "";

/** Vrai uniquement si toutes les cles indispensables sont renseignees. */
export function firebaseConfigure() {
  return Boolean(
    configFirebase.apiKey &&
      configFirebase.projectId &&
      configFirebase.messagingSenderId &&
      configFirebase.appId &&
      VAPID_KEY
  );
}

export function pushSupporte() {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

let appPromise: Promise<FirebaseApp> | null = null;

async function obtenirApp(): Promise<FirebaseApp> {
  if (!appPromise) {
    appPromise = (async () => {
      const { initializeApp, getApps, getApp } = await import("firebase/app");
      return getApps().length ? getApp() : initializeApp(configFirebase);
    })();
  }
  return appPromise;
}

async function obtenirMessaging(): Promise<Messaging | null> {
  const { getMessaging, isSupported } = await import("firebase/messaging");
  if (!(await isSupported())) return null;
  return getMessaging(await obtenirApp());
}

/** Enregistre le service worker en lui transmettant la config via l'URL. */
async function enregistrerServiceWorker(): Promise<ServiceWorkerRegistration> {
  const parametres = new URLSearchParams({
    apiKey: configFirebase.apiKey,
    authDomain: configFirebase.authDomain,
    projectId: configFirebase.projectId,
    storageBucket: configFirebase.storageBucket,
    messagingSenderId: configFirebase.messagingSenderId,
    appId: configFirebase.appId,
  });

  return navigator.serviceWorker.register(
    `/firebase-messaging-sw.js?${parametres.toString()}`,
    { scope: "/" }
  );
}

/**
 * Demande la permission puis retourne le jeton FCM de cet appareil.
 * Retourne null si le navigateur ne supporte pas le push, si la configuration
 * est incomplete, ou si l'utilisateur refuse.
 */
export async function obtenirDeviceToken(): Promise<string | null> {
  if (!pushSupporte() || !firebaseConfigure()) return null;

  const permission =
    Notification.permission === "granted"
      ? "granted"
      : await Notification.requestPermission();

  if (permission !== "granted") return null;

  try {
    const registration = await enregistrerServiceWorker();
    const messaging = await obtenirMessaging();
    if (!messaging) return null;

    const { getToken } = await import("firebase/messaging");
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    return token || null;
  } catch (err) {
    console.error("Recuperation du jeton FCM impossible", err);
    return null;
  }
}

/** Ecoute les notifications recues pendant que l'onglet est au premier plan. */
export async function ecouterMessagesPremierPlan(
  callback: (charge: { titre?: string; message?: string; lien?: string }) => void
): Promise<() => void> {
  if (!pushSupporte() || !firebaseConfigure()) return () => {};

  try {
    const messaging = await obtenirMessaging();
    if (!messaging) return () => {};

    const { onMessage } = await import("firebase/messaging");
    return onMessage(messaging, (charge) => {
      callback({
        titre: charge.notification?.title ?? charge.data?.titre,
        message: charge.notification?.body ?? charge.data?.message,
        lien: charge.data?.lien,
      });
    });
  } catch {
    return () => {};
  }
}
