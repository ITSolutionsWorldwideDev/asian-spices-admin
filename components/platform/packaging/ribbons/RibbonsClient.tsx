// components/platform/packaging/ribbons/RibbonsClient.tsx

"use client";

import Link from "next/link";

export default function RibbonsClient({
  ribbons,
  total,
  page,
  pageSize,
}: any) {
  const totalPages = Math.ceil(
    total / pageSize,
  );

  return (
    <>
      {/* Header */}
      <div className="page-header flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">
            Packaging Ribbons
          </h2>

          <p className="text-sm text-gray-500">
            Manage wrapping ribbons and
            decorative materials
          </p>
        </div>

        <Link
          href="/platform/packaging/ribbons/new"
          className="btn btn-primary"
        >
          Add Ribbon
        </Link>
      </div>

      {/* Empty */}
      {!ribbons.length ? (
        <div className="card">
          <div className="card-body py-10 text-center text-gray-500">
            No ribbons found
          </div>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>SKU</th>
                    <th>Color</th>
                    <th>Material</th>
                    <th>Width</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {ribbons.map(
                    (ribbon: any) => (
                      <tr key={ribbon.id}>
                        <td>
                          {ribbon.name}
                        </td>

                        <td>
                          {ribbon.sku}
                        </td>

                        <td>
                          {ribbon.color}
                        </td>

                        <td>
                          {ribbon.material}
                        </td>

                        <td>
                          {
                            ribbon.width_mm
                          }{" "}
                          mm
                        </td>

                        <td>
                          €
                          {Number(
                            ribbon.cost_price,
                          ).toFixed(2)}
                        </td>

                        <td>
                          <span
                            className={`badge ${
                              ribbon.is_active
                                ? "badge-success"
                                : "badge-error"
                            }`}
                          >
                            {ribbon.is_active
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>

                        <td>
                          <Link
                            href={`/platform/packaging/ribbons/${ribbon.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            Edit
                          </Link>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({
              length: totalPages,
            }).map((_, i) => (
              <Link
                key={i}
                href={`?page=${i + 1}`}
                className={`px-3 py-1 rounded ${
                  page === i + 1
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200"
                }`}
              >
                {i + 1}
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}