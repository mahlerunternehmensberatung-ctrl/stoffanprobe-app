import React from 'react';
import { ImageType } from '../types';

interface ImageTypeSelectionModalProps {
  isOpen: boolean;
  onSelect: (type: ImageType) => void;
  onClose: () => void;
}

const ImageTypeSelectionModal: React.FC<ImageTypeSelectionModalProps> = ({ isOpen, onSelect, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-[#FFFFF5] rounded-lg shadow-xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-[#532418]">Bildtyp auswählen</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl font-bold" aria-label="Schließen">
            &times;
          </button>
        </div>
        <p className="mb-6 text-sm text-gray-600">
          Bitte wählen Sie aus, ob es sich um Ihre eigene Wohnung oder die Wohnung eines Kunden handelt.
        </p>
        <div className="space-y-4">
          <button
            onClick={() => onSelect('private')}
            className="w-full px-6 py-4 bg-[#FF954F] text-white rounded-lg hover:bg-[#CC5200] transition-colors font-semibold text-lg shadow-md"
          >
            Meine eigene Wohnung
          </button>
          <button
            onClick={() => onSelect('commercial')}
            className="w-full px-6 py-4 bg-white text-[#FF954F] border-2 border-[#FF954F] rounded-lg hover:bg-[#FF954F] hover:text-white transition-colors font-semibold text-lg shadow-md"
          >
            Wohnung eines Kunden
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageTypeSelectionModal;

