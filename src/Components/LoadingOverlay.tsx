import { Spin } from "antd";

interface LoadingOverlayProps {
  message?: string;
  isVisible: boolean;
}

/**
 * Reusable loading overlay component
 * Used across different screens for consistent loading UI
 */
export default function LoadingOverlay({
  message = "Processing...",
  isVisible,
}: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div
      className="absolute inset-0 z-50 bg-black/70 flex flex-col items-center justify-center"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <Spin size="large" />
      <p className="mt-4 text-lg font-medium text-white">{message}</p>
    </div>
  );
}
