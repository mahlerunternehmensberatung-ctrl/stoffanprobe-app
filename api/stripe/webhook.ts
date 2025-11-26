import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { upgradeToPro, addPurchasedCredits, resetMonthlyCredits } from '../../services/userService';

// Stripe initialisieren
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-11-17.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Für Stripe Webhooks brauchen wir den raw body als String
    // Vercel stellt den raw body als String bereit, wenn Content-Type application/json ist
    // Falls req.body bereits ein Objekt ist, müssen wir es zurück zu String konvertieren
    let body: string;
    if (typeof req.body === 'string') {
      body = req.body;
    } else if (Buffer.isBuffer(req.body)) {
      body = req.body.toString('utf8');
    } else {
      // Fallback: Wenn body bereits geparst wurde, müssen wir es zurück zu String konvertieren
      // Das sollte bei Stripe Webhooks nicht passieren, da Stripe den raw body sendet
      body = JSON.stringify(req.body);
    }
    
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      return res.status(400).json({ error: 'Stripe-Signatur fehlt' });
    }

    // Event verifizieren
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    // checkout.session.completed Event behandeln
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      const userId = session.metadata?.userId || session.client_reference_id;
      const mode = session.metadata?.mode || session.mode;
      const priceId = session.metadata?.priceId;
      
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
      
      // Prüfe ob es eine Subscription-Rechnung ist
      if (invoice.subscription) {
        const subscriptionId = typeof invoice.subscription === 'string' 
          ? invoice.subscription 
          : invoice.subscription.id;
        
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        
        // Hole customer und dann user data
        const customerId = typeof subscription.customer === 'string' 
          ? subscription.customer 
          : subscription.customer?.id;
        
        if (customerId) {
          // Versuche userId aus subscription metadata oder customer metadata zu holen
          const userId = subscription.metadata?.userId || 
                        subscription.metadata?.client_reference_id ||
                        invoice.metadata?.userId;
          
          if (userId) {
            try {
              await resetMonthlyCredits(userId);
              console.log(`Monatliche Credits für User ${userId} zurückgesetzt`);
            } catch (error: any) {
              console.error('Error resetting monthly credits:', error);
            }
          } else {
            console.warn(`Keine User-ID für Subscription ${subscriptionId} gefunden`);
          }
        }
      }
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: error.message || 'Webhook-Fehler' });
  }
}
