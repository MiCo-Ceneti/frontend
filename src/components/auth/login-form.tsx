"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePush } from "../providers/push-provider";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [erreur, setErreur] = React.useState<string | null>(null);
  const [enCours, setEnCours] = React.useState(false);
  const { activerNotifications } = usePush(); // Hook from PushProvider to handle push notifications

  // Session expiree : message informatif pose par l'AuthProvider lorsqu'il a
  // du sortir l'utilisateur apres l'echec definitif du refresh.
  const sessionExpiree = searchParams.get("expire") === "1";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErreur(data.detail ?? "Identifiants incorrects.");
        return;
      }

      activerNotifications();

      const next = searchParams.get("next") || "/";
      router.replace(next);
      router.refresh();
    } catch {
      setErreur("Impossible de contacter le serveur. Reessayez.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Adresse e-mail</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="prenom.nom@ceneti.tg"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Mot de passe</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      {sessionExpiree && !erreur && (
        <p className="rounded-md bg-status-warning-bg px-3 py-2 text-sm text-status-warning">
          Votre session a expire. Merci de vous reconnecter.
        </p>
      )}

      {erreur && (
        <p className="rounded-md bg-status-danger-bg px-3 py-2 text-sm text-status-danger">{erreur}</p>
      )}

      <Button type="submit" disabled={enCours} className="mt-1">
        {enCours && <Loader2 className="h-4 w-4 animate-spin" />}
        Se connecter
      </Button>
    </form>
  );
}
