"use client";

import * as React from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { AgentAffecte, AgentRejete } from "@/lib/types";

/**
 * Modal affiche apres la creation d'une mission (ou l'ajout d'agents).
 *
 * Regle metier : si un seul agent d'une selection ne respecte pas la contrainte
 * de chevauchement, la mission est quand meme creee — cet agent en est
 * simplement exclu. Ce modal montre precisement qui a ete retenu et, pour
 * chaque agent ecarte, le motif exact.
 */
export function ResultatAffectationDialog({
  open,
  onOpenChange,
  ajoutes,
  rejetes,
  titre = "Resultat de l'affectation",
  onContinuer,
  libelleContinuer = "Voir la mission",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ajoutes: AgentAffecte[];
  rejetes: AgentRejete[];
  titre?: string;
  onContinuer?: () => void;
  libelleContinuer?: string;
}) {
  const total = ajoutes.length + rejetes.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{titre}</DialogTitle>
          <DialogDescription>
            {rejetes.length === 0
              ? `Les ${ajoutes.length} agent(s) selectionne(s) ont bien ete affectes.`
              : `${ajoutes.length} agent(s) sur ${total} ont ete affectes. ${rejetes.length} agent(s) n'ont pas pu l'etre.`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-[55vh] flex-col gap-4 overflow-y-auto">
          {ajoutes.length > 0 && (
            <section className="flex flex-col gap-2">
              <p className="flex items-center gap-1.5 text-xs font-medium text-status-success">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Affectes a la mission ({ajoutes.length})
              </p>
              <div className="flex flex-col gap-1">
                {ajoutes.map((agent) => (
                  <div
                    key={agent.agent}
                    className="flex items-center justify-between rounded-md bg-secondary px-3 py-2 text-sm"
                  >
                    <span>{agent.agent_nom}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {agent.agent_matricule}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {ajoutes.length > 0 && rejetes.length > 0 && <Separator />}

          {rejetes.length > 0 && (
            <section className="flex flex-col gap-2">
              <p className="flex items-center gap-1.5 text-xs font-medium text-status-danger">
                <XCircle className="h-3.5 w-3.5" />
                Non affectes ({rejetes.length})
              </p>
              <div className="flex flex-col gap-2">
                {rejetes.map((agent) => (
                  <div
                    key={agent.agent}
                    className="rounded-md bg-status-danger-bg px-3 py-2 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{agent.agent_nom}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {agent.agent_matricule}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-status-danger">{agent.motif}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Ces agents pourront etre ajoutes plus tard, tant que la periode de la mission
                n&apos;a pas debute et que leur planning se libere.
              </p>
            </section>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={() => {
              onOpenChange(false);
              onContinuer?.();
            }}
          >
            {libelleContinuer}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
