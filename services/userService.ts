import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { User } from '../types';

const COLLECTION_NAME = 'users';
const INITIAL_FREE_CREDITS = 10;
const PRO_PLAN_CREDITS = 9999; // Unlimitiert
const MONTHLY_PRO_CREDITS = 40; // Credits pro Monat für Pro-Abo

/**
 * Erstellt ein neues User-Dokument in Firestore
 */
export const createUserDocument = async (
  uid: string,
  email: string,
  firstName: string,
  lastName: string
): Promise<void> => {
  try {
    const userRef = doc(db, COLLECTION_NAME, uid);
    const userData: Omit<User, 'uid'> = {
      email,
      firstName,
      lastName,
      plan: 'free',
      credits: INITIAL_FREE_CREDITS, // Legacy
      monthlyCredits: 0,
      purchasedCredits: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(userRef, {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error creating user document:', error);
    throw new Error('Fehler beim Erstellen des Benutzerkontos.');
  }
};

/**
 * Lädt User-Daten aus Firestore
 */
export const getUserData = async (uid: string): Promise<User | null> => {
  try {
    const userRef = doc(db, COLLECTION_NAME, uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return null;
    }

    const data = userSnap.data();
    return {
      uid,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      plan: data.plan || 'free',
      credits: data.credits ?? INITIAL_FREE_CREDITS, // Legacy
      monthlyCredits: data.monthlyCredits ?? 0,
      purchasedCredits: data.purchasedCredits ?? 0,
      purchasedCreditsExpiry: data.purchasedCreditsExpiry?.toDate(),
      stripeCustomerId: data.stripeCustomerId,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw new Error('Fehler beim Laden der Benutzerdaten.');
  }
};

/**
 * Reduziert Credits um 1 (wird vor Bildgenerierung aufgerufen)
 * Verbraucht zuerst monthlyCredits, dann purchasedCredits
 * WICHTIG: Diese Funktion sollte idealerweise über eine Cloud Function aufgerufen werden,
 * um Manipulationen zu verhindern. Für MVP wird sie client-seitig aufgerufen, aber
 * Security Rules sollten sicherstellen, dass Credits nicht erhöht werden können.
 */
export const decrementCredits = async (uid: string): Promise<number> => {
  try {
    const userRef = doc(db, COLLECTION_NAME, uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error('Benutzer nicht gefunden.');
    }

    const userData = userSnap.data();
    const plan = userData.plan || 'free';
    
    // Pro-Plan hat unlimitiert Credits
    if (plan === 'pro') {
      return PRO_PLAN_CREDITS;
    }

    // Prüfe abgelaufene purchasedCredits
    const now = new Date();
    const expiryDate = userData.purchasedCreditsExpiry?.toDate();
    let purchasedCredits = userData.purchasedCredits ?? 0;
    if (expiryDate && expiryDate < now) {
      purchasedCredits = 0;
    }

    const monthlyCredits = userData.monthlyCredits ?? 0;
    const totalCredits = monthlyCredits + purchasedCredits;
    
    if (totalCredits <= 0) {
      throw new Error('Keine Credits mehr verfügbar.');
    }

    // Verbrauche zuerst monthlyCredits, dann purchasedCredits
    let newMonthlyCredits = monthlyCredits;
    let newPurchasedCredits = purchasedCredits;
    
    if (monthlyCredits > 0) {
      newMonthlyCredits = monthlyCredits - 1;
    } else {
      newPurchasedCredits = purchasedCredits - 1;
    }

    const updateData: any = {
      monthlyCredits: newMonthlyCredits,
      purchasedCredits: newPurchasedCredits,
      updatedAt: serverTimestamp(),
    };

    // Legacy credits für Rückwärtskompatibilität
    updateData.credits = newMonthlyCredits + newPurchasedCredits;
    
    await updateDoc(userRef, updateData);

    return newMonthlyCredits + newPurchasedCredits;
  } catch (error) {
    console.error('Error decrementing credits:', error);
    throw error instanceof Error ? error : new Error('Fehler beim Aktualisieren der Credits.');
  }
};

/**
 * Aktualisiert User auf Pro-Plan (wird nach erfolgreicher Stripe-Zahlung aufgerufen)
 */
export const upgradeToPro = async (
  uid: string,
  stripeCustomerId?: string
): Promise<void> => {
  try {
    const userRef = doc(db, COLLECTION_NAME, uid);
    
    const updateData: any = {
      plan: 'pro',
      monthlyCredits: MONTHLY_PRO_CREDITS,
      credits: PRO_PLAN_CREDITS, // Legacy
      updatedAt: serverTimestamp(),
    };

    if (stripeCustomerId) {
      updateData.stripeCustomerId = stripeCustomerId;
    }

    await updateDoc(userRef, updateData);
  } catch (error) {
    console.error('Error upgrading to pro:', error);
    throw new Error('Fehler beim Upgrade auf Pro-Plan.');
  }
};

/**
 * Fügt purchased Credits hinzu (wird nach erfolgreicher Stripe-Zahlung aufgerufen)
 */
export const addPurchasedCredits = async (
  uid: string,
  credits: number
): Promise<void> => {
  try {
    const userRef = doc(db, COLLECTION_NAME, uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error('Benutzer nicht gefunden.');
    }

    const currentPurchasedCredits = userSnap.data().purchasedCredits ?? 0;
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 12); // +12 Monate

    await updateDoc(userRef, {
      purchasedCredits: currentPurchasedCredits + credits,
      purchasedCreditsExpiry: Timestamp.fromDate(expiryDate),
      credits: (userSnap.data().monthlyCredits ?? 0) + currentPurchasedCredits + credits, // Legacy
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error adding purchased credits:', error);
    throw new Error('Fehler beim Hinzufügen der Credits.');
  }
};

/**
 * Setzt monthlyCredits zurück (wird bei invoice.paid aufgerufen)
 */
export const resetMonthlyCredits = async (uid: string): Promise<void> => {
  try {
    const userRef = doc(db, COLLECTION_NAME, uid);
    
    await updateDoc(userRef, {
      monthlyCredits: MONTHLY_PRO_CREDITS,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error resetting monthly credits:', error);
    throw new Error('Fehler beim Zurücksetzen der monatlichen Credits.');
  }
};

/**
 * Prüft, ob User Credits hat
 */
export const hasCredits = async (uid: string): Promise<boolean> => {
  try {
    const user = await getUserData(uid);
    if (!user) return false;
    
    // Pro-Plan hat unlimitiert Credits
    if (user.plan === 'pro') return true;
    
    // Prüfe abgelaufene purchasedCredits
    const now = new Date();
    let purchasedCredits = user.purchasedCredits ?? 0;
    if (user.purchasedCreditsExpiry && user.purchasedCreditsExpiry < now) {
      purchasedCredits = 0;
    }
    
    const monthlyCredits = user.monthlyCredits ?? 0;
    return (monthlyCredits + purchasedCredits) > 0;
  } catch (error) {
    console.error('Error checking credits:', error);
    return false;
  }
};

