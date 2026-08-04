// core/utils/exportCsv.ts

export type CsvColumn<T> = {
  title: string;
  dataIndex: keyof T | string;
  format?: (value: any, record: T) => string;
};

function csvEscape(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export function exportToCsv<T extends Record<string, any>>(
  filename: string,
  columns: CsvColumn<T>[],
  rows: T[],
) {
  const header = columns.map((c) => csvEscape(c.title)).join(",");
  const lines = rows.map((row) =>
    columns
      .map((c) => {
        const raw = row[c.dataIndex as string];
        return csvEscape(c.format ? c.format(raw, row) : raw);
      })
      .join(","),
  );

  const csvContent = [header, ...lines].join("\n");
  const blob = new Blob(["﻿" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
