"use client";

import { FileChartColumn } from "lucide-react";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

type Props = {
  embedded?: boolean;
  chamberFiles: File[];
  setChamberFiles: React.Dispatch<React.SetStateAction<File[]>>;
  poaFiles: File[];
  setPoaFiles: React.Dispatch<React.SetStateAction<File[]>>;
};

export default function UploadDocument({
  embedded = false,
  chamberFiles,
  setChamberFiles,
  poaFiles,
  setPoaFiles,
}: Props) {
  const formatSize = (size: number) => {
    if (size < 1024) return size + " B";
    if (size < 1024 * 1024) return (size / 1024).toFixed(1) + " KB";
    return (size / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "chamber" | "poa",
  ) => {
    const files = e.target.files;
    if (!files) return;

    const selectedFiles = Array.from(files).filter((f) => {
      if (f.size > MAX_FILE_BYTES) {
        alert(`${f.name} is over 10MB`);
        return false;
      }
      return true;
    });

    if (type === "chamber") {
      const updated = [...chamberFiles, ...selectedFiles];
      if (updated.length > 5) {
        alert("Maximum 5 files allowed");
        return;
      }
      setChamberFiles(updated);
    } else {
      const updated = [...poaFiles, ...selectedFiles];
      if (updated.length > 5) {
        alert("Maximum 5 files allowed");
        return;
      }
      setPoaFiles(updated);
    }

    e.target.value = "";
  };

  const removeFile = (index: number, type: "chamber" | "poa") => {
    if (type === "chamber") {
      setChamberFiles(chamberFiles.filter((_, i) => i !== index));
    } else {
      setPoaFiles(poaFiles.filter((_, i) => i !== index));
    }
  };

  const UploadBox = ({
    title,
    description,
    files,
    type,
    required = false,
  }: {
    title: string;
    description: string;
    files: File[];
    type: "chamber" | "poa";
    required?: boolean;
  }) => (
    <div className="space-y-3">
      <div>
        <label className="font-semibold text-gray-800">
          {title} {required && <span className="text-red-500">*</span>}
        </label>
        <p className="text-sm text-gray-500">{description}</p>
      </div>

      <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg h-32 cursor-pointer hover:bg-gray-50 transition text-center px-4">
        <input
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFileChange(e, type)}
          accept=".jpg,.jpeg,.png,.heic,.pdf"
        />
        <p className="text-gray-600 text-sm">Click to upload</p>
        <p className="text-xs text-gray-400 mt-1">JPG, PNG, HEIC, PDF (max 10MB)</p>
        <p className="text-xs text-gray-400 mt-1">{files.length} / 5 files</p>
      </label>

      {files.map((file, index) => (
        <div
          key={`${file.name}-${index}`}
          className="flex justify-between items-center border rounded-lg px-4 py-2 bg-gray-50"
        >
          <div className="flex items-center gap-2">
            <FileChartColumn className="text-[#FF6900]" />
            <div>
              <p className="text-sm text-gray-700">{file.name}</p>
              <p className="text-xs text-gray-400">{formatSize(file.size)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => removeFile(index, type)}
            className="text-[#FF6900] text-lg font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );

  const content = (
    <div className={embedded ? "space-y-6" : "space-y-8"}>
      {!embedded && (
        <>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Document Upload</h1>
            <p className="text-gray-500 mt-2">
              Upload business documents for verification
            </p>
          </div>
          <div className="bg-orange-50 border border-orange-200 text-orange-700 p-4 rounded-lg text-sm">
            <p className="font-semibold">Privacy Notice</p>
            <p className="mt-1">
              Do NOT upload personal IDs. Only business documents allowed.
            </p>
          </div>
        </>
      )}

      <UploadBox
        title="Chamber of Commerce Extract"
        description="Must be less than 6 months old"
        files={chamberFiles}
        type="chamber"
        required
      />

      <UploadBox
        title="Power of Attorney (Optional)"
        description="Only if you're not the owner"
        files={poaFiles}
        type="poa"
      />
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="bg-gray-100 flex justify-center p-6">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-md p-8">
        {content}
      </div>
    </div>
  );
}
