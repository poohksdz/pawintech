import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import {
  FaTrashAlt,
  FaInfoCircle,
  FaCheckCircle,
  FaTimesCircle,
  FaBoxOpen,
  FaRobot,
  FaDownload,
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import Loader from "../../components/Loader";
import Message from "../../components/Message";
import CustomCheckbox from "../../components/CustomCheckbox";
import {
  useGetAssemblyCartByUserIDQuery,
  useDeleteAssemblycartMutation,
} from "../../slices/assemblypcbCartApiSlice";
import { toast } from "react-toastify";
import { BASE_URL as APP_BASE_URL } from "../../constants";

const OrderAssemblyCartScreen = () => {
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);
  const { language } = useSelector((state) => state.language);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [cancelTargetId, setCancelTargetId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const { data, isLoading, error, refetch } = useGetAssemblyCartByUserIDQuery(
    userInfo?._id,
    {
      skip: !userInfo?._id,
      refetchOnMountOrArgChange: true,
    },
  );

  const [deleteAssemblycart] = useDeleteAssemblycartMutation();

  const validOrders = useMemo(
    () => data?.data?.filter((order) => order.pcb_qty > 0) || [],
    [data],
  );

  // Initialize selection
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
  const subTotal = selectedItems.reduce((acc, item) => {
    const price =
      item.status === "accepted"
        ? parseFloat(item.confirmed_price) || 0
        : parseFloat(item.estimatedCost) || 0;
    return acc + price;
  }, 0);
  const acceptedItemsCount = selectedItems.filter(
    (o) => o.status === "accepted",
  ).length;

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
    try {
      await deleteAssemblycart(cancelTargetId).unwrap();
      setSelectedIds(selectedIds.filter((id) => id !== cancelTargetId));
      toast.success(
        language === "thai"
          ? "ลบรายการเรียบร้อยแล้ว"
          : "Item removed successfully",
      );
      refetch();
      setShowConfirmModal(false);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to remove item");
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
    if (acceptedItemsCount === 0) {
      toast.info(
        language === "thai"
          ? "รายการที่เลือกยังไม่ได้รับการอนุมัติ"
          : "Selected items are not approved yet.",
      );
      return;
    }

    // Save to localStorage like pcbcart
    const assemblycart = {
      assemblyOrderDetails: selectedItems,
      shippingPrice: 0,
      totalPrice: subTotal,
    };
    localStorage.setItem("assemblycart", JSON.stringify(assemblycart));

    navigate("/login?redirect=/assemblypcbshipping");
  };

  const formatPrice = (price, status) => {
    if (price === undefined || price === null || isNaN(price) || price === 0) {
      if (status === "accepted" || status === "paid") return "฿0.00";
      return language === "thai" ? "รอประเมินราคา" : "Wait for Quotation";
    }
    return `฿${parseFloat(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "accepted":
        return (
          <span className="inline-flex items-center gap-1.5 text-gray-900 bg-gray-100 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border border-gray-200 whitespace-nowrap">
            <FaCheckCircle className="text-gray-900" />{" "}
            {language === "thai" ? "อนุมัติแล้ว" : "Approved"}
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 text-gray-400 bg-gray-50 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border border-gray-100 whitespace-nowrap">
            <FaTimesCircle /> {language === "thai" ? "ปฏิเสธ" : "Rejected"}
          </span>
        );
      case "paid":
        return (
          <span className="inline-flex items-center gap-1.5 text-white bg-black px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest shadow-sm whitespace-nowrap">
            <FaCheckCircle /> {language === "thai" ? "ชำระแล้ว" : "Paid"}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-gray-500 bg-gray-50 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border border-gray-100 animate-pulse whitespace-nowrap">
            <FaInfoCircle />{" "}
            {language === "thai" ? "รอตรวจสอบ" : "Pending Review"}
          </span>
        );
    }
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

  if (isLoading)
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loader />
      </div>
    );
  if (error && error.status !== 404)
    return (
      <div className="max-w-4xl mx-auto p-10">
        <Message variant="danger">
          {error?.data?.message || error.error}
        </Message>
      </div>
    );

  return (
    <div className="font-sans text-slate-800 bg-transparent min-h-[400px] py-0 flex justify-center w-full text-start">
      <div className="w-full flex flex-col lg:flex-row gap-0 overflow-hidden">
        {/*  Left Column: Cart Items */}
        <div className="flex-1 p-0 md:p-6 bg-white text-start">
          <div className="hidden md:grid grid-cols-12 py-5 mb-8 border-b border-slate-200 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
            <div className="col-span-1 flex items-center justify-center">
              <CustomCheckbox
                checked={
                  validOrders.length > 0 &&
                  selectedIds.length === validOrders.length
                }
                onChange={toggleSelectAll}
              />
            </div>
            <div className="col-span-11 grid grid-cols-11 pl-4 gap-3 md:gap-4">
              <div className="col-span-1 md:col-span-4 font-semibold text-slate-900">
                {language === "thai"
                  ? "รายการประกอบแผงวงจร"
                  : "Assembly Project"}
              </div>
              <div className="col-span-1 md:col-span-1 text-right font-semibold pr-4 text-slate-900">
                {language === "thai" ? "จำนวน" : "Qty"}
              </div>
              <div className="col-span-1 md:col-span-3 text-center font-semibold text-slate-900">
                {language === "thai" ? "สถานะ" : "Status"}
              </div>
              <div className="col-span-1 md:col-span-3 text-right flex items-center justify-end gap-3 pr-2 md:pr-10">
                {language === "thai" ? "ราคา" : "Price"}
              </div>
            </div>
          </div>

          <div className="space-y-6 min-h-[350px]">
            <AnimatePresence>
              {validOrders.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-20 text-center flex flex-col items-center justify-center"
                >
                  <FaBoxOpen size={48} className="text-gray-200 mb-4" />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {language === "thai"
                      ? "ไม่มีสินค้าในตะกร้าของคุณ"
                      : "Your assembly cart is empty"}
                  </h3>
                  <Link
                    to="/assemblypcb"
                    className="text-blue-500 hover:text-black hover:underline mt-4 tracking-wide uppercase font-bold text-[12px] transition-colors"
                  >
                    {language === "thai"
                      ? "เริ่มสั่งผลิตใหม่"
                      : "Start New Order"}
                  </Link>
                </motion.div>
              ) : (
                validOrders.map((order) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={order.id}
                    className="border-b border-slate-100 pb-4 md:pb-6 relative group"
                  >
                    <div className="flex md:grid md:grid-cols-12 gap-3 md:gap-4 items-start md:items-center w-full px-2 md:px-0">
                      {/* Checkbox */}
                      <div className="col-span-1 flex items-center justify-center shrink-0 pt-1 md:pt-0">
                        <CustomCheckbox
                          checked={selectedIds.includes(order.id)}
                          onChange={() => toggleSelect(order.id)}
                        />
                      </div>

                      {/* Unified Content Container */}
                      <div className="col-span-11 flex-1 grid grid-cols-1 md:grid-cols-11 items-center gap-3 md:gap-4 min-w-0">
                        {/* Image and Details Stack */}
                        <div className="col-span-4 flex flex-col md:flex-row gap-3 md:gap-5 w-full">
                          {/* Top row: Image + Name/SKU */}
                          <div className="flex gap-3 md:gap-5 items-start md:items-center w-full">
                            {/* Image */}
                            <div className="w-16 h-16 md:w-24 md:h-24 bg-slate-50 shrink-0 flex items-center justify-center overflow-hidden rounded-xl border border-slate-100 shadow-sm group-hover:shadow-md transition-shadow">
                              {order.image_top_1 ? (
                                <img
                                  src={getFullUrl(order.image_top_1)}
                                  alt="thumbnail"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <FaRobot
                                  size={24}
                                  className="text-gray-400 md:hidden"
                                />
                              )}
                              <div className="hidden md:block">
                                {!order.image_top_1 && (
                                  <FaRobot
                                    size={36}
                                    className="text-gray-400"
                                  />
                                )}
                              </div>
                            </div>

                            {/* Details Context */}
                            <div className="flex flex-col flex-1 min-w-0 py-0.5 md:py-0 text-start md:pr-6 relative">
                              <Link
                                to={`/assemblycartpcb/${order.id}`}
                                className="text-[13px] md:text-[14px] font-black text-slate-900 uppercase hover:text-blue-600 transition-colors leading-snug mb-0.5 truncate block w-full pr-6 md:pr-0"
                              >
                                {order.projectname || "Untitled Project"}
                              </Link>
                              <span className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate block w-full">
                                ID: {order.id} • ASSEMBLY SERVICE
                              </span>
                            </div>
                          </div>

                          {/* --- MOBILE ONLY ACTION BOX (separate row) --- */}
                          <div className="flex md:hidden items-center justify-between w-full bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                            <div className="flex flex-col min-w-0">
                              <span className="text-[8px] font-black tracking-[0.15em] uppercase text-slate-400 mb-0.5">
                                {order.status === "accepted"
                                  ? language === "thai"
                                    ? "ยอดที่อนุมัติ"
                                    : "Confirmed"
                                  : language === "thai"
                                    ? "ประมาณการ"
                                    : "Estimate"}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-[14px] text-slate-900 leading-none">
                                  {order.status === "accepted"
                                    ? formatPrice(
                                      order.confirmed_price,
                                      order.status,
                                    )
                                    : formatPrice(
                                      order.estimatedCost,
                                      order.status,
                                    )}
                                </span>
                                <span className="text-[9px] font-bold text-slate-400">
                                  / {order.pcs_qty || order.qty || 0} PCS
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="flex-shrink-0 scale-90 origin-right">
                                {getStatusBadge(order.status)}
                              </div>
                              {order.gerber_zip && (
                                <a
                                  href={getFullUrl(order.gerber_zip)}
                                  download
                                  className="w-8 h-8 flex items-center justify-center text-blue-500 bg-blue-50 rounded-lg border border-blue-100 active:bg-blue-100 transition-colors"
                                >
                                  <FaDownload size={11} />
                                </a>
                              )}
                              {order.status !== "paid" && (
                                <button
                                  onClick={() => {
                                    setCancelTargetId(order.id);
                                    setShowConfirmModal(true);
                                  }}
                                  className="w-8 h-8 flex items-center justify-center text-rose-500 bg-rose-50 rounded-lg border border-rose-100 active:bg-rose-100 transition-colors"
                                >
                                  <FaTrashAlt size={11} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* --- DESKTOP ONLY COLUMNS --- */}
                        <div className="hidden md:block col-span-1 text-right pr-4">
                          <span className="font-bold text-[14px] text-gray-900">
                            {order.pcb_qty} PCS
                          </span>
                        </div>

                        <div className="hidden md:flex col-span-3 justify-center">
                          {getStatusBadge(order.status)}
                        </div>

                        <div className="hidden md:flex col-span-3 items-center justify-end gap-3 pr-2 md:pr-10">
                          <div className="flex flex-col items-end mr-2">
                            <span className="font-bold text-[15px] text-gray-900 whitespace-nowrap">
                              {order.status === "accepted"
                                ? formatPrice(
                                  order.confirmed_price,
                                  order.status,
                                )
                                : formatPrice(
                                  order.estimatedCost,
                                  order.status,
                                )}
                            </span>
                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter mt-0.5">
                              {order.status === "accepted"
                                ? "Confirmed"
                                : "Estimate"}
                            </span>
                          </div>
                          {order.gerber_zip && (
                            <a
                              href={getFullUrl(order.gerber_zip)}
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
                ))
              )}
            </AnimatePresence>
          </div>

          <div className="mt-8 pt-4">
            <Link
              to="/assemblypcb"
              className="text-[11px] font-bold text-gray-400 hover:text-black transition-colors uppercase tracking-[0.2em] flex items-center gap-2"
            >
              + Add Another Assembly
            </Link>
          </div>
        </div>

        {/*  Right Column: Summary */}
        <div className="w-full lg:w-[350px] bg-white p-6 lg:p-8 shrink-0 flex flex-col text-start border-l border-slate-100">
          <h2 className="text-[14px] font-bold text-gray-900 uppercase tracking-wide mb-8">
            Summary
          </h2>
          <div className="flex flex-col flex-grow">
            <div className="flex justify-between items-center mb-4 text-[13px]">
              <span className="text-gray-600 uppercase font-semibold">
                Subtotal
              </span>
              <span className="text-gray-800 font-bold">
                {formatPrice(subTotal)}
              </span>
            </div>
            <div className="flex justify-between items-center mb-4 text-[13px] border-t border-slate-50 pt-4">
              <span className="text-gray-400 uppercase font-bold text-[10px]">
                Selected {selectedIds.length} items
              </span>
            </div>

            <div className="mt-4">
              <button
                onClick={checkoutHandler}
                disabled={selectedIds.length === 0}
                className={`w-full py-3 rounded-none text-[13px] font-bold tracking-widest uppercase transition-all shadow-md mb-8 ${selectedIds.length > 0 && acceptedItemsCount > 0
                  ? "bg-black text-white hover:bg-slate-900"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
              >
                {language === "thai"
                  ? "ชำระเงินตามที่เลือก"
                  : "Checkout Selected"}
              </button>

              <div className="bg-gray-50 border border-dashed border-gray-200 rounded p-6 mb-6">
                <p className="text-[11px] text-gray-500 font-medium leading-relaxed mb-4">
                  <strong className="text-gray-900 uppercase tracking-widest block mb-1 text-[10px]">
                    Assembly evaluation
                  </strong>
                  Our technicians must manually verify the BOM and CPL files to
                  provide a final accurate quotation.
                </p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                  Usually completed within 24-48 hours.
                </p>
              </div>

              <div className="flex justify-between items-center mb-8 border-t border-slate-100 pt-6 mt-2">
                <span className="text-gray-900 text-[14px] font-bold uppercase tracking-wide">
                  Order Total
                </span>
                <span className="font-bold text-gray-900 text-[20px] tracking-tight">
                  {formatPrice(subTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Confirm Delete Modal */}
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
                  className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                />
              </AnimatePresence>
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative bg-white rounded shadow-2xl w-full max-w-sm p-8 text-center border-t-4 border-black font-sans z-10"
              >
                <h3 className="text-[16px] font-bold text-gray-900 mb-2 uppercase tracking-tight">
                  Remove Assembly?
                </h3>
                <p className="text-[14px] text-gray-600 mb-8 font-medium">
                  Are you sure you want to remove this assembly order? This
                  action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 py-3 bg-gray-100 text-gray-800 font-bold text-[11px] uppercase tracking-widest hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex-1 py-3 bg-black text-white font-bold text-[11px] uppercase tracking-widest hover:bg-gray-800 transition-colors shadow-lg"
                  >
                    Remove
                  </button>
                </div>
              </motion.div>
            </div>,
            document.body,
          )}
      </div>
    </div>
  );
};

export default OrderAssemblyCartScreen;
