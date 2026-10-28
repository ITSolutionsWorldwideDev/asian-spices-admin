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
    <div className="page-wrapper">
      <div className="content p-6 mb-6">
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-lg px-8 py-6 flex flex-col items-center gap-4">

            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />

            <div className="relative flex items-center justify-center">
              <div className="absolute w-16 h-16 bg-blue-400 rounded-full opacity-30 animate-ping" />
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>

            <p className="text-gray-700 font-medium">{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
