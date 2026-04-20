import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import Loader from "../../components/Loader";
import Message from "../../components/Message";
import { Row, Col } from "react-bootstrap";
import { PiCircuitryFill, PiCurrencyCircleDollarBold } from "react-icons/pi";
import { useGetAllAssemblyPCBsQuery } from "../../slices/assemblypcbApiSlice";
import { useNavigate, Link } from "react-router-dom";
import { BASE_URL } from "../../constants";
import { FaCheck, FaDownload, FaSearch, FaEye, FaCalendarAlt, FaCheckCircle, FaLayerGroup, FaHistory } from "react-icons/fa";

import OrderassemblyDelieveryModle from "./OrderassemblyDelieveryModle";

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

const OrderassemblyOrderListScreen = () => {
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);
  const { language } = useSelector((state) => state.language);
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading, error, refetch } = useGetAllAssemblyPCBsQuery();

  // State for modal visibility and selected order id
  const [showModal, setShowModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const handleShowModal = (id) => {
    setSelectedOrderId(id);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setSelectedOrderId(null);
    setShowModal(false);
  };

  // --- Filter ---
  const filteredOrders = useMemo(() => {
    const orders = Array.isArray(data?.data) ? data.data : [];
    const sorted = [...orders].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at),
    );

    if (!searchTerm) return sorted;

    const lowerTerm = searchTerm.toLowerCase();
    return sorted.filter(
      (item) =>
        item.projectname?.toLowerCase().includes(lowerTerm) ||
        item.orderID?.toLowerCase().includes(lowerTerm),
    );
  }, [data, searchTerm]);

  // --- Stats ---
  const stats = useMemo(() => {
    const orders = Array.isArray(data?.data) ? data.data : [];
    return orders.reduce(
      (acc, curr) => {
        acc.total++;
        if (!curr.isDelivered) acc.pending++;
        else acc.delivered++;
        return acc;
      },
      { total: 0, pending: 0, delivered: 0 }
    );
  }, [data]);

  const translations = {
    en: {
      Title: "Assembly Center",
      Subtitle: "Component & PCB Integration",
      AssemblyOrderListsLbl: "Assembly PCB Order Lists",
      ErrorMessageLbl: "No assembly PCB orders found.",
      projectIDLbl: "Project ID",
      projectnameLbl: "Project Name",
      QtyLbl: "Quantity",
      TotalPriceLbl: "Total Price (฿)",
      DATELbl: "Date",
      DeliveryLbl: "Delivery",
      ConfirmLbl: "Confirm",
      CancelLbl: "Cancel",
      DetailLbl: "Details",
      DefaultAssemblyPrice: "Assembly Pricing",
      Search: "Search assembly records...",
      Stats: {
        total: "Total Operations",
        pending: "Awaiting Action",
        delivered: "Completed",
      },
      Headers: {
        Project: "Assembly Project",
        Price: "Financials",
        Process: "Status Control",
        Action: "Management",
      },
      Status: {
        Pending: "Authorize",
        Done: "Delivered",
      },
    },
    thai: {
      Title: "ศูนย์ประกอบแผงวงจร",
      Subtitle: "รายการประกอบ PCB ทั้งหมด",
      AssemblyOrderListsLbl: "รายการคำสั่งซื้อการประกอบ PCB",
      ErrorMessageLbl: "ไม่พบรายการสั่งประกอบ PCB",
      projectIDLbl: "รหัสโปรเจกต์",
      projectnameLbl: "ชื่อโปรเจกต์",
      QtyLbl: "จำนวน",
      TotalPriceLbl: "ราคารวม (฿)",
      DATELbl: "วันที่",
      DeliveryLbl: "การจัดส่ง",
      ConfirmLbl: "ยืนยัน",
      CancelLbl: "ยกเลิก",
      DetailLbl: "รายละเอียด",
      DefaultAssemblyPrice: "ตั้งราคากลางการประกอบ",
      Search: "ค้นหาข้อมูลการประกอบ...",
      Stats: {
        total: "รายการทั้งหมด",
        pending: "รอการบันทึก",
        delivered: "จัดส่งแล้ว",
      },
      Headers: {
        Project: "ข้อมูลงานประกอบ",
        Price: "มูลค่าราคาสุทธิ",
        Process: "สถานะการจัดส่ง",
        Action: "เครื่องมือ",
      },
      Status: {
        Pending: "รอการบันทึก",
        Done: "ส่งแล้ว",
      },
    },
  };

  const t = translations[language] || translations.en;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fb] dark:bg-black transition-colors duration-500">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl p-4 md:p-8">
        <Message variant="danger">
          {error?.data?.message || error.message}
        </Message>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb] dark:bg-black p-4 md:p-6 font-sans selection:bg-blue-100 selection:text-blue-900 md:p-10 lg:p-12 transition-colors duration-500">
      <style dangerouslySetInnerHTML={{ __html: `
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
      ` }} />

      <div className="mx-auto max-w-7xl">
        {/* --- HEADER DASHBOARD --- */}
        <header className="glass-header mb-12 flex flex-col items-center justify-between gap-4 md:gap-8 rounded-[2.5rem] p-4 md:p-8 md:flex-row md:p-10 transition-all duration-500">
          <div className="flex flex-col items-center gap-4 md:gap-6 md:flex-row md:items-start">
            <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-slate-950 dark:bg-emerald-600 text-emerald-400 dark:text-white transition-colors">
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

          <div className="flex flex-wrap justify-center gap-4 md:gap-6 md:gap-10 md:justify-end">
            <StatItem label={t.Stats.total} value={stats.total} />
            <StatItem
              label={t.Stats.pending}
              value={stats.pending}
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
        <div className="mb-8 flex flex-col items-center justify-between gap-4 md:gap-6 md:flex-row md:px-4">
          <div className="relative w-full max-w-md">
            <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
            <input
              type="text"
              placeholder={t.Search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-14 w-full rounded-2xl bg-white dark:bg-zinc-900/30 px-14 text-sm font-semibold tracking-tight text-slate-950 dark:text-white shadow-sm ring-1 ring-slate-100 dark:ring-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 md:text-base border-none"
            />
          </div>

          <button
            onClick={() => navigate("/admin/assemblyboardeditd")}
            className="flex h-14 items-center gap-4 rounded-2xl bg-slate-950 dark:bg-zinc-800 px-4 md:px-8 font-display text-xs font-black uppercase ls-widest text-white shadow-xl shadow-slate-950/20 hover:bg-slate-900 transition-all"
          >
            <PiCurrencyCircleDollarBold size={20} className="text-emerald-400" />
            {t.DefaultAssemblyPrice}
          </button>
        </div>

        {/* --- DATA LIST --- */}
        {filteredOrders.length === 0 ? (
          <div className="mx-4">
            <Message variant="info">{t.ErrorMessageLbl}</Message>
          </div>
        ) : (
          <div className="space-y-6 md:px-4">
            {/* PC VIEW */}
            <div className="hidden lg:block overflow-hidden rounded-[2.5rem] bg-white dark:bg-zinc-900/30 shadow-sm ring-1 ring-slate-100 dark:ring-zinc-800 transition-colors">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-50 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 transition-colors">
                    <th className="py-4 ps-10 text-[10px] font-black uppercase ls-widest text-slate-400">#</th>
                    <th className="py-4 ps-4 text-[10px] font-black uppercase ls-widest text-slate-400">{t.Headers.Project}</th>
                    <th className="py-4 text-[10px] font-black uppercase ls-widest text-slate-400">{t.Headers.Price}</th>
                    <th className="py-4 text-center text-[10px] font-black uppercase ls-widest text-slate-400">{t.Headers.Process}</th>
                    <th className="py-4 pe-10 text-right text-[10px] font-black uppercase ls-widest text-slate-400">{t.Headers.Action}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-zinc-800">
                  {filteredOrders.map((order, index) => (
                    <tr key={order.id} className="group hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                      <td className="py-4 md:py-8 ps-10 font-display text-sm font-black text-slate-200 dark:text-zinc-800">
                        {String(index + 1).padStart(2, "0")}
                      </td>
                      <td className="py-4 md:py-8 ps-4">
                        <div className="flex items-center gap-4 md:gap-6">
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white dark:bg-black shadow-sm ring-1 ring-slate-100 dark:ring-zinc-800">
                            {order.pcb_image ? (
                              <img src={`${BASE_URL}${order.pcb_image}`} alt="Assembly" className="h-full w-full object-cover" />
                            ) : (
                              <FaLayerGroup size={24} className="text-slate-200 dark:text-zinc-800" />
                            )}
                          </div>
                          <div className="min-w-0 pr-4">
                            <h3 className="truncate font-display text-lg font-black tracking-tight text-slate-950 dark:text-white">
                              {order.projectname}
                            </h3>
                            <span className="rounded-lg bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-tighter">
                              {order.orderID}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 md:py-8">
                        <div className="flex flex-col">
                          <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(order.confirmed_price || 0)}
                          </span>
                          <span className="text-[10px] font-black uppercase ls-loose text-slate-400">
                            {formatDate(order.created_at, language)}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 md:py-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase ls-widest transition-all ${order.isDelivered ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400" : "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400"}`}
                          >
                            {order.isDelivered ? t.Status.Done : t.Status.Pending}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 md:py-6 pe-10 text-right">
                        <div className="flex justify-end gap-3">
                          {!order.isDelivered && (
                            <button
                              onClick={() => handleShowModal(order.id)}
                              className="btn-action text-amber-600"
                              title={t.ConfirmLbl}
                            >
                              <FaCheckCircle size={14} />
                            </button>
                          )}

                          <button
                            onClick={() => navigate(`/reorderassemblypcb/${order.orderID}/set`)}
                            className="btn-action text-emerald-600"
                            title="Reorder"
                          >
                            <FaHistory size={14} />
                          </button>

                          {order.gerber_zip && (
                            <button
                              onClick={() => {
                                const filename = order.gerber_zip.split(/[/\\]/).pop();
                                window.open(`${BASE_URL}/assemblypcbZipFiles/${filename}`, "_blank");
                              }}
                              className="btn-action text-blue-600"
                              title="Download Gerber ZIP"
                            >
                              <FaDownload size={14} />
                            </button>
                          )}

                          <button
                            onClick={() => navigate(`/assemblypcb/${order.id}`)}
                            className="btn-action text-slate-400 hover:text-slate-950 dark:hover:text-white"
                            title={t.DetailLbl}
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
            <div className="grid grid-cols-1 gap-4 md:gap-6 lg:hidden">
              {filteredOrders.map((order) => (
                <div key={order.id} className="relative flex flex-col gap-4 md:gap-6 rounded-[2.5rem] bg-white dark:bg-zinc-900/40 p-4 md:p-8 shadow-sm ring-1 ring-slate-100 dark:ring-zinc-800 transition-all duration-500">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50 dark:bg-black ring-1 ring-slate-100 dark:ring-zinc-800">
                        {order.pcb_image ? (
                          <img src={`${BASE_URL}${order.pcb_image}`} alt="PCB" className="h-full w-full object-cover" />
                        ) : (
                          <FaLayerGroup size={20} className="text-slate-200 dark:text-zinc-800" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="rounded-lg bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-tighter">
                          {order.orderID}
                        </span>
                        <h3 className="mt-1 truncate font-display text-xl font-black tracking-tight text-slate-950 dark:text-white">
                          {order.projectname}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 py-4 rounded-3xl bg-slate-50/50 dark:bg-zinc-950/50 px-4 md:px-6">
                    <span className="font-mono text-base font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(order.confirmed_price || 0)}
                    </span>
                    <span
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ls-widest ${order.isDelivered ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400" : "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400"}`}
                    >
                      {order.isDelivered ? "Done" : "Pending"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2 text-slate-300 dark:text-zinc-700">
                      <FaCalendarAlt size={12} />
                      <span className="text-[10px] font-black uppercase ls-loose">
                        {formatDate(order.created_at, language)}
                      </span>
                    </div>
                    <div className="flex gap-4">
                      {!order.isDelivered && (
                        <button onClick={() => handleShowModal(order.id)} className="text-amber-600"><FaCheckCircle size={18} /></button>
                      )}
                      <button onClick={() => navigate(`/reorderassemblypcb/${order.orderID}/set`)} className="text-emerald-600 transition-transform active:scale-95" title="Reorder"><FaHistory size={18} /></button>
                      {order.gerber_zip && (
                        <button onClick={() => {
                          const filename = order.gerber_zip.split(/[/\\]/).pop();
                          window.open(`${BASE_URL}/assemblypcbZipFiles/${filename}`, "_blank");
                        }} className="text-blue-600"><FaDownload size={18} /></button>
                      )}
                      <button onClick={() => navigate(`/assemblypcb/${order.id}`)} className="text-slate-400"><FaEye size={18} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal Component */}
      <OrderassemblyDelieveryModle
        show={showModal}
        handleClose={handleCloseModal}
        orderId={selectedOrderId}
        onConfirm={() => {
          refetch();
          handleCloseModal();
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
      className={`font-display text-3xl font-black tracking-tighter transition-colors ${color}`}
    >
      {value}
    </span>
  </div>
);

export default OrderassemblyOrderListScreen;
