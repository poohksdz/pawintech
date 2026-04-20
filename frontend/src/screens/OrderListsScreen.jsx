import React, { useMemo, useState, forwardRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaCalendarAlt, FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import { useGetAllUnifiedOrdersQuery } from "../slices/ordersApiSlice";

import Loader from "../components/Loader";
import Message from "../components/Message";
import Button from "../components/ui/Button";

/* =====================================================
    CUSTOM DATE INPUT (ICON + FULL WIDTH)
   ===================================================== */
const DateInput = forwardRef(({ value, onClick, placeholder }, ref) => (
  <div className="relative w-full" onClick={onClick}>
    <input
      ref={ref}
      value={value || ""}
      placeholder={placeholder || "DD/MM/YYYY"}
      readOnly
      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-700 cursor-pointer text-sm"
    />
    <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
  </div>
));

/* =====================================================
   MAIN COMPONENT
   ===================================================== */
const OrderListsScreen = () => {
  // ---------------- STATE ----------------
  const [searchQuery, setSearchQuery] = useState("");
  const [orderTypeFilter, setOrderTypeFilter] = useState("");
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  // ---------------- NAVIGATION ----------------
  const navigate = useNavigate();

  // ---------------- API ----------------
  const {
    data: allOrdersData,
    isLoading,
    error,
  } = useGetAllUnifiedOrdersQuery();

  // ---------------- DATA ----------------
  const allOrders = useMemo(() => {
    return Array.isArray(allOrdersData) ? allOrdersData : [];
  }, [allOrdersData]);

  // ---------------- FILTER ----------------
  const filteredOrders = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allOrders.filter((o) => {
      const created = new Date(o.createdAt);

      return (
        (!orderTypeFilter || o.type === orderTypeFilter) &&
        (!fromDate || created >= fromDate) &&
        (!toDate || created <= toDate) &&
        (o.orderID?.toLowerCase().includes(q) ||
          o.projectname?.toLowerCase().includes(q) ||
          o.customer?.toLowerCase().includes(q) ||
          o.company?.toLowerCase().includes(q) ||
          o.phone?.toLowerCase().includes(q))
      );
    });
  }, [allOrders, searchQuery, orderTypeFilter, fromDate, toDate]);

  // ---------------- UI HELPERS ----------------
  const statusBadge = (status) => {
    const baseClass =
      "px-2 py-1 text-xs font-bold uppercase tracking-wider rounded-md";
    switch (status) {
      case "accepted":
        return (
          <span className={`${baseClass} bg-emerald-100 text-emerald-800`}>
            Accepted
          </span>
        );
      case "pending":
        return (
          <span className={`${baseClass} bg-amber-100 text-amber-800`}>
            Pending
          </span>
        );
      case "manufacturing":
        return (
          <span className={`${baseClass} bg-blue-100 text-blue-800`}>
            Manufacturing
          </span>
        );
      case "delivered":
        return (
          <span className={`${baseClass} bg-indigo-100 text-indigo-800`}>
            Delivered
          </span>
        );
      default:
        return (
          <span className={`${baseClass} bg-slate-100 text-slate-800`}>
            {status}
          </span>
        );
    }
  };

  const typeBadge = (type) => {
    const colors = {
      PRODUCT: "bg-slate-800 text-white",
      "ASSEMBLY PCB": "bg-cyan-100 text-cyan-800",
      "CUSTOM PCB": "bg-amber-100 text-amber-800",
      "COPY PCB": "bg-emerald-100 text-emerald-800",
      "GERBER PCB": "bg-indigo-100 text-indigo-800",
    };
    return (
      <span
        className={`px-2 py-1 text-xs font-bold uppercase tracking-wider rounded-md ${colors[type]}`}
      >
        {type}
      </span>
    );
  };

  const formatDateDMY = (date) => {
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, "0")}/${String(
      d.getMonth() + 1,
    ).padStart(2, "0")}/${d.getFullYear()}`;
  };

  // ---------------- RENDER ----------------
  if (isLoading)
    return (
      <div className="min-h-screen flex justify-center items-center bg-slate-50">
        <Loader />
      </div>
    );

  if (error)
    return (
      <div className="max-w-4xl mx-auto py-4 md:py-6 md:py-10 px-4">
        <Message variant="danger">Failed to load orders</Message>
      </div>
    );

  /* ================= NAV ================= */
  const handleSetOrder = (order, orderID) => {
    const map = {
      PRODUCT: `/createproductorder/${orderID}/set`,
      "GERBER PCB": `/reorderorderpcb/${orderID}/set`,
      "CUSTOM PCB": `/reordercustompcb/${orderID}/set`,
      "COPY PCB": `/reordercopypcb/${orderID}/set`,
      "ASSEMBLY PCB": `/reorderassemblypcb/${orderID}/set`,
    };
    navigate(map[order.type], { state: { order } });
  };

  return (
    <div className="bg-slate-50 min-h-screen p-4 sm:p-6 lg:p-8 font-sans text-slate-900">
      <div className="max-w-screen-2xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-xl sm:text-3xl font-black text-slate-800 tracking-tight m-0 uppercase md:normal-case">
              Order Lists
            </h1>
            <p className="text-slate-500 text-[10px] md:text-sm mt-1 uppercase tracking-wider font-medium">
              Manage and review all orders
            </p>
          </div>
          <Button
            variant="primary"
            className="w-full sm:w-auto uppercase tracking-widest text-sm"
            onClick={() => navigate("/useraddresslistcreateorder/set")}
          >
            Create Orders
          </Button>
        </div>

        {/* Filters Section */}
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Order Type
              </label>
              <select
                className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white py-2 px-3 text-sm font-medium text-slate-700"
                value={orderTypeFilter}
                onChange={(e) => setOrderTypeFilter(e.target.value)}
              >
                <option value="">All Order Types</option>
                <option value="PRODUCT">Product</option>
                <option value="CUSTOM PCB">Custom PCB</option>
                <option value="COPY PCB">Copy PCB</option>
                <option value="ASSEMBLY PCB">Assembly PCB</option>
                <option value="GERBER PCB">Gerber PCB</option>
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                From Date
              </label>
              <DatePicker
                selected={fromDate}
                onChange={setFromDate}
                dateFormat="dd/MM/yyyy"
                customInput={<DateInput />}
                wrapperClassName="w-full"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                To Date
              </label>
              <DatePicker
                selected={toDate}
                onChange={setToDate}
                dateFormat="dd/MM/yyyy"
                customInput={<DateInput />}
                wrapperClassName="w-full"
              />
            </div>

            <div className="lg:col-span-1">
              <Button
                variant="outline"
                className="w-full justify-center text-sm font-black"
                onClick={() => {
                  setFromDate(null);
                  setToDate(null);
                }}
              >
                Clear
              </Button>
            </div>

            <div className="lg:col-span-5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Order / Project / Customer / Company / Phone"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-700 text-sm placeholder:text-slate-400"
                />
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-800 text-white uppercase tracking-wider text-xs font-semibold">
                <tr>
                  <th className="px-4 md:px-6 py-4 rounded-tl-xl">#</th>
                  <th className="px-4 md:px-6 py-4">Action</th>
                  <th className="px-4 md:px-6 py-4">Order ID</th>
                  <th className="px-4 md:px-6 py-4">Project</th>
                  <th className="px-4 md:px-6 py-4">Type</th>
                  <th className="px-4 md:px-6 py-4">Company</th>
                  <th className="px-4 md:px-6 py-4">Customer</th>
                  <th className="px-4 md:px-6 py-4">Phone</th>
                  <th className="px-4 md:px-6 py-4 text-right">Price (฿)</th>
                  <th className="px-4 md:px-6 py-4">Date</th>
                  <th className="px-4 md:px-6 py-4 rounded-tr-xl">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((o, i) => (
                    <tr
                      key={`${o.type}-${o.id}`}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 md:px-6 py-4 font-medium text-slate-500">
                        {i + 1}
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <button
                          className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors"
                          onClick={() => handleSetOrder(o, o.orderID)}
                        >
                          Reorder
                        </button>
                      </td>
                      <td className="px-4 md:px-6 py-4 font-mono text-slate-700">
                        {o.orderID}
                      </td>
                      <td
                        className="px-4 md:px-6 py-4 font-medium text-slate-800 truncate max-w-[200px]"
                        title={o.projectname}
                      >
                        {o.projectname}
                      </td>
                      <td className="px-4 md:px-6 py-4">{typeBadge(o.type)}</td>
                      <td className="px-4 md:px-6 py-4 text-slate-600 truncate max-w-[150px]">
                        {o.company}
                      </td>
                      <td className="px-4 md:px-6 py-4 text-slate-600">{o.customer}</td>
                      <td className="px-4 md:px-6 py-4 text-slate-600">{o.phone}</td>
                      <td className="px-4 md:px-6 py-4 font-bold text-slate-800 text-right">
                        {Number(o.price || 0).toLocaleString()}
                      </td>
                      <td className="px-4 md:px-6 py-4 text-slate-500">
                        {formatDateDMY(o.createdAt)}
                      </td>
                      <td className="px-4 md:px-6 py-4">{statusBadge(o.status)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="11"
                      className="px-4 md:px-6 py-12 text-center text-slate-500"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <FaSearch className="text-4xl text-slate-300 mb-3" />
                        <p className="text-lg font-medium text-slate-600 uppercase tracking-widest text-sm">
                          No orders found
                        </p>
                        <p className="text-sm">
                          Try adjusting your search or filters.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-50 border-t border-slate-100 py-3 px-4 md:px-6 text-sm text-slate-500 font-medium">
            Showing{" "}
            <span className="font-bold text-slate-800">
              {filteredOrders.length}
            </span>{" "}
            orders
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderListsScreen;
