import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-11-17.clover', // Oder deine aktuelle Version
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { priceId, userId, customerEmail, mode = 'subscription', planType } = req.body;

    if (!priceId || !userId) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    // Basis-Konfiguration für die Session
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card', 'paypal', 'sofort', 'sepa_debit'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: mode as Stripe.Checkout.SessionCreateParams.Mode,
      success_url: `${req.headers.origin}/profile?success=true`,
      cancel_url: `${req.headers.origin}/pricing?canceled=true`,
      customer_email: customerEmail,
      client_reference_id: userId,
      metadata: {
        userId,
        mode,
        priceId,
        planType: planType || 'pro', // 'pro' oder 'home'
      },
      // WICHTIG: Das hier aktiviert das Gutschein-Feld im Checkout!
      allow_promotion_codes: true,
    };

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return res.status(200).json({ sessionId: session.id });
  } catch (error: any) {
    console.error('Stripe Error:', error);
    return res.status(500).json({ error: error.message });
  }
}