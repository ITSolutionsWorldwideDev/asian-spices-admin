// components/platform/partners/PartnerDetail.tsx

"use client";

import { useState, useEffect } from "react";
import { approvePartner, rejectPartner, deletePartner } from "./actions";

function isEmpty(value: unknown) {
  if (value == null) return true;
  const s = String(value).trim();
  return !s || s === "-" || s === "undefined" || s === "null";
}

/** Fields that should be present before approving a partner application. */
function getMissingPartnerFields(partner: any): string[] {
  const missing: string[] = [];

  if (isEmpty(partner.company_name)) missing.push("Company Name");
  // KVK no longer required for approval (capture disabled on registration)
  if (isEmpty(partner.vat_number)) missing.push("VAT Number");
  if (isEmpty(partner.chamber_of_commerce_number))
    missing.push("Chamber of Commerce");
  if (isEmpty(partner.first_name) && isEmpty(partner.last_name))
    missing.push("Name");
  if (isEmpty(partner.business_email_address)) missing.push("Email");
  if (isEmpty(partner.business_phone_number)) missing.push("Phone");
  if (isEmpty(partner.street)) missing.push("Street");
  if (isEmpty(partner.house_number)) missing.push("House Number");
  if (isEmpty(partner.city)) missing.push("City");
  if (isEmpty(partner.postal_code)) missing.push("Postal Code");
  if (isEmpty(partner.country)) missing.push("Country");

  const chamberDocs = partner.chamber_of_commerce_extract_document;
  const hasChamberDoc = Array.isArray(chamberDocs)
    ? chamberDocs.some(Boolean)
    : !!chamberDocs;
  if (!hasChamberDoc) missing.push("Chamber of Commerce Extract");

  return missing;
}

export default function PartnerDetail({ partner }: any) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    const missing = getMissingPartnerFields(partner);
    if (missing.length > 0) {
      const ok = confirm(
        `These things are missing:\n\n• ${missing.join("\n• ")}\n\nAre you sure you want to approve?`,
      );
      if (!ok) return;
    }

    setLoading(true);
    try {
      await approvePartner(partner.partner_id);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) {
      alert("Rejection reason required");
      return;
    }

    setLoading(true);
    try {
      await rejectPartner(partner.partner_id, reason);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this partner? This cannot be undone.",
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      await deletePartner(partner.partner_id);
    } catch (err) {
      console.error("Failed to delete partner:", err);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 🏢 COMPANY INFO */}
      <Section title="Company Info">
        <Field label="Company Name" value={partner.company_name} />
        <Field label="KVK Number" value={partner.kvk_number} />
        <Field label="VAT Number" value={partner.vat_number} />
        <Field
          label="Chamber of Commerce"
          value={partner.chamber_of_commerce_number}
        />
      </Section>

      {/* 👤 CONTACT */}
      <Section title="Contact Info">
        <Field
          label="Name"
          value={`${partner.first_name} ${partner.last_name}`}
        />
        <Field label="Email" value={partner.business_email_address} />
        <Field label="Phone" value={partner.business_phone_number} />
      </Section>

      {/* 📍 ADDRESS */}
      <Section title="Address">
        <Field
          label="Street"
          value={`${partner.street} ${partner.house_number}`}
        />
        <Field label="City" value={partner.city} />
        <Field label="Postal Code" value={partner.postal_code} />
        <Field label="Country" value={partner.country} />
      </Section>

      {/* 📄 DOCUMENTS */}
      <Section title="Documents">
        <DocumentPreview
          label="Chamber of Commerce Extract"
          files={partner.chamber_of_commerce_extract_document}
        />

        <DocumentPreview
          label="Power of Attorney"
          files={partner.power_of_attorney_document}
        />
      </Section>

      {/* ⚙️ STATUS */}
      <Section title="Status">
        <p className="text-sm">
          Current Status:{" "}
          <span className="font-semibold">{partner.status}</span>
        </p>

        {partner.rejection_reason && (
          <p className="text-sm text-red-500">
            Reason: {partner.rejection_reason}
          </p>
        )}
      </Section>

      {/* ✅ ACTIONS */}
      <div className="card p-4 space-y-3">
        <h3 className="font-semibold">Actions</h3>

        {partner.status === "pending" && (
          <>
            <div className="flex gap-3">
              <button
                className="btn btn-success"
                disabled={loading}
                onClick={handleApprove}
              >
                Approve
              </button>

              <button
                className="btn btn-danger"
                disabled={loading}
                onClick={handleReject}
              >
                Reject
              </button>
            </div>

            <textarea
              placeholder="Rejection reason..."
              className="w-full border p-2 text-sm"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </>
        )}

        <button
          className="btn btn-danger"
          disabled={loading}
          onClick={handleDelete}
        >
          Delete Partner
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: any) {
  return (
    <div className="card p-4 space-y-3">
      <h3 className="font-semibold">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function Field({ label, value }: any) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 mt-4">{label}</p>
      {/* <p className="text-sm font-medium">{value || "-"}</p> */}
      <input
        name={label}
        value={value || "-"}
        className="w-full px-4 py-2 border-none bg-gray-100 text-gray-800 cursor-not-allowed border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
        disabled
      />
    </div>
  );
}

/** Pull a usable data:/http(s) URL out of DB values (plain URL or JSON {base64}). */
function extractDataUrl(entry: unknown): string {
  if (entry == null || entry === "") return "";

  if (typeof entry === "object" && !Array.isArray(entry)) {
    const o = entry as Record<string, unknown>;
    return extractDataUrl(o.base64 || o.url || o.data || "");
  }

  let s = String(entry).trim();
  if (!s) return "";

  for (let i = 0; i < 3; i++) {
    if (
      s.startsWith("data:") ||
      s.startsWith("http://") ||
      s.startsWith("https://") ||
      s.startsWith("blob:")
    ) {
      return s;
    }
    if (s.startsWith("{") || s.startsWith("[")) {
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) return extractDataUrl(parsed[0]);
        if (parsed && typeof parsed === "object") {
          const next = parsed.base64 || parsed.url || parsed.data;
          if (next) {
            s = String(next).trim();
            continue;
          }
        }
      } catch {
        // text column sometimes holds a Postgres array literal:
        // {"{\"name\":\"x\",\"base64\":\"data:...\"}"}
        break;
      }
    }
    break;
  }

  // Fallback: pull embedded data URL out of escaped / array-literal strings
  const embedded = s.match(
    /data:[a-zA-Z0-9.+/-]+;base64,[A-Za-z0-9+/=]+/,
  );
  return embedded?.[0] || "";
}

function normalizeFilesList(files: unknown): string[] {
  if (!files) return [];
  if (Array.isArray(files)) {
    return files.map(extractDataUrl).filter(Boolean);
  }

  const raw = String(files).trim();
  // Postgres array literal stored in a text column (Power of Attorney)
  if (
    raw.startsWith("{") &&
    raw.endsWith("}") &&
    (raw.includes('\\"') || raw.includes('base64'))
  ) {
    const matches = [
      ...raw.matchAll(/data:[a-zA-Z0-9.+/-]+;base64,[A-Za-z0-9+/=]+/g),
    ];
    if (matches.length) return matches.map((m) => m[0]);

    // Unwrap quoted postgres array elements → JSON objects
    const quoted = [...raw.slice(1, -1).matchAll(/"(?:\\.|[^"\\])*"/g)];
    if (quoted.length) {
      return quoted
        .map((m) => {
          try {
            return extractDataUrl(JSON.parse(m[0]));
          } catch {
            return extractDataUrl(m[0]);
          }
        })
        .filter(Boolean);
    }
  }

  const one = extractDataUrl(files);
  return one ? [one] : [];
}

function toBlobUrl(file: string): string {
  try {
    if (
      file.startsWith("blob:") ||
      file.startsWith("http://") ||
      file.startsWith("https://")
    ) {
      return file;
    }
    if (typeof window === "undefined" || !URL.createObjectURL) return "";

    let mime = "application/octet-stream";
    let base64 = file;

    if (file.startsWith("data:")) {
      const arr = file.split(",");
      if (arr.length < 2) return "";
      mime = arr[0].match(/:(.*?);/)?.[1] || mime;
      base64 = arr[1];
    }

    const byteString = atob(base64);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return URL.createObjectURL(new Blob([ab], { type: mime }));
  } catch (err) {
    console.error("Blob parsing error", err);
    return "";
  }
}

function DocumentPreview({ label, files }: { label: string; files: unknown }) {
  const list = normalizeFilesList(files);
  // Blob URLs only exist in the browser — build after mount to avoid hydration mismatch
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    const urls = list.map((file) => toBlobUrl(file));
    setPreviewUrls(urls);
    return () => {
      urls.forEach((url) => {
        if (url.startsWith("blob:")) URL.revokeObjectURL(url);
      });
    };
    // list contents are stable for a given partner payload
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  if (list.length === 0) {
    return (
      <div className="col-span-2">
        <p className="text-xs text-gray-500 font-semibold">{label}</p>
        <p className="text-sm text-gray-400 mt-1">No document uploaded</p>
      </div>
    );
  }

  const openFile = (file: string) => {
    const url = toBlobUrl(file);
    if (!url) {
      alert("Unable to open document");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="col-span-2 space-y-2">
      <p className="text-xs text-gray-500 font-semibold">{label}</p>
      <div className="flex flex-wrap gap-3">
        {list.map((file, index) => {
          const isPdf =
            file.startsWith("data:application/pdf") ||
            file.includes("application/pdf");
          const isImage = file.startsWith("data:image");
          const previewUrl = previewUrls[index] || "";

          return (
            <div
              key={index}
              className="border rounded p-2 w-42 bg-gray-50 flex flex-col justify-between"
            >
              <div className="h-32 bg-white rounded flex items-center justify-center overflow-hidden border">
                {isPdf && previewUrl ? (
                  <embed
                    src={previewUrl}
                    type="application/pdf"
                    className="w-full h-full"
                  />
                ) : isImage && previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Document upload"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs text-gray-400">
                    {previewUrls.length === 0
                      ? "Loading preview..."
                      : "View Document Attachment"}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => openFile(file)}
                className="text-xs text-center text-blue-600 mt-2 font-medium hover:underline cursor-pointer bg-transparent border-0 w-full"
              >
                Open in Full Window
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* function DocumentPreview({ label, files }: { label: string; files: string[] }) {
  // console.log('files.length ==== ',files.length);
  if (!files || files.length === 0) {
    return (
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm text-gray-400">No document uploaded</p>
      </div>
    );
  }
  console.log("label ==== ", label);
  console.log("files ==== ", files);

  // ✅ convert base64 -> blob url
  const openBase64File = (base64: string) => {
    try {
      const arr = base64.split(",");
      const mime = arr[0].match(/:(.*?);/)?.[1] || "";

      const byteString = atob(arr[1]);

      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);

      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }

      const blob = new Blob([ab], { type: mime });

      const blobUrl = URL.createObjectURL(blob);

      window.open(blobUrl, "_blank");

      // cleanup
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 1000);
    } catch (err) {
      console.error("Failed to open file", err);
    }
  };

  return (
    <div className="col-span-2 space-y-2">
      <p className="text-xs text-gray-500">{label}</p>

      <div className="flex flex-wrap gap-3">
        {files?.map((file: string, index: number) => {
          // const isPdf = file?.endsWith(".pdf");

          const isPdf =
            file?.startsWith("data:application/pdf") || file?.includes(".pdf");

          const isImage = file?.startsWith("data:image");

          return (
            <div key={index} className="border rounded p-2 w-40 bg-white">
        
              {isPdf ? (
                <iframe src={file} className="w-full h-32 rounded" />
              ) : isImage ? (
                <img
                  src={file}
                  alt="document"
                  className="w-full h-32 object-cover rounded"
                />
              ) : (
                <div className="h-32 flex items-center justify-center text-xs text-gray-500">
                  Unsupported File
                </div>
              )}

          
              <button
                onClick={() => openBase64File(file)}
                className="text-xs text-blue-600 mt-2 underline cursor-pointer"
              >
                Open
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
} */
