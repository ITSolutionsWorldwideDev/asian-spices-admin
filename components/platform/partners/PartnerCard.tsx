// apps/admin/components/platform/partners/PartnerCard.tsx

"use client";

import Link from "next/link";
import { Check, X } from "react-feather";
import { useState } from "react";

export default function PartnerCard({ partner, onApprove, onReject }: any) {
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 flex flex-col justify-between">
      <div>
        <div className="flex justify-between mb-2">
          <h3 className="font-semibold text-sm">{partner.company_name}</h3>

          <span className="text-xs px-2 py-1 rounded bg-gray-100">
            {partner.status}
          </span>
        </div>

        <p className="text-xs text-gray-500">
          {partner.business_email_address}
        </p>

        <p className="text-xs text-gray-500">
          Application ID: {partner.application_id}
        </p>
      </div>

      <div className="flex justify-between items-center mt-4">
        <Link
          href={`/platform/partners/${partner.partner_id}`}
          className="text-xs text-blue-600"
        >
          View
        </Link>
      </div>
    </div>
  );
}

{
  /* {partner.status === "pending" && (
          <div className="flex gap-2">
            <button onClick={onApprove}>
              <Check size={14} />
            </button>
            <button onClick={() => setShowReject(true)}>
              <X size={14} />
            </button>
          </div>
        )} */
}

/* 
        
        {showReject && (
        <div className="mt-3 space-y-2">
          <textarea
            placeholder="Reason..."
            className="w-full border p-2 text-xs"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />

          <button
            className="btn btn-danger w-full"
            onClick={() => onReject(reason)}
          >
            Confirm Reject
          </button>
        </div>
      )}
        */
