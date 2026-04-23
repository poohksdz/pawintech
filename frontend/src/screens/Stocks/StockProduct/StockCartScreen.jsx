import React, { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  FaMinus,
  FaPlus,
  FaBoxOpen,
  FaSearch,
  FaTimes,
  FaArrowRight,
  FaArrowLeft,
  FaHeart,
  FaPen,
  FaTrashAlt,
} from "react-icons/fa";
import { useNavigate, Link } from "react-router-dom";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import Loader from "../../../components/Loader";
import CustomCheckbox from "../../../components/CustomCheckbox";
import { useCreateStockRequestMutation } from "../../../slices/stockRequestApiSlice";
import {
  removeStockFromCart,
  clearStockCartItems,
  addToStockCart,
} from "../../../slices/stockCartApiSlice";

const StockCartScreen = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { userInfo } = useSelector((state) => state.auth);
  const stockCartState = useSelector((state) => state.stockcart);
  const { language } = useSelector((state) => state.language);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [itemToRemoveId, setItemToRemoveId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const rawItems = useMemo(() => {
    return stockCartState?.stockcartItems || [];
  }, [stockCartState]);

  const validItems = useMemo(() => {
    return rawItems.filter((item) => item.reqqty > 0);
  }, [rawItems]);

  // Initialize selection
  const [isInitialized, setIsInitialized] = useState(false);
  useEffect(() => {
    if (validItems && validItems.length > 0 && !isInitialized) {
      setSelectedIds(validItems.map((item) => item._id));
      setIsInitialized(true);
    }
  }, [validItems, isInitialized]);

  const selectedItems = useMemo(() => {
    return validItems.filter((item) => selectedIds.includes(item._id));
  }, [validItems, selectedIds]);

  const [createStockRequest, { isLoading }] = useCreateStockRequestMutation();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const garbageItems = rawItems.filter((item) => item.reqqty <= 0);
    if (garbageItems.length > 0) {
      garbageItems.forEach((item) => {
        dispatch(removeStockFromCart(item._id));
      });
    }
  }, [rawItems, dispatch]);

  const filteredProducts = useMemo(() => {
    let filtered = validItems;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.electotronixPN?.toLowerCase().includes(q) ||
          i.manufacturePN?.toLowerCase().includes(q),
      );
    }
    return filtered;
  }, [searchQuery, validItems]);

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === validItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(validItems.map((item) => item._id));
    }
  };

  const updateQty = (item, newQty) => {
    const nextQty = Math.max(Number(newQty), 1);
    // replaceQty: true = แทนที่ค่าโดยตรง (สำหรับการแก้ไขจำนวนในตะกร้า)
    dispatch(addToStockCart({ ...item, reqqty: nextQty, replaceQty: true }));
  };

  const handleNoteChange = (p, n) =>
    dispatch(addToStockCart({ ...p, note: n }));

  const requestnowHandler = async () => {
    if (selectedItems.length === 0)
      return toast.error(
        language === "thai"
          ? "กรุณาเลือกรายการที่ต้องการเบิก"
          : "Please select items to request",
      );
    try {
      await createStockRequest({
        items: selectedItems,
        updateImportanceBy: userInfo.name,
        requestedUser: userInfo.name,
        userId: userInfo._id,
      }).unwrap();

      // Remove selected items from cart instead of clearing all if partial selection is supported
      // But usually clear all is fine if we requested what we selected.
      // For now, let's clear the selected ones.
      selectedIds.forEach((id) => dispatch(removeStockFromCart(id)));

      toast.success(
        language === "thai"
          ? "สร้างรายการเบิกสำเร็จ!"
          : "Request submitted successfully!",
      );
      navigate("/componentuserrequestlist");
    } catch (err) {
      toast.error(
        language === "thai"
          ? "ไม่สามารถสร้างรายการเบิกได้"
          : "Failed to submit request",
      );
    }
  };

  const removeHandler = (id) => {
    dispatch(removeStockFromCart(id));
    setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
    setShowConfirmModal(false);
    toast.success(
      language === "thai" ? "ลบรายการเรียบร้อยแล้ว" : "Item removed",
    );
  };

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader />
      </div>
    );

  return (
    <div className="font-sans text-slate-800 bg-[#fdfdfd] md:bg-[#fdfdfd] min-h-[400px] py-2 md:py-10 px-0 md:px-8 flex justify-center w-full text-start">
      <div className="w-full max-w-[1200px] flex flex-col lg:flex-row gap-0 md:border md:border-slate-200/60 md:shadow-md md:rounded-2xl overflow-hidden">
        {/*  Left Column: Cart Items */}
        <div className="flex-1 p-0 md:p-8 bg-white text-start">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-10 border-b border-slate-200 pb-6">
            <h1 className="text-[18px] font-black text-slate-900 uppercase tracking-tight">
              Request Cart
            </h1>

            {validItems.length > 0 && (
              <div className="relative w-full sm:w-64">
                <FaSearch
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={12}
                />
                <input
                  type="text"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pl-10 pr-10 text-[12px] font-bold text-gray-900 outline-none focus:ring-1 focus:ring-black placeholder:text-gray-400"
                  placeholder="Filter components..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full text-gray-400 hover:text-black"
                  >
                    <FaTimes size={10} />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="hidden md:grid grid-cols-12 pb-3 mb-6 border-b border-gray-100 text-[11px] uppercase tracking-[0.2em] text-gray-400 font-bold">
            <div className="col-span-1 flex items-center justify-center">
              <CustomCheckbox
                checked={
                  validItems.length > 0 &&
                  selectedIds.length === validItems.length
                }
                onChange={toggleSelectAll}
              />
            </div>
            <div className="col-span-7 pl-4">Component Info</div>
            <div className="col-span-4 text-center">Request Units</div>
          </div>

          <div className="space-y-6 min-h-[350px]">
            <AnimatePresence>
              {filteredProducts.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-20 text-center flex flex-col items-center justify-center"
                >
                  <FaBoxOpen size={48} className="text-gray-200 mb-4" />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {language === "thai"
                      ? "ตะกร้าของคุณยังว่างเปล่า"
                      : "Your request cart is empty"}
                  </h3>
                  <Link
                    to="/stockproductdashboard"
                    className="text-blue-500 hover:underline mt-4 tracking-wide uppercase font-bold text-[12px]"
                  >
                    Back to Dashboard
                  </Link>
                </motion.div>
              ) : (
                filteredProducts.map((p) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={p._id}
                    className="border-b border-gray-100 pb-4 md:pb-6 relative group"
                  >
                    <div className="flex md:grid md:grid-cols-12 gap-3 md:gap-4 items-start md:items-center w-full px-2 md:px-0">
                      {/* Checkbox */}
                      <div className="col-span-1 flex items-center justify-center shrink-0 pt-1 md:pt-0 z-10">
                        <CustomCheckbox
                          checked={selectedIds.includes(p._id)}
                          onChange={() => toggleSelect(p._id)}
                        />
                      </div>

                      {/* Clickable Card - Product Info */}
                      <Link
                        to={`/componenteditlist/${p.ID}`}
                        className="col-span-11 flex-1 grid grid-cols-1 md:grid-cols-11 items-start md:items-center gap-3 md:gap-4 min-w-0 cursor-pointer hover:bg-slate-50/50 -mx-2 px-2 rounded-xl transition-colors"
                        onClick={(e) => {
                          // Prevent navigation if clicking on interactive elements
                          if (e.target.closest('button') || e.target.closest('input')) {
                            e.preventDefault();
                          }
                        }}
                      >
                        {/* Image and Details Stack */}
                        <div className="col-span-7 flex flex-col md:flex-row gap-3 md:gap-5 w-full">
                          {/* Top row: Image + Name/SKU */}
                          <div className="flex gap-3 md:gap-5 items-start md:items-center w-full">
                            {/* Image */}
                            <div className="w-16 h-16 md:w-24 md:h-24 bg-[#f3f4f6] shrink-0 flex items-center justify-center overflow-hidden rounded-xl border border-gray-100 p-2 shadow-sm group-hover:shadow-md transition-shadow">
                              {p.img ? (
                                <img
                                  src={p.img}
                                  alt={p.electotronixPN}
                                  className="w-full h-full object-contain mix-blend-multiply"
                                />
                              ) : (
                                <FaBoxOpen
                                  size={24}
                                  className="text-gray-400 md:hidden"
                                />
                              )}
                              <div className="hidden md:block">
                                {!p.img && (
                                  <FaBoxOpen
                                    size={36}
                                    className="text-gray-400"
                                  />
                                )}
                              </div>
                            </div>

                            {/* Details Context */}
                            <div className="flex flex-col flex-1 min-w-0 py-0.5 md:py-0 text-start md:pr-6 relative">
                              <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5 md:mb-1 truncate block w-full">
                                {p.manufacture || "No Brand"}
                              </span>
                              <span className="text-[13px] md:text-[14px] font-black text-slate-900 uppercase hover:text-blue-600 transition-colors leading-snug mb-0.5 truncate block w-full pr-6 md:pr-0">
                                {p.electotronixPN || p.manufacturePN}
                              </span>
                              <span className="text-[9px] md:text-[11px] text-slate-400 font-bold leading-relaxed line-clamp-1">
                                {p.description || "No description provided"}
                              </span>
                              <span className="text-[9px] md:text-[10px] text-indigo-500 font-medium mt-1 hidden md:block">
                                {language === "thai" ? "คลิกเพื่อดูรายละเอียด" : "Click to view details"}
                              </span>
                            </div>
                          </div>

                          {/* Mobile Note Input */}
                          <div className="md:hidden w-full" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              className="w-full bg-slate-50 border border-slate-100 py-1.5 px-3 text-[10px] font-bold text-slate-600 rounded-lg outline-none focus:ring-1 focus:ring-slate-200 placeholder:text-slate-300 shadow-inner"
                              placeholder="Add request note (e.g. Project Name)"
                              value={p.note || ""}
                              onChange={(e) =>
                                handleNoteChange(p, e.target.value)
                              }
                            />
                          </div>

                          {/* --- MOBILE ONLY ACTION BOX (separate row) --- */}
                          <div
                            className="flex md:hidden items-center justify-between w-full bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex flex-col min-w-0">
                              <span className="text-[8px] font-black tracking-[0.15em] uppercase text-slate-400 mb-0.5">
                                Units
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-[14px] text-slate-900 leading-none">
                                  {p.reqqty}
                                </span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                  Requested
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-1 items-center justify-end gap-2">
                              <div className="flex h-8 border border-slate-300 rounded-lg overflow-hidden bg-white">
                                <button
                                  onClick={() =>
                                    updateQty(p, Number(p.reqqty) - 1)
                                  }
                                  disabled={p.reqqty <= 1}
                                  className="w-8 flex items-center justify-center text-slate-400 hover:text-black active:bg-slate-100 transition-colors border-r border-slate-300 disabled:opacity-20"
                                >
                                  <FaMinus size={8} />
                                </button>
                                <div className="w-8 flex items-center justify-center text-[12px] font-black text-slate-900 bg-transparent">
                                  {p.reqqty}
                                </div>
                                <button
                                  onClick={() =>
                                    updateQty(p, Number(p.reqqty) + 1)
                                  }
                                  className="w-8 flex items-center justify-center text-slate-400 hover:text-black active:bg-slate-100 transition-colors border-l border-slate-300"
                                >
                                  <FaPlus size={8} />
                                </button>
                              </div>
                              <button
                                onClick={() => removeHandler(p)}
                                className="w-8 h-8 flex items-center justify-center text-rose-500 bg-rose-50 rounded-lg border border-rose-100 active:bg-rose-100 transition-colors"
                              >
                                <FaTrashAlt size={11} />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* --- DESKTOP ONLY COLUMNS --- */}
                        <div
                          className="hidden md:flex col-span-4 justify-end items-center gap-4 md:gap-6 pr-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex w-[120px] h-[40px] border border-gray-300 rounded-sm overflow-hidden bg-white">
                            <button
                              onClick={() => updateQty(p, Number(p.reqqty) - 1)}
                              disabled={p.reqqty <= 1}
                              className="w-10 flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-50 bg-white border-r border-gray-300 disabled:opacity-20"
                            >
                              <FaMinus size={10} />
                            </button>
                            <input
                              type="number"
                              value={p.reqqty || ""}
                              onChange={(e) => updateQty(p, e.target.value)}
                              className="flex-1 w-full text-center text-[14px] font-bold text-gray-900 bg-transparent outline-none border-none hide-scrollbar"
                            />
                            <button
                              onClick={() => updateQty(p, Number(p.reqqty) + 1)}
                              className="w-10 flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-50 bg-white border-l border-gray-300"
                            >
                              <FaPlus size={10} />
                            </button>
                          </div>
                          <button
                            onClick={() => {
                              setItemToRemoveId(p._id);
                              setShowConfirmModal(true);
                            }}
                            className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all duration-200"
                            title="Remove Component"
                          >
                            <FaTrashAlt size={14} />
                          </button>
                        </div>
                      </Link>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          <div className="mt-8 pt-4 flex flex-col sm:flex-row gap-4 md:gap-6">
            <Link
              to="/cart"
              className="text-[11px] font-bold text-gray-400 hover:text-black transition-colors uppercase tracking-[0.2em] flex items-center gap-2 w-fit"
            >
              <FaArrowLeft size={10} /> Back to Cart
            </Link>
            <Link
              to="/componentcheckboom"
              className="text-[11px] font-bold text-indigo-400 hover:text-indigo-600 transition-colors uppercase tracking-[0.2em] flex items-center gap-2 w-fit"
            >
              <FaArrowLeft size={10} /> Back to BOM Checker
            </Link>
          </div>
        </div>

        {/*  Right Column: Summary */}
        <div className="w-full lg:w-[350px] bg-white p-4 md:p-6 lg:p-8 shrink-0 flex flex-col text-start border-l border-slate-100">
          <h2 className="text-[14px] font-bold text-gray-900 uppercase tracking-wide mb-8">
            Request Summary
          </h2>

          <div className="flex flex-col flex-grow">
            <div className="mt-4">
              <button
                onClick={requestnowHandler}
                disabled={selectedIds.length === 0}
                className={`w-full py-3 rounded-none text-[13px] font-bold tracking-widest uppercase transition-all shadow-md flex items-center justify-center gap-3 mb-8 ${selectedIds.length > 0
                    ? "bg-black text-white hover:bg-slate-900"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
              >
                Submit Request <FaArrowRight size={12} />
              </button>

              <div className="bg-gray-50 border border-dashed border-gray-200 rounded p-4 md:p-6 mb-8">
                <p className="text-[11px] text-gray-500 font-medium leading-relaxed mb-4">
                  <strong className="text-gray-900 uppercase tracking-widest block mb-1 text-[10px]">
                    Processing Policy
                  </strong>
                  Requests are reviewed by the stock manager. Availability
                  depends on current warehouse health.
                </p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                  Approval usually takes 1-2 hours.
                </p>
              </div>

              <div className="flex justify-between items-center mb-4 text-[13px]">
                <span className="text-gray-600 uppercase font-semibold">
                  Total Categories
                </span>
                <span className="text-gray-800 font-bold">
                  {selectedItems.length}
                </span>
              </div>
              <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-6 text-[13px]">
                <span className="text-gray-600 uppercase font-semibold">
                  Total Units
                </span>
                <span className="text-gray-900 font-black text-[20px] tracking-tighter">
                  {selectedItems
                    .reduce((acc, curr) => acc + (Number(curr.reqqty) || 0), 0)
                    .toLocaleString()}
                </span>
              </div>
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
              className="relative bg-white rounded shadow-2xl w-full max-w-sm p-4 md:p-8 text-center border-t-4 border-black font-sans z-10"
            >
              <h3 className="text-[16px] font-bold text-gray-900 mb-2 uppercase tracking-tight">
                Remove Item?
              </h3>
              <p className="text-[14px] text-gray-600 mb-8 font-medium">
                Are you sure you want to remove this component from your request
                cart?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-800 font-bold text-[11px] uppercase tracking-widest hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => removeHandler(itemToRemoveId)}
                  className="flex-1 py-3 bg-black text-white font-bold text-[11px] uppercase tracking-widest hover:bg-gray-800 transition-colors shadow-lg"
                >
                  Remove
                </button>
              </div>
            </motion.div>
          </div>,
          document.body,
        )}

      <style dangerouslySetInnerHTML={{
        __html: `
            .hide-scrollbar::-webkit-inner-spin-button,
            .hide-scrollbar::-webkit-outer-spin-button {
               -webkit-appearance: none;
               margin: 0;
            }
            .hide-scrollbar {
               -moz-appearance: textfield;
            }
         ` }} />
    </div>
  );
};

export default StockCartScreen;
