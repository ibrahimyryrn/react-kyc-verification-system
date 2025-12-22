/**
 * React Hook for OCR processing with optimized Tesseract Worker management
 * Worker is created once and reused for better performance
 */
import { createWorker, PSM } from "tesseract.js";
import { useState, useEffect, useRef } from "react";
import { preprocessMRZImage } from "../utils/imageProcessor";
import { parseOCRText } from "../utils/mrzParser";
import type { OCRResults } from "../store/verificationStore";

// Worker type from tesseract.js
type Worker = Awaited<ReturnType<typeof createWorker>>;

/**
 * Custom hook for MRZ OCR processing
 * Initializes Tesseract worker once and reuses it for all scans
 * @returns Object with scanImage function and isReady state
 */
export const useOCR = () => {
  const [isReady, setIsReady] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  // Initialize worker once when component mounts
  useEffect(() => {
    const initWorker = async () => {
      try {
        // Create Tesseract worker with English and Turkish languages
        const worker = await createWorker(["eng", "tur"]);

        // Optimized parameters for MRZ
        await worker.setParameters({
          // PSM 6: Single uniform block of text (ideal for 3-line MRZ format)
          tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
          // OCR-B characters only (ICAO Doc 9303 standard - no Turkish characters in MRZ)
          tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<",
        });

        workerRef.current = worker;
        setIsReady(true);
        // console.log("✅ Tesseract Worker initialized and ready");
      } catch (error) {
        console.error("Failed to initialize Tesseract worker:", error);
        setIsReady(false);
      }
    };

    initWorker();

    // Cleanup: terminate worker when component unmounts
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
        // console.log("🔄 Tesseract Worker terminated");
      }
    };
  }, []);

  /**
   * Scan image and extract MRZ data
   * @param imageSrc - Base64 image string
   * @returns OCRResults object with name, surname, tcNo, and rawText
   */
  const scanImage = async (imageSrc: string): Promise<OCRResults | null> => {
    if (!workerRef.current || !isReady) {
      // console.warn("⚠️ Worker not ready yet. Please wait...");
      return null;
    }

    try {
      // 1. Preprocess image (crop, upscale, threshold)
      const processedImage = await preprocessMRZImage(imageSrc);

      // 2. Perform OCR (Worker is already initialized, no wait time!)
      const {
        data: { text },
      } = await workerRef.current.recognize(processedImage);

      // 3. Parse OCR text and extract MRZ data
      const parsedData = parseOCRText(text);

      return parsedData;
    } catch (error) {
      console.error("Error during OCR scanning:", error);
      return null;
    }
  };

  return { scanImage, isReady };
};
