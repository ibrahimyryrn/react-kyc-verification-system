/**
 * Face comparison using face-api.js
 * Optimized with SSD Mobilenet V1 for higher accuracy on ID cards
 */
import * as faceapi from "face-api.js";

let modelsLoaded = false;

/**
 * Load face-api.js models
 * Switching to SSD Mobilenet V1 for better accuracy on ID cards
 */
const loadModels = async (): Promise<void> => {
  if (modelsLoaded) {
    return;
  }

  // Try local models first (faster, more reliable for production)
  // Fallback to CDN if local models are not available
  const LOCAL_MODEL_URL = "/models";
  const CDN_MODEL_URL =
    "https://justadudewhohacks.github.io/face-api.js/models";

  try {
    // console.log("⏳ Loading FaceAPI models from local storage...");
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(LOCAL_MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(LOCAL_MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(LOCAL_MODEL_URL),
    ]);

    modelsLoaded = true;
    // console.log(
    //   "✅ Face-api.js models (SSD Mobilenet) loaded from local storage"
    // );
  } catch (localError) {
    // console.warn(
    //   "⚠️ Local models not found, falling back to CDN...",
    //   localError
    // );
    try {
      // console.log("⏳ Loading FaceAPI models from CDN...");
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(CDN_MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(CDN_MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(CDN_MODEL_URL),
      ]);

      modelsLoaded = true;
      // console.log("✅ Face-api.js models (SSD Mobilenet) loaded from CDN");
    } catch (cdnError) {
      console.error("Error loading face-api.js models from both sources:", {
        localError,
        cdnError,
      });
      throw new Error(
        "Failed to load face recognition models. Please ensure models are available locally or CDN is accessible."
      );
    }
  }
};

/**
 * Convert base64 to HTMLImageElement
 */
const base64ToImage = (base64: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = base64;
  });
};

/**
 * Add white padding to help detection
 */
const addPaddingToImage = (
  img: HTMLImageElement,
  paddingPercent: number = 0.5 // 50% padding (leaves more space so detector can find the face)
): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("Could not get canvas context");

  // Increased padding amount
  const paddingX = img.width * paddingPercent;
  const paddingY = img.height * paddingPercent;

  canvas.width = img.width + paddingX * 2;
  canvas.height = img.height + paddingY * 2;

  // White background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw image centered
  ctx.drawImage(img, paddingX, paddingY, img.width, img.height);

  return canvas;
};

/**
 * Compare two face images
 */
export const compareFaces = async (
  image1Base64: string, // ID Portrait
  image2Base64: string, // Selfie
  threshold: number = 0.55 // Distance threshold (can set to 0.6 for more tolerance)
): Promise<{ isMatch: boolean; distance: number }> => {
  try {
    await loadModels();

    const [img1Raw, img2Raw] = await Promise.all([
      base64ToImage(image1Base64),
      base64ToImage(image2Base64),
    ]);

    // Convert to canvas and add padding
    const canvas1 = addPaddingToImage(img1Raw);
    const canvas2 = addPaddingToImage(img2Raw);

    // SSD Mobilenet Options
    // Set minConfidence to 0.1 to try to capture even hard-to-detect faces
    const detectOptions = new faceapi.SsdMobilenetv1Options({
      minConfidence: 0.1,
      maxResults: 1,
    });

    // console.log("🔍 Detecting faces...");

    // 1. Scan image (ID)
    const descriptor1 = await faceapi
      .detectSingleFace(canvas1, detectOptions)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!descriptor1) {
      console.error("❌ Could not detect face in ID photo!");
      // You can log the canvas to see the reason for the error
      // console.log(canvas1.toDataURL());
      throw new Error("Could not detect face in ID Photo");
    } else {
      // console.log(
      //   "✅ ID Face detected (Score: " +
      //     descriptor1.detection.score.toFixed(2) +
      //     ")"
      // );
    }

    // 2. Scan image (Selfie)
    const descriptor2 = await faceapi
      .detectSingleFace(canvas2, detectOptions)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!descriptor2) {
      console.error("❌ Could not detect face in selfie photo!");
      throw new Error("Could not detect face in Selfie");
    } else {
      // console.log(
      //   "✅ Selfie Face detected (Score: " +
      //     descriptor2.detection.score.toFixed(2) +
      //     ")"
      // );
    }

    // Calculate distance
    const distance = faceapi.euclideanDistance(
      descriptor1.descriptor,
      descriptor2.descriptor
    );

    const isMatch = distance < threshold;

    // console.log(
    //   `🎯 COMPARISON RESULT: Distance=${distance.toFixed(
    //     3
    //   )}, Threshold=${threshold}, MATCH=${isMatch ? "YES" : "NO"}`
    // );

    return { isMatch, distance };
  } catch (error) {
    console.error("Compare error details:", error);
    throw error;
  }
};
