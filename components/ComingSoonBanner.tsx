import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const ComingSoonBanner: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
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

        {/* Button - now navigates to the Stoffberater Pro page */}
        <button
          onClick={() => navigate('/stoffberater-pro')}
          className="px-5 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base font-semibold text-white bg-gradient-to-br from-[#E6C785] via-[#CDA35E] to-[#B08642] rounded-lg hover:from-[#CDA35E] hover:via-[#B08642] hover:to-[#8C6A30] transition-all shadow-md hover:shadow-lg"
        >
          {t('comingSoon.notifyMe')}
        </button>
      </div>
    </div>
  );
};

export default ComingSoonBanner;
