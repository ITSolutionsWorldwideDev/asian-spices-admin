"use client";

import React from "react";
import Link from "next/link";

import {
  HiOutlineCube,
  HiOutlineChartPie,
//   HiOutlineLifebuoy,
  HiOutlineHashtag,
  HiOutlineArrowUp,
  HiOutlineArrowDown
} from "react-icons/hi";

import { all_routes } from "@/data/all_routes";

interface RevenueWidgetProps {
  title: string;
  amount: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  trend: string;
  trendType: "up" | "down";
  link: string;
}

const RevenueCard: React.FC<RevenueWidgetProps> = ({
  title,
  amount,
  icon,
  iconBg,
  iconColor,
  trend,
  trendType,
  link
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 border">
      {/* Top Section */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b">
        <div>
          <h4 className="text-xl font-semibold text-gray-800">{amount}</h4>
          <p className="text-gray-500">{title}</p>
        </div>

        <div
          className={`p-3 rounded-full ${iconBg} ${iconColor} text-xl flex items-center justify-center`}
        >
          {icon}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          <span
            className={`font-bold ${
              trendType === "up" ? "text-green-600" : "text-red-600"
            }`}
          >
            {trend}
          </span>{" "}
          vs Last Month
        </p>

        <Link
          href={link}
          className="text-sm font-medium underline text-blue-600 hover:text-blue-700"
        >
          View All
        </Link>
      </div>
    </div>
  );
};

export default function RevenueWidgets() {
  const route = all_routes;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* Profit */}
      <RevenueCard
        title="Profit"
        amount="$8,458,798"
        icon={<HiOutlineCube />}
        iconBg="bg-cyan-100"
        iconColor="text-cyan-600"
        trend="+35%"
        trendType="up"
        link={route.profitloss}
      />

      {/* Invoice Due */}
      <RevenueCard
        title="Invoice Due"
        amount="$48,988,78"
        icon={<HiOutlineChartPie />}
        iconBg="bg-teal-100"
        iconColor="text-teal-600"
        trend="+35%"
        trendType="up"
        link={route.invoicereport}
      />

      {/* Expenses */}
      <RevenueCard
        title="Total Expenses"
        amount="$8,980,097"
        icon={<HiOutlineHashtag />}
        iconBg="bg-orange-100"
        iconColor="text-orange-600"
        trend="+41%"
        trendType="up"
        link={route.expenselist}
      />

      {/* Returns */}
      <RevenueCard
        title="Total Payment Returns"
        amount="$78,458,798"
        icon={<HiOutlineHashtag />}
        iconBg="bg-indigo-100"
        iconColor="text-indigo-600"
        trend="-20%"
        trendType="down"
        link={route.salesreport}
      />
    </div>
  );
}
