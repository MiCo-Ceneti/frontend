import "server-only";
import { cookies } from "next/headers";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  ACCESS_MAX_AGE,
  REFRESH_MAX_AGE,
  cookieOptions,
} from "./auth-shared";

export { ACCESS_COOKIE, REFRESH_COOKIE, ACCESS_MAX_AGE, REFRESH_MAX_AGE };

export async function setAuthCookies(access: string, refresh: string) {
  const store = await cookies();
  store.set(ACCESS_COOKIE, access, { ...cookieOptions(), maxAge: ACCESS_MAX_AGE });
  store.set(REFRESH_COOKIE, refresh, { ...cookieOptions(), maxAge: REFRESH_MAX_AGE });
}

export async function setAccessCookie(access: string) {
  const store = await cookies();
  store.set(ACCESS_COOKIE, access, { ...cookieOptions(), maxAge: ACCESS_MAX_AGE });
}

export async function clearAuthCookies() {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}

export async function getAccessToken() {
  const store = await cookies();
  return store.get(ACCESS_COOKIE)?.value ?? null;
}

export async function getRefreshToken() {
  const store = await cookies();
  return store.get(REFRESH_COOKIE)?.value ?? null;
}

/**
 * Recupere l'utilisateur connecte cote serveur.
 * Si l'access token est expire, on ne redirige PAS : on renvoie null et on
 * laisse le middleware faire le refresh au prochain passage (il est le seul a
 * pouvoir reecrire les cookies avant le rendu).
 */
export async function getUtilisateurCourant<T>(): Promise<T | null> {
  const access = await getAccessToken();
  if (!access) return null;

  try {
    const res = await fetch(`${process.env.BACKEND_URL}/api/utilisateurs/me/`, {
      headers: { Authorization: `Bearer ${access}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
