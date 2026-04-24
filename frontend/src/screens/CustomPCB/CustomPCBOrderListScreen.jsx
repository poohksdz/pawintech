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
  FaArrowRight,
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
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString, lang) => {
  if (!dateString) return "-";
  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };
  return new Date(dateString).toLocaleDateString(
    lang === "thai" ? "th-TH" : "en-GB",
    options,
  );
};

const getStatusBadge = (status, lang) => {
  const configs = {
    pending: {
      bg: "bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950/50 dark:to-amber-900/30",
      text: "text-amber-700 dark:text-amber-400",
      border: "border-amber-200/50 dark:border-amber-800/50",
      icon: <FaClock size={10} />,
      label: lang === "thai" ? "รอตรวจสอบ" : "Pending",
    },
    accepted: {
      bg: "bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/30",
      text: "text-emerald-700 dark:text-emerald-400",
      border: "border-emerald-200/50 dark:border-emerald-800/50",
      icon: <FaCheckCircle size={10} />,
      label: lang === "thai" ? "อนุมัติแล้ว" : "Approved",
    },
    paid: {
      bg: "bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30",
      text: "text-blue-700 dark:text-blue-400",
      border: "border-blue-200/50 dark:border-blue-800/50",
      icon: <FaMoneyBillWave size={10} />,
      label: lang === "thai" ? "ชำระเงินแล้ว" : "Paid",
    },
    rejected: {
      bg: "bg-gradient-to-r from-rose-50 to-rose-100 dark:from-rose-950/50 dark:to-rose-900/30",
      text: "text-rose-700 dark:text-rose-400",
      border: "border-rose-200/50 dark:border-rose-800/50",
      icon: <FaTimesCircle size={10} />,
      label: lang === "thai" ? "ปฏิเสธ" : "Rejected",
    },
  };
  return configs[status] || configs.pending;
};

const StatusBadge = ({ status, lang }) => {
  const config = getStatusBadge(status, lang);
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wide rounded-lg border ${config.bg} ${config.text} ${config.border}`}
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
  const [hoveredRow, setHoveredRow] = useState(null);

  const t = {
    en: {
      Title: "Custom PCB Command Center",
      Subtitle: "Manufacturing Pipeline Overview",
      Search: "Search by ID or Project name...",
      TotalOrders: "Total Orders",
      TotalRevenue: "Estimated Revenue",
      Qty: "Quantity",
      Action: "Actions",
      Empty: "No orders found",
      EmptyDesc: "Try adjusting your search criteria",
      Headers: {
        num: "#",
        id: "Order ID",
        project: "Project",
        date: "Order Date",
        status: "Status",
        qty: "Qty",
        total: "Total",
        action: "Actions",
      },
    },
    thai: {
      Title: "ศูนย์ควบคุม Custom PCB",
      Subtitle: "ภาพรวมสายการผลิต",
      Search: "ค้นหาด้วย ID หรือชื่อโปรเจกต์...",
      TotalOrders: "ออเดอร์ทั้งหมด",
      TotalRevenue: "ยอดระเมินรวม",
      Qty: "จำนวน",
      Action: "จัดการ",
      Empty: "ไม่พบรายการ",
      EmptyDesc: "ลองปรับเงื่อนไขการค้นหาของคุณ",
      Headers: {
        num: "#",
        id: "รหัสออเดอร์",
        project: "โปรเจกต์",
        date: "วันที่สั่ง",
        status: "สถานะ",
        qty: "จำนวน",
        total: "ยอดรวม",
        action: "ตัวเลือก",
      },
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
      pending: orders.filter(o => o.status === "pending").length,
      approved: orders.filter(o => o.status === "accepted").length,
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

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-black dark:to-zinc-900">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl p-4 md:p-8">
        <Message variant="danger">
          {error?.data?.message || error.message || "Error occurred"}
        </Message>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-black dark:via-zinc-950 dark:to-black p-4 md:p-6 lg:p-12 font-sans selection:bg-indigo-100 selection:text-indigo-900 transition-colors duration-500">
      <Meta title={t.Title} />

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800;900&family=Prompt:wght@400;500;600;700;800;900&display=swap');
        .font-display { font-family: 'Outfit', 'Prompt', sans-serif; }
        .font-sans { font-family: 'Inter', 'Prompt', sans-serif; }

        .glass-header {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.8);
          box-shadow: 0 8px 32px -12px rgba(0, 0, 0, 0.08);
        }
        .dark .glass-header {
          background: rgba(24, 24, 27, 0.6);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(39, 39, 42, 0.6);
          box-shadow: 0 8px 32px -12px rgba(0, 0, 0, 0.4);
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.6);
          box-shadow: 0 4px 24px -8px rgba(0, 0, 0, 0.06);
        }
        .dark .glass-card {
          background: rgba(24, 24, 27, 0.5);
          border: 1px solid rgba(39, 39, 42, 0.5);
          box-shadow: 0 4px 24px -8px rgba(0, 0, 0, 0.3);
        }
        .ls-widest { letter-spacing: 0.2em; }
        .ls-loose { letter-spacing: 0.05em; }
        .btn-action {
          display: flex;
          height: 2.5rem;
          width: 2.5rem;
          align-items: center;
          justify-content: center;
          border-radius: 1rem;
          background: white;
          box-shadow: 0 2px 8px -2px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(0, 0, 0, 0.05);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          position: relative;
          z-index: 10;
        }
        .dark .btn-action {
          background: #09090b;
          border: 1px solid #27272a;
          box-shadow: 0 2px 8px -2px rgba(0, 0, 0, 0.3);
        }
        .btn-action:hover {
          box-shadow: 0 8px 20px -8px rgba(0, 0, 0, 0.15);
          transform: translateY(-2px) scale(1.05);
        }
        .btn-action:active {
          transform: scale(0.95);
        }
        .stat-card {
          background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%);
          border: 1px solid rgba(255, 255, 255, 0.8);
          box-shadow: 0 4px 16px -4px rgba(0, 0, 0, 0.08);
        }
        .dark .stat-card {
          background: linear-gradient(135deg, rgba(39,39,42,0.9) 0%, rgba(24,24,27,0.7) 100%);
          border: 1px solid rgba(39, 39, 42, 0.6);
          box-shadow: 0 4px 16px -4px rgba(0, 0, 0, 0.3);
        }
        .stat-card-accent {
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          border: 1px solid rgba(99, 102, 241, 0.5);
          box-shadow: 0 4px 16px -4px rgba(99, 102, 241, 0.4);
        }
        .dark .stat-card-accent {
          background: linear-gradient(135deg, #4338ca 0%, #3730a3 100%);
          border: 1px solid rgba(99, 102, 241, 0.3);
          box-shadow: 0 4px 16px -4px rgba(99, 102, 241, 0.3);
        }
        .gradient-icon {
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          box-shadow: 0 4px 12px -2px rgba(99, 102, 241, 0.4);
        }
        .dark .gradient-icon {
          background: linear-gradient(135deg, #818cf8 0%, #6366f1 100%);
          box-shadow: 0 4px 12px -2px rgba(129, 140, 248, 0.4);
        }
        .search-input {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(0, 0, 0, 0.06);
          box-shadow: 0 4px 16px -4px rgba(0, 0, 0, 0.06);
        }
        .dark .search-input {
          background: rgba(24, 24, 27, 0.8);
          border: 1px solid rgba(39, 39, 42, 0.6);
          box-shadow: 0 4px 16px -4px rgba(0, 0, 0, 0.3);
        }
        .search-input:focus {
          background: white;
          border-color: rgba(99, 102, 241, 0.5);
          box-shadow: 0 4px 20px -4px rgba(99, 102, 241, 0.2);
        }
        .dark .search-input:focus {
          background: #09090b;
          border-color: rgba(99, 102, 241, 0.5);
        }
        .table-row-hover {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .table-row-hover:hover {
          background: rgba(99, 102, 241, 0.04);
        }
        .dark .table-row-hover:hover {
          background: rgba(99, 102, 241, 0.08);
        }
        .tab-active {
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: white;
          box-shadow: 0 4px 12px -2px rgba(99, 102, 241, 0.4);
        }
        .dark .tab-active {
          background: linear-gradient(135deg, #818cf8 0%, #6366f1 100%);
          box-shadow: 0 4px 12px -2px rgba(129, 140, 248, 0.4);
        }
        .empty-state {
          background: linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(248,250,252,0.4) 100%);
        }
        .dark .empty-state {
          background: linear-gradient(135deg, rgba(39,39,42,0.6) 0%, rgba(24,24,27,0.4) 100%);
        }
      ` }} />

      <div className="max-w-7xl mx-auto">
        {/* --- HEADER DASHBOARD --- */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="glass-header mb-10 flex flex-col items-center justify-between gap-6 rounded-[2rem] p-6 md:p-8 lg:flex-row md:p-10"
        >
          <div className="flex flex-col items-center gap-4 md:gap-6 md:flex-row md:items-start">
            <div className="gradient-icon flex h-16 w-16 items-center justify-center rounded-[1.25rem] text-white">
              <PiCircuitryFill size={32} />
            </div>
            <div className="text-center md:text-left">
              <h1 className="font-display text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                {t.Title}
              </h1>
              <p className="mt-1 text-[11px] font-semibold uppercase ls-widest text-slate-500 dark:text-slate-400">
                {t.Subtitle}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3 md:gap-4 lg:justify-end">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="stat-card rounded-2xl p-4 text-center min-w-[100px]"
            >
              <p className="text-[9px] font-bold uppercase ls-widest text-slate-400 mb-1">
                {t.TotalOrders}
              </p>
              <p className="font-display text-2xl font-black text-slate-900 dark:text-white">
                {stats.count}
              </p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="stat-card rounded-2xl p-4 text-center min-w-[100px]"
            >
              <p className="text-[9px] font-bold uppercase ls-widest text-amber-500 mb-1">
                รอตรวจสอบ
              </p>
              <p className="font-display text-2xl font-black text-amber-600 dark:text-amber-400">
                {stats.pending}
              </p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="stat-card rounded-2xl p-4 text-center min-w-[100px]"
            >
              <p className="text-[9px] font-bold uppercase ls-widest text-emerald-500 mb-1">
                อนุมัติแล้ว
              </p>
              <p className="font-display text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {stats.approved}
              </p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="stat-card-accent rounded-2xl p-4 text-center min-w-[120px] text-white"
            >
              <p className="text-[9px] font-bold uppercase ls-widest text-white/70 mb-1">
                {t.TotalRevenue}
              </p>
              <p className="font-display text-xl font-black text-white">
                {formatCurrency(stats.revenue)}
              </p>
            </motion.div>
          </div>
        </motion.header>

        {/* --- TOOLBAR --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
          className="mb-8 flex flex-col items-center justify-between gap-4 md:gap-6 md:flex-row"
        >
          {/* Status Tabs */}
          <div className="flex overflow-x-auto no-scrollbar w-full md:w-auto gap-2 p-1.5 bg-slate-100/50 dark:bg-zinc-900/50 rounded-2xl">
            {StatusTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterStatus(tab)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase ls-widest whitespace-nowrap transition-all ${
                  filterStatus === tab
                    ? "tab-active"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white/80 dark:hover:bg-zinc-800"
                }`}
              >
                {tab === "All" && language === "thai" ? "ทั้งหมด" : tab}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full max-w-lg">
            <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder={t.Search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input h-12 w-full rounded-xl px-12 py-3 text-sm font-medium tracking-tight text-slate-900 dark:text-white outline-none transition-all md:h-14 md:text-base"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <FaBox size={14} />
              </button>
            )}
          </div>
        </motion.div>

        {/* --- DATA LIST --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
          className="space-y-4"
        >
          {/* EMPTY STATE */}
          {filteredOrders.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="empty-state rounded-3xl p-16 text-center border border-dashed border-slate-200 dark:border-zinc-800"
            >
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100 dark:bg-zinc-900">
                <FaBox size={32} className="text-slate-300" />
              </div>
              <h3 className="mb-2 font-display text-xl font-bold text-slate-900 dark:text-white">
                {t.Empty}
              </h3>
              <p className="text-sm text-slate-500">{t.EmptyDesc}</p>
            </motion.div>
          )}

          {/* PC VIEW */}
          <div className="hidden lg:block overflow-hidden rounded-[1.5rem] glass-card">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-300 dark:border-zinc-600 bg-slate-50/80 dark:bg-zinc-900/50">
                  <th className="py-5 ps-8 text-[10px] font-bold uppercase ls-widest text-slate-500 dark:text-slate-400">
                    {t.Headers.num}
                  </th>
                  <th className="py-5 ps-4 text-[10px] font-bold uppercase ls-widest text-slate-500 dark:text-slate-400">
                    {t.Headers.id}
                  </th>
                  <th className="py-5 text-[10px] font-bold uppercase ls-widest text-slate-500 dark:text-slate-400">
                    {t.Headers.project}
                  </th>
                  <th className="py-5 text-[10px] font-bold uppercase ls-widest text-slate-500 dark:text-slate-400">
                    {t.Headers.date}
                  </th>
                  <th className="py-5 text-center text-[10px] font-bold uppercase ls-widest text-slate-500 dark:text-slate-400">
                    {t.Headers.status}
                  </th>
                  <th className="py-5 text-center text-[10px] font-bold uppercase ls-widest text-slate-500 dark:text-slate-400">
                    {t.Headers.qty}
                  </th>
                  <th className="py-5 text-right text-[10px] font-bold uppercase ls-widest text-slate-500 dark:text-slate-400 pe-8">
                    {t.Headers.total}
                  </th>
                  <th className="py-5 pe-8 text-right text-[10px] font-bold uppercase ls-widest text-slate-500 dark:text-slate-400">
                    {t.Headers.action}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-zinc-700">
                {filteredOrders.map((pcb, index) => (
                  <motion.tr
                    key={pcb.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    onMouseEnter={() => setHoveredRow(pcb.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    className="table-row-hover group border-b border-slate-200 dark:border-zinc-700 last:border-b-0"
                  >
                    <td className="py-6 ps-8 font-display text-sm font-bold text-slate-300 dark:text-zinc-700">
                      {String(index + 1).padStart(2, "0")}
                    </td>
                    <td className="py-6 ps-4">
                      <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1.5 rounded-lg border border-indigo-200/50 dark:border-indigo-800/50">
                        {pcb.orderID}
                      </span>
                    </td>
                    <td className="py-6">
                      <div
                        className="font-display text-base font-bold tracking-tight text-slate-900 dark:text-white max-w-[200px] truncate"
                        title={pcb.projectname}
                      >
                        {pcb.projectname}
                      </div>
                    </td>
                    <td className="py-6">
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase ls-loose">
                        {formatDate(pcb.created_at, language)}
                      </span>
                    </td>
                    <td className="py-6 text-center">
                      <StatusBadge status={pcb.status} lang={language} />
                    </td>
                    <td className="py-6 text-center">
                      <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-zinc-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700">
                        {pcb.pcb_qty}
                      </span>
                    </td>
                    <td className="py-6 pe-8 text-right">
                      <span className="font-mono text-base font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(pcb.confirmed_price)}
                      </span>
                    </td>
                    <td className="py-6 pe-8 text-right">
                      <div className="flex justify-end gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setPCBToDelete(pcb.id)}
                          className="btn-action text-rose-500"
                          title="ลบ"
                        >
                          <FaTrash size={16} />
                        </motion.button>
                        {pcb.dirgram_zip && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                              const filename = pcb.dirgram_zip?.split(/[/\\]/).pop();
                              window.open(`${BASE_URL}/custompcbZipFiles/${filename}`, "_blank");
                            }}
                            className="btn-action text-emerald-500"
                            title="Download ZIP"
                          >
                            <FaDownload size={16} />
                          </motion.button>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          as={Link}
                          to={`/admin/ordercustompcbEditlist/${pcb.id}/edit`}
                          className="btn-action text-indigo-500"
                          title="แก้ไข"
                        >
                          <FaArrowRight size={16} />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE VIEW */}
          <div className="grid grid-cols-1 gap-4 lg:hidden">
            {filteredOrders.map((pcb, index) => (
              <motion.div
                key={pcb.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="glass-card flex flex-col gap-4 rounded-2xl p-5 transition-all duration-300 border border-slate-200 dark:border-zinc-700"
              >
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1 rounded-lg border border-indigo-200/50 dark:border-indigo-800/50">
                      {pcb.orderID}
                    </span>
                    <h3 className="mt-2 font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                      {pcb.projectname}
                    </h3>
                  </div>
                  <StatusBadge status={pcb.status} lang={language} />
                </div>

                <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50/80 dark:bg-zinc-900/50 px-4 py-3">
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="text-[10px] font-medium uppercase ls-loose">
                      {formatDate(pcb.created_at, language)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      {t.Qty}:
                    </span>
                    <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-300">
                      {pcb.pcb_qty}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-zinc-700">
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase ls-widest text-slate-400 mb-1">
                      {t.TotalRevenue}
                    </p>
                    <p className="font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(pcb.confirmed_price)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setPCBToDelete(pcb.id)}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-500 border border-rose-200/50 dark:border-rose-800/50"
                    >
                      <FaTrash size={16} />
                    </motion.button>
                    {pcb.dirgram_zip && (
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          const filename = pcb.dirgram_zip?.split(/[/\\]/).pop();
                          window.open(`${BASE_URL}/custompcbZipFiles/${filename}`, "_blank");
                        }}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-500 border border-emerald-200/50 dark:border-emerald-800/50"
                      >
                        <FaDownload size={16} />
                      </motion.button>
                    )}
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      as={Link}
                      to={`/admin/ordercustompcbEditlist/${pcb.id}/edit`}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 border border-indigo-200/50 dark:border-indigo-800/50"
                    >
                      <FaArrowRight size={16} />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <footer className="mt-16 flex items-center justify-center gap-4 py-8 opacity-30">
          <div className="h-px w-8 bg-slate-400" />
          <span className="text-[10px] font-bold uppercase ls-widest tracking-[0.3em] text-slate-600 dark:text-slate-400">
            Custom PCB Management System v1.4
          </span>
          <div className="h-px w-8 bg-slate-400" />
        </footer>
      </div>

      {/* Custom Delete Modal */}
      <AnimatePresence>
        {pcbToDelete && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
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
              className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden border border-slate-100 dark:border-zinc-800 p-6 md:p-8 text-center"
            >
              <div className="w-16 h-16 bg-rose-100 dark:bg-rose-950/50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaTrash size={28} />
              </div>
              <h3 className="text-xl font-display font-bold mb-2 text-slate-900 dark:text-white">
                {language === "thai" ? "ยืนยันการลบ" : "Confirm Delete"}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                {language === "thai"
                  ? "คุณแน่ใจหรือไม่ที่จะลบออเดอร์นี้? ข้อมูลจะถูกลบทิ้งอย่างถาวร"
                  : "Are you sure you want to delete this order? This action cannot be undone."}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setPCBToDelete(null)}
                  className="flex-1 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-xl hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  {language === "thai" ? "ยกเลิก" : "Cancel"}
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={loadingDelete}
                  className="flex-1 bg-rose-500 text-white font-bold py-3 rounded-xl hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/30 disabled:opacity-70"
                >
                  {language === "thai" ? "ลบข้อมูล" : "Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomPCBOrderListScreen;
