import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// --- Icons ---
import {
  FaCheck,
  FaSearch,
  FaIndustry,
  FaTruck,
  FaEye,
  FaCalendarAlt,
  FaLayerGroup,
  FaCheckCircle,
  FaDownload,
  FaArrowRight,
  FaBox,
} from "react-icons/fa";
import { PiCircuitryFill, PiCurrencyCircleDollarBold } from "react-icons/pi";

import { useGetAllOrderPCBsQuery } from "../../slices/orderpcbSlice";
import {
  useGetAllOrderPCBCartsQuery,
  useUpdateOrderpcbCartStatusMutation,
  useDeleteOrderpcbCartMutation
} from "../../slices/orderpcbCartApiSlice";
import Loader from "../../components/Loader";
import Message from "../../components/Message";
import { BASE_URL } from "../../constants";
import { toast } from "react-toastify";
import UnifiedPCBActionModal from "../../components/UnifiedPCBActionModal";
import { FaTrash } from "react-icons/fa";

// ==========================================
// 1. Helper Functions
// ==========================================
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString, language) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString(language === "thai" ? "th-TH" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ==========================================
// 2. Main Component
// ==========================================
const OrderPCBListScreen = () => {
  // --- Hooks & State ---
  const navigate = useNavigate();
  const { data: orderData, isLoading: loadingOrders, error: errorOrders, refetch: refetchOrders } = useGetAllOrderPCBsQuery();
  const { data: cartData, isLoading: loadingCarts, error: errorCarts, refetch: refetchCarts } = useGetAllOrderPCBCartsQuery();
  const [updateCartStatus, { isLoading: loadingUpdateCart }] = useUpdateOrderpcbCartStatusMutation();
  const [deleteCart, { isLoading: loadingDeleteCart }] = useDeleteOrderpcbCartMutation();

  const { language } = useSelector((state) => state.language);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [confirmType, setConfirmType] = useState(null); // 'review', 'manufacture', 'delivery'
  const [hoveredRow, setHoveredRow] = useState(null);

  // --- Handlers ---
  const handleShowModal = (item, type) => {
    setSelectedItem(item);
    setConfirmType(type);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedItem(null);
    setConfirmType(null);
  };

  // --- Filter ---
  const filteredOrders = useMemo(() => {
    const orders = orderData ? orderData.map(o => ({ ...o, itemType: 'ORDER' })) : [];
    const carts = cartData?.data ? cartData.data.map(c => ({
      ...c,
      itemType: 'CART',
      orderID: c.paymentComfirmID, // Map to match display
      total_amount_cost: c.confirmed_price || c.price || 0,
    })) : [];

    const combined = [...orders, ...carts].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at),
    );

    if (!searchTerm) return combined;

    const lowerTerm = searchTerm.toLowerCase();
    return combined.filter(
      (item) =>
        item.projectname?.toLowerCase().includes(lowerTerm) ||
        item.orderID?.toLowerCase().includes(lowerTerm),
    );
  }, [orderData, cartData, searchTerm]);

  // --- Stats ---
  const stats = useMemo(() => {
    if (!orderData)
      return {
        total: 0,
        pending: 0,
        manufacturing: 0,
        delivered: 0,
        revenue: 0,
      };

    return orderData.reduce(
      (acc, curr) => {
        acc.total++;

        const isOrderPaid = ["accepted", "paid"].includes(
          curr.status?.toLowerCase(),
        );
        if (
          isOrderPaid ||
          Number(curr.isManufacting) === 1 ||
          Number(curr.isDelivered) === 1
        ) {
          acc.revenue += Number(
            curr.quoted_price_to_customer || curr.total_amount_cost || 0,
          );
        }

        if (!curr.isManufacting) acc.pending++;
        else if (curr.isManufacting && !curr.isDelivered) acc.manufacturing++;
        else if (curr.isDelivered) acc.delivered++;

        return acc;
      },
      { total: 0, pending: 0, manufacturing: 0, delivered: 0, revenue: 0 },
    );
  }, [orderData]);

  // --- Text Resources ---
  const t = useMemo(
    () =>
      ({
        en: {
          Title: "PCB Command Center",
          Subtitle: "Manufacturing Pipeline Overview",
          BtnPrice: "Pricing Schema",
          Search: "Search by project name or order ID...",
          Stats: {
            total: "Total Orders",
            pending: "Awaiting Approval",
            manufacturing: "In Production",
            delivered: "Shipped",
          },
          Headers: {
            Project: "Project Details",
            Price: "Valuation",
            Process: "Workflow Status",
            Action: "Actions",
          },
          Status: {
            Pending: "Pending",
            Done: "Delivered",
            Locked: "Waiting",
            Manufacturing: "Manufacturing",
          },
          Buttons: {
            Look: "View Details",
            ConfirmDelivery: "Confirm Delivery",
            ApproveProduction: "Approve Production",
          },
          Empty: "No orders found",
          EmptyDesc: "Try adjusting your search criteria",
        },
        thai: {
          Title: "ศูนย์ควบคุม PCB",
          Subtitle: "ภาพรวมสายการผลิต",
          BtnPrice: "ตั้งราคากลาง",
          Search: "ค้นหาด้วยชื่อโปรเจกต์หรือรหัสคำสั่งซื้อ...",
          Stats: {
            total: "คำสั่งซื้อทั้งหมด",
            pending: "รออนุมัติ",
            manufacturing: "กำลังผลิต",
            delivered: "จัดส่งแล้ว",
          },
          Headers: {
            Project: "รายละเอียดโปรเจกต์",
            Price: "มูลค่า",
            Process: "สถานะการผลิต",
            Action: "ตัวเลือก",
          },
          Status: {
            Pending: "รอดำเนินการ",
            Done: "ส่งแล้ว",
            Locked: "รอผลิต",
            Manufacturing: "กำลังผลิต",
          },
          Buttons: {
            Look: "ดูรายละเอียด",
            ConfirmDelivery: "ยืนนั้นการส่ง",
            ApproveProduction: "อนุมัติการผลิต",
          },
          Empty: "ไม่พบรายการ",
          EmptyDesc: "ลองปรับเงื่อนไขการค้นหาของคุณ",
        },
      })[language || "en"],
    [language],
  );

  // --- Handlers ---
  const handleShowCartModal = (cart) => {
    handleShowModal(cart, "review");
  };

  const handleDeleteCart = async (id) => {
    if (window.confirm("Are you sure you want to delete this cart request?")) {
      try {
        await deleteCart(id).unwrap();
        toast.success("Request deleted");
        refetchCarts();
      } catch (err) {
        toast.error(err?.data?.message || err.error);
      }
    }
  };

  // --- Render Early Returns ---
  if (loadingOrders || loadingCarts) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-black dark:to-zinc-900 transition-colors duration-500">
        <Loader />
      </div>
    );
  }

  if (errorOrders || errorCarts) {
    return (
      <div className="mx-auto max-w-2xl p-4 md:p-8">
        <Message variant="danger">
          {(errorOrders?.data?.message || errorOrders?.error) || (errorCarts?.data?.message || errorCarts?.error)}
        </Message>
      </div>
    );
  }

  // --- Main Render ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-black dark:via-zinc-950 dark:to-black p-4 md:p-6 font-sans selection:bg-blue-100 selection:text-blue-900 md:p-8 lg:p-12 transition-colors duration-500">
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
                .status-badge {
                  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .status-badge:hover {
                  transform: scale(1.05);
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
                  border-color: rgba(59, 130, 246, 0.5);
                  box-shadow: 0 4px 20px -4px rgba(59, 130, 246, 0.2);
                }
                .dark .search-input:focus {
                  background: #09090b;
                  border-color: rgba(59, 130, 246, 0.5);
                }
                .gradient-icon {
                  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                  box-shadow: 0 4px 12px -2px rgba(30, 41, 59, 0.4);
                }
                .dark .gradient-icon {
                  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                  box-shadow: 0 4px 12px -2px rgba(59, 130, 246, 0.4);
                }
                .table-row-hover {
                  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .table-row-hover:hover {
                  background: rgba(59, 130, 246, 0.04);
                }
                .dark .table-row-hover:hover {
                  background: rgba(59, 130, 246, 0.08);
                }
                .table-divider {
                  border-bottom: 1px solid #e2e8f0;
                }
                .dark .table-divider {
                  border-bottom: 1px solid #27272a;
                }
                .empty-state {
                  background: linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(248,250,252,0.4) 100%);
                }
                .dark .empty-state {
                  background: linear-gradient(135deg, rgba(39,39,42,0.6) 0%, rgba(24,24,27,0.4) 100%);
                }
            ` }} />

      <div className="mx-auto max-w-7xl">
        {/* --- HEADER DASHBOARD --- */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="glass-header mb-10 flex flex-col items-center justify-between gap-6 rounded-[2rem] p-6 md:p-8 lg:flex-row md:p-10"
        >
          <div className="flex flex-col items-center gap-4 md:gap-6 md:flex-row md:items-start">
            <div className="gradient-icon flex h-16 w-16 items-center justify-center rounded-[1.25rem] text-blue-400 dark:text-white">
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
                {t.Stats.total}
              </p>
              <p className="font-display text-2xl font-black text-slate-900 dark:text-white">
                {stats.total}
              </p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="stat-card rounded-2xl p-4 text-center min-w-[100px]"
            >
              <p className="text-[9px] font-bold uppercase ls-widest text-amber-500 mb-1">
                {t.Stats.pending}
              </p>
              <p className="font-display text-2xl font-black text-amber-600 dark:text-amber-400">
                {stats.pending}
              </p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="stat-card rounded-2xl p-4 text-center min-w-[100px]"
            >
              <p className="text-[9px] font-bold uppercase ls-widest text-blue-500 mb-1">
                {t.Stats.manufacturing}
              </p>
              <p className="font-display text-2xl font-black text-blue-600 dark:text-blue-400">
                {stats.manufacturing}
              </p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="stat-card rounded-2xl p-4 text-center min-w-[100px]"
            >
              <p className="text-[9px] font-bold uppercase ls-widest text-emerald-500 mb-1">
                {t.Stats.delivered}
              </p>
              <p className="font-display text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {stats.delivered}
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

          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/admin/orderpcbeditlist")}
            className="flex h-12 items-center gap-3 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-6 font-display text-xs font-bold uppercase ls-widest text-white shadow-lg shadow-slate-900/20 hover:shadow-xl hover:shadow-slate-900/30 transition-all dark:from-blue-600 dark:to-blue-700 dark:shadow-blue-900/30"
          >
            <PiCurrencyCircleDollarBold size={18} className="text-blue-400" />
            {t.BtnPrice}
          </motion.button>
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
                <FaLayerGroup size={32} className="text-slate-300" />
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
                    #
                  </th>
                  <th className="py-5 ps-4 text-[10px] font-bold uppercase ls-widest text-slate-500 dark:text-slate-400">
                    {t.Headers.Project}
                  </th>
                  <th className="py-5 text-[10px] font-bold uppercase ls-widest text-slate-500 dark:text-slate-400">
                    {t.Headers.Price}
                  </th>
                  <th className="py-5 text-center text-[10px] font-bold uppercase ls-widest text-slate-500 dark:text-slate-400">
                    {t.Headers.Process}
                  </th>
                  <th className="py-5 pe-8 text-right text-[10px] font-bold uppercase ls-widest text-slate-500 dark:text-slate-400">
                    {t.Headers.Action}
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
                      <div className="flex items-center gap-5">
                        <div className="glass-card flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl">
                          {pcb.pcb_image ? (
                            <img
                              src={`${BASE_URL}${pcb.pcb_image}`}
                              alt="PCB"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <FaLayerGroup
                              size={22}
                              className="text-slate-300"
                            />
                          )}
                        </div>
                        <div className="min-w-0 pr-4">
                          <h3 className="truncate font-display text-base font-bold tracking-tight text-slate-900 dark:text-white">
                            {pcb.projectname}
                          </h3>
                          <span className="mt-1 inline-block rounded-md bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                            {pcb.orderID}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-6">
                      <div className="flex flex-col">
                        <span className="font-mono text-base font-bold text-blue-600 dark:text-blue-400">
                          {formatCurrency(
                            pcb.quoted_price_to_customer ||
                            pcb.total_amount_cost,
                          )}
                        </span>
                        <span className="mt-1 text-[10px] font-medium uppercase ls-loose text-slate-400">
                          {formatDate(pcb.created_at, language)}
                        </span>
                      </div>
                    </td>
                    <td className="py-6 text-center">
                      <div className="flex items-center justify-center gap-3">
                        {pcb.itemType === 'ORDER' ? (
                          <>
                            <span
                              className={`status-badge inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[9px] font-bold uppercase ls-widest ${
                                Number(pcb.isManufacting) === 1
                                  ? "bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50"
                                  : "bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950/50 dark:to-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50"
                              }`}
                            >
                              {Number(pcb.isManufacting) === 1 ? (
                                <FaIndustry size={10} />
                              ) : (
                                <FaCheck size={10} />
                              )}
                              {Number(pcb.isManufacting) === 1
                                ? pcb.manufactureOrderNumber
                                : t.Status.Pending}
                            </span>
                            <div className="h-5 w-px bg-slate-200 dark:bg-zinc-700" />
                            <span
                              className={`status-badge inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[9px] font-bold uppercase ls-widest ${
                                Number(pcb.isDelivered) === 1
                                  ? "bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50"
                                  : Number(pcb.isManufacting) === 1
                                  ? "bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950/50 dark:to-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50"
                                  : "bg-slate-100 text-slate-400 dark:bg-zinc-800 dark:text-zinc-600 border border-slate-200/50 dark:border-zinc-700/50"
                              }`}
                            >
                              {Number(pcb.isDelivered) === 1 ? (
                                <FaCheck size={10} />
                              ) : (
                                <FaTruck size={10} />
                              )}
                              {Number(pcb.isDelivered) === 1
                                ? t.Status.Done
                                : t.Status.Locked}
                            </span>
                          </>
                        ) : (
                          <>
                            <span
                              className={`status-badge inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[9px] font-bold uppercase ls-widest ${
                                pcb.status === 'accepted'
                                  ? "bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50"
                                  : "bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950/50 dark:to-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50"
                              }`}
                            >
                              {pcb.status === 'accepted' ? (
                                <FaCheckCircle size={10} />
                              ) : (
                                <FaIndustry size={10} />
                              )}
                              {pcb.status === 'accepted' ? "Reviewed" : t.Status.Pending}
                            </span>
                            <div className="h-5 w-px bg-slate-200 dark:bg-zinc-700" />
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-[9px] font-bold uppercase ls-widest text-slate-400 dark:bg-zinc-800 dark:text-zinc-600 border border-slate-200/50 dark:border-zinc-700/50">
                              <FaTruck size={10} />
                              {t.Status.Locked}
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-6 pe-8 text-right">
                      <div className="flex justify-end gap-2">
                        {pcb.itemType === 'ORDER' ? (
                          <>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => {
                                if (Number(pcb.isManufacting) === 0)
                                  handleShowModal(pcb, "manufacture");
                              }}
                              className={`btn-action ${Number(pcb.isManufacting) === 1 ? "text-emerald-500" : "text-amber-500"}`}
                              title={t.Buttons.ApproveProduction}
                            >
                              {Number(pcb.isManufacting) === 1 ? (
                                <FaCheckCircle size={16} />
                              ) : (
                                <FaIndustry size={16} />
                              )}
                            </motion.button>

                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => {
                                if (
                                  Number(pcb.isManufacting) === 1 &&
                                  Number(pcb.isDelivered) === 0
                                )
                                  handleShowModal(pcb, "delivery");
                              }}
                              className={`btn-action ${Number(pcb.isDelivered) === 1 ? "text-emerald-500" : Number(pcb.isManufacting) === 1 ? "text-blue-500" : "text-slate-300"}`}
                              title={t.Buttons.ConfirmDelivery}
                            >
                              {Number(pcb.isDelivered) === 1 ? (
                                <FaCheck size={16} />
                              ) : (
                                <FaTruck size={16} />
                              )}
                            </motion.button>
                          </>
                        ) : (
                          <>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleShowCartModal(pcb)}
                              className={`btn-action ${pcb.status === 'accepted' ? "text-emerald-500" : "text-amber-500"}`}
                              title="Review Cart Request"
                            >
                              {pcb.status === 'accepted' ? <FaCheckCircle size={16} /> : <FaIndustry size={16} />}
                            </motion.button>

                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              disabled
                              className="btn-action text-slate-300 cursor-not-allowed"
                              title="Confirm Delivery (Waiting Payment)"
                            >
                              <FaTruck size={16} />
                            </motion.button>
                          </>
                        )}

                        {pcb.gerberZip && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                              const filename = pcb.gerberZip.split(/[/\\]/).pop();
                              window.open(`${BASE_URL}/api/gerber/download/${filename}`, "_blank");
                            }}
                            className="btn-action text-emerald-500"
                            title="Download Gerber ZIP"
                          >
                            <FaDownload size={16} />
                          </motion.button>
                        )}

                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => pcb.itemType === 'ORDER' ? navigate(`/orderpcbs/${pcb.id}`) : handleShowCartModal(pcb)}
                          className="btn-action text-blue-500"
                          title={t.Buttons.Look}
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
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="glass-card flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl">
                      {pcb.pcb_image ? (
                        <img
                          src={`${BASE_URL}${pcb.pcb_image}`}
                          alt="PCB"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <FaLayerGroup size={20} className="text-slate-300" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-500 dark:bg-zinc-800 dark:text-slate-400">
                        {pcb.orderID}
                      </span>
                      <h3 className="mt-1 truncate font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                        {pcb.projectname}
                      </h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-base font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(
                        pcb.quoted_price_to_customer || pcb.total_amount_cost,
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50/80 dark:bg-zinc-900/50 px-4 py-3">
                  {pcb.itemType === 'ORDER' ? (
                    <>
                      <span
                        className={`status-badge inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[8px] font-bold uppercase ${
                          Number(pcb.isManufacting) === 1
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400"
                        }`}
                      >
                        {Number(pcb.isManufacting) === 1 ? "Prod" : "Auth"}
                      </span>
                      <div className="h-4 w-px bg-slate-200 dark:bg-zinc-700" />
                      <span
                        className={`status-badge inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[8px] font-bold uppercase ${
                          Number(pcb.isDelivered) === 1
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400"
                            : Number(pcb.isManufacting) === 1
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400"
                            : "bg-slate-100 text-slate-400 dark:bg-zinc-800 dark:text-zinc-600"
                        }`}
                      >
                        {Number(pcb.isDelivered) === 1 ? "Done" : "Ship"}
                      </span>
                    </>
                  ) : (
                    <>
                      <span
                        className={`status-badge inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[8px] font-bold uppercase ${
                          pcb.status === 'accepted'
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400"
                        }`}
                      >
                        {pcb.status === 'accepted' ? "Done" : "Auth"}
                      </span>
                      <div className="h-4 w-px bg-slate-200 dark:bg-zinc-700" />
                      <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[8px] font-bold uppercase text-slate-400 dark:bg-zinc-800 dark:text-zinc-600">
                        Ship
                      </span>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-400">
                    <FaCalendarAlt size={11} />
                    <span className="text-[10px] font-medium uppercase ls-loose">
                      {formatDate(pcb.created_at, language)}
                    </span>
                  </div>
                  <div className="flex gap-3">
                    {pcb.itemType === 'ORDER' ? (
                      <>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            if (Number(pcb.isManufacting) === 0)
                              handleShowModal(pcb, "manufacture");
                          }}
                          className={`${Number(pcb.isManufacting) === 1 ? "text-emerald-500" : "text-amber-500"}`}
                        >
                          {Number(pcb.isManufacting) === 1 ? (
                            <FaCheckCircle size={18} />
                          ) : (
                            <FaIndustry size={18} />
                          )}
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            if (
                              Number(pcb.isManufacting) === 1 &&
                              Number(pcb.isDelivered) === 0
                            )
                              handleShowModal(pcb, "delivery");
                          }}
                          className={`${Number(pcb.isDelivered) === 1 ? "text-emerald-500" : Number(pcb.isManufacting) === 1 ? "text-blue-500" : "text-slate-300"}`}
                        >
                          {Number(pcb.isDelivered) === 1 ? (
                            <FaCheck size={18} />
                          ) : (
                            <FaTruck size={18} />
                          )}
                        </motion.button>
                      </>
                    ) : (
                      <>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleShowCartModal(pcb)}
                          className={`${pcb.status === 'accepted' ? "text-emerald-500" : "text-amber-500"}`}
                        >
                          {pcb.status === 'accepted' ? <FaCheckCircle size={18} /> : <FaIndustry size={18} />}
                        </motion.button>
                        <button className="text-slate-300">
                          <FaTruck size={18} />
                        </button>
                      </>
                    )}
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => pcb.itemType === 'ORDER' ? navigate(`/orderpcbs/${pcb.id}`) : handleShowCartModal(pcb)}
                      className="text-blue-500"
                    >
                      <FaEye size={18} />
                    </motion.button>
                    {pcb.gerberZip && (
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          const filename = pcb.gerberZip.split(/[/\\]/).pop();
                          window.open(`${BASE_URL}/api/gerber/download/${filename}`, "_blank");
                        }}
                        className="text-emerald-500"
                      >
                        <FaDownload size={18} />
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <footer className="mt-16 flex items-center justify-center gap-4 py-8 opacity-30">
          <div className="h-px w-8 bg-slate-400" />
          <span className="text-[10px] font-bold uppercase ls-widest tracking-[0.3em] text-slate-600 dark:text-slate-400">
            PCB Manufacturing System v1.4
          </span>
          <div className="h-px w-8 bg-slate-400" />
        </footer>
      </div>

      {/* Unified Action Modal */}
      <UnifiedPCBActionModal
        show={showModal}
        handleClose={handleCloseModal}
        item={selectedItem}
        type={confirmType}
        onConfirm={() => {
          refetchOrders();
          refetchCarts();
        }}
      />
    </div>
  );
};

// ==========================================
// 3. Sub-Components
// ==========================================
const StatItem = ({ label, value, color = "text-slate-950 dark:text-white" }) => (
  <div className="flex flex-col items-center md:items-end">
    <span className="text-[10px] font-black uppercase ls-widest text-slate-400">
      {label}
    </span>
    <span
      className={`font-display text-3xl font-black tracking-tighter ${color}`}
    >
      {value}
    </span>
  </div>
);

export default OrderPCBListScreen;
