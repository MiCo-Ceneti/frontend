import { NextResponse } from "next/server";
import { clearAuthCookies, getRefreshToken, getAccessToken } from "@/lib/auth-server";

export async function POST() {
  const refresh = await getRefreshToken();
  const access = await getAccessToken();

  if (refresh) {
    try {
      await fetch(`${process.env.BACKEND_URL}/api/auth/logout/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(access ? { Authorization: `Bearer ${access}` } : {}),
        },
        body: JSON.stringify({ refresh }),
      });
    } catch {
      // On deconnecte cote frontend meme si l'appel backend echoue.
    }
  }

  await clearAuthCookies();
  return NextResponse.json({ detail: "Deconnexion reussie." });
}
