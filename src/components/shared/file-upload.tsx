"use client";

import * as React from "react";
import { FileText, ImageIcon, Paperclip, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  EXTENSIONS_ACCEPTEES,
  estImage,
  formaterTaille,
  validerFichier,
} from "@/lib/constants";

/**
 * Selecteur de fichier unique.
 *
 * Le fichier n'est JAMAIS transforme en URL cote client : il est transmis tel
 * quel au backend en multipart, c'est le backend qui produit le lien Cloudinary.
 */
export function FileUpload({
  label,
  fichier,
  onChange,
  description,
  accept = EXTENSIONS_ACCEPTEES.join(","),
  disabled,
  id,
}: {
  label: string;
  fichier: File | null;
  onChange: (fichier: File | null) => void;
  description?: string;
  accept?: string;
  disabled?: boolean;
  id?: string;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [erreur, setErreur] = React.useState<string | null>(null);
  const inputId = id ?? React.useId();

  function selectionner(event: React.ChangeEvent<HTMLInputElement>) {
    const choisi = event.target.files?.[0] ?? null;
    setErreur(null);

    if (!choisi) {
      onChange(null);
      return;
    }

    const probleme = validerFichier(choisi);
    if (probleme) {
      setErreur(probleme);
      onChange(null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    onChange(choisi);
  }

  function retirer() {
    onChange(null);
    setErreur(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const Icone = fichier && estImage(fichier.name) ? ImageIcon : FileText;

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={inputId}>{label}</Label>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        onChange={selectionner}
        disabled={disabled}
        className="hidden"
      />

      {fichier ? (
        <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
          <Icone className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate text-sm">{fichier.name}</span>
          <span className="shrink-0 font-mono text-xs text-muted-foreground">
            {formaterTaille(fichier.size)}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={retirer}
            disabled={disabled}
            aria-label="Retirer le fichier"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="justify-start font-normal text-muted-foreground"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
        >
          <Upload className="h-4 w-4" />
          Choisir un fichier
        </Button>
      )}

      {erreur ? (
        <p className="text-xs text-status-danger">{erreur}</p>
      ) : (
        <p className="text-xs text-muted-foreground">
          {description ?? "Documents 20 Mo max — images 10 Mo max."}
        </p>
      )}
    </div>
  );
}

export interface PieceJointeSaisie {
  cle: string;
  fichier: File;
  libelle: string;
  description: string;
}

/**
 * Gestion d'une liste de pieces jointes, chacune avec son libelle et sa
 * description facultative. Utilise pour les demandes de conge (autant de
 * pieces que voulu) et les missions.
 */
export function PiecesJointesUpload({
  pieces,
  onChange,
  disabled,
  titre = "Pieces jointes",
  aideDescription = true,
}: {
  pieces: PieceJointeSaisie[];
  onChange: (pieces: PieceJointeSaisie[]) => void;
  disabled?: boolean;
  titre?: string;
  aideDescription?: boolean;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [erreur, setErreur] = React.useState<string | null>(null);

  function ajouter(event: React.ChangeEvent<HTMLInputElement>) {
    const choisis = Array.from(event.target.files ?? []);
    setErreur(null);

    const valides: PieceJointeSaisie[] = [];
    const problemes: string[] = [];

    for (const fichier of choisis) {
      const probleme = validerFichier(fichier);
      if (probleme) {
        problemes.push(`${fichier.name} : ${probleme}`);
        continue;
      }
      valides.push({
        cle: `${fichier.name}-${fichier.size}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        fichier,
        // Libelle pre-rempli avec le nom du fichier, modifiable.
        libelle: fichier.name.replace(/\.[^.]+$/, ""),
        description: "",
      });
    }

    if (problemes.length) setErreur(problemes.join(" • "));
    if (valides.length) onChange([...pieces, ...valides]);
    if (inputRef.current) inputRef.current.value = "";
  }

  function modifier(cle: string, champ: "libelle" | "description", valeur: string) {
    onChange(pieces.map((p) => (p.cle === cle ? { ...p, [champ]: valeur } : p)));
  }

  function retirer(cle: string) {
    onChange(pieces.filter((p) => p.cle !== cle));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Label>{titre}</Label>
        <span className="font-mono text-xs text-muted-foreground">{pieces.length}</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={EXTENSIONS_ACCEPTEES.join(",")}
        onChange={ajouter}
        disabled={disabled}
        className="hidden"
      />

      {pieces.length > 0 && (
        <div className="flex flex-col gap-3">
          {pieces.map((piece) => {
            const Icone = estImage(piece.fichier.name) ? ImageIcon : FileText;
            return (
              <div
                key={piece.cle}
                className="flex flex-col gap-2 rounded-md border border-border p-3"
              >
                <div className="flex items-center gap-2">
                  <Icone className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate text-sm">{piece.fichier.name}</span>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    {formaterTaille(piece.fichier.size)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => retirer(piece.cle)}
                    disabled={disabled}
                    aria-label="Retirer la piece jointe"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <Input
                  placeholder="Libelle (ex. Certificat medical)"
                  value={piece.libelle}
                  onChange={(e) => modifier(piece.cle, "libelle", e.target.value)}
                  disabled={disabled}
                />

                {aideDescription && (
                  <Textarea
                    placeholder="Description (facultatif)"
                    value={piece.description}
                    onChange={(e) => modifier(piece.cle, "description", e.target.value)}
                    rows={2}
                    disabled={disabled}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn("justify-start font-normal text-muted-foreground")}
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
      >
        <Paperclip className="h-4 w-4" />
        Ajouter des pieces jointes
      </Button>

      {erreur ? (
        <p className="text-xs text-status-danger">{erreur}</p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Plusieurs fichiers possibles. Documents 20 Mo max — images 10 Mo max.
        </p>
      )}
    </div>
  );
}

/** Affichage en lecture d'une piece jointe deja televersee. */
export function PieceJointeLien({
  libelle,
  description,
  url,
  nomFichier,
}: {
  libelle: string;
  description?: string | null;
  url: string | null;
  nomFichier?: string | null;
}) {
  const Icone = nomFichier && estImage(nomFichier) ? ImageIcon : FileText;

  return (
    <div className="flex items-start gap-2.5 rounded-md border border-border px-3 py-2">
      <Icone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{libelle}</p>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      {url && (
        <Button variant="ghost" size="sm" asChild className="shrink-0">
          <a href={url} target="_blank" rel="noreferrer">
            Ouvrir
          </a>
        </Button>
      )}
    </div>
  );
}
