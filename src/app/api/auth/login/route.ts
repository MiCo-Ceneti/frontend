import { NextRequest, NextResponse } from "next/server";
import { setAuthCookies } from "@/lib/auth-server";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const backendRes = await fetch(`${process.env.BACKEND_URL}/api/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await backendRes.json();

  if (!backendRes.ok) {
    return NextResponse.json(
      { detail: data.detail ?? "Identifiants incorrects." },
      { status: backendRes.status }
    );
  }

  await setAuthCookies(data.access, data.refresh);

  return NextResponse.json({ utilisateur: data.utilisateur });
}
