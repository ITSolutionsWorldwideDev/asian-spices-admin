"use client";
import Link from "next/link";
import {
  HiOutlineCube,
  HiOutlineCalendarDays,
  HiOutlineArrowTrendingUp,
  HiOutlineArrowTrendingDown,
  HiOutlineExclamationTriangle,
} from "react-icons/hi2";

import {
  FiArrowUpLeft,
  FiArrowDownLeft,
  FiCircle,
} from "react-icons/fi";

type ProductsSectionProps = {
  route: {
    lowstock: string;
  };
};

export default function ProductsSection({ route} : ProductsSectionProps) {
  return (
    <div className="row">
      {/* ---------------- TOP SELLING PRODUCTS ---------------- */}
      <div className="col-xxl-4 col-md-6 d-flex">
        <div className="card flex-fill">
          <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div className="d-inline-flex align-items-center">
              <span className="title-icon bg-soft-pink fs-16 me-2">
                <HiOutlineCube className="fs-16" />
              </span>
              <h5 className="card-title mb-0">Top Selling Products</h5>
            </div>

            <div className="dropdown">
              <Link
                href="#"
                className="dropdown-toggle btn btn-sm btn-white"
                data-bs-toggle="dropdown"
              >
                <HiOutlineCalendarDays className="me-1" />
                Today
              </Link>
              <ul className="dropdown-menu p-3">
                <li><Link href="#" className="dropdown-item">Today</Link></li>
                <li><Link href="#" className="dropdown-item">Weekly</Link></li>
                <li><Link href="#" className="dropdown-item">Monthly</Link></li>
              </ul>
            </div>
          </div>

          {/* ------- PRODUCT LIST ------- */}
          <div className="card-body sell-product">
            {[
              {
                img: "assets/img/products/product-01.jpg",
                name: "Charger Cable - Lighting",
                price: "$187",
                sales: "247+ Sales",
                trend: "+25%",
                trendIcon: <FiArrowUpLeft />,
                badge: "bg-outline-success",
              },
              {
                img: "assets/img/products/product-16.jpg",
                name: "Yves Saint Eau De Parfum",
                price: "$145",
                sales: "289+ Sales",
                trend: "+25%",
                trendIcon: <FiArrowUpLeft />,
                badge: "bg-outline-success",
              },
              {
                img: "assets/img/products/product-03.jpg",
                name: "Apple Airpods 2",
                price: "$458",
                sales: "300+ Sales",
                trend: "+25%",
                trendIcon: <FiArrowUpLeft />,
                badge: "bg-outline-success",
              },
              {
                img: "assets/img/products/product-04.jpg",
                name: "Vacuum Cleaner",
                price: "$139",
                sales: "225+ Sales",
                trend: "-21%",
                trendIcon: <FiArrowDownLeft />,
                badge: "bg-outline-danger",
              },
              {
                img: "assets/img/products/product-05.jpg",
                name: "Samsung Galaxy S21 Fe 5g",
                price: "$898",
                sales: "365+ Sales",
                trend: "+25%",
                trendIcon: <FiArrowUpLeft />,
                badge: "bg-outline-success",
              },
            ].map((item, index) => (
              <div
                key={index}
                className={`d-flex align-items-center justify-content-between ${
                  index !== 4 ? "border-bottom" : ""
                }`}
              >
                <div className="d-flex align-items-center">
                  <Link href="#" className="avatar avatar-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.img} alt="img" />
                  </Link>
                  <div className="ms-2">
                    <h6 className="fw-bold mb-1">
                      <Link href="#">{item.name}</Link>
                    </h6>
                    <div className="d-flex align-items-center item-list">
                      <p>{item.price}</p>
                      <p>{item.sales}</p>
                    </div>
                  </div>
                </div>

                <span
                  className={`badge ${item.badge} badge-xs d-inline-flex align-items-center`}
                >
                  {item.trendIcon}
                  {item.trend}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---------------- LOW STOCK PRODUCTS ---------------- */}
      <div className="col-xxl-4 col-md-6 d-flex">
        <div className="card flex-fill">
          <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div className="d-inline-flex align-items-center">
              <span className="title-icon bg-soft-danger fs-16 me-2">
                <HiOutlineExclamationTriangle className="fs-16" />
              </span>
              <h5 className="card-title mb-0">Low Stock Products</h5>
            </div>

            <Link
              href={route.lowstock}
              className="fs-13 fw-bold text-decoration-underline"
            >
              View All
            </Link>
          </div>

          <div className="card-body">
            {[
              { img: "assets/img/products/product-06.jpg", name: "Dell XPS 13", id: "#665814", qty: "08" },
              { img: "assets/img/products/product-07.jpg", name: "Vacuum Cleaner Robot", id: "#940004", qty: "14" },
              { img: "assets/img/products/product-08.jpg", name: "KitchenAid Stand Mixer", id: "#325569", qty: "21" },
              { img: "assets/img/products/product-09.jpg", name: "Levi's Trucker Jacket", id: "#124588", qty: "12" },
              { img: "assets/img/products/product-10.jpg", name: "Lay's Classic", id: "#365586", qty: "10" },
            ].map((item, i) => (
              <div
                className={`d-flex align-items-center justify-content-between ${
                  i !== 4 ? "mb-4" : ""
                }`}
                key={i}
              >
                <div className="d-flex align-items-center">
                  <Link href="#" className="avatar avatar-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.img} alt="img" />
                  </Link>
                  <div className="ms-2">
                    <h6 className="fw-bold mb-1">
                      <Link href="#">{item.name}</Link>
                    </h6>
                    <p className="fs-13">ID : {item.id}</p>
                  </div>
                </div>

                <div className="text-end">
                  <p className="fs-13 mb-1">Instock</p>
                  <h6 className="text-orange fw-bold">{item.qty}</h6>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---------------- RECENT SALES ---------------- */}
      <div className="col-xxl-4 col-md-12 d-flex">
        <div className="card flex-fill">
          <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div className="d-inline-flex align-items-center">
              <span className="title-icon bg-soft-pink fs-16 me-2">
                <HiOutlineCube className="fs-16" />
              </span>
              <h5 className="card-title mb-0">Recent Sales</h5>
            </div>

            <div className="dropdown">
              <Link
                href="#"
                className="dropdown-toggle btn btn-sm btn-white"
                data-bs-toggle="dropdown"
              >
                <HiOutlineCalendarDays className="me-1" />
                Weekly
              </Link>
              <ul className="dropdown-menu p-3">
                <li><Link href="#" className="dropdown-item">Today</Link></li>
                <li><Link href="#" className="dropdown-item">Weekly</Link></li>
                <li><Link href="#" className="dropdown-item">Monthly</Link></li>
              </ul>
            </div>
          </div>

          <div className="card-body">
            {[
              {
                img: "assets/img/products/product-11.jpg",
                name: "Apple Watch Series 9",
                category: "Electronics",
                price: "$640",
                date: "Today",
                status: "Processing",
                badge: "bg-purple",
              },
              {
                img: "assets/img/products/product-12.jpg",
                name: "Gold Bracelet",
                category: "Fashion",
                price: "$126",
                date: "Today",
                status: "Cancelled",
                badge: "badge-danger",
              },
              {
                img: "assets/img/products/product-13.jpg",
                name: "Parachute Down Duvet",
                category: "Health",
                price: "$69",
                date: "15 Jan 2025",
                status: "Onhold",
                badge: "badge-cyan",
              },
              {
                img: "assets/img/products/product-14.jpg",
                name: "YETI Rambler Tumbler",
                category: "Sports",
                price: "$65",
                date: "12 Jan 2025",
                status: "Processing",
                badge: "bg-purple",
              },
              {
                img: "assets/img/products/product-15.jpg",
                name: "Osmo Genius Starter Kit",
                category: "Lifestyles",
                price: "$87.56",
                date: "11 Jan 2025",
                status: "Completed",
                badge: "badge-success",
              },
            ].map((item, i) => (
              <div
                className={`d-flex align-items-center justify-content-between ${
                  i !== 4 ? "mb-4" : ""
                }`}
                key={i}
              >
                <div className="d-flex align-items-center">
                  <Link href="#" className="avatar avatar-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.img} alt="img" />
                  </Link>
                  <div className="ms-2">
                    <h6 className="fw-bold mb-1">
                      <Link href="#">{item.name}</Link>
                    </h6>
                    <div className="d-flex align-items-center item-list">
                      <p>{item.category}</p>
                      <p className="text-gray-9">{item.price}</p>
                    </div>
                  </div>
                </div>

                <div className="text-end">
                  <p className="fs-13 mb-1">{item.date}</p>
                  <span
                    className={`${item.badge} badge-xs d-inline-flex align-items-center`}
                  >
                    <FiCircle className="fs-5 me-1" />
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
