
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
  plan: 'free' | 'pro';
  credits: number; // Deprecated - wird durch monthlyCredits + purchasedCredits ersetzt
  monthlyCredits: number; // Vom Abo, monatlich reset
  purchasedCredits: number; // Gekauft, 12 Monate gültig
  purchasedCreditsExpiry?: Date; // Ablaufdatum für purchasedCredits
  stripeCustomerId?: string;
  subscriptionCancelledAt?: Date; // Zeitpunkt der Kündigung
  subscriptionEndsAt?: Date; // Abo endet zu diesem Datum
  createdAt: Date;
  updatedAt: Date;
}