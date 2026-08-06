import { NextRequest, NextResponse } from "next/server";
import { getAccessToken } from "@/lib/auth-server";

/**
 * Proxy transparent vers le backend Django.
 *
 * Important : le corps est transmis en BINAIRE (`arrayBuffer`) et non en texte.
 * L'ancienne version utilisait `request.text()`, ce qui corrompait tout envoi
 * multipart (uploads de fichiers). L'en-tete `content-type` d'origine, boundary
 * comprise, est repercutee telle quelle.
 */
async function handler(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const access = await getAccessToken();

  const target = `${process.env.BACKEND_URL}/api/${path.join("/")}/${request.nextUrl.search}`;

  const headers = new Headers();
  if (access) headers.set("Authorization", `Bearer ${access}`);

  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);

  const accept = request.headers.get("accept");
  if (accept) headers.set("Accept", accept);

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
  };

  if (!["GET", "HEAD"].includes(request.method)) {
    const buffer = await request.arrayBuffer();
    if (buffer.byteLength > 0) {
      init.body = buffer;
    }
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(target, init);
  } catch {
    return NextResponse.json(
      { detail: "Le serveur est injoignable. Reessayez dans un instant." },
      { status: 502 }
    );
  }

  const typeReponse = backendRes.headers.get("content-type") ?? "application/json";

  // Les reponses non textuelles (PDF, images, exports Excel) sont relayees
  // en binaire pour ne pas etre alterees.
  if (!typeReponse.includes("json") && !typeReponse.includes("text")) {
    const buffer = await backendRes.arrayBuffer();
    const entetes = new Headers({ "Content-Type": typeReponse });
    const disposition = backendRes.headers.get("content-disposition");
    if (disposition) entetes.set("Content-Disposition", disposition);
    return new NextResponse(buffer, { status: backendRes.status, headers: entetes });
  }

  const text = await backendRes.text();
  return new NextResponse(text || null, {
    status: backendRes.status,
    headers: { "Content-Type": typeReponse },
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
