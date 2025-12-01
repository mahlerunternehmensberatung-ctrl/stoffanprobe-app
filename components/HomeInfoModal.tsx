import React from 'react';

interface HomeInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HomeInfoModal: React.FC<HomeInfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-[#FFFFF5] rounded-2xl shadow-xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-[#FAF1DC] rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-[#C8956C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#532418]">Home-Abo</h2>
        </div>

        <div className="bg-[#FAF1DC] rounded-xl p-4 mb-6">
          <p className="text-sm text-[#67534F] leading-relaxed">
            Das Home-Abo ist nur für den <strong>privaten Gebrauch</strong> gedacht.
            Du kannst damit deine eigenen Räume visualisieren.
          </p>
          <p className="text-sm text-[#67534F] mt-3 leading-relaxed">
            Für <strong>geschäftliche Nutzung</strong> (Kundenberatung, Projekte)
            wechsle bitte zum <strong>Pro-Abo</strong>.
          </p>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className="w-full py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-br from-[#E6C785] via-[#CDA35E] to-[#B08642] hover:opacity-90 transition-all shadow-md hover:shadow-lg"
        >
          Verstanden
        </button>
      </div>
    </div>
  );
};

export default HomeInfoModal;
