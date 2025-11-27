import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Firebase Admin initialisieren
function getAdminDb() {
  if (getApps().length === 0) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccount) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT not set');
    }
    initializeApp({
      credential: cert(JSON.parse(serviceAccount)),
    });
  }
  return getFirestore();
}

// Stripe initialisieren
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-11-17.clover',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, action } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId ist erforderlich.' });
    }

    // Hole User-Daten aus Firestore
    const db = getAdminDb();
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(404).json({ error: 'User nicht gefunden.' });
    }

    const userData = userSnap.data()!;
    const stripeCustomerId = userData.stripeCustomerId;

    if (!stripeCustomerId) {
      return res.status(400).json({ error: 'Kein Stripe-Kunde gefunden.' });
    }

    // Hole alle Subscriptions des Kunden
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return res.status(400).json({ error: 'Kein aktives Abo gefunden.' });
    }

    const subscription = subscriptions.data[0];

    if (action === 'cancel') {
      // Kündigung zum Ende der Periode
      const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: true,
      });

      // Speichere Kündigungsdatum in Firestore
      const periodEnd = new Date(updatedSubscription.current_period_end * 1000);

      await userRef.update({
        subscriptionCancelledAt: FieldValue.serverTimestamp(),
        subscriptionEndsAt: periodEnd,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return res.status(200).json({
        success: true,
        message: 'Abo wird zum Ende der Abrechnungsperiode gekündigt.',
        subscriptionEndsAt: periodEnd.toISOString(),
      });

    } else if (action === 'reactivate') {
      // Kündigung widerrufen
      const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: false,
      });

      // Entferne Kündigungsdaten aus Firestore
      await userRef.update({
        subscriptionCancelledAt: FieldValue.delete(),
        subscriptionEndsAt: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return res.status(200).json({
        success: true,
        message: 'Kündigung wurde widerrufen. Ihr Abo läuft weiter.',
      });

    } else {
      return res.status(400).json({ error: 'action muss "cancel" oder "reactivate" sein.' });
    }

  } catch (error: any) {
    console.error('Error handling subscription:', error);
    return res.status(500).json({ error: error.message || 'Fehler bei der Abo-Verwaltung' });
  }
}
