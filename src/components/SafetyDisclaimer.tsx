import React from "react";
import { AlertTriangle, Stethoscope } from "lucide-react";

export const SafetyDisclaimer: React.FC = () => {
  return (
    <aside
      aria-label="Medical Safety Disclaimer"
      className="rounded-2xl border border-amber-200/80 bg-amber-50/70 p-5 sm:p-6 shadow-xs text-slate-800"
    >
      <div className="flex items-start gap-3.5">
        <div className="p-2 bg-amber-100/90 rounded-xl text-amber-800 shrink-0 mt-0.5">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="space-y-1.5 text-sm">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-slate-900 tracking-tight">
              Important Medical Safety Disclaimer
            </h4>
            <span className="text-[11px] font-bold text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Educational Purpose
            </span>
          </div>
          <p className="text-slate-700 leading-relaxed">
            This tool is for prescription understanding only and is not medical advice. Do not start, stop, or change medication based only on this application. Consult your doctor or pharmacist if anything is unclear.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-slate-600 pt-1 font-medium">
            <Stethoscope className="w-3.5 h-3.5 text-teal-700" />
            <span>The uploaded prescription image is the single source of truth. Always verify with your physical dispensed packaging.</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
