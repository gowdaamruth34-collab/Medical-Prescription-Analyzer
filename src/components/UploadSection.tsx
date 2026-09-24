import React, { useRef, useState } from "react";
import {
  UploadCloud,
  FileImage,
  Sparkles,
  Camera,
  RefreshCw,
  Info,
  CheckCircle2,
  AlertCircle,
  Eye,
} from "lucide-react";
import {
  SAMPLE_PRESCRIPTIONS,
  SamplePrescription,
  generatePrescriptionImage,
} from "../utils/samplePrescriptions";
import { scrollToTopSlow } from "../utils/scrollUtils";

interface UploadSectionProps {
  onAnalyze: (base64: string, mimeType: string, previewUrl: string) => void;
  isLoading: boolean;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  onAnalyze,
  isLoading,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("image/jpeg");
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeSampleTitle, setActiveSampleTitle] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = (file: File) => {
    setUploadError(null);
    setActiveSampleTitle(null);

    // Validate mime type or extension
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/heif"];
    const fileExt = file.name.split('.').pop()?.toLowerCase() || "";
    const validExts = ["jpg", "jpeg", "png", "webp", "heic"];

    const isTypeValid = validTypes.includes(file.type.toLowerCase()) || validExts.includes(fileExt);

    if (!isTypeValid) {
      setUploadError("Please upload a prescription image in JPG, JPEG, PNG, or WEBP format.");
      return;
    }

    // Validate size (must be > 0 and max 20MB)
    if (file.size === 0) {
      setUploadError("The selected file is empty. Please choose a valid image.");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setUploadError("Image size exceeds 20MB. Please upload a smaller photo.");
      return;
    }

    setSelectedFile(file);
    setMimeType(file.type || "image/jpeg");

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.onerror = () => {
      setUploadError("Failed to read image file. Please try another.");
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleSelectSample = (sample: SamplePrescription) => {
    setUploadError(null);
    setActiveSampleTitle(sample.title);
    const dataUrl = generatePrescriptionImage(sample);
    setImagePreview(dataUrl);
    setMimeType("image/jpeg");
    setSelectedFile(null);
  };

  const handleResetImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setActiveSampleTitle(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleStartAnalysis = () => {
    if (!imagePreview) {
      setUploadError("Please select or upload a prescription image first.");
      return;
    }
    scrollToTopSlow(350);
    onAnalyze(imagePreview, mimeType, imagePreview);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Title & Tagline */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          MediSimplify
        </h1>
        <p className="text-base sm:text-lg text-slate-600 font-medium max-w-xl mx-auto">
          &ldquo;Understand your prescription. Take your medicines with confidence.&rdquo;
        </p>
      </div>

      {/* Main Upload Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
          className="hidden"
          onChange={handleFileInputChange}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileInputChange}
        />

        {/* Drop Zone / Preview */}
        {!imagePreview ? (
          <div
            id="prescription-dropzone"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
              isDragOver
                ? "border-teal-500 bg-teal-50/50"
                : "border-slate-300 hover:border-teal-400 bg-slate-50/60 hover:bg-slate-50"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mb-4 border border-teal-200">
              <UploadCloud className="w-8 h-8 text-teal-700" />
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-1">
              Drag & Drop your prescription photo here
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mb-6">
              Supports handwritten or printed prescriptions. Accepts JPG, JPEG, PNG, and WEBP files up to 20MB.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                id="browse-upload-button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-sm font-semibold shadow-xs transition cursor-pointer"
              >
                <FileImage className="w-4 h-4" />
                Browse Files
              </button>

              <button
                type="button"
                id="camera-snap-button"
                onClick={() => cameraInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-sm font-semibold transition cursor-pointer"
              >
                <Camera className="w-4 h-4 text-slate-600" />
                Take Photo
              </button>
            </div>
          </div>
        ) : (
          /* Image Preview Container */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-800">
                  Prescription Ready for Analysis
                </span>
                {activeSampleTitle && (
                  <span className="text-xs font-semibold text-teal-800 bg-teal-100 px-2.5 py-0.5 rounded-full">
                    {activeSampleTitle}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleResetImage}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Change Image
              </button>
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 max-h-96 flex items-center justify-center">
              <img
                src={imagePreview}
                alt="Prescription preview"
                className="w-full h-auto object-contain max-h-96"
              />
            </div>

            {/* Action Bar */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-teal-700 shrink-0" />
                <span>Gemini Vision will extract lines and cross-verify with drug safety standards.</span>
              </div>

              <button
                type="button"
                id="analyze-prescription-btn"
                onClick={handleStartAnalysis}
                disabled={isLoading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-base font-bold shadow-sm transition disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-5 h-5 text-teal-200" />
                Analyze Prescription
              </button>
            </div>
          </div>
        )}

        {/* Error message */}
        {uploadError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}
      </div>

      {/* Preset Test Cases Banner */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-5 sm:p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Or Try Real Clinical Sample Prescriptions
            </h3>
            <span className="text-[11px] font-semibold text-slate-600 bg-slate-200/70 px-2 py-0.5 rounded-full">
              Instant Test
            </span>
          </div>
          <span className="text-xs text-slate-500 hidden sm:inline">
            Generates actual prescription images for Vision OCR
          </span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Test MediSimplify with various clinical scenarios. These create real images that pass through the exact Gemini Vision OCR & verification pipeline:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {SAMPLE_PRESCRIPTIONS.map((sample) => (
            <button
              key={sample.id}
              type="button"
              id={`sample-btn-${sample.id}`}
              onClick={() => handleSelectSample(sample)}
              className={`p-3.5 rounded-xl text-left border transition bg-white hover:border-teal-400 hover:shadow-xs flex flex-col justify-between cursor-pointer ${
                activeSampleTitle === sample.title
                  ? "border-teal-600 ring-2 ring-teal-100"
                  : "border-slate-200"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-xs font-bold text-slate-900 line-clamp-1">
                    {sample.title}
                  </span>
                  <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded-sm shrink-0">
                    {sample.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2">
                  {sample.description}
                </p>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-teal-700 font-semibold">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  Load Sample
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
