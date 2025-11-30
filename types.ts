
export type PresetType =
  | "Gardine"
  | "Tapete"
  | "Teppich"
  | "Accessoire"
  | "Möbel";

export type VisualizationMode =
  | "pattern"
  | "creativeWallColor"
  | "exactRAL";

export interface RALColor {
  code: string;
  name: string;
  hex: string;
}

export interface Variant {
  id: string;
  preset: PresetType | "Wandfarbe";
  imageUrl: string;
  createdAt: Date;
  comment?: string;
  isDownloaded?: boolean; // Für DSGVO-Tracking bei Kundenbildern
}

export interface CustomerData {
  customerName: string;  
  email: string; 
  phone?: string;
  address?: string;
  notes?: string;
  orderStatus?: "ja" | "nein" | "entscheidung" | "folgeangebot";
  orderAmount?: number | null;

  // Multi-Select 
  salesCategories: (
    | "Gardine"
    | "Tapete"
    | "Polster"
    | "Teppich"
    | "Zubehör"
    | "Komplettpaket"
  )[];
}

export interface ConsentData {
  accepted: boolean;
  signature?: string | null; // base64 PNG
  timestamp?: Date;
}

export type ImageType = 'private' | 'commercial';

export interface Session {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;

  customerData?: CustomerData;
  consentData?: ConsentData;
  imageType?: ImageType; // Speichert die Auswahl für die gesamte Session

  originalImage: string;
  patternImage: string;

  variants: Variant[];

  wallColor?: RALColor;
  brandingLogo?: string;
  notes?: string;
}

export interface User {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  plan: 'free' | 'pro' | 'home'; // free = kein Abo, pro = Profi-Abo, home = Home-Abo
  planType?: 'pro' | 'home'; // Expliziter Abo-Typ für Firestore
  credits: number; // Deprecated - wird durch monthlyCredits + purchasedCredits ersetzt
  monthlyCredits: number; // Vom Abo, monatlich reset
  purchasedCredits: number; // Gekauft, 12 Monate gültig
  purchasedCreditsExpiry?: Date; // Ablaufdatum für purchasedCredits
  stripeCustomerId?: string;
  subscriptionCancelledAt?: Date; // Zeitpunkt der Kündigung
  subscriptionEndsAt?: Date; // Abo endet zu diesem Datum
  subscriptionCreatedAt?: Date; // Zeitpunkt des Abo-Abschlusses
  homeConsentDismissed?: boolean; // Home-User hat Bildrechte-Hinweis dauerhaft bestätigt
  homeInfoShown?: boolean; // Home-User hat Info-Hinweis gesehen
  // Feedback-System
  imagesGenerated?: number; // Anzahl generierter Bilder
  feedbackAskedAt?: Date; // Wann wurde zuletzt nach Feedback gefragt
  feedbackDeclinedCount?: number; // Wie oft wurde Feedback abgelehnt
  feedbackGivenStars?: number; // Falls Feedback gegeben: Sterne (1-5)
  feedbackRemindAt?: Date; // Wann soll erneut gefragt werden ("Später erinnern")
  feedbackBlocked?: boolean; // Admin kann User für Stoffberater-Feedback sperren
  lastLoginAt?: Date; // Letzter Login für Aktivitäts-Tracking
  tags?: UserTag[]; // Admin-Tags für Marketing-Segmente
  createdAt: Date;
  updatedAt: Date;
}

export type UserTag = 'VIP' | 'Influencer' | 'Beta-Tester' | 'Partner';

export interface Feedback {
  id: string;
  userId: string;
  stars: number; // 1-5
  comment?: string;
  imagesGeneratedAtFeedback: number;
  createdAt: Date;
}