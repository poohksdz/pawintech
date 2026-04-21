import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaBoxOpen,
  FaCopy,
  FaTrashAlt,
  FaShieldAlt,
  FaChevronRight,
  FaExclamationTriangle,
  FaDownload,
  FaReceipt,
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import Loader from "../../components/Loader";
import Message from "../../components/Message";
import CustomCheckbox from "../../components/CustomCheckbox";
import {
  useGetcopyCartByUserIDQuery,
  useDeletecopycartMutation,
} from "../../slices/copypcbCartApiSlice";
import { useGetDefaultInvoiceUsedQuery } from "../../slices/defaultInvoicesApiSlice";
import FullTaxInvoiceA4 from "../../components/FullTaxInvoiceA4";
import { toast } from "react-toastify";
import { BASE_URL as APP_BASE_URL } from "../../constants";
import { FaPrint } from "react-icons/fa";

const CopyPCBCartScreen = () => {
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);
  const { language } = useSelector((state) => state.language);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [cancelTargetId, setCancelTargetId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const { data, isLoading, error, refetch } = useGetcopyCartByUserIDQuery(
    userInfo?._id,
    {
      skip: !userInfo?._id,
      refetchOnMountOrArgChange: true,
    },
  );

  const [deleteCartItem] = useDeletecopycartMutation();

  const validOrders = useMemo(
    () =>
      data?.data
        ?.filter((order) => order.pcb_qty > 0)
        ?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) || [],
    [data],
  );

  // Initialize selection: select all ONLY on first load of items
  const [isInitialized, setIsInitialized] = useState(false);
  useEffect(() => {
    if (validOrders && validOrders.length > 0 && !isInitialized) {
      setSelectedIds(validOrders.map((item) => item.id));
      setIsInitialized(true);
    }
  }, [validOrders, isInitialized]);

  // Calculate Summary Locally based on selection
  const selectedItems = validOrders.filter((item) =>
    selectedIds.includes(item.id),
  );
  const totalConfirmedPrice = selectedItems.reduce(
    (acc, order) => acc + (parseFloat(order.confirmed_price) || 0),
    0,
  );
  const acceptedItems = selectedItems.filter((o) => o.status === "accepted");

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === validOrders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(validOrders.map((item) => item.id));
    }
  };

  const handleCancel = async () => {
    if (!cancelTargetId) return;
    try {
      await deleteCartItem(cancelTargetId).unwrap();
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== cancelTargetId));
      refetch();
      setShowConfirmModal(false);
      setCancelTargetId(null);
      toast.success(
        language === "thai"
          ? "ลบรายการเรียบร้อยแล้ว"
          : "Item removed successfully",
      );
    } catch (err) {
      toast.error(err?.data?.message || "ไม่สามารถลบรายการได้");
    }
  };

  const checkoutHandler = () => {
    if (selectedIds.length === 0) {
      toast.warning(
        language === "thai"
          ? "กรุณาเลือกรายการที่ต้องการชำระเงิน"
          : "Please select items to checkout",
      );
      return;
    }
    if (acceptedItems.length === 0) {
      toast.info(
        language === "thai"
          ? "รายการที่เลือกยังไม่ได้รับการอนุมัติ"
          : "Selected items are not approved yet.",
      );
      return;
    }
    // Proceed with the first accepted item from the selection
    navigate(
      `/login?redirect=/copypcbshipping/${acceptedItems[0].id}?amount=${acceptedItems[0].confirmed_price}`,
    );
  };

  const formatPrice = (price, status) => {
    if (price === undefined || price === null || isNaN(price) || price === 0) {
      if (status === "accepted" || status === "paid") return "฿0.00";
      return language === "thai" ? "รอประเมินราคา" : "Wait for Quotation";
    }
    return `฿${parseFloat(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getFullUrl = (pathInput) => {
    if (!pathInput) return null;
    const path =
      typeof pathInput === "object"
        ? pathInput.path || pathInput.url
        : pathInput;
    if (!path || typeof path !== "string") return null;
    if (path.startsWith("http")) return path;
    let normalizedPath = path.replace(/\\/g, "/");
    if (!normalizedPath.startsWith("/")) normalizedPath = "/" + normalizedPath;
    const baseUrl =
      process.env.NODE_ENV === "development"
        ? "http://localhost:5000"
        : APP_BASE_URL || "";
    return `${baseUrl}${normalizedPath}`;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 25 },
    },
  };

  if (isLoading)
    return (
      <div className="min-h-screen flex justify-center items-center bg-[#fcfdfe]">
        <Loader />
      </div>
    );

  return (
    <div className="font-sans text-slate-800 bg-transparent min-h-[400px] py-0 flex justify-center w-full text-start">
      <div className="w-full flex flex-col lg:flex-row gap-0 overflow-hidden">
        {/*  Left Column: Project Items */}
        <div className="flex-1 p-0 md:p-6 bg-white text-start">
          {/* DESKTOP HEADER (Premium Black) */}
          <div className="hidden md:grid grid-cols-12 py-5 mb-8 bg-black text-[11px] font-black uppercase tracking-[0.2em] text-white rounded-t-[2rem] shadow-lg border-b border-white/10">
            <div className="col-span-1 flex items-center justify-center">
              <CustomCheckbox
                checked={
                  validOrders.length > 0 &&
                  selectedIds.length === validOrders.length
                }
                onChange={toggleSelectAll}
                variant="white"
              />
            </div>
            <div className="col-span-11 grid grid-cols-11 pl-4 gap-3 md:gap-4">
              <div className="col-span-1 md:col-span-4 flex items-center text-white/90 text-start uppercase tracking-wider whitespace-nowrap">
                {language === "thai"
                  ? "รายการสั่งทำ Copy PCB / PROJECT"
                  : "STANDARD COPY PCB ORDER"}
              </div>
              <div className="col-span-1 md:col-span-1 text-right font-black pr-4 text-white/90 uppercase tracking-wider whitespace-nowrap">
                {language === "thai" ? "จำนวน / QTY" : "QTY"}
              </div>
              <div className="col-span-1 md:col-span-3 text-center font-black text-white/90 uppercase tracking-wider whitespace-nowrap">
                {language === "thai" ? "สถานะ / STATUS" : "STATUS"}
              </div>
              <div className="col-span-1 md:col-span-3 text-right font-black text-white uppercase tracking-wider whitespace-nowrap md:pr-10">
                {language === "thai" ? "ราคาประเมิน / PRICE" : "PRICE"}
              </div>
            </div>
          </div>

          {/* MOBILE HEADER (Premium Simple) */}
          <div className="md:hidden flex items-center justify-between px-4 py-4 mb-2 bg-slate-50/50 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">
              {language === "thai" ? "ตะกร้า Copy PCB" : "Copy PCB Cart"}
            </span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {validOrders.length} {language === "thai" ? "รายการ" : "Items"}
            </span>
          </div>

          <div className="space-y-4 md:space-y-6 min-h-[200px]">
            {error ? (
              <Message variant="danger">
                {error?.data?.message || error.error}
              </Message>
            ) : validOrders.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-24"
              >
                <div className="w-20 h-20 flex items-center justify-center text-slate-200 mb-4">
                  <FaBoxOpen size={48} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 capitalize m-0 tracking-tight text-center mb-2">
                  {language === "thai"
                    ? "ไม่มีสินค้าในตะกร้าของคุณ"
                    : "Your cart is empty"}
                </h3>
                <Link
                  to="/copypcb"
                  className="mt-8 text-blue-600 font-bold text-sm hover:underline hover:text-blue-700 transition-all"
                >
                  {language === "thai"
                    ? "เริ่มสั่งผลิตใหม่"
                    : "Start New Order"}
                </Link>
              </motion.div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-6"
              >
                {validOrders.map((order, index) => {
                  return (
                    <motion.div
                      key={`${order.id}-${index}`}
                      variants={itemVariants}
                      layout
                      className="border-b border-slate-100 pb-4 md:pb-6 relative group"
                    >
                      {/* --- MOBILE VIEW: REFINED COMPACT WHITE CARD --- */}
                      <div className="md:hidden flex flex-col w-full bg-white border border-slate-200 p-4 rounded-3xl shadow-sm mb-4 relative group active:scale-[0.98] transition-all duration-300">
                        {/* Status Badge Row */}
                        <div className="flex justify-end items-start mb-3">
                          <div className="flex gap-2 items-center">
                            {order.status === "accepted" ? (
                              <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] font-black uppercase tracking-widest shadow-sm">
                                <FaShieldAlt size={8} /> {language === "thai" ? "อนุมัติแล้ว" : "Approved"}
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50 text-amber-500 border border-amber-100 text-[9px] font-black uppercase tracking-widest shadow-sm animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                {language === "thai" ? "รอตรวจสอบ" : "Pending"}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-4 items-center">
                          {/* Image section */}
                          <div className="w-24 h-24 shrink-0 bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100 rounded-[1.25rem]">
                            {order.front_image_1 ? (
                              <img src={getFullUrl(order.front_image_1)} alt="PCB" className="w-full h-full object-contain p-2" />
                            ) : (
                              <FaCopy size={32} className="text-slate-300" />
                            )}
                          </div>

                          {/* Details Section */}
                          <div className="flex flex-col flex-1 min-w-0">
                            <Link to={`/copycartpcb/${order.id}`} className="text-sm font-bold text-slate-800 uppercase tracking-tight leading-snug mb-0.5 line-clamp-2">
                              {order.projectname || "Untitled Project"}
                            </Link>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                              ID: {order.id} • COPY PCB
                            </span>

                            {/* Action Row */}
                            <div className="flex justify-between items-end mt-auto gap-3">
                              <div className="flex flex-col">
                                <span className="text-[15px] font-black text-blue-600">{formatPrice(order.confirmed_price, order.status)}</span>
                                <span className="text-[10px] font-bold text-slate-400">{order.pcb_qty} PCS</span>
                              </div>

                              <div className="flex items-center gap-2">
                                {order.copypcb_zip && (
                                  <a
                                    href={getFullUrl(order.copypcb_zip)}
                                    download
                                    className="w-8 h-8 bg-slate-50 border border-slate-200 text-blue-500 flex items-center justify-center rounded-xl hover:bg-white transition-all shadow-sm"
                                  >
                                    <FaDownload size={14} />
                                  </a>
                                )}
                                {order.quotation_no && (
                                  <Link
                                    to={`/copypcb/${order.quotation_no}`}
                                    target="_blank"
                                    className="w-8 h-8 bg-blue-50 border border-blue-100 text-blue-500 flex items-center justify-center rounded-xl hover:bg-white transition-all shadow-sm"
                                    title="View Quotation"
                                  >
                                    <FaReceipt size={14} />
                                  </Link>
                                )}{" "}
                                <button
                                  onClick={() => {
                                    setCancelTargetId(order.id);
                                    setShowConfirmModal(true);
                                  }}
                                  className="w-8 h-8 bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center rounded-xl hover:bg-white transition-all shadow-sm"
                                >
                                  <FaTrashAlt size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* --- DESKTOP VIEW (Original Style) --- */}
                      <div className="hidden md:grid md:grid-cols-12 gap-3 md:gap-4 items-start md:items-center w-full px-2 md:px-0">
                        {/* Checkbox Placeholder */}
                        <div className="col-span-1 flex items-center justify-center shrink-0 pt-1 md:pt-0" />

                        {/* Unified Content Container */}
                        <div className="col-span-11 flex-1 grid grid-cols-1 md:grid-cols-11 items-center gap-3 md:gap-4 min-w-0">
                          {/* Image and Details Stack */}
                          <div className="col-span-4 flex flex-col md:flex-row gap-3 md:gap-5 w-full">
                            {/* Top row: Image + Name/SKU */}
                            <div className="flex gap-3 md:gap-5 items-start md:items-center w-full">
                              {/* Image */}
                              <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-50 shrink-0 flex items-center justify-center overflow-hidden rounded-xl border border-slate-100 shadow-sm group-hover:shadow-md transition-all duration-300">
                                {order.front_image_1 ? (
                                  <img
                                    src={getFullUrl(order.front_image_1)}
                                    alt="PCB"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <FaCopy
                                    size={24}
                                    className="text-slate-200"
                                  />
                                )}
                              </div>

                              {/* Details Context */}
                              <div className="flex flex-col flex-1 min-w-0 py-0.5 md:py-0 text-start md:pr-6 relative">
                                <Link
                                  to={`/copycartpcb/${order.id}`}
                                  className="text-[13px] md:text-[14px] font-black text-slate-900 uppercase hover:text-blue-600 transition-colors leading-snug mb-0.5 truncate block w-full pr-6 md:pr-0"
                                >
                                  {order.projectname || "UNTITLED PROJECT"}
                                </Link>
                                <span className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate block w-full">
                                  ID: {order.id} •{" "}
                                  {language === "thai"
                                    ? "สั่งทำตามตัวอย่าง"
                                    : "COPY PCB"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* --- DESKTOP ONLY COLUMNS --- */}
                          <div className="hidden md:block col-span-1 text-right pr-4">
                            <span className="font-bold text-[14px] text-slate-900">
                              {order.pcb_qty} PCS
                            </span>
                          </div>

                          <div className="hidden md:flex col-span-3 justify-center">
                            {order.status === "accepted" ? (
                              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 text-slate-900 border border-slate-200 text-[9px] font-black uppercase tracking-tight whitespace-nowrap">
                                <FaShieldAlt size={8} />{" "}
                                {language === "thai"
                                  ? "อนุมัติแล้ว"
                                  : "Approved"}
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-50 text-slate-400 border border-slate-100 text-[9px] font-black uppercase tracking-tight whitespace-nowrap">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-pulse" />
                                {language === "thai"
                                  ? "รอตรวจสอบ"
                                  : "Pending Review"}
                              </div>
                            )}
                          </div>

                          <div className="hidden md:flex col-span-3 items-center justify-end gap-3 text-right md:pr-10">
                            <span className="font-bold text-[16px] text-slate-900 leading-none whitespace-nowrap">
                              {formatPrice(order.confirmed_price, order.status)}
                            </span>
                            {order.quotation_no && (
                              <Link
                                to={`/copypcb/${order.quotation_no}`}
                                target="_blank"
                                className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200"
                                title="View Quotation"
                              >
                                <FaReceipt size={14} />
                              </Link>
                            )}
                            {order.copypcb_zip && (
                              <a
                                href={getFullUrl(order.copypcb_zip)}
                                download
                                className="p-2 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-all duration-200"
                                title="Download Files"
                              >
                                <FaDownload size={14} />
                              </a>
                            )}
                            {order.status !== "paid" && (
                              <button
                                onClick={() => {
                                  setCancelTargetId(order.id);
                                  setShowConfirmModal(true);
                                }}
                                className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all duration-200"
                                title="Cancel/Remove Order"
                              >
                                <FaTrashAlt size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>

          {/* 'Add Another' link removed */}
        </div>

        {/*  Right Column: Summary */}
        <div className="w-full lg:w-[350px] bg-white border-l border-slate-200/60 p-4 md:p-8 lg:p-10 shrink-0 flex flex-col text-start">
          <h2 className="text-[14px] font-bold text-slate-800 uppercase tracking-[0.2em] mb-10">
            {language === "thai" ? "SUMMARY" : "SUMMARY"}
          </h2>

          <div className="flex flex-col flex-grow relative z-10">
            <div className="space-y-6 mb-10">
              <div className="flex justify-between items-center text-[12px] font-bold text-slate-400 uppercase tracking-wider">
                <span>{language === "thai" ? "SUBTOTAL" : "SUBTOTAL"}</span>
                <span className="text-slate-800">
                  {formatPrice(totalConfirmedPrice)}
                </span>
              </div>

              <div className="pt-6">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 block">
                  {language === "thai"
                    ? `SELECTED ${selectedIds.length} ITEMS`
                    : `SELECTED ${selectedIds.length} ITEMS`}
                </span>

                <button
                  onClick={checkoutHandler}
                  disabled={
                    selectedIds.length === 0 || acceptedItems.length === 0
                  }
                  className={`w-full py-4 rounded-xl text-[13px] font-black tracking-[0.1em] uppercase transition-all flex items-center justify-center gap-3 mb-4
                                        ${selectedIds.length > 0 &&
                      acceptedItems.length > 0
                      ? "bg-black text-white hover:bg-zinc-900 shadow-xl hover:shadow-2xl active:scale-[0.98]"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    }
                                    `}
                >
                  {language === "thai"
                    ? "ชำระเงินตามที่เลือก"
                    : "Checkout Selected"}
                </button>

              </div>

              {/* Evaluation Info Box */}
              <div className="bg-[#f8fafc] border border-slate-200 rounded-xl p-4 md:p-6 space-y-4">
                <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">
                  {language === "thai"
                    ? "การประเมินเบื้องต้น"
                    : "ASSEMBLY EVALUATION"}
                </h4>
                <p className="text-[11px] font-medium text-slate-500 leading-relaxed uppercase tracking-wide">
                  {language === "thai"
                    ? "ช่างเทคนิคของเราต้องตรวจสอบไฟล์ด้วยตนเองเพื่อให้ใบเสนอราคาที่ถูกต้องในขั้นตอนสุดท้าย"
                    : "Our technicians must manually verify the files to provide a final accurate quotation."}
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2">
                  {language === "thai"
                    ? "โดยปกติจะเสร็จสิ้นภายใน 24-48 ชั่วโมง"
                    : "USUALLY COMPLETED WITHIN 24-48 HOURS."}
                </p>
              </div>
            </div>

            <div className="mt-auto border-t border-slate-100 pt-8">
              <div className="flex justify-between items-center">
                <span className="text-[13px] font-bold text-slate-800 uppercase tracking-[0.15em]">
                  {language === "thai" ? "ORDER TOTAL" : "ORDER TOTAL"}
                </span>
                <span className="font-bold text-slate-900 text-2xl tracking-tighter">
                  {formatPrice(totalConfirmedPrice)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <FaExclamationTriangle size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">
                  {language === "thai" ? "ยืนยันการลบ" : "Confirm Deletion"}
                </h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">
                  {language === "thai"
                    ? "คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้ออกจากตะกร้า? การดำเนินการนี้ไม่สามารถย้อนกลับได้"
                    : "Are you sure you want to remove this item? This action cannot be undone."}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="py-3 px-6 rounded-xl text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    {language === "thai" ? "ยกเลิก" : "Cancel"}
                  </button>
                  <button
                    onClick={() => handleCancel(cancelTargetId)}
                    className="py-3 px-6 rounded-xl text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-200 transition-all active:scale-95"
                  >
                    {language === "thai" ? "ลบรายการ" : "Delete"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default CopyPCBCartScreen;
