// apps/admin/components/SalesWidgets.tsx
import React from "react";
import { 
  HiOutlineDocumentText, 
  HiOutlineRefresh, 
  HiOutlineGift, 
  HiOutlineInbox, 
  HiOutlineArrowUp, 
  HiOutlineArrowDown 
} from "react-icons/hi";
// import { TiFileText, TiRepeat, TiGift, TiBrandPocket, TiArrowUp, TiArrowDown } from "react-icons/ti";

interface SaleWidgetProps {
  title: string;
  amount: string;
  icon: React.ReactNode;
  bgColor: string;
  iconColor: string;
  badgeText: string;
  badgeType: "up" | "down";
}

const SaleCard: React.FC<SaleWidgetProps> = ({ title, amount, icon, bgColor, iconColor, badgeText, badgeType }) => {
  return (
    <div className="flex-1">
      <div className={`rounded-lg p-4 ${bgColor} flex items-center gap-4`}>
        <div className={`p-3 rounded-full bg-white text-2xl ${iconColor}`}>
          {icon}
        </div>
        <div>
          <p className="text-white mb-1">{title}</p>
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-white text-xl font-semibold">{amount}</h4>
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${
                badgeType === "up" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}
            >
              {badgeType === "up" ? <HiOutlineArrowUp className="mr-1" /> : <HiOutlineArrowDown className="mr-1" />}
              {badgeText}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function SalesWidgets() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <SaleCard
        title="Total Sales"
        amount="$48,988,078"
        icon={<HiOutlineDocumentText />}
        bgColor="bg-blue-600"
        iconColor="text-blue-600"
        badgeText="+22%"
        badgeType="up"
      />
      <SaleCard
        title="Total Sales Return"
        amount="$16,478,145"
        icon={<HiOutlineRefresh />}
        bgColor="bg-gray-600"
        iconColor="text-gray-600"
        badgeText="-22%"
        badgeType="down"
      />
      <SaleCard
        title="Total Purchase"
        amount="$24,145,789"
        icon={<HiOutlineGift />}
        bgColor="bg-teal-600"
        iconColor="text-teal-600"
        badgeText="+22%"
        badgeType="up"
      />
      <SaleCard
        title="Total Purchase Return"
        amount="$18,458,747"
        icon={<HiOutlineInbox />}
        bgColor="bg-indigo-600"
        iconColor="text-indigo-600"
        badgeText="+22%"
        badgeType="up"
      />
    </div>
  );
}
