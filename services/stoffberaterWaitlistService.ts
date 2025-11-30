import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  getDoc,
} from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION_NAME = 'stoffberater_feedback';
const BONUS_CREDITS = 10;

export interface StoffberaterInterests {
  stofferkennung: boolean;
  verhaltensprofile: boolean;
  toleranzen: boolean;
  pdfExport: boolean;
  bestPractice: boolean;
}

/**
 * Speichert Feedback und gibt Credits
 * Abo-User können mehrfach Feedback geben und erhalten jedes Mal 10 Credits
 */
export const submitStoffberaterFeedback = async (
  userId: string,
  feedbackText: string,
  interests: StoffberaterInterests
): Promise<{ success: boolean; creditsGranted: boolean }> => {
  try {
    // Speichere Feedback
    const feedbackRef = collection(db, COLLECTION_NAME);
    await addDoc(feedbackRef, {
      userId,
      feedbackText,
      interests,
      creditsGranted: true,
      isValuable: null, // Für Admin-Review
      createdAt: serverTimestamp(),
    });

    // Vergebe Credits
    await grantBonusCredits(userId);

    return { success: true, creditsGranted: true };
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
