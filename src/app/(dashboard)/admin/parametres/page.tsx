"use client";

import * as React from "react";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import type { TypeMission, Service, Utilisateur, DocumentMinisteriel, Paginated } from "@/lib/types";
import { formatDate } from "@/lib/constants";

const MODES_VALIDATION = [
  { value: "chef_service", label: "Chef de service" },
  { value: "directeur", label: "Directeur" },
  { value: "les_deux", label: "Les deux" },
];

export default function AdminParametresPage() {
  const [typesMission, setTypesMission] = React.useState<TypeMission[]>([]);
  const [services, setServices] = React.useState<Service[]>([]);
  const [agents, setAgents] = React.useState<Utilisateur[]>([]);
  const [documents, setDocuments] = React.useState<DocumentMinisteriel[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [dialogType, setDialogType] = React.useState(false);
  const [libelleType, setLibelleType] = React.useState("");

  const [dialogDoc, setDialogDoc] = React.useState(false);
  const [doc, setDoc] = React.useState({
    agent: "", fichier: "", date_debut_periode: "", date_fin_periode: "", jours_accordes: "",
  });

  const [modeGlobal, setModeGlobal] = React.useState("chef_service");
  const [enCours, setEnCours] = React.useState(false);

  const charger = React.useCallback(async () => {
    setLoading(true);
    try {
      const [t, s, a, d] = await Promise.all([
        api.get<Paginated<TypeMission>>("types-mission/"),
        api.get<Paginated<Service>>("services/"),
        api.get<Paginated<Utilisateur>>("utilisateurs/"),
        api.get<Paginated<DocumentMinisteriel>>("conges/documents-ministeriels/"),
      ]);
      setTypesMission(t.results);
      setServices(s.results);
      setAgents(a.results);
      setDocuments(d.results);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    charger();
  }, [charger]);

  async function creerTypeMission(e: React.FormEvent) {
    e.preventDefault();
    setEnCours(true);
    try {
      await api.post("types-mission/", { libelle: libelleType });
      toast.success("Type de mission cree.");
      setLibelleType("");
      setDialogType(false);
      charger();
    } catch {
      toast.error("Impossible de creer ce type de mission.");
    } finally {
      setEnCours(false);
    }
  }

  async function enregistrerDocument(e: React.FormEvent) {
    e.preventDefault();
    setEnCours(true);
    try {
      await api.post("conges/documents-ministeriels/", {
        ...doc,
        jours_accordes: Number(doc.jours_accordes),
      });
      toast.success("Document ministeriel enregistre.");
      setDoc({ agent: "", fichier: "", date_debut_periode: "", date_fin_periode: "", jours_accordes: "" });
      setDialogDoc(false);
      charger();
    } catch {
      toast.error("Impossible d'enregistrer ce document.");
    } finally {
      setEnCours(false);
    }
  }

  async function enregistrerModeGlobal() {
    setEnCours(true);
    try {
      await api.post("parametres/validation-conge/", { service: null, mode_validation: modeGlobal });
      toast.success("Mode de validation global enregistre.");
    } catch {
      toast.error("Impossible d'enregistrer ce parametre.");
    } finally {
      setEnCours(false);
    }
  }

  if (loading) return <Skeleton className="h-96" />;

  return (
    <div>
      <PageHeader title="Parametres" description="Types de mission, documents ministeriels et regles de validation" />

      <Tabs defaultValue="missions">
        <TabsList>
          <TabsTrigger value="missions">Types de mission</TabsTrigger>
          <TabsTrigger value="documents">Documents ministeriels</TabsTrigger>
          <TabsTrigger value="validation">Validation des conges</TabsTrigger>
        </TabsList>

        <TabsContent value="missions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Types de mission</CardTitle>
              <Dialog open={dialogType} onOpenChange={setDialogType}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline"><Plus className="h-4 w-4" />Ajouter</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Nouveau type de mission</DialogTitle></DialogHeader>
                  <form onSubmit={creerTypeMission} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="libelle">Libelle</Label>
                      <Input id="libelle" value={libelleType} onChange={(e) => setLibelleType(e.target.value)} required />
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={enCours}>
                        {enCours && <Loader2 className="h-4 w-4 animate-spin" />}
                        Creer
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {typesMission.map((t) => (
                <Badge key={t.id} variant="secondary">{t.libelle}</Badge>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Documents ministeriels</CardTitle>
              <Dialog open={dialogDoc} onOpenChange={setDialogDoc}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-4 w-4" />Enregistrer un document</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader><DialogTitle>Nouveau document ministeriel</DialogTitle></DialogHeader>
                  <form onSubmit={enregistrerDocument} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <Label>Agent</Label>
                      <Select value={doc.agent} onValueChange={(v) => setDoc({ ...doc, agent: v })}>
                        <SelectTrigger><SelectValue placeholder="Selectionner un agent" /></SelectTrigger>
                        <SelectContent>
                          {agents.map((a) => (
                            <SelectItem key={a.id} value={a.id}>{a.nom_complet} ({a.matricule})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="fichier">Lien du document (Cloudinary)</Label>
                      <Input id="fichier" placeholder="https://..." value={doc.fichier} onChange={(e) => setDoc({ ...doc, fichier: e.target.value })} required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="debut">Debut periode</Label>
                        <Input id="debut" type="date" value={doc.date_debut_periode} onChange={(e) => setDoc({ ...doc, date_debut_periode: e.target.value })} required />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="fin">Fin periode</Label>
                        <Input id="fin" type="date" value={doc.date_fin_periode} onChange={(e) => setDoc({ ...doc, date_fin_periode: e.target.value })} required />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="jours">Jours accordes</Label>
                      <Input id="jours" type="number" min={0} value={doc.jours_accordes} onChange={(e) => setDoc({ ...doc, jours_accordes: e.target.value })} required />
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={enCours}>
                        {enCours && <Loader2 className="h-4 w-4 animate-spin" />}
                        Enregistrer
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Periode</TableHead>
                    <TableHead>Jours accordes</TableHead>
                    <TableHead>Solde restant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.agent_nom}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(d.date_debut_periode)} → {formatDate(d.date_fin_periode)}
                      </TableCell>
                      <TableCell className="font-mono">{d.jours_accordes}</TableCell>
                      <TableCell className="font-mono">{d.solde_restant}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validation">
          <Card>
            <CardHeader>
              <CardTitle>Mode de validation global</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Mode applique par defaut a tous les services qui n&apos;ont pas de parametre specifique.
              </p>
              <div className="flex items-center gap-3">
                <Select value={modeGlobal} onValueChange={setModeGlobal}>
                  <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MODES_VALIDATION.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={enregistrerModeGlobal} disabled={enCours}>
                  {enCours && <Loader2 className="h-4 w-4 animate-spin" />}
                  Enregistrer
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {services.length} service(s) enregistre(s). Un parametre specifique par service peut etre configure via l&apos;API si besoin.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
