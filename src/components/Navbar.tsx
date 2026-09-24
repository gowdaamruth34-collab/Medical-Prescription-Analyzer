import React from "react";
import { ShieldCheck, BookOpen, HeartPulse } from "lucide-react";

interface NavbarProps {
  onOpenGlossary: () => void;
  onReset: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenGlossary, onReset }) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Brand Logo & Name */}
          <button
            id="brand-home-button"
            onClick={onReset}
            className="flex items-center gap-3 text-left group transition cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl bg-teal-700 flex items-center justify-center text-white shadow-sm shadow-teal-900/10 group-hover:scale-105 transition-transform">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-slate-900">
                  MediSimplify
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-teal-800 bg-teal-50 border border-teal-200/80 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3 text-teal-700" />
                  Safety Verified
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Medical Prescription Simplifier
              </p>
            </div>
          </button>

          {/* Right Action Controls */}
          <div className="flex items-center gap-3">
            <button
              id="open-glossary-btn"
              onClick={onOpenGlossary}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 border border-slate-200/60 rounded-lg transition shadow-xs cursor-pointer"
              title="View common medical abbreviations (OD, BD, TDS, etc.)"
            >
              <BookOpen className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">Rx Abbreviations</span>
              <span className="sm:hidden">Rx Guide</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
