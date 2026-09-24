import React from "react";
import { X, BookOpen, Clock, Utensils, CheckCircle2 } from "lucide-react";

interface AbbreviationGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AbbreviationGuideModal: React.FC<AbbreviationGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-teal-100 text-teal-800">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Prescription Abbreviations Guide
              </h3>
              <p className="text-xs text-slate-500">
                Common doctor notations and their exact meanings
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Frequency Section */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-800 mb-3">
              <Clock className="w-4 h-4" />
              Standard Dosing Frequency
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { code: "OD", meaning: "Once a day", detail: "Take 1 dose per 24 hours" },
                { code: "BD / BID", meaning: "Twice a day", detail: "Take 2 doses per day (approx. 12 hrs apart)" },
                { code: "TDS / TID", meaning: "Three times a day", detail: "Take 3 doses per day (approx. 8 hrs apart)" },
                { code: "QID", meaning: "Four times a day", detail: "Take 4 doses per day (approx. 6 hrs apart)" },
                { code: "SOS / PRN", meaning: "As needed", detail: "Take only when necessary for symptoms" },
                { code: "STAT", meaning: "Immediately", detail: "Single dose to be taken right away" },
              ].map((item) => (
                <div
                  key={item.code}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between font-mono font-bold text-slate-900">
                    <span>{item.code}</span>
                    <span className="text-xs font-sans font-semibold text-teal-700">
                      {item.meaning}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{item.detail}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Numeric Schedule Section */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-800 mb-3">
              <CheckCircle2 className="w-4 h-4" />
              Numeric Notation (Morning - Afternoon - Night)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { code: "1 - 0 - 1", meaning: "Morning + Night", detail: "1 dose morning, 1 dose night" },
                { code: "1 - 1 - 1", meaning: "Morning + Afternoon + Night", detail: "1 dose with each major period" },
                { code: "1 - 0 - 0", meaning: "Morning only", detail: "1 dose upon waking or breakfast" },
                { code: "0 - 0 - 1", meaning: "Night only", detail: "1 dose before bedtime" },
              ].map((item) => (
                <div
                  key={item.code}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between font-mono font-bold text-slate-900">
                    <span>{item.code}</span>
                    <span className="text-xs font-sans font-semibold text-teal-700">
                      {item.meaning}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{item.detail}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Food and Timing Section */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-800 mb-3">
              <Utensils className="w-4 h-4" />
              Food & Timing Instructions
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { code: "PC / After food", meaning: "Post Cibum", detail: "Take with or right after a meal" },
                { code: "AC / Before food", meaning: "Ante Cibum", detail: "Take 30-60 minutes before meals" },
                { code: "HS / At bedtime", meaning: "Hora Somni", detail: "Take immediately before going to sleep" },
                { code: "x 5 days / x 7 days", meaning: "Duration of course", detail: "Amount of calendar days to complete" },
              ].map((item) => (
                <div
                  key={item.code}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between font-mono font-bold text-slate-900">
                    <span>{item.code}</span>
                    <span className="text-xs font-sans font-semibold text-teal-700">
                      {item.meaning}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{item.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-medium transition cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
