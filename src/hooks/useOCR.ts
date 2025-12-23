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

  useEffect(() => {
    const initWorker = async () => {
      try {
        const worker = await createWorker(["eng", "tur"]);

        await worker.setParameters({
          // PSM 6: Single uniform block (ideal for 3-line MRZ)
          tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
          // OCR-B characters only (ICAO Doc 9303 - no Turkish chars in MRZ)
          tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<",
        });

        workerRef.current = worker;
        setIsReady(true);
      } catch (error) {
        console.error("Failed to initialize Tesseract worker:", error);
        setIsReady(false);
      }
    };

    initWorker();

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
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
      return null;
    }

    try {
      const processedImage = await preprocessMRZImage(imageSrc);
      const {
        data: { text },
      } = await workerRef.current.recognize(processedImage);
      const parsedData = parseOCRText(text);

      return parsedData;
    } catch (error) {
      console.error("Error during OCR scanning:", error);
      return null;
    }
  };

  return { scanImage, isReady };
};
