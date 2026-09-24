/**
 * Generates realistic prescription slip images on a hidden canvas
 * and returns them as image/jpeg DataURLs so users can test the Vision OCR pipeline
 * with zero mocked data!
 */

export interface SamplePrescription {
  id: string;
  title: string;
  doctor: string;
  clinic: string;
  description: string;
  badge: string;
  lines: string[];
  notes?: string;
  isHandwritten?: boolean;
}

export const SAMPLE_PRESCRIPTIONS: SamplePrescription[] = [
  {
    id: "sample-ibu-panto-metro",
    title: "Ibuprofen, Pantoprazole & Metronidazole",
    doctor: "Dr. Evelyn Reed, MD (Internal Medicine)",
    clinic: "Metro Healthcare Clinic, Dept. of General Medicine",
    description: "Ibuprofen 400mg TDS, Pantoprazole 40mg OD, Metronidazole 400mg BD",
    badge: "Current Prescription",
    lines: [
      "Rx",
      "1. Ibuprofen 400 mg 1 tab TDS after food x 5 days",
      "2. Pantoprazole 40 mg 1 tab OD before food x 7 days",
      "3. Metronidazole 400 mg 1 tab BD after food x 5 days"
    ],
    notes: "Take Ibuprofen with food. Pantoprazole before breakfast. Avoid all alcohol with Metronidazole.",
    isHandwritten: false,
  },
  {
    id: "sample-clinical-standard",
    title: "Standard Prescription Test Case",
    doctor: "Dr. Evelyn Reed, MD (Internal Medicine)",
    clinic: "Metro Healthcare Clinic, Dept. of General Medicine",
    description: "Paracetamol, Amoxicillin & Cetirizine with dosage, frequency & duration",
    badge: "Official Test Case",
    lines: [
      "Rx",
      "1. Paracetamol 500 mg 1 tab BD after food X 5 days",
      "2. Amoxicillin 500 mg 1 cap TDS X 7 days",
      "3. Cetirizine 10 mg 1 tab OD at night X 5 days"
    ],
    notes: "Drink plenty of warm fluids. Complete antibiotic course. Take Cetirizine at night.",
    isHandwritten: false,
  },
  {
    id: "sample-fever",
    title: "Acute Care & GI Protection",
    doctor: "Dr. Marcus Vance, MD",
    clinic: "St. Jude Medical Center",
    description: "Paracetamol 500mg & Pantoprazole 40mg with food timings",
    badge: "Clear Print",
    lines: [
      "Rx",
      "1. Paracetamol 500 mg 1 tab BD after food x 5 days",
      "2. Pantoprazole 40 mg 1 tab OD before food x 5 days"
    ],
    notes: "Drink plenty of warm fluids. Return if fever persists > 3 days.",
    isHandwritten: false,
  },
  {
    id: "sample-ocr-typo",
    title: "OCR Typo Normalization Test",
    doctor: "Dr. Anita Desai, MBBS, MD",
    clinic: "Sunrise Family Practice",
    description: "Minor typo ('Amoxcillin') safely normalized to Amoxicillin",
    badge: "Typo Normalization",
    lines: [
      "Rx",
      "1. Amoxcillin 500 mg 1 cap TDS x 7 days"
    ],
    notes: "Take with full glass of water.",
    isHandwritten: true,
  },
  {
    id: "sample-unclear",
    title: "Unclear Handwriting Safety Test",
    doctor: "Dr. Arthur Bell, MD",
    clinic: "Apex Specialty Clinic",
    description: "Contains truncated drug name ('Amben...') to verify REVIEW REQUIRED safety rule",
    badge: "Review Required",
    lines: [
      "Rx",
      "1. Paracetamol 500 mg 1 tab BD after food x 5 days",
      "2. Amben... 10 mg 1 tab BD x 5 days"
    ],
    notes: "Follow up in 1 week.",
    isHandwritten: true,
  },
];

export function generatePrescriptionImage(sample: SamplePrescription): string {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 800;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // Prescription paper texture background
  ctx.fillStyle = "#fafaf9";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle paper border
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 4;
  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

  // Clinic Header Banner
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 32px 'Plus Jakarta Sans', Arial, sans-serif";
  ctx.fillText(sample.clinic, 70, 90);

  ctx.fillStyle = "#475569";
  ctx.font = "20px 'Plus Jakarta Sans', Arial, sans-serif";
  ctx.fillText(sample.doctor, 70, 130);
  ctx.fillText("Reg. No: MED-8849201 · Date: 19-Sep-2026", 70, 160);

  // Decorative divider
  ctx.strokeStyle = "#0284c7";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(70, 185);
  ctx.lineTo(1130, 185);
  ctx.stroke();

  // Patient Info Bar
  ctx.fillStyle = "#f1f5f9";
  ctx.fillRect(70, 205, 1060, 50);
  ctx.fillStyle = "#334155";
  ctx.font = "18px 'Plus Jakarta Sans', Arial, sans-serif";
  ctx.fillText("Patient: John Doe, 42 Yrs, Male     |     BP: 120/80 mmHg     |     Weight: 72 kg", 90, 237);

  // Prescription Rx Symbol
  ctx.fillStyle = "#0369a1";
  ctx.font = "bold 56px 'Lora', serif";
  ctx.fillText("℞", 70, 330);

  // Prescription Lines
  let startY = 340;
  sample.lines.forEach((line) => {
    if (line === "Rx") return;
    
    if (sample.isHandwritten) {
      // Stylized handwriting look
      ctx.fillStyle = "#1e293b";
      ctx.font = "italic 32px 'Lora', Georgia, serif";
      ctx.fillText(line, 140, startY);
    } else {
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 26px 'Plus Jakarta Sans', monospace, sans-serif";
      ctx.fillText(line, 140, startY);
    }
    startY += 65;
  });

  // Notes section
  if (sample.notes) {
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(70, 580);
    ctx.lineTo(1130, 580);
    ctx.stroke();

    ctx.fillStyle = "#64748b";
    ctx.font = "bold 16px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("DIRECTIONS / ADVICE:", 70, 615);

    ctx.fillStyle = "#334155";
    ctx.font = "18px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(sample.notes, 70, 650);
  }

  // Doctor Signature Stamp
  ctx.fillStyle = "#64748b";
  ctx.font = "16px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText("Physician Signature:", 850, 710);

  ctx.strokeStyle = "#0284c7";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(850, 720);
  // stylized scribble signature
  ctx.bezierCurveTo(880, 680, 930, 750, 980, 690);
  ctx.bezierCurveTo(1000, 680, 1020, 730, 1060, 700);
  ctx.stroke();

  return canvas.toDataURL("image/jpeg", 0.92);
}
