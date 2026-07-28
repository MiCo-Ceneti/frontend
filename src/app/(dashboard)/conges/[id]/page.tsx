"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { CongeStatusBadge } from "@/components/shared/status-badges";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/components/providers/auth-provider";
import { api } from "@/lib/api";
import type { DemandeConge } from "@/lib/types";
import { formatDate, formatDateTime } from "@/lib/constants";

export default function DemandeCongeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { utilisateur } = useAuth();
  const router = useRouter();
  const [demande, setDemande] = React.useState<DemandeConge | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [dialogRefus, setDialogRefus] = React.useState(false);

  const estResponsable = ["chef_service", "directeur", "administrateur"].includes(utilisateur.role);

  const charger = React.useCallback(() => {
    setLoading(true);
    api
      .get<DemandeConge>(`conges/demandes/${id}/`)
      .then(setDemande)
      .finally(() => setLoading(false));
  }, [id]);

  React.useEffect(() => {
    charger();
  }, [charger]);

  async function valider() {
    try {
      await api.post(`conges/demandes/${id}/valider/`);
      toast.success("Demande validee.");
      charger();
    } catch {
      toast.error("Impossible de valider (solde insuffisant ?).");
    }
  }

  async function refuser(commentaire?: string) {
    await api.post(`conges/demandes/${id}/refuser/`, { commentaire_refus: commentaire });
    toast.success("Demande refusee.");
    charger();
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

  const peutTraiter = estResponsable && demande.statut === "en_attente" && demande.agent !== utilisateur.id;

  return (
    <div>
      <PageHeader
        title={`Conge du ${formatDate(demande.date_debut)} au ${formatDate(demande.date_fin)}`}
        description={demande.agent_nom}
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
                <p className="mt-1 capitalize">{demande.type_conge_libelle}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Nombre de jours</p>
                <p className="mt-1 font-mono">{demande.nombre_jours}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">A deduire du solde</p>
                <p className="mt-1">{demande.a_solder ? "Oui" : "Non"}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Motif</p>
              <p className="mt-1 text-sm">{demande.motif}</p>
            </div>

            {demande.piece_jointe && (
              <div>
                <p className="text-xs text-muted-foreground">Piece justificative</p>
                <a
                  href={demande.piece_jointe}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-sm underline underline-offset-4"
                >
                  Consulter le document
                </a>
              </div>
            )}

            <Separator />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Soumise le</p>
                <p className="mt-1">{formatDateTime(demande.date_soumission)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Delai de validation</p>
                <p className="mt-1">{formatDateTime(demande.date_limite_validation)}</p>
              </div>
            </div>

            {demande.statut !== "en_attente" && (
              <div className="rounded-md bg-secondary p-3 text-sm">
                <p>
                  {demande.statut === "validee" && "Demande validee"}
                  {demande.statut === "refusee" && "Demande refusee"}
                  {demande.statut === "expiree" && "Demande refusee automatiquement (delai depasse)"}
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

        {peutTraiter && (
          <Card>
            <CardHeader>
              <CardTitle>Traiter la demande</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button onClick={valider}>
                <Check className="h-4 w-4" />
                Valider
              </Button>
              <Button variant="outline" className="text-status-danger" onClick={() => setDialogRefus(true)}>
                <X className="h-4 w-4" />
                Refuser
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <ConfirmDialog
        open={dialogRefus}
        onOpenChange={setDialogRefus}
        title="Refuser la demande de conge"
        confirmLabel="Refuser"
        variant="destructive"
        requireComment
        commentLabel="Motif du refus"
        onConfirm={async (c) => {
          await refuser(c);
          router.refresh();
        }}
      />
    </div>
  );
}
