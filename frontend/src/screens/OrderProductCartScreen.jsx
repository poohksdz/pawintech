import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTimes,
  FaBoxOpen,
  FaShoppingBag,
  FaAngleDown,
  FaHeart,
  FaPen,
  FaMinus,
  FaPlus,
  FaTrashAlt,
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import Loader from "../components/Loader";
import Message from "../components/Message";
import CustomCheckbox from "../components/CustomCheckbox";
import { addToCart, removeFromCart } from "../slices/cartSlice";
import { toast } from "react-toastify";

const OrderProductCartScreen = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { cartItems } = useSelector((state) => state.cart || { cartItems: [] });
  const { language } = useSelector((state) => state.language);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [itemToRemoveId, setItemToRemoveId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  // Initialize selection: select all ONLY on first load of items
  const [isInitialized, setIsInitialized] = useState(false);
  useEffect(() => {
    if (cartItems && cartItems.length > 0 && !isInitialized) {
      setSelectedIds(cartItems.map((item) => item._id));
      setIsInitialized(true);
    }
  }, [cartItems, isInitialized]);

  // Calculate Summary Locally based on selection
  const selectedItems =
    cartItems?.filter((item) => selectedIds.includes(item._id)) || [];
  const subTotal = selectedItems.reduce(
    (acc, item) => acc + item.price * item.qty,
    0,
  );

  // Simple logic for VAT and Shipping for Product Cart
  const vatPrice = subTotal * 0.07;
  const shippingPrice = subTotal > 0 ? 0 : 0; // Simplified for this screen
  const totalPrice = subTotal + vatPrice + shippingPrice;

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === cartItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(cartItems.map((item) => item._id));
    }
  };

  const addToCartHandler = (product, qty) => {
    dispatch(addToCart({ ...product, qty, replaceQty: true }));
  };

  const removeFromCartHandler = (id) => {
    dispatch(removeFromCart(id));
    setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
    setShowConfirmModal(false);
    toast.success(
      language === "thai"
        ? "ลบรายการเรียบร้อยแล้ว"
        : "Item removed successfully",
    );
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
    // Simplified: Product cart checkout might need to only handle selected items in a real world scenario
    // but for now we follow the user's request to have the "functionality" like PCB cart.
    navigate("/login?redirect=/shipping");
  };

  const formatPrice = (price) => {
    if (price === undefined || price === null || isNaN(price)) return "฿0.00";
    return `฿${parseFloat(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="font-sans text-slate-800 bg-transparent min-h-[400px] py-0 flex justify-center w-full text-start">
      <div className="w-full flex flex-col lg:flex-row gap-0 overflow-hidden">
        {/*  Left Column: Cart Items */}
        <div className="flex-1 p-0 md:p-6 bg-white text-start">
          {/* DESKTOP HEADER (Original) */}
          <div className="hidden md:grid grid-cols-12 py-5 mb-8 border-b border-slate-200 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
            <div className="col-span-1 flex items-center justify-center">
              <CustomCheckbox
                checked={
                  cartItems.length > 0 &&
                  selectedIds.length === cartItems.length
                }
                onChange={toggleSelectAll}
              />
            </div>
            <div className="col-span-11 grid grid-cols-11">
              <div className="col-span-5 font-semibold text-slate-900">
                {language === "thai" ? "สินค้า" : "Product"}
              </div>
              <div className="col-span-2 text-right font-semibold pr-4 text-slate-900">
                {language === "thai" ? "ราคา" : "Price"}
              </div>
              <div className="col-span-2 text-center font-semibold text-slate-900">
                {language === "thai" ? "จำนวน" : "Qty"}
              </div>
              <div className="col-span-2 text-right font-semibold text-slate-900 md:pr-10">
                {language === "thai" ? "ยอดรวม" : "Subtotal"}
              </div>
            </div>
          </div>

          {/* MOBILE HEADER (Premium Simple) */}
          <div className="md:hidden flex items-center justify-between px-4 py-4 mb-2 bg-slate-50/50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-3">
              <CustomCheckbox
                checked={cartItems.length > 0 && selectedIds.length === cartItems.length}
                onChange={toggleSelectAll}
              />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">
                {language === "thai" ? "เลือกทั้งหมด" : "Select All"}
              </span>
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {cartItems.length} {language === "thai" ? "รายการ" : "Items"}
            </span>
          </div>

          <div className="space-y-4 md:space-y-6 min-h-[200px]">
            <AnimatePresence>
              {!cartItems || cartItems.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-20 text-center flex flex-col items-center justify-center"
                >
                  <FaBoxOpen size={48} className="text-gray-200 mb-4" />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {language === "thai"
                      ? "ไม่มีสินค้าในตะกร้าของคุณ"
                      : "Your product cart is empty"}
                  </h3>
                  <Link to="/" className="text-blue-500 hover:underline mt-4">
                    {language === "thai" ? "ไปเลือกซื้อสินค้า" : "Go Shopping"}
                  </Link>
                </motion.div>
              ) : (
                cartItems.map((item, index) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={`${item._id}-${index}`}
                    className="border-b border-slate-100 pb-4 md:pb-6 relative group"
                  >
                    {/* --- MOBILE VIEW: PREMIUM TRUE BLACK CARD --- */}
                    <div className="md:hidden flex flex-col w-full bg-[#0a0a0a] border border-zinc-900 p-6 rounded-[2.5rem] shadow-2xl overflow-hidden mb-6 relative group active:scale-[0.98] transition-all duration-300">
                      {/* Selection Overlay */}
                      <div className="absolute top-6 left-6 z-20">
                        <CustomCheckbox
                          checked={selectedIds.includes(item._id)}
                          onChange={() => toggleSelect(item._id)}
                        />
                      </div>

                      {/* Image section */}
                      <div className="w-full aspect-square bg-[#111111] rounded-[2rem] flex items-center justify-center overflow-hidden mb-5 border border-zinc-800/50">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105" />
                        ) : (
                          <FaShoppingBag size={48} className="text-zinc-800" />
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex flex-col mb-6">
                        <Link to={`/product/${item._id}`} className="text-[18px] font-black text-white uppercase tracking-tight leading-tight mb-1">
                          {item.name}
                        </Link>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
                          SKU: {String(item._id).substring(0, 8)}
                        </span>
                      </div>

                      {/* Pricing Details */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="flex flex-col bg-zinc-900/50 p-4 rounded-3xl border border-zinc-800/30">
                          <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Unit Price</span>
                          <span className="text-[16px] font-black text-white">{formatPrice(item.price)}</span>
                        </div>
                        <div className="flex flex-col bg-indigo-500/10 p-4 rounded-3xl border border-indigo-500/20 items-end">
                          <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Subtotal</span>
                          <span className="text-[16px] font-black text-indigo-400">{formatPrice(item.price * item.qty)}</span>
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 flex items-center justify-between bg-zinc-900 rounded-2xl p-1 border border-zinc-800">
                          <button
                            onClick={() => addToCartHandler(item, Math.max(1, item.qty - 1))}
                            className="w-12 h-12 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
                          >
                            <FaMinus size={10} />
                          </button>
                          <span className="text-[15px] font-black text-white tracking-widest">{item.qty}</span>
                          <button
                            onClick={() => addToCartHandler(item, Math.min(item.countInStock, item.qty + 1))}
                            className="w-12 h-12 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
                          >
                            <FaPlus size={10} />
                          </button>
                        </div>
                        <button
                          onClick={() => { setItemToRemoveId(item._id); setShowConfirmModal(true); }}
                          className="w-14 h-14 bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center rounded-2xl hover:bg-rose-500 hover:text-white transition-all duration-300 shadow-lg shadow-rose-900/10"
                        >
                          <FaTrashAlt size={16} />
                        </button>
                      </div>
                    </div>

                    {/* --- DESKTOP VIEW (Original Style) --- */}
                    <div className="hidden md:grid md:grid-cols-12 gap-3 md:gap-4 items-start md:items-center w-full px-2 md:px-0">
                      {/* Checkbox */}
                      <div className="col-span-1 flex items-center justify-center shrink-0 pt-1 md:pt-0">
                        <CustomCheckbox
                          checked={selectedIds.includes(item._id)}
                          onChange={() => toggleSelect(item._id)}
                        />
                      </div>

                      {/* Unified Content Container */}
                      <div className="col-span-11 flex-1 grid grid-cols-1 md:grid-cols-11 items-center gap-2 md:gap-4 min-w-0">
                        {/* Image and Details Stack */}
                        <div className="col-span-5 flex flex-col md:flex-row gap-3 md:gap-5 w-full">
                          {/* Top row: Image + Name/SKU */}
                          <div className="flex gap-3 md:gap-5 items-start md:items-center w-full">
                            {/* Image */}
                            <div className="w-16 h-16 md:w-24 md:h-24 bg-slate-50 shrink-0 flex items-center justify-center overflow-hidden rounded-xl border border-slate-100 shadow-sm group-hover:shadow-md transition-shadow">
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <FaShoppingBag
                                  size={24}
                                  className="text-gray-400"
                                />
                              )}
                            </div>

                            {/* Details Context */}
                            <div className="flex flex-col flex-1 min-w-0 py-0.5 md:py-0 md:pr-6 relative">
                              <Link
                                to={`/product/${item._id}`}
                                className="text-[13px] md:text-[14px] font-black text-slate-900 uppercase hover:text-blue-600 transition-colors leading-snug mb-0.5 truncate block w-full pr-6 md:pr-0"
                              >
                                {item.name}
                              </Link>
                              <span className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate block w-full">
                                SKU: {String(item._id).substring(0, 8)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* --- DESKTOP ONLY COLUMNS --- */}
                        <div className="hidden md:block col-span-2 text-right pr-4">
                          <span className="font-bold text-[14px]">
                            {formatPrice(item.price)}
                          </span>
                        </div>

                        <div className="hidden md:flex col-span-2 justify-center">
                          <div className="flex w-[100px] h-[36px] border border-gray-300 rounded-sm overflow-hidden bg-white">
                            <button
                              onClick={() =>
                                addToCartHandler(
                                  item,
                                  Math.max(1, item.qty - 1),
                                )
                              }
                              className="w-8 flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-50 bg-white border-r border-gray-300"
                            >
                              <FaMinus size={8} />
                            </button>
                            <div className="flex-1 flex items-center justify-center text-[13px] text-gray-700 font-bold">
                              {item.qty}
                            </div>
                            <button
                              onClick={() =>
                                addToCartHandler(
                                  item,
                                  Math.min(item.countInStock, item.qty + 1),
                                )
                              }
                              className="w-8 flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-50 bg-white border-l border-gray-300"
                            >
                              <FaPlus size={8} />
                            </button>
                          </div>
                        </div>

                        <div className="hidden md:flex col-span-2 items-center justify-end gap-3 text-right">
                          <span className="font-bold text-[14px]">
                            {formatPrice(item.price * item.qty)}
                          </span>
                          <button
                            onClick={() => {
                              setItemToRemoveId(item._id);
                              setShowConfirmModal(true);
                            }}
                            className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all duration-200"
                            title="Remove Item"
                          >
                            <FaTrashAlt size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

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
            <div className="flex justify-between items-center mb-4 text-[13px]">
              <span className="text-gray-600 uppercase font-semibold">
                VAT (7%)
              </span>
              <span className="text-gray-800 font-bold">
                {formatPrice(vatPrice)}
              </span>
            </div>
            {shippingPrice > 0 && (
              <div className="flex justify-between items-center mb-4 text-[13px]">
                <span className="text-gray-600 uppercase font-semibold">
                  Shipping
                </span>
                <span className="text-gray-800 font-bold">
                  {formatPrice(shippingPrice)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center mb-4 text-[13px] border-t border-slate-50 pt-4">
              <span className="text-gray-400 uppercase font-bold text-[10px]">
                Selected {selectedIds.length} items
              </span>
            </div>

            <button
              onClick={checkoutHandler}
              disabled={selectedIds.length === 0}
              className={`w-full py-3 rounded-none text-[13px] font-bold tracking-widest uppercase transition-all shadow-md mb-8 ${selectedIds.length > 0
                ? "bg-black text-white hover:bg-slate-900"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
            >
              {language === "thai"
                ? "ชำระเงินตามที่เลือก"
                : "Checkout Selected"}
            </button>

            <div className="flex justify-between items-center mb-8 border-t border-slate-100 pt-6 mt-2">
              <span className="text-gray-900 text-[14px] font-bold uppercase tracking-wide">
                Order Total
              </span>
              <span className="font-bold text-gray-900 text-[20px] tracking-tight">
                {formatPrice(totalPrice)}
              </span>
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
                  Remove Item?
                </h3>
                <p className="text-[14px] text-gray-600 mb-8 font-medium">
                  Are you sure you want to remove this product from your cart?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 py-3 bg-gray-100 text-gray-800 font-bold text-[11px] uppercase tracking-widest hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => removeFromCartHandler(itemToRemoveId)}
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

export default OrderProductCartScreen;
