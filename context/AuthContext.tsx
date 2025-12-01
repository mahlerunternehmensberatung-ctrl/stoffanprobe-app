import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, getDoc, Unsubscribe } from 'firebase/firestore';
import { onAuthStateChange, getCurrentUser, logoutUser } from '../services/authService';
import { db } from '../services/firebase';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Lade User-Daten aus Firestore (ohne Realtime)
  const loadUserData = async (uid: string): Promise<User | null> => {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        return null;
      }

      const data = userSnap.data();
      // Für neue free-User: 10 Gratis-Credits in monthlyCredits
      const plan = data.plan || 'free';
      const monthlyCredits = data.monthlyCredits !== undefined 
        ? data.monthlyCredits 
        : (plan === 'free' ? 10 : 0);
      
      return {
        uid,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        plan,
        credits: data.credits ?? 10, // Legacy
        monthlyCredits,
        purchasedCredits: data.purchasedCredits ?? 0,
        purchasedCreditsExpiry: data.purchasedCreditsExpiry?.toDate(),
        stripeCustomerId: data.stripeCustomerId,
        subscriptionCancelledAt: data.subscriptionCancelledAt?.toDate(),
        subscriptionEndsAt: data.subscriptionEndsAt?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    } catch (error) {
      console.error('Error loading user data:', error);
      return null;
    }
  };

  // Realtime Subscription für User-Daten (inkl. Credits)
  useEffect(() => {
    let unsubscribeAuth: Unsubscribe | null = null;
    let unsubscribeFirestore: Unsubscribe | null = null;

    unsubscribeAuth = onAuthStateChange(async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        // Initial load
        const userData = await loadUserData(firebaseUser.uid);
        setUser(userData);

        // Realtime Subscription für Credits und andere User-Daten
        const userRef = doc(db, 'users', firebaseUser.uid);
        unsubscribeFirestore = onSnapshot(
          userRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data();
              // Für neue free-User: 10 Gratis-Credits in monthlyCredits
              const plan = data.plan || 'free';
              const monthlyCredits = data.monthlyCredits !== undefined 
                ? data.monthlyCredits 
                : (plan === 'free' ? 10 : 0);
              
              setUser({
                uid: firebaseUser.uid,
                email: data.email || firebaseUser.email || '',
                firstName: data.firstName || '',
                lastName: data.lastName || '',
                plan,
                credits: data.credits ?? 10, // Legacy
                monthlyCredits,
                purchasedCredits: data.purchasedCredits ?? 0,
                purchasedCreditsExpiry: data.purchasedCreditsExpiry?.toDate(),
                stripeCustomerId: data.stripeCustomerId,
                subscriptionCancelledAt: data.subscriptionCancelledAt?.toDate(),
                subscriptionEndsAt: data.subscriptionEndsAt?.toDate(),
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
              });
            } else {
              setUser(null);
            }
            setLoading(false);
          },
          (error) => {
            console.error('Error in Firestore subscription:', error);
            setUser(null);
            setLoading(false);
          }
        );
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      if (unsubscribeAuth) {
        unsubscribeAuth();
      }
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
    };
  }, []);

  const refreshUser = async () => {
    const currentFirebaseUser = getCurrentUser();
    if (currentFirebaseUser) {
      const userData = await loadUserData(currentFirebaseUser.uid);
      setUser(userData);
    }
  };

  const logout = async () => {
    await logoutUser();
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

