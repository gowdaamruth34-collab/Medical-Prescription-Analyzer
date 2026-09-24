/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Navbar } from "./components/Navbar";
import { UploadSection } from "./components/UploadSection";
import { AnalysisProgress } from "./components/AnalysisProgress";
import { ResultSection } from "./components/ResultSection";
import { AbbreviationGuideModal } from "./components/AbbreviationGuideModal";
import { SafetyDisclaimer } from "./components/SafetyDisclaimer";
import { PrescriptionAnalysisResult, AnalysisErrorCode } from "./types";
import { AlertCircle, RefreshCw, Sparkles, ShieldCheck, ImageOff, FileQuestion, WifiOff } from "lucide-react";
import { scrollToTopSlow } from "./utils/scrollUtils";

export default function App() {
  const [status, setStatus] = useState<"idle" | "analyzing" | "result" | "error">("idle");
  const [analysisResult, setAnalysisResult] = useState<PrescriptionAnalysisResult | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<AnalysisErrorCode | null>(null);
  const [errorSuggestion, setErrorSuggestion] = useState<string | null>(null);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);

  const handleAnalyze = async (base64: string, mimeType: string, previewUrl: string) => {
    // Automatically scroll window up so user sees "Analyzing Your Prescription" right at the top
    scrollToTopSlow(350);

    setStatus("analyzing");
    setImagePreview(previewUrl);
    setErrorMessage(null);
    setErrorCode(null);
    setErrorSuggestion(null);

    // Minimum animation window (~12s) so all 5 steps are comfortably read at a relaxed pace
    const minAnimationDelay = new Promise((resolve) => setTimeout(resolve, 12000));

    try {
      const fetchPromise = fetch("/api/analyze-prescription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType,
        }),
      });

      const [response] = await Promise.all([fetchPromise, minAnimationDelay]);
      const data = await response.json();

      if (!response.ok) {
        setErrorCode(data.errorCode || "API_ERROR");
        setErrorSuggestion(data.suggestion || null);
        throw new Error(
          data.error ||
          "We couldn't analyze the prescription right now. Please try again."
        );
      }

      setAnalysisResult(data);
      setStatus("result");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      console.error("Prescription analysis error:", err);
      setErrorMessage(
        err.message ||
        "We couldn't analyze the prescription right now. Please try again."
      );
      setStatus("error");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleReset = () => {
    setStatus("idle");
    setAnalysisResult(null);
    setImagePreview(null);
    setErrorMessage(null);
    setErrorCode(null);
    setErrorSuggestion(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-teal-100 selection:text-teal-900">
      {/* Top Professional Header */}
      <Navbar
        onOpenGlossary={() => setIsGlossaryOpen(true)}
        onReset={handleReset}
      />

      {/* Main View Area */}
      <main
        className={`flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center ${
          status === "analyzing" ? "pt-2 sm:pt-4 pb-12" : "py-8 sm:py-12"
        }`}
      >
        {/* State 1: Uploading / Idle */}
        {status === "idle" && (
          <div className="w-full space-y-12 animate-in fade-in duration-300">
            <UploadSection
              onAnalyze={handleAnalyze}
              isLoading={false}
            />
            <div className="w-full max-w-4xl mx-auto">
              <SafetyDisclaimer />
            </div>
          </div>
        )}

        {/* State 2: Active Analysis Progress (5 stages) */}
        {status === "analyzing" && (
          <div className="w-full animate-in fade-in duration-300">
            <AnalysisProgress />
          </div>
        )}

        {/* State 3: Analysis Results */}
        {status === "result" && analysisResult && imagePreview && (
          <div className="w-full animate-in fade-in duration-300">
            <ResultSection
              result={analysisResult}
              imagePreview={imagePreview}
              onReset={handleReset}
            />
          </div>
        )}

        {/* State 4: Error Handling */}
        {status === "error" && (
          <div className="w-full max-w-lg mx-auto bg-white rounded-3xl border border-rose-200 p-8 text-center space-y-5 shadow-sm">
            {/* Contextual Icon based on specific error code */}
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
              {errorCode === "INVALID_IMAGE" ? (
                <ImageOff className="w-7 h-7" />
              ) : errorCode === "NO_PRESCRIPTION_TEXT" ? (
                <FileQuestion className="w-7 h-7" />
              ) : errorCode === "API_ERROR" ? (
                <WifiOff className="w-7 h-7" />
              ) : (
                <AlertCircle className="w-7 h-7" />
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900">
                {errorCode === "INVALID_IMAGE"
                  ? "Unable to Read Image"
                  : errorCode === "NO_PRESCRIPTION_TEXT"
                  ? "No Prescription Details Found"
                  : errorCode === "API_ERROR"
                  ? "Analysis Service Unavailable"
                  : "Prescription Analysis Unsuccessful"}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {errorMessage}
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl text-xs text-slate-600 text-left border border-slate-200 space-y-1.5">
              <strong className="text-slate-800 block">Next Steps:</strong>
              {errorSuggestion ? (
                <p>{errorSuggestion}</p>
              ) : (
                <ul className="list-disc pl-4 space-y-1 text-slate-500">
                  <li>Ensure the prescription slip is laid flat under bright, even lighting.</li>
                  <li>Avoid blurry captures or harsh shadows over doctor handwriting.</li>
                  <li>Make sure the Rx symbol and medicine lines are clearly within view.</li>
                </ul>
              )}
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-sm font-semibold transition cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-4 h-4" />
              Try Another Image
            </button>
          </div>
        )}
      </main>

      {/* Prescription Abbreviations Reference Modal */}
      <AbbreviationGuideModal
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
      />

      {/* Footer */}
      <footer className="no-print mt-auto border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-medium text-slate-600">
            <ShieldCheck className="w-4 h-4 text-teal-700" />
            <span>MediSimplify · Medical Prescription Simplifier</span>
          </div>
          <div>
            <span>Strict Clinical Vision OCR · Uploaded image is the single source of truth</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
