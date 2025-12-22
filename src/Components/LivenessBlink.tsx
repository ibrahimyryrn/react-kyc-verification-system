import { Card, message } from "antd";
import Webcam from "react-webcam";
import { useRef, useEffect, useState } from "react";
import { useVerificationStore } from "../store/verificationStore";
import { detectBlinkInFrame } from "../utils/livenessHelper";
import { compareFaces } from "../utils/faceComparisonHelper";
import LoadingOverlay from "./LoadingOverlay";
import {
  REQUIRED_BLINKS,
  BLINK_DEBOUNCE_MS,
  FACE_MATCH_THRESHOLD,
} from "../config/constants";
import { logger } from "../utils/logger";

function LivenessBlink() {
  const webcamRef = useRef<Webcam>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const wasBlinkingRef = useRef(false);
  const lastBlinkTimeRef = useRef(0);
  const blinkCountRef = useRef(0);
  const isComparingRef = useRef(false); // Prevent multiple comparisons

  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [blinkCount, setBlinkCount] = useState(0);
  const requiredBlinks = REQUIRED_BLINKS;

  const {
    setProcessingLiveness,
    setCurrentStep,
    completeLiveness,
    isProcessingLiveness,
    croppedPortrait,
    livenessSelfie,
  } = useVerificationStore();

  // Continuous blink detection
  useEffect(() => {
    let isMounted = true;
    // Reset comparison flag and blink count when component mounts
    isComparingRef.current = false;
    blinkCountRef.current = 0;
    setBlinkCount(0);

    const detectBlink = async () => {
      if (
        !isMounted ||
        !webcamRef.current?.video ||
        isProcessingLiveness ||
        isComparingRef.current
      ) {
        return;
      }

      try {
        const video = webcamRef.current.video;
        if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
          if (isMounted) {
            animationFrameRef.current = requestAnimationFrame(detectBlink);
          }
          return;
        }

        const timestamp = performance.now(); // Use performance.now() instead of Date.now()
        const { faceDetected, blinkDetected } = await detectBlinkInFrame(
          video,
          timestamp
        );

        if (!isMounted) return;

        setIsFaceDetected(faceDetected);

        // Detect blink event: Count when eyes transition from CLOSED to OPEN
        // (blinkDetected = true means eyes are CLOSED)
        if (!blinkDetected && wasBlinkingRef.current) {
          // Eyes just opened - blink completed!
          const now = Date.now();
          // Debounce: Only count if last blink was more than BLINK_DEBOUNCE_MS ago
          if (now - lastBlinkTimeRef.current > BLINK_DEBOUNCE_MS) {
            blinkCountRef.current += 1;
            const newBlinkCount = blinkCountRef.current;
            lastBlinkTimeRef.current = now;

            setBlinkCount(newBlinkCount);

            logger.info(
              `✅ Blink completed! Count: ${newBlinkCount}/${requiredBlinks}`
            );
            message.success(
              `Blink detected! (${newBlinkCount}/${requiredBlinks})`
            );

            // If required blinks reached, perform face comparison
            if (newBlinkCount >= requiredBlinks && !isComparingRef.current) {
              // Prevent multiple comparisons
              isComparingRef.current = true;
              setProcessingLiveness(true);

              // Stop detection loop immediately
              if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = undefined;
              }

              // Compare faces: croppedPortrait (from ID) vs livenessSelfie (from selfie)
              try {
                if (!croppedPortrait || !livenessSelfie) {
                  message.error("Missing face images for comparison");
                  setProcessingLiveness(false);
                  // Reset and go back to selfie step
                  blinkCountRef.current = 0;
                  setBlinkCount(0);
                  isComparingRef.current = false;
                  setCurrentStep("liveness-front");
                  return;
                }

                message.info("Comparing faces...");
                const { isMatch, distance } = await compareFaces(
                  croppedPortrait,
                  livenessSelfie,
                  FACE_MATCH_THRESHOLD
                );

                if (isMatch) {
                  // Mark liveness as complete
                  completeLiveness();
                  message.success(
                    `Faces match! Identity verified. (Distance: ${distance.toFixed(
                      3
                    )})`
                  );

                  // Immediately return to start screen (no delay needed)
                  setCurrentStep("start");
                } else {
                  message.error(
                    `Faces do not match. Please try again. (Distance: ${distance.toFixed(
                      3
                    )})`
                  );
                  setProcessingLiveness(false);
                  // Reset blink count and go back to selfie step for retry
                  blinkCountRef.current = 0;
                  setBlinkCount(0);
                  isComparingRef.current = false;
                  setCurrentStep("liveness-front");
                }
              } catch (error) {
                logger.error("Error comparing faces:", error);
                message.error("Failed to compare faces. Please try again.");
                setProcessingLiveness(false);
                // Reset and go back to selfie step
                blinkCountRef.current = 0;
                setBlinkCount(0);
                isComparingRef.current = false;
                setCurrentStep("liveness-front");
              }
              return; // Stop detection loop
            }
          }
        }

        wasBlinkingRef.current = blinkDetected;
      } catch (error) {
        logger.error("Error detecting blink:", error);
      }

      // Continue detection loop only if not comparing and not processing
      if (isMounted && !isProcessingLiveness && !isComparingRef.current) {
        animationFrameRef.current = requestAnimationFrame(detectBlink);
      }
    };

    // Start detection loop
    animationFrameRef.current = requestAnimationFrame(detectBlink);

    return () => {
      isMounted = false;
      isComparingRef.current = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
    };
  }, [
    isProcessingLiveness,
    completeLiveness,
    setProcessingLiveness,
    setCurrentStep,
    requiredBlinks,
    croppedPortrait,
    livenessSelfie,
  ]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative px-6 py-8 bg-gray-900 text-white">
      <LoadingOverlay
        isVisible={isProcessingLiveness}
        message="Verifying liveness..."
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
              {/* Face detection indicator */}
              {!isFaceDetected && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <p className="text-white text-lg">
                    Position your face in the frame
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="text-center mb-12">
          <h3 className="text-2xl font-bold mb-2 text-white">
            Blink your eyes
          </h3>
          <p className="text-gray-400 text-lg mb-4">
            Please blink {requiredBlinks} times to verify you're alive
          </p>
          {blinkCount > 0 && (
            <div className="mt-4">
              <p className="text-green-400 text-xl font-semibold">
                Blinks detected: {blinkCount}/{requiredBlinks}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LivenessBlink;
