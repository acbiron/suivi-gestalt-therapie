// src/types.ts

export type Seance = {
  date: string;
  resume: string;
  transcription: string;
  audio?: string;
  resumeIA?: string;
};

export type PriseContact = {
  calendly?: boolean;
  appel?: boolean;
  autres?: boolean;
  details?: string;
};

export type ContactRegulationKey =
  | "confluence"
  | "deflexionInterne"
  | "deflexionExterne"
  | "retroflexion"
  | "introjection"
  | "projection"
  | "egotisme";

export type ContactRegulationItem = {
  checked: boolean;
  note?: string;
};

export type ZinkerStatus = "fluide" | "ralenti" | "bloque" | "";

export type ZinkerStepKey =
  | "retrait1"
  | "sensation"
  | "priseConscience"
  | "mobilisation"
  | "action"
  | "preContact"
  | "contact"
  | "desengagement"
  | "assimilation"
  | "retrait2";

export type ZinkerStep = {
  status: ZinkerStatus;
  note?: string;
};

export type Self = {
  corps: Record<string, Record<string, boolean>>;
  croyances: {
    positivesSoi: string;
    negativesSoi: string;
    positivesAutres: string;
    negativesAutres: string;
  };
  je: {
    negatif: { niveau: string; texte: string };
    positif: { niveau: string; texte: string };
    aligne: { niveau: string; texte: string };
  };
  etre: {
    acces: boolean;
    texte: string;
  };
  contactRegulations?: Record<ContactRegulationKey, ContactRegulationItem>;
  zinkerCycle?: Record<ZinkerStepKey, ZinkerStep>;
};

export type ClinicalGridFamily = "attachement" | "estime";

export type ClinicalGridOrigin = "IL" | "JE" | "Observation";

export type ClinicalGridItem = {
  id: string;
  texte: string;
  famille: ClinicalGridFamily;
  origine: ClinicalGridOrigin;
  types: string[];
  intensite?: "standard" | "haute";
};

export type ClinicalSelection = {
  selectedItemIds: string[];
  notes?: string;
};

export type TimelineCategory =
  | "Champ 3"
  | "Champ 4"
  | "Séance"
  | "Vie"
  | "Thérapie"
  | "Autre";

export type TimelineEvent = {
  id: string;
  date?: string;
  seanceNumber?: number;
  titre: string;
  description?: string;
  categorie: TimelineCategory;
  firstFiveSessions?: boolean;
  important?: boolean;
};

export type RelationCategory =
  | "Famille"
  | "Couple"
  | "Travail"
  | "Amis"
  | "Santé"
  | "Autre";

export type RelationProximite = "Proche" | "Moyen" | "Distant" | "Coupé";

export type ResourceCategory =
  | "Attachement"
  | "Émotions"
  | "Estime de soi"
  | "Stress"
  | "Outils"
  | "SELF"
  | "Abondance"
  | "Exercices"
  | "Concepts"
  | "Autre";

export type ResourceItem = {
  id?: string;
  titre: string;
  categorie: ResourceCategory;
  tags?: string[];
  description?: string;
  favori?: boolean;
  pdfUrl: string;
  fileName?: string;
  storagePath?: string;
  createdAt?: any;
  ownerId?: string;
};

export type Relation = {
  id: string;
  prenom: string;
  age?: number;
  categorie: RelationCategory;
  nature: string;
  proximite: RelationProximite;
  impact: number;
  tags?: {
    ressource?: boolean;
    declencheur?: boolean;
    ambivalent?: boolean;
  };
  vecu?: string;
  lastMentionedAt?: string;
  pinned?: boolean;
};

/* ===================== COMPTABILITÉ ===================== */

export type AccountingEntryType = "entrée" | "sortie";

export type AccountingEntryStatus = "réel" | "à venir";

export type AccountingPaymentMethod =
  | "virement"
  | "cb"
  | "espèces"
  | "chèque"
  | "prélèvement"
  | "autre";

export type AccountingCategory =
  | "Assurance"
  | "Banque"
  | "Compte personnel"
  | "Épargne"
  | "Formation"
  | "Loyer"
  | "Paiement client"
  | "Promotion"
  | "Supervision"
  | "Thérapie personnelle"
  | "URSSAF"
  | "Divers";

export type AccountingEntry = {
  id: string;
  date: string;
  description: string;
  categorie: AccountingCategory;
  type: AccountingEntryType;
  statut: AccountingEntryStatus;
  montant: number;
  modePaiement?: AccountingPaymentMethod;
  clientId?: string;
  clientLabel?: string;
  notes?: string;
  createdAt?: string;
  linkedEntryId?: string;
};

export type RecurringChargeFrequency = "mensuel" | "annuel";

export type RecurringCharge = {
  id: string;
  nom: string;
  categorie: AccountingCategory;
  type: "sortie";
  montant?: number;
  frequence: RecurringChargeFrequency;
  jour?: number;
  moisAnnuel?: number;
  statutParDefaut?: AccountingEntryStatus;
  modePaiement?: AccountingPaymentMethod;
  actif: boolean;
  notes?: string;
};

export type Client = {
  communication?: any;
  precisionsCadre?: string;
  vecuCadre?: string;
  autresCadre?: string;
  cadreTeste?: string;
  id?: string;
  nom: string;
  prenom: string;
  date: string;
  cadre: "Présentiel" | "Visio" | "Mixte";
  genre: "Homme" | "Femme" | "Non genré";
  seances: Seance[];
  resourceIds?: string[];
  attachementGrid?: ClinicalSelection;
  estimeGrid?: ClinicalSelection;
  actif?: boolean;
  adresse?: string;
  age?: number;
  telephone?: string;
  email?: string;
  archived?: boolean;
  archivedAt?: string;

  travail?: {
    type: string[];
    profession?: string;
    vecu?: string;
  };

  couple?: {
    statut: string[];
    precisions?: string;
    vecu?: string;
  };

  parents?: {
    pere?: { decede?: boolean; vecu?: string };
    mere?: { decede?: boolean; vecu?: string };
  };

  enfants?: {
    nombre: number;
    data: { prenom?: string; age?: number; vecu?: string }[];
  };

  fratrie?: {
    nombre: number;
    data: { place?: string; prenom?: string; age?: number; vecu?: string }[];
  };

  divers?: string;
  stresseurs?: string;
  attachement?: string;
  estime?: string;
  niveauUrgence?: number;
  niveauConscience?: number;
  priseContact?: PriseContact;
  pistesStrategiques?: string;
  self?: Self;
  relations?: Relation[];
  supervision?: Seance[];
  timeline?: TimelineEvent[];
  accountingEntryIds?: string[];
};

export type AccountingData = {
  entries: AccountingEntry[];
  recurringCharges: RecurringCharge[];
};

export type AppointmentStatus =
  | "prévu"
  | "confirmé"
  | "annulé"
  | "reporté"
  | "réalisé";

export type AppointmentLocation =
  | "cabinet"
  | "visio"
  | "téléphone"
  | "perso"
  | "autre";

export type AppointmentKind =
  | "séance"
  | "thérapie perso"
  | "supervision"
  | "perso"
  | "autre";

export type Appointment = {
  id: string;
  clientId?: string;
  clientLabel: string;
  date: string; // YYYY-MM-DD
  heure: string; // HH:mm
  dureeMinutes: number;
  statut: AppointmentStatus;
  lieu: AppointmentLocation;
  typeRdv: AppointmentKind;
  notes?: string;
  createdAt?: string;
};

export type PlanningData = {
  appointments: Appointment[];
};

export type ReceiptType =
  | "séance gestalt"
  | "autre prestation"
  | "formation"
  | "atelier";

export type ReceiptPaymentMethod =
  | "espèces"
  | "virement"
  | "chèque"
  | "cb"
  | "autre";

export type ReceiptEntry = {
  id: string;
  typeRecette: ReceiptType;
  clientId?: string;
  clientLabel: string;
  libelleLibre?: string;
  dateEvenement: string; // YYYY-MM-DD
  datePaiement: string; // YYYY-MM-DD
  montant: number;
  numeroFacture: string;
  modePaiement: ReceiptPaymentMethod;
  notes?: string;
  createdAt?: string;
};

export type ReceiptBookData = {
  entries: ReceiptEntry[];
};
