import { Card, Button, message } from "antd";
import Webcam from "react-webcam";
import { useRef, useCallback, useMemo } from "react";
import { useVerificationStore } from "../store/verificationStore";
import { useOCR } from "../hooks/useOCR";
import LoadingOverlay from "./LoadingOverlay";
import { logger } from "../utils/logger";

// Corner frame configuration - moved outside component to prevent recreation
const CORNER_FRAME_CONFIG = [
  {
    pos: "top-0 left-0",
    border: "border-t-4 border-l-4",
    radius: "rounded-tl-lg",
  },
  {
    pos: "top-0 right-0",
    border: "border-t-4 border-r-4",
    radius: "rounded-tr-lg",
  },
  {
    pos: "bottom-0 left-0",
    border: "border-b-4 border-l-4",
    radius: "rounded-bl-lg",
  },
  {
    pos: "bottom-0 right-0",
    border: "border-b-4 border-r-4",
    radius: "rounded-br-lg",
  },
] as const;

function IdentityBackPhoto() {
  const webcamRef = useRef<Webcam>(null);
  const { scanImage, isReady } = useOCR();

  // Optimized: Only select required state and actions from Zustand store
  const isProcessingGovernmentID = useVerificationStore(
    (state) => state.isProcessingGovernmentID
  );
  const ocrResults = useVerificationStore((state) => state.ocrResults);
  const setProcessingGovernmentID = useVerificationStore(
    (state) => state.setProcessingGovernmentID
  );
  const setOCRResults = useVerificationStore((state) => state.setOCRResults);
  const setCurrentStep = useVerificationStore((state) => state.setCurrentStep);
  const completeGovernmentID = useVerificationStore(
    (state) => state.completeGovernmentID
  );

  // Memoize OCR validation to prevent recalculation on every render
  const hasValidOCRResults = useMemo(
    () => Boolean(ocrResults?.name && ocrResults?.surname && ocrResults?.tcNo),
    [ocrResults?.name, ocrResults?.surname, ocrResults?.tcNo]
  );

  // Type-safe OCR results - only available when valid (memoized for type narrowing)
  const validOCRResults = useMemo(
    () => (hasValidOCRResults && ocrResults ? ocrResults : null),
    [hasValidOCRResults, ocrResults]
  );

  const captureAndProcess = useCallback(async () => {
    if (!webcamRef.current) {
      return;
    }

    if (!isReady) {
      message.warning("OCR is still initializing. Please wait...");
      return;
    }

    const imageSrc = webcamRef.current.getScreenshot();

    if (!imageSrc) {
      message.error("Failed to capture image. Please try again.");
      return;
    }

    setProcessingGovernmentID(true);

    try {
      // Extract MRZ data using OCR (optimized with reusable worker)
      const mrzData = await scanImage(imageSrc);

      if (!mrzData) {
        message.error("Failed to process ID card. Please try again.");
        setProcessingGovernmentID(false);
        return;
      }

      // Save OCR results
      setOCRResults(mrzData);

      // Check if we got the required fields
      if (!mrzData.name || !mrzData.surname || !mrzData.tcNo) {
        message.warning(
          "Could not read ID. Please ensure the 3-line MRZ section is clearly visible and try again."
        );
        setProcessingGovernmentID(false);
        return;
      }

      // Success - show results for user verification
      message.success(
        "ID information extracted. Please verify the details below."
      );
      setProcessingGovernmentID(false);
    } catch (error) {
      logger.error("Error processing back photo:", error);
      message.error("Failed to process ID card. Please try again.");
      setProcessingGovernmentID(false);
    }
  }, [isReady, scanImage, setProcessingGovernmentID, setOCRResults]);

  const handleConfirm = useCallback(() => {
    // Mark government ID as complete
    completeGovernmentID();

    // Success message
    message.success("ID information confirmed successfully!");

    // Return to start screen
    setCurrentStep("start");
  }, [completeGovernmentID, setCurrentStep]);

  const handleRetry = useCallback(() => {
    // Clear OCR results to allow retry
    setOCRResults(null);
    message.info("Please take a new photo of the ID card back.");
  }, [setOCRResults]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative px-6 py-8 bg-gray-900 text-white">
      <LoadingOverlay
        isVisible={isProcessingGovernmentID}
        message="Processing MRZ..."
      />

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl">
        {/* MRZ-sized camera view (3.2:1 aspect ratio, 75% width - smaller rectangle, reduced height) */}
        <div className="relative w-[75%] mb-8" style={{ aspectRatio: "3.2/1" }}>
          <Card
            className="overflow-hidden h-full rounded-[24px] border-4 border-white bg-black"
            styles={{ body: { padding: 0, height: "100%" } }}
          >
            <div className="relative w-full h-full">
              <Webcam
                screenshotFormat="image/jpeg"
                screenshotQuality={1}
                ref={webcamRef}
                audio={false}
                videoConstraints={{
                  width: 1920,
                  height: 540,
                  facingMode: "environment",
                }}
                className="w-full h-full object-cover"
              />
              {/* Corner indicators only (no frame overlay needed) */}
              <div className="absolute inset-0 pointer-events-none">
                {CORNER_FRAME_CONFIG.map((corner, idx) => (
                  <div
                    key={idx}
                    className={`absolute ${corner.pos} w-8 h-8 ${corner.border} border-white ${corner.radius}`}
                  />
                ))}
              </div>
            </div>
          </Card>
        </div>

        <div className="text-center mb-12">
          <h3 className="text-2xl font-bold mb-2 text-white">Back of card</h3>
          <p className="text-gray-400 text-lg">
            Position the 3-line MRZ section clearly in the frame
          </p>
        </div>
      </div>

      {/* Take Photo Button - Only show when no valid OCR results */}
      {!hasValidOCRResults && (
        <div className="w-full flex justify-center pb-8">
          <Button
            type="primary"
            shape="circle"
            disabled={isProcessingGovernmentID}
            onClick={captureAndProcess}
            aria-label="Take photo of ID card back (MRZ section)"
            style={{
              width: "80px",
              height: "80px",
              backgroundColor: "#fff",
              border: "none",
            }}
          >
            <div className="w-16 h-16 rounded-full bg-white border-4 border-gray-800 mx-auto" />
          </Button>
        </div>
      )}

      {/* Show OCR results with confirmation buttons */}
      {validOCRResults && (
        <div className="mt-8 p-6 bg-zinc-800 rounded-2xl max-w-md w-full mb-8">
          <h4 className="text-xl font-bold mb-4 text-white">
            Extracted Information:
          </h4>
          <div className="space-y-3 text-white mb-6">
            {validOCRResults.name && (
              <div>
                <span className="font-semibold">Name:</span>{" "}
                {validOCRResults.name}
              </div>
            )}
            {validOCRResults.surname && (
              <div>
                <span className="font-semibold">Surname:</span>{" "}
                {validOCRResults.surname}
              </div>
            )}
            {validOCRResults.tcNo && (
              <div>
                <span className="font-semibold">TC No:</span>{" "}
                {validOCRResults.tcNo}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-6">
            <Button
              type="default"
              size="large"
              onClick={handleRetry}
              className="flex-1"
              aria-label="Retry taking photo of ID card back"
              style={{
                backgroundColor: "#52525b",
                borderColor: "#52525b",
                color: "white",
              }}
            >
              Retry
            </Button>
            <Button
              type="primary"
              size="large"
              onClick={handleConfirm}
              className="flex-1"
              aria-label="Confirm and proceed with extracted information"
              style={{
                backgroundColor: "#10b981",
                borderColor: "#10b981",
              }}
            >
              Confirm
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default IdentityBackPhoto;
