"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/shared/file-upload";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { api, messageErreur } from "@/lib/api";

/**
 * Refus d'une mission par l'agent : lettre d'explication obligatoire, et
 * justificatif televerse en option (fichier reel, jamais une URL).
 *
 * Le refus reste possible jusqu'a la veille de la date de debut : passe ce
 * delai, l'absence de confirmation vaut refus automatique cote backend.
 */
export function RefusMissionDialog({
  open,
  onOpenChange,
  missionId,
  agentId,
  onRefuse,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  missionId: string;
  agentId: string;
  onRefuse: () => void;
}) {
  const [motif, setMotif] = React.useState("");
  const [justificatif, setJustificatif] = React.useState<File | null>(null);
  const [enCours, setEnCours] = React.useState(false);

  async function confirmer() {
    if (!motif.trim()) return;
    setEnCours(true);
    try {
      await api.upload(`missions/${missionId}/agents/${agentId}/refuser/`, {
        motif_refus: motif,
        justificatif_refus: justificatif ?? undefined,
      });
      toast.success("Mission refusee. Votre superviseur a ete informe.");
      setMotif("");
      setJustificatif(null);
      onOpenChange(false);
      onRefuse();
    } catch (err) {
      toast.error(messageErreur(err, "Impossible d'enregistrer le refus."));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Refuser cette mission</DialogTitle>
          <DialogDescription>
            Expliquez le motif de votre refus. Vous pouvez joindre un justificatif.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="motif_refus">Lettre d&apos;explication</Label>
            <Textarea
              id="motif_refus"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Precisez les raisons pour lesquelles vous ne pouvez pas effectuer cette mission..."
              rows={5}
              required
            />
          </div>

          <FileUpload
            label="Justificatif (optionnel)"
            fichier={justificatif}
            onChange={setJustificatif}
            disabled={enCours}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={enCours}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={confirmer} disabled={enCours || !motif.trim()}>
            {enCours && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirmer le refus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
