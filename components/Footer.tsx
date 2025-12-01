import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface FooterProps {
  onOpenCookieSettings?: () => void;
}

const Footer: React.FC<FooterProps> = ({
  onOpenCookieSettings,
}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const currentLang = i18n.language;
  const isGerman = currentLang === 'de' || currentLang.startsWith('de-');

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  // Sprachabhängige URLs
  const legalLinks = isGerman
    ? {
        imprint: '/impressum.html',
        privacy: '/datenschutz.html',
        terms: '/agb.html',
        cancellation: '/widerruf.html',
      }
    : {
        imprint: '/imprint.html',
        privacy: '/privacy.html',
        terms: '/terms.html',
        cancellation: '/cancellation.html',
      };

  const linkClass = "mx-2 underline hover:text-[#C8956C]";

  return (
    <footer className="text-center text-sm text-gray-600 py-6 mt-10">
      <div className="flex flex-wrap justify-center items-center gap-1">
        <a href={legalLinks.imprint} className={linkClass}>
          {t('footer.imprint')}
        </a>
        ·
        <a href={legalLinks.privacy} className={linkClass}>
          {t('footer.privacy')}
        </a>
        ·
        <a href={legalLinks.terms} className={linkClass}>
          {t('footer.terms')}
        </a>
        ·
        <a href={legalLinks.cancellation} className={linkClass}>
          {t('footer.cancellation')}
        </a>
        {onOpenCookieSettings && (
          <>
            ·
            <button onClick={onOpenCookieSettings} className={linkClass}>
              {t('footer.cookieSettings')}
            </button>
          </>
        )}
        ·
        <button
          onClick={() => navigate('/stoffberater-pro')}
          className="mx-2 underline hover:text-[#C8956C]"
        >
          {t('footer.stoffberaterPro')}
        </button>
        ·
        <span className="mx-2 inline-flex items-center gap-1">
          <button
            onClick={() => changeLanguage('de')}
            className={`hover:text-[#C8956C] ${currentLang === 'de' ? 'font-bold text-[#C8956C]' : ''}`}
          >
            {t('language.de')}
          </button>
          <span className="text-gray-400">|</span>
          <button
            onClick={() => changeLanguage('en')}
            className={`hover:text-[#C8956C] ${currentLang === 'en' ? 'font-bold text-[#C8956C]' : ''}`}
          >
            {t('language.en')}
          </button>
        </span>
      </div>
    </footer>
  );
};

export default Footer;
