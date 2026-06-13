"use client";

import React, { useState } from "react";
import Link from "next/link";

import {
  HiOutlineShoppingCart,
  HiOutlineInformationCircle,
  HiOutlineUserGroup,
//   HiOutlineUserAdd,
  HiOutlineUsers,
  HiOutlineCalendar
} from "react-icons/hi2";

export default function SalesPurchaseOverview() {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">

      {/* ------------------------- */}
      {/* SALES & PURCHASE (LEFT)   */}
      {/* ------------------------- */}
      <div className="xl:col-span-8 col-span-12">
        <div className="bg-white border rounded-lg shadow">

          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded bg-blue-100 text-blue-600 text-lg">
                <HiOutlineShoppingCart />
              </div>
              <h5 className="text-lg font-semibold">Sales & Purchase</h5>
            </div>

            {/* Button group */}
            <div className="flex gap-2">
              {["1D", "1W", "1M", "3M", "6M", "1Y"].map((item, index) => (
                <button
                  key={index}
                  className={`px-3 py-1 rounded border text-sm ${
                    item === "1Y"
                      ? "bg-blue-600 text-white"
                      : "bg-white hover:bg-gray-100"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="p-4">

            <div className="flex gap-3 mb-4">
              {/* Total Purchase */}
              <div className="border rounded-lg p-3">
                <p className="flex items-center text-sm text-gray-500 mb-1">
                  <span className="w-2 h-2 rounded-full bg-blue-300 mr-2" />
                  Total Purchase
                </p>
                <h4 className="text-xl font-semibold">3K</h4>
              </div>

              {/* Total Sales */}
              <div className="border rounded-lg p-3">
                <p className="flex items-center text-sm text-gray-500 mb-1">
                  <span className="w-2 h-2 rounded-full bg-blue-600 mr-2" />
                  Total Sales
                </p>
                <h4 className="text-xl font-semibold">1K</h4>
              </div>
            </div>

            {/* Chart Placeholder */}
            <div id="sales-daychart" className="w-full h-[240px] bg-gray-50 rounded-md flex items-center justify-center text-gray-400">
              {/* <SalesDayChart /> */}
              Chart Placeholder
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------- */}
      {/* OVERALL INFORMATION (RIGHT) */}
      {/* ------------------------- */}
      <div className="xl:col-span-4 col-span-12">
        <div className="bg-white border rounded-lg shadow">

          {/* Header */}
          <div className="p-4 border-b flex items-center gap-2">
            <div className="p-2 bg-blue-100 text-blue-600 rounded">
              <HiOutlineInformationCircle />
            </div>
            <h5 className="text-lg font-semibold">Overall Information</h5>
          </div>

          <div className="p-4">

            {/* Info grid */}
            <div className="grid grid-cols-3 gap-3">
              {/* Suppliers */}
              <div className="bg-gray-50 border rounded-lg text-center p-3">
                <div className="text-blue-500 text-3xl mb-2">
                  <HiOutlineUsers />
                </div>
                <p className="text-gray-600 text-sm mb-1">Suppliers</p>
                <h5 className="text-lg font-semibold">6987</h5>
              </div>

              {/* Customers */}
              <div className="bg-gray-50 border rounded-lg text-center p-3">
                <div className="text-orange-500 text-3xl mb-2">
                  <HiOutlineUsers />
                </div>
                <p className="text-gray-600 text-sm mb-1">Customer</p>
                <h5 className="text-lg font-semibold">4896</h5>
              </div>

              {/* Orders */}
              <div className="bg-gray-50 border rounded-lg text-center p-3">
                <div className="text-teal-600 text-3xl mb-2">
                  <HiOutlineShoppingCart />
                </div>
                <p className="text-gray-600 text-sm mb-1">Orders</p>
                <h5 className="text-lg font-semibold">487</h5>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
              <h6 className="text-md font-semibold">Customers Overview</h6>

              {/* Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-1 text-sm border px-3 py-1 rounded"
                >
                  <HiOutlineCalendar /> Today
                </button>

                {dropdownOpen && (
                  <ul className="absolute right-0 mt-2 w-32 bg-white border rounded shadow p-1 z-10 text-sm">
                    {["Today", "Weekly", "Monthly"].map((i, idx) => (
                      <li key={idx}>
                        <button
                          onClick={() => setDropdownOpen(false)}
                          className="w-full text-left px-3 py-1 hover:bg-gray-100"
                        >
                          {i}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Chart + Metrics */}
            <div className="grid grid-cols-12 gap-3 items-center">

              {/* Chart */}
              <div className="col-span-5">
                <div id="customer-chart" className="w-full h-[200px] bg-gray-50 rounded flex items-center justify-center text-gray-400">
                  {/* <CustomerChart /> */}
                  Chart Placeholder
                </div>
              </div>

              {/* Stats */}
              <div className="col-span-7">
                <div className="grid grid-cols-2">
                  {/* First Time */}
                  <div className="text-center border-r px-2">
                    <h2 className="text-2xl font-semibold mb-1">5.5K</h2>
                    <p className="text-orange-500 mb-2">First Time</p>
                    <span className="inline-flex items-center bg-green-100 text-green-600 text-xs font-medium px-2 py-1 rounded">
                      ↑ 25%
                    </span>
                  </div>

                  {/* Return */}
                  <div className="text-center px-2">
                    <h2 className="text-2xl font-semibold mb-1">3.5K</h2>
                    <p className="text-teal-600 mb-2">Return</p>
                    <span className="inline-flex items-center bg-green-100 text-green-600 text-xs font-medium px-2 py-1 rounded">
                      ↑ 21%
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
