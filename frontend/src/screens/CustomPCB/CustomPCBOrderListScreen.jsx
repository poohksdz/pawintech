import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import {
  FaSearch,
  FaClipboardList,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaMoneyBillWave,
  FaTrash,
  FaEdit,
  FaBox,
  FaDownload,
} from "react-icons/fa";
import { BASE_URL } from "../../constants";
import { PiCircuitryFill, PiCurrencyCircleDollarFill } from "react-icons/pi";

import Loader from "../../components/Loader";
import Message from "../../components/Message";
import Meta from "../../components/Meta";
import {
  useGetAllCustomPCBsQuery,
  useDeleteCustomPCBMutation,
} from "../../slices/custompcbApiSlice";

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

const getStatusBadge = (status, lang) => {
  const configs = {
    pending: {
      bg: "bg-amber-100/50",
      text: "text-amber-700",
      border: "border-amber-200",
      icon: <FaClock size={12} />,
      label: lang === "thai" ? "รอตรวจสอบ" : "Pending",
    },
    accepted: {
      bg: "bg-emerald-100/50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      icon: <FaCheckCircle size={12} />,
      label: lang === "thai" ? "อนุมัติแล้ว" : "Approved",
    },
    paid: {
      bg: "bg-blue-100/50",
      text: "text-blue-700",
      border: "border-blue-200",
      icon: <FaMoneyBillWave size={12} />,
      label: lang === "thai" ? "ชำระเงินแล้ว" : "Paid",
    },
    rejected: {
      bg: "bg-rose-100/50",
      text: "text-rose-700",
      border: "border-rose-200",
      icon: <FaTimesCircle size={12} />,
      label: lang === "thai" ? "ปฏิเสธ" : "Rejected",
    },
  };
  return configs[status] || configs.pending;
};

const StatusBadge = ({ status, lang }) => {
  const config = getStatusBadge(status, lang);
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${config.bg} ${config.text} ${config.border}`}
    >
      {config.icon} {config.label}
    </span>
  );
};

const CustomPCBOrderListScreen = () => {
  const {
    data: rawData,
    isLoading,
    error,
    refetch,
  } = useGetAllCustomPCBsQuery();
  const [deleteCustomPCB, { isLoading: loadingDelete }] =
    useDeleteCustomPCBMutation();
  const { language } = useSelector((state) => state.language);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [pcbToDelete, setPCBToDelete] = useState(null);

  const t = {
    en: {
      Title: "Custom PCB Management",
      Subtitle: "Overview of all custom PCB orders",
      OrdersLbl: "Orders",
      Search: "Search by ID or Project",
      Filter: "Status",
      TotalOrders: "Total Orders",
      TotalRevenue: "Estimated Revenue",
      Qty: "Qty",
      Action: "Actions",
      Empty: "No orders found",
    },
    thai: {
      Title: "คำสั่งซื้อ Custom PCB",
      Subtitle: "จัดการรายการสั่งผลิต Custom PCB กัดปริ้น",
      OrdersLbl: "คำสั่งซื้อ",
      Search: "ค้นหาด้วย ID หรือ ชื่อโปรเจกต์",
      Filter: "สถานะ",
      TotalOrders: "ออเดอร์ทั้งหมด",
      TotalRevenue: "ยอดระเมินรวม",
      Qty: "จำนวน",
      Action: "จัดการ",
      Empty: "ไม่พบรายการคำสั่งซื้อ",
    },
  }[language || "en"];

  // Data Processing
  const filteredOrders = useMemo(() => {
    const orders =
      rawData?.data || (Array.isArray(rawData) ? rawData : []) || [];
    if (!Array.isArray(orders)) return [];

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
      const statusMap = {
        Pending: "pending",
        Approved: "accepted",
        Paid: "paid",
        Rejected: "rejected",
      };
      if (statusMap[filterStatus]) {
        tempOrders = tempOrders.filter(
          (o) => o.status === statusMap[filterStatus],
        );
      }
    }

    return tempOrders;
  }, [rawData, searchTerm, filterStatus]);

  const stats = useMemo(() => {
    const orders =
      rawData?.data || (Array.isArray(rawData) ? rawData : []) || [];
    return {
      count: orders.length,
      revenue: orders.reduce(
        (acc, item) => acc + (parseFloat(item.confirmed_price) || 0),
        0,
      ),
    };
  }, [rawData]);

  // Handlers
  const confirmDelete = async () => {
    if (!pcbToDelete) return;
    try {
      await deleteCustomPCB(pcbToDelete).unwrap();
      refetch();
      setPCBToDelete(null);
      toast.success(
        language === "thai" ? "ลบข้อมูลสำเร็จ" : "Deleted successfully",
      );
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const StatusTabs = ["All", "Pending", "Approved", "Paid", "Rejected"];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Meta title={t.Title} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-slate-200 text-indigo-600 shadow-sm shrink-0">
              <PiCircuitryFill size={28} />
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
          <div className="bg-indigo-600 rounded-2xl p-6 border border-indigo-500 shadow-md relative overflow-hidden group flex items-center justify-between text-white">
            <div>
              <p className="text-sm font-medium text-indigo-100 mb-1 relative z-10">
                {t.TotalRevenue}
              </p>
              <h3 className="text-3xl font-bold relative z-10">
                {formatCurrency(stats.revenue)}
              </h3>
            </div>
            <div className="w-16 h-16 bg-white/10 text-white rounded-2xl flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform backdrop-blur-sm">
              <PiCurrencyCircleDollarFill size={36} />
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-500">
              <FaMoneyBillWave size={140} />
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
                      ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/50"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
                      }`}
                  >
                    {tab === "All" && language === "thai" ? "ทั้งหมด" : tab}
                  </button>
                ))}
              </div>

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
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-slate-700 placeholder:text-slate-400"
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
                        สถานะ
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
                            className="hover:bg-indigo-50/30 transition-colors group"
                          >
                            <td className="px-6 py-4 text-center text-slate-500 font-semibold border-r border-slate-200">
                              {index + 1}
                            </td>
                            <td className="px-6 py-4 border-r border-slate-200">
                              <span className="font-mono text-indigo-600 font-bold bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200 shadow-sm">
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
                              <StatusBadge
                                status={pcb.status}
                                lang={language}
                              />
                            </td>
                            <td className="px-6 py-4 text-center border-r border-slate-200 align-middle">
                              <span className="font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded inline-block min-w-[2rem] border border-slate-300 shadow-sm">
                                {pcb.pcb_qty}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-emerald-600 border-r border-slate-200 text-base">
                              {formatCurrency(pcb.confirmed_price)}
                            </td>
                            <td className="px-6 py-4 align-middle">
                              <div className="flex items-center justify-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                <Link
                                  to={`/admin/ordercustompcbEditlist/${pcb.id}/edit`}
                                  className="w-8 h-8 flex items-center justify-center text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-200 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                                  title="แก้ไข"
                                >
                                  <FaEdit />
                                </Link>
                                {pcb.dirgram_zip && (
                                  <button
                                    onClick={() => {
                                      const filename = pcb.dirgram_zip?.split(/[/\\]/).pop();
                                      window.open(`${BASE_URL}/custompcbZipFiles/${filename}`, "_blank");
                                    }}
                                    className="w-8 h-8 flex items-center justify-center text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-200 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                                    title="Download ZIP"
                                  >
                                    <FaDownload size={12} />
                                  </button>
                                )}
                                <button
                                  disabled={loadingDelete}
                                  onClick={() => setPCBToDelete(pcb.id)}
                                  className="w-8 h-8 flex items-center justify-center text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200 shadow-[0_1px_2px_rgba(0,0,0,0.02)] disabled:opacity-50"
                                  title="ลบ"
                                >
                                  <FaTrash />
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
                        {/* Row 1: ID and Status */}
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-indigo-600 font-bold bg-indigo-50 px-2.5 py-1 rounded-md text-sm border border-indigo-100">
                            {pcb.orderID}
                          </span>
                          <StatusBadge status={pcb.status} lang={language} />
                        </div>

                        {/* Row 2: Project Info */}
                        <div className="flex flex-col gap-1 mt-1">
                          <div className="font-bold text-slate-800 text-lg">
                            {pcb.projectname}
                          </div>
                          <div className="text-slate-500 text-xs flex justify-between">
                            <span>
                              สั่งซื้อ: {formatDate(pcb.created_at, language)}
                            </span>
                            <span className="font-semibold text-slate-700">
                              จำนวน: {pcb.pcb_qty}
                            </span>
                          </div>
                        </div>

                        {/* Row 3: Price */}
                        <div className="flex justify-between items-center pt-3 mt-1 border-t border-slate-100 border-dashed">
                          <div className="text-slate-500 text-xs font-semibold">
                            ยอดประเมิน
                          </div>
                          <div className="font-bold text-lg text-emerald-600">
                            {formatCurrency(pcb.confirmed_price)}
                          </div>
                        </div>

                        {/* Row 4: Actions */}
                        <div className="flex gap-2 pt-3 mt-1 border-t border-slate-100">
                          <Link
                            to={`/admin/ordercustompcbEditlist/${pcb.id}/edit`}
                            className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 py-2 rounded-xl text-sm font-bold transition-all shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                          >
                            <FaEdit /> แก้ไข
                          </Link>
                          {pcb.dirgram_zip && (
                            <button
                              onClick={() => {
                                const filename = pcb.dirgram_zip?.split(/[/\\]/).pop();
                                window.open(`${BASE_URL}/custompcbZipFiles/${filename}`, "_blank");
                              }}
                              className="w-10 h-10 flex items-center justify-center bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-sm font-bold transition-all shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                              title="Download ZIP"
                            >
                              <FaDownload size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => setPCBToDelete(pcb.id)}
                            disabled={loadingDelete}
                            className="flex-1 flex items-center justify-center gap-2 bg-white text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 py-2 rounded-xl text-sm font-bold transition-all shadow-[0_1px_2px_rgba(0,0,0,0.05)] disabled:opacity-50"
                          >
                            <FaTrash /> ลบ
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

        {/* Custom Delete Modal */}
        <AnimatePresence>
          {pcbToDelete && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                onClick={() => setPCBToDelete(null)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-sm relative z-10 overflow-hidden border border-slate-100 p-6 text-center text-slate-800"
              >
                <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaTrash size={28} />
                </div>
                <h3 className="text-xl font-bold mb-2">ยืนยันการลบออเดอร์</h3>
                <p className="text-sm text-slate-500 mb-6">
                  คุณแน่ใจหรือไม่ที่จะลบออเดอร์นี้?
                  ข้อมูลจะถูกลบทิ้งอย่างถาวรและไม่สามารถกู้คืนได้
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPCBToDelete(null)}
                    className="flex-1 bg-slate-100 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={loadingDelete}
                    className="flex-1 bg-rose-600 text-white font-bold py-3 rounded-xl hover:bg-rose-700 transition-colors shadow-sm disabled:opacity-70"
                  >
                    ลบข้อมูล
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

export default CustomPCBOrderListScreen;
