export type ConfidenceLevel = 'high' | 'medium' | 'review_required';

export type VerificationStatus = 'verified' | 'probable_correction' | 'review_required';

export type AnalysisErrorCode = 'INVALID_IMAGE' | 'NO_PRESCRIPTION_TEXT' | 'API_ERROR' | 'PARTIAL_RESULT';

export interface VerifiedDrugInformation {
  source_status: 'verified' | 'unavailable';
  source_name: string;
  purpose: string[];
  common_side_effects: string[];
  important_warnings: string[];
  notable_interactions: string[];
}

export interface DrugInfo {
  purpose: string | string[];
  common_side_effects: string[];
  important_warnings: string[];
  known_interactions: string[];
}

export interface MedicineItem {
  id: string;
  original_text: string;
  medicine_name_raw: string;
  medicine_name_normalized: string;
  strength: string;
  amount: number;
  unit: string;
  dosage_form: string;
  frequency_raw: string;
  frequency_normalized: string;
  timing: string;
  food_instruction: string;
  duration: string;
  confidence: number;
  confidence_level: ConfidenceLevel;
  verification_status: VerificationStatus;
  uncertainty_reason: string;
  patient_instruction: string;
  drug_information?: VerifiedDrugInformation;
  drug_info?: DrugInfo;
  is_unknown_or_unclear: boolean;
  correction_made: boolean;
}

export interface PrescriptionAnalysisResult {
  success: boolean;
  raw_text: string;
  prescription_summary: string;
  legibility_assessment: 'clear' | 'partially_clear' | 'difficult_to_read';
  medicines: MedicineItem[];
  overall_notes?: string;
  raw_lines_detected?: string[];
  partial_warning?: string;
  has_unclear_medicines?: boolean;
  analyzed_at: string;
}

export interface AnalysisErrorResponse {
  error: string;
  errorCode?: AnalysisErrorCode;
  details?: string;
  suggestion?: string;
}

