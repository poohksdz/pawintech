import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import {
  FaSearch,
  FaClipboardList,
  FaCheckCircle,
  FaSyncAlt,
  FaTruck,
  FaEye,
  FaBox,
  FaDownload,
} from "react-icons/fa";
import { BASE_URL } from "../../constants";
import { PiCurrencyCircleDollarFill } from "react-icons/pi";

import Loader from "../../components/Loader";
import Message from "../../components/Message";
import Meta from "../../components/Meta";
import {
  useGetAllcopyPCBsQuery,
  useUpdateDeliverycopyPCBMutation,
} from "../../slices/copypcbApiSlice";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
  }).format(amount);
};

const formatDate = (dateString, lang) => {
  if (!dateString) return "-";
  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return new Date(dateString).toLocaleDateString(
    lang === "thai" ? "th-TH" : "en-GB",
    options,
  );
};

const CopyPCBOrderListScreen = () => {
  const navigate = useNavigate();
  const { language } = useSelector((state) => state.language);

  // API Calls
  const { data: rawData, isLoading, error, refetch } = useGetAllcopyPCBsQuery();
  const [updateDeliverycopyPCB, { isLoading: loadingUpdate }] =
    useUpdateDeliverycopyPCBMutation();

  // State for Search and Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  // State for modal
  const [showModal, setShowModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [transferedNumber, setTransferedNumber] = useState("");

  const t = {
    en: {
      Title: "Copy PCB Order List",
      Subtitle: "Manage your copy PCB orders and reorders",
      Search: "Search by ID or Project",
      Filter: "Status",
      TotalOrders: "Total Orders",
      TotalRevenue: "Estimated Revenue",
      Qty: "Qty",
      Action: "Details",
      Empty: "No copy PCB orders found.",
      ConfirmReceive: "Confirm Delivery",
      DeliveryStatus: "Delivery",
      ConfirmModalTitle: "Confirm Delivery",
      TransferNumber: "Transfer Number",
      TransferPlaceholder: "Enter transfer number",
      ConfirmBtn: "Deliver",
      CancelBtn: "Cancel",
    },
    thai: {
      Title: "รายการสั่งผลิต Copy PCB",
      Subtitle: "จัดการรายการสั่งคัดลอกแผ่นปริ้นและการสั่งซ้ำ",
      Search: "ค้นหาด้วย ID หรือ ชื่อโปรเจกต์",
      Filter: "สถานะ",
      TotalOrders: "ออเดอร์ทั้งหมด",
      TotalRevenue: "ยอดระเมินรวม",
      Qty: "จำนวน",
      Action: "รายละเอียด",
      Empty: "ไม่พบคำสั่งซื้อ Copy PCB",
      ConfirmReceive: "ยืนยันการส่ง",
      DeliveryStatus: "การจัดส่ง",
      ConfirmModalTitle: "ยืนยันการจัดส่ง",
      TransferNumber: "หมายเลขการโอน/ติดตาม",
      TransferPlaceholder: "กรอกหมายเลขติดตามงาน",
      ConfirmBtn: "จัดส่งแล้ว",
      CancelBtn: "ยกเลิก",
    },
  }[language || "en"];

  // Data Processing
  const filteredOrders = useMemo(() => {
    const orders = rawData?.data || [];
    let tempOrders = [...orders].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at),
    );

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      tempOrders = tempOrders.filter(
        (o) =>
          (o.projectname || "").toLowerCase().includes(lower) ||
          (o.orderID || "").toLowerCase().includes(lower),
      );
    }

    if (filterStatus !== "All") {
      if (filterStatus === "Delivered") {
        tempOrders = tempOrders.filter((o) => o.isDelivered);
      } else if (filterStatus === "Pending") {
        tempOrders = tempOrders.filter((o) => !o.isDelivered);
      }
    }

    return tempOrders;
  }, [rawData, searchTerm, filterStatus]);

  const stats = useMemo(() => {
    const orders = rawData?.data || [];
    return {
      count: orders.length,
      revenue: orders.reduce(
        (acc, item) => acc + (parseFloat(item.confirmed_price) || 0),
        0,
      ),
    };
  }, [rawData]);

  // Handlers
  const handleShowModal = (id) => {
    setSelectedOrderId(id);
    setShowModal(true);
  };

  const handleConfirmDelivery = async () => {
    if (!selectedOrderId || !transferedNumber) {
      toast.error(
        language === "thai"
          ? "กรุณากรอกหมายเลขติดตาม"
          : "Transfer number is required",
      );
      return;
    }
    try {
      await updateDeliverycopyPCB({
        pcborderId: selectedOrderId,
        transferedNumber,
      }).unwrap();
      toast.success(
        language === "thai"
          ? "จัดส่งเรียบร้อยแล้ว"
          : "Order confirmed as delivered",
      );
      setTransferedNumber("");
      refetch();
      setShowModal(false);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to confirm order");
    }
  };

  const StatusTabs = ["All", "Pending", "Delivered"];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Meta title={t.Title} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-slate-200 text-emerald-600 shadow-sm shrink-0">
              <FaClipboardList size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {t.Title}
              </h1>
              <p className="text-sm text-slate-500 font-medium">{t.Subtitle}</p>
            </div>
          </div>
        </div>

        {/* Dashboard Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-1 relative z-10">
                {t.TotalOrders}
              </p>
              <h3 className="text-3xl font-bold text-slate-900 relative z-10">
                {stats.count.toLocaleString()}
              </h3>
            </div>
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform">
              <FaClipboardList size={32} />
            </div>
            <div className="absolute -right-6 -bottom-6 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-500">
              <FaClipboardList size={140} />
            </div>
          </div>
          <div className="bg-emerald-600 rounded-2xl p-6 border border-emerald-500 shadow-md relative overflow-hidden group flex items-center justify-between text-white">
            <div>
              <p className="text-sm font-medium text-emerald-100 mb-1 relative z-10">
                {t.TotalRevenue}
              </p>
              <h3 className="text-3xl font-bold relative z-10 font-mono">
                {formatCurrency(stats.revenue)}
              </h3>
            </div>
            <div className="w-16 h-16 bg-white/10 text-white rounded-2xl flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform backdrop-blur-sm">
              <PiCurrencyCircleDollarFill size={36} />
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-500">
              <PiCurrencyCircleDollarFill size={140} />
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 sm:p-5 border-b border-slate-100 border-dashed space-y-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="flex overflow-x-auto no-scrollbar w-full md:w-auto bg-slate-50/50 p-1 rounded-xl border border-slate-100">
                {StatusTabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilterStatus(tab)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${filterStatus === tab
                      ? "bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200/50"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
                      }`}
                  >
                    {tab === "All"
                      ? language === "thai"
                        ? "ทั้งหมด"
                        : "All"
                      : tab === "Pending"
                        ? language === "thai"
                          ? "รอดำเนินการ"
                          : "Pending"
                        : language === "thai"
                          ? "จัดส่งแล้ว"
                          : "Delivered"}
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-80 group">
                <FaSearch
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors"
                  size={14}
                />
                <input
                  type="text"
                  placeholder={t.Search}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none text-slate-700 placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="py-20 flex justify-center">
              <Loader />
            </div>
          ) : error ? (
            <div className="p-6">
              <Message variant="danger">
                {error?.data?.message || error.message || "Error occurred"}
              </Message>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto min-h-[400px]">
                <table className="w-full text-left text-sm whitespace-nowrap border-collapse border border-slate-200">
                  <thead className="bg-[#f8fafc] text-slate-600 font-bold border-b-2 border-slate-300">
                    <tr>
                      <th className="px-6 py-4 w-12 text-center border-r border-slate-200">
                        #
                      </th>
                      <th className="px-6 py-4 border-r border-slate-200">
                        ID
                      </th>
                      <th className="px-6 py-4 border-r border-slate-200">
                        โปรเจกต์
                      </th>
                      <th className="px-6 py-4 border-r border-slate-200">
                        วันที่สั่งซื้อ
                      </th>
                      <th className="px-6 py-4 text-center border-r border-slate-200">
                        จัดส่ง
                      </th>
                      <th className="px-6 py-4 text-center border-r border-slate-200">
                        {t.Qty}
                      </th>
                      <th className="px-6 py-4 text-right border-r border-slate-200">
                        ยอดรวม
                      </th>
                      <th className="px-6 py-4 text-center">{t.Action}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 relative">
                    <AnimatePresence mode="popLayout" initial={false}>
                      {filteredOrders.length > 0 ? (
                        filteredOrders.map((pcb, index) => (
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
                            key={pcb.id}
                            className="hover:bg-emerald-50/30 transition-colors group"
                          >
                            <td className="px-6 py-4 text-center text-slate-500 font-semibold border-r border-slate-200">
                              {index + 1}
                            </td>
                            <td className="px-6 py-4 border-r border-slate-200">
                              <span className="font-mono text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 shadow-sm">
                                {pcb.orderID}
                              </span>
                            </td>
                            <td className="px-6 py-4 border-r border-slate-200">
                              <div
                                className="font-bold text-slate-800 max-w-[200px] truncate"
                                title={pcb.projectname}
                              >
                                {pcb.projectname}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-600 border-r border-slate-200">
                              {formatDate(pcb.created_at, language)}
                            </td>
                            <td className="px-6 py-4 text-center border-r border-slate-200 align-middle">
                              {pcb.isDelivered ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border bg-emerald-100/50 text-emerald-700 border-emerald-200">
                                  <FaCheckCircle size={12} /> Delivered
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleShowModal(pcb.id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 transition-colors shadow-sm"
                                >
                                  <FaTruck size={14} />{" "}
                                  {language === "thai"
                                    ? "รอยืนยันส่ง"
                                    : "Pending"}
                                </button>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center border-r border-slate-200 align-middle">
                              <span className="font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded inline-block min-w-[2rem] border border-slate-300 shadow-sm">
                                {pcb.pcb_qty}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-emerald-600 border-r border-slate-200 text-base">
                              {formatCurrency(pcb.confirmed_price)}
                            </td>
                            <td className="px-6 py-4 align-middle text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Link
                                  to={`/copypcb/${pcb.id}`}
                                  className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-200 shadow-sm"
                                  title="ดูรายละเอียด"
                                >
                                  <FaEye />
                                </Link>
                                {pcb.copypcb_zip && (
                                  <button
                                    onClick={() => {
                                      const filename = pcb.copypcb_zip?.split(/[/\\]/).pop();
                                      window.open(`${BASE_URL}/copypcbZipFiles/${filename}`, "_blank");
                                    }}
                                    className="w-8 h-8 flex items-center justify-center text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-200 shadow-sm"
                                    title="Download ZIP"
                                  >
                                    <FaDownload size={12} />
                                  </button>
                                )}
                                <button
                                  onClick={() =>
                                    navigate(
                                      `/reordercopypcb/${pcb.orderID}/set`,
                                    )
                                  }
                                  className="w-8 h-8 flex items-center justify-center text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-200 shadow-sm"
                                  title="สั่งซ้ำ"
                                >
                                  <FaSyncAlt />
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        ))
                      ) : (
                        <motion.tr
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <td
                            colSpan="8"
                            className="px-6 py-16 text-center text-slate-400 absolute w-full left-0 border-b-0"
                          >
                            <FaBox
                              className="mx-auto mb-3 opacity-20"
                              size={48}
                            />
                            <p>{t.Empty}</p>
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
                className="lg:hidden p-4 space-y-4 bg-slate-50/50 min-h-[300px] relative"
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((pcb, index) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{
                          duration: 0.3,
                          delay: index * 0.05,
                          ease: "easeOut",
                        }}
                        key={pcb.id}
                        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex flex-col gap-3 group hover:shadow-[0_8px_20px_rgb(0,0,0,0.06)] transition-all duration-300"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-md text-sm border border-emerald-100 font-mono">
                            {pcb.orderID}
                          </span>
                          {pcb.isDelivered ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border bg-emerald-100/50 text-emerald-700 border-emerald-200">
                              <FaCheckCircle size={10} /> Delivered
                            </span>
                          ) : (
                            <button
                              onClick={() => handleShowModal(pcb.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 shadow-sm"
                            >
                              <FaTruck size={12} />{" "}
                              {language === "thai" ? "ยืนยันจัดส่ง" : "Confirm"}
                            </button>
                          )}
                        </div>

                        <div className="flex flex-col gap-1 mt-1">
                          <div className="font-bold text-slate-800 text-lg leading-snug">
                            {pcb.projectname}
                          </div>
                          <div className="text-slate-500 text-xs flex justify-between tracking-tight">
                            <span>
                              วันที่: {formatDate(pcb.created_at, language)}
                            </span>
                            <span className="font-semibold text-slate-700 bg-slate-100 px-2 rounded">
                              Qty: {pcb.pcb_qty}
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-3 mt-1 border-t border-slate-100 border-dashed">
                          <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                            ยอดรวม
                          </div>
                          <div className="font-bold text-lg text-emerald-600">
                            {formatCurrency(pcb.confirmed_price)}
                          </div>
                        </div>

                        <div className="flex gap-2 pt-3 mt-1 border-t border-slate-100">
                          <Link
                            to={`/copypcb/${pcb.id}`}
                            className="flex-1 flex items-center justify-center gap-2 bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm"
                          >
                            <FaEye size={16} /> {t.Action}
                          </Link>
                          {pcb.copypcb_zip && (
                            <button
                              onClick={() => {
                                const filename = pcb.copypcb_zip?.split(/[/\\]/).pop();
                                window.open(`${BASE_URL}/copypcbZipFiles/${filename}`, "_blank");
                              }}
                              className="w-10 h-10 flex items-center justify-center bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-sm font-bold transition-all shadow-sm"
                              title="Download ZIP"
                            >
                              <FaDownload size={14} />
                            </button>
                          )}
                          <button
                            onClick={() =>
                              navigate(`/reordercopypcb/${pcb.orderID}/set`)
                            }
                            className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm"
                          >
                            <FaSyncAlt size={14} />{" "}
                            {language === "thai" ? "สั่งซ้ำ" : "Reorder"}
                          </button>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="py-16 text-center text-slate-400 absolute w-full left-0 right-0"
                    >
                      <FaBox className="mx-auto mb-3 opacity-20" size={36} />
                      <p className="text-sm">{t.Empty}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </>
          )}
        </div>

        {/* Delivery Confirmation Modal */}
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                onClick={() => setShowModal(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden border border-slate-100"
              >
                <div className="p-8">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner mx-auto">
                    <FaTruck size={32} />
                  </div>
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-black text-slate-900 mb-2">
                      {t.ConfirmModalTitle}
                    </h3>
                    <p className="text-slate-500 font-medium">
                      ยืนยันว่าโปรเจกต์นี้ได้รับการเลือกจัดส่งเรียบร้อยแล้ว
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="group">
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 group-focus-within:text-emerald-500 transition-colors uppercase">
                        {t.TransferNumber}
                      </label>
                      <input
                        type="text"
                        value={transferedNumber}
                        onChange={(e) => setTransferedNumber(e.target.value)}
                        placeholder={t.TransferPlaceholder}
                        className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border-2 border-slate-200 text-slate-800 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all duration-300 font-bold"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 p-8 pt-0">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-slate-100 text-slate-700 font-bold py-4 rounded-xl hover:bg-slate-200 transition-all active:scale-95"
                  >
                    {t.CancelBtn}
                  </button>
                  <button
                    onClick={handleConfirmDelivery}
                    disabled={loadingUpdate}
                    className="flex-1 bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
                  >
                    {t.ConfirmBtn}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CopyPCBOrderListScreen;
