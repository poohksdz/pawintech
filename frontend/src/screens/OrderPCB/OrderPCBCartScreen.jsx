import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaBoxOpen,
  FaMicrochip,
  FaTrashAlt,
  FaEye,
  FaShieldAlt,
  FaChevronRight,
  FaExclamationTriangle,
  FaTimes,
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import CustomCheckbox from "../../components/CustomCheckbox";
import { removeFromPCBCart } from "../../slices/pcbCartSlice";
import { useGetOrderPCBCartByUserIdQuery, useDeleteOrderpcbCartMutation } from "../../slices/orderpcbCartApiSlice";
import { toast } from "react-toastify";
import Loader from "../../components/Loader";
import Message from "../../components/Message";

const OrderPCBCartScreen = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { userInfo } = useSelector((state) => state.auth);
  const { data: cartData, isLoading, error, refetch } = useGetOrderPCBCartByUserIdQuery(userInfo?._id, {
    skip: !userInfo?._id,
  });
  const [deleteOrderpcbCart] = useDeleteOrderpcbCartMutation();

  const pcbOrderDetails = cartData?.data || [];
  const { language } = useSelector((state) => state.language);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [itemToRemoveId, setItemToRemoveId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewingItem, setViewingItem] = useState(null);

  // Initialize selection: select all ONLY on first load of items
  const [isInitialized, setIsInitialized] = useState(false);
  useEffect(() => {
    if (pcbOrderDetails && pcbOrderDetails.length > 0 && !isInitialized) {
      setSelectedIds(pcbOrderDetails.map((item) => item.id));
      setIsInitialized(true);
    }
  }, [pcbOrderDetails, isInitialized]);

  // Calculate Summary Locally based on selection
  const selectedItems =
    pcbOrderDetails?.filter((item) => selectedIds.includes(item.id)) || [];
  const subTotal = selectedItems.reduce(
    (acc, item) =>
      acc + (parseFloat(item.confirmed_price || item.price || item.total_amount_cost) || 0),
    0,
  );

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === pcbOrderDetails.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pcbOrderDetails.map((item) => item.id));
    }
  };

  const removeFromCartHandler = async (id) => {
    try {
      await deleteOrderpcbCart(id).unwrap();
      refetch();
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
      setShowConfirmModal(false);
      toast.success(
        language === "thai"
          ? "ลบรายการเรียบร้อยแล้ว"
          : "Item removed successfully",
      );
    } catch (err) {
      toast.error(err?.data?.message || "Failed to remove item from cart");
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

    const unapprovedItems = selectedItems.filter(item => item.status !== 'accepted');
    if (unapprovedItems.length > 0) {
      toast.warning(
        language === "thai"
          ? "บางรายการยังไม่ได้รับการอนุมัติราคาจากแอดมิน กรุณารอการตรวจสอบ"
          : "Some items are not yet approved by admin. Please wait for review."
      );
      return;
    }

    // Save to localStorage for Shipping/Payment screens
    const cartDataToSave = {
      pcbOrderDetails: selectedItems,
      shippingAddress: userInfo?.shippingAddress || {},
      billingAddress: userInfo?.billingAddress || {},
      totalPrice: subTotal
    };
    localStorage.setItem("pcbcart", JSON.stringify(cartDataToSave));

    // Redirect to shipping first
    navigate("/login?redirect=/pcbshipping");
  };

  const formatPrice = (price) => {
    if (price === undefined || price === null || isNaN(price)) return "฿0.00";
    return `฿${parseFloat(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

  if (isLoading) return <Loader />;
  if (error) return <Message variant="danger">{error?.data?.message || error.error}</Message>;

  return (
    <div className="font-sans text-slate-800 bg-transparent min-h-[400px] py-0 flex justify-center w-full text-start">
      <div className="w-full flex flex-col lg:flex-row gap-0 overflow-hidden">
        {/*  Left Column: Cart Items */}
        <div className="flex-1 p-0 md:p-6 text-start">
          {/* DESKTOP HEADER (Original) */}
          <div className="hidden md:grid grid-cols-12 py-5 mb-8 border-b border-slate-200 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
            <div className="col-span-1 flex items-center justify-center">
              <CustomCheckbox
                checked={
                  pcbOrderDetails.length > 0 &&
                  selectedIds.length === pcbOrderDetails.length
                }
                onChange={toggleSelectAll}
              />
            </div>
            <div className="col-span-11 grid grid-cols-11 pl-4 gap-2 md:gap-4">
              <div className="col-span-6 font-semibold text-slate-900">
                {language === "thai"
                  ? "รายการ Standard PCB"
                  : "Standard PCB Project"}
              </div>
              <div className="col-span-2 text-right font-semibold pr-4 text-slate-900">
                {language === "thai" ? "จำนวน" : "Qty"}
              </div>
              <div className="col-span-3 text-right font-semibold text-slate-900 md:pr-10">
                {language === "thai" ? "ยอดรวม" : "Subtotal"}
              </div>
            </div>
          </div>

          {/* MOBILE HEADER (Premium Simple) */}
          <div className="md:hidden flex items-center justify-between px-4 py-4 mb-2 bg-slate-50/50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-3">
              <CustomCheckbox
                checked={pcbOrderDetails.length > 0 && selectedIds.length === pcbOrderDetails.length}
                onChange={toggleSelectAll}
              />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">
                {language === "thai" ? "เลือกทั้งหมด" : "Select All"}
              </span>
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {pcbOrderDetails.length} {language === "thai" ? "รายการ" : "Items"}
            </span>
          </div>

          <div className="space-y-4 md:space-y-6 min-h-[200px]">
            <AnimatePresence>
              {!pcbOrderDetails || pcbOrderDetails.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-20 text-center flex flex-col items-center justify-center"
                >
                  <FaBoxOpen size={48} className="text-gray-200 mb-4" />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {language === "thai"
                      ? "ไม่มีสินค้าในตะกร้าของคุณ"
                      : "Your PCB cart is empty"}
                  </h3>
                  <Link
                    to="/orderpcb"
                    className="text-blue-500 hover:text-black hover:underline mt-4 tracking-wide uppercase font-bold text-[12px] transition-colors"
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
                  {pcbOrderDetails.map((item, index) => (
                    <motion.div
                      key={`${item.id}-${index}`}
                      variants={itemVariants}
                      layout
                      className="pb-4 md:pb-6 border-b border-slate-100 relative group"
                    >
                      {/* --- MOBILE VIEW: PREMIUM TRUE BLACK CARD --- */}
                      <div className="md:hidden flex flex-col w-full bg-[#0a0a0a] border border-zinc-900 p-6 rounded-[2.5rem] shadow-2xl overflow-hidden mb-6 relative group active:scale-[0.98] transition-all duration-300">
                        {/* Selection Overlay */}
                        <div className="absolute top-6 left-6 z-20">
                          <CustomCheckbox
                            checked={selectedIds.includes(item.id)}
                            onChange={() => toggleSelect(item.id)}
                          />
                        </div>

                        {/* Status Badge Top Right */}
                        <div className="absolute top-6 right-6 z-20">
                          <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm border ${item.status === 'accepted' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : item.status === 'pending' ? 'bg-amber-50 text-amber-500 border-amber-100 animate-pulse' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                            {item.status.toUpperCase()}
                          </span>
                        </div>

                        {/* Icon Section */}
                        <div className="w-full h-32 bg-[#111111] rounded-[2rem] flex items-center justify-center overflow-hidden mb-5 border border-zinc-800/50">
                          <FaMicrochip size={48} className="text-zinc-800" />
                        </div>

                        {/* Project Info */}
                        <div className="flex flex-col mb-6">
                          <h3 className="text-[18px] font-black text-white uppercase tracking-tight leading-tight mb-1">
                            {item.projectname || "Untitled Project"}
                          </h3>
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
                            ID: {item.id} • STANDARD PCB
                          </span>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-3 gap-2 mb-6">
                          <div className="bg-zinc-900/50 p-3 rounded-2xl border border-zinc-800/30 flex flex-col items-center text-center">
                            <span className="text-[7px] font-black text-zinc-500 uppercase tracking-widest mb-1">Layers</span>
                            <span className="text-[11px] font-black text-white">{item.layers || 1}L</span>
                          </div>
                          <div className="bg-zinc-900/50 p-3 rounded-2xl border border-zinc-800/30 flex flex-col items-center text-center">
                            <span className="text-[7px] font-black text-zinc-500 uppercase tracking-widest mb-1">Quantity</span>
                            <span className="text-[11px] font-black text-white">{item.pcb_qty || item.pcb_quantity} PCS</span>
                          </div>
                          <div className="bg-zinc-900/50 p-3 rounded-2xl border border-zinc-800/30 flex flex-col items-center text-center overflow-hidden">
                            <span className="text-[7px] font-black text-zinc-500 uppercase tracking-widest mb-1 text-center">Size (mm)</span>
                            <span className="text-[10px] font-black text-white truncate w-full">{item.length_cm}x{item.width_cm}</span>
                          </div>
                        </div>

                        {/* Action Bar */}
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 flex flex-col bg-indigo-500/10 p-4 rounded-2xl border border-indigo-500/20">
                            <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Subtotal</span>
                            <span className="text-[18px] font-black text-indigo-400 leading-none">
                              {formatPrice(item.confirmed_price || item.price || item.total_amount_cost)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setViewingItem(item)}
                              className="w-14 h-14 bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center justify-center rounded-2xl hover:text-white transition-all"
                            >
                              <FaEye size={18} />
                            </button>
                            <button
                              onClick={() => { setItemToRemoveId(item.id); setShowConfirmModal(true); }}
                              className="w-14 h-14 bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center rounded-2xl hover:bg-rose-500 hover:text-white transition-all"
                            >
                              <FaTrashAlt size={18} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* --- DESKTOP VIEW (Original Style) --- */}
                      <div className="hidden md:grid md:grid-cols-12 gap-3 md:gap-4 items-start md:items-center w-full px-2 md:px-0">
                        {/* Checkbox */}
                        <div className="col-span-1 flex items-center justify-center shrink-0 pt-1 md:pt-0">
                          <CustomCheckbox
                            checked={selectedIds.includes(item.id)}
                            onChange={() => toggleSelect(item.id)}
                          />
                        </div>

                        {/* Unified Content Container */}
                        <div className="col-span-11 flex-1 grid grid-cols-1 md:grid-cols-11 items-center gap-2 md:gap-4 min-w-0">
                          {/* Image and Details Stack */}
                          <div className="col-span-6 flex flex-col md:flex-row gap-3 md:gap-5 w-full">
                            {/* Top row: Image + Name/SKU */}
                            <div className="flex gap-3 md:gap-5 items-start md:items-center w-full">
                              {/* Image */}
                              <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-50 shrink-0 flex items-center justify-center overflow-hidden rounded-xl border border-slate-100 shadow-sm group-hover:shadow-md transition-all duration-300">
                                <FaMicrochip
                                  size={24}
                                  className="text-slate-200"
                                />
                              </div>

                              {/* Details Context */}
                              <div className="flex flex-col flex-1 min-w-0 py-0.5 md:py-0 text-start md:pr-6 relative">
                                <h3 className="text-[13px] md:text-[14px] font-black text-slate-900 uppercase leading-snug mb-0.5 truncate block w-full pr-6 md:pr-0">
                                  {item.projectname || "Standard PCB Project"}
                                </h3>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${item.status === 'accepted' ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' : item.status === 'pending' ? 'bg-amber-100 text-amber-600 border border-amber-200' : 'bg-rose-100 text-rose-600 border border-rose-200'}`}>
                                    {item.status.toUpperCase()}
                                  </span>
                                </div>
                                <span className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate block w-full">
                                  ID: {item.id} • {item.layers || 1} Layer •{" "}
                                  {item.pcb_qty || item.pcb_quantity} PCS •{" "}
                                  {item.length_cm}x{item.width_cm} mm
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* --- DESKTOP ONLY COLUMNS --- */}
                          <div className="hidden md:block col-span-2 text-right">
                            <span className="font-bold text-[14px] text-slate-900">
                              {item.pcb_quantity || 0} PCS
                            </span>
                          </div>

                          <div className="hidden md:flex col-span-3 items-center justify-end gap-3 text-right">
                            <span className="font-black text-[16px] text-slate-900 mr-2">
                              {formatPrice(
                                item.confirmed_price || item.price || item.total_amount_cost,
                              )}
                            </span>
                            <button
                              onClick={() => setViewingItem(item)}
                              className="p-2 text-slate-300 hover:text-black hover:bg-slate-50 rounded-full transition-all duration-200"
                              title="View Details"
                            >
                              <FaEye size={14} />
                            </button>
                            <button
                              onClick={() => {
                                setItemToRemoveId(item.id);
                                setShowConfirmModal(true);
                              }}
                              className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all duration-200"
                              title="Remove Project"
                            >
                              <FaTrashAlt size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200/50">
            <Link
              to="/orderpcb"
              className="text-[11px] font-black text-slate-400 hover:text-black transition-colors uppercase tracking-[0.2em] flex items-center gap-2"
            >
              +{" "}
              {language === "thai"
                ? "สั่งผลิตเพื่มเติม"
                : "Add Another Project"}
            </Link>
          </div>
        </div>

        {/*  Right Column: Summary  */}
        <div className="w-full lg:w-[350px] bg-slate-50/30 p-8 lg:p-10 shrink-0 flex flex-col text-start">
          <h2 className="text-[14px] font-black text-slate-900 uppercase tracking-widest mb-10 flex items-center gap-3">
            {language === "thai" ? "สรุปคำสั่งซื้อ" : "Order Summary"}
            <div className="h-px bg-slate-200 flex-grow" />
          </h2>

          <div className="flex flex-col flex-grow relative z-10">
            <div className="space-y-4 mb-10">
              <div className="flex justify-between items-center text-[11px] font-black text-slate-400 uppercase tracking-widest">
                <span>
                  {language === "thai" ? "จำนวนรายการ" : "Total Items"}
                </span>
                <span className="text-slate-900">
                  {pcbOrderDetails?.length}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px] font-black text-slate-400 uppercase tracking-widest">
                <span>{language === "thai" ? "เลือกแล้ว" : "Selected"}</span>
                <span className="text-blue-600 font-black">
                  {selectedIds.length}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px] font-black text-slate-400 uppercase tracking-widest">
                <span>{language === "thai" ? "ราคาสินค้า" : "Subtotal"}</span>
                <span className="text-slate-900 font-black">
                  {formatPrice(subTotal)}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-8">
              <button
                onClick={checkoutHandler}
                disabled={selectedIds.length === 0}
                className={`w-full py-3 rounded-none text-[12px] font-black tracking-[0.2em] uppercase transition-all shadow-xl flex items-center justify-center gap-3 group mb-8
                                    ${selectedIds.length > 0
                    ? "bg-black text-white hover:bg-slate-900 active:scale-[0.98]"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                  }
                                `}
              >
                {language === "thai"
                  ? "ชำระเงินตามที่เลือก"
                  : "Checkout Selected"}
                <FaChevronRight
                  className={`text-[10px] transition-transform ${selectedIds.length > 0 ? "group-hover:translate-x-1" : ""}`}
                />
              </button>

              <div className="flex justify-between items-end mb-8">
                <div className="flex flex-col">
                  <span className="text-[14px] font-black text-slate-900 uppercase tracking-wide">
                    {language === "thai" ? "ยอดรวมสุทธิ" : "Grand Total"}
                  </span>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">
                    {language === "thai" ? "(รวมภาษีแล้ว)" : "(VAT Included)"}
                  </span>
                </div>
                <span className="font-black text-slate-900 text-[26px] tracking-tighter leading-none mb-[-2px]">
                  {formatPrice(subTotal)}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-center gap-2 text-slate-300">
                <FaShieldAlt size={12} />
                <span className="text-[9px] font-black uppercase tracking-[0.3em]">
                  Secure Transaction
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Confirm Delete Modal  */}

        {showConfirmModal &&
          createPortal(
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden"
              style={{ width: "100vw", height: "100vh", top: 0, left: 0 }}
            >
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
                className="relative bg-white rounded-[3rem] shadow-3xl w-full max-sm:w-full max-w-sm p-12 text-center border border-white/20 font-prompt z-10"
              >
                <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner border border-rose-100/50">
                  <FaExclamationTriangle size={32} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-3 uppercase tracking-tight leading-none">
                  {language === "thai" ? "ลบรายการ?" : "Remove Item?"}
                </h3>
                <p className="text-sm text-slate-500 mb-10 font-medium leading-relaxed">
                  {language === "thai"
                    ? "คุณแน่ใจหรือไม่ที่จะลบรายการนี้ออกจากตะกร้า?"
                    : "Are you sure you want to remove this project from your cart?"}
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 py-4 bg-slate-100 text-slate-500 font-black text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all rounded-2xl border-none"
                  >
                    {language === "thai" ? "ยกเลิก" : "Cancel"}
                  </button>
                  <button
                    onClick={() => removeFromCartHandler(itemToRemoveId)}
                    className="flex-1 py-4 bg-rose-600 text-white font-black text-[11px] uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl shadow-rose-200 rounded-2xl border-none"
                  >
                    {language === "thai" ? "ยืนยันการลบ" : "Remove"}
                  </button>
                </div>
              </motion.div>
            </div>,
            document.body,

          )}

        {/* View Details Modal  */}

        {viewingItem &&
          createPortal(
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden"
              style={{ width: "100vw", height: "100vh", top: 0, left: 0 }}
            >
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setViewingItem(null)}
                  className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                />
              </AnimatePresence>
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative bg-white rounded-[3rem] shadow-3xl w-full max-w-lg overflow-hidden border border-white/20 font-prompt z-10 flex flex-col max-h-[90vh]"
              >
                <div className="bg-slate-50 p-8 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight m-0">
                    Project Details
                  </h3>
                  <button
                    onClick={() => setViewingItem(null)}
                    className="w-10 h-10 bg-white shadow-sm border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-100 transition-all"
                  >
                    <FaTimes />
                  </button>
                </div>
                <div className="p-8 overflow-y-auto custom-scrollbar">
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(viewingItem)
                      .filter(([k]) =>
                        [
                          "projectname",
                          "base_material",
                          "layers",
                          "pcb_quantity",
                          "thickness_mm",
                          "color",
                          "silkscreen_color",
                          "surface_finish",
                          "copper_weight_oz",
                          "gerberZip",
                        ].includes(k),
                      )
                      .map(([key, value]) => {
                        const labelMap = {
                          projectname: "Project Name",
                          base_material: "Material",
                          layers: "Layers",
                          pcb_quantity: "Quantity",
                          thickness_mm: "Thickness",
                          color: "PCB Color",
                          silkscreen_color: "Silk Screen",
                          surface_finish: "Surface Finish",
                          copper_weight_oz: "Copper Weight",
                          gerberZip: "Gerber File",
                        };
                        const displayValue =
                          key === "gerberZip"
                            ? String(value).split(/[/\\]/).pop()
                            : String(value);

                        return (
                          <div
                            key={key}
                            className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 hover:bg-white transition-colors"
                          >
                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                              {labelMap[key] || key}
                            </span>
                            <span className="font-black text-slate-900 text-sm block break-all">
                              {displayValue}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                  <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      Total for this item
                    </span>
                    <span className="text-xl font-black text-slate-900">
                      {formatPrice(
                        viewingItem.price || viewingItem.total_amount_cost,
                      )}
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>,
            document.body,

          )}
      </div>
    </div>
  );
};

export default OrderPCBCartScreen;
