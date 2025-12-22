import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";

let faceDetector: FaceDetector | null = null;

/**
 * Initialize MediaPipe Face Detector
 */
const initializeFaceDetector = async (): Promise<FaceDetector> => {
  if (faceDetector) {
    return faceDetector;
  }

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );

  faceDetector = await FaceDetector.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`,
      delegate: "GPU",
    },
    runningMode: "IMAGE",
    minDetectionConfidence: 0.5,
  });

  return faceDetector;
};

/**
 * Extract and crop face from ID card image using MediaPipe
 * CLEAN VERSION: No pixel manipulation, pure high-quality crop.
 * This preserves natural RGB data for better face-api.js comparison.
 */
export const extractFaceFromID = async (
  imageSrc: string
): Promise<string | null> => {
  try {
    const detector = await initializeFaceDetector();

    const img = new Image();
    img.crossOrigin = "anonymous";

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = imageSrc;
    });

    const detections = detector.detect(img);

    if (!detections || detections.detections.length === 0) {
      // console.log("No face detected in ID image");
      return null;
    }

    const detection = detections.detections[0];
    const bbox = detection.boundingBox;

    if (!bbox) {
      return null;
    }

    // --- CROP LOGIC ---
    // Take the face with a bit more space so hair and chin don't get cut off.
    // face-api.js works better when it sees the full face.
    const padding = 0.2; // 20% padding (better for face-api.js)

    const x = Math.max(0, bbox.originX - bbox.width * padding);
    const y = Math.max(0, bbox.originY - bbox.height * padding);
    const width = bbox.width * (1 + padding * 2);
    const height = bbox.height * (1 + padding * 2);

    // Check boundaries
    const cropX = Math.max(0, Math.min(x, img.width));
    const cropY = Math.max(0, Math.min(y, img.height));
    const cropWidth = Math.min(width, img.width - cropX);
    const cropHeight = Math.min(height, img.height - cropY);

    // --- CANVAS PROCESSING ---
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) throw new Error("Could not get canvas context");

    // Create 2x larger canvas to preserve resolution (High DPI)
    // This provides sharpness without needing a sharpen filter.
    const scale = 2.0;
    canvas.width = cropWidth * scale;
    canvas.height = cropHeight * scale;

    // High Quality Scaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.drawImage(
      img,
      cropX,
      cropY,
      cropWidth,
      cropHeight, // Source coordinates
      0,
      0,
      canvas.width,
      canvas.height // Destination coordinates (upscaled)
    );

    // NOTE: We are NOT calling functions like unsharpMask, enhanceColors here.
    // They were corrupting pixel data. Pure RGB data is best.

    const croppedFace = canvas.toDataURL("image/jpeg", 0.95);
    // console.log("Face successfully cropped from ID (Clean RGB)");
    return croppedFace;
  } catch (error) {
    console.error("Error extracting face from ID:", error);
    return null;
  }
};
