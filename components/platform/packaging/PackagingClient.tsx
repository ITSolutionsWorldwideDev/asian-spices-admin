// components/platform/packaging/PackagingClient.tsx

"use client";

import Link from "next/link";

export default function PackagingClient({
  packages,
  total,
  page,
  pageSize,
}: any) {
  const totalPages = Math.ceil(
    total / pageSize,
  );

  return (
    <>
      <div className="page-header flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">
            Packaging
          </h2>

          <p className="text-gray-500 text-sm">
            Manage packaging templates
          </p>
        </div>

        <Link
          href="/platform/packaging/packages/new"
          className="btn btn-primary"
        >
          Add Package
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {packages.map((pkg: any) => (
          <Link
            key={pkg.id}
            href={`/platform/packaging/packages/${pkg.id}`}
            className="card p-5 hover:border-blue-500 transition"
          >
            <div className="flex justify-between">
              <div>
                <h3 className="font-semibold">
                  {pkg.name}
                </h3>

                <p className="text-sm text-gray-500">
                  {pkg.code}
                </p>
              </div>

              <div>
                {pkg.is_active ? (
                  <span className="badge badge-success">
                    Active
                  </span>
                ) : (
                  <span className="badge badge-danger">
                    Disabled
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-600 space-y-1">
              <p>
                Type: {pkg.package_type}
              </p>

              <p>
                Dimensions:
                {pkg.width_cm} ×{" "}
                {pkg.height_cm} ×{" "}
                {pkg.length_cm} cm
              </p>

              <p>
                Weight Limit:
                {pkg.weight_limit_kg}kg
              </p>

              {pkg.ribbon_color && (
                <p>
                  Ribbon:
                  {pkg.ribbon_color}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>

      <div className="flex justify-center gap-2 mt-8">
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
  );
}