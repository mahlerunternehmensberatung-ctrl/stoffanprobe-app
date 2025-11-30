import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import WaitlistModal from './WaitlistModal';

const ComingSoonBanner: React.FC = () => {
  const { t } = useTranslation();
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);

  return (
    <>
      <div className="w-full bg-gradient-to-r from-[#F8F4E3] to-[#FAF1DC] border-t border-b border-[#E6C785]/30 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          {/* Coming Soon Badge */}
          <span className="inline-block text-[10px] sm:text-xs font-bold text-[#C8956C] bg-[#C8956C]/10 px-3 py-1 rounded-full uppercase tracking-wider mb-3">
            {t('comingSoon.badge')}
          </span>

          {/* Text */}
          <h3 className="text-base sm:text-lg md:text-xl font-semibold text-[#532418] mb-2 sm:mb-3 px-2">
            {t('comingSoon.title')}
          </h3>
          <p className="text-xs sm:text-sm text-[#67534F] mb-4 max-w-xl mx-auto hidden sm:block">
            {t('comingSoon.description')}
          </p>

          {/* Button */}
          <button
            onClick={() => setShowWaitlistModal(true)}
            className="px-5 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base font-semibold text-white bg-gradient-to-r from-[#C8956C] to-[#A67B5B] rounded-lg hover:from-[#A67B5B] hover:to-[#8B6B4B] transition-all shadow-md hover:shadow-lg"
          >
            {t('comingSoon.notifyMe')}
          </button>
        </div>
      </div>

      <WaitlistModal
        isOpen={showWaitlistModal}
        onClose={() => setShowWaitlistModal(false)}
        feature="stoffberater_pro"
      />
    </>
  );
};

export default ComingSoonBanner;
