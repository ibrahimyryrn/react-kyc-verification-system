/**
 * MRZ text parsing module
 * Extracts name, surname, and TC No from MRZ OCR text
 */
import { parse } from "mrz";
import type { OCRResults } from "../store/verificationStore";

/**
 * Parses OCR text and extracts MRZ data
 * Uses mrz package first, then falls back to manual parsing if needed
 */
export const parseOCRText = (text: string): OCRResults => {
  const parsedData: OCRResults = {
    name: undefined,
    surname: undefined,
    tcNo: undefined,
    rawText: text,
  };

  const allLines = text.split(/\n|\r/).map((line) => line.trim());

  let mrzLines = allLines
    .filter((line) => line.length > 20 && /^[A-Z0-9<]{20,}$/.test(line))
    .slice(0, 3);

  // Normalize to TD1 format (30 characters per line)
  mrzLines = mrzLines.map((line) => {
    let cleaned = line.replace(/[^A-Z0-9<]/g, "");

    if (cleaned.length > 30) {
      cleaned = cleaned.substring(0, 30);
    }

    while (cleaned.length < 30) {
      cleaned += "<";
    }

    return cleaned;
  });

  if (mrzLines.length >= 2) {
    try {
      const mrzResult = parse(mrzLines);

      if (mrzResult.fields) {
        const fields = mrzResult.fields as Record<string, string | null>;

        const givenNames = fields["givenNames"];
        if (givenNames) {
          parsedData.name = givenNames.split(" ")[0];
        }

        const surname = fields["surname"];
        if (surname) {
          parsedData.surname = surname;
        }

        // TC No typically in personalNumber or optionalData (documentNumber is Serial Number)
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

        // Last resort (documentNumber is usually Serial Number, not TC No)
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

      // Fallback: Manual parsing (format: SURNAME<<GIVENNAMES<<<<...)
      if ((!parsedData.name || !parsedData.surname) && mrzLines.length >= 3) {
        const line3 = mrzLines[2];
        const cleanLine3 = line3.replace(/</g, "").trim();

        let parts = line3
          .split(/<{2,}/)
          .map((part) => part.trim())
          .filter((part) => part.length > 0);

        if (parts.length < 2 && cleanLine3.length > 0) {
          // Pattern-based: Turkish surnames 4-15 chars, names 4-15 chars
          const uppercaseSequences = cleanLine3.match(/[A-Z]+/g) || [];

          if (uppercaseSequences.length >= 2) {
            const firstSeq = uppercaseSequences[0];
            const secondSeq = uppercaseSequences[1];

            if (
              typeof firstSeq === "string" &&
              typeof secondSeq === "string" &&
              firstSeq.length >= 4 &&
              firstSeq.length <= 15 &&
              secondSeq.length >= 4 &&
              secondSeq.length <= 15
            ) {
              parts = [firstSeq, secondSeq];
            }
          }

          // Length-based fallback (surname 4-15 chars, name 4-15 chars)
          if (parts.length < 2) {
            for (let surnameLen = 4; surnameLen <= 15; surnameLen++) {
              if (cleanLine3.length > surnameLen + 4) {
                const potentialSurname = cleanLine3.substring(0, surnameLen);
                const rest = cleanLine3.substring(surnameLen);

                const nameMatch = rest.match(/^[A-Z]{4,15}/);
                if (nameMatch) {
                  const potentialName = nameMatch[0];

                  if (
                    /^[A-Z]+$/.test(potentialSurname) &&
                    /^[A-Z]+$/.test(potentialName) &&
                    potentialSurname.length >= 4 &&
                    potentialName.length >= 4
                  ) {
                    parts = [potentialSurname, potentialName];
                    break;
                  }
                }
              }
            }
          }
        }

        if (parts.length >= 1 && !parsedData.surname) {
          const surname = parts[0].replace(/</g, "").trim();

          const surnameMatch = surname.match(/^([A-Z]{4,15})/);
          if (surnameMatch) {
            parsedData.surname = surnameMatch[0];
          } else {
            const cleaned = surname.replace(/[^A-Z]/g, "");
            if (cleaned.length >= 4 && cleaned.length <= 15) {
              parsedData.surname = cleaned;
            }
          }
        }

        if (parts.length >= 2 && !parsedData.name) {
          const givenNames = parts[1].replace(/</g, "").trim();
          const firstName = givenNames.match(/^[A-Z]{4,15}/);
          if (firstName && firstName[0].length >= 4) {
            parsedData.name = firstName[0];
          }
        }
      }

      if (!parsedData.tcNo) {
        const tcNoMatch = text.match(/([0-9]{11})/);
        if (tcNoMatch) {
          parsedData.tcNo = tcNoMatch[1];
        } else if (mrzLines.length >= 2) {
          // TC No usually in line 1 after document number
          const line1 = mrzLines[0];
          const line1Match = line1.match(/([0-9]{11})/);
          if (line1Match) {
            parsedData.tcNo = line1Match[1];
          }
        }
      }
    } catch (error) {
      console.error("MRZ parsing failed:", error);
      const tcNoMatch = text.match(/([0-9]{11})/);
      if (tcNoMatch) {
        parsedData.tcNo = tcNoMatch[1];
      }
    }
  }

  return parsedData;
};
