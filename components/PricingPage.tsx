import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { glassButton } from '../glass';

const PricingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  // Environment Variables für Price IDs
  const PRICE_ABO = import.meta.env.VITE_STRIPE_PRICE_ABO || '';
  const PRICE_10 = import.meta.env.VITE_STRIPE_PRICE_10_CREDITS || '';
  const PRICE_20 = import.meta.env.VITE_STRIPE_PRICE_20_CREDITS || '';
  const PRICE_50 = import.meta.env.VITE_STRIPE_PRICE_50_CREDITS || '';
  const PRICE_100 = import.meta.env.VITE_STRIPE_PRICE_100_CREDITS || '';
  const PRICE_200 = import.meta.env.VITE_STRIPE_PRICE_200_CREDITS || '';
  const PRICE_500 = import.meta.env.VITE_STRIPE_PRICE_500_CREDITS || '';

  const creditPackages = [
    { credits: 10, priceId: PRICE_10, price: '5,00' },
    { credits: 20, priceId: PRICE_20, price: '10,00' },
    { credits: 50, priceId: PRICE_50, price: '25,00' },
    { credits: 100, priceId: PRICE_100, price: '50,00' },
    { credits: 200, priceId: PRICE_200, price: '100,00' },
    { credits: 500, priceId: PRICE_500, price: '250,00' },
  ];

  const handleCheckout = async (priceId: string, mode: 'subscription' | 'payment') => {
    if (!user) {
      navigate('/');
      return;
    }

    setIsLoading(priceId);

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          userId: user.uid,
          mode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Erstellen der Checkout-Session');
      }

      // Weiterleitung zu Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      alert(error.message || 'Fehler beim Erstellen der Checkout-Session');
      setIsLoading(null);
    }
  };

  // Berechne verfügbare Credits
  const getTotalCredits = () => {
    if (!user) return 0;
    if (user.plan === 'pro') return '∞';
    
    const now = new Date();
    let purchasedCredits = user.purchasedCredits ?? 0;
    if (user.purchasedCreditsExpiry && user.purchasedCreditsExpiry < now) {
      purchasedCredits = 0;
    }
    
    const monthlyCredits = user.monthlyCredits ?? 0;
    return monthlyCredits + purchasedCredits;
  };

  return (
    <div className="min-h-screen bg-[#FAF1DC] flex flex-col">
      <Header 
        onNewSession={() => navigate('/')}
        onShowSessions={() => navigate('/')}
        onSaveSession={() => navigate('/')}
        hasSession={false}
        user={user}
        onLogin={() => navigate('/')}
        onShowPaywall={() => {}}
      />
      
      <main className="flex-grow container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#532418] text-center mb-8">
            Preise & Credits
          </h1>

          {/* Aktueller Status */}
          {user && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-[#532418] mb-4">Ihr aktueller Status</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Plan</p>
                  <p className="text-lg font-bold text-[#532418]">
                    {user.plan === 'pro' ? 'Pro-Abo' : 'Kostenlos'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Verfügbare Credits</p>
                  <p className="text-lg font-bold text-[#532418]">{getTotalCredits()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Monatliche Credits</p>
                  <p className="text-lg font-bold text-[#532418]">{user.monthlyCredits ?? 0}</p>
                </div>
              </div>
            </div>
          )}

          {/* Abo-Box */}
          <div className="bg-gradient-to-br from-[#FF954F] to-[#CC5200] rounded-lg shadow-xl p-8 mb-12 text-white">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">Stoffanprobe Abo</h2>
              <p className="text-xl mb-4">19,90€/Monat</p>
              <p className="text-lg mb-6">40 Bilder pro Monat</p>
              <button
                onClick={() => handleCheckout(PRICE_ABO, 'subscription')}
                disabled={isLoading !== null || !user || user.plan === 'pro'}
                className="px-8 py-3 bg-white text-[#FF954F] rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isLoading === PRICE_ABO ? 'Wird geladen...' : user?.plan === 'pro' ? 'Bereits aktiv' : 'Jetzt abonnieren'}
              </button>
            </div>
          </div>

          {/* Credit-Pakete */}
          <div>
            <h2 className="text-2xl font-bold text-[#532418] text-center mb-6">
              Credit-Pakete kaufen
            </h2>
            <p className="text-center text-gray-600 mb-8">
              Credits sind 12 Monate gültig
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {creditPackages.map((pkg) => (
                <div
                  key={pkg.credits}
                  className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
                >
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-[#532418] mb-2">
                      {pkg.credits} Credits
                    </h3>
                    <p className="text-3xl font-bold text-[#FF954F] mb-4">
                      {pkg.price}€
                    </p>
                    <button
                      onClick={() => handleCheckout(pkg.priceId, 'payment')}
                      disabled={isLoading !== null || !user || !pkg.priceId}
                      className={`${glassButton} w-full py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isLoading === pkg.priceId ? 'Wird geladen...' : 'Kaufen'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {!user && (
            <div className="text-center mt-8">
              <p className="text-gray-600 mb-4">Bitte melden Sie sich an, um Credits zu kaufen.</p>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-2 bg-[#FF954F] text-white rounded-lg font-semibold hover:bg-[#CC5200] transition-colors"
              >
                Zur Anmeldung
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer
        onOpenImpressum={() => {}}
        onOpenDatenschutz={() => {}}
        onOpenAgb={() => {}}
        onOpenCookieSettings={() => {}}
      />
    </div>
  );
};

export default PricingPage;

