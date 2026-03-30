import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

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
          Title: "Command Center",
          Subtitle: "Manufacturing Pipeline",
          BtnPrice: "Pricing Schema",
          Search: "Search system archive...",
          Stats: {
            total: "Total Assets",
            pending: "Waiting Confirmation",
            manufacturing: "In Production",
            delivered: "Dispatched",
          },
          Headers: {
            Project: "Project Entity",
            Price: "Valuation",
            Process: "Management Flow",
            Action: "Actions",
          },
          Status: {
            Pending: "Authorize",
            Done: "Delivered",
            Locked: "Waiting",
          },
          Buttons: {
            Look: "Look",
            ConfirmDelivery: "Confirm Delivery",
            ApproveProduction: "Approve Production",
          },
        },
        thai: {
          Title: "ศูนย์บัญชาการ",
          Subtitle: "สายการผลิตทั้งหมด",
          BtnPrice: "ตั้งราคากลาง",
          Search: "ค้นหาออเดอร์ในระบบ...",
          Stats: {
            total: "รายการทั้งหมด",
            pending: "รอการยืนยัน",
            manufacturing: "กำลังผลิต",
            delivered: "จัดส่งแล้ว",
          },
          Headers: {
            Project: "ข้อมูลโปรเจกต์",
            Price: "มูลค่า",
            Process: "จัดการสถานะ",
            Action: "ตัวเลือก",
          },
          Status: { Pending: "อนุมัติ", Done: "ส่งแล้ว", Locked: "รอผลิต" },
          Buttons: {
            Look: "ดูข้อมูล",
            ConfirmDelivery: "ยืนยันการส่ง",
            ApproveProduction: "อนุมัติผลิต",
          },
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
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fb] dark:bg-black transition-colors duration-500">
        <Loader />
      </div>
    );
  }

  if (errorOrders || errorCarts) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <Message variant="danger">
          {(errorOrders?.data?.message || errorOrders?.error) || (errorCarts?.data?.message || errorCarts?.error)}
        </Message>
      </div>
    );
  }

  // --- Main Render ---
  return (
    <div className="min-h-screen bg-[#f8f9fb] dark:bg-black p-6 font-sans selection:bg-blue-100 selection:text-blue-900 md:p-10 lg:p-12 transition-colors duration-500">
      <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800;900&family=Prompt:wght@400;500;600;700;800;900&display=swap');
                .font-display { font-family: 'Outfit', 'Prompt', sans-serif; }
                .font-sans { font-family: 'Inter', 'Prompt', sans-serif; }
                
                .glass-header {
                  background: white;
                  border: 1px solid rgba(0,0,0,0.05);
                  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
                }
                .dark .glass-header {
                  background: rgba(24, 24, 27, 0.5);
                  border: 1px solid rgba(39, 39, 42, 1);
                  box-shadow: none;
                }
                .ls-widest { letter-spacing: 0.3em; }
                .ls-loose { letter-spacing: 0.1em; }
                .btn-action {
                    display: flex;
                    height: 2.25rem;
                    width: 2.25rem;
                    align-items: center;
                    justify-content: center;
                    border-radius: 0.75rem;
                    background: white;
                    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
                    border: 1px solid rgb(241 245 249);
                    transition: all 0.2s;
                    cursor: pointer;
                    position: relative;
                    z-index: 10;
                }
                .dark .btn-action {
                    background: #09090b;
                    border: 1px solid #27272a;
                    box-shadow: none;
                }
                .btn-action:hover {
                    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
                    transform: translateY(-1px);
                }
                .btn-action:active {
                    transform: scale(0.95);
                }
            `}</style>

      <div className="mx-auto max-w-7xl">
        {/* --- HEADER DASHBOARD --- */}
        <header className="glass-header mb-12 flex flex-col items-center justify-between gap-8 rounded-[2.5rem] p-8 md:flex-row md:p-10">
          <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
            <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-slate-950 dark:bg-blue-600 text-blue-400 dark:text-white">
              <PiCircuitryFill size={32} />
            </div>
            <div className="text-center md:text-left">
              <h1 className="font-display text-4xl font-black tracking-tighter text-slate-950 dark:text-white">
                {t.Title}
              </h1>
              <p className="mt-1 text-[11px] font-black uppercase ls-widest text-slate-400">
                {t.Subtitle}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-10 md:justify-end">
            <StatItem label={t.Stats.total} value={stats.total} />
            <StatItem
              label={t.Stats.manufacturing}
              value={stats.manufacturing}
              color="text-amber-500"
            />
            <StatItem
              label={t.Stats.delivered}
              value={stats.delivered}
              color="text-emerald-500"
            />
          </div>
        </header>

        {/* --- TOOLBAR --- */}
        <div className="mb-8 flex flex-col items-center justify-between gap-6 md:flex-row md:px-4">
          <div className="relative w-full max-w-md">
            <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
            <input
              type="text"
              placeholder={t.Search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-14 w-full rounded-2xl bg-white dark:bg-zinc-900/30 px-14 text-sm font-semibold tracking-tight text-slate-950 dark:text-white shadow-sm ring-1 ring-slate-100 dark:ring-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 md:text-base border-none"
            />
          </div>

          <button
            onClick={() => navigate("/admin/orderpcbeditlist")}
            className="flex h-14 items-center gap-4 rounded-2xl bg-slate-950 px-8 font-display text-xs font-black uppercase ls-widest text-white shadow-xl shadow-slate-950/20 hover:bg-slate-900 transition-all"
          >
            <PiCurrencyCircleDollarBold size={20} className="text-blue-400" />
            {t.BtnPrice}
          </button>
        </div>

        {/* --- DATA LIST --- */}
        <div className="space-y-6 md:px-4">
          {/* PC VIEW */}
          <div className="hidden lg:block overflow-hidden rounded-[2.5rem] bg-white dark:bg-zinc-900/30 shadow-sm ring-1 ring-slate-100 dark:ring-zinc-800">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-50 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950">
                  <th className="py-4 ps-10 text-[10px] font-black uppercase ls-widest text-slate-400">
                    #
                  </th>
                  <th className="py-4 ps-4 text-[10px] font-black uppercase ls-widest text-slate-400">
                    {t.Headers.Project}
                  </th>
                  <th className="py-4 text-[10px] font-black uppercase ls-widest text-slate-400">
                    {t.Headers.Price}
                  </th>
                  <th className="py-4 text-center text-[10px] font-black uppercase ls-widest text-slate-400">
                    {t.Headers.Process}
                  </th>
                  <th className="py-4 pe-10 text-right text-[10px] font-black uppercase ls-widest text-slate-400">
                    {t.Headers.Action}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredOrders.map((pcb, index) => (
                  <tr
                    key={pcb.id}
                    className="group hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-8 ps-10 font-display text-sm font-black text-slate-200 dark:text-zinc-800">
                      {String(index + 1).padStart(2, "0")}
                    </td>
                    <td className="py-8 ps-4">
                      <div className="flex items-center gap-6">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white dark:bg-black shadow-sm ring-1 ring-slate-100 dark:ring-zinc-800">
                          {pcb.pcb_image ? (
                            <img
                              src={`${BASE_URL}${pcb.pcb_image}`}
                              alt="PCB"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <FaLayerGroup
                              size={24}
                              className="text-slate-300"
                            />
                          )}
                        </div>
                        <div className="min-w-0 pr-4">
                          <h3 className="truncate font-display text-lg font-black tracking-tight text-slate-950 dark:text-white">
                            {pcb.projectname}
                          </h3>
                          <span className="rounded-lg bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400">
                            {pcb.orderID}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-8">
                      <div className="flex flex-col">
                        <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
                          {formatCurrency(
                            pcb.quoted_price_to_customer ||
                            pcb.total_amount_cost,
                          )}
                        </span>
                        <span className="text-[10px] font-black uppercase ls-loose text-slate-400">
                          {formatDate(pcb.created_at, language)}
                        </span>
                      </div>
                    </td>
                    <td className="py-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {pcb.itemType === 'ORDER' ? (
                          <>
                            <button
                              onClick={() => handleShowModal(pcb, "manufacture")}
                              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase ls-widest transition-all ${Number(pcb.isManufacting) === 1 ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400" : "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400"}`}
                            >
                              {Number(pcb.isManufacting) === 1
                                ? pcb.manufactureOrderNumber
                                : t.Status.Pending}
                            </button>
                            <div className="h-px w-4 bg-slate-100" />
                            <button
                              onClick={() =>
                                Number(pcb.isManufacting) === 1 &&
                                handleShowModal(pcb, "delivery")
                              }
                              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase ls-widest transition-all ${Number(pcb.isDelivered) === 1 ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400" : Number(pcb.isManufacting) === 1 ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400" : "bg-slate-50 dark:bg-zinc-900 text-slate-200 dark:text-zinc-800 cursor-not-allowed"}`}
                            >
                              {Number(pcb.isDelivered) === 1
                                ? t.Status.Done
                                : t.Status.Pending}
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleShowCartModal(pcb)}
                              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase ls-widest transition-all ${pcb.status === 'accepted' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}
                            >
                              {pcb.status === 'accepted' ? "Review Done" : t.Status.Pending}
                            </button>
                            <div className="h-px w-4 bg-slate-100" />
                            <button
                              disabled
                              className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase ls-widest bg-slate-50 dark:bg-zinc-900 text-slate-200 dark:text-zinc-800 cursor-not-allowed"
                            >
                              {t.Status.Pending}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-6 pe-10 text-right">
                      <div className="flex justify-end gap-3">
                        {pcb.itemType === 'ORDER' ? (
                          <>
                            <button
                              onClick={() => {
                                if (Number(pcb.isManufacting) === 0)
                                  handleShowModal(pcb, "manufacture");
                              }}
                              className={`btn-action ${Number(pcb.isManufacting) === 1 ? "text-emerald-500" : "text-amber-600"}`}
                              title={t.Buttons.ApproveProduction}
                            >
                              {Number(pcb.isManufacting) === 1 ? (
                                <FaCheckCircle size={14} />
                              ) : (
                                <FaIndustry size={14} />
                              )}
                            </button>

                            <button
                              onClick={() => {
                                if (
                                  Number(pcb.isManufacting) === 1 &&
                                  Number(pcb.isDelivered) === 0
                                )
                                  handleShowModal(pcb, "delivery");
                              }}
                              className={`btn-action ${Number(pcb.isDelivered) === 1 ? "text-emerald-500" : Number(pcb.isManufacting) === 1 ? "text-emerald-600" : "text-slate-200"}`}
                              title={t.Buttons.ConfirmDelivery}
                            >
                              {Number(pcb.isDelivered) === 1 ? (
                                <FaCheck size={14} />
                              ) : (
                                <FaTruck size={14} />
                              )}
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleShowCartModal(pcb)}
                              className={`btn-action ${pcb.status === 'accepted' ? "text-emerald-500" : "text-amber-600"}`}
                              title="Review Cart Request"
                            >
                              {pcb.status === 'accepted' ? <FaCheckCircle size={14} /> : <FaIndustry size={14} />}
                            </button>

                            <button
                              disabled
                              className="btn-action text-slate-200 cursor-not-allowed"
                              title="Confirm Delivery (Waiting Payment)"
                            >
                              <FaTruck size={14} />
                            </button>
                          </>
                        )}

                        {pcb.gerberZip && (
                          <button
                            onClick={() => {
                              const filename = pcb.gerberZip.split(/[/\\]/).pop();
                              window.open(`${BASE_URL}/api/gerber/download/${filename}`, "_blank");
                            }}
                            className="btn-action text-emerald-600"
                            title="Download Gerber ZIP"
                          >
                            <FaDownload size={14} />
                          </button>
                        )}

                        <button
                          onClick={() => pcb.itemType === 'ORDER' ? navigate(`/orderpcbs/${pcb.id}`) : handleShowCartModal(pcb)}
                          className="btn-action text-blue-600"
                          title={t.Buttons.Look}
                        >
                          <FaEye size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE VIEW */}
          <div className="grid grid-cols-1 gap-6 lg:hidden">
            {filteredOrders.map((pcb) => (
              <div
                key={pcb.id}
                className="relative flex flex-col gap-6 rounded-[2.5rem] bg-white dark:bg-zinc-900/30 p-8 shadow-sm ring-1 ring-slate-100 dark:ring-zinc-800 transition-colors duration-500"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50 dark:bg-black ring-1 ring-slate-100 dark:ring-zinc-800">
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
                      <span className="rounded-lg bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-500">
                        {pcb.orderID}
                      </span>
                      <h3 className="mt-1 truncate font-display text-xl font-black tracking-tight text-slate-950 dark:text-white">
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

                <div className="flex items-center justify-between gap-4 py-4 rounded-3xl bg-slate-50/50 dark:bg-zinc-950/50 px-6">
                  {pcb.itemType === 'ORDER' ? (
                    <>
                      <button
                        onClick={() => handleShowModal(pcb, "manufacture")}
                        className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase ls-widest ${Number(pcb.isManufacting) === 1 ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400" : "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400"}`}
                      >
                        {Number(pcb.isManufacting) === 1 ? "Prod" : "Auth"}
                      </button>
                      <div className="h-px grow bg-slate-200" />
                      <button
                        onClick={() =>
                          Number(pcb.isManufacting) === 1 &&
                          handleShowModal(pcb, "delivery")
                        }
                        className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase ls-widest ${Number(pcb.isDelivered) === 1 ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400" : Number(pcb.isManufacting) === 1 ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400" : "bg-slate-50 dark:bg-zinc-900 text-slate-200 dark:text-zinc-800"}`}
                      >
                        {Number(pcb.isDelivered) === 1 ? "Done" : "Ship"}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleShowCartModal(pcb)}
                        className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase ls-widest ${pcb.status === 'accepted' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}
                      >
                        {pcb.status === 'accepted' ? "Done" : "Auth"}
                      </button>
                      <div className="h-px grow bg-slate-200" />
                      <button
                        disabled
                        className="px-3 py-1 rounded-lg text-[8px] font-black uppercase ls-widest bg-slate-50 text-slate-200"
                      >
                        Ship
                      </button>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-300">
                    <FaCalendarAlt size={12} />
                    <span className="text-[10px] font-black uppercase ls-loose">
                      {formatDate(pcb.created_at, language)}
                    </span>
                  </div>
                  <div className="flex gap-4">
                    {pcb.itemType === 'ORDER' ? (
                      <>
                        <button
                          onClick={() => {
                            if (Number(pcb.isManufacting) === 0)
                              handleShowModal(pcb, "manufacture");
                          }}
                          className={`text-xs font-black uppercase ls-widest ${Number(pcb.isManufacting) === 1 ? "text-emerald-500" : "text-amber-600"}`}
                        >
                          {Number(pcb.isManufacting) === 1 ? (
                            <FaCheckCircle size={16} />
                          ) : (
                            <FaIndustry size={16} />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            if (
                              Number(pcb.isManufacting) === 1 &&
                              Number(pcb.isDelivered) === 0
                            )
                              handleShowModal(pcb, "delivery");
                          }}
                          className={`text-xs font-black uppercase ls-widest ${Number(pcb.isDelivered) === 1 ? "text-emerald-500" : Number(pcb.isManufacting) === 1 ? "text-emerald-600" : "text-slate-200"}`}
                        >
                          {Number(pcb.isDelivered) === 1 ? (
                            <FaCheck size={16} />
                          ) : (
                            <FaTruck size={16} />
                          )}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleShowCartModal(pcb)}
                          className={`text-xs font-black uppercase ls-widest ${pcb.status === 'accepted' ? "text-emerald-500" : "text-amber-600"}`}
                        >
                          {pcb.status === 'accepted' ? <FaCheckCircle size={16} /> : <FaIndustry size={16} />}
                        </button>
                        <button
                          disabled
                          className="text-xs font-black uppercase ls-widest text-slate-200"
                        >
                          <FaTruck size={16} />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => pcb.itemType === 'ORDER' ? navigate(`/orderpcbs/${pcb.id}`) : handleShowCartModal(pcb)}
                      className="text-xs font-black uppercase ls-widest text-blue-600"
                    >
                      <FaEye size={16} />
                    </button>
                    {pcb.gerberZip && (
                      <button
                        onClick={() => {
                          const filename = pcb.gerberZip.split(/[/\\]/).pop();
                          window.open(`${BASE_URL}/api/gerber/download/${filename}`, "_blank");
                        }}
                        className="text-xs font-black uppercase ls-widest text-emerald-600"
                        title="Download Gerber ZIP"
                      >
                        <FaDownload size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <footer className="mt-20 flex items-center justify-center gap-4 py-12 opacity-20">
          <div className="h-px w-12 bg-slate-400" />
          <span className="text-[10px] font-black uppercase ls-widest tracking-[0.5em] text-slate-950 dark:text-white">
            PCB Logistics OS / v1.3
          </span>
          <div className="h-px w-12 bg-slate-400" />
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
