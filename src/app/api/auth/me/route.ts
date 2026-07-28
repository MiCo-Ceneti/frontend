import { NextResponse } from "next/server";
import { getAccessToken } from "@/lib/auth-server";

export async function GET() {
  const access = await getAccessToken();
  if (!access) {
    return NextResponse.json({ detail: "Non authentifie." }, { status: 401 });
  }

  const backendRes = await fetch(`${process.env.BACKEND_URL}/api/utilisateurs/me/`, {
    headers: { Authorization: `Bearer ${access}` },
    cache: "no-store",
  });

  if (!backendRes.ok) {
    return NextResponse.json({ detail: "Non authentifie." }, { status: 401 });
  }

  const data = await backendRes.json();
  return NextResponse.json(data);
}
