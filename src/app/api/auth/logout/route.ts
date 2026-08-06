import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookies, getRefreshToken, getAccessToken } from "@/lib/auth-server";

export async function POST(request: NextRequest) {
  const refresh = await getRefreshToken();
  const access = await getAccessToken();

  // Le client peut transmettre le jeton FCM de l'appareil courant afin qu'il
  // soit desenregistre cote backend (plus de push apres deconnexion).
  let deviceToken: string | undefined;
  try {
    const body = await request.json();
    deviceToken = body?.device_token;
  } catch {
    // corps vide : cas normal
  }

  if (refresh) {
    try {
      await fetch(`${process.env.BACKEND_URL}/api/auth/logout/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(access ? { Authorization: `Bearer ${access}` } : {}),
        },
        body: JSON.stringify({ refresh, device_token: deviceToken }),
      });
    } catch {
      // On deconnecte cote frontend meme si l'appel backend echoue.
    }
  }

  await clearAuthCookies();
  return NextResponse.json({ detail: "Deconnexion reussie." });
}
