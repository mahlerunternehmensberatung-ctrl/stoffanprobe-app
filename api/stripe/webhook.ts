import Stripe from 'stripe';
import { upgradeToPro, addPurchasedCredits, resetMonthlyCredits } from '../../services/userService';

// Stripe initialisieren
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

// Mapping von Price IDs zu Credit-Anzahl
const CREDIT_PACKAGES: Record<string, number> = {
  [process.env.STRIPE_PRICE_10_CREDITS || '']: 10,
  [process.env.STRIPE_PRICE_20_CREDITS || '']: 20,
  [process.env.STRIPE_PRICE_50_CREDITS || '']: 50,
  [process.env.STRIPE_PRICE_100_CREDITS || '']: 100,
  [process.env.STRIPE_PRICE_200_CREDITS || '']: 200,
  [process.env.STRIPE_PRICE_500_CREDITS || '']: 500,
};

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'Stripe-Signatur fehlt' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Event verifizieren
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return new Response(
        JSON.stringify({ error: `Webhook Error: ${err.message}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // checkout.session.completed Event behandeln
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      const userId = session.metadata?.userId || session.client_reference_id;
      const mode = session.metadata?.mode || session.mode;
      const priceId = session.metadata?.priceId;
      
      if (!userId) {
        console.error('User-ID nicht in Session gefunden');
        return new Response(
          JSON.stringify({ error: 'User-ID nicht gefunden' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
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
            console.error(`Unbekannte Price ID: ${priceId}`);
          }
        }
      } catch (error: any) {
        console.error('Error processing checkout:', error);
        return new Response(
          JSON.stringify({ error: 'Fehler beim Verarbeiten der Zahlung' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
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

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Webhook-Fehler' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

