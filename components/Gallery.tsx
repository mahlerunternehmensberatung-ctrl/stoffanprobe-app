import React from "react";
import { Variant } from "../types";
import { EmailIcon, DownloadIcon, DiscardIcon } from "./Icon";

interface GalleryProps {
  variants: Variant[];
  onVariantSelect: (variant: Variant) => void;
  onEmailAll: () => void;
  onDownloadAll: () => void;
  onDeleteAll: () => void;
}

const Gallery: React.FC<GalleryProps> = ({
  variants,
  onVariantSelect,
  onEmailAll,
  onDownloadAll,
  onDeleteAll,
}) => {
  if (!variants || variants.length === 0) {
    return null;
  }

  const sortedVariants = [...variants].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime()
  );

  const buttonClasses =
    "px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-[#532418] bg-white rounded-lg shadow-md border border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition-all flex items-center justify-center gap-1 sm:gap-2";

  return (
    <div className="mt-6 sm:mt-8 w-full max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between mb-3 sm:mb-4 border-b border-[#C8956C]/30 pb-2">
        <h3 className="text-sm sm:text-base font-semibold text-[#532418]">
          Galerie ({variants.length})
        </h3>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button onClick={onEmailAll} className={buttonClasses} title="Galerie senden">
            <EmailIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Senden</span>
          </button>
          <button onClick={onDownloadAll} className={buttonClasses} title="Galerie speichern">
            <DownloadIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Download</span>
          </button>
          <button
            onClick={onDeleteAll}
            className={`${buttonClasses} text-red-500 hover:bg-red-50 border-red-200`}
            title="Galerie löschen"
          >
            <DiscardIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-1.5 sm:gap-2">
        {sortedVariants.map((variant) => (
          <button
            key={variant.id}
            onClick={() => onVariantSelect(variant)}
            className="relative aspect-square rounded-lg overflow-hidden shadow-sm hover:shadow-md hover:scale-105 transition-all cursor-pointer group"
          >
            <img
              src={variant.imageUrl}
              alt={variant.preset}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            {/* Grünes Häkchen für gesicherte Bilder */}
            {variant.isDownloaded && (
              <div className="absolute top-1 right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Gallery;