"use client";

import * as React from "react";
import { toast } from "sonner";
import { Bell, BellRing, Download, FileX2, Loader2, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { AgentStatusBadge } from "@/components/shared/status-badges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/components/providers/auth-provider";
import { usePush } from "@/components/providers/push-provider";
import { api, messageErreur } from "@/lib/api";
import type { SoldeConge } from "@/lib/types";
import { ROLE_LABELS, formatDate, formatDateTime } from "@/lib/constants";

function initiales(nom: string, prenom: string) {
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
}

export default function ProfilPage() {
  const { utilisateur, rafraichir } = useAuth();
  const { permission, activerNotifications, disponible } = usePush();

  const [solde, setSolde] = React.useState<SoldeConge | null>(null);
  const [ancien, setAncien] = React.useState("");
  const [nouveau, setNouveau] = React.useState("");
  const [confirmation, setConfirmation] = React.useState("");
  const [erreur, setErreur] = React.useState<string | null>(null);
  const [enCours, setEnCours] = React.useState(false);

  const anneeCourante = new Date().getFullYear();
  const document = utilisateur.document_ministeriel_annee;

  React.useEffect(() => {
    api
      .get<SoldeConge>(`conges/solde/${utilisateur.id}/`)
      .then(setSolde)
      .catch(() => setSolde(null));
  }, [utilisateur.id]);

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
      setErreur(messageErreur(err, "Impossible de modifier le mot de passe."));
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
              <div>
                <p className="text-xs text-muted-foreground">Solde de conge</p>
                <p className="mt-1 font-mono font-medium">
                  {solde?.solde_restant ?? utilisateur.solde_conge} jour(s)
                </p>
              </div>
              {utilisateur.statut_fin && (
                <div>
                  <p className="text-xs text-muted-foreground">Statut jusqu&apos;au</p>
                  <p className="mt-1">{formatDate(utilisateur.statut_fin)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          {/* -------------------------------------------------------------
              Document ministeriel de l'annee : sa seule utilite dans le
              systeme est d'etre consultable et telechargeable ici.
             ------------------------------------------------------------- */}
          <Card>
            <CardHeader>
              <CardTitle>Document ministeriel {anneeCourante}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {document ? (
                <>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-status-success" />
                    <Badge variant="success">Disponible</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enregistre le {formatDateTime(document.date_enregistrement)}.
                  </p>
                  {document.fichier_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={document.fichier_url} target="_blank" rel="noreferrer">
                        <Download className="h-4 w-4" />
                        Telecharger le document
                      </a>
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <FileX2 className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="secondary">Non depose</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Le document du ministere pour {anneeCourante} n&apos;a pas encore ete enregistre
                    par la direction. Il sera consultable ici des son depot.
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Activation des notifications push sur cet appareil */}
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {!disponible ? (
                <p className="text-xs text-muted-foreground">
                  Les notifications push ne sont pas disponibles sur ce navigateur ou ne sont pas
                  configurees. Les notifications dans l&apos;application restent actives.
                </p>
              ) : permission === "granted" ? (
                <>
                  <div className="flex items-center gap-2">
                    <BellRing className="h-4 w-4 text-status-success" />
                    <Badge variant="success">Activees sur cet appareil</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Vous recevrez les alertes de mission et de conge meme lorsque l&apos;onglet est
                    ferme.
                  </p>
                </>
              ) : permission === "denied" ? (
                <p className="text-xs text-muted-foreground">
                  Vous avez refuse les notifications pour ce site. Reautorisez-les dans les
                  parametres de votre navigateur pour les reactiver.
                </p>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">
                    Activez les notifications pour etre alerte des nouvelles missions et des
                    decisions sur vos conges.
                  </p>
                  <Button variant="outline" size="sm" onClick={activerNotifications}>
                    <Bell className="h-4 w-4" />
                    Activer les notifications
                  </Button>
                </>
              )}
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
                  <Input
                    id="ancien"
                    type="password"
                    value={ancien}
                    onChange={(e) => setAncien(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="nouveau">Nouveau mot de passe</Label>
                  <Input
                    id="nouveau"
                    type="password"
                    value={nouveau}
                    onChange={(e) => setNouveau(e.target.value)}
                    required
                  />
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
                  <p className="rounded-md bg-status-danger-bg px-3 py-2 text-sm text-status-danger">
                    {erreur}
                  </p>
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

      {/* Historique des mouvements de solde */}
      {solde && solde.historique.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Historique de mon solde de conge</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {solde.historique.slice(0, 12).map((mouvement) => (
              <div
                key={mouvement.id}
                className="flex items-center justify-between rounded-md bg-secondary px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate">{mouvement.motif ?? mouvement.type_mouvement}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(mouvement.date_mouvement)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p
                    className={
                      mouvement.jours >= 0
                        ? "font-mono text-status-success"
                        : "font-mono text-status-danger"
                    }
                  >
                    {mouvement.jours >= 0 ? "+" : ""}
                    {mouvement.jours} j
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    → {mouvement.solde_apres} j
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
