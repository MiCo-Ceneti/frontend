import { NextResponse } from "next/server";
import { getRefreshToken, setAccessCookie, setAuthCookies, clearAuthCookies } from "@/lib/auth-server";

export async function POST() {
  const refresh = await getRefreshToken();

  if (!refresh) {
    return NextResponse.json({ detail: "Session expiree." }, { status: 401 });
  }

  const backendRes = await fetch(`${process.env.BACKEND_URL}/api/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!backendRes.ok) {
    await clearAuthCookies();
    return NextResponse.json({ detail: "Session expiree." }, { status: 401 });
  }

  const data = await backendRes.json();

  if (data.refresh) {
    await setAuthCookies(data.access, data.refresh);
  } else {
    await setAccessCookie(data.access);
  }

  return NextResponse.json({ detail: "Session renouvelee." });
}
