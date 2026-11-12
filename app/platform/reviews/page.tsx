"use client";

import { useEffect, useState } from "react";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);

  const load = async () => {
    const res = await fetch("/api/platform/reviews");
    setReviews(await res.json());
  };

  useEffect(() => {
    load();
  }, []);

  const setStatus = async (id: string, status: string) => {
    await fetch("/api/platform/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    load();
  };

  return (
    <div className="page-wrapper">
      <div className="content p-6">
        <h1 className="text-2xl font-bold mb-4">Reviews</h1>

        <table className="w-full bg-white border rounded-lg text-sm">
          <thead className="bg-gray-50 border-b text-left">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Rating</th>
              <th className="p-3">Comment</th>
              <th className="p-3">Status</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="p-3">{r.guest_name || "Anonymous"}</td>
                <td className="p-3">{r.rating}/5</td>
                <td className="p-3">{r.comment}</td>
                <td className="p-3">{r.status}</td>
                <td className="p-3">
                  {r.status !== "approved" && (
                    <button
                      onClick={() => setStatus(r.id, "approved")}
                      className="text-green-700 border border-green-200 bg-green-50 px-2 py-1 rounded mr-2"
                    >
                      Approve
                    </button>
                  )}
                  {r.status !== "rejected" && (
                    <button
                      onClick={() => setStatus(r.id, "rejected")}
                      className="text-red-700 border border-red-200 bg-red-50 px-2 py-1 rounded"
                    >
                      Reject
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
