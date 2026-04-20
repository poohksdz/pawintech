import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaBox,
  FaSearch,
  FaClipboardList,
  FaCheckCircle,
  FaTruck,
  FaMoneyBillWave,
  FaClock,
  FaTimes,
  FaEdit,
  FaEye,
  FaChevronLeft,
  FaChevronRight,
  FaParachuteBox,
} from "react-icons/fa";
import { PiNotepadBold } from "react-icons/pi";

import Message from "../../components/Message";
import Loader from "../../components/Loader";
import Meta from "../../components/Meta";
import {
  useGetOrdersQuery,
  useGetTransportationPriceQuery,
  useUpdateTransportationPriceMutation,
} from "../../slices/ordersApiSlice";
import ComfirmDeliveryModal from "../../components/ComfirmDeliveryModal";
import ConfirmPayModal from "../../components/ConfirmPayModal";

const formatDate = (dateString) => {
  if (!dateString) return "-";
  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return new Date(dateString).toLocaleDateString("th-TH", options);
};

const formatStat = (num, isMoney = false) => {
  if (!num || num === 0) return <span className="opacity-40">-</span>;
  return isMoney ? `${num.toLocaleString()} ฿` : num.toLocaleString();
};

const getStatusBadge = (isPaid, isDelivered, slip, language) => {
  if (language === "thai") {
    if (!!isPaid && !!isDelivered)
      return {
        label: "เสร็จสมบูรณ์",
        color: "bg-emerald-100 text-emerald-800 border-emerald-200",
      };
    if (!!isDelivered)
      return {
        label: "ส่งแล้ว",
        color: "bg-blue-100 text-blue-800 border-blue-200",
      };
    if (!!isPaid)
      return {
        label: "ชำระแล้ว",
        color: "bg-indigo-100 text-indigo-800 border-indigo-200",
      };
    if (slip)
      return {
        label: "รอตรวจสอบ",
        color: "bg-amber-100 text-amber-800 border-amber-200",
      };
    return {
      label: "รอดำเนินการ",
      color: "bg-slate-100 text-slate-600 border-slate-200",
    };
  }
  if (!!isPaid && !!isDelivered)
    return {
      label: "Completed",
      color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    };
  if (!!isDelivered)
    return {
      label: "Delivered",
      color: "bg-blue-100 text-blue-800 border-blue-200",
    };
  if (!!isPaid)
    return {
      label: "Paid",
      color: "bg-indigo-100 text-indigo-800 border-indigo-200",
    };
  if (slip)
    return {
      label: "Verify",
      color: "bg-amber-100 text-amber-800 border-amber-200",
    };
  return {
    label: "Pending",
    color: "bg-slate-100 text-slate-600 border-slate-200",
  };
};

const StatusBadge = ({ isPaid, isDelivered, slip }) => {
  const { language } = useSelector((state) => state.language);
  const { label, color } = getStatusBadge(isPaid, isDelivered, slip, language);
  return (
    <span
      className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${color}`}
    >
      {label}
    </span>
  );
};

const OrderListScreen = () => {
  const { data: orders, isLoading, error, refetch } = useGetOrdersQuery();

  const [showModalDeliveryPrice, setShowModalDeliveryPrice] = useState(false);
  const [showModal, setShowModal] = useState(false); // confirm delivery modal
  const [showConfirmPayModal, setShowConfirmPayModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [deliveryPrice, setDeliveryPrice] = useState("");
  const [showSlipImage, setShowSlipImage] = useState(null);
  const [isZoomed, setIsZoomed] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [updateTransportationPrice, { isLoading: loadingUpdatePrice }] =
    useUpdateTransportationPriceMutation();
  const { data: transportationPrice } = useGetTransportationPriceQuery();

  useEffect(() => {
    if (transportationPrice && transportationPrice.transportationPrice) {
      setDeliveryPrice(transportationPrice.transportationPrice);
    }
  }, [transportationPrice]);

  const { language } = useSelector((state) => state.language);
  const t = {
    en: {
      OrdersLbl: "Orders",
      Search: "Search by ID or User",
      Filter: "Status",
      Export: "Export",
      TotalSales: "Revenue",
      TotalOrders: "Total Orders",
      PendingPay: "Pending",
      ToShip: "To Ship",
    },
    thai: {
      OrdersLbl: "คำสั่งซื้อ",
      Search: "ค้นหาด้วย ID หรือ ชื่อลูกค้า",
      Filter: "สถานะ",
      Export: "Export",
      TotalSales: "ยอดขาย",
      TotalOrders: "ออเดอร์ทั้งหมด",
      PendingPay: "รอจ่าย",
      ToShip: "รอจัดส่ง",
    },
  }[language || "en"];

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    let tempOrders = [...orders];

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      tempOrders = tempOrders.filter(
        (o) =>
          String(o.id).toLowerCase().includes(lowerTerm) ||
          (o.userName || "").toLowerCase().includes(lowerTerm) ||
          (o.paymentComfirmID || "").toLowerCase().includes(lowerTerm),
      );
    }

    if (filterStatus !== "All") {
      if (filterStatus === "Pending")
        tempOrders = tempOrders.filter((o) => !o.isPaid);
      if (filterStatus === "Verify")
        tempOrders = tempOrders.filter((o) => !o.isPaid && o.paymentSlip);
      if (filterStatus === "ToShip")
        tempOrders = tempOrders.filter((o) => !!o.isPaid && !o.isDelivered);
      if (filterStatus === "Completed")
        tempOrders = tempOrders.filter((o) => !!o.isPaid && !!o.isDelivered);
    }

    // Sort descending by created date
    return tempOrders.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
  }, [orders, searchTerm, filterStatus]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const currentOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const stats = useMemo(() => {
    if (!orders) return { sales: 0, count: 0, pending: 0, ship: 0 };
    return {
      sales: orders.reduce(
        (acc, item) => (item.isPaid ? acc + Number(item.totalPrice || 0) : acc),
        0,
      ),
      count: orders.length,
      pending: orders.filter((o) => !o.isPaid).length,
      ship: orders.filter((o) => !!o.isPaid && !o.isDelivered).length,
    };
  }, [orders]);

  const handleShowDeliveryModal = (orderId) => {
    setSelectedOrderId(orderId);
    setShowModal(true);
  };
  const handleShowPayModal = (orderId) => {
    setSelectedOrderId(orderId);
    setShowConfirmPayModal(true);
  };
  const handleCloseModal = () => {
    setShowModal(false);
    setShowConfirmPayModal(false);
    setSelectedOrderId(null);
  };

  const handleSaveDeliveryPrice = async (e) => {
    e.preventDefault();
    try {
      await updateTransportationPrice({
        transportationPriceId: 1,
        transportationPrice: deliveryPrice,
      }).unwrap();
      setShowModalDeliveryPrice(false);
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const StatusTabs =
    language === "thai"
      ? ["ทั้งหมด", "รอดำเนินการ", "ตรวจสอบ", "รอจัดส่ง", "เสร็จสมบูรณ์"]
      : ["All", "Pending", "Verify", "ToShip", "Completed"];

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-black pb-20 font-sans selection:bg-indigo-100 dark:selection:bg-zinc-800 selection:text-indigo-900 dark:selection:text-white transition-colors duration-500">
      <Meta title={t.OrdersLbl} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100 text-indigo-600 shadow-sm shrink-0">
              <FaClipboardList size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {t.OrdersLbl}
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                จัดการคำสั่งซื้อทั้งหมดของคุณ
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowModalDeliveryPrice(true)}
            className="inline-flex items-center gap-2 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all shadow-sm focus:ring-2 focus:ring-slate-200 outline-none"
          >
            <FaParachuteBox className="text-indigo-500" /> ตั้งค่าขนส่ง
          </button>
        </div>

        {/* Dashboard Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-zinc-900/50 rounded-2xl p-5 border border-slate-100 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform">
              <FaMoneyBillWave size={64} />
            </div>
            <p className="text-sm font-semibold text-slate-500 mb-1 relative z-10">
              {t.TotalSales}
            </p>
            <h3 className="text-2xl font-bold text-slate-900 relative z-10">
              {formatStat(stats.sales, true)}
            </h3>
          </div>
          <div className="bg-white dark:bg-zinc-900/50 rounded-2xl p-5 border border-slate-100 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform">
              <FaClipboardList size={64} />
            </div>
            <p className="text-sm font-semibold text-slate-500 mb-1 relative z-10">
              {t.TotalOrders}
            </p>
            <h3 className="text-2xl font-bold text-slate-900 relative z-10">
              {formatStat(stats.count)}
            </h3>
          </div>
          <div className="bg-white dark:bg-zinc-900/50 rounded-2xl p-5 border border-slate-100 dark:border-zinc-800 shadow-[0_0_0_1px_rgba(245,158,11,0.2)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 text-amber-500 opacity-10 translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform">
              <FaClock size={64} />
            </div>
            <p className="text-sm font-semibold text-amber-600 mb-1 relative z-10">
              {t.PendingPay}
            </p>
            <h3 className="text-2xl font-bold text-slate-900 relative z-10">
              {formatStat(stats.pending)}
            </h3>
          </div>
          <div className="bg-indigo-600 rounded-2xl p-5 border border-indigo-500 shadow-md relative overflow-hidden group text-white">
            <div className="absolute top-0 right-0 p-4 opacity-10 translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform">
              <FaTruck size={64} />
            </div>
            <p className="text-sm font-medium text-indigo-100 mb-1 relative z-10">
              {t.ToShip}
            </p>
            <h3 className="text-2xl font-bold relative z-10">
              {formatStat(stats.ship)}
            </h3>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-white dark:bg-zinc-900/30 rounded-2xl shadow-sm border border-slate-200/60 dark:border-zinc-800/80 overflow-hidden">
          {/* Toolbar (Search & Tabs) */}
          <div className="p-4 sm:p-5 border-b border-slate-100 border-dashed space-y-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              {/* Tabs */}
              <div className="flex overflow-x-auto no-scrollbar w-full md:w-auto bg-slate-50/50 dark:bg-zinc-950 p-1 rounded-xl border border-slate-100 dark:border-zinc-800">
                {StatusTabs.map((tab, index) => (
                  <button
                    key={tab}
                    onClick={() => {
                      const englishTabs = [
                        "All",
                        "Pending",
                        "Verify",
                        "ToShip",
                        "Completed",
                      ];
                      setFilterStatus(englishTabs[index]);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${filterStatus ===
                      ["All", "Pending", "Verify", "ToShip", "Completed"][index]
                      ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-slate-200/50 dark:ring-zinc-700/50"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-zinc-800/50"
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative w-full md:w-80 group">
                <FaSearch
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
                  size={14}
                />
                <input
                  type="text"
                  placeholder={t.Search}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:bg-white dark:focus:bg-black focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-slate-700 dark:text-white placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="py-20 flex justify-center">
              <Loader />
            </div>
          ) : error ? (
            <div className="p-4 md:p-6">
              <Message variant="danger">
                {error?.data?.message || error.error}
              </Message>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto min-h-[400px]">
                <table className="w-full text-left text-sm whitespace-nowrap border-collapse border border-slate-200 dark:border-zinc-800">
                  <thead className="bg-[#f8fafc] dark:bg-zinc-950 text-slate-600 dark:text-slate-400 font-bold border-b-2 border-slate-300 dark:border-zinc-800">
                    <tr>
                      <th className="px-4 md:px-6 py-4 w-12 text-center border-r border-slate-200">
                        ID
                      </th>
                      <th className="px-4 md:px-6 py-4 border-r border-slate-200">
                        ผู้สั่งซื้อ
                      </th>
                      <th className="px-4 md:px-6 py-4 border-r border-slate-200">
                        วันที่ / เวลา
                      </th>
                      <th className="px-4 md:px-6 py-4 text-right border-r border-slate-200">
                        ยอดรวม
                      </th>
                      <th className="px-4 md:px-6 py-4 text-center border-r border-slate-200">
                        หลักฐาน
                      </th>
                      <th className="px-4 md:px-6 py-4 text-center border-r border-slate-200">
                        สถานะ
                      </th>
                      <th className="px-4 md:px-6 py-4 text-center">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 relative">
                    <AnimatePresence mode="popLayout">
                      {currentOrders.length > 0 ? (
                        currentOrders.map((order, index) => (
                          <motion.tr
                            layout
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{
                              duration: 0.3,
                              delay: index * 0.05,
                              ease: "easeOut",
                            }}
                            key={order.id}
                            className="hover:bg-indigo-50/30 transition-colors group"
                          >
                            <td className="px-4 md:px-6 py-4 text-center border-r border-slate-200">
                              <span className="font-mono text-indigo-600 font-bold bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200 shadow-sm">
                                #{order.paymentComfirmID || order.id}
                              </span>
                            </td>
                            <td className="px-4 md:px-6 py-4 border-r border-slate-200">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold shadow-sm">
                                  {(order.userName || "U")
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>
                                <span className="font-bold text-slate-800">
                                  {order.userName || "Guest"}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 md:px-6 py-4 text-slate-600 font-medium border-r border-slate-200">
                              {formatDate(order.createdAt)}
                            </td>
                            <td className="px-4 md:px-6 py-4 text-right font-bold text-emerald-600 text-base border-r border-slate-200">
                              {(order.totalPrice || 0).toLocaleString()}{" "}
                              <span className="text-slate-400 font-normal">
                                ฿
                              </span>
                            </td>
                            <td className="px-4 md:px-6 py-4 text-center border-r border-slate-200 align-middle">
                              {order.paymentSlip ? (
                                <button
                                  onClick={() => setShowSlipImage(order.id)}
                                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto hover:bg-indigo-100 hover:text-indigo-600 transition-colors tooltip"
                                  title="ดูสลิป"
                                >
                                  <PiNotepadBold size={16} />
                                </button>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                            <td className="px-4 md:px-6 py-4 text-center border-r border-slate-200 align-middle">
                              <StatusBadge
                                isPaid={order.isPaid}
                                isDelivered={order.isDelivered}
                                slip={order.paymentSlip}
                              />
                            </td>
                            <td className="px-4 md:px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {!order.isPaid && order.paymentSlip && (
                                  <button
                                    onClick={() => handleShowPayModal(order.id)}
                                    className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border border-emerald-200"
                                  >
                                    ตรวจสอบเงิน
                                  </button>
                                )}
                                {!!order.isPaid && !order.isDelivered && (
                                  <button
                                    onClick={() =>
                                      handleShowDeliveryModal(order.id)
                                    }
                                    className="bg-amber-50 text-amber-600 hover:bg-amber-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border border-amber-200"
                                  >
                                    จัดส่งแล้ว
                                  </button>
                                )}
                                <Link
                                  to={`/order/${order.id}`}
                                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                                  title="รายละเอียด"
                                >
                                  <FaEye />
                                </Link>
                                <Link
                                  to={`/admin/orderlist/${order.id}/edit`}
                                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                  title="แก้ไข"
                                >
                                  <FaEdit />
                                </Link>
                              </div>
                            </td>
                          </motion.tr>
                        ))
                      ) : (
                        <motion.tr
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <td
                            colSpan="7"
                            className="px-4 md:px-6 py-12 text-center text-slate-400"
                          >
                            <FaBox
                              className="mx-auto mb-3 opacity-20"
                              size={48}
                            />
                            <p>ไม่พบรายการคำสั่งซื้อ</p>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <motion.div
                layout
                className="lg:hidden p-4 space-y-3 bg-slate-50/50"
              >
                <AnimatePresence mode="popLayout">
                  {currentOrders.length > 0 ? (
                    currentOrders.map((order) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        key={order.id}
                        className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3"
                      >
                        {/* Row 1: ID and Status */}
                        <div className="flex justify-between items-center gap-3">
                          <span className="font-mono text-indigo-600 font-bold bg-indigo-50 px-2.5 py-1 rounded-md text-xs sm:text-sm border border-indigo-100 break-all min-w-0">
                            #{order.paymentComfirmID || order.id}
                          </span>
                          <div className="shrink-0">
                            <StatusBadge
                              isPaid={order.isPaid}
                              isDelivered={order.isDelivered}
                              slip={order.paymentSlip}
                            />
                          </div>
                        </div>

                        {/* Row 2: Customer and Date */}
                        <div className="flex justify-between items-center text-sm mt-1">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs ring-1 ring-slate-200">
                              {(order.userName || "U").charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-slate-800">
                              {order.userName || "Guest"}
                            </span>
                          </div>
                          <span className="text-slate-500 text-xs">
                            {formatDate(order.createdAt)}
                          </span>
                        </div>

                        {/* Row 3: Price */}
                        <div className="flex justify-between items-center pt-3 mt-1 border-t border-slate-100 border-dashed">
                          <div className="text-slate-500 text-xs font-semibold">
                            ยอดชำระ
                          </div>
                          <div className="font-bold text-lg text-slate-900">
                            {(order.totalPrice || 0).toLocaleString()}{" "}
                            <span className="text-xs text-slate-500 font-normal">
                              ฿
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2 pt-3 mt-1 border-t border-slate-100">
                          {order.paymentSlip && (
                            <button
                              onClick={() => setShowSlipImage(order.id)}
                              className="flex-1 min-w-[30%] flex items-center justify-center gap-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 py-2.5 rounded-xl text-xs font-bold transition-colors"
                            >
                              <PiNotepadBold size={16} /> บิล
                            </button>
                          )}
                          {!order.isPaid && order.paymentSlip && (
                            <button
                              onClick={() => handleShowPayModal(order.id)}
                              className="flex-1 min-w-[30%] flex items-center justify-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100 py-2.5 rounded-xl text-xs font-bold transition-colors"
                            >
                              <FaCheckCircle size={14} /> ยืนยันเงิน
                            </button>
                          )}
                          {!!order.isPaid && !order.isDelivered && (
                            <button
                              onClick={() => handleShowDeliveryModal(order.id)}
                              className="flex-1 min-w-[30%] flex items-center justify-center gap-1.5 bg-indigo-50 border border-indigo-200 text-indigo-600 hover:bg-indigo-100 py-2.5 rounded-xl text-xs font-bold transition-colors"
                            >
                              <FaTruck size={14} /> ส่งแล้ว
                            </button>
                          )}
                          <div className="flex gap-2 min-w-fit ml-auto">
                            <Link
                              title="รายละเอียด"
                              to={`/order/${order.id}`}
                              className="flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 w-10 border-transparent hover:border-indigo-200 hover:bg-indigo-50 shadow-[0_1px_2px_rgba(0,0,0,0.05)] rounded-xl transition-all"
                            >
                              <FaEye size={16} />
                            </Link>
                            <Link
                              title="แก้ไข"
                              to={`/admin/orderlist/${order.id}/edit`}
                              className="flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-blue-600 w-10 border-transparent hover:border-blue-200 hover:bg-blue-50 shadow-[0_1px_2px_rgba(0,0,0,0.05)] rounded-xl transition-all"
                            >
                              <FaEdit size={16} />
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200 border-dashed"
                    >
                      <FaBox className="mx-auto mb-3 opacity-20" size={32} />
                      <p className="text-sm">ไม่พบรายการคำสั่งซื้อ</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-4 sm:p-6 border-t border-slate-100 flex justify-center">
                  <div className="inline-flex bg-white rounded-xl shadow-sm border border-slate-200/60 p-1 gap-1">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((prev) => prev - 1)}
                      className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                      <FaChevronLeft size={12} />
                    </button>
                    {[...Array(totalPages).keys()].map((x) => (
                      <button
                        key={x + 1}
                        onClick={() => setCurrentPage(x + 1)}
                        className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-semibold transition-all ${x + 1 === currentPage
                          ? "bg-indigo-600 text-white shadow-md"
                          : "text-slate-600 hover:bg-slate-100"
                          }`}
                      >
                        {x + 1}
                      </button>
                    ))}
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((prev) => prev + 1)}
                      className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                      <FaChevronRight size={12} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* --- Custom Framer Motion Modals --- */}
        <AnimatePresence>
          {/* Delivery Price Modal */}
          {showModalDeliveryPrice && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                onClick={() => setShowModalDeliveryPrice(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-sm relative z-10 overflow-hidden border border-slate-100"
              >
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <FaParachuteBox className="text-indigo-500" /> ค่าส่งมาตรฐาน
                  </h3>
                  <button
                    onClick={() => setShowModalDeliveryPrice(false)}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200/50 transition-colors"
                  >
                    <FaTimes />
                  </button>
                </div>
                <form onSubmit={handleSaveDeliveryPrice} className="p-4 md:p-6">
                  <div className="mb-6 relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-slate-400 font-semibold">฿</span>
                    </div>
                    <input
                      type="number"
                      value={deliveryPrice}
                      onChange={(e) => setDeliveryPrice(e.target.value)}
                      min="0"
                      className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-2xl font-bold text-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowModalDeliveryPrice(false)}
                      className="w-full bg-slate-100 text-slate-600 font-bold py-3.5 rounded-xl hover:bg-slate-200 transition-colors shadow-sm"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={loadingUpdatePrice}
                      className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-70"
                    >
                      {loadingUpdatePrice ? "รอสักครู่..." : "บันทึก"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {/* Slip Image Lightbox */}
          {showSlipImage && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-10">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/90 backdrop-blur-md"
                onClick={() => {
                  setShowSlipImage(null);
                  setIsZoomed(false);
                }}
              />

              <button
                onClick={() => setShowSlipImage(null)}
                className="absolute top-6 right-6 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center transition-colors shadow-lg backdrop-blur-md"
              >
                <FaTimes />
              </button>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: isZoomed ? 1.5 : 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className={`relative z-10 max-w-full max-h-full ${isZoomed ? "cursor-zoom-out" : "cursor-zoom-in"}`}
                onClick={() => setIsZoomed(!isZoomed)}
              >
                {(() => {
                  const targetOrder = orders?.find(
                    (o) => o.id === showSlipImage,
                  );
                  return targetOrder?.paymentSlip ? (
                    <img
                      src={targetOrder.paymentSlip}
                      alt="Payment Slip"
                      className="max-h-[85vh] object-contain rounded-xl shadow-2xl ring-1 ring-white/10"
                      draggable={false}
                    />
                  ) : null;
                })()}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Exiting Modals (Unchanged logic) */}
        <ConfirmPayModal
          show={showConfirmPayModal}
          handleClose={handleCloseModal}
          orderId={selectedOrderId}
          onConfirm={refetch}
        />
        <ComfirmDeliveryModal
          show={showModal}
          handleClose={handleCloseModal}
          orderId={selectedOrderId}
          onConfirm={refetch}
        />
      </div>
    </div>
  );
};

export default OrderListScreen;
