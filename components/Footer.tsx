import React from "react";

interface FooterProps {
  onOpenImpressum: () => void;
  onOpenDatenschutz: () => void;
  onOpenAgb: () => void;
  onOpenCookieSettings?: () => void;
}

const Footer: React.FC<FooterProps> = ({
  onOpenImpressum,
  onOpenDatenschutz,
  onOpenAgb,
  onOpenCookieSettings,
}) => {
  return (
    <footer className="text-center text-sm text-gray-600 py-6 mt-10">
      <button onClick={onOpenImpressum} className="mx-2 underline hover:text-[#FF954F]">
        Impressum
      </button>
      ·
      <button onClick={onOpenDatenschutz} className="mx-2 underline hover:text-[#FF954F]">
        Datenschutz
      </button>
      ·
      <button onClick={onOpenAgb} className="mx-2 underline hover:text-[#FF954F]">
        AGB
      </button>
      {onOpenCookieSettings && (
        <>
          ·
          <button onClick={onOpenCookieSettings} className="mx-2 underline hover:text-[#FF954F]">
            Cookie-Einstellungen
          </button>
        </>
      )}
    </footer>
  );
};

export default Footer;
