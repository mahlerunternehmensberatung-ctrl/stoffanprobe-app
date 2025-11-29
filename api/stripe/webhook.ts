import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Firebase Admin initialisieren (inline)
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
  apiVersion: '2025-11-17.clover', // Stelle sicher, dass diese Version stimmt, sonst '2023-10-16' o.ä. nutzen
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
const MONTHLY_PRO_CREDITS = 40; // Hast du hier auch auf 40 angepasst? Falls ja, passt es.

// Credit-Pakete Mapping
// WICHTIG: Hier sind jetzt die neuen Variablen und Mengen (40 & 400)
const CREDIT_PACKAGES: Record<string, number> = {
  [process.env.STRIPE_PRICE_10_CREDITS || '']: 10,
  [process.env.STRIPE_PRICE_20_CREDITS || '']: 20,
  [process.env.STRIPE_PRICE_40_CREDITS || '']: 40,   // NEU: 40 statt 50
  [process.env.STRIPE_PRICE_100_CREDITS || '']: 100,
  [process.env.STRIPE_PRICE_200_CREDITS || '']: 200,
  [process.env.STRIPE_PRICE_400_CREDITS || '']: 400, // NEU: 400 statt 500
};

async function upgradeToSubscription(uid: string, planType: 'pro' | 'home', stripeCustomerId?: string): Promise<void> {
  const db = getAdminDb();
  const userRef = db.collection('users').doc(uid);

  // Hole bestehende User-Daten um Credits zu addieren
  const userSnap = await userRef.get();
  const existingCredits = userSnap.exists ? (userSnap.data()?.monthlyCredits ?? 0) : 0;

  const updateData: Record<string, any> = {
    plan: planType, // 'pro' oder 'home'
    planType: planType, // Explizit speichern für spätere Referenz
    // Addiere Credits zu bestehenden Credits
    monthlyCredits: existingCredits + MONTHLY_PRO_CREDITS,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (stripeCustomerId) {
    updateData.stripeCustomerId = stripeCustomerId;
  }

  // Nutze set mit merge statt update, falls User-Dokument noch nicht existiert
  await userRef.set(updateData, { merge: true });
  console.log(`User ${uid} upgraded to ${planType} (${existingCredits} + ${MONTHLY_PRO_CREDITS} = ${existingCredits + MONTHLY_PRO_CREDITS} credits)`);
}

async function addPurchasedCredits(uid: string, credits: number): Promise<void> {
  const db = getAdminDb();
  const userRef = db.collection('users').doc(uid);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    throw new Error(`User ${uid} not found`);
  }

  const userData = userSnap.data()!;
  const currentPurchasedCredits = userData.purchasedCredits ?? 0;
  
  // Credits verfallen erst in 12 Monaten
  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + 12);

  await userRef.update({
    purchasedCredits: currentPurchasedCredits + credits,
    purchasedCreditsExpiry: expiryDate,
    credits: (userData.monthlyCredits ?? 0) + currentPurchasedCredits + credits, // Gesamt-Credits aktualisieren
    updatedAt: FieldValue.serverTimestamp(),
  });

  console.log(`Added ${credits} credits to user ${uid}`);
}

async function resetMonthlyCredits(uid: string, planType?: 'pro' | 'home'): Promise<void> {
  const db = getAdminDb();
  const userRef = db.collection('users').doc(uid);

  const updateData: Record<string, any> = {
    monthlyCredits: MONTHLY_PRO_CREDITS,
    updatedAt: FieldValue.serverTimestamp(),
  };

  // Stelle sicher dass plan und planType korrekt gesetzt sind
  if (planType) {
    updateData.plan = planType;
    updateData.planType = planType;
  }

  await userRef.update(updateData);

  console.log(`Reset monthly credits for user ${uid} (planType: ${planType || 'unknown'})`);
}

async function downgradeToFree(uid: string): Promise<void> {
  const db = getAdminDb();
  const userRef = db.collection('users').doc(uid);

  await userRef.update({
    plan: 'free',
    monthlyCredits: 0,
    subscriptionCancelledAt: FieldValue.delete(),
    subscriptionEndsAt: FieldValue.delete(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  console.log(`User ${uid} downgraded to free plan`);
}

export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const rawBody = await getRawBody(req);
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      return res.status(400).json({ error: 'Stripe-Signatur fehlt' });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    console.log(`Received event: ${event.type}`);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      const userId = session.metadata?.userId || session.client_reference_id;
      const mode = session.metadata?.mode || session.mode;
      const priceId = session.metadata?.priceId;
      const planType = (session.metadata?.planType as 'pro' | 'home') || 'pro';

      console.log(`Checkout completed - userId: ${userId}, mode: ${mode}, priceId: ${priceId}, planType: ${planType}`);

      if (!userId) {
        console.error('User-ID nicht gefunden');
        return res.status(400).json({ error: 'User-ID nicht gefunden' });
      }

      const stripeCustomerId = typeof session.customer === 'string'
        ? session.customer
        : session.customer?.id;

      if (mode === 'subscription') {
        await upgradeToSubscription(userId, planType, stripeCustomerId);

        // User-ID und planType in Subscription speichern für spätere Events
        if (session.subscription) {
          const subscriptionId = typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription.id;

          try {
            await stripe.subscriptions.update(subscriptionId, {
              metadata: { userId: userId, planType: planType },
            });
            console.log(`Updated subscription ${subscriptionId} with userId: ${userId}, planType: ${planType}`);
          } catch (err) {
            console.error('Error updating subscription metadata:', err);
          }
        }
      } else if (mode === 'payment' && priceId) {
        // HIER GREIFT DAS NEUE MAPPING
        const credits = CREDIT_PACKAGES[priceId];
        
        if (credits) {
          await addPurchasedCredits(userId, credits);
        } else {
          console.error(`Keine Credits für PriceID ${priceId} gefunden. Prüfe Environment Variables!`);
        }
      }
    }

    if (event.type === 'invoice.paid') {
      const invoice = event.data.object as Stripe.Invoice;

      if (invoice.subscription && invoice.billing_reason === 'subscription_cycle') {
        const subscriptionId = typeof invoice.subscription === 'string'
          ? invoice.subscription
          : invoice.subscription.id;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const userId = subscription.metadata?.userId;
        const planType = subscription.metadata?.planType as 'pro' | 'home' | undefined;

        if (userId) {
          await resetMonthlyCredits(userId, planType);
        }
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;

      console.log(`Subscription deleted - userId: ${userId}`);

      if (userId) {
        await downgradeToFree(userId);
      }
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: error.message || 'Webhook-Fehler' });
  }
}