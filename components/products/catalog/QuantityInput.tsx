// components/products-catalog/QuantityInput.tsx

"use client";

type Props = {
  value?: number;
  onChange: (val: number) => void;
};

export default function QuantityInput({ value, onChange }: Props) {
  return (
    <input
      type="number"
      value={value ?? ""}
      min={0}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-20 px-2 py-1 border rounded"
    />
  );
}