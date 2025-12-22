/**
 * Image preprocessing for MRZ OCR
 * Handles cropping, upscaling, grayscale conversion, and binary thresholding
 */

// Constants for MRZ image processing
const CROP_WIDTH_RATIO = 0.95; // 95% of image width
const ASPECT_RATIO = 4.5; // Width to height ratio for MRZ region
const SCALE_FACTOR = 2.5; // Upscaling factor for better OCR accuracy
const BINARY_THRESHOLD = 110; // Threshold for binary conversion (adjustable 100-130)

/**
 * Preprocesses MRZ image with cropping and enhancement
 * - Crop MRZ region (95% width, centered, 4.5:1 aspect ratio)
 * - Upscale 2.5x for better OCR accuracy
 * - Grayscale conversion
 * - Binary threshold (black-white)
 */
export const preprocessMRZImage = async (imageSrc: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      // --- STEP 1: CROPPING ---
      // Extract the MRZ region from the full camera image (e.g., 1920x1080)
      // Mathematically crop the area corresponding to the MRZFrame in the UI

      const captureWidth = img.width;
      const captureHeight = img.height;

      // UI frame ratios (Width 95%, Height = Width / 4.5)
      const cropWidth = captureWidth * CROP_WIDTH_RATIO;
      const cropHeight = cropWidth / ASPECT_RATIO;

      // Starting X and Y points for cropping (centered)
      const startX = (captureWidth - cropWidth) / 2;
      const startY = (captureHeight - cropHeight) / 2;
      // Note: If the UI box is slightly lower, add +50 or +100 to startY

      // --- STEP 2: UPSCALING ---
      // Scale up 2.5x so Tesseract can read small characters
      canvas.width = cropWidth * SCALE_FACTOR;
      canvas.height = cropHeight * SCALE_FACTOR;

      // Draw the cropped region from source image to canvas with upscaling
      ctx.drawImage(
        img,
        startX,
        startY,
        cropWidth,
        cropHeight, // Source coordinates
        0,
        0,
        canvas.width,
        canvas.height // Destination coordinates
      );

      // --- STEP 3: IMAGE PROCESSING (GRAYSCALE & BINARY THRESHOLD) ---
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Convert to grayscale using standard weights
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;

        // Binary Threshold
        // Can be adjusted between 100-130 based on lighting conditions
        const final = gray > BINARY_THRESHOLD ? 255 : 0;

        data[i] = final;
        data[i + 1] = final;
        data[i + 2] = final;
      }

      ctx.putImageData(imageData, 0, 0);

      // DEBUG: Uncomment to see the processed image
      // console.log("Processed Image:", canvas.toDataURL("image/png"));

      resolve(canvas.toDataURL("image/png"));
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = imageSrc;
  });
};
