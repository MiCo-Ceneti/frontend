"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Info, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { PiecesJointesUpload, type PieceJointeSaisie } from "@/components/shared/file-upload";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/components/providers/auth-provider";
import { api, messageErreur, versFormData } from "@/lib/api";
import type { TypeConge, Paginated } from "@/lib/types";

export default function NouvelleDemandeCongePage() {
  const router = useRouter();
  const { utilisateur } = useAuth();
  const [types, setTypes] = React.useState<TypeConge[]>([]);
  const [pieces, setPieces] = React.useState<PieceJointeSaisie[]>([]);
  const [erreur, setErreur] = React.useState<string | null>(null);
  const [enCours, setEnCours] = React.useState(false);

  const [form, setForm] = React.useState({
    type_conge: "",
    date_debut: "",
    date_fin: "",
    motif: "",
  });

  React.useEffect(() => {
    api
      .get<Paginated<TypeConge>>("conges/types/", { actif: true })
      .then((d) => setTypes(d.results))
      .catch(() => toast.error("Chargement des types de conge impossible."));
  }, []);

  const typeSelectionne = types.find((t) => t.id === form.type_conge);

  const nombreJours = React.useMemo(() => {
    if (!form.date_debut || !form.date_fin) return 0;
    const debut = new Date(form.date_debut);
    const fin = new Date(form.date_fin);
    if (fin < debut) return 0;
    return Math.round((fin.getTime() - debut.getTime()) / 86_400_000) + 1;
  }, [form.date_debut, form.date_fin]);

  // Le solde n'est ampute que si le TYPE de conge le prevoit.
  const ampute = typeSelectionne?.decremente_le_solde ?? false;
  const soldeInsuffisant = ampute && nombreJours > utilisateur.solde_conge;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);

    if (!form.type_conge) {
      setErreur("Selectionnez un type de conge.");
      return;
    }

    setEnCours(true);
    try {
      // Multipart : chaque piece jointe part comme fichier reel, avec son
      // libelle et sa description dans le meme ordre.
      const formData = versFormData({
        ...form,
        fichiers: pieces.map((p) => p.fichier),
        libelles: pieces.map((p) => p.libelle),
        descriptions: pieces.map((p) => p.description),
      });

      const demande = await api.upload<{ id: string }>("conges/demandes/", formData);
      toast.success("Demande de conge soumise.");
      router.push(`/conges/${demande.id}`);
    } catch (err) {
      setErreur(messageErreur(err, "Impossible de soumettre la demande. Verifiez les champs."));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Nouvelle demande de conge"
        description={`Solde disponible : ${utilisateur.solde_conge} jour(s)`}
      />

      <Card className="max-w-2xl">
        <CardContent className="p-5">
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Type de conge</Label>
              <Select
                value={form.type_conge}
                onValueChange={(v) => setForm({ ...form, type_conge: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {types.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {typeSelectionne && (
                <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {typeSelectionne.decremente_le_solde
                    ? "Ce type de conge est deduit de votre solde."
                    : "Ce type de conge n'ampute pas votre solde."}
                  {typeSelectionne.description ? ` ${typeSelectionne.description}` : ""}
                </p>
              )}
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

            {nombreJours > 0 && (
              <div className="flex items-center justify-between rounded-md bg-secondary px-3 py-2 text-sm">
                <span className="text-muted-foreground">Duree demandee</span>
                <span className="font-mono font-medium">{nombreJours} jour(s)</span>
              </div>
            )}

            {soldeInsuffisant && (
              <p className="rounded-md bg-status-warning-bg px-3 py-2 text-sm text-status-warning">
                Votre solde est de {utilisateur.solde_conge} jour(s) : cette demande le depasse et
                sera refusee a la validation.
              </p>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="motif">Motif</Label>
              <Textarea
                id="motif"
                value={form.motif}
                onChange={(e) => setForm({ ...form, motif: e.target.value })}
                required
              />
            </div>

            <Separator />

            <PiecesJointesUpload
              pieces={pieces}
              onChange={setPieces}
              disabled={enCours}
              titre="Pieces justificatives (optionnel)"
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
                onClick={() => router.push("/conges")}
                disabled={enCours}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={enCours}>
                {enCours && <Loader2 className="h-4 w-4 animate-spin" />}
                Soumettre la demande
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
