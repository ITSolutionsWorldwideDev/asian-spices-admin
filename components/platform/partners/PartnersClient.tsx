// apps/admin/components/platform/partners/PartnersClient.tsx

"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import PartnerCard from "./PartnerCard";
import { approvePartner, rejectPartner } from "./actions";
import FiltersBar from "./FiltersBar";

export default function PartnersClient({
  partners,
  total,
  page,
  pageSize,
}: any) {
  const totalPages = Math.ceil(total / pageSize);
  const [isPending, startTransition] = useTransition();

  const [optimisticPartners, updateOptimistic] = useOptimistic(
    partners,
    (state: any[], action: any) => {
      if (action.type === "status") {
        return state.map((p) =>
          p.partner_id === action.partner_id
            ? { ...p, status: action.status }
            : p
        );
      }
      return state;
    }
  );

  const handleApprove = (partnerId: string) => {
    startTransition(async () => {
      updateOptimistic({
        type: "status",
        partner_id: partnerId,
        status: "approved",
      });
      try {
        await approvePartner(partnerId);
      } catch (error) {
        console.error("Failed to approve partner:", error);
      }
    });
  };

  const handleReject = (partnerId: string, reason: string) => {
    startTransition(async () => {
      updateOptimistic({
        type: "status",
        partner_id: partnerId,
        status: "rejected",
      });
      try {
        await rejectPartner(partnerId, reason || "No reason provided");
      } catch (error) {
        console.error("Failed to reject partner:", error);
      }
    });
  };

  return (
    <>
      <div className="page-header flex justify-between items-center mb-4">
        <div>
          <h4 className="text-lg font-semibold">Partners</h4>
          <h6 className="text-gray-500">Manage partner applications</h6>
        </div>
        <Link href="/platform/partners/new" className="btn btn-primary">
          Add Partner
        </Link>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          <FiltersBar />
        </div>
      </div>

      {isPending && (
        <div className="text-sm text-blue-600 font-medium mb-2">Syncing platform changes...</div>
      )}

      {optimisticPartners.length === 0 ? (
        <p className="text-center py-10 text-gray-500">No applications found</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {optimisticPartners.map((partner: any) => (
            <PartnerCard
              key={partner.partner_id}
              partner={partner}
              onApprove={() => handleApprove(partner.partner_id)}
              onReject={(reason: string) => handleReject(partner.partner_id, reason)}
            />
          ))}
        </div>
      )}

      {/* PAGINATION */}
      <div className="flex justify-center gap-2 mt-6">
        {Array.from({ length: totalPages }).map((_, i) => (
          <Link
            key={i}
            href={`?page=${i + 1}`}
            className={`px-3 py-1 rounded ${
              page === i + 1 ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            {i + 1}
          </Link>
        ))}
      </div>
    </>
  );
}

/* "use client";

import Link from "next/link";
import { useOptimistic, useState } from "react";
import PartnerCard from "./PartnerCard";
import { approvePartner, rejectPartner } from "./actions";
import FiltersBar from "./FiltersBar";

export default function PartnersClient({
  partners,
  total,
  page,
  pageSize,
}: any) {
  const totalPages = Math.ceil(total / pageSize);
  const [loading, setLoading] = useState(false);

  const [optimisticPartners, updateOptimistic] = useOptimistic(
    partners,
    (state, action: any) => {
      if (action.type === "status") {
        return state.map((p: any) =>
          p.partner_id === action.partner_id
            ? { ...p, status: action.status }
            : p,
        );
      }
      return state;
    },
  );

  return (
    <>
      <div className="page-header flex justify-between items-center mb-4">
        <div>
          <h4 className="text-lg font-semibold">Partners</h4>
          <h6 className="text-gray-500">Manage partner applications</h6>
        </div>

        <Link href="/platform/partners/new" className="btn btn-primary">
          Add Partner
        </Link>
      </div>

      <div className="card">
        <div className="card-header">
          <FiltersBar />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black" />
          <p className="text-gray-500 font-medium">Loading...</p>
        </div>
      ) : optimisticPartners.length === 0 ? (
        <p className="text-center py-10 text-gray-500">No applications found</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {optimisticPartners.map((partner: any) => (
            <PartnerCard
              key={partner.partner_id}
              partner={partner}
              onApprove={async () => {
                updateOptimistic({
                  type: "status",
                  partner_id: partner.partner_id,
                  status: "approved",
                });
                await approvePartner(partner.partner_id);
              }}
              onReject={async (reason: string) => {
                updateOptimistic({
                  type: "status",
                  partner_id: partner.partner_id,
                  status: "rejected",
                });
                await rejectPartner(
                  partner.partner_id,
                  reason || "No reason provided",
                );
              }}
            />
          ))}
        </div>
      )}


      <div className="flex justify-center gap-2 mt-6">
        {Array.from({ length: totalPages }).map((_, i) => (
          <Link
            key={i}
            href={`?page=${i + 1}`}
            className={`px-3 py-1 rounded ${
              page === i + 1 ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            {i + 1}
          </Link>
        ))}
      </div>
    </>
  );
} */
