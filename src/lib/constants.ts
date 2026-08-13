import type {
  StatutAgent, StatutMission, StatutReception, StatutConge, Role, TypeNotification,
} from "./types";

type BadgeVariant = "default" | "secondary" | "outline" | "success" | "warning" | "danger" | "info";

export const ROLE_LABELS: Record<Role, string> = {
  agent: "Agent",
  chef_service: "Chef de service",
  directeur: "Directeur",
  administrateur: "Administrateur",
};

export const STATUT_AGENT_LABELS: Record<StatutAgent, string> = {
  present: "Present",
  en_mission: "En mission",
  en_conge: "En conge",
  absent: "Absent",
};

export const STATUT_AGENT_VARIANTS: Record<StatutAgent, BadgeVariant> = {
  present: "success",
  en_mission: "info",
  en_conge: "warning",
  absent: "secondary",
};

export const STATUT_MISSION_LABELS: Record<StatutMission, string> = {
  planifiee: "Planifiee",
  en_cours: "En cours",
  terminee: "Terminee",
  annulee: "Annulee",
};

export const STATUT_MISSION_VARIANTS: Record<StatutMission, BadgeVariant> = {
  planifiee: "secondary",
  en_cours: "info",
  terminee: "success",
  annulee: "danger",
};

export const STATUT_RECEPTION_LABELS: Record<StatutReception, string> = {
  en_attente: "En attente",
  confirme: "Confirme",
  refusee: "Refusee",
  non_recu: "Non recu",
};

export const STATUT_RECEPTION_VARIANTS: Record<StatutReception, BadgeVariant> = {
  en_attente: "warning",
  confirme: "success",
  refusee: "danger",
  non_recu: "danger",
};

/** Limites de televersement, alignees sur les validateurs du backend. */
export const TAILLE_MAX_DOCUMENT = 20 * 1024 * 1024;
export const TAILLE_MAX_IMAGE = 10 * 1024 * 1024;

export const EXTENSIONS_IMAGE = [
  ".png", ".jpg", ".jpeg", ".jfif", ".webp", ".gif", ".bmp", ".tif", ".tiff",
  ".heic", ".heif", ".avif",
];

export const EXTENSIONS_DOCUMENT = [
  ".pdf", ".doc", ".docx", ".odt", ".rtf", ".txt",
  ".xls", ".xlsx", ".ods", ".csv",
  ".ppt", ".pptx", ".odp",
];

export const EXTENSIONS_ACCEPTEES = [...EXTENSIONS_IMAGE, ...EXTENSIONS_DOCUMENT];

export function estImage(nomFichier: string) {
  const extension = nomFichier.slice(nomFichier.lastIndexOf(".")).toLowerCase();
  return EXTENSIONS_IMAGE.includes(extension);
}

export function formaterTaille(octets: number) {
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${(octets / 1024).toFixed(0)} Ko`;
  return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
}

/**
 * Verifie un fichier cote client AVANT l'envoi (le backend revalide de toute
 * facon) : 20 Mo pour un document, 10 Mo pour une image.
 */
export function validerFichier(fichier: File): string | null {
  const extension = fichier.name.slice(fichier.name.lastIndexOf(".")).toLowerCase();

  if (!EXTENSIONS_ACCEPTEES.includes(extension)) {
    return `Format « ${extension || "inconnu"} » non accepte.`;
  }

  const estUneImage = EXTENSIONS_IMAGE.includes(extension);
  const limite = estUneImage ? TAILLE_MAX_IMAGE : TAILLE_MAX_DOCUMENT;

  if (fichier.size > limite) {
    return `Fichier trop volumineux (${formaterTaille(fichier.size)}). Limite : ${
      estUneImage ? "10 Mo" : "20 Mo"
    }.`;
  }

  return null;
}

export const STATUT_CONGE_LABELS: Record<StatutConge, string> = {
  en_attente: "En attente",
  validee: "Validee",
  refusee: "Refusee",
  expiree: "Expiree",
};

export const STATUT_CONGE_VARIANTS: Record<StatutConge, BadgeVariant> = {
  en_attente: "warning",
  validee: "success",
  refusee: "danger",
  expiree: "secondary",
};

export function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(
    new Date(value)
  );
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

/**
 * Libelles lisibles des types de notification, et destination par defaut
 * lorsqu'une notification est ouverte sans lien profond explicite.
 */
export const TYPE_NOTIFICATION_LABELS: Record<TypeNotification, string> = {
  mission_creee: "Nouvelle mission",
  mission_agent_retire: "Retrait de mission",
  rappel_confirmation: "Confirmation requise",
  reception_confirmee: "Reception confirmee",
  refus_mission: "Mission refusee",
  rappel_fin_mission: "Fin de mission",
  rapport_attendu: "Rapport attendu",
  rapport_soumis: "Rapport recu",
  non_recu: "Ordre non recu",
  demande_conge: "Demande de conge",
  validation_conge: "Conge valide",
  refus_conge: "Conge refuse",
  alerte_solde: "Solde de conge",
  attribution_solde: "Attribution de solde",
  document_ministeriel: "Décision ministerielle",
  note_conge_disponible: "Note de conge disponible",
  connexion: "Connexion au compte",
  compte_cree: "Compte cree",
};

export const LIEN_NOTIFICATION: Record<TypeNotification, string> = {
  mission_creee: "/missions",
  mission_agent_retire: "/missions",
  rappel_confirmation: "/missions",
  reception_confirmee: "/missions",
  refus_mission: "/missions",
  rappel_fin_mission: "/missions",
  rapport_attendu: "/missions",
  rapport_soumis: "/missions",
  non_recu: "/missions",
  demande_conge: "/conges",
  validation_conge: "/conges",
  refus_conge: "/conges",
  alerte_solde: "/conges",
  attribution_solde: "/conges",
  document_ministeriel: "/profil",
  note_conge_disponible: "/conges",
  connexion: "/profil",
  compte_cree: "/profil",
};
