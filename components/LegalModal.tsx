import React from "react";

interface LegalSection {
  heading?: string;
  content: (string | { label: string; text: string })[];
}

interface LegalContent {
  title: string;
  subtitle?: string;
  sections: LegalSection[];
}

interface LegalModalProps {
  content: LegalContent;
  onClose: () => void;
}

const LegalModal: React.FC<LegalModalProps> = ({ content, onClose }) => {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#FFFFF5] rounded-2xl p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#532418]">{content.title}</h2>
          {content.subtitle && (
            <p className="text-sm text-[#67534F] mt-1">{content.subtitle}</p>
          )}
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {content.sections.map((section, idx) => (
            <div key={idx}>
              {section.heading && (
                <h3 className="text-lg font-semibold text-[#532418] mb-3">
                  {section.heading}
                </h3>
              )}
              <div className="space-y-2">
                {section.content.map((item, itemIdx) => {
                  if (typeof item === "string") {
                    return (
                      <p key={itemIdx} className="text-[#67534F] leading-relaxed">
                        {item}
                      </p>
                    );
                  } else {
                    return (
                      <div key={itemIdx} className="text-[#67534F]">
                        <span className="font-semibold text-[#532418]">
                          {item.label}
                        </span>{" "}
                        <span className="leading-relaxed">{item.text}</span>
                      </div>
                    );
                  }
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="mt-8 w-full py-3 bg-gradient-to-r from-[#C8956C] to-[#A67B5B] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
        >
          Schließen
        </button>
      </div>
    </div>
  );
};

export default LegalModal;
