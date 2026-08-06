import { redirect } from "next/navigation";
import { getUtilisateurCourant } from "@/lib/auth-server";
import { AuthProvider } from "@/components/providers/auth-provider";
import { PushProvider } from "@/components/providers/push-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import type { Utilisateur } from "@/lib/types";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Le refresh silencieux est deja tente par le middleware (`proxy.ts`) avant
  // ce rendu. Si on arrive ici sans utilisateur, la session est reellement
  // perdue et les cookies ont ete purges : la redirection est terminale.
  const utilisateur = await getUtilisateurCourant<Utilisateur>();

  if (!utilisateur) {
    redirect("/login");
  }

  return (
    <AuthProvider utilisateur={utilisateur}>
      <PushProvider>
        <div className="flex h-screen w-full overflow-hidden">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar />
            <main className="flex-1 overflow-y-auto bg-background px-4 py-6 md:px-8 md:py-8">
              <div className="mx-auto w-full max-w-6xl">{children}</div>
            </main>
          </div>
        </div>
      </PushProvider>
    </AuthProvider>
  );
}
