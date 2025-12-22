import { Card, Button, message } from "antd";
import Webcam from "react-webcam";
import CornerFrame from "../utils/CornerFrame";
import { useRef, useCallback, useState, useEffect } from "react";
import { useVerificationStore } from "../store/verificationStore";
import { extractFaceFromSelfie } from "../utils/livenessHelper";
import LoadingOverlay from "./LoadingOverlay";
import { logger } from "../utils/logger";

function LivenessFrontPhoto() {
  const webcamRef = useRef<Webcam>(null);
  const [isFaceDetected, setIsFaceDetected] = useState(false);

  const {
    setLivenessSelfie,
    setProcessingLiveness,
    setCurrentStep,
    isProcessingLiveness,
  } = useVerificationStore();

  // Check for face detection periodically
  useEffect(() => {
    const checkFace = async () => {
      if (!webcamRef.current?.video || isProcessingLiveness) {
        return;
      }

      try {
        const video = webcamRef.current.video;
        if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
          return;
        }

        // Use a simple canvas-based face detection check
        // For better accuracy, we'll rely on the capture function to use MediaPipe
        // This is just a UI indicator
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          // Simple check - in production, you might want to use MediaPipe here too
          // For now, we'll just enable the button when video is ready
          setIsFaceDetected(true);
        }
      } catch (error) {
        logger.error("Error checking face:", error);
      }
    };

    const interval = setInterval(checkFace, 500);
    return () => clearInterval(interval);
  }, [isProcessingLiveness]);

  const captureAndProcess = useCallback(async () => {
    if (!webcamRef.current) {
      return;
    }

    const imageSrc = webcamRef.current.getScreenshot();

    if (!imageSrc) {
      message.error("Failed to capture image. Please try again.");
      return;
    }

    setProcessingLiveness(true);

    try {
      // Extract face from selfie using MediaPipe
      const croppedFace = await extractFaceFromSelfie(imageSrc);

      if (!croppedFace) {
        message.warning(
          "Face not detected. Please ensure your face is clearly visible and try again."
        );
        setProcessingLiveness(false);
        return;
      }

      // Save selfie to store
      setLivenessSelfie(croppedFace);

      // Success - move to blink detection step
      message.success("Selfie captured successfully!");
      setProcessingLiveness(false);
      setCurrentStep("liveness-blink");
    } catch (error) {
      logger.error("Error processing selfie:", error);
      message.error("Failed to process selfie. Please try again.");
      setProcessingLiveness(false);
    }
  }, [setLivenessSelfie, setProcessingLiveness, setCurrentStep]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative px-6 py-8 bg-gray-900 text-white">
      <LoadingOverlay
        isVisible={isProcessingLiveness}
        message="Processing selfie..."
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
                screenshotQuality={1}
                ref={webcamRef}
                audio={false}
                videoConstraints={{
                  width: 1920,
                  height: 1080,
                  facingMode: "user", // Front camera
                }}
                className="w-full h-full object-cover"
              />
              <CornerFrame />
            </div>
          </Card>
        </div>

        <div className="text-center mb-12">
          <h3 className="text-2xl font-bold mb-2 text-white">Take a selfie</h3>
          <p className="text-gray-400 text-lg">
            Position your face clearly in the frame
          </p>
        </div>
      </div>

      {/* Take Photo Button */}
      <div className="w-full flex justify-center pb-8">
        <Button
          type="primary"
          shape="circle"
          disabled={isProcessingLiveness || !isFaceDetected}
          onClick={captureAndProcess}
          aria-label={
            isFaceDetected
              ? "Take selfie photo"
              : "Please position your face in the frame first"
          }
          style={{
            width: "80px",
            height: "80px",
            backgroundColor: isFaceDetected ? "#fff" : "#666",
            border: "none",
          }}
        >
          <div className="w-16 h-16 rounded-full bg-white border-4 border-gray-800 mx-auto" />
        </Button>
      </div>
    </div>
  );
}

export default LivenessFrontPhoto;
