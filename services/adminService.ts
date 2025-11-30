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
  writeBatch,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { UserTag } from '../types';

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
  lastLoginAt?: Date;
  tags: UserTag[];
  createdAt: Date;
}

// Segment Types
export type SegmentType =
  | 'upsell_candidates'    // Free mit 0 Credits
  | 'power_users'          // >20 Bilder/Monat
  | 'inactive'             // Kein Login >14 Tage
  | 'business_emails'      // @firma.de (nicht gmail, gmx, etc.)
  | 'churn_risk';          // Abo aber <5 Bilder/Monat

export interface Segment {
  id: SegmentType;
  name: string;
  description: string;
  icon: string;
  users: AdminUser[];
}

export const AVAILABLE_TAGS: UserTag[] = ['VIP', 'Influencer', 'Beta-Tester', 'Partner'];

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
        lastLoginAt: data.lastLoginAt?.toDate(),
        tags: data.tags || [],
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

// === Segment Functions ===

const CONSUMER_EMAIL_DOMAINS = [
  'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.de',
  'hotmail.com', 'hotmail.de', 'outlook.com', 'outlook.de',
  'gmx.de', 'gmx.net', 'gmx.at', 'gmx.ch',
  'web.de', 't-online.de', 'freenet.de', 'arcor.de',
  'aol.com', 'icloud.com', 'me.com', 'mac.com',
  'live.com', 'live.de', 'msn.com',
  'mail.de', 'email.de', 'online.de', 'posteo.de',
];

const isBusinessEmail = (email: string): boolean => {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return !CONSUMER_EMAIL_DOMAINS.includes(domain);
};

export const getSegments = async (): Promise<Segment[]> => {
  try {
    const allUsers = await getAllUsers();
    const now = new Date();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Upsell Candidates: Free users with 0 credits
    const upsellCandidates = allUsers.filter(
      (u) => u.plan === 'free' && (u.monthlyCredits + u.purchasedCredits) === 0
    );

    // Power Users: >20 images generated (approximation for monthly)
    const powerUsers = allUsers.filter((u) => u.imagesGenerated > 20);

    // Inactive: No login in >14 days (or never logged in if old account)
    const inactive = allUsers.filter((u) => {
      if (!u.lastLoginAt) {
        // If no lastLoginAt, check if account is older than 14 days
        return u.createdAt < fourteenDaysAgo;
      }
      return u.lastLoginAt < fourteenDaysAgo;
    });

    // Business Emails: Not consumer email domains
    const businessEmails = allUsers.filter((u) => isBusinessEmail(u.email));

    // Churn Risk: Has subscription but <5 images
    const churnRisk = allUsers.filter(
      (u) => (u.plan === 'home' || u.plan === 'pro') && u.imagesGenerated < 5
    );

    return [
      {
        id: 'upsell_candidates',
        name: 'Upsell-Kandidaten',
        description: 'Free User mit 0 Credits - bereit für Upgrade',
        icon: '💰',
        users: upsellCandidates,
      },
      {
        id: 'power_users',
        name: 'Power-User',
        description: 'Vielnutzer mit >20 generierten Bildern',
        icon: '⚡',
        users: powerUsers,
      },
      {
        id: 'inactive',
        name: 'Inaktiv',
        description: 'Kein Login seit >14 Tagen',
        icon: '😴',
        users: inactive,
      },
      {
        id: 'business_emails',
        name: 'Business-Emails',
        description: 'User mit Firmen-Email (@firma.de)',
        icon: '🏢',
        users: businessEmails,
      },
      {
        id: 'churn_risk',
        name: 'Kündigungs-Risiko',
        description: 'Abo-User mit <5 generierten Bildern',
        icon: '⚠️',
        users: churnRisk,
      },
    ];
  } catch (error) {
    console.error('Error getting segments:', error);
    throw error;
  }
};

// === Tag Management ===

export const addTagToUser = async (userId: string, tag: UserTag): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      tags: arrayUnion(tag),
    });
  } catch (error) {
    console.error('Error adding tag to user:', error);
    throw error;
  }
};

export const removeTagFromUser = async (userId: string, tag: UserTag): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      tags: arrayRemove(tag),
    });
  } catch (error) {
    console.error('Error removing tag from user:', error);
    throw error;
  }
};

export const getUsersByTag = async (tag: UserTag): Promise<AdminUser[]> => {
  const allUsers = await getAllUsers();
  return allUsers.filter((u) => u.tags.includes(tag));
};

// === Bulk Actions ===

export const grantCreditsToUsers = async (userIds: string[], credits: number): Promise<void> => {
  try {
    const batch = writeBatch(db);

    for (const userId of userIds) {
      const userRef = doc(db, 'users', userId);
      // We need to get current credits first, so we'll do individual updates
      // For simplicity, we add to monthlyCredits
    }

    // For bulk updates, we need to fetch each user first
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    const userMap = new Map<string, any>();
    snapshot.forEach((doc) => {
      userMap.set(doc.id, doc.data());
    });

    for (const userId of userIds) {
      const userData = userMap.get(userId);
      if (userData) {
        const userRef = doc(db, 'users', userId);
        const currentMonthly = userData.monthlyCredits ?? 0;
        const currentPurchased = userData.purchasedCredits ?? 0;
        batch.update(userRef, {
          monthlyCredits: currentMonthly + credits,
          credits: currentMonthly + currentPurchased + credits, // Legacy
          updatedAt: serverTimestamp(),
        });
      }
    }

    await batch.commit();
  } catch (error) {
    console.error('Error granting credits to users:', error);
    throw error;
  }
};

export const generateEmailTemplate = (
  segment: Segment,
  templateType: 'upsell' | 'reactivation' | 'appreciation' | 'custom'
): { subject: string; body: string; emails: string[] } => {
  const emails = segment.users.map((u) => u.email);

  const templates = {
    upsell: {
      subject: 'Ihre Gratis-Credits sind aufgebraucht - Jetzt upgraden!',
      body: `Hallo,

Sie haben stoffanprobe.de bereits genutzt und Ihre kostenlosen Credits verbraucht.

Upgraden Sie jetzt auf ein Abo und erhalten Sie:
- Monatliche Credits für professionelle Visualisierungen
- Exklusive Features für Ihr Geschäft
- Prioritäts-Support

Jetzt upgraden: https://stoffanprobe.de/pricing

Mit freundlichen Grüßen,
Ihr stoffanprobe.de Team`,
    },
    reactivation: {
      subject: 'Wir vermissen Sie bei stoffanprobe.de!',
      body: `Hallo,

es ist eine Weile her, seit Sie stoffanprobe.de genutzt haben.

Wir haben in der Zwischenzeit einige tolle Verbesserungen eingeführt:
- Schnellere Bildgenerierung
- Neue Stoffmuster
- Verbesserte Qualität

Kommen Sie zurück und probieren Sie es aus!

https://stoffanprobe.de

Mit freundlichen Grüßen,
Ihr stoffanprobe.de Team`,
    },
    appreciation: {
      subject: 'Danke, dass Sie Power-User bei stoffanprobe.de sind!',
      body: `Hallo,

wir möchten uns bei Ihnen bedanken - Sie gehören zu unseren aktivsten Nutzern!

Als kleines Dankeschön haben wir Ihnen Bonus-Credits gutgeschrieben.

Weiter so und viel Erfolg mit Ihren Projekten!

Mit freundlichen Grüßen,
Ihr stoffanprobe.de Team`,
    },
    custom: {
      subject: 'Nachricht von stoffanprobe.de',
      body: `Hallo,

[Ihre Nachricht hier]

Mit freundlichen Grüßen,
Ihr stoffanprobe.de Team`,
    },
  };

  return {
    ...templates[templateType],
    emails,
  };
};

export const exportUsersToCSV = (users: AdminUser[]): string => {
  const headers = ['Email', 'Vorname', 'Nachname', 'Plan', 'Monthly Credits', 'Purchased Credits', 'Bilder', 'Tags', 'Anmeldedatum', 'Letzter Login'];
  const rows = users.map((u) => [
    u.email,
    u.firstName,
    u.lastName,
    u.plan,
    u.monthlyCredits.toString(),
    u.purchasedCredits.toString(),
    u.imagesGenerated.toString(),
    u.tags.join(';'),
    u.createdAt.toLocaleDateString('de-DE'),
    u.lastLoginAt?.toLocaleDateString('de-DE') || 'Nie',
  ]);

  return [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
};
