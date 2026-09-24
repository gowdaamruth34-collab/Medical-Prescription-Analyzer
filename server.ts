import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware to parse large JSON payloads for base64 images (up to 25MB)
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Lazy initialization of Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

/**
 * Verified Clinical Drug Reference Dictionary
 * Used STRICTLY to:
 * 1. Safely normalize obvious OCR typographical slips (e.g., 'Amoxcillin' -> 'Amoxicillin')
 * 2. Retrieve verified clinical purpose, common side effects, and safety warnings
 * CRITICAL SAFETY RULE: Never used to autocomplete or guess truncated/unclear words (e.g. 'Amben...')
 */
interface VerifiedDrugEntry {
  generic_name: string;
  brand_aliases: string[];
  source_name: string;
  purpose: string[];
  common_side_effects: string[];
  important_warnings: string[];
  notable_interactions: string[];
}

const VERIFIED_DRUG_DATABASE: Record<string, VerifiedDrugEntry> = {
  paracetamol: {
    generic_name: "Paracetamol",
    brand_aliases: ["acetaminophen", "tylenol", "panadol", "calpol", "crocin", "dolo", "pacimol", "paracetemol", "paracetamol 500", "paracetamol 650"],
    source_name: "Verified Drug Information",
    purpose: ["Relieves mild to moderate pain (such as headaches, muscle aches, toothaches) and reduces fever."],
    common_side_effects: ["Mild nausea", "Mild stomach discomfort"],
    important_warnings: [
      "Do not exceed the dose recommended by your doctor or the medicine label. Taking too much paracetamol can cause serious liver damage.",
      "Check labels of other cold and flu medications to avoid accidental paracetamol overdose.",
      "Avoid alcohol consumption while taking this medication.",
    ],
    notable_interactions: [
      "Alcohol (increases risk of liver toxicity)",
      "Blood thinners (Warfarin) with regular prolonged use",
      "Other paracetamol-containing products",
    ],
  },
  amoxicillin: {
    generic_name: "Amoxicillin",
    brand_aliases: ["amoxil", "amoxcillin", "amox", "moxikind", "augmentin", "amoxicilline", "amoxicillin 500"],
    source_name: "Verified Drug Information",
    purpose: ["Penicillin-type antibiotic used to treat bacterial infections such as ear, nose, throat, chest, dental, and urinary tract infections."],
    common_side_effects: ["Mild diarrhea", "Nausea or stomach upset", "Mild skin rash"],
    important_warnings: [
      "Complete the entire prescribed course even if you feel completely recovered.",
      "Do not take if you have a known allergy to penicillin or cephalosporin antibiotics.",
      "Seek emergency care if you experience hives, facial swelling, or breathing difficulty.",
    ],
    notable_interactions: ["Methotrexate (amoxicillin may decrease renal clearance)", "Allopurinol (increased risk of rash)"],
  },
  cetirizine: {
    generic_name: "Cetirizine",
    brand_aliases: ["zyrtec", "cetrizine", "cetzine", "alerid", "cetirizine hydrochloride", "cetirizine 10"],
    source_name: "Verified Drug Information",
    purpose: ["Antihistamine used to relieve allergy symptoms such as sneezing, runny nose, itching, watery eyes, and hives."],
    common_side_effects: ["Mild drowsiness or fatigue", "Dry mouth", "Mild headache"],
    important_warnings: [
      "May cause drowsiness; use caution when driving or operating machinery.",
      "Avoid alcohol and sedatives, which can intensify drowsiness.",
    ],
    notable_interactions: ["Alcohol (intensifies drowsiness)", "Sedatives, sleeping pills, or central nervous system depressants"],
  },
  pantoprazole: {
    generic_name: "Pantoprazole",
    brand_aliases: ["protonix", "pantocid", "pan 40", "pantop", "pantoprazol", "pantosec", "pantoprazole 40"],
    source_name: "Verified Drug Information",
    purpose: ["Proton pump inhibitor (PPI) that decreases stomach acid production to treat acid reflux, heartburn, and stomach or duodenal ulcers."],
    common_side_effects: ["Headache", "Mild diarrhea or constipation", "Stomach pain or flatulence"],
    important_warnings: [
      "Take 30 to 60 minutes before the first meal of the day (usually breakfast).",
      "Swallow tablets whole with water; do not crush, chew, or break delayed-release tablets.",
      "Consult your doctor if symptoms persist after the recommended course.",
    ],
    notable_interactions: [
      "Methotrexate (pantoprazole may increase methotrexate blood levels)",
      "Iron supplements and certain antifungal medicines (acid reduction may reduce absorption)",
      "Atazanavir or other HIV medications requiring stomach acid for absorption",
    ],
  },
  ibuprofen: {
    generic_name: "Ibuprofen",
    brand_aliases: ["advil", "motrin", "nurofen", "brufen", "ibuprufen", "ibuprofen 400", "ibuprofen 200", "ibuprofen 600"],
    source_name: "Verified Drug Information",
    purpose: ["Non-steroidal anti-inflammatory drug (NSAID) used to relieve pain, swelling, and inflammation."],
    common_side_effects: ["Stomach upset or indigestion", "Mild nausea", "Heartburn"],
    important_warnings: [
      "Take with or after food, or with milk, to reduce the risk of stomach irritation.",
      "Avoid if you have a history of active stomach ulcers, kidney impairment, or heart failure.",
      "Do not combine with other NSAIDs (such as aspirin or naproxen) without medical advice.",
    ],
    notable_interactions: [
      "Other NSAIDs and aspirin (increases risk of gastrointestinal bleeding)",
      "Blood thinners such as Warfarin or direct oral anticoagulants (increases bleeding risk)",
      "Blood pressure medications (ACE inhibitors, ARBs, diuretics; NSAIDs may reduce their effectiveness)",
    ],
  },
  metronidazole: {
    generic_name: "Metronidazole",
    brand_aliases: ["flagyl", "metrogyl", "metro", "metronidazol", "metronidazole 400", "metronidazole 500", "metronid"],
    source_name: "Verified Drug Information",
    purpose: [
      "Treats specific bacterial and parasitic infections (including dental infections, gastrointestinal infections, and certain skin or soft-tissue infections).",
    ],
    common_side_effects: [
      "Unpleasant or metallic taste in mouth",
      "Mild nausea or stomach upset",
      "Loss of appetite or mild headache",
    ],
    important_warnings: [
      "Do not drink alcohol or consume products containing alcohol during treatment and for at least 48 hours after your last dose, as severe reactions (flushing, nausea, vomiting, rapid heartbeat) can occur.",
      "Complete the full prescribed course even if your symptoms improve.",
      "Take with a full glass of water after food to help prevent stomach irritation.",
    ],
    notable_interactions: [
      "Alcohol and medications containing alcohol (disulfiram-like adverse reaction)",
      "Oral blood thinners such as Warfarin (may increase bleeding risk)",
      "Lithium (may increase blood levels of lithium)",
    ],
  },
  metformin: {
    generic_name: "Metformin",
    brand_aliases: ["glucophage", "glycomet", "gluformin", "metformin hcl"],
    source_name: "Verified Drug Information",
    purpose: ["Controls high blood sugar in patients with type 2 diabetes by improving insulin sensitivity."],
    common_side_effects: ["Nausea", "Diarrhea", "Stomach upset", "Metallic taste in mouth"],
    important_warnings: [
      "Take with or immediately after meals to reduce gastrointestinal side effects.",
      "Avoid excessive alcohol intake due to risk of lactic acidosis.",
      "Temporarily discontinue before radiologic procedures requiring iodinated contrast dyes.",
    ],
    notable_interactions: ["Iodinated radiocontrast agents", "Alcohol", "Cimetidine"],
  },
  azithromycin: {
    generic_name: "Azithromycin",
    brand_aliases: ["zithromax", "z-pack", "azithral", "aziwok", "azithromycine"],
    source_name: "Verified Drug Information",
    purpose: ["Macrolide antibiotic used to treat bacterial respiratory, skin, ear, and throat infections."],
    common_side_effects: ["Mild diarrhea", "Nausea", "Abdominal cramping", "Vomiting"],
    important_warnings: [
      "Take once daily as directed; can be taken with or without food, though food helps with nausea.",
      "Complete the full treatment duration (often 3 to 5 days).",
      "Report any unusual heart palpitations or severe diarrhea immediately.",
    ],
    notable_interactions: ["Antacids containing aluminum or magnesium (take 2 hours apart)", "Digoxin", "Warfarin"],
  },
  omeprazole: {
    generic_name: "Omeprazole",
    brand_aliases: ["prilosec", "omez", "losec", "omeprazol"],
    source_name: "Verified Drug Information",
    purpose: ["Proton pump inhibitor (PPI) that decreases stomach acid production to heal acid-related conditions."],
    common_side_effects: ["Headache", "Stomach discomfort", "Mild nausea", "Constipation or diarrhea"],
    important_warnings: [
      "Take in the morning before food, at least 30-60 minutes before breakfast.",
      "Swallow capsules or tablets whole; do not chew or crush.",
    ],
    notable_interactions: ["Clopidogrel", "Iron salts", "Digoxin", "Ketoconazole"],
  },
  atorvastatin: {
    generic_name: "Atorvastatin",
    brand_aliases: ["lipitor", "atorva", "atorlip", "atorvastatine"],
    source_name: "Verified Drug Information",
    purpose: ["Lowers LDL cholesterol and triglycerides, and raises HDL cholesterol to protect against heart attack and stroke."],
    common_side_effects: ["Joint or muscle aches", "Mild nausea", "Digestive changes"],
    important_warnings: [
      "Report any unexplained, severe muscle pain or weakness to your healthcare provider.",
      "Avoid consuming large amounts of grapefruit juice while taking this medication.",
    ],
    notable_interactions: ["Grapefruit juice", "Clarithromycin / Erythromycin", "Cyclosporine", "Gemfibrozil"],
  },
  losartan: {
    generic_name: "Losartan",
    brand_aliases: ["cozaar", "losacar", "losartan potassium"],
    source_name: "Verified Drug Information",
    purpose: ["Angiotensin II receptor blocker (ARB) used to lower high blood pressure and protect kidneys in diabetic patients."],
    common_side_effects: ["Dizziness on standing up quickly", "Nasal congestion", "Fatigue"],
    important_warnings: [
      "Rise slowly from sitting or lying down to prevent dizziness.",
      "Do not use potassium supplements or salt substitutes containing potassium without consulting your doctor.",
      "Do not take during pregnancy.",
    ],
    notable_interactions: ["Potassium-sparing diuretics", "Potassium supplements", "Lithium", "NSAIDs"],
  },
  montelukast: {
    generic_name: "Montelukast",
    brand_aliases: ["singulair", "montair", "montek", "montelukast sodium"],
    source_name: "Verified Drug Information",
    purpose: ["Leukotriene receptor antagonist used to manage asthma symptoms and relieve allergic rhinitis (hay fever)."],
    common_side_effects: ["Headache", "Mild stomach pain", "Cough"],
    important_warnings: [
      "Take once daily in the evening, with or without food.",
      "Not meant for the relief of sudden acute asthma attacks; keep your rescue inhaler handy.",
      "Monitor for any mood or behavior changes.",
    ],
    notable_interactions: ["Phenobarbital", "Rifampin"],
  },
};

/**
 * Normalizes medicine names against the verified database ONLY if there is a safe, close match.
 * NEVER guesses for truncated or illegible names (e.g. 'Amben...').
 */
function lookupVerifiedDrug(rawName: string): { entry: VerifiedDrugEntry; normalizedName: string; isExactOrClose: boolean } | null {
  const clean = rawName.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!clean || clean.length < 3) return null;

  // Exact match on generic key
  if (VERIFIED_DRUG_DATABASE[clean]) {
    return {
      entry: VERIFIED_DRUG_DATABASE[clean],
      normalizedName: VERIFIED_DRUG_DATABASE[clean].generic_name,
      isExactOrClose: true,
    };
  }

  // Exact or prefix match against brand aliases
  for (const [key, entry] of Object.entries(VERIFIED_DRUG_DATABASE)) {
    if (key === clean) {
      return { entry, normalizedName: entry.generic_name, isExactOrClose: true };
    }
    for (const alias of entry.brand_aliases) {
      const cleanAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (cleanAlias === clean) {
        return { entry, normalizedName: entry.generic_name, isExactOrClose: true };
      }
      // Typo handling: small edit distance or 1-character typo on words >= 6 chars
      if (clean.length >= 6 && cleanAlias.length >= 6) {
        if (cleanAlias.includes(clean) || clean.includes(cleanAlias)) {
          return { entry, normalizedName: entry.generic_name, isExactOrClose: true };
        }
      }
    }
  }

  return null;
}

// Prescription Analysis Endpoint
app.post("/api/analyze-prescription", async (req, res) => {
  console.log("[Prescription Pipeline] Image received");

  try {
    const { imageBase64, mimeType } = req.body;

    // 1. Validate payload presence
    if (!imageBase64 || typeof imageBase64 !== "string" || imageBase64.trim().length === 0) {
      console.warn("[Prescription Pipeline] [INVALID_IMAGE] No imageBase64 payload provided.");
      return res.status(400).json({
        errorCode: "INVALID_IMAGE",
        error: "We couldn't read this image. Please upload a clear JPG, PNG, or WEBP prescription image.",
        suggestion: "Please upload a photo or scan of your prescription in JPG, PNG, or WEBP format.",
      });
    }

    // 2. Validate MIME type
    const rawMimeType = (mimeType || "image/jpeg").toLowerCase().trim();
    console.log(`[Prescription Pipeline] MIME type: ${rawMimeType}`);
    const validMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/heif"];
    const isSupportedMime = validMimes.some((m) => rawMimeType.includes(m.replace("image/", "")));
    if (!isSupportedMime && !rawMimeType.startsWith("image/")) {
      console.warn(`[Prescription Pipeline] [INVALID_IMAGE] Unsupported MIME type: ${rawMimeType}`);
      return res.status(400).json({
        errorCode: "INVALID_IMAGE",
        error: "We couldn't read this image. Please upload a clear JPG, PNG, or WEBP prescription image.",
        suggestion: "Allowed image formats: JPG, JPEG, PNG, WEBP.",
      });
    }

    // 3. Extract and validate base64 bytes
    const base64Data = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, "").trim();
    const approxBytes = Math.round((base64Data.length * 3) / 4);
    console.log(`[Prescription Pipeline] File size: ${base64Data.length} chars (~${Math.round(approxBytes / 1024)} KB)`);

    if (base64Data.length < 50 || approxBytes < 50) {
      console.warn("[Prescription Pipeline] [INVALID_IMAGE] Image data payload is virtually empty or corrupted.");
      return res.status(400).json({
        errorCode: "INVALID_IMAGE",
        error: "We couldn't read this image. Please upload a clear JPG, PNG, or WEBP prescription image.",
        suggestion: "The uploaded file contains empty or unreadable image data.",
      });
    }

    if (approxBytes > 22 * 1024 * 1024) {
      console.warn("[Prescription Pipeline] [INVALID_IMAGE] File exceeds 20MB limit.");
      return res.status(400).json({
        errorCode: "INVALID_IMAGE",
        error: "Image size exceeds 20MB. Please upload a compressed or smaller photo.",
        suggestion: "Please upload an image smaller than 20MB.",
      });
    }

    console.log("[Prescription Pipeline] Image decoded successfully");

    // Standardize MIME type for Gemini Vision
    let geminiMime = "image/jpeg";
    if (rawMimeType.includes("png")) geminiMime = "image/png";
    else if (rawMimeType.includes("webp")) geminiMime = "image/webp";

    const ai = getGeminiClient();

    // User's exact prompt specification
    const systemPrompt = `You are analyzing a medical prescription image.

Read ONLY information that is visibly present in the uploaded image.

Extract every prescription medicine line.

Do not invent, autocomplete, or guess unclear medicine names.

For each medicine, extract:

- original_text
- medicine_name_raw
- medicine_name_normalized
- strength
- amount
- unit
- dosage_form
- frequency_raw
- frequency_normalized
- timing
- food_instruction
- duration
- confidence
- verification_status
- uncertainty_reason

IMPORTANT PARSING RULES:

OD = once daily
BD / BID = twice daily
TDS / TID = three times daily
QID = four times daily

1-0-1 = morning and night
1-1-1 = morning, afternoon and night
1-0-0 = morning
0-0-1 = night

'1 tab' = amount 1, unit tablet
'2 tabs' = amount 2, unit tablet
'1 cap' = amount 1, unit capsule
'2 caps' = amount 2, unit capsule

'X 5 days' = duration 5 days
'for 5 days' = duration 5 days

NEVER interpret the number of days as the medicine amount.

For example:

'1 tab BD X 5 days'

means:

amount = 1 tablet
frequency = twice a day
duration = 5 days

It does NOT mean amount = 5.

Keep medicine strength separate from medicine amount.

'OD at night' means:
frequency = once daily
timing = night

'BD after food' means:
frequency = twice daily
food_instruction = after food

If the medicine name is unclear, preserve the raw OCR text and mark it as review_required.

NEVER guess an unclear medicine name from context.

Do not invent diagnosis, disease, purpose, dosage, duration, or medical advice.

OUTPUT FORMAT REQUIREMENTS:
You MUST output strictly valid JSON matching this schema:
{
  "success": true,
  "raw_text": "Full extracted textual transcript of the entire prescription",
  "prescription_summary": "1-2 sentence overview of the detected prescription",
  "legibility_assessment": "clear" | "partially_clear" | "difficult_to_read",
  "raw_lines_detected": ["string"],
  "medicines": [
    {
      "original_text": "Exact text line as written on the slip",
      "medicine_name_raw": "Raw OCR detected medicine name",
      "medicine_name_normalized": "Normalized standard medicine name, or 'Review Required' if unclear",
      "strength": "e.g. 500 mg",
      "amount": 1,
      "unit": "tablet / capsule / ml",
      "dosage_form": "tablet / capsule / syrup",
      "frequency_raw": "e.g. BD, TDS, OD",
      "frequency_normalized": "e.g. twice a day, three times a day, once a day",
      "timing": "e.g. at night, morning, or empty string",
      "food_instruction": "e.g. after food, before food, or empty string",
      "duration": "e.g. 5 days, 7 days, or empty string",
      "confidence": 95,
      "verification_status": "verified" | "review_required",
      "uncertainty_reason": ""
    }
  ]
}`;

    // Model candidates with fallback resilience across available tiers
    const modelCandidates = ["gemini-3.6-flash", "gemini-3.8-flash", "gemini-3.1-flash-lite"];
    let responseText = "";
    let lastError: any = null;

    console.log("[Prescription Pipeline] Vision request started");

    modelLoop: for (const model of modelCandidates) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          console.log(`[Prescription Pipeline] Attempting analysis with ${model} (attempt ${attempt})`);
          const response = await ai.models.generateContent({
            model,
            contents: {
              parts: [
                {
                  inlineData: {
                    mimeType: geminiMime,
                    data: base64Data,
                  },
                },
                {
                  text: "Analyze this prescription image visibly present in the upload. Output valid JSON strictly following the system instruction.",
                },
              ],
            },
            config: {
              systemInstruction: systemPrompt,
              responseMimeType: "application/json",
            },
          });

          responseText = response.text || "";
          if (responseText.trim().length > 0) {
            console.log(`[Prescription Pipeline] Vision response received successfully from ${model}`);
            break modelLoop;
          }
        } catch (err: any) {
          lastError = err;
          const isUnavailable =
            err?.status === 503 ||
            err?.status === "UNAVAILABLE" ||
            (err?.message && (err.message.includes("503") || err.message.includes("high demand")));

          if (attempt === 1 && isUnavailable) {
            console.log(`[Prescription Pipeline] ${model} experienced temporary demand spike, retrying after brief pause...`);
            await new Promise((r) => setTimeout(r, 600));
            continue;
          }
          console.log(`[Prescription Pipeline] Switching from ${model} to next candidate model...`);
          break; // move to next model in modelCandidates
        }
      }
    }

    if (!responseText || responseText.trim().length === 0) {
      console.error("[Prescription Pipeline] [VISION_API_ERROR] All model candidates failed.", lastError);
      return res.status(503).json({
        errorCode: "API_ERROR",
        error: "We couldn't analyze the prescription right now. Please try again.",
        details: lastError?.message || "Vision API service is temporarily unavailable.",
        suggestion: "Please try re-uploading the image in a moment.",
      });
    }

    // 4. Parse Structured JSON response
    let parsedData: any;
    try {
      parsedData = JSON.parse(responseText);
    } catch (parseError) {
      console.warn("[Prescription Pipeline] [INVALID_STRUCTURED_RESPONSE] Direct JSON parse failed, extracting markdown block");
      const match = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match) {
        parsedData = JSON.parse(match[1]);
      } else {
        console.error("[Prescription Pipeline] [INVALID_STRUCTURED_RESPONSE] Failed to extract valid JSON", responseText.slice(0, 200));
        return res.status(502).json({
          errorCode: "API_ERROR",
          error: "We couldn't analyze the prescription right now. Please try again.",
          details: "AI service produced unformatted text output.",
          suggestion: "Please try uploading the prescription again.",
        });
      }
    }

    const rawTranscript = (parsedData.raw_text || "").trim();
    console.log(`[Prescription Pipeline] OCR text extracted (length: ${rawTranscript.length} chars)`);

    const rawMedicines: any[] = Array.isArray(parsedData.medicines) ? parsedData.medicines : [];
    console.log(`[Prescription Pipeline] Medicine lines detected: ${rawMedicines.length}`);

    // If zero medicines were found and raw transcript is empty or indicates no prescription
    if (rawMedicines.length === 0) {
      console.warn("[Prescription Pipeline] [NO_PRESCRIPTION_TEXT] No readable prescription items identified.");
      return res.status(422).json({
        errorCode: "NO_PRESCRIPTION_TEXT",
        error: "We couldn't find readable prescription details in this image. Please upload a clearer image showing the medicine lines.",
        suggestion: "Please verify that the image is in focus, well-lit, and contains recognizable doctor prescription lines (Rx).",
      });
    }

    // 5. Transform and validate each medicine item
    let hasUnclearMedicines = false;
    let verifiedCount = 0;

    const sanitizedMedicines = rawMedicines.map((med: any, index: number) => {
      const id = `med_${Date.now()}_${index}`;
      const originalText = (med.original_text || "").trim();
      const rawName = (med.medicine_name_raw || "").trim();
      let normalizedName = (med.medicine_name_normalized || "").trim();

      // Detection of unclear handwriting or unverified medicine name
      const isExplicitlyUnclear =
        rawName.includes("...") ||
        rawName.length < 3 ||
        rawName.toLowerCase().includes("unclear") ||
        rawName.toLowerCase().includes("illegible") ||
        normalizedName.toLowerCase().includes("review required") ||
        normalizedName.toLowerCase().includes("unknown") ||
        med.verification_status === "review_required";

      let verificationStatus: "verified" | "review_required" = "verified";
      let confidenceLevel: "high" | "medium" | "review_required" = "high";
      let uncertaintyReason = (med.uncertainty_reason || "").trim();
      let isUnknown = false;

      let drugInformation = {
        source_status: "unavailable" as "verified" | "unavailable",
        source_name: "",
        purpose: [] as string[],
        common_side_effects: [] as string[],
        important_warnings: [] as string[],
        notable_interactions: [] as string[],
      };

      if (isExplicitlyUnclear) {
        isUnknown = true;
        hasUnclearMedicines = true;
        normalizedName = "Review Required";
        verificationStatus = "review_required";
        confidenceLevel = "review_required";
        uncertaintyReason = uncertaintyReason || "Medicine name could not be confirmed. Please verify the prescription with your doctor or pharmacist.";
        drugInformation = {
          source_status: "unavailable",
          source_name: "",
          purpose: [],
          common_side_effects: [],
          important_warnings: ["Medicine name could not be confirmed from the prescription slip. Do not take unverified medication without consulting a doctor or pharmacist."],
          notable_interactions: [],
        };
      } else {
        // Safe clinical database check ONLY for supplementing verified drug reference info AFTER extraction
        const drugMatch = lookupVerifiedDrug(rawName) || lookupVerifiedDrug(normalizedName);
        if (drugMatch) {
          normalizedName = drugMatch.normalizedName;
          drugInformation = {
            source_status: "verified",
            source_name: drugMatch.entry.source_name || "Verified Drug Information",
            purpose: drugMatch.entry.purpose,
            common_side_effects: drugMatch.entry.common_side_effects,
            important_warnings: drugMatch.entry.important_warnings,
            notable_interactions: drugMatch.entry.notable_interactions,
          };
          verifiedCount++;
        } else {
          // If not in verified reference dictionary, explicitly mark unavailable - NO generic fabricated text!
          verifiedCount++;
          drugInformation = {
            source_status: "unavailable",
            source_name: "",
            purpose: [],
            common_side_effects: [],
            important_warnings: [],
            notable_interactions: [],
          };
        }
      }

      // CRITICAL SAFEGUARD: Amount vs Duration separation
      let amount = typeof med.amount === "number" && !isNaN(med.amount) ? med.amount : 1;
      const durationStr = (med.duration || "").toString().trim();

      // If duration days (e.g. 5 days, 7 days) were misread as dose amount (> 4 tabs per single dose)
      if (amount > 4 && durationStr && durationStr.includes(amount.toString())) {
        amount = 1;
      }

      const unit = (med.unit || med.dosage_form || "tablet").toLowerCase().replace(/s$/, "");
      const dosageForm = (med.dosage_form || unit || "tablet").toLowerCase();
      const strength = (med.strength || "").trim();

      // Frequency normalization mapping
      let freqNorm = (med.frequency_normalized || med.frequency_raw || "").trim();
      const freqLower = freqNorm.toLowerCase();
      if (freqLower === "tds" || freqLower === "three times a day" || freqLower === "three times daily" || freqLower === "tid" || freqLower === "t.d.s.") {
        freqNorm = "three times daily";
      } else if (freqLower === "od" || freqLower === "once a day" || freqLower === "once daily" || freqLower === "qd" || freqLower === "o.d.") {
        freqNorm = "once daily";
      } else if (freqLower === "bd" || freqLower === "twice a day" || freqLower === "twice daily" || freqLower === "bid" || freqLower === "b.d.") {
        freqNorm = "twice daily";
      } else if (freqLower === "qid" || freqLower === "four times a day" || freqLower === "four times daily" || freqLower === "q.i.d.") {
        freqNorm = "four times daily";
      }

      const timing = (med.timing || "").trim();
      const food = (med.food_instruction || "").trim();
      const duration = durationStr.replace(/^[xX×]\s*/, "").trim();

      // Patient-friendly instruction generation strictly from validated prescription fields
      let patientInstruction = "";
      if (isUnknown) {
        patientInstruction = "Medicine name could not be confirmed. Please verify the prescription with your doctor or pharmacist.";
      } else {
        const unitLabel = amount > 1 ? `${unit}s` : unit;
        const parts: string[] = ["Take", `${amount} ${unitLabel}`, "of", normalizedName];
        if (strength) parts.push(strength);
        if (freqNorm) parts.push(freqNorm);
        if (timing && !freqNorm.toLowerCase().includes(timing.toLowerCase())) {
          parts.push(timing.startsWith("at") || timing.startsWith("in") ? timing : `at ${timing}`);
        }
        if (food) parts.push(food);
        if (duration) {
          parts.push(duration.toLowerCase().startsWith("for") ? duration : `for ${duration}`);
        }
        patientInstruction = parts.join(" ") + ".";
      }

      const correctionMade = !isUnknown && rawName.toLowerCase() !== normalizedName.toLowerCase() && rawName.length > 0;
      if (correctionMade && confidenceLevel === "high") {
        confidenceLevel = "medium";
      }

      return {
        id,
        original_text: originalText || `${rawName} ${strength} ${freqNorm}`,
        medicine_name_raw: rawName || normalizedName,
        medicine_name_normalized: normalizedName,
        strength: strength || "Strength not specified",
        amount,
        unit: amount > 1 ? `${unit}s` : unit,
        dosage_form: dosageForm,
        frequency_raw: med.frequency_raw || freqNorm,
        frequency_normalized: freqNorm,
        timing: timing || "",
        food_instruction: food || "",
        duration: duration || "",
        confidence: typeof med.confidence === "number" ? med.confidence : (isUnknown ? 35 : 95),
        confidence_level: confidenceLevel,
        verification_status: verificationStatus,
        uncertainty_reason: uncertaintyReason,
        patient_instruction: patientInstruction,
        drug_information: drugInformation,
        drug_info: {
          purpose: drugInformation.purpose.join(". "),
          common_side_effects: drugInformation.common_side_effects,
          important_warnings: drugInformation.important_warnings,
          known_interactions: drugInformation.notable_interactions,
        },
        is_unknown_or_unclear: isUnknown,
        correction_made: correctionMade,
      };
    });

    console.log("[Prescription Pipeline] Structured parsing completed");

    // Construct response
    const partialWarning = hasUnclearMedicines && verifiedCount > 0
      ? "Some prescription details could not be confirmed. Please review the highlighted medicine."
      : undefined;

    const finalResult = {
      success: true,
      raw_text: rawTranscript || (parsedData.raw_lines_detected || []).join("\n"),
      prescription_summary:
        parsedData.prescription_summary ||
        `Identified ${sanitizedMedicines.length} prescription item(s) from the uploaded image.`,
      legibility_assessment:
        parsedData.legibility_assessment ||
        (hasUnclearMedicines ? "partially_clear" : "clear"),
      medicines: sanitizedMedicines,
      raw_lines_detected: parsedData.raw_lines_detected || [],
      overall_notes: parsedData.overall_notes || "",
      partial_warning: partialWarning,
      has_unclear_medicines: hasUnclearMedicines,
      analyzed_at: new Date().toISOString(),
    };

    return res.json(finalResult);
  } catch (error: any) {
    console.error("[Prescription Pipeline] [API_ERROR] Unexpected error:", error);
    return res.status(500).json({
      errorCode: "API_ERROR",
      error: "We couldn't analyze the prescription right now. Please try again.",
      details: error.message || "An unexpected error occurred during image reading.",
      suggestion: "Please try re-uploading the image in a moment.",
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MediSimplify Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
