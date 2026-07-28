"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Download, FileCheck2, Loader2, Upload } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { MissionStatusBadge, ReceptionStatusBadge } from "@/components/shared/status-badges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/components/providers/auth-provider";
import { api } from "@/lib/api";
import type { Mission } from "@/lib/types";
import { formatDate, formatDateTime } from "@/lib/constants";

export default function MissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { utilisateur } = useAuth();
  const [mission, setMission] = React.useState<Mission | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [fichierSigne, setFichierSigne] = React.useState("");
  const [rapport, setRapport] = React.useState("");
  const [actionEnCours, setActionEnCours] = React.useState<string | null>(null);

  const charger = React.useCallback(() => {
    setLoading(true);
    api
      .get<Mission>(`missions/${id}/`)
      .then(setMission)
      .finally(() => setLoading(false));
  }, [id]);

  React.useEffect(() => {
    charger();
  }, [charger]);

  const monAffectation = mission?.agents_designes.find((a) => a.agent === utilisateur.id);

  async function confirmerClic() {
    if (!mission || !monAffectation) return;
    setActionEnCours("clic");
    try {
      await api.post(`missions/${mission.id}/agents/${utilisateur.id}/confirmer/`);
      toast.success("Reception confirmee.");
      charger();
    } catch {
      toast.error("Impossible de confirmer la reception.");
    } finally {
      setActionEnCours(null);
    }
  }

  async function envoyerSignature() {
    if (!mission || !fichierSigne) return;
    setActionEnCours("signature");
    try {
      await api.post(`missions/${mission.id}/agents/${utilisateur.id}/signature/`, {
        fichier_signe: fichierSigne,
      });
      toast.success("Document signe transmis.");
      setFichierSigne("");
      charger();
    } catch {
      toast.error("Impossible de transmettre le document.");
    } finally {
      setActionEnCours(null);
    }
  }

  async function envoyerRapport() {
    if (!mission || !rapport) return;
    setActionEnCours("rapport");
    try {
      await api.post(`missions/${mission.id}/agents/${utilisateur.id}/rapport/`, {
        rapport_mission: rapport,
      });
      toast.success("Rapport de mission soumis.");
      charger();
    } catch {
      toast.error("Impossible de soumettre le rapport.");
    } finally {
      setActionEnCours(null);
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
                <p className="text-xs text-muted-foreground">Agents designes</p>
                <p className="mt-1">{mission.agents_designes.length}</p>
              </div>
            </div>

            <Separator />

            <p className="text-xs text-muted-foreground">Suivi de reception par agent</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Reception</TableHead>
                  <TableHead>Rapport</TableHead>
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
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {a.date_soumission_rapport ? formatDateTime(a.date_soumission_rapport) : "En attente"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {monAffectation && (
          <Card>
            <CardHeader>
              <CardTitle>Mes actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div>
                <p className="mb-2 text-xs text-muted-foreground">Ordre de mission</p>
                {monAffectation.ordre_mission_pdf ? (
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <a href={monAffectation.ordre_mission_pdf} target="_blank" rel="noreferrer">
                      <Download className="h-4 w-4" />
                      Telecharger le PDF
                    </a>
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">Generation en cours...</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-xs text-muted-foreground">
                  Confirmation de reception ({monAffectation.confirmation_clic ? "clic effectue" : "clic requis"})
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
                  {monAffectation.confirmation_clic ? "Reception confirmee" : "Confirmer la reception"}
                </Button>
              </div>

              {!monAffectation.fichier_signe && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="fichier_signe" className="text-xs text-muted-foreground">
                    Lien du document signe (upload prealable requis)
                  </Label>
                  <Input
                    id="fichier_signe"
                    placeholder="https://..."
                    value={fichierSigne}
                    onChange={(e) => setFichierSigne(e.target.value)}
                  />
                  <Button size="sm" variant="outline" onClick={envoyerSignature} disabled={!fichierSigne || actionEnCours === "signature"}>
                    {actionEnCours === "signature" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Transmettre le document signe
                  </Button>
                </div>
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
                <Button size="sm" onClick={envoyerRapport} disabled={!rapport || actionEnCours === "rapport"}>
                  {actionEnCours === "rapport" && <Loader2 className="h-4 w-4 animate-spin" />}
                  {monAffectation.rapport_mission ? "Mettre a jour le rapport" : "Soumettre le rapport"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
