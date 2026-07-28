"use client";

import * as React from "react";
import { toast } from "sonner";
import { Plus, Building2, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { api, ApiError } from "@/lib/api";
import type { Direction, Paginated } from "@/lib/types";

export default function AdminOrganisationPage() {
  const [directions, setDirections] = React.useState<Direction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogDirection, setDialogDirection] = React.useState(false);
  const [dialogService, setDialogService] = React.useState(false);
  const [nomDirection, setNomDirection] = React.useState("");
  const [service, setService] = React.useState({ nom: "", direction: "" });
  const [erreur, setErreur] = React.useState<string | null>(null);
  const [enCours, setEnCours] = React.useState(false);

  const charger = React.useCallback(() => {
    setLoading(true);
    api
      .get<Paginated<Direction>>("directions/")
      .then((d) => setDirections(d.results))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    charger();
  }, [charger]);

  async function creerDirection(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      await api.post("directions/", { nom: nomDirection });
      toast.success("Direction creee.");
      setNomDirection("");
      setDialogDirection(false);
      charger();
    } catch {
      setErreur("Impossible de creer cette direction (nom deja utilise ?).");
    } finally {
      setEnCours(false);
    }
  }

  async function creerService(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      await api.post("services/", service);
      toast.success("Service cree.");
      setService({ nom: "", direction: "" });
      setDialogService(false);
      charger();
    } catch (err) {
      if (err instanceof ApiError) {
        setErreur("Impossible de creer ce service. Verifiez les champs.");
      }
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Directions & services"
        description="Structure organisationnelle du CENETI"
        action={
          <div className="flex gap-2">
            <Dialog open={dialogDirection} onOpenChange={setDialogDirection}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4" />
                  Direction
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nouvelle direction</DialogTitle></DialogHeader>
                <form onSubmit={creerDirection} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="nom_direction">Nom</Label>
                    <Input id="nom_direction" value={nomDirection} onChange={(e) => setNomDirection(e.target.value)} required />
                  </div>
                  {erreur && <p className="text-sm text-status-danger">{erreur}</p>}
                  <DialogFooter>
                    <Button type="submit" disabled={enCours}>
                      {enCours && <Loader2 className="h-4 w-4 animate-spin" />}
                      Creer
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={dialogService} onOpenChange={setDialogService}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4" />
                  Service
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nouveau service</DialogTitle></DialogHeader>
                <form onSubmit={creerService} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="nom_service">Nom</Label>
                    <Input id="nom_service" value={service.nom} onChange={(e) => setService({ ...service, nom: e.target.value })} required />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Direction de rattachement</Label>
                    <Select value={service.direction} onValueChange={(v) => setService({ ...service, direction: v })}>
                      <SelectTrigger><SelectValue placeholder="Selectionner" /></SelectTrigger>
                      <SelectContent>
                        {directions.map((d) => (
                          <SelectItem key={d.id} value={d.id}>{d.nom}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {erreur && <p className="text-sm text-status-danger">{erreur}</p>}
                  <DialogFooter>
                    <Button type="submit" disabled={enCours || !service.direction}>
                      {enCours && <Loader2 className="h-4 w-4 animate-spin" />}
                      Creer
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {loading ? (
        <Skeleton className="h-64" />
      ) : directions.length === 0 ? (
        <EmptyState icon={Building2} title="Aucune direction" description="Commencez par creer une direction." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {directions.map((d) => (
            <Card key={d.id}>
              <CardHeader>
                <CardTitle>{d.nom}</CardTitle>
              </CardHeader>
              <CardContent>
                {d.services.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun service rattache.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {d.services.map((s, i) => (
                      <React.Fragment key={s.id}>
                        {i > 0 && <Separator />}
                        <div className="flex items-center justify-between text-sm">
                          <span>{s.nom}</span>
                          <span className="font-mono text-xs text-muted-foreground">{s.nombre_agents} agent(s)</span>
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
