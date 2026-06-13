// apps/admin/components/SmartActionButton.tsx

type Props = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  reason?: string;
  color?: "blue" | "yellow" | "red";
};

export default function SmartActionButton({
  label,
  onClick,
  disabled,
  reason,
  color = "blue",
}: Props) {
  const colors: any = {
    blue: "bg-blue-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
  };

  return (
    <div className="relative group">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`px-3 py-1 rounded text-white ${
          disabled
            ? "bg-gray-400 cursor-not-allowed"
            : `${colors[color]} hover:opacity-90`
        }`}
      >
        {label}
      </button>

      {/* 🔥 Tooltip */}
      {disabled && reason && (
        <div className="absolute hidden group-hover:block bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
          {reason}
        </div>
      )}
    </div>
  );
}