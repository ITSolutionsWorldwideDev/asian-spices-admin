// components/shipping/methods/MethodsClient.tsx

"use client";

export default function MethodsClient({ methods }: any) {
  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Shipping Methods</h1>

      <table className="w-full border">
        <thead>
          <tr>
            <th>Name</th>
            <th>Provider</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {methods.map((m: any) => (
            <tr key={m.id}>
              <td>{m.name}</td>
              <td>{m.provider_name}</td>
              <td>{m.is_active ? "Active" : "Disabled"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}