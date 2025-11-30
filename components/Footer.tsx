import React from "react";
import { useTranslation } from "react-i18next";

interface FooterProps {
  onOpenImpressum: () => void;
  onOpenDatenschutz: () => void;
  onOpenAgb: () => void;
  onOpenAvv?: () => void;
  onOpenCookieSettings?: () => void;
}

const Footer: React.FC<FooterProps> = ({
  onOpenImpressum,
  onOpenDatenschutz,
  onOpenAgb,
  onOpenAvv,
  onOpenCookieSettings,
}) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <footer className="text-center text-sm text-gray-600 py-6 mt-10">
      <div className="flex flex-wrap justify-center items-center gap-1">
        <button onClick={onOpenImpressum} className="mx-2 underline hover:text-[#C8956C]">
          {t('footer.imprint')}
        </button>
        ·
        <button onClick={onOpenDatenschutz} className="mx-2 underline hover:text-[#C8956C]">
          {t('footer.privacy')}
        </button>
        ·
        <button onClick={onOpenAgb} className="mx-2 underline hover:text-[#C8956C]">
          {t('footer.terms')}
        </button>
        {onOpenAvv && (
          <>
            ·
            <button onClick={onOpenAvv} className="mx-2 underline hover:text-[#C8956C]">
              {t('footer.avv')}
            </button>
          </>
        )}
        {onOpenCookieSettings && (
          <>
            ·
            <button onClick={onOpenCookieSettings} className="mx-2 underline hover:text-[#C8956C]">
              {t('footer.cookieSettings')}
            </button>
          </>
        )}
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
