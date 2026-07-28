import { Badge } from "@/components/ui/badge";
import {
  STATUT_AGENT_LABELS, STATUT_AGENT_VARIANTS,
  STATUT_MISSION_LABELS, STATUT_MISSION_VARIANTS,
  STATUT_RECEPTION_LABELS, STATUT_RECEPTION_VARIANTS,
  STATUT_CONGE_LABELS, STATUT_CONGE_VARIANTS,
} from "@/lib/constants";
import type { StatutAgent, StatutMission, StatutReception, StatutConge } from "@/lib/types";

export function AgentStatusBadge({ statut }: { statut: StatutAgent }) {
  return <Badge variant={STATUT_AGENT_VARIANTS[statut]}>{STATUT_AGENT_LABELS[statut]}</Badge>;
}

export function MissionStatusBadge({ statut }: { statut: StatutMission }) {
  return <Badge variant={STATUT_MISSION_VARIANTS[statut]}>{STATUT_MISSION_LABELS[statut]}</Badge>;
}

export function ReceptionStatusBadge({ statut }: { statut: StatutReception }) {
  return <Badge variant={STATUT_RECEPTION_VARIANTS[statut]}>{STATUT_RECEPTION_LABELS[statut]}</Badge>;
}

export function CongeStatusBadge({ statut }: { statut: StatutConge }) {
  return <Badge variant={STATUT_CONGE_VARIANTS[statut]}>{STATUT_CONGE_LABELS[statut]}</Badge>;
}
