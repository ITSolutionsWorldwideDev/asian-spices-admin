"use client";

import Link from "next/link";
import Image from "next/image";
import {
  TbUsers,
  TbMapPin,
  TbCalendar,
  TbSquareRoundedFilled,
  TbPackage,
} from "react-icons/tb";

import { all_routes } from "@/data/all_routes";

type Props = {
  route?: typeof all_routes;
};
export default function DashboardSideWidgets({ route = all_routes }: Props) {
  return (
    <div className="row">

      {/* --------------------- TOP CUSTOMERS --------------------- */}
      <div className="col-xxl-4 col-md-6 d-flex">
        <div className="card flex-fill">
          <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div className="d-inline-flex align-items-center">
              <span className="title-icon bg-soft-orange fs-16 me-2">
                <TbUsers />
              </span>
              <h5 className="card-title mb-0">Top Customers</h5>
            </div>

            <Link
              href={route.customer}
              className="fs-13 fw-medium text-decoration-underline"
            >
              View All
            </Link>
          </div>

          <div className="card-body">
            {/* ----------- Customer Item Component (repeatable) ----------- */}
            {[
              {
                img: "/assets/img/customer/customer11.jpg",
                name: "Carlos Curran",
                country: "USA",
                orders: "24 Orders",
                amount: "$8,9645",
              },
              {
                img: "/assets/img/customer/customer12.jpg",
                name: "Stan Gaunter",
                country: "UAE",
                orders: "22 Orders",
                amount: "$16,985",
              },
              {
                img: "/assets/img/customer/customer13.jpg",
                name: "Richard Wilson",
                country: "Germany",
                orders: "14 Orders",
                amount: "$5,366",
              },
              {
                img: "/assets/img/customer/customer14.jpg",
                name: "Mary Bronson",
                country: "Belgium",
                orders: "08 Orders",
                amount: "$4,569",
              },
              {
                img: "/assets/img/customer/customer15.jpg",
                name: "Annie Tremblay",
                country: "Greenland",
                orders: "14 Orders",
                amount: "$3,5698",
              },
            ].map((c, i) => (
              <div
                key={i}
                className={`d-flex align-items-center justify-content-between flex-wrap gap-2 ${
                  i !== 4 ? "border-bottom mb-3 pb-3" : ""
                }`}
              >
                <div className="d-flex align-items-center">
                  <Link href="#" className="avatar avatar-lg flex-shrink-0">
                    <Image
                      src={c.img}
                      width={60}
                      height={60}
                      alt="customer"
                    />
                  </Link>

                  <div className="ms-2">
                    <h6 className="fs-14 fw-bold mb-1">
                      <Link href="#">{c.name}</Link>
                    </h6>

                    <div className="d-flex align-items-center item-list">
                      <p className="d-inline-flex align-items-center">
                        <TbMapPin className="me-1" /> {c.country}
                      </p>
                      <p>{c.orders}</p>
                    </div>
                  </div>
                </div>

                <div className="text-end">
                  <h5>{c.amount}</h5>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --------------------- TOP CATEGORIES --------------------- */}
      <div className="col-xxl-4 col-md-6 d-flex">
        <div className="card flex-fill">
          <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div className="d-inline-flex align-items-center">
              <span className="title-icon bg-soft-orange fs-16 me-2">
                <TbUsers />
              </span>
              <h5 className="card-title mb-0">Top Categories</h5>
            </div>

            <div className="dropdown">
              <Link
                href="#"
                className="dropdown-toggle btn btn-sm btn-white d-flex align-items-center"
                data-bs-toggle="dropdown"
              >
                <TbCalendar className="me-1" /> Weekly
              </Link>

              <ul className="dropdown-menu p-3">
                <li><Link href="#" className="dropdown-item">Today</Link></li>
                <li><Link href="#" className="dropdown-item">Weekly</Link></li>
                <li><Link href="#" className="dropdown-item">Monthly</Link></li>
              </ul>
            </div>
          </div>

          <div className="card-body">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-4 mb-4">
              {/* Chart */}
              <div>{/* <TopCategoryChart /> */}</div>

              <div>
                {[
                  { name: "Electronics", value: 698, color: "category-primary" },
                  { name: "Sports", value: 545, color: "category-orange" },
                  { name: "Lifestyles", value: 456, color: "category-secondary" },
                ].map((c, i) => (
                  <div key={i} className={`category-item ${c.color}`}>
                    <p className="fs-13 mb-1">{c.name}</p>
                    <h2 className="d-flex align-items-center">
                      {c.value}
                      <span className="fs-13 fw-normal text-default ms-1">
                        Sales
                      </span>
                    </h2>
                  </div>
                ))}
              </div>
            </div>

            <h6 className="mb-2">Category Statistics</h6>

            <div className="border br-8">
              <div className="d-flex align-items-center justify-content-between border-bottom p-2">
                <p className="d-inline-flex align-items-center mb-0">
                  <TbSquareRoundedFilled className="text-indigo fs-8 me-2" />
                  Total Number Of Categories
                </p>
                <h5>698</h5>
              </div>

              <div className="d-flex align-items-center justify-content-between p-2">
                <p className="d-inline-flex align-items-center mb-0">
                  <TbSquareRoundedFilled className="text-orange fs-8 me-2" />
                  Total Number Of Products
                </p>
                <h5>7899</h5>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --------------------- ORDER STATISTICS --------------------- */}
      <div className="col-xxl-4 col-md-12 d-flex">
        <div className="card flex-fill">
          <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div className="d-inline-flex align-items-center">
              <span className="title-icon bg-soft-indigo fs-16 me-2">
                <TbPackage />
              </span>
              <h5 className="card-title mb-0">Order Statistics</h5>
            </div>

            <div className="dropdown">
              <Link
                href="#"
                className="dropdown-toggle btn btn-sm btn-white"
                data-bs-toggle="dropdown"
              >
                <TbCalendar className="me-1" /> Weekly
              </Link>

              <ul className="dropdown-menu p-3">
                <li><Link href="#" className="dropdown-item">Today</Link></li>
                <li><Link href="#" className="dropdown-item">Weekly</Link></li>
                <li><Link href="#" className="dropdown-item">Monthly</Link></li>
              </ul>
            </div>
          </div>

          <div className="card-body pb-0">
            <div id="heat_chart">{/* <HeatmapChart /> */}</div>
          </div>
        </div>
      </div>

    </div>
  );
}
