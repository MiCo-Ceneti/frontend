"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2, Search, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { api, messageErreur } from "@/lib/api";
import type {
  AgentAffecte, AgentRejete, DisponibiliteAgent, Mission, Paginated, Utilisateur,
} from "@/lib/types";

/**
 * Ajout d'agents a une mission existante (createur uniquement, avant le debut).
 * La disponibilite de chaque agent est pre-verifiee cote backend afin d'afficher
 * le motif d'indisponibilite avant meme de valider.
 */
export function GestionAgentsDialog({
  mission,
  open,
  onOpenChange,
  onTermine,
}: {
  mission: Mission;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTermine: (resultat: { ajoutes: AgentAffecte[]; rejetes: AgentRejete[] }) => void;
}) {
  const [agents, setAgents] = React.useState<Utilisateur[]>([]);
  const [selection, setSelection] = React.useState<string[]>([]);
  const [recherche, setRecherche] = React.useState("");
  const [disponibilites, setDisponibilites] = React.useState<Record<string, DisponibiliteAgent>>({});
  const [enCours, setEnCours] = React.useState(false);

  const dejaDesignes = React.useMemo(
    () => new Set(mission.agents_designes.map((a) => a.agent)),
    [mission.agents_designes]
  );

  React.useEffect(() => {
    if (!open) return;
    setSelection([]);
    api
      .get<Paginated<Utilisateur>>("utilisateurs/", { actif: true })
      .then((d) => setAgents(d.results.filter((a) => !dejaDesignes.has(a.id))))
      .catch(() => toast.error("Chargement des agents impossible."));
  }, [open, dejaDesignes]);

  // Verification de disponibilite differee, pour ne pas appeler l'API a chaque clic.
  React.useEffect(() => {
    if (!open || selection.length === 0) return;
    const minuteur = setTimeout(() => {
      api
        .get<DisponibiliteAgent[]>(`missions/${mission.id}/disponibilite/`, {
          agents: selection.join(","),
        })
        .then((resultats) => {
          setDisponibilites((prev) => {
            const suivant = { ...prev };
            for (const r of resultats) suivant[r.agent] = r;
            return suivant;
          });
        })
        .catch(() => {
          // Non bloquant : le backend revalide de toute facon a l'ajout.
        });
    }, 350);
    return () => clearTimeout(minuteur);
  }, [open, selection, mission.id]);

  const agentsFiltres = React.useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    if (!terme) return agents;
    return agents.filter(
      (a) =>
        a.nom_complet.toLowerCase().includes(terme) ||
        a.matricule.toLowerCase().includes(terme)
    );
  }, [agents, recherche]);

  async function ajouter() {
    if (selection.length === 0) return;
    setEnCours(true);
    try {
      const resultat = await api.post<{
        agents_ajoutes: AgentAffecte[];
        agents_rejetes: AgentRejete[];
      }>(`missions/${mission.id}/agents/`, { agents: selection });

      onOpenChange(false);
      onTermine({
        ajoutes: resultat.agents_ajoutes ?? [],
        rejetes: resultat.agents_rejetes ?? [],
      });
    } catch (err) {
      toast.error(messageErreur(err, "Impossible d'ajouter ces agents."));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajouter des agents</DialogTitle>
          <DialogDescription>
            Tant que la mission n&apos;a pas debute, vous pouvez completer sa composition.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un agent..."
            className="pl-8"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
        </div>

        <ScrollArea className="h-72 rounded-md border border-border">
          <div className="flex flex-col gap-1 p-2">
            {agentsFiltres.map((agent) => {
              const dispo = disponibilites[agent.id];
              const indisponible = dispo && !dispo.disponible;
              return (
                <label
                  key={agent.id}
                  className="flex cursor-pointer flex-col gap-0.5 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                >
                  <div className="flex items-center gap-2.5">
                    <Checkbox
                      checked={selection.includes(agent.id)}
                      onCheckedChange={() =>
                        setSelection((prev) =>
                          prev.includes(agent.id)
                            ? prev.filter((i) => i !== agent.id)
                            : [...prev, agent.id]
                        )
                      }
                    />
                    <span className="flex-1 truncate">{agent.nom_complet}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {agent.matricule}
                    </span>
                  </div>
                  {indisponible && (
                    <p className="pl-7 text-xs text-status-danger">{dispo.motif}</p>
                  )}
                </label>
              );
            })}
            {agentsFiltres.length === 0 && (
              <p className="px-2 py-3 text-sm text-muted-foreground">
                Aucun agent disponible a ajouter.
              </p>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={enCours}>
            Annuler
          </Button>
          <Button onClick={ajouter} disabled={enCours || selection.length === 0}>
            {enCours ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Ajouter ({selection.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
