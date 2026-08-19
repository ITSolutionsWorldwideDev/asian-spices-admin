// components/platform/orders/OrderTimeline.tsx

type Event = {
  id: string;
  event_type: string;
  message: string;
  created_at: string;
  store_name?: string;
};

const getColor = (type: string) => {
  switch (type) {
    case "assigned":
      return "text-blue-600";
    case "rejected":
      return "text-red-600";
    case "accepted":
      return "text-green-600";
    case "partial":
      return "text-yellow-600";
    case "cancelled":
      return "text-red-700";
    case "refund_pending":
      return "text-amber-600";
    case "refund_initiated":
      return "text-blue-700";
    case "refunded":
      return "text-green-700";
    default:
      return "text-gray-600";
  }
};

export default function OrderTimeline({ events }: { events?: Event[] }) {
  return (
    <div className="space-y-4 border-l pl-4 mb-6">
      {(events || []).map((e) => (
        <div key={e.id}>
          <p className="text-xs text-gray-400">
            {new Date(e.created_at).toLocaleString()}
          </p>

          <p className={`font-semibold ${getColor(e.event_type)}`}>
            {String(e.event_type || "").replace(/_/g, " ").toUpperCase()}
          </p>

          <p>{e.message}</p>

          {e.store_name && (
            <p className="text-xs text-gray-500">Store: {e.store_name}</p>
          )}
        </div>
      ))}
    </div>
  );
}
