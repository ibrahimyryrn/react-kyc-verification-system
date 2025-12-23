//This is backup file

import { createWorker, PSM } from "tesseract.js";
import { parse } from "mrz";
import type { OCRResults } from "../store/verificationStore";

/**
 * Preprocessing for MRZ image with cropping and enhancement
 * - Crop MRZ region (85% width, centered, 3.5:1 aspect ratio)
 * - Upscale 2.5x for better OCR accuracy
 * - Grayscale conversion
 * - Binary threshold (black-white)
 */
const preprocessMRZImage = async (imageSrc: string): Promise<string> => {
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

      // UI frame ratios (Width 85%, Height = Width / 3.5)
      const cropWidth = captureWidth * 0.85;
      const cropHeight = cropWidth / 3.5;

      // Starting X and Y points for cropping (centered)
      const startX = (captureWidth - cropWidth) / 2;
      const startY = (captureHeight - cropHeight) / 2;
      // Note: If the UI box is slightly lower, add +50 or +100 to startY

      // --- STEP 2: UPSCALING ---
      // Scale up 2.5x so Tesseract can read small characters
      const scaleFactor = 2.5;
      canvas.width = cropWidth * scaleFactor;
      canvas.height = cropHeight * scaleFactor;

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

        // Convert to grayscale
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;

        // Binary Threshold
        // Can be adjusted between 100-130 based on lighting conditions
        const threshold = 110;
        const final = gray > threshold ? 255 : 0;

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

/**
 * Extracts information from MRZ image (optimized)
 */
export const extractMRZData = async (image: string): Promise<OCRResults> => {
  // Preprocessing (includes cropping, upscaling, and binary threshold)
  const processedImage = await preprocessMRZImage(image);

  // 2. Create Tesseract.js Worker
  const worker = await createWorker(["eng", "tur"]);

  // 3. Optimized parameters for MRZ
  await worker.setParameters({
    // PSM 6: Single uniform block of text (ideal for 3-line MRZ format)
    tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
    // OCR-B characters only (ICAO Doc 9303 standard - no Turkish characters in MRZ)
    tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<",
  });

  // 4. Perform OCR
  const {
    data: { text },
  } = await worker.recognize(processedImage);
  await worker.terminate();

  console.log("=== MRZ OCR Raw Text ===");
  console.log(text);

  // 5. Filter and normalize MRZ lines
  const allLines = text.split(/\n|\r/).map((line) => line.trim());
  console.log("=== All OCR Lines ===");
  console.log(allLines);

  let mrzLines = allLines
    .filter((line) => line.length > 20 && /^[A-Z0-9<]{20,}$/.test(line))
    .slice(0, 3); // Take first 3 lines (standard MRZ format)

  console.log("=== Filtered MRZ Lines (Before Normalization) ===");
  console.log(mrzLines);

  if (mrzLines.length === 0) {
    console.warn("⚠️ No MRZ lines found! OCR might have failed.");
    console.warn("Raw text length:", text.length);
    console.warn("First 200 chars of raw text:", text.substring(0, 200));
  }

  // Normalize MRZ lines to standard TD1 format (30 characters per line)
  // Turkish ID cards use TD1 format with 30-char lines
  mrzLines = mrzLines.map((line) => {
    // Remove any invalid characters (keep only A-Z, 0-9, <)
    let cleaned = line.replace(/[^A-Z0-9<]/g, "");

    // If line is too long (OCR error), try to extract 30 characters
    if (cleaned.length > 30) {
      // For line 1 and 2, take first 30 chars
      // For line 3, try to preserve structure (surname + name)
      cleaned = cleaned.substring(0, 30);
    }

    // If line is too short, pad with '<' at the end (standard MRZ filler)
    while (cleaned.length < 30) {
      cleaned += "<";
    }

    return cleaned;
  });

  console.log("=== Normalized MRZ Lines (30 chars each) ===");
  console.log(mrzLines);

  // 6. Parse with mrz package
  const parsedData: OCRResults = {
    name: undefined,
    surname: undefined,
    tcNo: undefined,
    rawText: text,
  };

  if (mrzLines.length >= 2) {
    try {
      const mrzResult = parse(mrzLines);

      if (mrzResult.fields) {
        // mrz package returns fields as Record<string, string | null>
        // Access using type assertion
        const fields = mrzResult.fields as Record<string, string | null>;

        // Name (from givenNames field)
        const givenNames = fields["givenNames"];
        if (givenNames) {
          parsedData.name = givenNames.split(" ")[0]; // Take first name
        }

        // Surname
        const surname = fields["surname"];
        if (surname) {
          parsedData.surname = surname;
        }

        // TC No - Check multiple fields (personalNumber, optionalData, documentNumber)
        // Note: documentNumber is usually the Serial Number (e.g., A12B12345)
        // TC No is typically in personalNumber or optionalData fields
        let tcNoFound = false;

        // Try personalNumber first (most common for TC No)
        const personalNumber = fields["personalNumber"];
        if (personalNumber) {
          const docNo = personalNumber.replace(/</g, "");
          if (docNo.length === 11 && /^\d+$/.test(docNo)) {
            parsedData.tcNo = docNo;
            tcNoFound = true;
          }
        }

        // Try optionalData if personalNumber didn't work
        if (!tcNoFound) {
          const optionalData = fields["optionalData"];
          if (optionalData) {
            const docNo = optionalData.replace(/</g, "");
            if (docNo.length === 11 && /^\d+$/.test(docNo)) {
              parsedData.tcNo = docNo;
              tcNoFound = true;
            }
          }
        }

        // Last resort: Try documentNumber (though it's usually Serial Number)
        if (!tcNoFound) {
          const documentNumber = fields["documentNumber"];
          if (documentNumber) {
            const docNo = documentNumber.replace(/</g, "");
            if (docNo.length === 11 && /^\d+$/.test(docNo)) {
              parsedData.tcNo = docNo;
            }
          }
        }
      }

      // Fallback: Manual parsing from MRZ line 3 if mrz package didn't extract name/surname
      // MRZ Line 3 format: SURNAME<<GIVENNAMES<<<<...
      if ((!parsedData.name || !parsedData.surname) && mrzLines.length >= 3) {
        const line3 = mrzLines[2]; // Third line contains name info
        console.log("=== Manual parsing MRZ Line 3 ===");
        console.log("Line 3:", line3);

        // Clean the line: remove all < characters for easier parsing
        const cleanLine3 = line3.replace(/</g, "").trim();

        // Try splitting by << first (standard MRZ format)
        let parts = line3
          .split(/<{2,}/)
          .map((part) => part.trim())
          .filter((part) => part.length > 0);

        console.log("Parts after << split:", parts);

        // If splitting by << didn't work well (OCR errors), use pattern-based parsing
        if (parts.length < 2 && cleanLine3.length > 0) {
          // Pattern-based approach: Turkish surnames are typically 7-10 chars, names 6-8 chars
          // Look for two consecutive uppercase word patterns

          // Extract all consecutive uppercase sequences (potential words)
          const uppercaseSequences = cleanLine3.match(/[A-Z]+/g) || [];
          console.log("Uppercase sequences found:", uppercaseSequences);

          if (uppercaseSequences.length >= 2) {
            // Try first two sequences as surname + name
            const firstSeq = uppercaseSequences[0];
            const secondSeq = uppercaseSequences[1];

            // Validate: surname should be 4-15 chars (more flexible), name should be 4-10 chars
            if (
              typeof firstSeq === "string" &&
              typeof secondSeq === "string" &&
              firstSeq.length >= 4 &&
              firstSeq.length <= 15 &&
              secondSeq.length >= 4 &&
              secondSeq.length <= 10
            ) {
              parts = [firstSeq, secondSeq];
              console.log(
                `✅ Found via sequence matching: surname=${firstSeq}, name=${secondSeq}`
              );
            } else {
              console.warn(
                `⚠️ Sequence validation failed: firstSeq=${firstSeq} (${firstSeq?.length}), secondSeq=${secondSeq} (${secondSeq?.length})`
              );
            }
          }

          // If still not found, try length-based splitting (more flexible)
          if (parts.length < 2) {
            // Turkish ID pattern: surname (4-15 chars) followed by name (4-10 chars)
            // Try wider range for surname
            for (let surnameLen = 4; surnameLen <= 15; surnameLen++) {
              if (cleanLine3.length > surnameLen + 4) {
                const potentialSurname = cleanLine3.substring(0, surnameLen);
                const rest = cleanLine3.substring(surnameLen);

                // Look for name pattern in rest (4-10 uppercase letters)
                const nameMatch = rest.match(/^[A-Z]{4,10}/);
                if (nameMatch) {
                  const potentialName = nameMatch[0];

                  // Verify both are valid uppercase words (more lenient)
                  if (
                    /^[A-Z]+$/.test(potentialSurname) &&
                    /^[A-Z]+$/.test(potentialName) &&
                    potentialSurname.length >= 4 &&
                    potentialName.length >= 4
                  ) {
                    parts = [potentialSurname, potentialName];
                    console.log(
                      `✅ Found via length-based split at ${surnameLen}: surname=${potentialSurname}, name=${potentialName}`
                    );
                    break;
                  }
                }
              }
            }
          }

          console.log("Final parts after parsing:", parts);
        }

        // Extract surname (first part) - more aggressive extraction
        if (parts.length >= 1 && !parsedData.surname) {
          let surname = parts[0];
          console.log("Raw surname part (parts[0]):", surname);

          // Remove any remaining < characters
          surname = surname.replace(/</g, "").trim();
          console.log("After removing <:", surname);

          // Extract first uppercase word (more reliable)
          const surnameMatch = surname.match(/^([A-Z]{4,15})/);
          if (surnameMatch) {
            parsedData.surname = surnameMatch[0];
            console.log("✅ Extracted surname:", parsedData.surname);
          } else {
            // Fallback: if no match, try the whole part after cleaning
            const cleaned = surname.replace(/[^A-Z]/g, "");
            if (cleaned.length >= 4 && cleaned.length <= 15) {
              parsedData.surname = cleaned;
              console.log(
                "✅ Extracted surname (fallback):",
                parsedData.surname
              );
            } else {
              console.warn("⚠️ Could not extract valid surname from:", surname);
            }
          }
        }

        // Extract name (second part)
        if (parts.length >= 2 && !parsedData.name) {
          const givenNames = parts[1].replace(/</g, "").trim();
          // Clean up: take first word (first name), max 10 chars
          const firstName = givenNames.match(/^[A-Z]{4,10}/);
          if (firstName && firstName[0].length >= 4) {
            parsedData.name = firstName[0];
            console.log("Extracted name:", parsedData.name);
          }
        }
      }

      // Fallback: Extract TC No from raw text or MRZ lines
      if (!parsedData.tcNo) {
        // Try from raw text first
        const tcNoMatch = text.match(/([0-9]{11})/);
        if (tcNoMatch) {
          parsedData.tcNo = tcNoMatch[1];
        } else if (mrzLines.length >= 2) {
          // Try from MRZ line 1 (TC No is usually after document number)
          const line1 = mrzLines[0];
          const line1Match = line1.match(/([0-9]{11})/);
          if (line1Match) {
            parsedData.tcNo = line1Match[1];
          }
        }
      }
    } catch (error) {
      console.error("MRZ parsing failed:", error);
      // Fallback: Extract TC No from raw text
      const tcNoMatch = text.match(/([0-9]{11})/);
      if (tcNoMatch) {
        parsedData.tcNo = tcNoMatch[1];
      }
    }
  }

  console.log("=== Final MRZ Results ===");
  console.log(parsedData);
  console.log(`Name: ${parsedData.name || "NOT FOUND"}`);
  console.log(`Surname: ${parsedData.surname || "NOT FOUND"}`);
  console.log(`TC No: ${parsedData.tcNo || "NOT FOUND"}`);

  // If mrzLines is empty, log warning
  if (mrzLines.length < 2) {
    console.warn("⚠️ WARNING: Less than 2 MRZ lines detected!");
    console.warn("OCR text might be too poor quality or MRZ not in frame");
  }

  return parsedData;
};
