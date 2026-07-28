import { NextRequest, NextResponse } from "next/server";
import { getAccessToken } from "@/lib/auth-server";

async function handler(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const access = await getAccessToken();

  const target = `${process.env.BACKEND_URL}/api/${path.join("/")}/${request.nextUrl.search}`;

  const init: RequestInit = {
    method: request.method,
    headers: {
      ...(access ? { Authorization: `Bearer ${access}` } : {}),
      ...(request.headers.get("content-type")
        ? { "Content-Type": request.headers.get("content-type")! }
        : {}),
    },
    cache: "no-store",
  };

  if (!["GET", "HEAD"].includes(request.method)) {
    const body = await request.text();
    if (body) init.body = body;
  }

  const backendRes = await fetch(target, init);
  const text = await backendRes.text();

  return new NextResponse(text || null, {
    status: backendRes.status,
    headers: {
      "Content-Type": backendRes.headers.get("content-type") ?? "application/json",
    },
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
