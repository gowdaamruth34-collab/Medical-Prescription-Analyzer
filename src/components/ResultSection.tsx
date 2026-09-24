import React, { useState } from "react";
import {
  ArrowLeft,
  Printer,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  AlertCircle,
  ShieldCheck,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { PrescriptionAnalysisResult } from "../types";
import { MedicineCard } from "./MedicineCard";
import { SafetyDisclaimer } from "./SafetyDisclaimer";

interface ResultSectionProps {
  result: PrescriptionAnalysisResult;
  imagePreview: string;
  onReset: () => void;
}

export const ResultSection: React.FC<ResultSectionProps> = ({
  result,
  imagePreview,
  onReset,
}) => {
  const [copied, setCopied] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showFullImageModal, setShowFullImageModal] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const lines = [
      "MediSimplify Prescription Summary",
      `Analyzed: ${new Date(result.analyzed_at).toLocaleString()}`,
      `Overview: ${result.prescription_summary}`,
      "",
      "MEDICINES DETECTED:",
      ...result.medicines.map((m, i) => {
        return `[${i + 1}] ${m.medicine_name_normalized} (${m.strength})\n    Dose: ${m.amount} ${m.unit} | Freq: ${m.frequency_normalized} | Duration: ${m.duration || "N/A"}\n    Instruction: ${m.patient_instruction}`;
      }),
      "",
      "DISCLAIMER: This tool is for prescription understanding only and is not medical advice.",
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasUncertainItems = result.medicines.some(
    (m) => m.confidence_level === "review_required" || m.is_unknown_or_unclear
  );

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      {/* Top Action Bar (hidden in print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 px-3 py-2 rounded-xl hover:bg-slate-100 transition cursor-pointer self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          Analyze Another Prescription
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopySummary}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition border border-slate-200 cursor-pointer"
            title="Copy text summary to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-600" />
                <span>Copy Summary</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 transition shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report / PDF</span>
          </button>
        </div>
      </div>

      {/* Main Analysis Overview Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                Prescription Analysis Report
              </span>
              <span className="text-xs text-slate-400">
                {new Date(result.analyzed_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Extracted Prescription Overview
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {hasUncertainItems ? (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold">
                <AlertCircle className="w-4 h-4 text-amber-700" />
                <span>1 or more items require review</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>All medicines verified</span>
              </div>
            )}
          </div>
        </div>

        <p className="text-sm sm:text-base text-slate-700 leading-relaxed max-w-3xl">
          {result.prescription_summary}
        </p>

        {result.overall_notes && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
            <strong className="text-slate-800">Clinical Observations:</strong> {result.overall_notes}
          </div>
        )}
      </div>

      {/* Side-by-Side: Original Prescription vs Extracted Data */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Original Prescription Image Inspector */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3 sticky top-24">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Original Prescription Image
                </h3>
              </div>

              {/* Zoom controls */}
              <div className="no-print flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.2))}
                  className="p-1 hover:bg-white rounded text-slate-600 transition cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(1)}
                  className="px-1.5 py-0.5 text-[10px] font-bold text-slate-600 hover:bg-white rounded transition cursor-pointer"
                  title="Reset Zoom"
                >
                  {Math.round(zoomLevel * 100)}%
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(2.0, z + 0.2))}
                  className="p-1 hover:bg-white rounded text-slate-600 transition cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowFullImageModal(true)}
                  className="p-1 hover:bg-white rounded text-slate-600 transition cursor-pointer ml-1"
                  title="Full View"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Image viewport */}
            <div className="relative overflow-auto rounded-2xl bg-slate-950/5 border border-slate-200 max-h-[520px] flex items-center justify-center p-2">
              <img
                src={imagePreview}
                alt="Uploaded Original Prescription"
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: "top center" }}
                className="w-full h-auto object-contain transition-transform duration-200 rounded-lg"
              />
            </div>

            <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
              <span>Single Source of Truth</span>
              <span className="capitalize">
                Legibility: <strong className="text-slate-700">{result.legibility_assessment.replace(/_/g, " ")}</strong>
              </span>
            </div>

            {/* Detected raw OCR lines list */}
            {result.raw_lines_detected && result.raw_lines_detected.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  OCR Detected Lines
                </div>
                <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                  {result.raw_lines_detected.map((line, idx) => (
                    <div
                      key={idx}
                      className="text-xs font-mono bg-slate-50 px-2.5 py-1 rounded border border-slate-200/70 text-slate-700 truncate"
                    >
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Medicine Cards & Details */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                Identified Medicines ({result.medicines.length})
              </h3>
            </div>
            <span className="text-xs text-slate-500">
              Verified with clinical safety rules
            </span>
          </div>

          {/* Partial Result Warning Banner */}
          {result.partial_warning && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs sm:text-sm flex items-start gap-3 shadow-xs">
              <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-amber-900 block mb-0.5">Review Required For Some Items</strong>
                <span>{result.partial_warning}</span>
              </div>
            </div>
          )}

          {result.medicines.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800">
                No prescription lines detected
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Prescription image was difficult to read or did not contain readable medication items. Please try uploading a clearer, higher resolution photo.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {result.medicines.map((med, index) => (
                <div key={med.id || index} className="break-inside-avoid">
                  <MedicineCard medicine={med} index={index} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Safety Disclaimer at Bottom */}
      <div className="pt-4">
        <SafetyDisclaimer />
      </div>

      {/* Full Image Modal */}
      {showFullImageModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowFullImageModal(false)}
        >
          <div className="relative max-w-5xl max-h-[90vh] bg-white rounded-2xl overflow-hidden p-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 mb-2">
              <span className="font-bold text-sm text-slate-800">Original Prescription Full View</span>
              <button
                type="button"
                onClick={() => setShowFullImageModal(false)}
                className="text-xs font-semibold px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
            <img
              src={imagePreview}
              alt="Prescription full preview"
              className="max-h-[80vh] w-auto object-contain mx-auto rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};
