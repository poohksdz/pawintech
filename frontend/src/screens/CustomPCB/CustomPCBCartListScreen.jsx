import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  FaCheck,
  FaEdit,
  FaSearch,
  FaEye,
  FaMicrochip,
  FaTimes,
  FaFilter,
  FaSync,
  FaSave,
  FaTrashAlt,
  FaExclamationTriangle,
  FaChevronRight,
  FaBoxOpen,
  FaClock,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";

//  Import Mutation
import {
  useGetAllCustomcartsQuery,
  useUpdateCustomcartComfirmStatusMutation,
  useDeleteCustomcartMutation,
} from "../../slices/custompcbCartApiSlice";

import Loader from "../../components/Loader";
import Message from "../../components/Message";

const CustomPCBCartListScreen = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const { language } = useSelector((state) => state.language);

  // 1. Fetch Data
  const { data, isLoading, error, refetch } = useGetAllCustomcartsQuery(
    userInfo?._id,
    {
      skip: !userInfo?._id,
    },
  );

  // 2. Mutations
  const [updateStatus, { isLoading: isStatusUpdating }] =
    useUpdateCustomcartComfirmStatusMutation();
  const [deleteCustomCart] = useDeleteCustomcartMutation();

  // State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // State forms
  const [editFormData, setEditFormData] = useState({
    confirmed_price: 0,
    status: "pending",
  });
  const [approvePrice, setApprovePrice] = useState(0);

  const translations = {
    en: {
      title: "Custom PCB Quotes",
      subtitle: "Review and approve manufacturing requests",
      searchPlaceholder: "Search projects...",
      statusAll: "All Status",
      headers: {
        id: "ID",
        project: "Project",
        qty: "Qty",
        price: "Price",
        date: "Date",
        status: "Status",
        actions: "Actions",
      },
      status: {
        pending: "Pending",
        accepted: "Approved",
        rejected: "Rejected",
      },
      noData: "No requests found.",
      btn: {
        confirm: "Approve",
        reject: "Reject",
        edit: "Edit",
        detail: "View Details",
        save: "Save Price",
        cancel: "Cancel",
        confirmAction: "Confirm Approval",
        delete: "Delete",
      },
      editModalTitle: "Edit Price",
      approveModalTitle: "Approve Quote",
      deleteModalTitle: "Delete Record",
      rejectModalTitle: "Reject Quote",
      form: { priceLabel: "Confirmed Price (THB)" },
      rejectConfirm: "Are you sure you want to reject this request?",
      deleteConfirm: "This action is permanent and cannot be undone.",
      approveDesc:
        "Verify the price before approval. Client will be notified to proceed with payment.",
    },
    thai: {
      title: "ใบเสนอราคา Custom PCB",
      subtitle: "ตรวจสอบและอนุมัติคำขอสั่งผลิต",
      searchPlaceholder: "ค้นหาชื่อโปรเจกต์...",
      statusAll: "ทุกสถานะ",
      headers: {
        id: "ID",
        project: "โปรเจกต์",
        qty: "จำนวน",
        price: "ราคา",
        date: "วันที่",
        status: "สถานะ",
        actions: "จัดการ",
      },
      status: {
        pending: "รอตรวจสอบ",
        accepted: "อนุมัติแล้ว",
        rejected: "ปฏิเสธ",
      },
      noData: "ไม่พบรายการคำขอ",
      btn: {
        confirm: "อนุมัติ",
        reject: "ปฏิเสธ",
        edit: "แก้ไข",
        detail: "ดูข้อมูล",
        save: "บันทึกราคา",
        cancel: "ยกเลิก",
        confirmAction: "ยืนยันการอนุมัติ",
        delete: "ลบ",
      },
      editModalTitle: "แก้ไขราคา",
      approveModalTitle: "อนุมัติรายการ",
      deleteModalTitle: "ลบรายการ",
      rejectModalTitle: "ปฏิเสธรายการ",
      form: { priceLabel: "ราคาที่ยืนยัน (บาท)" },
      rejectConfirm: "คุณแน่ใจที่จะปฏิเสธรายการนี้หรือไม่?",
      deleteConfirm: "การกระทำนี้ไม่สามารถกู้คืนได้ คุณแน่ใจหรือไม่ที่จะลบ?",
      approveDesc:
        "กรุณาตรวจสอบราคาก่อนอนุมัติ ลูกค้าจะสามารถชำระเงินได้ทันทีหลังจากการอนุมัติ",
    },
  };
  const t = translations[language] || translations.en;

  // --- Handlers ---

  const handleRejectAction = async () => {
    try {
      await updateStatus({
        id: selectedOrderId,
        data: { status: "rejected" },
      }).unwrap();
      toast.error(language === "thai" ? "ปฏิเสธรายการแล้ว" : "Quote rejected");
      refetch();
      setShowRejectModal(false);
    } catch (err) {
      toast.error(err?.data?.message || err.error || "Failed to reject");
    }
  };

  const handleDeleteAction = async () => {
    try {
      await deleteCustomCart(selectedOrderId).unwrap();
      toast.success(
        language === "thai" ? "ลบรายการเรียบร้อยแล้ว" : "Record deleted",
      );
      refetch();
      setShowDeleteModal(false);
    } catch (err) {
      toast.error(err?.data?.message || err.error || "Failed to delete");
    }
  };

  const handleShowConfirmModal = (order) => {
    setSelectedOrderId(order.id || order._id);
    setApprovePrice(order.confirmed_price || 0);
    setShowConfirmModal(true);
  };

  const handleApprove = async () => {
    try {
      await updateStatus({
        id: selectedOrderId,
        data: {
          status: "accepted",
          confirmed_price: Number(approvePrice),
        },
      }).unwrap();

      toast.success(
        language === "thai" ? "อนุมัติรายการเรียบร้อย" : "Quote Approved",
      );
      refetch();
      setShowConfirmModal(false);
    } catch (err) {
      toast.error(err?.data?.message || err.error || "Approve failed");
    }
  };

  const handleShowEditModal = (order) => {
    setSelectedOrderId(order.id || order._id);
    setEditFormData({
      confirmed_price: order.confirmed_price || 0,
      status: order.status,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      await updateStatus({
        id: selectedOrderId,
        data: {
          confirmed_price: Number(editFormData.confirmed_price),
          status: editFormData.status,
        },
      }).unwrap();

      toast.success(
        language === "thai" ? "บันทึกราคาเรียบร้อย" : "Price updated",
      );
      refetch();
      setShowEditModal(false);
    } catch (err) {
      toast.error(err?.data?.message || err.error || "Update failed");
    }
  };

  // --- Logic ---
  const filteredOrders = useMemo(() => {
    const ordersRaw =
      data?.data || data?.orders || (Array.isArray(data) ? data : []) || [];
    if (!Array.isArray(ordersRaw)) return [];

    let processed = [...ordersRaw].sort((a, b) => {
      const dateA = new Date(a.created_at || a.createdAt || 0);
      const dateB = new Date(b.created_at || b.createdAt || 0);
      return dateB - dateA;
    });

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      processed = processed.filter(
        (item) =>
          item.projectname?.toLowerCase().includes(lowerTerm) ||
          (item.id || item._id)?.toString().includes(lowerTerm),
      );
    }
    if (filterStatus !== "all") {
      processed = processed.filter((item) => item.status === filterStatus);
    }
    return processed;
  }, [data, searchTerm, filterStatus]);

  const formatPrice = (amount) => {
    if (!amount && amount !== 0) return "฿0.00";
    return `฿${parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 },
  };

  const StatusBadge = ({ status }) => {
    const text = t.status[status] || status;
    switch (status) {
      case "accepted":
        return (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black uppercase tracking-widest shadow-sm shadow-emerald-50">
            <FaCheck size={9} /> {text}
          </div>
        );
      case "rejected":
        return (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-500 border border-rose-100 text-[10px] font-black uppercase tracking-widest shadow-sm shadow-rose-50">
            <FaTimes size={9} /> {text}
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-500 border border-amber-100 text-[10px] font-black uppercase tracking-widest shadow-sm shadow-amber-50">
            <FaClock size={9} className="animate-pulse" /> {text}
          </div>
        );
    }
  };

  if (isLoading && !data)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfdfe]">
        <Loader />
      </div>
    );

  return (
    <div className="min-h-screen bg-[#fcfdfe] pb-24 font-prompt antialiased">
      <div className="px-4 lg:px-12 py-4 md:py-6 md:py-10 max-w-[1600px] mx-auto">
        {/* Premium Header Container */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-14 flex flex-col md:flex-row md:items-end md:justify-between gap-4 md:gap-6 md:gap-10"
        >
          <div className="flex items-center gap-4 md:gap-6 text-start">
            <div className="w-16 h-16 rounded-3xl bg-black flex items-center justify-center text-white shadow-2xl rotate-3">
              <FaMicrochip size={24} />
            </div>
            <div>
              <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight m-0 uppercase leading-none mb-3">
                {t.title}
              </h1>
              <p className="text-slate-400 font-bold m-0 flex items-center gap-3 text-xs uppercase tracking-widest leading-none">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                {t.subtitle}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-white/60 backdrop-blur-xl p-4 rounded-3xl border border-slate-200/50 shadow-xl shadow-slate-100">
            <div className="relative group min-w-[300px]">
              <FaSearch
                className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-black transition-colors"
                size={14}
              />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                className="bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-6 text-[13px] w-full focus:ring-[6px] focus:ring-black/5 transition-all outline-none font-bold text-slate-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="relative group min-w-[180px]">
              <FaFilter
                className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-black transition-colors"
                size={12}
              />
              <select
                className="bg-slate-50 border-none rounded-2xl py-4 pl-11 pr-11 text-[13px] focus:ring-[6px] focus:ring-black/5 transition-all outline-none appearance-none cursor-pointer font-black text-slate-700 w-full uppercase tracking-wider"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">{t.statusAll}</option>
                <option value="pending">{t.status.pending}</option>
                <option value="accepted">{t.status.accepted}</option>
                <option value="rejected">{t.status.rejected}</option>
              </select>
            </div>

            <button
              onClick={refetch}
              disabled={isLoading}
              className="w-14 h-14 flex items-center justify-center rounded-2xl bg-black text-white shadow-xl hover:scale-105 active:scale-95 transition-all disabled:bg-slate-300"
            >
              <FaSync className={isLoading ? "animate-spin" : ""} size={16} />
            </button>
          </div>
        </motion.div>

        {/* Main Content Area */}
        {error ? (
          <div className="bg-white rounded-[3rem] p-12 shadow-xl border border-rose-100">
            <Message variant="danger">
              {error?.data?.message || "Failed to load quotes"}
            </Message>
          </div>
        ) : filteredOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-48 bg-white rounded-[4rem] border-2 border-dashed border-slate-100"
          >
            <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 mb-8 border border-slate-100 shadow-inner">
              <FaBoxOpen size={48} />
            </div>
            <h3 className="text-2xl font-black text-slate-400 uppercase tracking-widest">
              {t.noData}
            </h3>
          </motion.div>
        ) : (
          <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
            {/* Minimalist Data Table */}
            <div className="overflow-x-auto text-start">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="py-4 md:py-8 px-4 md:px-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-center w-24">
                      #
                    </th>
                    <th className="py-4 md:py-8 px-4 md:px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                      {t.headers.project}
                    </th>
                    <th className="py-4 md:py-8 px-4 md:px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-center">
                      {t.headers.qty}
                    </th>
                    <th className="py-4 md:py-8 px-4 md:px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-right">
                      {t.headers.price}
                    </th>
                    <th className="py-4 md:py-8 px-4 md:px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-center">
                      {t.headers.date}
                    </th>
                    <th className="py-4 md:py-8 px-4 md:px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-center">
                      {t.headers.status}
                    </th>
                    <th className="py-4 md:py-8 px-4 md:px-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-center">
                      {t.headers.actions}
                    </th>
                  </tr>
                </thead>
                <motion.tbody
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="divide-y divide-slate-50"
                >
                  {filteredOrders.map((order, idx) => (
                    <motion.tr
                      key={order.id || order._id}
                      variants={itemVariants}
                      className="group hover:bg-slate-50/50 transition-all"
                    >
                      <td className="py-4 md:py-8 px-4 md:px-10 text-center">
                        <span className="text-xs font-black text-slate-300 group-hover:text-black transition-colors tracking-widest">
                          {(idx + 1).toString().padStart(2, "0")}
                        </span>
                      </td>
                      <td className="py-4 md:py-8 px-4 md:px-6">
                        <div className="flex flex-col">
                          <span className="text-[17px] font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase leading-tight mb-2">
                            {order.projectname}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-[9px] font-black bg-slate-100 text-slate-400 px-2 py-0.5 rounded tracking-tighter uppercase whitespace-nowrap">
                              ID: {order.id || order._id}
                            </span>
                            <span className="text-[9px] font-black bg-blue-50 text-blue-400 px-2 py-0.5 rounded tracking-tighter uppercase whitespace-nowrap border border-blue-100/50">
                              CUSTOM TYPE
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 md:py-8 px-4 md:px-6 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="text-lg font-black text-slate-900 leading-none mb-1">
                            {order.pcb_qty || order.qty || 0}
                          </span>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-50">
                            PCS
                          </span>
                        </div>
                      </td>
                      <td className="py-4 md:py-8 px-4 md:px-6 text-right">
                        <div className="flex flex-col items-end">
                          <span
                            className={`text-[19px] font-black leading-none ${order.status === "accepted" ? "text-emerald-600" : "text-slate-300"}`}
                          >
                            {formatPrice(order.confirmed_price)}
                          </span>
                          {order.confirmed_price > 0 && (
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 opacity-50">
                              Incl. VAT
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 md:py-8 px-4 md:px-6 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-[13px] font-black text-slate-600 leading-none mb-1">
                            {new Date(
                              order.created_at || order.createdAt,
                            ).toLocaleDateString(
                              language === "thai" ? "th-TH" : "en-US",
                              { day: "2-digit", month: "short" },
                            )}
                          </span>
                          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">
                            {new Date(
                              order.created_at || order.createdAt,
                            ).getFullYear()}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 md:py-8 px-4 md:px-6 text-center">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="py-4 md:py-8 px-4 md:px-10 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <AnimatePresence mode="wait">
                            {order.status === "pending" && (
                              <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="flex gap-2"
                              >
                                <button
                                  onClick={() => handleShowConfirmModal(order)}
                                  className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center shadow-lg shadow-emerald-500/10 border border-emerald-100"
                                  title={t.btn.confirm}
                                >
                                  <FaCheck size={14} />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedOrderId(order.id || order._id);
                                    setShowRejectModal(true);
                                  }}
                                  className="w-11 h-11 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center shadow-lg shadow-rose-500/10 border border-rose-100"
                                  title={t.btn.reject}
                                >
                                  <FaTimes size={14} />
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <button
                            onClick={() => handleShowEditModal(order)}
                            className="w-11 h-11 rounded-xl bg-slate-50 text-slate-600 hover:bg-black hover:text-white transition-all flex items-center justify-center shadow-lg shadow-slate-200/50 border border-slate-100"
                            title={t.btn.edit}
                          >
                            <FaEdit size={14} />
                          </button>

                          <Link to={`/customcartpcbs/${order.id || order._id}`}>
                            <div className="w-11 h-11 rounded-xl bg-slate-50 text-slate-600 hover:bg-black hover:text-white transition-all flex items-center justify-center shadow-lg shadow-slate-200/50 border border-slate-100">
                              <FaEye size={14} />
                            </div>
                          </Link>

                          <button
                            onClick={() => {
                              setSelectedOrderId(order.id || order._id);
                              setShowDeleteModal(true);
                            }}
                            className="w-11 h-11 rounded-xl bg-slate-50 text-slate-300 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center border border-slate-100"
                          >
                            <FaTrashAlt size={13} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </motion.tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* --- Premium Modals (createPortal) --- */}

      {/* Approve Modal */}
      {showConfirmModal &&
        createPortal(
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowConfirmModal(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              />
            </AnimatePresence>
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-[3.5rem] shadow-3xl w-full max-w-lg p-14 text-center border border-white/20 font-prompt overflow-hidden z-10"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
              <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-inner border border-emerald-100">
                <FaCheck size={36} />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight uppercase leading-none">
                {t.approveModalTitle}
              </h2>
              <p className="text-slate-500 font-bold mb-10 text-sm leading-relaxed max-w-[90%] mx-auto opacity-70 uppercase tracking-widest">
                {t.approveDesc}
              </p>

              <div className="bg-slate-50/80 rounded-[2.5rem] p-4 md:p-8 border border-slate-100 mb-12 text-start">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] block mb-6 px-1">
                  {t.form.priceLabel}
                </label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-400 text-2xl">
                    ฿
                  </span>
                  <input
                    type="number"
                    className="w-full bg-white border-none rounded-[1.5rem] py-4 md:py-6 pl-14 pr-8 font-black text-3xl text-slate-900 shadow-inner focus:ring-[8px] focus:ring-black/5 transition-all outline-none"
                    value={approvePrice}
                    onChange={(e) => setApprovePrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-5 rounded-2xl bg-slate-100 text-slate-500 font-black text-[11px] uppercase tracking-[0.2em] hover:bg-slate-200 transition-all border-none"
                >
                  {t.btn.cancel}
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isStatusUpdating}
                  className="flex-[1.8] py-5 rounded-2xl bg-black text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-900 active:scale-95 transition-all flex items-center justify-center gap-4 border-none"
                >
                  {isStatusUpdating ? (
                    <Loader />
                  ) : (
                    <>
                      {t.btn.confirmAction} <FaChevronRight size={10} />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>,
          document.body,
        )}

      {/* Edit Modal */}
      {showEditModal &&
        createPortal(
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowEditModal(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              />
            </AnimatePresence>
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-[3.5rem] shadow-3xl w-full max-w-lg p-14 text-center border border-white/20 font-prompt overflow-hidden z-10"
            >
              <div className="w-24 h-24 bg-black text-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl rotate-6">
                <FaEdit size={32} />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight uppercase leading-none">
                {t.editModalTitle}
              </h2>
              <p className="text-slate-500 font-bold mb-10 text-xs uppercase tracking-[0.2em]">
                {language === "thai"
                  ? "ปรับเปลี่ยนราคาสำหรับรายการคำขอนี้"
                  : "ADJUST PRICE FOR THIS REQUEST"}
              </p>

              <div className="bg-slate-50/80 rounded-[2.5rem] p-4 md:p-8 border border-slate-100 mb-12 text-start">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] block mb-6 px-1">
                  {t.form.priceLabel}
                </label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-400 text-2xl">
                    ฿
                  </span>
                  <input
                    type="number"
                    className="w-full bg-white border-none rounded-[1.5rem] py-4 md:py-6 pl-14 pr-8 font-black text-3xl text-slate-900 shadow-inner focus:ring-[8px] focus:ring-black/5 transition-all outline-none"
                    value={editFormData.confirmed_price}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        confirmed_price: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-5 rounded-2xl bg-slate-100 text-slate-500 font-black text-[11px] uppercase tracking-[0.2em] hover:bg-slate-200 transition-all border-none"
                >
                  {t.btn.cancel}
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-[1.8] py-5 rounded-2xl bg-black text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-900 transition-all flex items-center justify-center gap-4 border-none"
                >
                  <FaSave size={14} /> {t.btn.save}
                </button>
              </div>
            </motion.div>
          </div>,
          document.body,
        )}

      {/* Delete Modal */}
      {showDeleteModal &&
        createPortal(
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowDeleteModal(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              />
            </AnimatePresence>
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-[3rem] shadow-3xl w-full max-w-sm p-12 text-center border border-white/20 font-prompt z-10"
            >
              <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner border border-rose-100/50">
                <FaExclamationTriangle size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3 uppercase tracking-tight leading-none">
                {t.deleteModalTitle}
              </h3>
              <p className="text-sm text-slate-500 mb-10 font-medium leading-relaxed">
                {t.deleteConfirm}
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-500 font-black text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all rounded-2xl border-none"
                >
                  {t.btn.cancel}
                </button>
                <button
                  onClick={handleDeleteAction}
                  className="flex-1 py-4 bg-rose-600 text-white font-black text-[11px] uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl shadow-rose-200 rounded-2xl border-none"
                >
                  {t.btn.delete}
                </button>
              </div>
            </motion.div>
          </div>,
          document.body,
        )}

      {/* Reject Modal */}
      {showRejectModal &&
        createPortal(
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowRejectModal(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              />
            </AnimatePresence>
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-[3rem] shadow-3xl w-full max-w-sm p-12 text-center border border-white/20 font-prompt z-10"
            >
              <div className="w-20 h-20 bg-rose-50 text-rose-400 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner border border-rose-100/50">
                <FaTimes size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3 uppercase tracking-tight leading-none">
                {t.rejectModalTitle}
              </h3>
              <p className="text-sm text-slate-500 mb-10 font-medium leading-relaxed">
                {t.rejectConfirm}
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-500 font-black text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all rounded-2xl border-none"
                >
                  {t.btn.cancel}
                </button>
                <button
                  onClick={handleRejectAction}
                  className="flex-1 py-4 bg-rose-500 text-white font-black text-[11px] uppercase tracking-widest hover:bg-rose-600 transition-all shadow-xl shadow-rose-100 rounded-2xl border-none"
                >
                  {t.btn.reject}
                </button>
              </div>
            </motion.div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default CustomPCBCartListScreen;
