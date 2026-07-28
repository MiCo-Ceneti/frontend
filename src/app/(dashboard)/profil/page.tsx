"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { AgentStatusBadge } from "@/components/shared/status-badges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/components/providers/auth-provider";
import { api, ApiError } from "@/lib/api";
import { ROLE_LABELS, formatDate } from "@/lib/constants";

function initiales(nom: string, prenom: string) {
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
}

export default function ProfilPage() {
  const { utilisateur } = useAuth();
  const [ancien, setAncien] = React.useState("");
  const [nouveau, setNouveau] = React.useState("");
  const [confirmation, setConfirmation] = React.useState("");
  const [erreur, setErreur] = React.useState<string | null>(null);
  const [enCours, setEnCours] = React.useState(false);

  async function changerMotDePasse(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);

    if (nouveau !== confirmation) {
      setErreur("La confirmation ne correspond pas au nouveau mot de passe.");
      return;
    }

    setEnCours(true);
    try {
      await api.post("utilisateurs/change-password/", {
        ancien_mot_de_passe: ancien,
        nouveau_mot_de_passe: nouveau,
      });
      toast.success("Mot de passe modifie avec succes.");
      setAncien("");
      setNouveau("");
      setConfirmation("");
    } catch (err) {
      if (err instanceof ApiError) {
        const detail = err.detail as Record<string, unknown> | null;
        setErreur(
          typeof detail?.ancien_mot_de_passe === "object"
            ? String((detail.ancien_mot_de_passe as string[])[0])
            : "Impossible de modifier le mot de passe."
        );
      } else {
        setErreur("Une erreur inattendue est survenue.");
      }
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div>
      <PageHeader title="Mon profil" description="Informations personnelles et securite du compte" />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Informations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarFallback className="text-base">
                  {initiales(utilisateur.nom, utilisateur.prenom)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-base font-medium">{utilisateur.nom_complet}</p>
                <p className="text-sm text-muted-foreground">{ROLE_LABELS[utilisateur.role]}</p>
              </div>
              <div className="ml-auto">
                <AgentStatusBadge statut={utilisateur.statut} />
              </div>
            </div>

            <Separator className="my-5" />

            <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Matricule</p>
                <p className="mt-1 font-mono">{utilisateur.matricule}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">E-mail</p>
                <p className="mt-1">{utilisateur.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Telephone</p>
                <p className="mt-1">{utilisateur.telephone || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Service</p>
                <p className="mt-1">{utilisateur.service_nom || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Direction</p>
                <p className="mt-1">{utilisateur.direction_nom || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Date d&apos;embauche</p>
                <p className="mt-1">{formatDate(utilisateur.date_embauche)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Changer le mot de passe</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={changerMotDePasse} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ancien">Mot de passe actuel</Label>
                <Input id="ancien" type="password" value={ancien} onChange={(e) => setAncien(e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="nouveau">Nouveau mot de passe</Label>
                <Input id="nouveau" type="password" value={nouveau} onChange={(e) => setNouveau(e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirmation">Confirmer le mot de passe</Label>
                <Input
                  id="confirmation"
                  type="password"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  required
                />
              </div>

              {erreur && (
                <p className="rounded-md bg-status-danger-bg px-3 py-2 text-sm text-status-danger">{erreur}</p>
              )}

              <Button type="submit" disabled={enCours}>
                {enCours && <Loader2 className="h-4 w-4 animate-spin" />}
                Mettre a jour
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
