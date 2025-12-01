import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from './Footer';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

interface ProductBoxProps {
  targetGroup: string;
  title: string;
  description: string;
  product: string;
  user: { email?: string; uid?: string } | null;
}

const ProductBox: React.FC<ProductBoxProps> = ({ targetGroup, title, description, product, user }) => {
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
      await addDoc(collection(db, 'product-feedback'), {
        product,
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

  if (isSubmitted) {
    return (
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg text-center h-full flex flex-col justify-center">
        <div className="w-16 h-16 bg-gradient-to-br from-[#E6C785] to-[#CDA35E] rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-[#532418] mb-2">Vielen Dank!</h3>
        <p className="text-[#67534F] mb-4">Ihr Feedback hilft uns sehr.</p>
        <button
          onClick={() => setIsSubmitted(false)}
          className="text-[#C8956C] hover:underline font-medium"
        >
          Weiteres Feedback geben
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <p className="text-sm text-[#67534F] mb-2">{targetGroup}</p>
        <span className="inline-block bg-[#E6C785]/20 text-[#8B6B4B] text-xs font-bold px-3 py-1 rounded-full mb-3">
          Coming Soon
        </span>
        <h3 className="text-xl sm:text-2xl font-bold text-[#532418] mb-2">{title}</h3>
        <p className="text-[#67534F]">{description}</p>
      </div>

      {/* Questions */}
      <div className="text-[#67534F] text-sm mb-4 space-y-1">
        <p>• Was ärgert Sie im Alltag am meisten?</p>
        <p>• Was wünschen Sie sich am meisten?</p>
        <p>• Was würde einen wirklich großen Unterschied in Ihrem Alltag bedeuten?</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-grow flex flex-col">
        <textarea
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          placeholder="Ihre Wünsche & Anregungen..."
          rows={4}
          className="w-full px-4 py-3 border-2 border-[#E6C785]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E6C785] focus:border-transparent transition-all resize-none text-[#532418] placeholder-[#67534F]/50 flex-grow mb-4"
        />

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm mb-4">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3 px-6 rounded-xl font-bold text-white transition-all ${
            isSubmitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#E6C785] via-[#CDA35E] to-[#B08642] hover:opacity-90 shadow-lg hover:shadow-xl'
          }`}
        >
          {isSubmitting ? 'Wird gesendet...' : 'Ich will dabei sein'}
        </button>
      </form>
    </div>
  );
};

const StoffberaterProPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#FAF1DC] flex flex-col font-sans">
      <main className="flex-grow">
        {/* Back Button + Hero */}
        <section className="bg-gradient-to-br from-[#532418] to-[#8B4513] text-white pt-4 pb-12 sm:pb-16 px-4">
          <div className="max-w-5xl mx-auto">
            {/* Back Button */}
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-8"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Zurück zur App</span>
            </button>

            {/* Hero Text */}
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                Die Zukunft der Raumgestaltung
              </h1>
              <p className="text-xl sm:text-2xl text-[#E6C785] font-medium">
                Wir entwickeln Werkzeuge für Profis. Gestalten Sie mit.
              </p>
            </div>
          </div>
        </section>

        {/* Two Product Boxes */}
        <section className="py-12 sm:py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {/* Stoffberater Pro */}
              <ProductBox
                targetGroup="Für Raumausstatter"
                title="Ihr persönlicher Stoffberater"
                description="Halten Sie Ihr Handy in den Raum – Stoffanprobe sieht, was Sie sehen. Und berät Sie in Echtzeit."
                product="stoffberater-pro"
                user={user}
              />

              {/* Innenarchitektin Pro */}
              <ProductBox
                targetGroup="Für Interior Designer"
                title="Ihre persönliche Innenarchitektin"
                description="Aus Ihrem Foto wird eine professionelle technische Zeichnung – wie vom Profi."
                product="innenarchitektin-pro"
                user={user}
              />
            </div>
          </div>
        </section>

        {/* Upselling Section */}
        <section className="py-12 sm:py-16 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#532418] text-center mb-3">
              Warum Stoffanprobe?
            </h2>
            <p className="text-lg sm:text-xl text-[#C8956C] text-center italic mb-10">
              Du siehst es. Du fühlst es.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Stoffberater Comparison */}
              <div className="bg-[#FAF1DC] rounded-2xl p-6 sm:p-8">
                <h3 className="text-lg font-bold text-[#532418] mb-6 text-center">Stoffberater Pro</h3>
                <div className="space-y-4">
                  {/* Without */}
                  <div className="bg-white rounded-xl p-4 border-2 border-red-200">
                    <p className="text-sm text-red-600 font-medium mb-2">Beratung ohne Stoffanprobe</p>
                    <p className="text-[#67534F] mb-2">Kunde unsicher → wählt Beige</p>
                    <p className="text-2xl font-bold text-red-600">160€</p>
                  </div>
                  {/* With */}
                  <div className="bg-white rounded-xl p-4 border-2 border-green-200">
                    <p className="text-sm text-green-600 font-medium mb-2">Beratung mit Stoffanprobe</p>
                    <p className="text-[#67534F] mb-2">Kunde SIEHT den Burgundy-Samt in SEINEM Raum</p>
                    <p className="text-2xl font-bold text-green-600">1.280€</p>
                  </div>
                </div>
              </div>

              {/* Innenarchitektin Comparison */}
              <div className="bg-[#FAF1DC] rounded-2xl p-6 sm:p-8">
                <h3 className="text-lg font-bold text-[#532418] mb-6 text-center">Innenarchitektin Pro</h3>
                <div className="space-y-4">
                  {/* Without */}
                  <div className="bg-white rounded-xl p-4 border-2 border-red-200">
                    <p className="text-sm text-red-600 font-medium mb-2">Ohne Stoffanprobe</p>
                    <p className="text-[#67534F] mb-2">"Nur mal schauen"</p>
                    <p className="text-2xl font-bold text-red-600">0€</p>
                  </div>
                  {/* With */}
                  <div className="bg-white rounded-xl p-4 border-2 border-green-200">
                    <p className="text-sm text-green-600 font-medium mb-2">Mit Stoffanprobe</p>
                    <p className="text-[#67534F] mb-2">Komplettauftrag</p>
                    <p className="text-2xl font-bold text-green-600">5.000€+</p>
                  </div>
                </div>
              </div>
            </div>
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
