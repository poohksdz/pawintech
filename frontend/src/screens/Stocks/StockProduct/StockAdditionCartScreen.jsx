import React, { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  FaBoxOpen,
  FaCheckDouble,
  FaMinus,
  FaPlus,
  FaBoxes,
  FaExclamationTriangle,
  FaHeart,
  FaPen,
  FaTimes,
  FaTrashAlt,
  FaArrowLeft,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Loader from "../../../components/Loader";
import CustomCheckbox from "../../../components/CustomCheckbox";

import { useGetStockProductsQuery } from "../../../slices/stockProductApiSlice";
import { useCreateStockReceiveMutation } from "../../../slices/stockReceiveApiSlice";
import { useGetStockRequestQuery } from "../../../slices/stockRequestApiSlice";
import {
  removeAdditionStockFromCart,
  clearAdditionStockCartItems,
  updateAdditionQty,
} from "../../../slices/stockAdditionApiSlice";

const StockAdditionCartScreen = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { userInfo } = useSelector((state) => state.auth);
  const { additionstockcartItems = [] } = useSelector(
    (state) => state.additionstockcart || {},
  );
  const { language } = useSelector((state) => state.language);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [itemToRemove, setItemToRemove] = useState(null);
  const [showAdditionConfirm, setShowAdditionConfirm] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const { data: existingQty, refetch: refetchExistingQty } =
    useGetStockProductsQuery();
  const { refetch: refetchStocks } = useGetStockRequestQuery();
  const [createStockReceive, { isLoading }] = useCreateStockReceiveMutation();

  // Initialize selection
  const [isInitialized, setIsInitialized] = useState(false);
  useEffect(() => {
    if (
      additionstockcartItems &&
      additionstockcartItems.length > 0 &&
      !isInitialized
    ) {
      setSelectedIds(additionstockcartItems.map((item) => item.cartId));
      setIsInitialized(true);
    }
  }, [additionstockcartItems, isInitialized]);

  const selectedItems = useMemo(() => {
    return additionstockcartItems.filter((item) =>
      selectedIds.includes(item.cartId),
    );
  }, [additionstockcartItems, selectedIds]);

  const updateQty = (cartId, val) => {
    const qty = val === "" ? 0 : Math.max(Number(val), 0);
    dispatch(updateAdditionQty({ cartId, qty }));
  };

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === additionstockcartItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(additionstockcartItems.map((item) => item.cartId));
    }
  };

  const removeHandler = (cartId) => {
    setItemToRemove(cartId);
    setShowConfirmModal(true);
  };

  const confirmRemove = () => {
    if (itemToRemove) {
      dispatch(removeAdditionStockFromCart(itemToRemove));
      setSelectedIds(selectedIds.filter((id) => id !== itemToRemove));
    }
    setShowConfirmModal(false);
    setItemToRemove(null);
    toast.success(
      language === "thai"
        ? "ลบรายการเรียบร้อยแล้ว"
        : "Item removed successfully",
    );
  };

  const addNowHandler = async () => {
    if (selectedItems.length === 0) return;

    try {
      const payload = {
        items: selectedItems.map((item) => ({
          ...item,
          additionqty: Number(item.additionqty),
        })),
        additionUser: userInfo.name,
        userId: userInfo._id,
      };

      await createStockReceive(payload).unwrap();

      // Remove selected items from cart
      selectedIds.forEach((id) => dispatch(removeAdditionStockFromCart(id)));

      toast.success(
        language === "thai"
          ? "บันทึกการนำเข้าพัสดุเรียบร้อยแล้ว"
          : "Inbound stock recorded successfully",
      );

      if (refetchExistingQty) await refetchExistingQty();
      if (refetchStocks) await refetchStocks();

      navigate("/componentaddproductlist");
    } catch (error) {
      toast.error(error?.data?.message || "Error confirming inbound");
    }
  };

  const totalAdditionQty = selectedItems.reduce(
    (acc, item) => acc + Number(item.additionqty || 0),
    0,
  );

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
          <div className="hidden md:grid grid-cols-12 pb-3 mb-6 border-b border-slate-200 text-[13px] uppercase tracking-wide">
            <div className="col-span-1 flex items-center justify-center">
              <CustomCheckbox
                checked={
                  additionstockcartItems.length > 0 &&
                  selectedIds.length === additionstockcartItems.length
                }
                onChange={toggleSelectAll}
              />
            </div>
            <div className="col-span-11 grid grid-cols-11 pl-4">
              <div className="col-span-1 md:col-span-7 font-semibold text-slate-900">
                Part Details
              </div>
              <div className="col-span-1 md:col-span-4 text-center font-semibold text-slate-900">
                Inbound Units
              </div>
            </div>
          </div>

          <div className="space-y-6 min-h-[350px]">
            <AnimatePresence>
              {additionstockcartItems.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-20 text-center flex flex-col items-center justify-center"
                >
                  <FaBoxOpen size={48} className="text-gray-200 mb-4" />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {language === "thai"
                      ? "ตะกร้าว่างเปล่า"
                      : "Inbound cart is empty"}
                  </h3>
                  <Link
                    to="/componentaddproductlist"
                    className="text-blue-500 hover:underline mt-4 tracking-wide uppercase font-bold text-[12px]"
                  >
                    Back to Catalog
                  </Link>
                </motion.div>
              ) : (
                additionstockcartItems.map((p) => {
                  const currentStock =
                    existingQty?.products?.find(
                      (prod) => (prod.ID || prod._id) === (p.ID || p._id),
                    )?.quantity || 0;
                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key={p.cartId}
                      className="border-b border-gray-200 pb-6 relative group"
                    >
                      <div className="flex md:grid md:grid-cols-12 gap-3 md:gap-4 items-start md:items-center w-full">
                        {/* Checkbox */}
                        <div className="col-span-1 flex items-center justify-center shrink-0 pt-1 md:pt-0">
                          <CustomCheckbox
                            checked={selectedIds.includes(p.cartId)}
                            onChange={() => toggleSelect(p.cartId)}
                          />
                        </div>

                        {/* Unified Content Container */}
                        <div className="col-span-11 flex-1 grid grid-cols-1 md:grid-cols-11 items-center gap-3 md:gap-4 min-w-0">
                          {/* Image and Details Stack */}
                          <div className="col-span-7 flex flex-col md:flex-row gap-3 md:gap-5 w-full">
                            {/* Top row: Image + Name/SKU */}
                            <div className="flex gap-3 md:gap-5 items-start md:items-center w-full">
                              {/* Image */}
                              <div className="w-16 h-16 md:w-24 md:h-24 bg-[#f3f4f6] shrink-0 flex items-center justify-center overflow-hidden rounded-xl border border-gray-100 p-2 shadow-sm group-hover:shadow-md transition-shadow">
                                {p.img ? (
                                  <img
                                    src={`/componentImages${p.img}`}
                                    alt={p.electotronixPN}
                                    className="w-full h-full object-contain mix-blend-multiply"
                                  />
                                ) : (
                                  <FaBoxes
                                    size={24}
                                    className="text-gray-400 md:hidden"
                                  />
                                )}
                                <div className="hidden md:block">
                                  {!p.img && (
                                    <FaBoxes
                                      size={36}
                                      className="text-gray-400"
                                    />
                                  )}
                                </div>
                              </div>

                              {/* Details Context */}
                              <div className="flex flex-col flex-1 min-w-0 py-0.5 md:py-0 text-start md:pr-6 relative">
                                <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5 md:mb-1 truncate block w-full">
                                  {p.category}
                                </span>
                                <div className="text-[13px] md:text-[14px] font-black text-slate-900 uppercase leading-snug mb-0.5 truncate block w-full pr-6 md:pr-0">
                                  {p.electotronixPN || p.manufacturePN}
                                </div>
                                <span className="text-[9px] md:text-[11px] text-slate-400 font-bold uppercase tracking-tight truncate block w-full">
                                  {p.manufacture || "Unknown Manufacturer"}
                                </span>

                                {/* Mobile Trash (Absolute) Removed */}
                              </div>
                            </div>

                            {/* --- MOBILE ONLY ACTION BOX (separate row) --- */}
                            <div className="flex md:hidden items-center justify-between w-full bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                              <div className="flex flex-col min-w-0">
                                <span className="text-[8px] font-black tracking-[0.15em] uppercase text-slate-400 mb-0.5">
                                  Stock
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-[14px] text-slate-900 leading-none">
                                    {currentStock}
                                  </span>
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                    In Hand
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-1 items-center justify-end gap-2">
                                <div className="flex h-8 border border-slate-300 rounded-lg overflow-hidden bg-white">
                                  <button
                                    onClick={() =>
                                      updateQty(
                                        p.cartId,
                                        Number(p.additionqty) - 1,
                                      )
                                    }
                                    disabled={p.additionqty <= 1}
                                    className="w-8 flex items-center justify-center text-slate-400 hover:text-black active:bg-slate-100 transition-colors border-r border-slate-300 disabled:opacity-20"
                                  >
                                    <FaMinus size={8} />
                                  </button>
                                  <input
                                    type="number"
                                    value={p.additionqty || ""}
                                    onChange={(e) =>
                                      updateQty(p.cartId, e.target.value)
                                    }
                                    className="w-8 text-center text-[12px] font-black text-slate-900 bg-transparent outline-none border-none hide-scrollbar"
                                  />
                                  <button
                                    onClick={() =>
                                      updateQty(
                                        p.cartId,
                                        Number(p.additionqty) + 1,
                                      )
                                    }
                                    className="w-8 flex items-center justify-center text-slate-400 hover:text-black active:bg-slate-100 transition-colors border-l border-slate-300"
                                  >
                                    <FaPlus size={8} />
                                  </button>
                                </div>
                                <button
                                  onClick={() => removeHandler(p.cartId)}
                                  className="w-8 h-8 flex items-center justify-center text-rose-500 bg-rose-50 rounded-lg border border-rose-100 active:bg-rose-100 transition-colors"
                                >
                                  <FaTrashAlt size={11} />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* --- DESKTOP ONLY COLUMNS --- */}
                          <div className="hidden md:flex col-span-4 justify-end items-center gap-6 pr-2">
                            <div className="flex w-[120px] h-[40px] border border-gray-300 rounded-sm overflow-hidden bg-white">
                              <button
                                onClick={() =>
                                  updateQty(p.cartId, Number(p.additionqty) - 1)
                                }
                                disabled={p.additionqty <= 1}
                                className="w-10 flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-50 bg-white border-r border-gray-300 disabled:opacity-20"
                              >
                                <FaMinus size={10} />
                              </button>
                              <input
                                type="number"
                                value={p.additionqty || ""}
                                onChange={(e) =>
                                  updateQty(p.cartId, e.target.value)
                                }
                                className="flex-1 w-full text-center text-[14px] font-bold text-gray-900 bg-transparent outline-none border-none hide-scrollbar"
                              />
                              <button
                                onClick={() =>
                                  updateQty(p.cartId, Number(p.additionqty) + 1)
                                }
                                className="w-10 flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-50 bg-white border-l border-gray-300"
                              >
                                <FaPlus size={10} />
                              </button>
                            </div>
                            <button
                              onClick={() => removeHandler(p.cartId)}
                              className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all duration-200"
                              title="Remove Piece"
                            >
                              <FaTrashAlt size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>

          <div className="mt-8 pt-4 flex gap-6">
            <Link
              to="/cart"
              className="text-[11px] font-bold text-gray-400 hover:text-black transition-colors uppercase tracking-[0.2em] flex items-center gap-2"
            >
              <FaArrowLeft size={10} /> Back to Cart
            </Link>
            <Link
              to="/componentaddproductlist"
              className="text-[11px] font-bold text-gray-400 hover:text-black transition-colors uppercase tracking-[0.2em] flex items-center gap-2"
            >
              + Add More Components
            </Link>
          </div>
        </div>

        {/*  Right Column: Summary */}
        <div className="w-full lg:w-[350px] bg-white p-6 lg:p-8 shrink-0 flex flex-col text-start border-l border-slate-100">
          <h2 className="text-[14px] font-bold text-gray-900 uppercase tracking-wide mb-8">
            Inbound Summary
          </h2>
          <div className="flex flex-col flex-grow">
            <div className="mt-4">
              <button
                onClick={() => setShowAdditionConfirm(true)}
                disabled={selectedIds.length === 0}
                className={`w-full py-3 rounded-none text-[13px] font-bold tracking-widest uppercase transition-all shadow-md flex items-center justify-center gap-3 mb-8 ${
                  selectedIds.length > 0
                    ? "bg-black text-white hover:bg-slate-900"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                <FaCheckDouble size={14} /> Confirm Inbound
              </button>

              <div className="bg-gray-50 border border-dashed border-gray-200 rounded p-6 mb-8">
                <p className="text-[11px] text-gray-500 font-medium leading-relaxed mb-4">
                  <strong className="text-gray-900 uppercase tracking-widest block mb-1 text-[10px]">
                    Inbound Confirmation
                  </strong>
                  Confirming this list will immediately update the inventory
                  levels in the main warehouse database.
                </p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                  Stock will be available for production immediately.
                </p>
              </div>

              <div className="flex justify-between items-center mb-4 text-[13px]">
                <span className="text-gray-600 uppercase font-semibold">
                  Total Category Types
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
                  {totalAdditionQty.toLocaleString()}
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
                  Remove Component?
                </h3>
                <p className="text-[14px] text-gray-600 mb-8 font-medium">
                  Are you sure you want to remove this component from the
                  inbound list?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 py-3 bg-gray-100 text-gray-800 font-bold text-[11px] uppercase tracking-widest hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmRemove}
                    className="flex-1 py-3 bg-black text-white font-bold text-[11px] uppercase tracking-widest hover:bg-gray-800 transition-colors shadow-lg"
                  >
                    Remove
                  </button>
                </div>
              </motion.div>
            </div>,
            document.body,
          )}

        {/* Confirm Inbound Addition Modal */}
        {showAdditionConfirm &&
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
                  onClick={() => setShowAdditionConfirm(false)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
              </AnimatePresence>
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative bg-white rounded-xl w-full max-w-md p-10 shadow-3xl text-center border-b-4 border-black font-sans z-10"
              >
                <div className="w-20 h-20 bg-gray-50 text-black rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-100 shadow-inner">
                  <FaExclamationTriangle size={32} />
                </div>
                <h3 className="text-[18px] font-black text-gray-900 mb-2 uppercase tracking-tight">
                  Confirm Stock Import
                </h3>
                <p className="text-[14px] text-gray-600 mb-10 font-medium leading-relaxed">
                  You are about to add{" "}
                  <strong className="text-black">
                    {totalAdditionQty.toLocaleString()} units
                  </strong>{" "}
                  across{" "}
                  <strong className="text-black">
                    {selectedItems.length} categories
                  </strong>{" "}
                  to the system inventory.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowAdditionConfirm(false)}
                    className="flex-1 py-4 bg-gray-100 text-gray-800 font-bold text-[11px] uppercase tracking-widest hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      addNowHandler();
                      setShowAdditionConfirm(false);
                    }}
                    className="flex-1 py-4 bg-black text-white font-bold text-[11px] uppercase tracking-widest hover:bg-gray-800 transition-all shadow-xl flex items-center justify-center gap-2"
                  >
                    <FaCheckDouble size={14} /> Finalize Inbound
                  </button>
                </div>
              </motion.div>
            </div>,
            document.body,
          )}

        <style>{`
            .hide-scrollbar::-webkit-inner-spin-button, 
            .hide-scrollbar::-webkit-outer-spin-button { 
               -webkit-appearance: none; 
               margin: 0; 
            }
            .hide-scrollbar {
               -moz-appearance: textfield;
            }
         `}</style>
      </div>
    </div>
  );
};

export default StockAdditionCartScreen;
