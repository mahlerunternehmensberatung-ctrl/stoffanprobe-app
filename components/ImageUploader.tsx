import React, { useRef, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { compressImageFile } from '../utils/imageCompression';

interface ImageUploaderProps {
  onImageSelect: (imageDataUrl: string) => void;
  imageDataUrl?: string;
  buttonText: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageSelect,
  imageDataUrl,
  buttonText,
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const goldGradient = "bg-gradient-to-br from-[#E6C785] via-[#CDA35E] to-[#B08642] hover:from-[#CDA35E] hover:via-[#B08642] hover:to-[#8C6A30]";

  const processFile = useCallback(async (file: File) => {
    if (!file || !file.type.startsWith("image/")) return;

    try {
      const compressedDataUrl = await compressImageFile(file, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.85,
      });
      onImageSelect(compressedDataUrl);
    } catch (error) {
      console.error('Image compression failed:', error);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string | null;
        if (result) {
          onImageSelect(result);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [onImageSelect]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImageSelect('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  // Wenn bereits ein Bild vorhanden ist: Thumbnail mit X-Button
  if (imageDataUrl) {
    return (
      <div
        className="relative w-full max-w-xs mx-auto rounded-xl overflow-hidden shadow-md group"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <img
          src={imageDataUrl}
          alt="Upload"
          className="w-full h-auto max-h-48 sm:max-h-64 object-contain bg-white/50"
        />
        <button
          onClick={handleClear}
          className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center text-lg hover:bg-black/80 transition-colors shadow-md"
          aria-label={t('uploader.removeImage')}
        >
          ×
        </button>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
      </div>
    );
  }

  // Kein Bild: Button mit klarem Call-to-Action
  return (
    <div
      className={`flex-1 ${isDragging ? 'ring-2 ring-[#C8956C] rounded-xl' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <button
        onClick={handleClick}
        className={`w-full py-3 sm:py-4 px-4 text-xs sm:text-sm font-semibold text-white rounded-xl shadow-md transition-all flex items-center justify-center gap-2 ${goldGradient}`}
      >
        <span>{buttonText}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      </button>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
    </div>
  );
};

export default ImageUploader;
