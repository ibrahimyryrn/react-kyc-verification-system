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
export const EAR_THRESHOLD = Number(import.meta.env.VITE_EAR_THRESHOLD) || 0.2; // Eye Aspect Ratio threshold for blink detection

// Face Detection & Cropping Configuration
export const FACE_CROP_PADDING =
  Number(import.meta.env.VITE_FACE_CROP_PADDING) || 0.2; // 20% padding for face cropping

// MRZ Image Processing Configuration
export const MRZ_CROP_WIDTH_RATIO =
  Number(import.meta.env.VITE_MRZ_CROP_WIDTH_RATIO) || 0.95; // 95% of image width
export const MRZ_ASPECT_RATIO =
  Number(import.meta.env.VITE_MRZ_ASPECT_RATIO) || 4.5; // Width to height ratio for MRZ region

// MediaPipe Configuration
export const MEDIAPIPE_FACE_DETECTION_CONFIDENCE =
  Number(import.meta.env.VITE_MEDIAPIPE_FACE_DETECTION_CONFIDENCE) || 0.5;
export const MEDIAPIPE_FACE_LANDMARKER_DETECTION_CONFIDENCE =
  Number(import.meta.env.VITE_MEDIAPIPE_FACE_LANDMARKER_DETECTION_CONFIDENCE) ||
  0.5;
export const MEDIAPIPE_FACE_LANDMARKER_PRESENCE_CONFIDENCE =
  Number(import.meta.env.VITE_MEDIAPIPE_FACE_LANDMARKER_PRESENCE_CONFIDENCE) ||
  0.5;
export const MEDIAPIPE_FACE_LANDMARKER_TRACKING_CONFIDENCE =
  Number(import.meta.env.VITE_MEDIAPIPE_FACE_LANDMARKER_TRACKING_CONFIDENCE) ||
  0.5;

// Feature Flags
export const ENABLE_DEBUG_MODE =
  import.meta.env.VITE_ENABLE_DEBUG_MODE === "true";
export const ENABLE_ERROR_TRACKING =
  import.meta.env.VITE_ENABLE_ERROR_TRACKING === "true";

// Application Environment
export const APP_ENV = import.meta.env.VITE_APP_ENV || "development";
export const IS_PRODUCTION = import.meta.env.PROD;
