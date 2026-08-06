"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Search } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { PiecesJointesUpload, type PieceJointeSaisie } from "@/components/shared/file-upload";
import { ResultatAffectationDialog } from "@/components/missions/resultat-affectation-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { api, messageErreur, versFormData } from "@/lib/api";
import type {
  Utilisateur, TypeMission, Paginated, MissionCreee, AgentAffecte, AgentRejete,
} from "@/lib/types";

export default function NouvelleMissionPage() {
  const router = useRouter();
  const [agents, setAgents] = React.useState<Utilisateur[]>([]);
  const [typesMission, setTypesMission] = React.useState<TypeMission[]>([]);
  const [agentsSelectionnes, setAgentsSelectionnes] = React.useState<string[]>([]);
  const [recherche, setRecherche] = React.useState("");
  const [pieces, setPieces] = React.useState<PieceJointeSaisie[]>([]);
  const [erreur, setErreur] = React.useState<string | null>(null);
  const [enCours, setEnCours] = React.useState(false);

  // Resultat de l'affectation, presente dans le modal apres creation.
  const [resultat, setResultat] = React.useState<{
    missionId: string;
    ajoutes: AgentAffecte[];
    rejetes: AgentRejete[];
  } | null>(null);

  const [form, setForm] = React.useState({
    motif: "",
    type_mission: "",
    destination_type: "ville_autre",
    destination: "",
    date_debut: "",
    date_fin: "",
    moyen_transport: "",
  });

  React.useEffect(() => {
    api
      .get<Paginated<Utilisateur>>("utilisateurs/", { actif: true })
      .then((d) => setAgents(d.results))
      .catch(() => toast.error("Chargement des agents impossible."));
    api
      .get<Paginated<TypeMission>>("types-mission/")
      .then((d) => setTypesMission(d.results))
      .catch(() => toast.error("Chargement des types de mission impossible."));
  }, []);

  const agentsFiltres = React.useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    if (!terme) return agents;
    return agents.filter(
      (a) =>
        a.nom_complet.toLowerCase().includes(terme) ||
        a.matricule.toLowerCase().includes(terme) ||
        (a.service_nom ?? "").toLowerCase().includes(terme)
    );
  }, [agents, recherche]);

  function toggleAgent(id: string) {
    setAgentsSelectionnes((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);

    if (agentsSelectionnes.length === 0) {
      setErreur("Selectionnez au moins un agent.");
      return;
    }
    if (!form.type_mission) {
      setErreur("Selectionnez un type de mission.");
      return;
    }

    setEnCours(true);
    try {
      // Envoi multipart : les pieces jointes sont de vrais fichiers, le backend
      // se charge de les pousser vers Cloudinary.
      const formData = versFormData({
        ...form,
        agents: agentsSelectionnes,
        fichiers: pieces.map((p) => p.fichier),
        libelles: pieces.map((p) => p.libelle),
      });

      const mission = await api.upload<MissionCreee>("missions/", formData);

      // Le backend cree la mission meme si certains agents sont ecartes :
      // on presente systematiquement le detail dans un modal.
      setResultat({
        missionId: mission.id,
        ajoutes: mission.agents_ajoutes ?? [],
        rejetes: mission.agents_rejetes ?? [],
      });

      if ((mission.agents_rejetes ?? []).length === 0) {
        toast.success("Mission creee. Les ordres de mission sont en cours de generation.");
      } else {
        toast.warning("Mission creee, mais certains agents n'ont pas pu etre affectes.");
      }
    } catch (err) {
      setErreur(messageErreur(err, "Impossible de creer la mission. Verifiez les champs."));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Nouvelle mission"
        description="Designer un ou plusieurs agents pour une mission"
      />

      <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="flex flex-col gap-4 p-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="motif">Motif de la mission</Label>
              <Textarea
                id="motif"
                value={form.motif}
                onChange={(e) => setForm({ ...form, motif: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label>Type de mission</Label>
                <Select
                  value={form.type_mission}
                  onValueChange={(v) => setForm({ ...form, type_mission: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    {typesMission.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.libelle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Destination</Label>
                <Select
                  value={form.destination_type}
                  onValueChange={(v) => setForm({ ...form, destination_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ville_autre">Ville autre</SelectItem>
                    <SelectItem value="exterieur_pays">Exterieur du pays</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="destination">Ville / pays de destination</Label>
              <Input
                id="destination"
                value={form.destination}
                onChange={(e) => setForm({ ...form, destination: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="date_debut">Date de debut</Label>
                <Input
                  id="date_debut"
                  type="date"
                  value={form.date_debut}
                  onChange={(e) => setForm({ ...form, date_debut: e.target.value })}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="date_fin">Date de fin</Label>
                <Input
                  id="date_fin"
                  type="date"
                  min={form.date_debut || undefined}
                  value={form.date_fin}
                  onChange={(e) => setForm({ ...form, date_fin: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="moyen_transport">Moyen de transport (optionnel)</Label>
              <Input
                id="moyen_transport"
                value={form.moyen_transport}
                onChange={(e) => setForm({ ...form, moyen_transport: e.target.value })}
              />
            </div>

            <PiecesJointesUpload
              pieces={pieces}
              onChange={setPieces}
              disabled={enCours}
              titre="Pieces jointes de la mission (optionnel)"
              aideDescription={false}
            />

            {erreur && (
              <p className="rounded-md bg-status-danger-bg px-3 py-2 text-sm text-status-danger">
                {erreur}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/missions")}
                disabled={enCours}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={enCours}>
                {enCours && <Loader2 className="h-4 w-4 animate-spin" />}
                Creer la mission
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-3 p-5">
            <div className="flex items-center justify-between">
              <Label>Agents designes</Label>
              <span className="font-mono text-xs text-muted-foreground">
                {agentsSelectionnes.length}
              </span>
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un agent..."
                className="pl-8"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
              />
            </div>

            <ScrollArea className="h-80 rounded-md border border-border">
              <div className="flex flex-col gap-1 p-2">
                {agentsFiltres.map((agent) => (
                  <label
                    key={agent.id}
                    className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                  >
                    <Checkbox
                      checked={agentsSelectionnes.includes(agent.id)}
                      onCheckedChange={() => toggleAgent(agent.id)}
                    />
                    <span className="flex-1 truncate">{agent.nom_complet}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {agent.matricule}
                    </span>
                  </label>
                ))}
                {agentsFiltres.length === 0 && (
                  <p className="px-2 py-3 text-sm text-muted-foreground">Aucun agent trouve.</p>
                )}
              </div>
            </ScrollArea>

            <p className="text-xs text-muted-foreground">
              Un agent deja engage sur une mission confirmee couvrant ces dates sera
              automatiquement ecarte : la mission sera creee sans lui, et le detail vous sera
              presente.
            </p>
          </CardContent>
        </Card>
      </form>

      <ResultatAffectationDialog
        open={Boolean(resultat)}
        onOpenChange={(ouvert) => {
          if (!ouvert && resultat) {
            const id = resultat.missionId;
            setResultat(null);
            router.push(`/missions/${id}`);
          }
        }}
        ajoutes={resultat?.ajoutes ?? []}
        rejetes={resultat?.rejetes ?? []}
        titre="Mission creee"
        onContinuer={() => {
          if (resultat) router.push(`/missions/${resultat.missionId}`);
        }}
      />
    </div>
  );
}
