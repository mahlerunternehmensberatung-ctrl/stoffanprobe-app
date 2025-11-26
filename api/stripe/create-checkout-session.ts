import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

// Stripe initialisieren
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-11-17.clover',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { priceId, userId, mode } = req.body;

    if (!priceId || !userId || !mode) {
      return res.status(400).json({ error: 'priceId, userId und mode sind erforderlich.' });
    }

    if (!['subscription', 'payment'].includes(mode)) {
      return res.status(400).json({ error: 'mode muss "subscription" oder "payment" sein.' });
    }

    // Base URL aus Environment Variable oder Default
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.NEXT_PUBLIC_BASE_URL || 'https://stoffanprobe.de';

    // Stripe Checkout Session erstellen
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: mode as 'subscription' | 'payment',
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
      client_reference_id: userId, // User-ID für Webhook
      metadata: {
        userId: userId,
        priceId: priceId,
        mode: mode,
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ error: error.message || 'Fehler beim Erstellen der Checkout-Session' });
  }
}
