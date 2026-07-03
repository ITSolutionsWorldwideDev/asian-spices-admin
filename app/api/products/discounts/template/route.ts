// app/api/products/discounts/template/route.ts

import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  try {
    // 1. Define the explicit headers expected by your preview processing engine
    const headers = [
      {
        SKU: "PROD-1001",
        "Customer Type": "B2C",
        "Discount Type": "PERCENT",
        "Discount Value": 15,
        "Promo Code": "SUMMER15",
        Status: "Active",
      },
      {
        SKU: "PROD-1002",
        "Customer Type": "B2B",
        "Discount Type": "FLAT",
        "Discount Value": 5.50,
        "Promo Code": "",
        Status: "Active",
      },
      {
        SKU: "PROD-1003",
        "Customer Type": "B2C",
        "Discount Type": "FLAT",
        "Discount Value": 20,
        "Promo Code": "FLAT20",
        Status: "Inactive",
      }
    ];

    // 2. Create an in-memory worksheet and workbook schema
    const worksheet = XLSX.utils.json_to_sheet(headers);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Discounts Template");

    // 3. Set custom tracking column widths for better administrator visibility
    worksheet["!cols"] = [
      { wch: 15 }, // SKU
      { wch: 15 }, // Customer Type
      { wch: 15 }, // Discount Type
      { wch: 15 }, // Discount Value
      { wch: 15 }, // Promo Code
      { wch: 12 }, // Status
    ];

    // 4. Write the workbook buffer using an xlsx type container configuration
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // 5. Stream the document binary with clean descriptive browser download headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=product_discounts_template.xlsx",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Failed to build dynamic sheet layout template structure",
        detail: error.message,
      },
      { status: 500 }
    );
  }
}