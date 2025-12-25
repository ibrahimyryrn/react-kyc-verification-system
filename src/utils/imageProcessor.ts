/**
 * Image preprocessing for MRZ OCR
 * Handles cropping, upscaling, grayscale conversion, and binary thresholding
 */
import {
  MRZ_CROP_WIDTH_RATIO,
  MRZ_ASPECT_RATIO,
  LOW_LIGHT_THRESHOLD,
} from "../config/constants";

const SCALE_FACTOR = 2.5;
const BINARY_THRESHOLD = 110;

/**
 * Preprocesses MRZ image with cropping and enhancement
 * - Crop MRZ region (configurable width, centered, configurable aspect ratio)
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

      const captureWidth = img.width;
      const captureHeight = img.height;

      const cropWidth = captureWidth * MRZ_CROP_WIDTH_RATIO;
      const cropHeight = cropWidth / MRZ_ASPECT_RATIO;

      const startX = (captureWidth - cropWidth) / 2;
      const startY = (captureHeight - cropHeight) / 2;

      // Scale up for better OCR accuracy
      canvas.width = cropWidth * SCALE_FACTOR;
      canvas.height = cropHeight * SCALE_FACTOR;

      ctx.drawImage(
        img,
        startX,
        startY,
        cropWidth,
        cropHeight,
        0,
        0,
        canvas.width,
        canvas.height
      );

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Convert to grayscale using standard weights
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;

        // Binary threshold (adjustable 100-130 based on lighting conditions)
        const final = gray > BINARY_THRESHOLD ? 255 : 0;

        data[i] = final;
        data[i + 1] = final;
        data[i + 2] = final;
      }

      ctx.putImageData(imageData, 0, 0);

      resolve(canvas.toDataURL("image/png"));
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = imageSrc;
  });
};

/**
 * Check if image is too dark for OCR
 * Analyzes the MRZ region's average brightness
 * @param imageSrc - Base64 image string
 * @returns true if image is bright enough, false if too dark
 */
export const checkImageBrightness = async (
  imageSrc: string
): Promise<boolean> => {
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

      const captureWidth = img.width;
      const captureHeight = img.height;

      const cropWidth = captureWidth * MRZ_CROP_WIDTH_RATIO;
      const cropHeight = cropWidth / MRZ_ASPECT_RATIO;

      const startX = (captureWidth - cropWidth) / 2;
      const startY = (captureHeight - cropHeight) / 2;

      canvas.width = cropWidth;
      canvas.height = cropHeight;

      ctx.drawImage(
        img,
        startX,
        startY,
        cropWidth,
        cropHeight,
        0,
        0,
        canvas.width,
        canvas.height
      );

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      let totalBrightness = 0;
      let pixelCount = 0;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Convert to grayscale using standard weights
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        totalBrightness += gray;
        pixelCount++;
      }

      const averageBrightness = totalBrightness / pixelCount;
      const isBrightEnough = averageBrightness >= LOW_LIGHT_THRESHOLD;

      resolve(isBrightEnough);
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = imageSrc;
  });
};
