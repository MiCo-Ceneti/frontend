"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Download, Info, Loader2, Paperclip, X } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { CongeStatusBadge } from "@/components/shared/status-badges";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PieceJointeLien } from "@/components/shared/file-upload";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/providers/auth-provider";
import { api, messageErreur } from "@/lib/api";
import type { DemandeConge, SoldeConge } from "@/lib/types";
import { formatDate, formatDateTime } from "@/lib/constants";

/**
 * Page de detail d'une demande de conge.
 *
 * C'est le passage oblige du superieur avant toute decision : il visualise ici
 * l'integralite du dossier (motif, duree, impact sur le solde, et TOUTES les
 * pieces jointes consultables) avant d'accepter ou de refuser.
 */
export default function DemandeCongeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { utilisateur, estResponsable } = useAuth();
  const router = useRouter();

  const [demande, setDemande] = React.useState<DemandeConge | null>(null);
  const [soldeAgent, setSoldeAgent] = React.useState<SoldeConge | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [dialogRefus, setDialogRefus] = React.useState(false);
  const [dialogValidation, setDialogValidation] = React.useState(false);
  const [actionEnCours, setActionEnCours] = React.useState(false);
  const [telechargementEnCours, setTelechargementEnCours] = React.useState(false);

  const charger = React.useCallback(async () => {
    try {
      const donnees = await api.get<DemandeConge>(`conges/demandes/${id}/`);
      setDemande(donnees);

      // Le valideur doit voir le solde de l'agent concerne, pas le sien.
      try {
        const solde = await api.get<SoldeConge>(`conges/solde/${donnees.agent}/`);
        setSoldeAgent(solde);
      } catch {
        setSoldeAgent(null);
      }
    } catch {
      setDemande(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    charger();
  }, [charger]);

  async function valider() {
    setActionEnCours(true);
    try {
      await api.post(`conges/demandes/${id}/valider/`);
      toast.success("Demande validee.");
      await charger();
      router.refresh();
    } catch (err) {
      toast.error(messageErreur(err, "Impossible de valider cette demande."));
    } finally {
      setActionEnCours(false);
    }
  }

  async function refuser(commentaire?: string) {
    try {
      await api.post(`conges/demandes/${id}/refuser/`, { commentaire_refus: commentaire });
      toast.success("Demande refusee.");
      await charger();
      router.refresh();
    } catch (err) {
      toast.error(messageErreur(err, "Impossible de refuser cette demande."));
    }
  }

  async function telechargerNote() {
    if (!demande) return;
    setTelechargementEnCours(true);
    try {
      const { url } = await api.get<{ url: string }>(`conges/demandes/${demande.id}/note-conge/`);
      window.open(url, "_blank", "noreferrer");
    } catch (err) {
      toast.error(messageErreur(err, "Note de service indisponible pour le moment."));
    } finally {
      setTelechargementEnCours(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!demande) {
    return <p className="text-sm text-muted-foreground">Demande introuvable.</p>;
  }

  const peutTelechargerNote =
    demande.statut === "validee" && demande.agent === utilisateur.id;

  const peutTraiter =
    estResponsable && demande.statut === "en_attente" && demande.agent !== utilisateur.id;

  const soldeApres = soldeAgent
    ? soldeAgent.solde_restant - (demande.decremente_le_solde ? demande.nombre_jours : 0)
    : null;

  return (
    <div>
      <PageHeader
        title={`Conge du ${formatDate(demande.date_debut)} au ${formatDate(demande.date_fin)}`}
        description={`${demande.agent_nom}${demande.agent_service ? ` — ${demande.agent_service}` : ""}`}
        action={<CongeStatusBadge statut={demande.statut} />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Details de la demande</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="mt-1">{demande.type_conge_libelle}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Nombre de jours</p>
                <p className="mt-1 font-mono">{demande.nombre_jours}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Impact sur le solde</p>
                <p className="mt-1">
                  {demande.decremente_le_solde ? (
                    <Badge variant="warning">Deduit du solde</Badge>
                  ) : (
                    <Badge variant="secondary">Sans impact</Badge>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Matricule</p>
                <p className="mt-1 font-mono">{demande.agent_matricule}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Soumise le</p>
                <p className="mt-1">{formatDateTime(demande.date_soumission)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Delai de validation</p>
                <p className="mt-1">{formatDateTime(demande.date_limite_validation)}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Motif</p>
              <p className="mt-1 whitespace-pre-line text-sm">{demande.motif}</p>
            </div>

            <Separator />

            <div className="flex flex-col gap-2">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Paperclip className="h-3.5 w-3.5" />
                Pieces justificatives ({demande.pieces_jointes.length})
              </p>

              {demande.pieces_jointes.length === 0 ? (
                <EmptyState
                  icon={Paperclip}
                  title="Aucune piece jointe"
                  description="Le demandeur n'a joint aucun justificatif."
                />
              ) : (
                <div className="flex flex-col gap-2">
                  {demande.pieces_jointes.map((piece) => (
                    <PieceJointeLien
                      key={piece.id}
                      libelle={piece.libelle}
                      description={piece.description}
                      url={piece.fichier_url}
                      nomFichier={piece.nom_fichier}
                    />
                  ))}
                </div>
              )}
            </div>

            {demande.statut !== "en_attente" && (
              <div className="rounded-md bg-secondary p-3 text-sm">
                <p>
                  {demande.statut === "validee" && "Demande validee"}
                  {demande.statut === "refusee" && "Demande refusee"}
                  {demande.statut === "expiree" &&
                    "Demande refusee automatiquement (delai depasse)"}
                  {demande.valide_par_nom && ` par ${demande.valide_par_nom}`}
                  {demande.date_validation && ` le ${formatDateTime(demande.date_validation)}`}.
                </p>
                {demande.commentaire_refus && (
                  <p className="mt-1 text-muted-foreground">Motif : {demande.commentaire_refus}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          {soldeAgent && (
            <Card>
              <CardHeader>
                <CardTitle>Solde de l&apos;agent</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Solde actuel</span>
                  <span className="font-mono text-lg font-semibold">
                    {soldeAgent.solde_restant} j
                  </span>
                </div>

                {demande.statut === "en_attente" && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Apres validation</span>
                    <span
                      className={
                        soldeApres !== null && soldeApres < 0
                          ? "font-mono font-semibold text-status-danger"
                          : "font-mono font-semibold"
                      }
                    >
                      {soldeApres} j
                    </span>
                  </div>
                )}

                {!demande.decremente_le_solde && (
                  <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    Ce type de conge ne decremente pas le solde.
                  </p>
                )}

                {soldeApres !== null && soldeApres < 0 && (
                  <p className="rounded-md bg-status-danger-bg px-3 py-2 text-xs text-status-danger">
                    Solde insuffisant : la validation sera refusee par le systeme.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {peutTelechargerNote && (
            <Card>
              <CardHeader>
                <CardTitle>Note de service</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {demande.note_conge_pdf ? (
                  <Button onClick={telechargerNote} disabled={telechargementEnCours}>
                    {telechargementEnCours ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    Telecharger le PDF
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    La Note de service est en cours de generation. Elle sera bientot
                    disponible au telechargement.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {peutTraiter && (
            <Card>
              <CardHeader>
                <CardTitle>Traiter la demande</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <p className="mb-1 text-xs text-muted-foreground">
                  Consultez les pieces jointes ci-contre avant de vous prononcer.
                </p>
                <Button onClick={() => setDialogValidation(true)} disabled={actionEnCours}>
                  {actionEnCours ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Valider
                </Button>
                <Button
                  variant="outline"
                  className="text-status-danger"
                  onClick={() => setDialogRefus(true)}
                  disabled={actionEnCours}
                >
                  <X className="h-4 w-4" />
                  Refuser
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={dialogValidation}
        onOpenChange={setDialogValidation}
        title="Valider la demande de conge"
        description={`${demande.agent_nom} — ${demande.nombre_jours} jour(s)${
          demande.decremente_le_solde ? ", deduits de son solde." : ", sans impact sur son solde."
        }`}
        confirmLabel="Valider"
        onConfirm={valider}
      />

      <ConfirmDialog
        open={dialogRefus}
        onOpenChange={setDialogRefus}
        title="Refuser la demande de conge"
        description={`Demande de ${demande.agent_nom}`}
        confirmLabel="Refuser"
        variant="destructive"
        requireComment
        commentLabel="Motif du refus"
        onConfirm={refuser}
      />
    </div>
  );
}
