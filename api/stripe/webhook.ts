import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { adminDb } from '../../lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

// Stripe initialisieren
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-11-17.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

// Konstanten
const MONTHLY_PRO_CREDITS = 40;

// Mapping von Price IDs zu Credit-Anzahl
// WICHTIG: Diese Environment Variables müssen in Vercel gesetzt sein:
// - STRIPE_PRICE_10_CREDITS
// - STRIPE_PRICE_20_CREDITS
// - STRIPE_PRICE_50_CREDITS
// - STRIPE_PRICE_100_CREDITS
// - STRIPE_PRICE_200_CREDITS
// - STRIPE_PRICE_500_CREDITS
// Diese sind NICHT die VITE_* Variablen, sondern separate Backend-Variablen!
const CREDIT_PACKAGES: Record<string, number> = {
  [process.env.STRIPE_PRICE_10_CREDITS || '']: 10,
  [process.env.STRIPE_PRICE_20_CREDITS || '']: 20,
  [process.env.STRIPE_PRICE_50_CREDITS || '']: 50,
  [process.env.STRIPE_PRICE_100_CREDITS || '']: 100,
  [process.env.STRIPE_PRICE_200_CREDITS || '']: 200,
  [process.env.STRIPE_PRICE_500_CREDITS || '']: 500,
};

// Warnung wenn CREDIT_PACKAGES leer ist (Environment Variables fehlen)
if (Object.keys(CREDIT_PACKAGES).every(key => key === '')) {
  console.warn('⚠️ WARNUNG: CREDIT_PACKAGES ist leer! Environment Variables STRIPE_PRICE_*_CREDITS fehlen in Vercel!');
}

/**
 * Upgrade User zu Pro-Plan
 */
async function upgradeToPro(uid: string, stripeCustomerId?: string): Promise<void> {
  const userRef = adminDb.collection('users').doc(uid);
  
  const updateData: Record<string, any> = {
    plan: 'pro',
    monthlyCredits: MONTHLY_PRO_CREDITS,
    credits: 9999, // Legacy
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (stripeCustomerId) {
    updateData.stripeCustomerId = stripeCustomerId;
  }

  await userRef.update(updateData);
  console.log(`User ${uid} upgraded to Pro`);
}

/**
 * Füge gekaufte Credits hinzu
 */
async function addPurchasedCredits(uid: string, credits: number): Promise<void> {
  const userRef = adminDb.collection('users').doc(uid);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    throw new Error(`User ${uid} not found`);
  }

  const userData = userSnap.data()!;
  const currentPurchasedCredits = userData.purchasedCredits ?? 0;
  
  // Ablaufdatum: 12 Monate
  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + 12);

  await userRef.update({
    purchasedCredits: currentPurchasedCredits + credits,
    purchasedCreditsExpiry: expiryDate,
    credits: (userData.monthlyCredits ?? 0) + currentPurchasedCredits + credits, // Legacy
    updatedAt: FieldValue.serverTimestamp(),
  });

  console.log(`Added ${credits} credits to user ${uid}`);
}

/**
 * Setze monatliche Credits zurück (bei Abo-Verlängerung)
 */
async function resetMonthlyCredits(uid: string): Promise<void> {
  const userRef = adminDb.collection('users').doc(uid);
  
  await userRef.update({
    monthlyCredits: MONTHLY_PRO_CREDITS,
    updatedAt: FieldValue.serverTimestamp(),
  });

  console.log(`Reset monthly credits for user ${uid}`);
}

// Helper: Raw body lesen
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
    // Raw body für Signaturprüfung
    const rawBody = await getRawBody(req);
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      console.error('Missing stripe-signature header');
      return res.status(400).json({ error: 'Stripe-Signatur fehlt' });
    }

    // Event verifizieren
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    console.log(`Received event: ${event.type}`);

    // checkout.session.completed Event behandeln
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      const userId = session.metadata?.userId || session.client_reference_id;
      const mode = session.metadata?.mode || session.mode;
      const priceId = session.metadata?.priceId;
      
      console.log(`Checkout completed - userId: ${userId}, mode: ${mode}, priceId: ${priceId}`);

      if (!userId) {
        console.error('User-ID nicht in Session gefunden');
        return res.status(400).json({ error: 'User-ID nicht gefunden' });
      }

      try {
        const stripeCustomerId = typeof session.customer === 'string' 
          ? session.customer 
          : session.customer?.id;

        if (mode === 'subscription') {
          // Abo: User auf Pro-Plan upgraden
          await upgradeToPro(userId, stripeCustomerId);
          console.log(`User ${userId} erfolgreich auf Pro-Plan upgegradet`);
        } else if (mode === 'payment' && priceId) {
          // Credit-Paket: Credits hinzufügen
          const credits = CREDIT_PACKAGES[priceId];
          if (credits) {
            await addPurchasedCredits(userId, credits);
            console.log(`User ${userId} hat ${credits} Credits erhalten`);
          } else {
            console.error(`❌ Unbekannte Price ID: ${priceId}`);
            console.error(`Verfügbare Price IDs: ${Object.keys(CREDIT_PACKAGES).filter(k => k).join(', ') || 'KEINE (Environment Variables fehlen!)'}`);
            console.error(`⚠️ Prüfe ob STRIPE_PRICE_*_CREDITS in Vercel Environment Variables gesetzt sind!`);
          }
        }
      } catch (error: any) {
        console.error('Error processing checkout:', error);
        return res.status(500).json({ error: 'Fehler beim Verarbeiten der Zahlung' });
      }
    }

    // invoice.paid Event behandeln (Abo-Verlängerung)
    if (event.type === 'invoice.paid') {
      const invoice = event.data.object as Stripe.Invoice;
      
      // Prüfe ob es eine Subscription-Rechnung ist (nicht die erste)
      if (invoice.subscription && invoice.billing_reason === 'subscription_cycle') {
        const subscriptionId = typeof invoice.subscription === 'string' 
          ? invoice.subscription 
          : invoice.subscription.id;
        
        try {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const userId = subscription.metadata?.userId;
          
          if (userId) {
            await resetMonthlyCredits(userId);
            console.log(`Monatliche Credits für User ${userId} zurückgesetzt`);
          } else {
            console.warn(`Keine User-ID für Subscription ${subscriptionId} gefunden`);
          }
        } catch (error: any) {
          console.error('Error processing invoice.paid:', error);
        }
      }
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: error.message || 'Webhook-Fehler' });
  }
}
