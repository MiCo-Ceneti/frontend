import { redirect } from "next/navigation";
import { getAccessToken } from "@/lib/auth-server";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import type { Utilisateur } from "@/lib/types";

async function getCurrentUser(): Promise<Utilisateur | null> {
  const access = await getAccessToken();
  if (!access) return null;

  try {
    const res = await fetch(`${process.env.BACKEND_URL}/api/utilisateurs/me/`, {
      headers: { Authorization: `Bearer ${access}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const utilisateur = await getCurrentUser();

  if (!utilisateur) {
    redirect("/login");
  }

  return (
    <AuthProvider utilisateur={utilisateur}>
      <div className="flex h-screen w-full overflow-hidden">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 overflow-y-auto bg-background px-4 py-6 md:px-8 md:py-8">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}
