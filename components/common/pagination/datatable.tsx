// core/common/pagination/datatable.tsx

/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */

"use client";

import React from "react";
import { Table } from "antd";

/* ------------------------------------
   Types
------------------------------------ */

type DatatableProps = {
  columns: any[];
  dataSource: any[];
  rowKey?: string;

  /* Selection (controlled) */
  selectable?: boolean;
  selectedRowKeys?: React.Key[];
  onSelectRow?: (id: string, checked: boolean) => void;
  onSelectAll?: (checked: boolean) => void;

  /* Server-side pagination */
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
  };
  onChange?: (pagination: any) => void;
};

/* ------------------------------------
   Component
------------------------------------ */

const Datatable = ({
  columns,
  dataSource,
  rowKey = "id",

  selectable = false,
  selectedRowKeys = [],
  onSelectRow,
  onSelectAll,

  loading = false,
  pagination,
  onChange,
}: DatatableProps) => {
  /* ------------------------------------
     Inject Checkbox Column
  ------------------------------------ */

  let finalColumns = columns;

  if (selectable) {
    finalColumns = [
      {
        title: (
          <input
            type="checkbox"
            onChange={(e) => onSelectAll?.(e.target.checked)}
          />
        ),
        width: 50,
        render: (_: any, record: any) => {
          const id = record[rowKey];

          return (
            <input
              type="checkbox"
              checked={selectedRowKeys.includes(id)}
              onChange={(e) =>
                onSelectRow?.(id, e.target.checked)
              }
            />
          );
        },
      },
      ...columns,
    ];
  }

  /* ------------------------------------
     Handle Pagination Change
  ------------------------------------ */

  const handleChange = (paginationInfo: any) => {
    onChange?.(paginationInfo);
  };

  return (
    <Table
      className="table datanew dataTable no-footer w-full"
      columns={finalColumns}
      dataSource={dataSource}
      rowKey={rowKey}
      loading={loading}
      scroll={dataSource.length > 0 ? { x: "max-content" } : undefined}
      pagination={
        pagination
          ? {
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50", "100"],
            }
          : {
              defaultPageSize: 10,
              showSizeChanger: true,
            }
      }
      onChange={handleChange}
    />
  );
};

export default Datatable;


