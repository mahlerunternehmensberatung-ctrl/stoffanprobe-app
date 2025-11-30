import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { User, Feedback } from '../types';

const USERS_COLLECTION = 'users';
const FEEDBACK_COLLECTION = 'feedback';

/**
 * Speichert Feedback in Firestore
 */
export const submitFeedback = async (
  userId: string,
  stars: number,
  comment?: string,
  imagesGenerated: number = 0
): Promise<void> => {
  try {
    // Feedback in separate Collection speichern
    await addDoc(collection(db, FEEDBACK_COLLECTION), {
      userId,
      stars,
      comment: comment || null,
      imagesGeneratedAtFeedback: imagesGenerated,
      createdAt: serverTimestamp(),
    });

    // User-Dokument aktualisieren
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      feedbackGivenStars: stars,
      feedbackAskedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    throw new Error('Fehler beim Speichern des Feedbacks.');
  }
};

/**
 * Markiert, dass User "Später erinnern" geklickt hat
 * Setzt feedbackRemindAt auf jetzt + 7 Tage
 */
export const setFeedbackRemindLater = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const remindDate = new Date();
    remindDate.setDate(remindDate.getDate() + 7); // +7 Tage

    await updateDoc(userRef, {
      feedbackRemindAt: Timestamp.fromDate(remindDate),
      feedbackAskedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error setting remind later:', error);
    throw new Error('Fehler beim Speichern der Erinnerung.');
  }
};

/**
 * Markiert, dass User Feedback abgelehnt hat (X geklickt)
 * Erhöht feedbackDeclinedCount und setzt feedbackAskedAt
 */
export const declineFeedback = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error('Benutzer nicht gefunden.');
    }

    const currentDeclinedCount = userSnap.data().feedbackDeclinedCount ?? 0;

    await updateDoc(userRef, {
      feedbackDeclinedCount: currentDeclinedCount + 1,
      feedbackAskedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error declining feedback:', error);
    throw new Error('Fehler beim Speichern.');
  }
};

/**
 * Erhöht imagesGenerated um 1
 */
export const incrementImagesGenerated = async (userId: string): Promise<number> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error('Benutzer nicht gefunden.');
    }

    const currentCount = userSnap.data().imagesGenerated ?? 0;
    const newCount = currentCount + 1;

    await updateDoc(userRef, {
      imagesGenerated: newCount,
      updatedAt: serverTimestamp(),
    });

    return newCount;
  } catch (error) {
    console.error('Error incrementing images generated:', error);
    throw error;
  }
};

/**
 * Prüft, ob das Feedback-Modal angezeigt werden soll
 */
export const shouldShowFeedbackModal = (user: User): boolean => {
  const now = new Date();

  // NIEMALS: Wenn User bereits zufrieden war (4-5 Sterne)
  if (user.feedbackGivenStars && user.feedbackGivenStars >= 4) {
    return false;
  }

  // NIEMALS: Wenn User bereits Feedback gegeben hat (auch mit 1-3 Sternen)
  // Wir fragen nur einmal - außer bei "Später erinnern"
  if (user.feedbackGivenStars && user.feedbackGivenStars > 0) {
    return false;
  }

  // Prüfe "Später erinnern" - wenn gesetzt und noch nicht erreicht, nicht anzeigen
  if (user.feedbackRemindAt) {
    if (now < user.feedbackRemindAt) {
      return false;
    }
    // Reminder-Zeit erreicht - anzeigen
    return true;
  }

  // Nach Ablehnung: Warte 30 Tage
  if (user.feedbackDeclinedCount && user.feedbackDeclinedCount > 0) {
    if (user.feedbackAskedAt) {
      const daysSinceAsked = Math.floor(
        (now.getTime() - user.feedbackAskedAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      // Bei erstem Ablehnen: 30 Tage warten
      // Bei zweitem Ablehnen: 90 Tage warten
      const waitDays = user.feedbackDeclinedCount === 1 ? 30 : 90;
      if (daysSinceAsked < waitDays) {
        return false;
      }
    }
  }

  const imagesGenerated = user.imagesGenerated ?? 0;
  const totalCredits = (user.monthlyCredits ?? 0) + (user.purchasedCredits ?? 0);

  // FREE USER: Nach dem 8. generierten Bild (von 10 Gratis)
  if (user.plan === 'free') {
    return imagesGenerated >= 8;
  }

  // ZAHLENDE USER (pro oder home):
  // 1. Wenn Credits < 5 UND noch kein Feedback gefragt
  if (totalCredits < 5 && !user.feedbackAskedAt) {
    return true;
  }

  // 2. 30 Tage nach Abo-Abschluss (erste Anfrage)
  if (user.subscriptionCreatedAt && !user.feedbackAskedAt) {
    const daysSinceSubscription = Math.floor(
      (now.getTime() - user.subscriptionCreatedAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceSubscription >= 30) {
      return true;
    }
  }

  // 3. 90 Tage nach Abo-Abschluss (falls beim ersten Mal abgelehnt)
  if (
    user.subscriptionCreatedAt &&
    user.feedbackDeclinedCount === 1 &&
    user.feedbackAskedAt
  ) {
    const daysSinceSubscription = Math.floor(
      (now.getTime() - user.subscriptionCreatedAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceSubscription >= 90) {
      return true;
    }
  }

  return false;
};
