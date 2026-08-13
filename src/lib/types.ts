export type Role = "agent" | "chef_service" | "directeur" | "administrateur";
export type StatutAgent = "present" | "en_mission" | "en_conge" | "absent";

export interface DocumentMinisterielResume {
  id: string;
  annee: number;
  fichier_url: string | null;
  nom_fichier: string | null;
  date_enregistrement: string;
}

export interface Utilisateur {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  nom_complet: string;
  email: string;
  telephone: string;
  role: Role;
  poste: string | null;
  service: string | null;
  service_nom: string | null;
  direction_nom: string | null;
  statut: StatutAgent;
  statut_fin: string | null;
  actif: boolean;
  date_embauche: string | null;
  /** Solde de conge porte par l'agent : 30 j a la creation, +30 j chaque 1er janvier. */
  solde_conge: number;
  /** Document du ministere pour l'annee en cours (null s'il n'a pas ete depose). */
  document_ministeriel_annee: DocumentMinisterielResume | null;
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
export type StatutReception = "en_attente" | "confirme" | "refusee" | "non_recu";

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
  agent_poste: string | null;
  ordre_mission_pdf: string | null;
  confirmation_clic: boolean;
  date_confirmation_clic: string | null;
  fichier_signe_url: string | null;
  statut_reception: StatutReception;
  motif_refus: string | null;
  justificatif_refus_url: string | null;
  date_refus: string | null;
  refus_automatique: boolean;
  rapport_mission: string | null;
  rapport_fichier_url: string | null;
  date_soumission_rapport: string | null;
}

export interface PieceJointe {
  id: string;
  fichier_url: string | null;
  nom_fichier: string | null;
  libelle: string;
  description: string | null;
  date_creation?: string;
}

export interface Mission {
  id: string;
  motif: string;
  type_mission: string;
  type_mission_libelle: string;
  depart:string;
  destination_type: "ville_autre" | "exterieur_pays";
  destination: string;
  date_debut: string;
  date_fin: string;
  moyen_transport: string | null;
  cree_par: string;
  cree_par_nom: string;
  statut: StatutMission;
  /** Vrai tant que la periode n'a pas debute : composition encore modifiable. */
  modifiable: boolean;
  agents_designes: MissionAgent[];
  pieces_jointes: PieceJointe[];
  date_creation: string;
}

/** Agent retenu lors d'une creation / d'un ajout sur une mission. */
export interface AgentAffecte {
  agent: string;
  agent_nom: string;
  agent_matricule: string;
}

/** Agent ecarte : la mission est creee quand meme, mais sans lui. */
export interface AgentRejete extends AgentAffecte {
  motif: string;
}

export interface ResultatAffectation {
  agents_ajoutes: AgentAffecte[];
  agents_rejetes: AgentRejete[];
}

export type MissionCreee = Mission & ResultatAffectation;

export interface DisponibiliteAgent {
  agent: string;
  agent_nom: string;
  disponible: boolean;
  motif: string | null;
}

export type StatutConge = "en_attente" | "validee" | "refusee" | "expiree";

export interface TypeConge {
  id: string;
  /** Libelle libre saisi par l'administrateur (« Conge annuel », « Accident »...). */
  libelle: string;
  description: string | null;
  /** Si faux, ce type de conge n'ampute pas le solde de l'agent. */
  decremente_le_solde: boolean;
  actif: boolean;
}

export interface DocumentMinisteriel {
  id: string;
  agent: string;
  agent_nom: string;
  annee: number;
  fichier_url: string | null;
  nom_fichier: string | null;
  enregistre_par: string;
  enregistre_par_nom: string;
  date_enregistrement: string;
}

export interface DemandeConge {
  id: string;
  agent: string;
  agent_nom: string;
  agent_matricule: string;
  agent_service: string | null;
  type_conge: string;
  type_conge_libelle: string;
  decremente_le_solde: boolean;
  a_solder: boolean;
  date_debut: string;
  date_fin: string;
  nombre_jours: number;
  motif: string;
  pieces_jointes: PieceJointe[];
  statut: StatutConge;
  date_limite_validation: string | null;
  valide_par: string | null;
  valide_par_nom: string | null;
  date_validation: string | null;
  commentaire_refus: string | null;
  date_soumission: string;
  /** Present une fois la Note de service generee (visible apres validation). */
  note_conge_pdf: string | null;
}

export interface HistoriqueConge {
  id: string;
  agent: string;
  demande_conge: string | null;
  type_mouvement: "attribution" | "deduction" | "ajustement";
  motif: string | null;
  jours: number;
  solde_avant: number;
  solde_apres: number;
  date_mouvement: string;
}

export interface SoldeConge {
  agent: string;
  solde_restant: number;
  annee: number;
  document_ministeriel_disponible: boolean;
  historique: HistoriqueConge[];
}

export type TypeNotification =
  | "mission_creee"
  | "mission_agent_retire"
  | "rappel_confirmation"
  | "reception_confirmee"
  | "refus_mission"
  | "rappel_fin_mission"
  | "rapport_attendu"
  | "rapport_soumis"
  | "non_recu"
  | "demande_conge"
  | "validation_conge"
  | "refus_conge"
  | "alerte_solde"
  | "attribution_solde"
  | "document_ministeriel"
  | "note_conge_disponible"
  | "connexion"
  | "compte_cree";

export interface Notification {
  id: string;
  type: TypeNotification;
  titre: string;
  message: string;
  canal: "email" | "fcm" | "in_app";
  lu: boolean;
  lien: string | null;
  date_lecture: string | null;
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
