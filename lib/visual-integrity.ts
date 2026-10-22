// These records were inspected against the canonical stem and the SAFE manifest.
// Their wording requires the original figure, but neither a source-bound visual
// nor a SAFE image-only crop is currently available. Do not substitute a teaching
// illustration for an original examination image.
export const MISSING_REQUIRED_SOURCE_VISUAL_IDS = new Set([
  "078f7e46ad7e9b623a24", // ECG shown — Amedex 2023
  "9ff1cb1e4e80b79829d3", // same scenario, Cardiology 2025
  "10363a04076f25ac8300", // CT shown in picture
  "ec1a1290e82d42f1ef88", // BMI chart required for calculation
  "96e5b1dea0cd8050f979", // CVD risk chart required
  "9e6bd36a73d62ab3802f", // clinical photograph; click to enlarge
]);

export const MISSING_REQUIRED_VISUAL_STATUS = "INCOMPLETE_MISSING_REQUIRED_VISUAL";
export const LEAKED_ANSWER_STATUS = "INCOMPLETE_LEAKED_ANSWER_IN_OPTIONS";

// Original OCR option boundaries include a "Correct Answer" panel. Keep these
// source rows for forensic repair, but never expose them in pre-answer UI.
export const LEAKED_ANSWER_IN_OPTIONS_IDS = new Set([
  "cb4a93e611c9cc628e31", "5961354bc831a090e0bb", "cc151db073fddd714b01",
  "9e6bd36a73d62ab3802f", "fc7c608464044e944c57", "6b603b26cf223d54e4f5",
  "bd9ad15fd7bfc56d3399", "bfba1c93f52d50aaf8be", "ae4ba88dc01f3ff11fca",
]);

export function isMissingRequiredSourceVisual(id: string) {
  return MISSING_REQUIRED_SOURCE_VISUAL_IDS.has(id);
}

export function practiceExclusionStatus(id: string) {
  if (LEAKED_ANSWER_IN_OPTIONS_IDS.has(id)) return LEAKED_ANSWER_STATUS;
  if (isMissingRequiredSourceVisual(id)) return MISSING_REQUIRED_VISUAL_STATUS;
  return null;
}
