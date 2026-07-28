import type { StatutAgent, StatutMission, StatutReception, StatutConge, Role } from "./types";

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
  non_recu: "Non recu",
};

export const STATUT_RECEPTION_VARIANTS: Record<StatutReception, BadgeVariant> = {
  en_attente: "warning",
  confirme: "success",
  non_recu: "danger",
};

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
