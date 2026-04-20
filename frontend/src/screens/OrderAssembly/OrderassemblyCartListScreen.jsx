import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaCheck,
  FaEdit,
  FaSearch,
  FaCogs,
  FaTimes,
  FaFilter,
  FaSync,
  FaChevronDown,
  FaBoxOpen,
} from "react-icons/fa";
import Loader from "../../components/Loader";
import Message from "../../components/Message";
import { useGetAllAssemblycartsQuery } from "../../slices/assemblypcbCartApiSlice";
import OrderassemblyCartConfirmModle from "./OrderassemblyCartConfirmModle";

// ==========================================
// Sub-Components
// ==========================================

const StatusBadge = ({ status, t }) => {
  const configs = {
    pending: {
      bg: "bg-amber-50",
      text: "text-amber-600",
      border: "border-amber-100",
      label: t.status.pending,
      icon: (
        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
      ),
    },
    accepted: {
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      border: "border-emerald-100",
      label: t.status.accepted,
      icon: <FaCheck size={8} />,
    },
    rejected: {
      bg: "bg-rose-50",
      text: "text-rose-600",
      border: "border-rose-100",
      label: t.status.rejected,
      icon: <FaTimes size={8} />,
    },
  };

  const config = configs[status] || configs.pending;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 ${config.bg} ${config.text} ${config.border} border rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm`}
    >
      {config.icon}
      <span>{config.label}</span>
    </div>
  );
};

const AssemblyTypeBadge = ({ smd, tht }) => (
  <div className="flex gap-1.5 flex-wrap">
    {smd > 0 && (
      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded text-[9px] font-black tracking-tighter">
        SMD
      </span>
    )}
    {tht > 0 && (
      <span className="px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded text-[9px] font-black tracking-tighter">
        THT
      </span>
    )}
    {!smd && !tht && <span className="text-slate-300">-</span>}
  </div>
);

const OrderassemblyCartListScreen = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const { language } = useSelector((state) => state.language);

  // API Call
  const {
    data: rawData,
    isLoading,
    error,
    refetch,
  } = useGetAllAssemblycartsQuery(userInfo?._id, {
    skip: !userInfo?._id,
  });

  // State
  const [showModal, setShowModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Translation Support
  const t = useMemo(
    () =>
      ({
        en: {
          title: "Assembly PCB Orders",
          subtitle: "Review & Approve Assembly Requests",
          searchPlaceholder: "Search project...",
          statusAll: "All Status",
          headers: {
            id: "#",
            project: "Project Name",
            type: "Type",
            qty: "Qty",
            price: "Price",
            date: "Date",
            status: "Status",
            actions: "Actions",
          },
          status: {
            pending: "Pending Review",
            accepted: "Approved",
            rejected: "Rejected",
          },
          noData: "No assembly orders found.",
          btn: { confirm: "Approve", edit: "Edit" },
          est: "(Est.)",
        },
        thai: {
          title: "รายการคำสั่งซื้องานประกอบ",
          subtitle: "ตรวจสอบและอนุมัติงานประกอบแผงวงจร",
          searchPlaceholder: "ค้นหาชื่อโปรเจกต์...",
          statusAll: "สถานะทั้งหมด",
          headers: {
            id: "#",
            project: "ชื่อโปรเจกต์",
            type: "ประเภท",
            qty: "จำนวน",
            price: "ราคาประเมิน",
            date: "วันที่",
            status: "สถานะ",
            actions: "จัดการ",
          },
          status: {
            pending: "รอตรวจสอบ",
            accepted: "อนุมัติแล้ว",
            rejected: "ปฏิเสธ",
          },
          noData: "ไม่พบรายการคำสั่งซื้อ",
          btn: { confirm: "อนุมัติ", edit: "แก้ไข" },
          est: "(ประเมิน)",
        },
      })[language || "en"],
    [language],
  );

  // --- Handlers ---
  const handleShowModal = (id) => {
    setSelectedOrderId(id);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setSelectedOrderId(null);
    setShowModal(false);
  };

  // --- Filter Logic ---
  const filteredOrders = useMemo(() => {
    const orders =
      rawData?.data || (Array.isArray(rawData) ? rawData : []) || [];
    let processed = [...orders].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at),
    );

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      processed = processed.filter((item) =>
        item.projectname?.toLowerCase().includes(lowerTerm),
      );
    }

    if (filterStatus !== "all") {
      processed = processed.filter((item) => item.status === filterStatus);
    }

    return processed.filter(
      (item) => item.pcb_qty && parseInt(item.pcb_qty) > 0,
    );
  }, [rawData, searchTerm, filterStatus]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(amount || 0);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-prompt pb-24 pt-10 selection:bg-indigo-100 selection:text-indigo-900">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header - True Black Style */}
        <header className="mb-10 flex flex-col lg:flex-row lg:items-end justify-between gap-4 md:gap-8 border-b border-slate-200 pb-10">
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
            <div className="w-16 h-16 bg-slate-900 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-slate-200/50">
              <FaCogs size={28} />
            </div>
            <div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 uppercase">
                {t.title}
              </h1>
              <p className="mt-2 text-slate-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                <span className="w-8 h-[2px] bg-indigo-500 rounded-full" />
                {t.subtitle}
              </p>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-72">
              <FaSearch
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                size={14}
              />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all shadow-sm outline-none"
              />
            </div>

            <div className="relative w-full sm:w-48">
              <FaFilter
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"
                size={12}
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-11 pr-10 py-3.5 bg-white border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-600 appearance-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all shadow-sm outline-none cursor-pointer"
              >
                <option value="all">{t.statusAll}</option>
                <option value="pending">{t.status.pending}</option>
                <option value="accepted">{t.status.accepted}</option>
                <option value="rejected">{t.status.rejected}</option>
              </select>
              <FaChevronDown
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"
                size={10}
              />
            </div>

            <button
              onClick={refetch}
              className="group w-full sm:w-14 h-[54px] bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-indigo-500 shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
            >
              <FaSync
                className={`${isLoading ? "animate-spin" : "group-hover:rotate-180"} transition-all duration-500`}
                size={16}
              />
            </button>
          </div>
        </header>

        {isLoading ? (
          <div className="py-24 flex items-center justify-center bg-white rounded-[3rem] border border-slate-100 shadow-sm">
            <Loader />
          </div>
        ) : error ? (
          <div className="py-12">
            <Message variant="danger">
              {error?.data?.message || "Failed to load assembly carts"}
            </Message>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-center bg-white rounded-[3rem] border border-slate-100 shadow-sm">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-200 border border-slate-100">
              <FaBoxOpen size={48} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
              {t.noData}
            </h3>
            <p className="mt-2 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="space-y-6">

            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white rounded-[2.5rem] border border-slate-200/60 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    <th className="py-4 md:py-6 pl-10 w-16">{t.headers.id}</th>
                    <th className="py-4 md:py-6 px-4 md:px-6">{t.headers.project}</th>
                    <th className="py-4 md:py-6 px-4 md:px-6 text-center">{t.headers.type}</th>
                    <th className="py-4 md:py-6 px-4 md:px-6 text-center">{t.headers.qty}</th>
                    <th className="py-4 md:py-6 px-4 md:px-6 text-right">{t.headers.price}</th>
                    <th className="py-4 md:py-6 px-4 md:px-6 text-center">{t.headers.date}</th>
                    <th className="py-4 md:py-6 px-4 md:px-6 text-center">{t.headers.status}</th>
                    <th className="py-4 md:py-6 pr-10 text-right">{t.headers.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <AnimatePresence>
                    {filteredOrders.map((order, index) => (
                      <motion.tr
                        key={order.id || index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="group hover:bg-indigo-50/30 transition-all duration-300"
                      >
                        <td className="py-4 md:py-6 pl-10 font-mono text-[11px] font-bold text-slate-400">
                          {String(index + 1).padStart(2, '0')}
                        </td>
                        <td className="py-4 md:py-6 px-4 md:px-6">
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight truncate max-w-[200px]">
                              {order.projectname}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                              ID: {order.id}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 md:py-6 px-4 md:px-6">
                          <div className="flex justify-center">
                            <AssemblyTypeBadge
                              smd={order.count_smd}
                              tht={order.count_tht}
                            />
                          </div>
                        </td>
                        <td className="py-4 md:py-6 px-4 md:px-6 text-center">
                          <span className="inline-flex h-8 w-12 items-center justify-center rounded-lg bg-slate-50 border border-slate-100 text-xs font-black text-slate-700">
                            {order.pcb_qty}
                          </span>
                        </td>
                        <td className="py-4 md:py-6 px-4 md:px-6 text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-[15px] font-black text-slate-900">
                              {formatCurrency(order.confirmed_price || order.estimatedCost)}
                            </span>
                            {!order.confirmed_price && (
                              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-tighter">
                                {t.est}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 md:py-6 px-4 md:px-6 text-center">
                          <span className="text-[11px] font-bold text-slate-500 uppercase">
                            {new Date(order.created_at).toLocaleDateString("th-TH", {
                              day: "2-digit",
                              month: "short",
                              year: "2-digit",
                            })}
                          </span>
                        </td>
                        <td className="py-4 md:py-6 px-4 md:px-6 text-center">
                          <StatusBadge status={order.status} t={t} />
                        </td>
                        <td className="py-4 md:py-6 pr-10 text-right">
                          <div className="flex justify-end gap-2.5">
                            {order.status === "pending" && (
                              <button
                                onClick={() => handleShowModal(order.id)}
                                className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center hover:bg-emerald-600 hover:text-white hover:shadow-lg hover:shadow-emerald-200 transition-all shadow-sm"
                                title={t.btn.confirm}
                              >
                                <FaCheck size={14} />
                              </button>
                            )}
                            <Link
                              to={`/admin/cartassemblypcblist/${order.id}/edit`}
                              className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center hover:bg-indigo-600 hover:text-white hover:shadow-lg hover:shadow-indigo-200 transition-all shadow-sm"
                              title={t.btn.edit}
                            >
                              <FaEdit size={14} />
                            </Link>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (Premium True Black) */}
            <div className="lg:hidden flex flex-col gap-4 md:gap-6 px-2">
              {filteredOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-[#0a0a0a] rounded-[2.5rem] border border-zinc-900 p-4 md:p-8 shadow-2xl relative overflow-hidden group active:scale-[0.98] transition-all duration-300"
                >
                  {/* Status Badge Top Right */}
                  <div className="absolute top-8 right-8 z-10">
                    <StatusBadge status={order.status} t={t} />
                  </div>

                  {/* Project Info */}
                  <div className="flex flex-col mb-8 pt-2">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-zinc-500 border border-zinc-800">
                        <FaCogs size={16} />
                      </div>
                      <h4 className="text-xl font-black text-white uppercase tracking-tight leading-tight truncate pr-20">
                        {order.projectname}
                      </h4>
                    </div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                      ID: {order.id} • {new Date(order.created_at).toLocaleDateString("th-TH")}
                    </p>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-8 bg-zinc-900/40 p-5 rounded-[2rem] border border-zinc-800/30">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">
                        {language === 'thai' ? 'ประเภทและจำนวน' : 'Type & Qty'}
                      </span>
                      <div className="flex flex-col gap-2">
                        <AssemblyTypeBadge smd={order.count_smd} tht={order.count_tht} />
                        <span className="text-[15px] font-black text-white">
                          {order.pcb_qty} PCS
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end text-right">
                      <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">
                        {language === 'thai' ? 'ราคาประเมิน' : 'EST. PRICE'}
                      </span>
                      <div className="flex flex-col items-end">
                        <span className="text-[20px] font-black text-indigo-400 leading-none">
                          {formatCurrency(order.confirmed_price || order.estimatedCost)}
                        </span>
                        {!order.confirmed_price && (
                          <span className="text-[9px] font-black text-indigo-400/60 uppercase tracking-tighter mt-1">
                            {t.est}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="flex gap-3">
                    {order.status === "pending" && (
                      <button
                        onClick={() => handleShowModal(order.id)}
                        className="flex-1 py-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/10"
                      >
                        <FaCheck size={14} />
                        {t.btn.confirm}
                      </button>
                    )}
                    <Link
                      to={`/admin/cartassemblypcblist/${order.id}/edit`}
                      className={`flex-1 py-4 ${order.status === 'pending' ? 'bg-zinc-900/50 border border-zinc-800 text-zinc-400' : 'bg-white text-black shadow-xl'} rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95`}
                    >
                      <FaEdit size={14} />
                      {t.btn.edit}
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <OrderassemblyCartConfirmModle
          show={showModal}
          handleClose={handleCloseModal}
          pcborderId={selectedOrderId}
          onConfirm={() => {
            refetch();
            handleCloseModal();
          }}
        />

        {/* --- Custom Scrollbar Styling --- */}
        <style dangerouslySetInnerHTML={{
          __html: `
          .font-prompt { font-family: 'Prompt', sans-serif; }
          .font-sans { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
          
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          ::-webkit-scrollbar-track {
            background: #F8FAFC;
          }
          ::-webkit-scrollbar-thumb {
            background: #E2E8F0;
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #CBD5E1;
          }
          
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}} />
      </div>
    </div>
  );
};

export default OrderassemblyCartListScreen;
