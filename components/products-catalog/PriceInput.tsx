// apps/admin/components/products-catalog/PriceInput.tsx


"use client";

type Props = {
  value?: number;
  onChange: (val: number) => void;
};

export default function PriceInput({ value, onChange }: Props) {
  return (
    <input
      type="number"
      value={value ?? ""}
      min={0}
      step="0.01"
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-24 px-2 py-1 border rounded"
    />
  );
}