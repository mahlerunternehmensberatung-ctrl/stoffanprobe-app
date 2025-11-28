import React, { useRef, useCallback, useState } from 'react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const goldGradient = "bg-gradient-to-r from-[#C8956C] to-[#A67B5B] hover:from-[#A67B5B] hover:to-[#8B6B4B]";

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
        className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-md group"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <img
          src={imageDataUrl}
          alt="Upload"
          className="w-full h-full object-cover"
        />
        <button
          onClick={handleClear}
          className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-black/70 transition-colors"
          aria-label="Bild entfernen"
        >
          ×
        </button>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
      </div>
    );
  }

  // Kein Bild: Einfacher Button
  return (
    <div
      className={`flex-1 ${isDragging ? 'ring-2 ring-[#C8956C]' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <button
        onClick={handleClick}
        className={`w-full py-3 sm:py-4 px-4 text-xs sm:text-sm font-semibold text-white rounded-xl shadow-md transition-all ${goldGradient}`}
      >
        {buttonText}
      </button>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
    </div>
  );
};

export default ImageUploader;
