import React, { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Volume2,
  VolumeX,
  Pill,
  Clock,
  Utensils,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle,
  HelpCircle,
} from "lucide-react";
import { MedicineItem } from "../types";

interface MedicineCardProps {
  medicine: MedicineItem;
  index: number;
}

export const MedicineCard: React.FC<MedicineCardProps> = ({ medicine, index }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showDrugDetails, setShowDrugDetails] = useState(true);

  const isUnknown =
    medicine.is_unknown_or_unclear ||
    medicine.verification_status === "review_required" ||
    medicine.confidence_level === "review_required" ||
    medicine.medicine_name_normalized.toLowerCase().includes("unknown");

  // Audio Speech Synthesis for Patient Instructions
  const handleSpeakInstruction = () => {
    if (!("speechSynthesis" in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = isUnknown
      ? "Medicine name could not be confirmed. Please verify the prescription with your doctor or pharmacist."
      : medicine.patient_instruction;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.95; // slightly slower for patient clarity
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  return (
    <div
      id={`medicine-card-${index}`}
      className={`rounded-2xl border transition-all duration-200 overflow-hidden bg-white shadow-xs ${
        isUnknown
          ? "border-amber-300 ring-1 ring-amber-100"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      {/* Top Header Card */}
      <div
        className={`p-5 sm:p-6 border-b ${
          isUnknown
            ? "bg-amber-50/50 border-amber-200/60"
            : "bg-slate-50/70 border-slate-200/70"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Medicine {index + 1}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {isUnknown ? "Review Required" : medicine.medicine_name_normalized}
            </h3>

            <p className="text-sm text-slate-600 font-medium">
              {medicine.strength} {medicine.dosage_form ? `· ${medicine.dosage_form}` : ""}
            </p>
          </div>

          {/* Confidence Badges */}
          <div className="flex flex-wrap items-center gap-2">
            {isUnknown ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                REVIEW REQUIRED
              </span>
            ) : medicine.confidence_level === "medium" || medicine.verification_status === "probable_correction" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                Medium Confidence — prescription details partially clear
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                High Confidence — prescription details clearly detected
              </span>
            )}
          </div>
        </div>

        {/* OCR detection display: for unclear items OR for normalized corrections */}
        {isUnknown ? (
          <div className="mt-3 pt-3 border-t border-amber-200/80 flex flex-wrap items-center gap-2 text-xs text-amber-950 font-medium">
            <span className="font-bold text-amber-900">Original OCR:</span>
            <code className="px-2 py-0.5 bg-white border border-amber-300 rounded-md font-mono text-amber-900 font-bold">
              &ldquo;{medicine.medicine_name_raw || medicine.original_text}&rdquo;
            </code>
            <span className="text-amber-800 text-[11px]">— Unclear handwriting; not guessed to prevent medical errors.</span>
          </div>
        ) : medicine.correction_made ? (
          <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center gap-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-700">Original OCR detected:</span>
            <code className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md font-mono text-slate-800">
              &ldquo;{medicine.medicine_name_raw}&rdquo;
            </code>
            <span className="text-slate-400">→</span>
            <span className="text-slate-700 font-semibold">Normalized generic match</span>
          </div>
        ) : null}
      </div>

      {/* Structured Prescription Line Fields Grid */}
      <div className="p-5 sm:p-6 space-y-6">
        {/* Exact prescription text */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Prescription Line Text (Single Source of Truth)
          </div>
          <div className="font-mono text-slate-800 font-medium">
            {medicine.original_text}
          </div>
        </div>

        {/* Parsed Discrete Fields */}
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-between">
            <span>Prescription-Derived Information (Single Source of Truth)</span>
            <span className="text-[10px] font-normal text-slate-400">Extracted from image</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Strength */}
          <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
              <Pill className="w-3.5 h-3.5 text-teal-700" />
              <span>Strength</span>
            </div>
            <div className="text-sm font-bold text-slate-900">
              {medicine.strength || "Not specified"}
            </div>
          </div>

          {/* Amount per dose (NEVER confuse with duration!) */}
          <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
              <Layers className="w-3.5 h-3.5 text-teal-700" />
              <span>Amount Per Dose</span>
            </div>
            <div className="text-sm font-bold text-slate-900">
              {medicine.amount} {medicine.amount > 1 ? `${medicine.unit}s` : medicine.unit}
            </div>
          </div>

          {/* Frequency */}
          <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
              <Clock className="w-3.5 h-3.5 text-teal-700" />
              <span>Frequency</span>
            </div>
            <div className="text-sm font-bold text-slate-900 capitalize">
              {medicine.frequency_normalized || medicine.frequency_raw || "As prescribed"}
            </div>
            {medicine.frequency_raw && medicine.frequency_raw !== medicine.frequency_normalized && (
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                ({medicine.frequency_raw})
              </div>
            )}
          </div>

          {/* Duration */}
          <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
              <Calendar className="w-3.5 h-3.5 text-teal-700" />
              <span>Duration</span>
            </div>
            <div className="text-sm font-bold text-slate-900">
              {medicine.duration || "As directed"}
            </div>
          </div>
        </div>

        {/* Secondary parameters: Timing & Food */}
        {(medicine.timing || medicine.food_instruction) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {medicine.timing && (
              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-700" />
                  <span className="text-xs text-slate-600 font-medium">Timing:</span>
                </div>
                <span className="text-xs font-bold text-slate-900 capitalize">
                  {medicine.timing}
                </span>
              </div>
            )}

            {medicine.food_instruction && (
              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-teal-700" />
                  <span className="text-xs text-slate-600 font-medium">Food Instruction:</span>
                </div>
                <span className="text-xs font-bold text-slate-900 capitalize">
                  {medicine.food_instruction}
                </span>
              </div>
            )}
          </div>
        )}
        </div>

        {/* Prominent Patient-Friendly Instructions Box */}
        <div
          className={`p-4 sm:p-5 rounded-2xl border ${
            isUnknown
              ? "bg-amber-50/80 border-amber-200"
              : "bg-teal-50/70 border-teal-200"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {isUnknown ? (
                <AlertTriangle className="w-4 h-4 text-amber-700" />
              ) : (
                <CheckCircle className="w-4 h-4 text-teal-700" />
              )}
              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  isUnknown ? "text-amber-900" : "text-teal-950"
                }`}
              >
                Patient-Friendly Instruction
              </span>
              <span className="hidden sm:inline text-[10px] text-teal-800/80 font-medium ml-1">
                (Generated strictly from prescription fields)
              </span>
            </div>

            {/* Read Aloud Button */}
            <button
              type="button"
              onClick={handleSpeakInstruction}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                isUnknown
                  ? "bg-amber-200/80 hover:bg-amber-300/80 text-amber-900"
                  : "bg-teal-200/70 hover:bg-teal-300/70 text-teal-950"
              }`}
              title="Listen to instruction aloud"
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Listen</span>
                </>
              )}
            </button>
          </div>

          <p
            className={`text-base font-semibold leading-relaxed ${
              isUnknown ? "text-amber-950" : "text-teal-950"
            }`}
          >
            {medicine.patient_instruction}
          </p>

          {isUnknown && medicine.uncertainty_reason && (
            <p className="text-xs text-amber-800 mt-2">
              <strong>Notice:</strong> {medicine.uncertainty_reason}
            </p>
          )}
        </div>

        {/* Verified Drug Information & Safety Section */}
        {(() => {
          const drugInfoData = medicine.drug_information || (medicine.drug_info ? {
            source_status: (medicine.drug_info.purpose && !medicine.drug_info.purpose.includes("unavailable") ? 'verified' : 'unavailable') as 'verified' | 'unavailable',
            source_name: 'Verified Drug Information',
            purpose: Array.isArray(medicine.drug_info.purpose) ? medicine.drug_info.purpose : (medicine.drug_info.purpose ? [medicine.drug_info.purpose] : []),
            common_side_effects: medicine.drug_info.common_side_effects || [],
            important_warnings: medicine.drug_info.important_warnings || [],
            notable_interactions: medicine.drug_info.known_interactions || [],
          } : null);

          const isDrugInfoUnavailable =
            !drugInfoData ||
            drugInfoData.source_status === 'unavailable' ||
            (!drugInfoData.purpose?.length && !drugInfoData.important_warnings?.length && !drugInfoData.common_side_effects?.length);

          return (
            <div className="pt-2 border-t border-slate-200/80">
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/40">
                {/* Header banner */}
                <div className="p-4 sm:p-5 border-b border-slate-200/70 bg-white">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-teal-50 border border-teal-200/60 flex items-center justify-center">
                        <Info className="w-3.5 h-3.5 text-teal-700" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                        Verified Drug Information &amp; Safety
                      </h4>
                    </div>
                    {drugInfoData && drugInfoData.source_status === 'verified' && (
                      <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200 self-start sm:self-auto">
                        Verified Drug Information
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    External reference information to supplement understanding. These details were not extracted from your prescription slip.
                  </p>
                </div>

                <div className="p-4 sm:p-5 space-y-4 text-xs">
                  {isDrugInfoUnavailable ? (
                    <div className="p-3.5 rounded-xl bg-slate-100/80 border border-slate-200 text-slate-600 font-medium text-xs">
                      Verified drug information is currently unavailable.
                    </div>
                  ) : (
                    <>
                      {/* Purpose / What it is used for */}
                      <div>
                        <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1.5">
                          Purpose / What it is used for:
                        </h5>
                        {drugInfoData.purpose && drugInfoData.purpose.length > 0 ? (
                          <ul className="space-y-1 text-slate-600">
                            {drugInfoData.purpose.map((item, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-teal-700 font-bold">•</span>
                                <span className="leading-relaxed">{item}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-slate-500 italic">No purpose details specified in verified reference.</p>
                        )}
                      </div>

                      {/* Common side effects */}
                      <div>
                        <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1.5">
                          Common side effects:
                        </h5>
                        {drugInfoData.common_side_effects && drugInfoData.common_side_effects.length > 0 ? (
                          <ul className="space-y-1 text-slate-600">
                            {drugInfoData.common_side_effects.map((effect, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-slate-400 font-bold">•</span>
                                <span className="leading-relaxed">{effect}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-slate-500 italic">No common side effects noted in verified reference.</p>
                        )}
                      </div>

                      {/* Important safety warnings */}
                      {drugInfoData.important_warnings && drugInfoData.important_warnings.length > 0 && (
                        <div>
                          <h5 className="font-bold text-amber-900 uppercase tracking-wider text-[11px] mb-1.5 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            <span>Important safety warnings:</span>
                          </h5>
                          <ul className="space-y-1 text-slate-700">
                            {drugInfoData.important_warnings.map((warning, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-amber-600 font-bold">•</span>
                                <span className="leading-relaxed">{warning}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Notable interactions */}
                      <div>
                        <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1.5">
                          Notable interactions:
                        </h5>
                        {drugInfoData.notable_interactions && drugInfoData.notable_interactions.length > 0 ? (
                          <ul className="space-y-1 text-slate-600">
                            {drugInfoData.notable_interactions.map((interaction, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-blue-600 font-bold">•</span>
                                <span className="leading-relaxed">{interaction}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-slate-600 font-medium">
                            No notable interactions identified in the selected reference.
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
