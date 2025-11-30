import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

const WAITLIST_COLLECTION = 'waitlist';

/**
 * Fügt eine E-Mail zur Waitlist hinzu
 * Prüft vorher ob die E-Mail für dieses Feature bereits existiert
 */
export const addToWaitlist = async (
  email: string,
  feature: string
): Promise<void> => {
  try {
    // Prüfe ob E-Mail bereits für dieses Feature registriert ist
    const waitlistRef = collection(db, WAITLIST_COLLECTION);
    const q = query(
      waitlistRef,
      where('email', '==', email),
      where('feature', '==', feature)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // E-Mail bereits registriert - kein Fehler werfen, einfach erfolgreich abschließen
      console.log('Email already registered for this feature');
      return;
    }

    // Neue Registrierung hinzufügen
    await addDoc(waitlistRef, {
      email,
      feature,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error adding to waitlist:', error);
    throw new Error('Fehler beim Speichern der Registrierung.');
  }
};
