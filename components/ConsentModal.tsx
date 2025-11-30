import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ConsentData, CustomerData } from '../types';

interface ConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (consentData: ConsentData, customerData: CustomerData) => void;
}

const SignaturePad: React.FC<{ onSignatureChange: (isEmpty: boolean, dataUrl: string | null) => void; signHereText: string; clearText: string }> = ({ onSignatureChange, signHereText, clearText }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isEmpty, setIsEmpty] = useState(true);

    const getContext = () => canvasRef.current?.getContext('2d');

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = getContext();
        if (!ctx) return;

        // HiDPI display support
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

    }, []);

    const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        if ('touches' in e.nativeEvent) {
            return {
                x: e.nativeEvent.touches[0].clientX - rect.left,
                y: e.nativeEvent.touches[0].clientY - rect.top,
            };
        }
        return {
            x: e.nativeEvent.offsetX,
            y: e.nativeEvent.offsetY,
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const ctx = getContext();
        if (!ctx) return;
        const { x, y } = getCoords(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
        if (isEmpty) setIsEmpty(false);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const ctx = getContext();
        if (!ctx) return;
        const { x, y } = getCoords(e);
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        const ctx = getContext();
        if (!ctx) return;
        ctx.closePath();
        setIsDrawing(false);
        const dataUrl = canvasRef.current?.toDataURL('image/png');
        onSignatureChange(false, dataUrl || null);
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        const ctx = getContext();
        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setIsEmpty(true);
        onSignatureChange(true, null);
    };

    return (
        <div>
            <div className="relative w-full h-40 bg-gray-100 rounded-md border border-gray-300 touch-none">
                <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
                {isEmpty && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none">
                        {signHereText}
                    </div>
                )}
            </div>
            <button
                type="button"
                onClick={clearSignature}
                className="text-sm text-gray-600 hover:text-red-500 mt-2"
            >
                {clearText}
            </button>
        </div>
    );
};


const ConsentModal: React.FC<ConsentModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const { t } = useTranslation();
  const [consent, setConsent] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [signature, setSignature] = useState<{ isEmpty: boolean, dataUrl: string | null }>({ isEmpty: true, dataUrl: null });

  const isFormValid = consent && customerName.trim() !== '' && email.trim() !== '' && !signature.isEmpty;

  useEffect(() => {
    if (isOpen) {
      setConsent(false);
      setCustomerName('');
      setEmail('');
      setSignature({ isEmpty: true, dataUrl: null });
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleConfirm = () => {
    if (!isFormValid) return;

    const consentData: ConsentData = {
      accepted: true,
      signature: signature.dataUrl,
      timestamp: new Date(),
    };
    const customerData: CustomerData = {
        customerName: customerName.trim(),
        email: email.trim(),
        salesCategories: [], // Initialize empty
    }
    onConfirm(consentData, customerData);
  };
  
  const inputClasses = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C8956C] transition-all";

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-[#FFFFF5] rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-[#532418]">{t('consent.title')}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl font-bold" aria-label={t('common.close')}>&times;</button>
        </div>
        <p className="mb-6 text-sm text-gray-600">
            {t('consent.description')}
        </p>
        <div className="space-y-4">
            <div>
                <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">{t('consent.customerName')}</label>
                <input id="customerName" type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} className={inputClasses} required/>
            </div>
             <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">{t('consent.email')}</label>
                <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputClasses} required />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('consent.signature')}</label>
                <SignaturePad onSignatureChange={(isEmpty, dataUrl) => setSignature({ isEmpty, dataUrl })} signHereText={t('consent.signHere')} clearText={t('consent.clear')} />
            </div>

            <label className="flex items-start p-3 bg-[#FAF1DC] rounded-md cursor-pointer hover:bg-opacity-80">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-gray-300 text-[#C8956C] focus:ring-[#A67B5B]"
                />
                <span className="ml-3 text-sm text-gray-800">
                  {t('consent.confirmation')}
                </span>
            </label>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isFormValid}
            className="px-6 py-2 text-sm font-medium text-white bg-[#C8956C] rounded-md hover:bg-[#A67B5B] transition-colors disabled:bg-[#C8B6A6] disabled:cursor-not-allowed"
          >
            {t('consent.confirmButton')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsentModal;