"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  Download, FileCheck2, Loader2, Paperclip, Upload, UserMinus, UserPlus, XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { MissionStatusBadge, ReceptionStatusBadge } from "@/components/shared/status-badges";
import { FileUpload, PieceJointeLien } from "@/components/shared/file-upload";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { GestionAgentsDialog } from "@/components/missions/gestion-agents-dialog";
import { RefusMissionDialog } from "@/components/missions/refus-mission-dialog";
import { ResultatAffectationDialog } from "@/components/missions/resultat-affectation-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/components/providers/auth-provider";
import { api, messageErreur } from "@/lib/api";
import type { AgentAffecte, AgentRejete, Mission } from "@/lib/types";
import { formatDate, formatDateTime } from "@/lib/constants";

export default function MissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { utilisateur, rafraichir } = useAuth();

  const [mission, setMission] = React.useState<Mission | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [fichierSigne, setFichierSigne] = React.useState<File | null>(null);
  const [rapport, setRapport] = React.useState("");
  const [rapportFichier, setRapportFichier] = React.useState<File | null>(null);
  const [actionEnCours, setActionEnCours] = React.useState<string | null>(null);

  const [dialogRefus, setDialogRefus] = React.useState(false);
  const [dialogAjout, setDialogAjout] = React.useState(false);
  const [dialogRetrait, setDialogRetrait] = React.useState(false);
  const [agentARetirer, setAgentARetirer] = React.useState<{ id: string; nom: string } | null>(null);
  const [resultatAjout, setResultatAjout] = React.useState<{
    ajoutes: AgentAffecte[];
    rejetes: AgentRejete[];
  } | null>(null);

  const charger = React.useCallback(async () => {
    try {
      const donnees = await api.get<Mission>(`missions/${id}/`);
      setMission(donnees);
    } catch {
      setMission(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    charger();
  }, [charger]);

  const monAffectation = mission?.agents_designes.find((a) => a.agent === utilisateur.id);
  const estCreateur = mission?.cree_par === utilisateur.id;
  // La composition n'est modifiable que par le createur, avant le debut.
  const peutModifierComposition = Boolean(mission?.modifiable && estCreateur);

  // Le refus reste ouvert tant que la periode n'a pas commence.
  const peutRefuser = Boolean(
    monAffectation &&
      monAffectation.statut_reception === "en_attente" &&
      mission &&
      new Date(mission.date_debut) > new Date(new Date().toDateString())
  );

  async function confirmerClic() {
    if (!mission) return;
    setActionEnCours("clic");
    try {
      await api.post(`missions/${mission.id}/agents/${utilisateur.id}/confirmer/`);
      toast.success("Reception confirmee.");
      await charger();
      await rafraichir();
    } catch (err) {
      toast.error(messageErreur(err, "Impossible de confirmer la reception."));
    } finally {
      setActionEnCours(null);
    }
  }

  async function envoyerSignature() {
    if (!mission || !fichierSigne) return;
    setActionEnCours("signature");
    try {
      // Upload multipart : c'est le backend qui produit le lien Cloudinary.
      await api.upload(`missions/${mission.id}/agents/${utilisateur.id}/signature/`, {
        fichier_signe: fichierSigne,
      });
      toast.success("Document signe transmis.");
      setFichierSigne(null);
      await charger();
      await rafraichir();
    } catch (err) {
      toast.error(messageErreur(err, "Impossible de transmettre le document."));
    } finally {
      setActionEnCours(null);
    }
  }

  async function envoyerRapport() {
    if (!mission || !rapport.trim()) return;
    setActionEnCours("rapport");
    try {
      await api.upload(`missions/${mission.id}/agents/${utilisateur.id}/rapport/`, {
        rapport_mission: rapport,
        rapport_fichier: rapportFichier ?? undefined,
      });
      toast.success("Rapport de mission soumis.");
      setRapportFichier(null);
      await charger();
    } catch (err) {
      toast.error(messageErreur(err, "Impossible de soumettre le rapport."));
    } finally {
      setActionEnCours(null);
    }
  }

  async function retirerAgent() {
    if (!mission || !agentARetirer) return;
    try {
      await api.delete(`missions/${mission.id}/agents/${agentARetirer.id}/retirer/`);
      toast.success(`${agentARetirer.nom} a ete retire de la mission.`);
      setAgentARetirer(null);
      await charger();
    } catch (err) {
      toast.error(messageErreur(err, "Impossible de retirer cet agent."));
    }
  }

  async function telechargerOrdre() {
    if (!mission) return;
    try {
      const { url } = await api.get<{ url: string }>(
        `missions/${mission.id}/agents/${utilisateur.id}/ordre-mission/`
      );
      
      //console.log("Ordre de mission URL:", url);
      
      window.open(url, "_blank", "noreferrer");
    } catch (err) {
      toast.error(messageErreur(err, "Ordre de mission indisponible pour le moment."));
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

  if (!mission) {
    return <p className="text-sm text-muted-foreground">Mission introuvable.</p>;
  }

  return (
    <div>
      <PageHeader
        title={mission.destination}
        description={`Cree par ${mission.cree_par_nom} — ${formatDate(mission.date_debut)} → ${formatDate(mission.date_fin)}`}
        action={<MissionStatusBadge statut={mission.statut} />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Motif</p>
              <p className="mt-1 text-sm">{mission.motif}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="mt-1">{mission.type_mission_libelle}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Transport</p>
                <p className="mt-1">{mission.moyen_transport || "Non specifie"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Agents participants</p>
                <p className="mt-1">
                  {
                    mission.agents_designes.filter((a) => a.statut_reception !== "refusee").length
                  }{" "}
                  / {mission.agents_designes.length}
                </p>
              </div>
            </div>

            {mission.pieces_jointes.length > 0 && (
              <>
                <Separator />
                <div className="flex flex-col gap-2">
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Paperclip className="h-3.5 w-3.5" />
                    Pieces jointes
                  </p>
                  {mission.pieces_jointes.map((piece) => (
                    <PieceJointeLien
                      key={piece.id}
                      libelle={piece.libelle}
                      description={piece.description}
                      url={piece.fichier_url}
                      nomFichier={piece.nom_fichier}
                    />
                  ))}
                </div>
              </>
            )}

            <Separator />

            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Suivi de reception par agent</p>
              {peutModifierComposition && (
                <Button size="sm" variant="outline" onClick={() => setDialogAjout(true)}>
                  <UserPlus className="h-4 w-4" />
                  Ajouter un agent
                </Button>
              )}
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Reception</TableHead>
                  <TableHead>Rapport</TableHead>
                  {peutModifierComposition && <TableHead className="text-right">Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {mission.agents_designes.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <p className="font-medium">{a.agent_nom}</p>
                      <p className="font-mono text-xs text-muted-foreground">{a.agent_matricule}</p>
                    </TableCell>
                    <TableCell>
                      <ReceptionStatusBadge statut={a.statut_reception} />
                      {a.statut_reception === "refusee" && a.motif_refus && (
                        <div className="mt-1 max-w-xs">
                          <p className="text-xs text-muted-foreground">
                            {a.refus_automatique ? "Refus automatique : " : "Motif : "}
                            {a.motif_refus}
                          </p>
                          {a.justificatif_refus_url && (
                            <a
                              href={a.justificatif_refus_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs underline underline-offset-4"
                            >
                              Voir le justificatif
                            </a>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {a.date_soumission_rapport ? (
                        <div>
                          <p className="text-sm">{formatDateTime(a.date_soumission_rapport)}</p>
                          {a.rapport_fichier_url && (
                            <a
                              href={a.rapport_fichier_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs underline underline-offset-4"
                            >
                              Telecharger
                            </a>
                          )}
                        </div>
                      ) : (
                        "En attente"
                      )}
                    </TableCell>
                    {peutModifierComposition && (
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-status-danger"
                          onClick={() => {
                            setAgentARetirer({ id: a.agent, nom: a.agent_nom });
                            setDialogRetrait(true);
                          }}
                        >
                          <UserMinus className="h-4 w-4" />
                          Retirer
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {peutModifierComposition && (
              <p className="text-xs text-muted-foreground">
                La composition reste modifiable jusqu&apos;au {formatDate(mission.date_debut)}.
              </p>
            )}
          </CardContent>
        </Card>

        {monAffectation && (
          <Card>
            <CardHeader>
              <CardTitle>Mes actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              {monAffectation.statut_reception === "refusee" ? (
                <div className="rounded-md bg-status-danger-bg p-3 text-sm">
                  <p className="font-medium text-status-danger">
                    Vous ne participez pas a cette mission
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {monAffectation.refus_automatique
                      ? "Refus automatique : la reception n'a pas ete confirmee avant la date de debut."
                      : monAffectation.motif_refus}
                  </p>
                  {monAffectation.date_refus && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Le {formatDateTime(monAffectation.date_refus)}
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <div>
                    <p className="mb-2 text-xs text-muted-foreground">Ordre de mission</p>
                    {monAffectation.ordre_mission_pdf ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={telechargerOrdre}
                      >
                        <Download className="h-4 w-4" />
                        Telecharger le PDF
                      </Button>
                    ) : (
                      <p className="text-sm text-muted-foreground">Generation en cours...</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-muted-foreground">
                      Confirmation de reception (
                      {monAffectation.confirmation_clic ? "clic effectue" : "clic requis"})
                    </p>
                    <Button
                      size="sm"
                      variant={monAffectation.confirmation_clic ? "secondary" : "default"}
                      onClick={confirmerClic}
                      disabled={monAffectation.confirmation_clic || actionEnCours === "clic"}
                    >
                      {actionEnCours === "clic" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileCheck2 className="h-4 w-4" />
                      )}
                      {monAffectation.confirmation_clic
                        ? "Reception confirmee"
                        : "Confirmer la reception"}
                    </Button>
                  </div>

                  {!monAffectation.fichier_signe_url ? (
                    <div className="flex flex-col gap-2">
                      <FileUpload
                        label="Document signe"
                        fichier={fichierSigne}
                        onChange={setFichierSigne}
                        description="Scan ou PDF de l'ordre de mission signe."
                        disabled={actionEnCours === "signature"}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={envoyerSignature}
                        disabled={!fichierSigne || actionEnCours === "signature"}
                      >
                        {actionEnCours === "signature" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        Transmettre le document signe
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <p className="mb-2 text-xs text-muted-foreground">Document signe</p>
                      <Button variant="outline" size="sm" asChild className="w-full">
                        <a href={monAffectation.fichier_signe_url} target="_blank" rel="noreferrer">
                          <Download className="h-4 w-4" />
                          Consulter le document transmis
                        </a>
                      </Button>
                    </div>
                  )}

                  {peutRefuser && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-status-danger"
                      onClick={() => setDialogRefus(true)}
                    >
                      <XCircle className="h-4 w-4" />
                      Refuser cette mission
                    </Button>
                  )}

                  <Separator />

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="rapport" className="text-xs text-muted-foreground">
                      Rapport de mission
                    </Label>
                    <Textarea
                      id="rapport"
                      placeholder={monAffectation.rapport_mission || "Compte rendu de la mission..."}
                      value={rapport}
                      onChange={(e) => setRapport(e.target.value)}
                      rows={4}
                    />
                    <FileUpload
                      label="Rapport en piece jointe (optionnel)"
                      fichier={rapportFichier}
                      onChange={setRapportFichier}
                      disabled={actionEnCours === "rapport"}
                    />
                    <Button
                      size="sm"
                      onClick={envoyerRapport}
                      disabled={!rapport.trim() || actionEnCours === "rapport"}
                    >
                      {actionEnCours === "rapport" && <Loader2 className="h-4 w-4 animate-spin" />}
                      {monAffectation.rapport_mission
                        ? "Mettre a jour le rapport"
                        : "Soumettre le rapport"}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <RefusMissionDialog
        open={dialogRefus}
        onOpenChange={setDialogRefus}
        missionId={mission.id}
        agentId={utilisateur.id}
        onRefuse={charger}
      />

      <GestionAgentsDialog
        mission={mission}
        open={dialogAjout}
        onOpenChange={setDialogAjout}
        onTermine={async (resultat) => {
          await charger();
          setResultatAjout(resultat);
        }}
      />

      <ResultatAffectationDialog
        open={Boolean(resultatAjout)}
        onOpenChange={(ouvert) => !ouvert && setResultatAjout(null)}
        ajoutes={resultatAjout?.ajoutes ?? []}
        rejetes={resultatAjout?.rejetes ?? []}
        titre="Agents ajoutes"
        libelleContinuer="Fermer"
      />

      <ConfirmDialog
        open={dialogRetrait}
        onOpenChange={setDialogRetrait}
        title="Retirer cet agent de la mission"
        description={
          agentARetirer
            ? `${agentARetirer.nom} ne fera plus partie de cette mission. Il en sera informe.`
            : undefined
        }
        confirmLabel="Retirer"
        variant="destructive"
        onConfirm={retirerAgent}
      />
    </div>
  );
}
