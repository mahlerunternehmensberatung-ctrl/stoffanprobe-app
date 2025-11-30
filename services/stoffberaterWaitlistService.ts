import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION_NAME = 'stoffberater_waitlist';
const BONUS_CREDITS = 10;

export interface StoffberaterInterests {
  stofferkennung: boolean;
  verhaltensprofile: boolean;
  toleranzen: boolean;
  pdfExport: boolean;
  bestPractice: boolean;
}

export interface StoffberaterFeedback {
  email: string;
  userId?: string;
  feedbackText: string;
  interests: StoffberaterInterests;
  creditsGranted: boolean;
  createdAt: Date;
}

/**
 * Prüft ob User bereits Feedback gegeben hat
 */
export const hasUserSubmittedFeedback = async (
  userId?: string,
  email?: string
): Promise<boolean> => {
  try {
    const waitlistRef = collection(db, COLLECTION_NAME);

    // Prüfe nach userId wenn vorhanden
    if (userId) {
      const userQuery = query(waitlistRef, where('userId', '==', userId));
      const userSnapshot = await getDocs(userQuery);
      if (!userSnapshot.empty) return true;
    }

    // Prüfe nach Email
    if (email) {
      const emailQuery = query(waitlistRef, where('email', '==', email));
      const emailSnapshot = await getDocs(emailQuery);
      if (!emailSnapshot.empty) return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking feedback status:', error);
    return false;
  }
};

/**
 * Speichert Feedback und gibt Credits
 * Returns: true wenn Credits vergeben wurden, false wenn bereits Feedback vorhanden
 */
export const submitStoffberaterFeedback = async (
  email: string,
  feedbackText: string,
  interests: StoffberaterInterests,
  userId?: string
): Promise<{ success: boolean; creditsGranted: boolean; alreadySubmitted: boolean }> => {
  try {
    // Prüfe ob bereits Feedback gegeben wurde
    const alreadySubmitted = await hasUserSubmittedFeedback(userId, email);

    if (alreadySubmitted) {
      return { success: true, creditsGranted: false, alreadySubmitted: true };
    }

    // Speichere Feedback
    const waitlistRef = collection(db, COLLECTION_NAME);
    await addDoc(waitlistRef, {
      email,
      userId: userId || null,
      feedbackText,
      interests,
      creditsGranted: !!userId, // Credits nur wenn eingeloggt
      createdAt: serverTimestamp(),
    });

    // Vergebe Credits wenn User eingeloggt ist
    if (userId) {
      await grantBonusCredits(userId);
    }

    return { success: true, creditsGranted: !!userId, alreadySubmitted: false };
  } catch (error) {
    console.error('Error submitting stoffberater feedback:', error);
    throw new Error('Fehler beim Speichern des Feedbacks.');
  }
};

/**
 * Vergibt Bonus-Credits an User
 */
const grantBonusCredits = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);

    // Hole aktuelle Credits
    const { getDoc } = await import('firebase/firestore');
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.error('User not found for bonus credits');
      return;
    }

    const userData = userSnap.data();
    const currentMonthlyCredits = userData.monthlyCredits ?? 0;

    // Addiere Bonus-Credits zu monthlyCredits
    await updateDoc(userRef, {
      monthlyCredits: currentMonthlyCredits + BONUS_CREDITS,
      credits: (userData.credits ?? 0) + BONUS_CREDITS, // Legacy
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error granting bonus credits:', error);
    // Fehler nicht werfen, da Feedback bereits gespeichert wurde
  }
};
