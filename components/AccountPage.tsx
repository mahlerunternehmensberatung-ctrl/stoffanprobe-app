import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from './Header';
import Footer from './Footer';

const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [subscriptionInfo, setSubscriptionInfo] = useState<{
    nextBillingDate?: Date;
    status?: string;
  } | null>(null);

  useEffect(() => {
    // TODO: Hole Subscription-Info von Stripe API
    // Für jetzt: Placeholder
    if (user?.plan === 'pro' && user?.stripeCustomerId) {
      // In Zukunft: API Call zu /api/stripe/get-subscription
      // const response = await fetch(`/api/stripe/get-subscription?customerId=${user.stripeCustomerId}`);
      // const data = await response.json();
      // setSubscriptionInfo({ nextBillingDate: new Date(data.current_period_end * 1000), status: data.status });
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF1DC] flex items-center justify-center">
        <div className="text-[#532418]">Wird geladen...</div>
      </div>
    );
  }

  if (!user) {
    navigate('/');
    return null;
  }

  const getPlanDisplay = () => {
    if (user.plan === 'pro') {
      return 'Pro-Abo (19,90€/Monat)';
    }
    return 'Kostenlos';
  };

  const getTotalCredits = () => {
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
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#532418] mb-8">
            Mein Konto
          </h1>

          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-[#532418] mb-4">Kontoinformationen</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="text-lg font-semibold text-[#532418]">
                  {user.firstName} {user.lastName}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">E-Mail</p>
                <p className="text-lg font-semibold text-[#532418]">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-[#532418] mb-4">Ihr Plan</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Aktueller Plan</p>
                <p className="text-2xl font-bold text-[#532418]">{getPlanDisplay()}</p>
              </div>
              
              {user.plan === 'pro' && (
                <>
                  {subscriptionInfo?.nextBillingDate ? (
                    <div>
                      <p className="text-sm text-gray-600">Nächste Verlängerung</p>
                      <p className="text-lg font-semibold text-[#532418]">
                        {subscriptionInfo.nextBillingDate.toLocaleDateString('de-DE', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-600">Abo-Status</p>
                      <p className="text-lg font-semibold text-[#532418]">Aktiv</p>
                    </div>
                  )}
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
                      onClick={() => {
                        // TODO: Implementiere Abo-Kündigung
                        alert('Abo-Kündigung wird in Kürze verfügbar sein.');
                      }}
                    >
                      Abo kündigen
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-[#532418] mb-4">Credits</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Verfügbare Credits</p>
                <p className="text-2xl font-bold text-[#532418]">{getTotalCredits()}</p>
              </div>
              {user.plan !== 'pro' && (
                <>
                  <div>
                    <p className="text-sm text-gray-600">Monatliche Credits</p>
                    <p className="text-lg font-semibold text-[#532418]">{user.monthlyCredits ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Gekaufte Credits</p>
                    <p className="text-lg font-semibold text-[#532418]">{user.purchasedCredits ?? 0}</p>
                    {user.purchasedCreditsExpiry && (
                      <p className="text-xs text-gray-500 mt-1">
                        Gültig bis: {user.purchasedCreditsExpiry.toLocaleDateString('de-DE')}
                      </p>
                    )}
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={() => navigate('/pricing')}
                      className="px-6 py-3 bg-[#FF954F] text-white rounded-lg font-semibold hover:bg-[#CC5200] transition-colors"
                    >
                      Credits kaufen
                    </button>
                  </div>
                </>
              )}
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
    </div>
  );
};

export default AccountPage;

