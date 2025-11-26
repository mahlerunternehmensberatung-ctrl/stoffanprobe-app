import Stripe from 'stripe';

// Stripe initialisieren
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { priceId, userId, mode } = body;

    if (!priceId || !userId || !mode) {
      return new Response(
        JSON.stringify({ error: 'priceId, userId und mode sind erforderlich.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!['subscription', 'payment'].includes(mode)) {
      return new Response(
        JSON.stringify({ error: 'mode muss "subscription" oder "payment" sein.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
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

    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Fehler beim Erstellen der Checkout-Session' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

