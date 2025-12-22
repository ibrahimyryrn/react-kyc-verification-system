/**
 * Application configuration constants
 * Uses environment variables with sensible defaults
 */

// Face Recognition Configuration
export const FACE_MATCH_THRESHOLD =
  Number(import.meta.env.VITE_FACE_MATCH_THRESHOLD) || 0.55;

// OCR Configuration
export const OCR_CONFIDENCE_THRESHOLD =
  Number(import.meta.env.VITE_OCR_CONFIDENCE_THRESHOLD) || 0.7;

// Liveness Check Configuration
export const REQUIRED_BLINKS =
  Number(import.meta.env.VITE_REQUIRED_BLINKS) || 2;
export const BLINK_DEBOUNCE_MS =
  Number(import.meta.env.VITE_BLINK_DEBOUNCE_MS) || 400;

// Feature Flags
export const ENABLE_DEBUG_MODE =
  import.meta.env.VITE_ENABLE_DEBUG_MODE === "true";
export const ENABLE_ERROR_TRACKING =
  import.meta.env.VITE_ENABLE_ERROR_TRACKING === "true";

// Application Environment
export const APP_ENV = import.meta.env.VITE_APP_ENV || "development";
export const IS_PRODUCTION = import.meta.env.PROD;
