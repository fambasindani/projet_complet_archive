/**
 * Types miroirs du backend Laravel (monutilisateurs, roles, permissions, etc.)
 * Source: backend/app/Models/*.php + migrations
 * Généré pour Vite + TS + Tailwind — couvre 100% des tables
 */

// ============ AUTH & RBAC ============
export type StatutUtilisateur = 'active' | 'inactive' | 'bloqué';

export interface Permission {
  id: number;
  code: string;
  description: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Role {
  id: number;
  nom: string;
  description: string | null;
  permissions?: Permission[];
  permissions_count?: number;
  monutilisateurs_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Departement {
  id: number;
  sigle: string;
  nom: string;
  datecreation?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

/** @deprecated legacy table `directions` — utiliser Departement */
export interface Direction {
  id: number;
  nom: string;
  statut?: number | boolean;
  created_at?: string;
  updated_at?: string;
}

export interface MonUtilisateur {
  id: number;
  nom: string;
  prenom: string;
  full_name?: string;
  email: string;
  statut: StatutUtilisateur;
  datecreation?: string;
  dernierconnection?: string | null;
  avatar?: string | null;
  avatar_url?: string | null;
  couleur_avatar?: string;
  initiales?: string;
  roles?: Role[];
  departements?: Departement[];
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

// ============ ARCHIVAGE ORDINAIRE (AD) ============
export interface Classeur {
  id: number;
  nom_classeur: string;
  statut: boolean | number;
  created_at?: string;
  updated_at?: string;
}

export interface Emplacement {
  id: number;
  nom_emplacement: string;
  statut: boolean | number;
  created_at?: string;
  updated_at?: string;
}

export interface CentreOrdonnancement {
  id: number;
  nom: string;
  id_ministere?: number | null;
  description?: string | null;
  statut?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Declaration {
  id: number;
  id_direction: number;
  id_emplacement: number;
  id_classeur: number;
  id_user: number;
  date_creation: string;
  date_enregistrement: string;
  intitule: string;
  num_reference: string;
  mot_cle: string;
  num_declaration: string;
  statut: number | boolean;
  departement?: Departement;
  emplacement?: Emplacement;
  classeur?: Classeur;
  utilisateur?: MonUtilisateur;
  nom_direction?: string | null;
  nom_emplacement?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DocumentDeclaration {
  id: number;
  id_declaration: number;
  id_classeur: number;
  nom_fichier: string;
  nom_native: string;
  taille: number;
  montext?: string | null;
  direction_id?: number;
  direction_nom?: string;
  classeur_nom?: string;
  extrait?: string;
  stats_texte?: { longueur: number; mots: number; pages_approx: number };
  filtre_direction_utilisateur?: number;
  declaration?: Declaration;
  created_at?: string;
  updated_at?: string;
}

// ============ NOTE DE PERCEPTION (NP) ============
export interface Assujetti {
  id: number;
  numero_nif?: string;
  nom_raison_sociale: string;
  bp?: string;
  telephone?: string;
  email?: string;
  statut?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ArticleBudgetaire {
  id: number;
  article_budgetaire: string;
  nom: string;
  statut?: number;
  created_at?: string;
  updated_at?: string;
}

export interface NotePerception {
  id: number;
  statut: number;
  id_classeur: number;
  id_ministere: number;
  id_centre_ordonnancement: number;
  id_assujetti: number;
  id_emplacement: number;
  id_user: number;
  numero_article?: string | null;
  numero_serie: string;
  date_ordonnancement: string;
  date_enregistrement: string;
  classeur?: Classeur;
  centre?: CentreOrdonnancement;
  assujetti?: Assujetti;
  emplacement?: Emplacement;
  utilisateur?: MonUtilisateur;
  articlebudgetaire?: ArticleBudgetaire;
  documents?: DocumentDeclaration[];
  created_at?: string;
  updated_at?: string;
}

export interface DocumentNotePerception {
  id: number;
  id_note_perception: number;
  id_classeur: number;
  id_ministere: number;
  nom_fichier: string;
  nom_native: string;
  created_at?: string;
}

export interface DocumentScanne {
  id: number;
  nom_fichier: string;
  nom_original?: string;
  chemin_fichier: string;
  dossier?: string;
  pages: number;
  taille_mo: number;
  type_document: string;
  id_declaration?: number | null;
  id_classeur?: number | null;
  uploaded_by?: number | null;
  scanned_at?: string | null;
  source_scanner?: string | null;
  metadata?: Record<string, unknown> | null;
  fileUrl?: string;
  filePath?: string;
  formattedSize?: string;
  created_at?: string;
  updated_at?: string;
}

// ============ LEGACY / ADMIN ============
export interface Module {
  id: number;
  id_utilisateur?: number | null;
  id_compagnie?: number | null;
  nom?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Compagnie {
  id: number;
  nom: string;
  created_at?: string;
  updated_at?: string;
}

// ============ DASHBOARD & STATS ============
export interface DashboardStats {
  total_declarations?: number;
  total_notes?: number;
  total_users?: number;
  total_roles?: number;
  total_directions?: number;
  users?: { total: number; active: number; inactive: number; blocked: number };
  roles?: { id: number; nom: string; users_count: number }[];
  directions?: { id: number; sigle: string; users_count: number }[];
  recent_users?: MonUtilisateur[];
  [key: string]: unknown;
}

export interface PublicStats {
  declarations?: number;
  notes?: number;
  users?: number;
  recent_activity?: unknown[];
}

export interface OCRStats {
  total_documents: number;
  documents_avec_texte: number;
  documents_sans_texte: number;
  pourcentage_texte: number;
  taille_moyenne_texte: string;
}

export interface LogEntry {
  id: number;
  user_id?: number | null;
  action: string;
  table_name: string;
  record_id?: number | null;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

// ============ PAYLOADS ============
export type CreateMonUtilisateurPayload = Pick<MonUtilisateur, 'nom' | 'prenom' | 'email' | 'statut'> & {
  password: string;
  role_ids?: number[];
  direction_ids?: number[];
};

export type UpdateMonUtilisateurPayload = Partial<Pick<MonUtilisateur, 'nom' | 'prenom' | 'email' | 'statut'>> & {
  password?: string;
  role_ids?: number[];
  direction_ids?: number[];
};

export type CreateDeclarationPayload = Pick<Declaration, 'id_direction' | 'id_emplacement' | 'id_classeur' | 'date_creation' | 'date_enregistrement' | 'intitule' | 'num_reference' | 'mot_cle' | 'num_declaration'>;

export type CreateNotePerceptionPayload = Pick<NotePerception, 'id_ministere' | 'id_classeur' | 'id_centre_ordonnancement' | 'id_assujetti' | 'id_emplacement' | 'numero_serie' | 'date_ordonnancement' | 'date_enregistrement'> & {
  numero_article?: string;
};

export type CreateClasseurPayload = Pick<Classeur, 'nom_classeur'>;
export type CreateEmplacementPayload = Pick<Emplacement, 'nom_emplacement'>;
export type CreateCentrePayload = Pick<CentreOrdonnancement, 'nom'> & { id_ministere?: number; description?: string };
export type CreateAssujettiPayload = Pick<Assujetti, 'nom_raison_sociale'> & Partial<Omit<Assujetti, 'id' | 'nom_raison_sociale'>>;
export type CreateArticlePayload = Pick<ArticleBudgetaire, 'article_budgetaire' | 'nom'>;
export type CreateDepartementPayload = Pick<Departement, 'sigle' | 'nom'>;
export type CreateRolePayload = Pick<Role, 'nom'> & { description?: string; permission_ids?: number[] };
export type CreatePermissionPayload = Pick<Permission, 'code'> & { description?: string };
