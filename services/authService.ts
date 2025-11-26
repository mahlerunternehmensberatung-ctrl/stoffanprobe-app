import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  User,
  onAuthStateChanged,
  AuthError
} from 'firebase/auth';
import { auth } from './firebase';
import { createUserDocument } from './userService';

export interface AuthErrorCode {
  code: string;
  message: string;
}

export const registerUser = async (
  email: string, 
  password: string,
  firstName: string,
  lastName: string
): Promise<User> => {
  try {
    // 1. User in Firebase Auth erstellen
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. WICHTIG: Sofort danach das User-Dokument in Firestore anlegen
    // mit credits: 10, plan: "free", createdAt: serverTimestamp()
    await createUserDocument(
      user.uid,
      email,
      firstName,
      lastName
    );

    return user;
  } catch (error: any) {
    const authError = error as AuthError;
    let errorMessage = 'Ein Fehler ist aufgetreten.';
    
    switch (authError.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'Diese E-Mail-Adresse wird bereits verwendet.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Die E-Mail-Adresse ist ungültig.';
        break;
      case 'auth/weak-password':
        errorMessage = 'Das Passwort ist zu schwach. Bitte verwenden Sie mindestens 6 Zeichen.';
        break;
      default:
        errorMessage = authError.message || 'Ein unbekannter Fehler ist aufgetreten.';
    }
    
    throw new Error(errorMessage);
  }
};

export const loginUser = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    const authError = error as AuthError;
    let errorMessage = 'Ein Fehler ist aufgetreten.';
    
    switch (authError.code) {
      case 'auth/user-not-found':
        errorMessage = 'Kein Benutzer mit dieser E-Mail-Adresse gefunden.';
        break;
      case 'auth/wrong-password':
        errorMessage = 'Falsches Passwort.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Die E-Mail-Adresse ist ungültig.';
        break;
      case 'auth/user-disabled':
        errorMessage = 'Dieser Benutzer wurde deaktiviert.';
        break;
      default:
        errorMessage = authError.message || 'Ein unbekannter Fehler ist aufgetreten.';
    }
    
    throw new Error(errorMessage);
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error('Fehler beim Abmelden: ' + (error.message || 'Unbekannter Fehler'));
  }
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

