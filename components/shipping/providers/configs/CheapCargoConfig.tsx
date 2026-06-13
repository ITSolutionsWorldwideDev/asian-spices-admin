// apps/admin/components/shipping/providers/configs/CheapCargoConfig.tsx
"use client";

import { useState } from "react";

export default function CheapCargoConfig({ config }: any) {
  const [form, setForm] = useState({
    defaultPackageSize: config?.defaultPackageSize || "",
    labelFormat: config?.labelFormat || "pdf",
  });

  return (
    <div className="card p-4 space-y-3">
      <h3 className="font-semibold">CheapCargo Settings</h3>

      <input
        placeholder="Default Package Size"
        className="input"
        value={form.defaultPackageSize}
        onChange={(e) =>
          setForm({ ...form, defaultPackageSize: e.target.value })
        }
      />

      <select
        className="input"
        value={form.labelFormat}
        onChange={(e) =>
          setForm({ ...form, labelFormat: e.target.value })
        }
      >
        <option value="pdf">PDF</option>
        <option value="zpl">ZPL</option>
      </select>

      <button className="btn btn-primary">Save Config</button>
    </div>
  );
}