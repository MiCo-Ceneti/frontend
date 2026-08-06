import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE, cookieOptions, ACCESS_MAX_AGE, REFRESH_MAX_AGE } from "@/lib/auth-shared";

const PUBLIC_PATHS = ["/login"];

/**
 * Le middleware est le SEUL endroit qui peut a la fois lire et reecrire les
 * cookies avant le rendu d'un Server Component. C'est donc ici qu'on effectue
 * le refresh silencieux, ce qui supprime definitivement la boucle de
 * redirection : auparavant le layout serveur redirigeait vers /login des que
 * l'access token etait expire, et le middleware renvoyait /login vers / parce
 * que le cookie refresh etait toujours present.
 *
 * Regles :
 *  - aucun cookie                       -> /login
 *  - access absent mais refresh present -> tentative de refresh silencieux
 *      - succes -> on continue avec les nouveaux cookies
 *      - echec  -> cookies purges puis /login (plus aucune boucle possible)
 *  - page publique avec access valide   -> /
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;

  // --- Aucune session ------------------------------------------------------
  if (!access && !refresh) {
    if (isPublic) return NextResponse.next();
    return redirectToLogin(request, pathname + search);
  }

  // --- Access expire / absent mais refresh disponible ----------------------
  if (!access && refresh) {
    const renouvele = await renouvelerSession(refresh);

    if (!renouvele) {
      // Session definitivement morte : on purge et on envoie vers /login.
      // Comme les cookies sont supprimes sur CETTE reponse, la requete
      // suivante tombe dans le cas « aucune session » : pas de boucle.
      const response = isPublic
        ? NextResponse.next()
        : redirectToLogin(request, pathname + search);
      response.cookies.delete(ACCESS_COOKIE);
      response.cookies.delete(REFRESH_COOKIE);
      return response;
    }

    const response = isPublic
      ? NextResponse.redirect(new URL("/", request.url))
      : NextResponse.next();

    response.cookies.set(ACCESS_COOKIE, renouvele.access, {
      ...cookieOptions(),
      maxAge: ACCESS_MAX_AGE,
    });
    if (renouvele.refresh) {
      response.cookies.set(REFRESH_COOKIE, renouvele.refresh, {
        ...cookieOptions(),
        maxAge: REFRESH_MAX_AGE,
      });
    }
    return response;
  }

  // --- Session active ------------------------------------------------------
  if (isPublic) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

function redirectToLogin(request: NextRequest, next: string) {
  const loginUrl = new URL("/login", request.url);
  if (next && next !== "/") loginUrl.searchParams.set("next", next);
  return NextResponse.redirect(loginUrl);
}

async function renouvelerSession(
  refresh: string
): Promise<{ access: string; refresh?: string } | null> {
  try {
    const res = await fetch(`${process.env.BACKEND_URL}/api/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.access) return null;
    return { access: data.access, refresh: data.refresh };
  } catch {
    return null;
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|firebase-messaging-sw.js).*)"],
};
