"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarClock, Eye, Paperclip, Plus, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { CongeStatusBadge } from "@/components/shared/status-badges";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/components/providers/auth-provider";
import { api } from "@/lib/api";
import type { DemandeConge, Paginated, SoldeConge } from "@/lib/types";
import { formatDate } from "@/lib/constants";

export default function CongesPage() {
  const { utilisateur, estResponsable } = useAuth();

  const [mesDemandes, setMesDemandes] = React.useState<DemandeConge[]>([]);
  const [aValider, setAValider] = React.useState<DemandeConge[]>([]);
  const [solde, setSolde] = React.useState<SoldeConge | null>(null);
  const [loading, setLoading] = React.useState(true);

  const charger = React.useCallback(async () => {
    setLoading(true);
    try {
      const [demandes, soldeAgent] = await Promise.all([
        api.get<Paginated<DemandeConge>>("conges/demandes/"),
        api.get<SoldeConge>(`conges/solde/${utilisateur.id}/`),
      ]);
      setMesDemandes(demandes.results.filter((d) => d.agent === utilisateur.id));
      setAValider(
        demandes.results.filter((d) => d.statut === "en_attente" && d.agent !== utilisateur.id)
      );
      setSolde(soldeAgent);
    } finally {
      setLoading(false);
    }
  }, [utilisateur.id]);

  React.useEffect(() => {
    charger();
  }, [charger]);

  return (
    <div>
      <PageHeader
        title="Conges"
        description="Suivi de vos demandes et de votre solde de conge"
        action={
          <Button size="sm" asChild>
            <Link href="/conges/nouvelle">
              <Plus className="h-4 w-4" />
              Nouvelle demande
            </Link>
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-xs text-muted-foreground">Solde de conge disponible</p>
              <p className="mt-1 font-mono text-2xl font-semibold">
                {solde?.solde_restant ?? utilisateur.solde_conge} j
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Cumulable : +30 jours chaque 1er janvier.
              </p>
            </div>
            <CalendarClock className="h-8 w-8 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-xs text-muted-foreground">
                Document ministeriel {solde?.annee ?? new Date().getFullYear()}
              </p>
              <p className="mt-1 text-sm font-medium">
                {utilisateur.document_ministeriel_annee ? "Disponible" : "Non depose"}
              </p>
              {utilisateur.document_ministeriel_annee?.fichier_url && (
                <Button variant="link" size="sm" asChild className="h-auto p-0 text-xs">
                  <a
                    href={utilisateur.document_ministeriel_annee.fichier_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Telecharger depuis mon profil
                  </a>
                </Button>
              )}
            </div>
            <ShieldCheck className="h-8 w-8 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="mes-demandes">
        <TabsList>
          <TabsTrigger value="mes-demandes">Mes demandes</TabsTrigger>
          {estResponsable && (
            <TabsTrigger value="a-valider">
              A valider {aValider.length > 0 && `(${aValider.length})`}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="mes-demandes">
          {loading ? (
            <Skeleton className="h-40" />
          ) : mesDemandes.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="Aucune demande de conge"
              description="Vos demandes apparaitront ici."
            />
          ) : (
            <div className="rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Periode</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Jours</TableHead>
                    <TableHead>Pieces</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mesDemandes.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>
                        <Link href={`/conges/${d.id}`} className="font-medium">
                          {formatDate(d.date_debut)} → {formatDate(d.date_fin)}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {d.type_conge_libelle}
                        {!d.decremente_le_solde && (
                          <Badge variant="secondary" className="ml-2">
                            Sans impact
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">
                        {d.nombre_jours}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {d.pieces_jointes.length > 0 ? (
                          <span className="flex items-center gap-1 text-sm">
                            <Paperclip className="h-3.5 w-3.5" />
                            {d.pieces_jointes.length}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <CongeStatusBadge statut={d.statut} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {estResponsable && (
          <TabsContent value="a-valider">
            {loading ? (
              <Skeleton className="h-40" />
            ) : aValider.length === 0 ? (
              <EmptyState
                icon={CalendarClock}
                title="Aucune demande en attente"
                description="Toutes les demandes de votre perimetre sont traitees."
              />
            ) : (
              <>
                <p className="mb-3 text-xs text-muted-foreground">
                  Ouvrez le detail d&apos;une demande pour consulter ses pieces justificatives avant
                  de vous prononcer.
                </p>
                <div className="rounded-lg border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agent</TableHead>
                        <TableHead>Periode</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Jours</TableHead>
                        <TableHead>Pieces</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {aValider.map((d) => (
                        <TableRow key={d.id}>
                          <TableCell className="font-medium">{d.agent_nom}</TableCell>
                          <TableCell className="whitespace-nowrap text-muted-foreground">
                            {formatDate(d.date_debut)} → {formatDate(d.date_fin)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {d.type_conge_libelle}
                          </TableCell>
                          <TableCell className="font-mono text-muted-foreground">
                            {d.nombre_jours}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {d.pieces_jointes.length > 0 ? (
                              <span className="flex items-center gap-1 text-sm">
                                <Paperclip className="h-3.5 w-3.5" />
                                {d.pieces_jointes.length}
                              </span>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/conges/${d.id}`}>
                                <Eye className="h-4 w-4" />
                                Examiner
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
