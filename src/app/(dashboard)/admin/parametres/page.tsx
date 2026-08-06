"use client";

import * as React from "react";
import { toast } from "sonner";
import { Download, Loader2, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { FileUpload } from "@/components/shared/file-upload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import { api, messageErreur } from "@/lib/api";
import type {
  TypeMission, TypeConge, Service, Utilisateur, DocumentMinisteriel, Paginated,
} from "@/lib/types";
import { formatDateTime } from "@/lib/constants";

const MODES_VALIDATION = [
  { value: "chef_service", label: "Chef de service" },
  { value: "directeur", label: "Directeur" },
  { value: "les_deux", label: "Les deux" },
];

const DOC_INITIAL = { agent: "", annee: String(new Date().getFullYear()) };
const TYPE_CONGE_INITIAL = { libelle: "", description: "", decremente_le_solde: true };

export default function AdminParametresPage() {
  const [typesMission, setTypesMission] = React.useState<TypeMission[]>([]);
  const [typesConge, setTypesConge] = React.useState<TypeConge[]>([]);
  const [services, setServices] = React.useState<Service[]>([]);
  const [agents, setAgents] = React.useState<Utilisateur[]>([]);
  const [documents, setDocuments] = React.useState<DocumentMinisteriel[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [dialogTypeMission, setDialogTypeMission] = React.useState(false);
  const [libelleTypeMission, setLibelleTypeMission] = React.useState("");

  const [dialogTypeConge, setDialogTypeConge] = React.useState(false);
  const [typeConge, setTypeConge] = React.useState(TYPE_CONGE_INITIAL);

  const [dialogDoc, setDialogDoc] = React.useState(false);
  const [doc, setDoc] = React.useState(DOC_INITIAL);
  const [docFichier, setDocFichier] = React.useState<File | null>(null);

  const [modeGlobal, setModeGlobal] = React.useState("chef_service");
  const [enCours, setEnCours] = React.useState(false);

  const charger = React.useCallback(async () => {
    setLoading(true);
    try {
      const [tm, tc, s, a, d] = await Promise.all([
        api.get<Paginated<TypeMission>>("types-mission/"),
        api.get<Paginated<TypeConge>>("conges/types/"),
        api.get<Paginated<Service>>("services/"),
        api.get<Paginated<Utilisateur>>("utilisateurs/"),
        api.get<Paginated<DocumentMinisteriel>>("conges/documents-ministeriels/"),
      ]);
      setTypesMission(tm.results);
      setTypesConge(tc.results);
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
      await api.post("types-mission/", { libelle: libelleTypeMission });
      toast.success("Type de mission cree.");
      setLibelleTypeMission("");
      setDialogTypeMission(false);
      charger();
    } catch (err) {
      toast.error(messageErreur(err, "Impossible de creer ce type de mission."));
    } finally {
      setEnCours(false);
    }
  }

  /**
   * Types de conge entierement libres : l'administrateur cree ses propres
   * categories (« Accident de travail », « Maternite »...) et decide pour
   * chacune si elle ampute ou non le solde de l'agent.
   */
  async function creerTypeConge(e: React.FormEvent) {
    e.preventDefault();
    setEnCours(true);
    try {
      await api.post("conges/types/", {
        libelle: typeConge.libelle,
        description: typeConge.description || null,
        decremente_le_solde: typeConge.decremente_le_solde,
      });
      toast.success("Type de conge cree.");
      setTypeConge(TYPE_CONGE_INITIAL);
      setDialogTypeConge(false);
      charger();
    } catch (err) {
      toast.error(messageErreur(err, "Impossible de creer ce type de conge."));
    } finally {
      setEnCours(false);
    }
  }

  async function basculerDecrementation(type: TypeConge) {
    try {
      await api.patch(`conges/types/${type.id}/`, {
        decremente_le_solde: !type.decremente_le_solde,
      });
      setTypesConge((prev) =>
        prev.map((t) =>
          t.id === type.id ? { ...t, decremente_le_solde: !t.decremente_le_solde } : t
        )
      );
    } catch (err) {
      toast.error(messageErreur(err, "Modification impossible."));
    }
  }

  /**
   * Depot du document ministeriel : c'est un VRAI fichier (scan image ou PDF)
   * televerse en multipart, plus aucun lien a coller. Le backend le pousse sur
   * Cloudinary, et l'agent le retrouve sur sa page profil.
   */
  async function enregistrerDocument(e: React.FormEvent) {
    e.preventDefault();
    if (!docFichier) {
      toast.error("Selectionnez le fichier du document.");
      return;
    }
    setEnCours(true);
    try {
      await api.upload("conges/documents-ministeriels/", {
        agent: doc.agent,
        annee: Number(doc.annee),
        fichier: docFichier,
      });
      toast.success("Document ministeriel enregistre. L'agent en a ete informe.");
      setDoc(DOC_INITIAL);
      setDocFichier(null);
      setDialogDoc(false);
      charger();
    } catch (err) {
      toast.error(messageErreur(err, "Impossible d'enregistrer ce document."));
    } finally {
      setEnCours(false);
    }
  }

  async function enregistrerModeGlobal() {
    setEnCours(true);
    try {
      await api.post("parametres/validation-conge/", {
        service: null,
        mode_validation: modeGlobal,
      });
      toast.success("Mode de validation global enregistre.");
    } catch (err) {
      toast.error(messageErreur(err, "Impossible d'enregistrer ce parametre."));
    } finally {
      setEnCours(false);
    }
  }

  if (loading) return <Skeleton className="h-96" />;

  return (
    <div>
      <PageHeader
        title="Parametres"
        description="Types de mission et de conge, documents ministeriels et regles de validation"
      />

      <Tabs defaultValue="conges">
        <TabsList>
          <TabsTrigger value="conges">Types de conge</TabsTrigger>
          <TabsTrigger value="missions">Types de mission</TabsTrigger>
          <TabsTrigger value="documents">Documents ministeriels</TabsTrigger>
          <TabsTrigger value="validation">Validation des conges</TabsTrigger>
        </TabsList>

        {/* ---------------------------------------------------------------- */}
        <TabsContent value="conges">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Types de conge</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Un type marque « sans impact » ne decremente pas le solde de l&apos;agent.
                </p>
              </div>
              <Dialog open={dialogTypeConge} onOpenChange={setDialogTypeConge}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4" />
                    Ajouter
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nouveau type de conge</DialogTitle>
                    <DialogDescription>
                      Exemples : « Conge annuel », « Accident de travail », « Maternite ».
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={creerTypeConge} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="libelle_conge">Libelle</Label>
                      <Input
                        id="libelle_conge"
                        value={typeConge.libelle}
                        onChange={(e) => setTypeConge({ ...typeConge, libelle: e.target.value })}
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="description_conge">Description (optionnel)</Label>
                      <Textarea
                        id="description_conge"
                        value={typeConge.description}
                        onChange={(e) =>
                          setTypeConge({ ...typeConge, description: e.target.value })
                        }
                        rows={3}
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
                      <div>
                        <p className="text-sm font-medium">Decremente le solde</p>
                        <p className="text-xs text-muted-foreground">
                          Desactivez pour les conges qui n&apos;amputent pas le solde.
                        </p>
                      </div>
                      <Switch
                        checked={typeConge.decremente_le_solde}
                        onCheckedChange={(v) =>
                          setTypeConge({ ...typeConge, decremente_le_solde: v })
                        }
                      />
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
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Libelle</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Decremente le solde</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {typesConge.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.libelle}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {t.description || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Badge variant={t.decremente_le_solde ? "warning" : "secondary"}>
                            {t.decremente_le_solde ? "Oui" : "Non"}
                          </Badge>
                          <Switch
                            checked={t.decremente_le_solde}
                            onCheckedChange={() => basculerDecrementation(t)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {typesConge.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        Aucun type de conge. Creez-en un pour permettre les demandes.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------------------------------------------------------- */}
        <TabsContent value="missions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Types de mission</CardTitle>
              <Dialog open={dialogTypeMission} onOpenChange={setDialogTypeMission}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4" />
                    Ajouter
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nouveau type de mission</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={creerTypeMission} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="libelle">Libelle</Label>
                      <Input
                        id="libelle"
                        value={libelleTypeMission}
                        onChange={(e) => setLibelleTypeMission(e.target.value)}
                        required
                      />
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
                <Badge key={t.id} variant="secondary">
                  {t.libelle}
                </Badge>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------------------------------------------------------- */}
        <TabsContent value="documents">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Documents ministeriels</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Un document par agent et par annee. Il est uniquement consultable et
                  telechargeable par l&apos;agent depuis son profil.
                </p>
              </div>
              <Dialog open={dialogDoc} onOpenChange={setDialogDoc}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4" />
                    Enregistrer un document
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Nouveau document ministeriel</DialogTitle>
                    <DialogDescription>
                      Televersez le scan ou le PDF transmis par le ministere.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={enregistrerDocument} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <Label>Agent</Label>
                      <Select value={doc.agent} onValueChange={(v) => setDoc({ ...doc, agent: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selectionner un agent" />
                        </SelectTrigger>
                        <SelectContent>
                          {agents.map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.nom_complet} ({a.matricule})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="annee">Annee</Label>
                      <Input
                        id="annee"
                        type="number"
                        min={2000}
                        max={2100}
                        value={doc.annee}
                        onChange={(e) => setDoc({ ...doc, annee: e.target.value })}
                        required
                      />
                    </div>

                    <FileUpload
                      label="Document (scan image ou PDF)"
                      fichier={docFichier}
                      onChange={setDocFichier}
                      description="PDF 20 Mo max — image 10 Mo max."
                      disabled={enCours}
                    />

                    <DialogFooter>
                      <Button type="submit" disabled={enCours || !doc.agent || !docFichier}>
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
                    <TableHead>Annee</TableHead>
                    <TableHead>Enregistre par</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Fichier</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.agent_nom}</TableCell>
                      <TableCell className="font-mono">{d.annee}</TableCell>
                      <TableCell className="text-muted-foreground">{d.enregistre_par_nom}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDateTime(d.date_enregistrement)}
                      </TableCell>
                      <TableCell className="text-right">
                        {d.fichier_url && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={d.fichier_url} target="_blank" rel="noreferrer">
                              <Download className="h-4 w-4" />
                              Ouvrir
                            </a>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {documents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Aucun document enregistre.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------------------------------------------------------- */}
        <TabsContent value="validation">
          <Card>
            <CardHeader>
              <CardTitle>Mode de validation global</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Mode applique par defaut a tous les services qui n&apos;ont pas de parametre
                specifique. C&apos;est ce parametre — et non le document ministeriel — qui accorde
                les conges.
              </p>
              <div className="flex items-center gap-3">
                <Select value={modeGlobal} onValueChange={setModeGlobal}>
                  <SelectTrigger className="w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODES_VALIDATION.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={enregistrerModeGlobal} disabled={enCours}>
                  {enCours && <Loader2 className="h-4 w-4 animate-spin" />}
                  Enregistrer
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {services.length} service(s) enregistre(s). Un parametre specifique par service peut
                etre configure via l&apos;API si besoin.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
