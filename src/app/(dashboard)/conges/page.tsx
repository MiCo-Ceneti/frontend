"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, CalendarClock, Check, X } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { CongeStatusBadge } from "@/components/shared/status-badges";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/components/providers/auth-provider";
import { api } from "@/lib/api";
import type { DemandeConge, Paginated } from "@/lib/types";
import { formatDate } from "@/lib/constants";

export default function CongesPage() {
  const { utilisateur } = useAuth();
  const estResponsable = ["chef_service", "directeur", "administrateur"].includes(utilisateur.role);

  const [mesDemandes, setMesDemandes] = React.useState<DemandeConge[]>([]);
  const [aValider, setAValider] = React.useState<DemandeConge[]>([]);
  const [solde, setSolde] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [demandeActive, setDemandeActive] = React.useState<DemandeConge | null>(null);
  const [dialogRefus, setDialogRefus] = React.useState(false);

  const charger = React.useCallback(async () => {
    setLoading(true);
    try {
      const [demandes, solde] = await Promise.all([
        api.get<Paginated<DemandeConge>>("conges/demandes/"),
        api.get<{ solde_restant: number }>(`conges/solde/${utilisateur.id}/`),
      ]);
      setMesDemandes(demandes.results.filter((d) => d.agent === utilisateur.id));
      setAValider(demandes.results.filter((d) => d.statut === "en_attente" && d.agent !== utilisateur.id));
      setSolde(solde.solde_restant);
    } finally {
      setLoading(false);
    }
  }, [utilisateur.id]);

  React.useEffect(() => {
    charger();
  }, [charger]);

  async function valider(demande: DemandeConge) {
    try {
      await api.post(`conges/demandes/${demande.id}/valider/`);
      toast.success("Demande validee.");
      charger();
    } catch {
      toast.error("Impossible de valider cette demande (solde insuffisant ?).");
    }
  }

  async function refuser(commentaire?: string) {
    if (!demandeActive) return;
    await api.post(`conges/demandes/${demandeActive.id}/refuser/`, { commentaire_refus: commentaire });
    toast.success("Demande refusee.");
    charger();
  }

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

      <Card className="mb-6">
        <CardContent className="flex items-center justify-between p-5">
          <div>
            <p className="text-xs text-muted-foreground">Solde de conge disponible</p>
            <p className="mt-1 font-mono text-2xl font-semibold">{solde ?? "-"} j</p>
          </div>
          <CalendarClock className="h-8 w-8 text-muted-foreground" />
        </CardContent>
      </Card>

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
            <EmptyState icon={CalendarClock} title="Aucune demande de conge" description="Vos demandes apparaitront ici." />
          ) : (
            <div className="rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Periode</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Jours</TableHead>
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
                      <TableCell className="capitalize text-muted-foreground">{d.type_conge_libelle}</TableCell>
                      <TableCell className="font-mono text-muted-foreground">{d.nombre_jours}</TableCell>
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
              <EmptyState icon={CalendarClock} title="Aucune demande en attente" description="Toutes les demandes de votre perimetre sont traitees." />
            ) : (
              <div className="rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent</TableHead>
                      <TableHead>Periode</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Jours</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {aValider.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.agent_nom}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(d.date_debut)} → {formatDate(d.date_fin)}
                        </TableCell>
                        <TableCell className="capitalize text-muted-foreground">{d.type_conge_libelle}</TableCell>
                        <TableCell className="font-mono text-muted-foreground">{d.nombre_jours}</TableCell>
                        <TableCell className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => valider(d)}>
                            <Check className="h-4 w-4" />
                            Valider
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-status-danger"
                            onClick={() => {
                              setDemandeActive(d);
                              setDialogRefus(true);
                            }}
                          >
                            <X className="h-4 w-4" />
                            Refuser
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      <ConfirmDialog
        open={dialogRefus}
        onOpenChange={setDialogRefus}
        title="Refuser la demande de conge"
        description={demandeActive ? `Demande de ${demandeActive.agent_nom}` : undefined}
        confirmLabel="Refuser"
        variant="destructive"
        requireComment
        commentLabel="Motif du refus"
        onConfirm={refuser}
      />
    </div>
  );
}
