/**
 * Constantes et options de cookies partagees entre le middleware (`proxy.ts`)
 * et les route handlers. Ce fichier ne doit rien importer de `server-only`
 * afin de rester utilisable depuis le runtime edge du middleware.
 */
export const ACCESS_COOKIE = "mico_access";
export const REFRESH_COOKIE = "mico_refresh";

/** Duree de vie des cookies, alignee sur SIMPLE_JWT cote Django. */
export const ACCESS_MAX_AGE = 60 * 30; // 30 minutes
export const REFRESH_MAX_AGE = 60 * 60 * 24 * 7; // 7 jours

export function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
}
