export type Role = "agent" | "chef_service" | "directeur" | "administrateur";
export type StatutAgent = "present" | "en_mission" | "en_conge" | "absent";

export interface Utilisateur {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  nom_complet: string;
  email: string;
  telephone: string;
  role: Role;
  service: string | null;
  service_nom: string | null;
  direction_nom: string | null;
  statut: StatutAgent;
  statut_fin: string | null;
  actif: boolean;
  date_embauche: string | null;
  date_joined?: string;
}

export interface Direction {
  id: string;
  nom: string;
  description: string | null;
  services: Service[];
  nombre_services: number;
}

export interface Service {
  id: string;
  nom: string;
  direction: string;
  direction_nom: string;
  description: string | null;
  unites: Unite[];
  nombre_agents: number;
}

export interface Unite {
  id: string;
  nom: string;
  service: string;
}

export type StatutMission = "planifiee" | "en_cours" | "terminee" | "annulee";
export type StatutReception = "en_attente" | "confirme" | "non_recu";

export interface TypeMission {
  id: string;
  libelle: string;
  description: string | null;
}

export interface MissionAgent {
  id: string;
  mission: string;
  agent: string;
  agent_nom: string;
  agent_matricule: string;
  ordre_mission_pdf: string | null;
  confirmation_clic: boolean;
  date_confirmation_clic: string | null;
  fichier_signe: string | null;
  statut_reception: StatutReception;
  rapport_mission: string | null;
  rapport_fichier: string | null;
  date_soumission_rapport: string | null;
}

export interface Mission {
  id: string;
  motif: string;
  type_mission: string;
  type_mission_libelle: string;
  destination_type: "ville_autre" | "exterieur_pays";
  destination: string;
  date_debut: string;
  date_fin: string;
  moyen_transport: string | null;
  cree_par: string;
  cree_par_nom: string;
  statut: StatutMission;
  agents_designes: MissionAgent[];
  pieces_jointes: { id: string; fichier: string; libelle: string }[];
  date_creation: string;
}

export type StatutConge = "en_attente" | "validee" | "refusee" | "expiree";
export type LibelleTypeConge = "normal" | "exceptionnel";

export interface TypeConge {
  id: string;
  libelle: LibelleTypeConge;
  description: string | null;
}

export interface DocumentMinisteriel {
  id: string;
  agent: string;
  agent_nom: string;
  fichier: string;
  date_debut_periode: string;
  date_fin_periode: string;
  jours_accordes: number;
  solde_restant: number;
  enregistre_par: string;
  enregistre_par_nom: string;
  date_enregistrement: string;
}

export interface DemandeConge {
  id: string;
  agent: string;
  agent_nom: string;
  type_conge: string;
  type_conge_libelle: LibelleTypeConge;
  document_ministeriel: string | null;
  date_debut: string;
  date_fin: string;
  nombre_jours: number;
  motif: string;
  piece_jointe: string | null;
  a_solder: boolean;
  statut: StatutConge;
  date_limite_validation: string | null;
  valide_par: string | null;
  valide_par_nom: string | null;
  date_validation: string | null;
  commentaire_refus: string | null;
  date_soumission: string;
}

export interface HistoriqueConge {
  id: string;
  agent: string;
  demande_conge: string | null;
  type_mouvement: "attribution" | "deduction" | "ajustement";
  jours: number;
  solde_avant: number;
  solde_apres: number;
  date_mouvement: string;
}

export type TypeNotification =
  | "mission_creee"
  | "rappel_fin_mission"
  | "rapport_attendu"
  | "non_recu"
  | "demande_conge"
  | "validation_conge"
  | "refus_conge"
  | "alerte_solde";

export interface Notification {
  id: string;
  type: TypeNotification;
  titre: string;
  message: string;
  canal: "email" | "fcm" | "in_app";
  lu: boolean;
  date_creation: string;
}

export interface DashboardStats {
  total_agents: number;
  repartition_statuts: Record<StatutAgent, number>;
  missions: { planifiees: number; en_cours: number; terminees: number; annulees: number };
  conges: { en_attente: number; validees: number; refusees: number; expirees: number };
  genere_le: string;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
