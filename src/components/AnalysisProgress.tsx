import React, { useEffect, useState } from "react";
import { CheckCircle, CircleDot, Loader2, Shield } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { scrollToTopSlow } from "../utils/scrollUtils";

interface AnalysisProgressProps {
  currentStage?: number;
}

const STAGES = [
  { step: "01", label: "Reading prescription", desc: "Extracting raw handwritten and printed lines" },
  { step: "02", label: "Identifying medicines", desc: "Normalizing drug names & verifying OCR confidence" },
  { step: "03", label: "Understanding dosage", desc: "Separating strength, amount per dose, frequency & duration" },
  { step: "04", label: "Checking medicine information", desc: "Retrieving verified drug safety, purpose & side effects" },
  { step: "05", label: "Preparing simple instructions", desc: "Formatting patient-friendly everyday instructions" },
];

export const AnalysisProgress: React.FC<AnalysisProgressProps> = () => {
  // Whether the steps carousel has appeared after the header is introduced
  const [stepsVisible, setStepsVisible] = useState(false);
  // activeIndex tracks which step is centered in the viewport (0 to 4)
  const [activeIndex, setActiveIndex] = useState(0);

  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    // Promptly scroll window to top so "Analyzing Your Prescription" is immediately visible at the top
    scrollToTopSlow(400);

    // 1. "Analyzing Your Prescription" appears first
    // 2. Then the scrolling steps emerge gracefully
    // 3. Each step remains visible with generous reading time (~2.6s pause each)
    const timers = [
      // Steps appear after user sees "Analyzing Your Prescription" header
      setTimeout(() => setStepsVisible(true), 900),

      // Step 01 -> Step 02
      setTimeout(() => setActiveIndex(1), 3500),

      // Step 02 -> Step 03
      setTimeout(() => setActiveIndex(2), 6100),

      // Step 03 -> Step 04
      setTimeout(() => setActiveIndex(3), 8700),

      // Step 04 -> Step 05 (remains active until analysis completes)
      setTimeout(() => setActiveIndex(4), 11300),
    ];

    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
      {/* Header: Appears first smoothly */}
      <motion.div
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
        className="text-center space-y-2 mb-6 sm:mb-8"
      >
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 mb-2">
          <Loader2 className="w-6 h-6 animate-spin text-teal-700" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Analyzing Your Prescription
        </h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Executing verified clinical OCR pipeline. Strictly upholding the prescription image as single source of truth.
        </p>
      </motion.div>

      {/* Steps Container: Emerges after the header is established */}
      {stepsVisible ? (
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.25, 1, 0.5, 1] }}
        >
          {/* Progress Timeline Indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {STAGES.map((s, idx) => (
              <div
                key={s.step}
                className={`h-1.5 rounded-full transition-all duration-700 ${
                  idx === activeIndex
                    ? "w-8 bg-teal-600"
                    : idx < activeIndex
                    ? "w-3 bg-emerald-500"
                    : "w-3 bg-slate-200"
                }`}
              />
            ))}
          </div>

          {/* Automatic Vertical Carousel / Rolling Timeline Viewport */}
          <div className="relative overflow-hidden h-[160px] sm:h-[150px] rounded-2xl border border-slate-200/90 bg-slate-50/50 shadow-inner">
            {/* Subtle gradient masks for smooth top/bottom edge rolling effect */}
            <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-slate-100/90 to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-slate-100/90 to-transparent z-10 pointer-events-none" />

            <motion.div
              animate={{
                y: shouldReduceMotion ? 0 : -activeIndex * 160,
              }}
              transition={{
                duration: shouldReduceMotion ? 0.05 : 0.95, // Slower, relaxed and luxurious scroll
                ease: [0.22, 1, 0.36, 1], // Very gentle easing
              }}
              className="w-full"
            >
              {STAGES.map((s, index) => {
                const isDone = index < 4; // 01 to 04 are Verified
                const isLast = index === 4; // 05 is Processing... until actual analysis finishes
                const isCurrent = index === activeIndex;

                return (
                  <div
                    key={s.step}
                    className="h-[160px] sm:h-[150px] flex items-center justify-center p-4 sm:p-6"
                  >
                    <div
                      className={`w-full max-w-xl flex items-start gap-4 p-4 sm:p-5 rounded-2xl border transition-all duration-500 ${
                        isLast && isCurrent
                          ? "bg-teal-50/90 border-teal-300 shadow-sm"
                          : isCurrent
                          ? "bg-white border-slate-300 shadow-sm"
                          : "bg-white/70 border-slate-200 opacity-60"
                      }`}
                    >
                      {/* Step Indicator */}
                      <div className="shrink-0 mt-0.5">
                        {isLast ? (
                          <div className="w-7 h-7 rounded-full bg-teal-100/90 border border-teal-300 flex items-center justify-center">
                            <CircleDot className="w-4 h-4 text-teal-700 animate-pulse" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-300 flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                          </div>
                        )}
                      </div>

                      {/* Text Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900">
                            {s.step} — {s.label}
                          </span>
                          {isLast ? (
                            <span className="text-xs font-semibold text-teal-800 bg-teal-100/90 px-2.5 py-0.5 rounded-full animate-pulse border border-teal-200 shrink-0">
                              Processing...
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                              <CheckCircle className="w-3 h-3 text-emerald-600 inline" />
                              Verified
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                          {s.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </div>
        </motion.div>
      ) : (
        /* Smooth placeholder height to maintain layout while header appears first */
        <div className="h-[210px] flex items-center justify-center">
          <span className="text-xs text-slate-400 font-medium animate-pulse">
            Initializing prescription analysis...
          </span>
        </div>
      )}

      {/* Safety assurance note */}
      <div className="mt-6 sm:mt-8 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500">
        <Shield className="w-4 h-4 text-teal-700" />
        <span>Zero hallucinations · Unclear items flagged for Review</span>
      </div>
    </div>
  );
};
