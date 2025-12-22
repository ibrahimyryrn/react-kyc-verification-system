import { Card, Button, message } from "antd";
import Webcam from "react-webcam";
import CornerFrame from "../utils/CornerFrame";
import { useRef, useCallback } from "react";
import { useVerificationStore } from "../store/verificationStore";
import { extractFaceFromID } from "../utils/faceHelper";
import LoadingOverlay from "./LoadingOverlay";
import { logger } from "../utils/logger";

function IdentityPhoto() {
  const webcamRef = useRef<Webcam>(null);

  // Get the required state and actions from the Zustand Store
  const {
    setIdentityPhoto,
    setProcessingGovernmentID,
    setCroppedPortrait,
    setCurrentStep,
    isProcessingGovernmentID,
    croppedPortrait,
  } = useVerificationStore();

  // Capture and process photo
  const captureAndProcess = useCallback(async () => {
    if (!webcamRef.current) {
      return;
    }

    const imageSrc = webcamRef.current.getScreenshot();

    if (!imageSrc) {
      message.error("Failed to capture image. Please try again.");
      return;
    }

    // Save original photo
    setIdentityPhoto(imageSrc);
    setProcessingGovernmentID(true);

    try {
      // Extract and crop face using MediaPipe
      const croppedFace = await extractFaceFromID(imageSrc);

      if (!croppedFace) {
        message.warning(
          "Face not detected. Please ensure the ID card is clear and try again."
        );
        setProcessingGovernmentID(false);
        return;
      }

      // Save cropped portrait
      setCroppedPortrait(croppedFace);

      // Success - move to back photo step
      message.success("Front photo captured successfully!");
      setProcessingGovernmentID(false);
      setCurrentStep("identity-back");
    } catch (error) {
      logger.error("Error processing front photo:", error);
      message.error("Failed to process ID card. Please try again.");
      setProcessingGovernmentID(false);
    }
  }, [
    setIdentityPhoto,
    setProcessingGovernmentID,
    setCroppedPortrait,
    setCurrentStep,
  ]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative px-6 py-8 bg-gray-900 text-white">
      <LoadingOverlay
        isVisible={isProcessingGovernmentID}
        message="Processing your ID..."
      />

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl">
        <div className="relative w-full aspect-4/3 max-w-md mb-8">
          <Card
            className="overflow-hidden h-full rounded-[24px] border-none bg-black"
            styles={{ body: { padding: 0, height: "100%" } }}
          >
            <div className="relative w-full h-full">
              <Webcam
                screenshotFormat="image/jpeg"
                screenshotQuality={1} // Highest quality
                ref={webcamRef}
                audio={false}
                videoConstraints={{
                  width: 1920,
                  height: 1080,
                  facingMode: "environment",
                }}
                className="w-full h-full object-cover"
              />
              <CornerFrame />
            </div>
          </Card>
        </div>

        <div className="text-center mb-12">
          <h3 className="text-2xl font-bold mb-2 text-white">Front of card</h3>
          <p className="text-gray-400 text-lg">
            Position all 4 corners of the front clearly in the frame
          </p>
        </div>
      </div>

      {/* Take Photo Button */}
      <div className="w-full flex justify-center pb-8">
        <Button
          type="primary"
          shape="circle"
          disabled={isProcessingGovernmentID}
          onClick={captureAndProcess}
          aria-label="Take photo of ID card front"
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

      {/* Temporary: Show cropped portrait preview (remove later) */}
      {croppedPortrait && (
        <div className="mt-8 p-6 bg-zinc-800 rounded-2xl max-w-md w-full">
          <h4 className="text-xl font-bold mb-4 text-white">
            Cropped Portrait (Preview):
          </h4>
          <div className="rounded-lg overflow-hidden">
            <img
              src={croppedPortrait}
              alt="Cropped portrait preview from ID card"
              className="w-full h-auto max-h-64 object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default IdentityPhoto;
