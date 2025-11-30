import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from './Header';
import Footer from './Footer';
import LegalModal from './LegalModal';
import { impressumContent, datenschutzContent, agbContent, avvContent } from '../legalTexts';
import { useAuth } from '../context/AuthContext';
import {
  submitStoffberaterFeedback,
  hasUserSubmittedFeedback,
  StoffberaterInterests,
} from '../services/stoffberaterWaitlistService';

const StoffberaterProPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();

  // Form state
  const [email, setEmail] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [interests, setInterests] = useState<StoffberaterInterests>({
    stofferkennung: false,
    verhaltensprofile: false,
    toleranzen: false,
    pdfExport: false,
    bestPractice: false,
  });

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [creditsGranted, setCreditsGranted] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Legal modals
  const [showImpressum, setShowImpressum] = useState(false);
  const [showDatenschutz, setShowDatenschutz] = useState(false);
  const [showAgb, setShowAgb] = useState(false);
  const [showAvv, setShowAvv] = useState(false);

  // Pre-fill email if user is logged in
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  // Check if user already submitted feedback
  useEffect(() => {
    const checkSubmission = async () => {
      const hasSubmitted = await hasUserSubmittedFeedback(user?.uid, user?.email);
      if (hasSubmitted) {
        setAlreadySubmitted(true);
      }
    };
    checkSubmission();
  }, [user]);

  const handleInterestChange = (key: keyof StoffberaterInterests) => {
    setInterests((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!email) {
      setError(t('stoffberater.errors.emailRequired'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t('stoffberater.errors.emailInvalid'));
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitStoffberaterFeedback(
        email,
        feedbackText,
        interests,
        user?.uid
      );

      setIsSubmitted(true);
      setCreditsGranted(result.creditsGranted);

      if (result.creditsGranted) {
        // Refresh user data to show updated credits
        refreshUser();
      }
    } catch (err) {
      setError(t('stoffberater.errors.submitFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPro = user?.plan === 'pro';
  const isHome = user?.plan === 'home';

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
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#532418] to-[#8B4513] text-white py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-block bg-[#E6C785] text-[#532418] text-sm font-bold px-4 py-1 rounded-full mb-6">
              {t('stoffberater.badge')}
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
              {t('stoffberater.heroTitle')}
            </h1>
            <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto">
              {t('stoffberater.heroSubtitle')}
            </p>
          </div>
        </section>

        {/* Problem Section */}
        <section className="py-12 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#532418] text-center mb-10">
              {t('stoffberater.problemTitle')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {['problem1', 'problem2', 'problem3', 'problem4'].map((key, idx) => (
                <div
                  key={key}
                  className="flex items-start gap-4 p-4 bg-red-50 rounded-xl border border-red-100"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    {idx === 0 && (
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    )}
                    {idx === 1 && (
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                      </svg>
                    )}
                    {idx === 2 && (
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {idx === 3 && (
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                  </div>
                  <p className="text-[#67534F]">{t(`stoffberater.${key}`)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Solution Section */}
        <section className="py-12 px-4 bg-[#FAF1DC]">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#532418] text-center mb-10">
              {t('stoffberater.solutionTitle')}
            </h2>
            <div className="space-y-6">
              {[
                { key: 'solution1', icon: '📷' },
                { key: 'solution2', icon: '📊' },
                { key: 'solution3', icon: '📏' },
                { key: 'solution4', icon: '📄' },
                { key: 'solution5', icon: '💡' },
              ].map((item, idx) => (
                <div
                  key={item.key}
                  className="flex items-start gap-4 p-5 bg-white rounded-xl shadow-sm border border-[#E6C785]/30"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#E6C785] to-[#CDA35E] rounded-full flex items-center justify-center text-2xl">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#532418] mb-1">
                      {t(`stoffberater.${item.key}Title`)}
                    </h3>
                    <p className="text-[#67534F]">{t(`stoffberater.${item.key}Desc`)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* User Type Section */}
        <section className="py-12 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Home Users */}
              <div className={`p-6 rounded-2xl border-2 ${isHome ? 'border-[#E6C785] bg-[#FAF1DC]' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">🏠</span>
                  <h3 className="text-xl font-bold text-[#532418]">{t('stoffberater.forHomeTitle')}</h3>
                </div>
                <p className="text-[#67534F]">{t('stoffberater.forHomeDesc')}</p>
              </div>

              {/* Pro Users */}
              <div className={`p-6 rounded-2xl border-2 ${isPro ? 'border-[#E6C785] bg-[#FAF1DC]' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">💼</span>
                  <h3 className="text-xl font-bold text-[#532418]">{t('stoffberater.forProTitle')}</h3>
                </div>
                <p className="text-[#67534F]">{t('stoffberater.forProDesc')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Feedback Section */}
        <section className="py-12 px-4 bg-gradient-to-br from-[#532418] to-[#8B4513]">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl">
              {isSubmitted ? (
                /* Success State */
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-[#532418] mb-4">
                    {t('stoffberater.successTitle')}
                  </h3>
                  <p className="text-[#67534F] mb-6">
                    {creditsGranted
                      ? t('stoffberater.successWithCredits')
                      : t('stoffberater.successNoCredits')}
                  </p>
                  <button
                    onClick={() => navigate('/')}
                    className="px-6 py-3 bg-gradient-to-r from-[#C8956C] to-[#A67B5B] text-white font-semibold rounded-xl hover:opacity-90 transition-all"
                  >
                    {t('stoffberater.backToApp')}
                  </button>
                </div>
              ) : alreadySubmitted ? (
                /* Already Submitted State */
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-[#532418] mb-4">
                    {t('stoffberater.alreadySubmittedTitle')}
                  </h3>
                  <p className="text-[#67534F] mb-6">
                    {t('stoffberater.alreadySubmittedDesc')}
                  </p>
                  <button
                    onClick={() => navigate('/')}
                    className="px-6 py-3 bg-gradient-to-r from-[#C8956C] to-[#A67B5B] text-white font-semibold rounded-xl hover:opacity-90 transition-all"
                  >
                    {t('stoffberater.backToApp')}
                  </button>
                </div>
              ) : (
                /* Feedback Form */
                <>
                  <h3 className="text-2xl font-bold text-[#532418] text-center mb-2">
                    {t('stoffberater.feedbackTitle')}
                  </h3>
                  <p className="text-[#67534F] text-center mb-6">
                    {t('stoffberater.feedbackSubtitle')}
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-[#532418] mb-2">
                        {t('stoffberater.emailLabel')} *
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t('stoffberater.emailPlaceholder')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8956C] transition-all"
                        disabled={!!user?.email}
                      />
                    </div>

                    {/* Interests Checkboxes */}
                    <div>
                      <label className="block text-sm font-medium text-[#532418] mb-3">
                        {t('stoffberater.interestsLabel')}
                      </label>
                      <div className="space-y-3">
                        {[
                          { key: 'stofferkennung', label: t('stoffberater.interest1') },
                          { key: 'verhaltensprofile', label: t('stoffberater.interest2') },
                          { key: 'toleranzen', label: t('stoffberater.interest3') },
                          { key: 'pdfExport', label: t('stoffberater.interest4') },
                          { key: 'bestPractice', label: t('stoffberater.interest5') },
                        ].map((item) => (
                          <label
                            key={item.key}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={interests[item.key as keyof StoffberaterInterests]}
                              onChange={() => handleInterestChange(item.key as keyof StoffberaterInterests)}
                              className="w-5 h-5 text-[#C8956C] rounded focus:ring-[#C8956C]"
                            />
                            <span className="text-[#67534F]">{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Feedback Text */}
                    <div>
                      <label className="block text-sm font-medium text-[#532418] mb-2">
                        {t('stoffberater.feedbackLabel')}
                        <span className="text-[#67534F] font-normal ml-1">({t('common.optional')})</span>
                      </label>
                      <textarea
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder={t('stoffberater.feedbackPlaceholder')}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8956C] transition-all resize-none"
                      />
                    </div>

                    {error && (
                      <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
                        {error}
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`w-full py-4 px-6 rounded-xl font-bold text-white transition-all ${
                        isSubmitting
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-[#E6C785] via-[#CDA35E] to-[#B08642] hover:opacity-90 shadow-lg hover:shadow-xl'
                      }`}
                    >
                      {isSubmitting ? t('common.processing') : t('stoffberater.submitButton')}
                    </button>

                    {/* Bonus Info */}
                    {user ? (
                      <p className="text-center text-sm text-green-600 font-medium">
                        🎁 {t('stoffberater.bonusInfo')}
                      </p>
                    ) : (
                      <p className="text-center text-sm text-[#67534F]">
                        💡 {t('stoffberater.loginForBonus')}
                      </p>
                    )}
                  </form>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer
        onOpenImpressum={() => setShowImpressum(true)}
        onOpenDatenschutz={() => setShowDatenschutz(true)}
        onOpenAgb={() => setShowAgb(true)}
        onOpenAvv={() => setShowAvv(true)}
      />

      {/* Legal Modals */}
      {showImpressum && (
        <LegalModal content={impressumContent} onClose={() => setShowImpressum(false)} />
      )}
      {showDatenschutz && (
        <LegalModal content={datenschutzContent} onClose={() => setShowDatenschutz(false)} />
      )}
      {showAgb && (
        <LegalModal content={agbContent} onClose={() => setShowAgb(false)} />
      )}
      {showAvv && (
        <LegalModal content={avvContent} onClose={() => setShowAvv(false)} />
      )}
    </div>
  );
};

export default StoffberaterProPage;
