"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Briefcase, Search } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { MissionStatusBadge } from "@/components/shared/status-badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/components/providers/auth-provider";
import { api } from "@/lib/api";
import type { Mission, Paginated, StatutMission } from "@/lib/types";
import { formatDate } from "@/lib/constants";

const FILTRES: { value: StatutMission | "toutes"; label: string }[] = [
  { value: "toutes", label: "Tous les statuts" },
  { value: "planifiee", label: "Planifiee" },
  { value: "en_cours", label: "En cours" },
  { value: "terminee", label: "Terminee" },
  { value: "annulee", label: "Annulee" },
];

export default function MissionsPage() {
  const { utilisateur } = useAuth();
  const [missions, setMissions] = React.useState<Mission[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statut, setStatut] = React.useState<string>("toutes");
  const [recherche, setRecherche] = React.useState("");

  const peutCreer = ["chef_service", "directeur", "administrateur"].includes(utilisateur.role);

  React.useEffect(() => {
    setLoading(true);
    api
      .get<Paginated<Mission>>("missions/", {
        statut: statut === "toutes" ? undefined : statut,
        search: recherche || undefined,
      })
      .then((data) => setMissions(data.results))
      .finally(() => setLoading(false));
  }, [statut, recherche]);

  return (
    <div>
      <PageHeader
        title="Missions"
        description="Suivi des missions envoyees et de leur deroulement"
        action={
          peutCreer && (
            <Button size="sm" asChild>
              <Link href="/missions/nouvelle">
                <Plus className="h-4 w-4" />
                Nouvelle mission
              </Link>
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un motif, une destination..."
            className="pl-8"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
        </div>
        <Select value={statut} onValueChange={setStatut}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FILTRES.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : missions.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="Aucune mission"
          description="Aucune mission ne correspond a votre recherche pour le moment."
        />
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Destination</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Periode</TableHead>
                <TableHead>Agents</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {missions.map((mission) => (
                <TableRow key={mission.id} className="cursor-pointer">
                  <TableCell>
                    <Link href={`/missions/${mission.id}`} className="block font-medium">
                      {mission.destination}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{mission.type_mission_libelle}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDate(mission.date_debut)} → {formatDate(mission.date_fin)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{mission.agents_designes.length}</TableCell>
                  <TableCell>
                    <MissionStatusBadge statut={mission.statut} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
