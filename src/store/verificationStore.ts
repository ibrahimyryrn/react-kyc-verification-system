import { create } from "zustand";

export interface OCRResults {
  name?: string;
  surname?: string;
  birthDate?: string;
  tcNo?: string;
  rawText?: string;
  [key: string]: string | undefined;
}

interface VerificationState {
  // Current step in the flow
  currentStep:
    | "start"
    | "identity-front"
    | "identity-back"
    | "liveness-front"
    | "liveness-blink";

  // Government ID - Step 1
  identityPhoto: string | null;
  ocrResults: OCRResults | null;
  croppedPortrait: string | null;
  isProcessingGovernmentID: boolean;
  isGovernmentIDComplete: boolean;

  // Liveness Check - Step 2
  livenessSelfie: string | null;
  isProcessingLiveness: boolean;
  isLivenessComplete: boolean;

  // Actions - Step 1
  setCurrentStep: (
    step:
      | "start"
      | "identity-front"
      | "identity-back"
      | "liveness-front"
      | "liveness-blink"
  ) => void;
  setIdentityPhoto: (photo: string) => void;
  setOCRResults: (results: OCRResults | null) => void;
  setCroppedPortrait: (portrait: string) => void;
  setProcessingGovernmentID: (processing: boolean) => void;
  completeGovernmentID: () => void;

  // Actions - Step 2 (Liveness)
  setLivenessSelfie: (selfie: string) => void;
  setProcessingLiveness: (processing: boolean) => void;
  completeLiveness: () => void;

  // Reset store to initial state
  resetStore: () => void;
}

const initialState = {
  currentStep: "start" as const,
  identityPhoto: null,
  ocrResults: null,
  croppedPortrait: null,
  isProcessingGovernmentID: false,
  isGovernmentIDComplete: false,
  livenessSelfie: null,
  isProcessingLiveness: false,
  isLivenessComplete: false,
};

export const useVerificationStore = create<VerificationState>((set) => ({
  ...initialState,

  setCurrentStep: (step) => set({ currentStep: step }),

  setIdentityPhoto: (photo) => set({ identityPhoto: photo }),

  setOCRResults: (results) => set({ ocrResults: results }),

  setCroppedPortrait: (portrait) => set({ croppedPortrait: portrait }),

  setProcessingGovernmentID: (processing) =>
    set({ isProcessingGovernmentID: processing }),

  completeGovernmentID: () =>
    set({
      isGovernmentIDComplete: true,
      isProcessingGovernmentID: false,
    }),

  // Actions - Step 2 (Liveness)
  setLivenessSelfie: (selfie) => set({ livenessSelfie: selfie }),
  setProcessingLiveness: (processing) =>
    set({ isProcessingLiveness: processing }),
  completeLiveness: () =>
    set({
      isLivenessComplete: true,
      isProcessingLiveness: false,
    }),

  resetStore: () => set(initialState),
}));
