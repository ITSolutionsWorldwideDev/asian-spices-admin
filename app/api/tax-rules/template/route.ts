import { NextResponse } from "next/server";

export async function GET() {
  const csv = [
    "Country,Tax Type,Percentage,Linked Category,Status",
    "Netherlands,21%,21.00,Kitchen Appliances,Active",
    "Netherlands,5%,5.00,,Active",
    "Netherlands,9%,9.00,Foods & Beverages,Active",
  ].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="tax-rules-template.csv"',
      "Cache-Control": "no-store",
    },
  });
}
