"use client";

import * as React from "react";
import Link from "next/link";
import { Users, Briefcase, CalendarClock, AlertCircle, Download } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { api } from "@/lib/api";
import type { DashboardStats } from "@/lib/types";
import { STATUT_AGENT_LABELS, ROLE_LABELS } from "@/lib/constants";

export default function DashboardPage() {
  const { utilisateur } = useAuth();
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    api
      .get<DashboardStats>("dashboard/stats/")
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader
        title={`Bonjour, ${utilisateur.prenom}`}
        description={`${ROLE_LABELS[utilisateur.role]} — vue d'ensemble de votre perimetre`}
        action={
          <Button variant="outline" size="sm" asChild>
            <a href="/api/backend/dashboard/export/?format=pdf" target="_blank" rel="noreferrer">
              <Download className="h-4 w-4" />
              Exporter (PDF)
            </a>
          </Button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Agents suivis" value={stats.total_agents} icon={Users} />
            <StatCard label="Missions en cours" value={stats.missions.en_cours} icon={Briefcase} />
            <StatCard label="Conges en attente" value={stats.conges.en_attente} icon={CalendarClock} />
            <StatCard
              label="Statuts a surveiller"
              value={stats.repartition_statuts.absent ?? 0}
              icon={AlertCircle}
            />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Repartition des agents</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {(Object.keys(stats.repartition_statuts) as Array<keyof typeof stats.repartition_statuts>).map(
                  (cle) => {
                    const total = stats.total_agents || 1;
                    const valeur = stats.repartition_statuts[cle];
                    const pourcentage = Math.round((valeur / total) * 100);
                    return (
                      <div key={cle} className="flex items-center gap-3">
                        <span className="w-24 shrink-0 text-sm text-muted-foreground">
                          {STATUT_AGENT_LABELS[cle]}
                        </span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-foreground"
                            style={{ width: `${pourcentage}%` }}
                          />
                        </div>
                        <span className="w-10 shrink-0 text-right font-mono text-sm">{valeur}</span>
                      </div>
                    );
                  }
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Missions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Planifiees</p>
                    <p className="mt-1 font-mono text-lg">{stats.missions.planifiees}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">En cours</p>
                    <p className="mt-1 font-mono text-lg">{stats.missions.en_cours}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Terminees</p>
                    <p className="mt-1 font-mono text-lg">{stats.missions.terminees}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Annulees</p>
                    <p className="mt-1 font-mono text-lg">{stats.missions.annulees}</p>
                  </div>
                </div>
                <Link href="/missions" className="mt-4 inline-block text-sm underline underline-offset-4">
                  Voir toutes les missions
                </Link>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Impossible de charger les statistiques.</p>
      )}
    </div>
  );
}
