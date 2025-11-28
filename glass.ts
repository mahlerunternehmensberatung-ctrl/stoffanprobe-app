// glass.ts – 1x überall wiederverwenden

export const glassBase =
  "bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.12)] rounded-3xl transition-all duration-300 ease-out";

export const glassActive =
  "bg-white/30 backdrop-blur-2xl border border-white/40 shadow-[0_8px_28px_rgba(0,0,0,0.18)] scale-[1.02]";

export const glassButton =
  "px-5 py-3 font-semibold text-[#532418] rounded-2xl bg-white/20 backdrop-blur-xl border border-white/30 shadow-sm hover:bg-white/30 transition-all duration-200";

export const glassButtonActive =
  "px-5 py-3 font-semibold text-[#532418] rounded-2xl bg-white/40 backdrop-blur-xl border border-white/60 shadow-md scale-[1.03] transition-all duration-200";

export const glassHeaderButton =
  "px-3 py-2 text-sm font-medium text-[#532418] rounded-xl bg-white/20 backdrop-blur-xl border border-white/30 shadow-sm hover:bg-white/30 transition-all duration-200";

export const glassGold =
  "px-5 py-3 font-semibold bg-[#C8956C]/40 backdrop-blur-xl border border-[#A67B5B]/60 shadow-[0_4px_16px_rgba(200,149,108,0.25)] text-[#532418] rounded-2xl transition-all duration-200";

export const glassGoldActive =
  "px-5 py-3 font-semibold bg-[#C8956C]/60 backdrop-blur-xl border border-[#A67B5B]/80 shadow-[0_6px_22px_rgba(200,149,108,0.35)] text-[#532418] rounded-2xl transition-all duration-200 scale-[1.02]";

// Legacy aliases for backwards compatibility
export const glassOrange = glassGold;
export const glassOrangeActive = glassGoldActive;