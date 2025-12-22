/**
 * Liveness detection helpers using MediaPipe Face Mesh
 * For eye blink detection and face capture
 */
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

/**
 * Normalized landmark point (x, y coordinates normalized 0-1)
 */
interface NormalizedLandmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
  presence?: number;
}

let faceLandmarker: FaceLandmarker | null = null;

/**
 * Initialize MediaPipe Face Landmarker (Face Mesh)
 * Used for eye blink detection
 */
const initializeFaceLandmarker = async (): Promise<FaceLandmarker> => {
  if (faceLandmarker) {
    return faceLandmarker;
  }

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );

  faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
      delegate: "GPU",
    },
    outputFaceBlendshapes: false,
    runningMode: "VIDEO",
    numFaces: 1,
    minFaceDetectionConfidence: 0.5,
    minFacePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  return faceLandmarker;
};

/**
 * Calculate Eye Aspect Ratio (EAR) for blink detection
 * Lower EAR indicates closed eye, higher EAR indicates open eye
 * Uses 6 key points: outer corner, inner corner, top, bottom, top2, bottom2
 */
const calculateEAR = (eyeLandmarks: NormalizedLandmark[]): number => {
  if (eyeLandmarks.length < 6) {
    return 0;
  }

  // EAR calculation using 6 points:
  // [0] = outer corner, [1] = inner corner, [2] = top, [3] = bottom, [4] = top2, [5] = bottom2

  // Vertical distances (top to bottom)
  const vertical1 = Math.sqrt(
    Math.pow(eyeLandmarks[2].y - eyeLandmarks[3].y, 2) +
      Math.pow(eyeLandmarks[2].x - eyeLandmarks[3].x, 2)
  );
  const vertical2 = Math.sqrt(
    Math.pow(eyeLandmarks[4].y - eyeLandmarks[5].y, 2) +
      Math.pow(eyeLandmarks[4].x - eyeLandmarks[5].x, 2)
  );

  // Horizontal distance (outer to inner corner)
  const horizontal = Math.sqrt(
    Math.pow(eyeLandmarks[0].x - eyeLandmarks[1].x, 2) +
      Math.pow(eyeLandmarks[0].y - eyeLandmarks[1].y, 2)
  );

  // Prevent division by zero
  if (horizontal === 0) {
    return 0;
  }

  // EAR = (vertical1 + vertical2) / (2 * horizontal)
  return (vertical1 + vertical2) / (2 * horizontal);
};

/**
 * Detect if eyes are closed based on EAR threshold
 * @param landmarks - Face landmarks from MediaPipe
 * @param threshold - EAR threshold (default 0.25, lower = more sensitive)
 * @returns true if eyes are closed (blinking)
 */
export const detectEyeBlink = (
  landmarks: NormalizedLandmark[],
  threshold: number = 0.2 // Lower threshold (0.2) for better sensitivity
): boolean => {
  if (!landmarks || landmarks.length < 468) {
    return false; // Not enough landmarks
  }

  // Left eye key points: [outer corner, inner corner, top, bottom, top2, bottom2]
  // MediaPipe Face Mesh indices for left eye
  const leftEyeIndices = [33, 133, 159, 145, 158, 153];
  const leftEyePoints = leftEyeIndices.map((i) => landmarks[i]);

  // Right eye key points: [outer corner, inner corner, top, bottom, top2, bottom2]
  // MediaPipe Face Mesh indices for right eye
  const rightEyeIndices = [362, 263, 386, 374, 385, 380];
  const rightEyePoints = rightEyeIndices.map((i) => landmarks[i]);

  const leftEAR = calculateEAR(leftEyePoints);
  const rightEAR = calculateEAR(rightEyePoints);

  // Average EAR
  const avgEAR = (leftEAR + rightEAR) / 2;

  // Debug: Log EAR values (can be removed in production)
  /*if (avgEAR > 0) {
    console.log(
      `EAR: ${avgEAR.toFixed(3)}, Threshold: ${threshold}, Closed: ${
        avgEAR < threshold
      }`
    );
  }*/

  // If EAR is below threshold, eyes are closed (blinking)
  return avgEAR < threshold;
};

/**
 * Detect face and check for blink in video frame
 * @param videoElement - HTML video element
 * @param timestamp - Video timestamp
 * @returns Object with face detected status and blink detected status
 */
export const detectBlinkInFrame = async (
  videoElement: HTMLVideoElement,
  timestamp: number
): Promise<{ faceDetected: boolean; blinkDetected: boolean }> => {
  try {
    const landmarker = await initializeFaceLandmarker();

    const results = landmarker.detectForVideo(videoElement, timestamp);

    if (!results.faceLandmarks || results.faceLandmarks.length === 0) {
      return { faceDetected: false, blinkDetected: false };
    }

    const landmarks = results.faceLandmarks[0];
    const blinkDetected = detectEyeBlink(landmarks);

    return { faceDetected: true, blinkDetected };
  } catch (error) {
    console.error("Error detecting blink:", error);
    return { faceDetected: false, blinkDetected: false };
  }
};

/**
 * Extract face from selfie image using MediaPipe Face Detector
 * Similar to extractFaceFromID but optimized for selfies
 */
export const extractFaceFromSelfie = async (
  imageSrc: string
): Promise<string | null> => {
  try {
    const { FaceDetector } = await import("@mediapipe/tasks-vision");
    const { FilesetResolver } = await import("@mediapipe/tasks-vision");

    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    const faceDetector = await FaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`,
        delegate: "GPU",
      },
      runningMode: "IMAGE",
      minDetectionConfidence: 0.5,
    });

    const img = new Image();
    img.crossOrigin = "anonymous";

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = imageSrc;
    });

    const detections = faceDetector.detect(img);

    if (!detections || detections.detections.length === 0) {
      // console.log("No face detected in selfie");
      return null;
    }

    const detection = detections.detections[0];
    const bbox = detection.boundingBox;

    if (!bbox) {
      // console.log("No bounding box found");
      return null;
    }

    // Crop face with padding
    const padding = 0.2;
    const x = Math.max(0, bbox.originX - bbox.width * padding);
    const y = Math.max(0, bbox.originY - bbox.height * padding);
    const width = bbox.width * (1 + padding * 2);
    const height = bbox.height * (1 + padding * 2);

    const cropX = Math.max(0, Math.min(x, img.width));
    const cropY = Math.max(0, Math.min(y, img.height));
    const cropWidth = Math.min(width, img.width - cropX);
    const cropHeight = Math.min(height, img.height - cropY);

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Could not get canvas context");
    }

    canvas.width = cropWidth;
    canvas.height = cropHeight;

    ctx.drawImage(
      img,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );

    const croppedFace = canvas.toDataURL("image/jpeg", 0.9);
    // console.log("Face successfully extracted from selfie");
    return croppedFace;
  } catch (error) {
    console.error("Error extracting face from selfie:", error);
    return null;
  }
};
