import React from 'react';
import { PresetType } from '../types';
import { CurtainIcon, WallpaperIcon, CarpetIcon, AccessoryIcon, FurnitureIcon } from './Icon';

interface PresetButtonsProps {
  onPresetSelect: (preset: PresetType) => void;
  selectedPreset: PresetType | null;
}

const presets: { name: PresetType; icon: React.ReactNode }[] = [
  { name: 'Gardine', icon: <CurtainIcon /> },
  { name: 'Tapete', icon: <WallpaperIcon /> },
  { name: 'Teppich', icon: <CarpetIcon /> },
  { name: 'Accessoire', icon: <AccessoryIcon /> },
  { name: 'Möbel', icon: <FurnitureIcon /> },
];

const PresetButtons: React.FC<PresetButtonsProps> = ({ onPresetSelect, selectedPreset }) => {
  return (
    <>
      {presets.map(({ name, icon }) => {
        const isSelected = selectedPreset === name;
        return (
          <button
            key={name}
            onClick={() => onPresetSelect(name)}
            className={`
              group flex flex-col items-center justify-center
              w-20 sm:w-24 md:w-28 h-20 sm:h-24 bg-white rounded-xl shadow-sm
              hover:shadow-lg transition-shadow duration-200
              border-2
              ${isSelected ? 'border-[#FF954F]' : 'border-transparent hover:border-[#FF954F]/50'}
            `}
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 text-[#FF954F] mb-1 sm:mb-2 transition-transform duration-300 group-hover:scale-110">
              {icon}
            </div>
            <span className="font-medium text-xs sm:text-sm text-[#532418] text-center px-1">{name}</span>
          </button>
        )
      })}
    </>
  );
};

export default PresetButtons;