"use client";

import Link from "next/link";
import Image from "next/image";
import {
  TbAlertTriangle,
  TbCalendar,
  TbArrowUpLeft,
  TbArrowDownRight,
  TbFlag,
  TbCircleFilled,
} from "react-icons/tb";

import { all_routes } from "@/data/all_routes";

type Props = {
  route?: typeof all_routes; // optional override, default used if not provided
};
export default function SalesAndTransactions({ route = all_routes }: Props) {
  return (
    <div className="row">
      {/* ---------------- SALES STATISTICS ---------------- */}
      <div className="col-xl-6 col-sm-12 col-12 d-flex">
        <div className="card flex-fill">
          <div className="card-header d-flex justify-content-between align-items-center">
            <div className="d-inline-flex align-items-center">
              <span className="title-icon bg-soft-danger fs-16 me-2">
                <TbAlertTriangle />
              </span>
              <h5 className="card-title mb-0">Sales Statistics</h5>
            </div>

            <div className="dropdown">
              <Link
                href="#"
                className="dropdown-toggle btn btn-sm btn-white"
                data-bs-toggle="dropdown"
              >
                <TbCalendar className="me-1" /> 2025
              </Link>

              <ul className="dropdown-menu p-3">
                <li><Link href="#" className="dropdown-item">2025</Link></li>
                <li><Link href="#" className="dropdown-item">2022</Link></li>
                <li><Link href="#" className="dropdown-item">2021</Link></li>
              </ul>
            </div>
          </div>

          <div className="card-body pb-0">
            <div className="d-flex align-items-center flex-wrap gap-2">
              {/* Revenue */}
              <div className="border p-2 br-8">
                <h5 className="d-inline-flex align-items-center text-teal">
                  $12,189
                  <span className="badge badge-success badge-xs d-inline-flex align-items-center ms-2">
                    <TbArrowUpLeft className="me-1" /> 25%
                  </span>
                </h5>
                <p>Revenue</p>
              </div>

              {/* Expense */}
              <div className="border p-2 br-8">
                <h5 className="d-inline-flex align-items-center text-orange">
                  $48,988,078
                  <span className="badge badge-danger badge-xs d-inline-flex align-items-center ms-2">
                    <TbArrowDownRight className="me-1" /> 25%
                  </span>
                </h5>
                <p>Expense</p>
              </div>
            </div>

            <div id="sales-statistics">{/* Chart */}</div>
          </div>
        </div>
      </div>

      {/* ---------------- RECENT TRANSACTIONS ---------------- */}
      <div className="col-xl-6 col-sm-12 col-12 d-flex">
        <div className="card flex-fill">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div className="d-inline-flex align-items-center">
              <span className="title-icon bg-soft-orange fs-16 me-2">
                <TbFlag />
              </span>
              <h5 className="card-title mb-0">Recent Transactions</h5>
            </div>

            <Link
              href={route.onlineorder}
              className="fs-13 fw-medium text-decoration-underline"
            >
              View All
            </Link>
          </div>

          {/* TAB HEADERS */}
          <div className="card-body p-0">
            <ul className="nav nav-tabs nav-justified transaction-tab">
              <li className="nav-item">
                <Link className="nav-link active" href="#sale" data-bs-toggle="tab">Sale</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" href="#purchase-transaction" data-bs-toggle="tab">Purchase</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" href="#quotation" data-bs-toggle="tab">Quotation</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" href="#expenses" data-bs-toggle="tab">Expenses</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" href="#invoices" data-bs-toggle="tab">Invoices</Link>
              </li>
            </ul>

            <div className="tab-content">
              {/* =============== TAB: SALE =============== */}
              <div className="tab-pane show active" id="sale">
                <div className="table-responsive">
                  <table className="table table-borderless custom-table">
                    <thead className="thead-light">
                      <tr>
                        <th>Date</th>
                        <th>Customer</th>
                        <th>Status</th>
                        <th>Total</th>
                      </tr>
                    </thead>

                    <tbody>
                      {/* Example row */}
                      <tr>
                        <td>24 May 2025</td>
                        <td>
                          <div className="d-flex align-items-center file-name-icon">
                            <Link href="#" className="avatar avatar-md">
                              <Image
                                src="/assets/img/customer/customer16.jpg"
                                width={48}
                                height={48}
                                alt="Customer"
                              />
                            </Link>
                            <div className="ms-2">
                              <h6 className="fw-medium">
                                <Link href="#">Andrea Willer</Link>
                              </h6>
                              <span className="fs-13 text-orange">#114589</span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="badge badge-success badge-xs d-inline-flex align-items-center">
                            <TbCircleFilled className="fs-5 me-1" /> Completed
                          </span>
                        </td>

                        <td className="fs-16 fw-bold text-gray-9">$4,560</td>
                      </tr>

                      {/* Repeat other rows like above... */}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Other tabs (Purchase, Quotation, Expenses, Invoices) follow same pattern */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
