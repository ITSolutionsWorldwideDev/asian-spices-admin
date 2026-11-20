// components/loader-overlay.tsx

"use client";

type LoaderOverlayProps = {
  show: boolean;
  message?: string;
  variant?: "default" | "minimal" | "fullscreen";
};

export default function LoaderOverlay({
  show,
  message = "Processing...",
}: LoaderOverlayProps) {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-busy="true"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className="bg-white rounded-xl shadow-lg px-8 py-6 flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-700 font-medium">{message}</p>
      </div>
    </div>
  );
}
