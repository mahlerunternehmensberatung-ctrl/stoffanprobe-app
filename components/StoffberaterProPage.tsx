import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

const StoffberaterProPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Form state
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!feedbackText.trim()) {
      setError('Bitte geben Sie Ihr Feedback ein.');
      return;
    }

    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'stoffberater-feedback'), {
        message: feedbackText.trim(),
        email: user?.email || null,
        userId: user?.uid || null,
        timestamp: serverTimestamp(),
      });

      setIsSubmitted(true);
      setFeedbackText('');
    } catch (err) {
      console.error('Feedback submission error:', err);
      setError('Fehler beim Absenden. Bitte versuchen Sie es erneut.');
    } finally {
      setIsSubmitting(false);
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

      <main className="flex-grow">
        {/* Back Button */}
        <div className="bg-gradient-to-br from-[#532418] to-[#8B4513] pt-4 px-4">
          <div className="max-w-3xl mx-auto">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Zurück zur App</span>
            </button>
          </div>
        </div>

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#532418] to-[#8B4513] text-white py-12 sm:py-20 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Stoffberater Pro
            </h1>
            <p className="text-xl sm:text-2xl text-[#E6C785] font-medium mb-8">
              Ihr persönlicher Berater – live an Ihrer Seite
            </p>
            <div className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto space-y-4">
              <p>
                Stellen Sie sich vor: Sie halten Ihr Handy in den Raum, und Ihr Stoffberater sieht, was Sie sehen. Licht, Farben, Stil – und berät Sie in Echtzeit.
              </p>
              <p className="text-[#E6C785]">
                Wir bauen das gerade. Und Sie können mitgestalten.
              </p>
            </div>
          </div>
        </section>

        {/* Feedback Section */}
        <section className="py-12 sm:py-16 px-4">
          <div className="max-w-2xl mx-auto">
            {isSubmitted ? (
              /* Success State */
              <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-lg text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#E6C785] to-[#CDA35E] rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#532418] mb-4">
                  Vielen Dank!
                </h2>
                <p className="text-[#67534F] text-lg mb-8">
                  Ihr Feedback hilft uns, den Stoffberater Pro genau richtig zu bauen.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="px-6 py-3 border-2 border-[#E6C785] text-[#532418] font-semibold rounded-xl hover:bg-[#E6C785]/10 transition-all"
                  >
                    Weiteres Feedback geben
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="px-6 py-3 bg-gradient-to-r from-[#E6C785] via-[#CDA35E] to-[#B08642] text-white font-semibold rounded-xl hover:opacity-90 transition-all shadow-md"
                  >
                    Zurück zur App
                  </button>
                </div>
              </div>
            ) : (
              /* Feedback Form */
              <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-lg">
                <h2 className="text-2xl sm:text-3xl font-bold text-[#532418] text-center mb-8">
                  Gestalten Sie mit
                </h2>

                <div className="text-[#67534F] text-lg mb-6 space-y-2">
                  <p>Was würde Ihnen den Alltag erleichtern?</p>
                  <p>Was wünschen Sie sich?</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Wünsche & Anregungen..."
                    rows={6}
                    className="w-full px-4 py-4 border-2 border-[#E6C785]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E6C785] focus:border-transparent transition-all resize-none text-[#532418] placeholder-[#67534F]/50"
                  />

                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-4 px-6 rounded-xl font-bold text-white transition-all ${
                      isSubmitting
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-[#E6C785] via-[#CDA35E] to-[#B08642] hover:opacity-90 shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {isSubmitting ? 'Wird gesendet...' : 'Feedback absenden'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer
        onOpenCookieSettings={() => {}}
      />
    </div>
  );
};

export default StoffberaterProPage;
