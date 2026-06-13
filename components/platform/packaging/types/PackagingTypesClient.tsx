// apps/admin/components/platform/packaging/types/PackagingTypesClient.tsx

"use client";

import Link from "next/link";

export default function PackagingTypesClient({
  packagingTypes,
  total,
  page,
  pageSize,
}: any) {
  const totalPages = Math.ceil(total / pageSize);

  return (
    <>
      {/* HEADER */}

      <div className="page-header flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">Packaging Types</h2>

          <p className="text-gray-500 text-sm">
            Manage box and packaging templates
          </p>
        </div>

        <Link href="/platform/packaging/types/new" className="btn btn-primary">
          Add Packaging Type
        </Link>
      </div>

      {/* EMPTY STATE */}

      {!packagingTypes.length ? (
        <div className="card">
          <div className="card-body text-center py-10 text-gray-500">
            No packaging types found
          </div>
        </div>
      ) : (
        <>
          {/* GRID */}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {packagingTypes.map((item: any) => (
              <Link
                key={item.id}
                href={`/platform/packaging/types/${item.id}`}
                className="card p-5 hover:border-blue-500 transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{item.name}</h3>

                    <p className="text-sm text-gray-500">{item.code}</p>
                  </div>

                  <div>
                    {item.is_active ? (
                      <span className="badge badge-success">Active</span>
                    ) : (
                      <span className="badge badge-danger">Disabled</span>
                    )}
                  </div>
                </div>

                <div className="mt-5 space-y-2 text-sm text-gray-600">
                  <p>
                    Material:
                    <span className="font-medium ml-1">{item.material}</span>
                  </p>

                  <p>
                    Dimensions:
                    <span className="font-medium ml-1">
                      {item.width_cm}
                      cm × {item.height_cm}
                      cm × {item.length_cm}
                      cm
                    </span>
                  </p>

                  <p>
                    Max Weight:
                    <span className="font-medium ml-1">
                      {item.max_weight_kg}
                      kg
                    </span>
                  </p>

                  <p>
                    Fragile Safe:
                    <span className="font-medium ml-1">
                      {item.is_fragile_safe ? "Yes" : "No"}
                    </span>
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* PAGINATION */}

          <div className="flex justify-center gap-2 mt-8">
            {Array.from({
              length: totalPages,
            }).map((_, i) => (
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
      )}
    </>
  );
}
