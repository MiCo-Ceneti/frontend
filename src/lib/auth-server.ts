import "server-only";
import { cookies } from "next/headers";

export const ACCESS_COOKIE = "mico_access";
export const REFRESH_COOKIE = "mico_refresh";

const isProd = process.env.NODE_ENV === "production";

const baseOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax" as const,
  path: "/",
};

export async function setAuthCookies(access: string, refresh: string) {
  const store = await cookies();
  store.set(ACCESS_COOKIE, access, { ...baseOptions, maxAge: 60 * 30 });
  store.set(REFRESH_COOKIE, refresh, { ...baseOptions, maxAge: 60 * 60 * 24 * 7 });
}

export async function setAccessCookie(access: string) {
  const store = await cookies();
  store.set(ACCESS_COOKIE, access, { ...baseOptions, maxAge: 60 * 30 });
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
