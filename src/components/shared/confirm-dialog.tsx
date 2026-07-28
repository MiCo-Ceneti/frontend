"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  variant?: "default" | "destructive";
  requireComment?: boolean;
  commentLabel?: string;
  onConfirm: (commentaire?: string) => Promise<void> | void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmer",
  variant = "default",
  requireComment = false,
  commentLabel = "Motif",
  onConfirm,
}: ConfirmDialogProps) {
  const [commentaire, setCommentaire] = React.useState("");
  const [enCours, setEnCours] = React.useState(false);

  async function handleConfirm() {
    setEnCours(true);
    try {
      await onConfirm(requireComment ? commentaire : undefined);
      setCommentaire("");
      onOpenChange(false);
    } finally {
      setEnCours(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {requireComment && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="commentaire">{commentLabel}</Label>
            <Textarea
              id="commentaire"
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              placeholder="Precisez le motif..."
              required
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={enCours}>
            Annuler
          </Button>
          <Button
            variant={variant}
            onClick={handleConfirm}
            disabled={enCours || (requireComment && commentaire.trim().length === 0)}
          >
            {enCours && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
