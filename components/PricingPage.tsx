import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { useAuth } from '../context/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import PaywallModal from './PaywallModal';

// Gold-Styles (wie gewünscht)
const goldGradient = "bg-gradient-to-br from-[#E6C785] via-[#CDA35E] to-[#B08642]";
const goldTextGradient = "bg-clip-text text-transparent bg-gradient-to-br from-[#B08642] to-[#8C6A30]";

// Die Pakete mit den NEUEN Variablennamen aus deinem Screenshot
const creditPackages = [
  { 
    credits: 10, 
    price: '4,90€', 
    id: import.meta.env.VITE_STRIPE_PRICE_10_CREDITS,
    description: "Einsteiger-Paket: Ideal zum Testen"
  },
  { 
    credits: 20, 
    price: '9,90€', 
    id: import.meta.env.VITE_STRIPE_PRICE_20_CREDITS,
    description: "Basic-Paket: Für kleine Projekte"
  },
  { 
    credits: 40, 
    price: '19,90€', 
    id: import.meta.env.VITE_STRIPE_PRICE_40_CREDITS, // Angepasst auf 40
    description: "Standard-Paket: Unsere Empfehlung"
  },
  { 
    credits: 100, 
    price: '49,00€', 
    id: import.meta.env.VITE_STRIPE_PRICE_100_CREDITS,
    description: "Plus-Paket: Für regelmäßige Nutzung"
  },
  { 
    credits: 200, 
    price: '99,00€', 
    id: import.meta.env.VITE_STRIPE_PRICE_200_CREDITS,
    description: "Pro-Paket: Für hohe Anforderungen"
  },
  { 
    credits: 400, 
    price: '199,00€', 
    id: import.meta.env.VITE_STRIPE_PRICE_400_CREDITS, // Angepasst auf 400
    description: "Max-Paket: Maximaler Vorrat ohne Abo"
  },
];

const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  // Prüfe ob User ein aktives Abo hat
  const hasActiveSubscription = user?.plan === 'pro' || user?.plan === 'home';

  const handlePurchase = async (priceId: string) => {
    if (!user) {
      navigate('/');
      return;
    }

    // Ohne Abo keine Credits kaufen
    if (!hasActiveSubscription) {
      setShowPaywall(true);
      return;
    }

    if (!priceId) {
        setError("Preis-ID nicht gefunden. Bitte prüfen Sie die Konfiguration.");
        return;
    }

    setLoadingId(priceId);
    setError(null);

    try {
      const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
      if (!stripe) throw new Error('Stripe konnte nicht geladen werden');

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          userId: user.uid,
          customerEmail: user.email,
          mode: 'payment',
        }),
      });

      const { sessionId, error: apiError } = await response.json();
      if (apiError) throw new Error(apiError);

      const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });
      if (stripeError) throw stripeError;

    } catch (err: any) {
      console.error('Purchase error:', err);
      setError('Fehler beim Starten des Bezahlvorgangs.');
      setLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF1DC] flex flex-col font-sans">
      <Header 
        onNewSession={() => navigate('/')} 
        onShowSessions={() => navigate('/')} 
        onSaveSession={() => navigate('/')} 
        hasSession={false}
        user={user}
        onLogin={() => navigate('/')}
        onShowPaywall={() => {}}
      />

      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Zurück-Button */}
          <button
            onClick={() => navigate('/')}
            className="mb-6 flex items-center gap-2 text-[#67534F] hover:text-[#532418] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Zurück zum Editor
          </button>

          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#532418] mb-4">
              Credit-Pakete kaufen
            </h1>
          <p className="text-[#67534F] text-lg mb-8 max-w-2xl mx-auto">
            Volle Flexibilität. Credits sind 12 Monate gültig.
          </p>

          {/* Hinweis wenn kein aktives Abo */}
          {!hasActiveSubscription && (
            <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl max-w-xl mx-auto">
              <p className="text-amber-800 font-medium mb-3">
                Credits können nur mit einem aktiven Abo erworben werden.
              </p>
              <button
                onClick={() => setShowPaywall(true)}
                className={`px-6 py-2 rounded-full font-bold text-white shadow-md transition-all ${goldGradient} hover:opacity-90`}
              >
                Abo abschließen
              </button>
            </div>
          )}

          {error && (
            <div className="mb-8 p-4 bg-red-100 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {creditPackages.map((pkg) => (
              <div 
                key={pkg.credits}
                className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-8 border border-[#E6C785]/30 flex flex-col items-center relative"
              >
                <div className="text-center mb-6 w-full">
                  <h3 className="text-2xl font-bold text-[#532418] mb-1">{pkg.credits} Credits</h3>
                  <p className="text-sm text-[#8C6A30] mb-4 h-5">{pkg.description}</p>
                  
                  <div className={`text-4xl font-extrabold ${goldTextGradient}`}>
                    {pkg.price}
                  </div>
                </div>

                <button
                  onClick={() => pkg.id && handlePurchase(pkg.id)}
                  disabled={!!loadingId || !pkg.id || !hasActiveSubscription}
                  className={`w-full py-3 px-6 rounded-full font-bold text-white shadow-md transition-all ${
                    !hasActiveSubscription
                      ? 'bg-gray-300 cursor-not-allowed'
                      : loadingId === pkg.id
                        ? 'bg-gray-400 cursor-not-allowed'
                        : `${goldGradient} hover:opacity-90 transform active:scale-95 hover:shadow-lg`
                  }`}
                >
                  {loadingId === pkg.id ? 'Lädt...' : 'Jetzt aufladen'}
                </button>
              </div>
            ))}
          </div>
          
          <div className="mt-12 text-sm text-[#67534F]/70">
            Alle Preise inkl. gesetzlicher MwSt. Sichere Zahlung via Stripe.
          </div>
          </div>
        </div>
      </main>

      <Footer
        onOpenImpressum={() => {}}
        onOpenDatenschutz={() => {}}
        onOpenAgb={() => {}}
        onOpenCookieSettings={() => {}}
      />

      {showPaywall && (
        <PaywallModal
          onClose={() => setShowPaywall(false)}
          user={user}
        />
      )}
    </div>
  );
};

export default PricingPage;