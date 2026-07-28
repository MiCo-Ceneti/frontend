"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, ApiError } from "@/lib/api";
import type { TypeConge, Paginated } from "@/lib/types";

export default function NouvelleDemandeCongePage() {
  const router = useRouter();
  const [types, setTypes] = React.useState<TypeConge[]>([]);
  const [erreur, setErreur] = React.useState<string | null>(null);
  const [enCours, setEnCours] = React.useState(false);

  const [form, setForm] = React.useState({
    type_conge: "",
    date_debut: "",
    date_fin: "",
    motif: "",
    piece_jointe: "",
    a_solder: true,
  });

  React.useEffect(() => {
    api.get<Paginated<TypeConge>>("conges/types/").then((d) => setTypes(d.results));
  }, []);

  const typeSelectionne = types.find((t) => t.id === form.type_conge);
  const estExceptionnel = typeSelectionne?.libelle === "exceptionnel";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      const demande = await api.post<{ id: string }>("conges/demandes/", {
        ...form,
        a_solder: estExceptionnel ? form.a_solder : true,
        piece_jointe: form.piece_jointe || undefined,
      });
      toast.success("Demande de conge soumise.");
      router.push(`/conges/${demande.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        const detail = err.detail as Record<string, unknown> | null;
        setErreur(
          typeof detail?.detail === "string"
            ? detail.detail
            : Array.isArray(detail?.non_field_errors)
              ? String(detail.non_field_errors[0])
              : "Impossible de soumettre la demande. Verifiez les champs."
        );
      } else {
        setErreur("Une erreur inattendue est survenue.");
      }
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div>
      <PageHeader title="Nouvelle demande de conge" description="Soumettre une demande pour validation" />

      <Card className="max-w-xl">
        <CardContent className="p-5">
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Type de conge</Label>
              <Select value={form.type_conge} onValueChange={(v) => setForm({ ...form, type_conge: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {types.map((t) => (
                    <SelectItem key={t.id} value={t.id} className="capitalize">
                      {t.libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  value={form.date_fin}
                  onChange={(e) => setForm({ ...form, date_fin: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="motif">Motif</Label>
              <Textarea
                id="motif"
                value={form.motif}
                onChange={(e) => setForm({ ...form, motif: e.target.value })}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="piece_jointe">Piece justificative (lien, optionnel)</Label>
              <Input
                id="piece_jointe"
                placeholder="https://..."
                value={form.piece_jointe}
                onChange={(e) => setForm({ ...form, piece_jointe: e.target.value })}
              />
            </div>

            {estExceptionnel && (
              <label className="flex items-center gap-2.5 text-sm">
                <Checkbox
                  checked={form.a_solder}
                  onCheckedChange={(v) => setForm({ ...form, a_solder: Boolean(v) })}
                />
                A deduire de mon solde de conge
              </label>
            )}

            {erreur && (
              <p className="rounded-md bg-status-danger-bg px-3 py-2 text-sm text-status-danger">{erreur}</p>
            )}

            <div className="flex justify-end">
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
