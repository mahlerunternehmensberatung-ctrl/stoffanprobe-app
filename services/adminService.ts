import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  where,
  Timestamp,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';

// Admin-Emails die Zugriff haben
export const ADMIN_EMAILS = ['mahler.unternehmensberatung@gmail.com'];

export const isAdmin = (email: string | undefined): boolean => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email);
};

// User Stats
export interface UserStats {
  total: number;
  free: number;
  home: number;
  pro: number;
  newToday: number;
  newThisWeek: number;
}

export interface FeedbackEntry {
  id: string;
  userId: string;
  userEmail?: string;
  userPlan?: string;
  feedbackText: string;
  interests: {
    stofferkennung: boolean;
    verhaltensprofile: boolean;
    toleranzen: boolean;
    pdfExport: boolean;
    bestPractice: boolean;
  };
  creditsGranted: boolean;
  isValuable: boolean | null;
  createdAt: Date;
}

export interface AdminUser {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  plan: 'free' | 'pro' | 'home';
  monthlyCredits: number;
  purchasedCredits: number;
  imagesGenerated: number;
  feedbackBlocked: boolean;
  createdAt: Date;
}

export interface WaitlistEntry {
  id: string;
  email: string;
  createdAt: Date;
}

// === Dashboard Stats ===

export const getUserStats = async (): Promise<UserStats> => {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);

    let total = 0;
    let free = 0;
    let home = 0;
    let pro = 0;
    let newToday = 0;
    let newThisWeek = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      total++;

      const plan = data.plan || 'free';
      if (plan === 'free') free++;
      else if (plan === 'home') home++;
      else if (plan === 'pro') pro++;

      const createdAt = data.createdAt?.toDate();
      if (createdAt) {
        if (createdAt >= todayStart) newToday++;
        if (createdAt >= weekStart) newThisWeek++;
      }
    });

    return { total, free, home, pro, newToday, newThisWeek };
  } catch (error) {
    console.error('Error getting user stats:', error);
    throw error;
  }
};

export const getImageStats = async (): Promise<{ today: number; thisWeek: number }> => {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);

    // Für MVP: Summe aller imagesGenerated
    // Für echte daily/weekly Stats bräuchten wir einen separaten Counter oder Events-Collection
    let totalImages = 0;
    snapshot.forEach((doc) => {
      const data = doc.data();
      totalImages += data.imagesGenerated || 0;
    });

    // Approximation basierend auf Gesamtzahl
    return {
      today: Math.floor(totalImages * 0.05), // Placeholder
      thisWeek: Math.floor(totalImages * 0.2) // Placeholder
    };
  } catch (error) {
    console.error('Error getting image stats:', error);
    return { today: 0, thisWeek: 0 };
  }
};

export const getActiveSubscriptions = async (): Promise<number> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('plan', 'in', ['home', 'pro']));
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Error getting active subscriptions:', error);
    return 0;
  }
};

// === Feedback Management ===

export const getAllFeedback = async (): Promise<FeedbackEntry[]> => {
  try {
    const feedbackRef = collection(db, 'stoffberater_feedback');
    const q = query(feedbackRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    const feedbacks: FeedbackEntry[] = [];
    const userCache: Record<string, { email: string; plan: string }> = {};

    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data();
      const userId = data.userId;

      // Cache user data to avoid redundant queries
      if (!userCache[userId]) {
        try {
          const userDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', userId), limit(1)));
          if (!userDoc.empty) {
            const userData = userDoc.docs[0].data();
            userCache[userId] = {
              email: userData.email || 'Unbekannt',
              plan: userData.plan || 'free',
            };
          } else {
            userCache[userId] = { email: 'Unbekannt', plan: 'free' };
          }
        } catch {
          userCache[userId] = { email: 'Unbekannt', plan: 'free' };
        }
      }

      feedbacks.push({
        id: docSnapshot.id,
        userId,
        userEmail: userCache[userId].email,
        userPlan: userCache[userId].plan,
        feedbackText: data.feedbackText || '',
        interests: data.interests || {},
        creditsGranted: data.creditsGranted ?? false,
        isValuable: data.isValuable ?? null,
        createdAt: data.createdAt?.toDate() || new Date(),
      });
    }

    return feedbacks;
  } catch (error) {
    console.error('Error getting all feedback:', error);
    throw error;
  }
};

export const markFeedbackValuable = async (feedbackId: string, isValuable: boolean): Promise<void> => {
  try {
    const feedbackRef = doc(db, 'stoffberater_feedback', feedbackId);
    await updateDoc(feedbackRef, { isValuable });
  } catch (error) {
    console.error('Error marking feedback valuable:', error);
    throw error;
  }
};

// === User Management ===

export const getAllUsers = async (): Promise<AdminUser[]> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        uid: doc.id,
        email: data.email || '',
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        plan: data.plan || 'free',
        monthlyCredits: data.monthlyCredits ?? 0,
        purchasedCredits: data.purchasedCredits ?? 0,
        imagesGenerated: data.imagesGenerated ?? 0,
        feedbackBlocked: data.feedbackBlocked ?? false,
        createdAt: data.createdAt?.toDate() || new Date(),
      };
    });
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
};

export const searchUsers = async (searchQuery: string): Promise<AdminUser[]> => {
  // Firestore doesn't support full-text search, so we fetch all and filter client-side
  const allUsers = await getAllUsers();
  const query = searchQuery.toLowerCase();
  return allUsers.filter(
    (user) =>
      user.email.toLowerCase().includes(query) ||
      user.firstName.toLowerCase().includes(query) ||
      user.lastName.toLowerCase().includes(query)
  );
};

export const blockUser = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { feedbackBlocked: true });
  } catch (error) {
    console.error('Error blocking user:', error);
    throw error;
  }
};

export const unblockUser = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { feedbackBlocked: false });
  } catch (error) {
    console.error('Error unblocking user:', error);
    throw error;
  }
};

export const adjustUserCredits = async (
  userId: string,
  monthlyCredits: number,
  purchasedCredits: number
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      monthlyCredits,
      purchasedCredits,
      credits: monthlyCredits + purchasedCredits, // Legacy
    });
  } catch (error) {
    console.error('Error adjusting user credits:', error);
    throw error;
  }
};

// === Waitlist ===

export const getWaitlist = async (): Promise<WaitlistEntry[]> => {
  try {
    // Check if stoffberater_waitlist collection exists
    const waitlistRef = collection(db, 'stoffberater_waitlist');
    const q = query(waitlistRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email || '',
        createdAt: data.createdAt?.toDate() || new Date(),
      };
    });
  } catch (error) {
    console.error('Error getting waitlist:', error);
    return [];
  }
};
