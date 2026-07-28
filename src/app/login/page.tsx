import { Suspense } from "react";
import { Logo } from "@/components/brand/logo";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-1 text-center">
          <Logo />
          <p className="mt-2 text-sm text-muted-foreground">
            Gestion des missions et des conges des agents
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Acces reserve aux agents du CENETI. Contactez l&apos;administration en cas de probleme de connexion.
        </p>
      </div>
    </main>
  );
}
