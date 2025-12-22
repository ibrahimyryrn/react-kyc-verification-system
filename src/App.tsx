import { lazy, Suspense } from "react";
import { useVerificationStore } from "./store/verificationStore";
import LoadingOverlay from "./Components/LoadingOverlay";
import "./index.css";

// Lazy load components for code splitting
const IdentityPhoto = lazy(() => import("./Components/IdentityPhoto"));
const IdentityBackPhoto = lazy(() => import("./Components/IdentityBackPhoto"));
const LivenessFrontPhoto = lazy(
  () => import("./Components/LivenessFrontPhoto")
);
const LivenessBlink = lazy(() => import("./Components/LivenessBlink"));
const VerifyStart = lazy(() => import("./Components/VerifyStart"));

function App() {
  const { currentStep, setCurrentStep } = useVerificationStore();

  return (
    <Suspense
      fallback={<LoadingOverlay isVisible={true} message="Loading..." />}
    >
      {currentStep === "identity-front" && <IdentityPhoto />}
      {currentStep === "identity-back" && <IdentityBackPhoto />}
      {currentStep === "liveness-front" && <LivenessFrontPhoto />}
      {currentStep === "liveness-blink" && <LivenessBlink />}
      {currentStep === "start" && (
        <VerifyStart
          onSelectGovernmentID={() => setCurrentStep("identity-front")}
          onSelectLiveness={() => setCurrentStep("liveness-front")}
        />
      )}
    </Suspense>
  );
}

export default App;
