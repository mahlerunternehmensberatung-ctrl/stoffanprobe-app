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

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-11-17.clover',
});

// Credits pro Plan
const MONTHLY_CREDITS = {
  pro: 40,
  home: 20,
} as const;

/**
 * Admin-Endpoint zum manuellen Synchronisieren eines Stripe-Abos mit Firebase
 *
 * POST /api/stripe/sync-subscription
 * Body: { stripeCustomerId: "cus_xxx" } oder { email: "user@example.com" }
 * Header: Authorization: Bearer <ADMIN_SECRET>
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Einfacher Admin-Schutz
  const adminSecret = process.env.ADMIN_SECRET;
  const authHeader = req.headers.authorization;

  if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { stripeCustomerId, email } = req.body;

    if (!stripeCustomerId && !email) {
      return res.status(400).json({ error: 'stripeCustomerId oder email erforderlich' });
    }

    const db = getAdminDb();
    let customerId = stripeCustomerId;

    // Wenn nur Email gegeben, finde User in Firebase und hole stripeCustomerId
    let userId: string | null = null;

    if (email && !stripeCustomerId) {
      const usersSnapshot = await db.collection('users').where('email', '==', email).limit(1).get();

      if (usersSnapshot.empty) {
        return res.status(404).json({ error: `User mit Email ${email} nicht gefunden` });
      }

      const userDoc = usersSnapshot.docs[0];
      userId = userDoc.id;
      customerId = userDoc.data().stripeCustomerId;

      if (!customerId) {
        // Suche in Stripe nach Customer mit dieser Email
        const customers = await stripe.customers.list({ email: email, limit: 1 });
        if (customers.data.length === 0) {
          return res.status(404).json({ error: `Kein Stripe Customer mit Email ${email} gefunden` });
        }
        customerId = customers.data[0].id;
      }
    }

    // Hole alle aktiven Subscriptions für diesen Customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 10,
    });

    console.log(`Found ${subscriptions.data.length} active subscriptions for customer ${customerId}`);

    if (subscriptions.data.length === 0) {
      return res.status(200).json({
        message: 'Keine aktiven Abos gefunden',
        customerId,
        subscriptions: []
      });
    }

    // Analysiere die Subscription
    const subscription = subscriptions.data[0];
    const priceId = subscription.items.data[0]?.price.id;
    const productId = subscription.items.data[0]?.price.product;

    // Hole Produkt-Details
    const product = await stripe.products.retrieve(productId as string);
    const productName = product.name.toLowerCase();

    // Bestimme Plan-Typ aus Produkt-Name oder Metadaten
    let planType: 'pro' | 'home' = 'pro';
    if (productName.includes('home') || subscription.metadata?.planType === 'home') {
      planType = 'home';
    }

    const monthlyCredits = MONTHLY_CREDITS[planType];

    // Finde User in Firebase wenn noch nicht gefunden
    if (!userId) {
      // Suche User mit dieser stripeCustomerId
      const usersSnapshot = await db.collection('users')
        .where('stripeCustomerId', '==', customerId)
        .limit(1)
        .get();

      if (!usersSnapshot.empty) {
        userId = usersSnapshot.docs[0].id;
      } else {
        // Fallback: Suche nach userId in Subscription-Metadaten
        userId = subscription.metadata?.userId || null;
      }
    }

    if (!userId) {
      return res.status(404).json({
        error: 'Konnte Firebase User nicht finden',
        customerId,
        subscriptionId: subscription.id,
        suggestion: 'Bitte userId manuell angeben'
      });
    }

    // Update Firebase - Credits ADDIEREN, nicht überschreiben
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();
    const existingMonthlyCredits = userSnap.exists ? (userSnap.data()?.monthlyCredits ?? 0) : 0;

    const updateData = {
      plan: planType,
      planType: planType,
      monthlyCredits: existingMonthlyCredits + monthlyCredits, // ADDIEREN
      stripeCustomerId: customerId,
      updatedAt: FieldValue.serverTimestamp(),
    };

    await userRef.set(updateData, { merge: true });

    // Update Subscription Metadata für zukünftige Events
    await stripe.subscriptions.update(subscription.id, {
      metadata: { userId: userId, planType: planType },
    });

    const totalCredits = existingMonthlyCredits + monthlyCredits;

    return res.status(200).json({
      success: true,
      message: `User ${userId} erfolgreich auf ${planType} Plan synchronisiert. Credits: ${existingMonthlyCredits} + ${monthlyCredits} = ${totalCredits}`,
      data: {
        userId,
        customerId,
        subscriptionId: subscription.id,
        planType,
        existingCredits: existingMonthlyCredits,
        addedCredits: monthlyCredits,
        totalCredits: totalCredits,
        productName: product.name,
        priceId,
      }
    });

  } catch (error: any) {
    console.error('Sync error:', error);
    return res.status(500).json({ error: error.message || 'Sync fehlgeschlagen' });
  }
}
