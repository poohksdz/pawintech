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
import {
  addToCart,
  removeFromCart,
  toggleSelectItem,
  selectAllItems,
  syncCartDB,
} from "../slices/cartSlice";
import { useGetDefaultInvoiceUsedQuery } from "../slices/defaultInvoicesApiSlice";
import FullTaxInvoiceA4 from "../components/FullTaxInvoiceA4";
import { toast } from "react-toastify";
import { FaPrint } from "react-icons/fa";

const OrderProductCartScreen = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    cartItems,
    receivePlace,
    itemsPrice,
    vatPrice,
    shippingPrice,
    totalPrice,
  } = useSelector((state) => state.cart || { cartItems: [] });
  const { userInfo } = useSelector((state) => state.auth);
  const { language } = useSelector((state) => state.language);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [itemToRemoveId, setItemToRemoveId] = useState(null);

  // Filter selected items from Redux state
  const selectedItems = cartItems?.filter((item) => item.isSelected) || [];
  const isAllSelected = cartItems.length > 0 && selectedItems.length === cartItems.length;

  const addToCartHandler = (product, qty) => {
    dispatch(addToCart({ ...product, qty, replaceQty: true }));
    dispatch(syncCartDB());
  };

  const removeFromCartHandler = (id) => {
    dispatch(removeFromCart(id));
    dispatch(syncCartDB());
    setShowConfirmModal(false);
    toast.success(
      language === "thai"
        ? "ลบรายการเรียบร้อยแล้ว"
        : "Item removed successfully",
    );
  };

  const toggleSelectHandler = (id) => {
    dispatch(toggleSelectItem(id));
    dispatch(syncCartDB());
  };

  const toggleSelectAllHandler = () => {
    dispatch(selectAllItems(!isAllSelected));
    dispatch(syncCartDB());
  };

  const checkoutHandler = () => {
    if (selectedItems.length === 0) {
      toast.warning(
        language === "thai"
          ? "กรุณาเลือกรายการที่ต้องการชำระเงิน"
          : "Please select items to checkout",
      );
      return;
    }
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
          {/* DESKTOP HEADER (Premium Black) */}
          <div className="hidden md:grid grid-cols-12 py-5 mb-8 bg-black text-[11px] font-black uppercase tracking-[0.2em] text-white rounded-t-[2rem] shadow-lg border-b border-white/10">
            <div className="col-span-1 flex items-center justify-center">
              <CustomCheckbox
                checked={isAllSelected}
                onChange={toggleSelectAllHandler}
                variant="white"
              />
            </div>
            <div className="col-span-11 grid grid-cols-11 pl-4">
              <div className="col-span-5 flex items-center text-white/90 whitespace-nowrap">
                {language === "thai" ? "สินค้า / PRODUCT" : "PRODUCT DETAILS"}
              </div>
              <div className="col-span-2 text-right font-black pr-4 text-white/90">
                {language === "thai" ? "ราคา / PRICE" : "UNIT PRICE"}
              </div>
              <div className="col-span-2 text-center font-black text-white/90 whitespace-nowrap">
                {language === "thai" ? "จำนวน / QTY" : "QUANTITY"}
              </div>
              <div className="col-span-2 text-right font-black text-white md:pr-10 whitespace-nowrap">
                {language === "thai" ? "ยอดรวม / SUBTOTAL" : "SUBTOTAL"}
              </div>
            </div>
          </div>

          {/* MOBILE HEADER (Premium Simple) */}
          <div className="md:hidden flex items-center justify-between px-4 py-4 mb-2 bg-slate-50/50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-3">
              <CustomCheckbox
                checked={isAllSelected}
                onChange={toggleSelectAllHandler}
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
                    {/* --- MOBILE VIEW: REFINED COMPACT WHITE CARD --- */}
                    <div className="md:hidden flex flex-col w-full bg-white border border-slate-200 p-4 rounded-3xl shadow-sm mb-4 relative group active:scale-[0.98] transition-all duration-300">
                      {/* Selection and Action Row */}
                      <div className="flex justify-between items-start mb-3">
                        <CustomCheckbox
                          checked={item.isSelected}
                          onChange={() => toggleSelectHandler(item._id)}
                        />
                        <button
                          onClick={() => { setItemToRemoveId(item._id); setShowConfirmModal(true); }}
                          className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                        >
                          <FaTrashAlt size={14} />
                        </button>
                      </div>

                      <div className="flex gap-4 items-center">
                        {/* Image section - Clickable to product detail */}
                        <button
                          onClick={() => navigate(`/product/${item._id}`)}
                          className="w-24 h-24 shrink-0 bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100 rounded-[1.25rem] hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
                        >
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-contain p-2" />
                          ) : (
                            <FaShoppingBag size={24} className="text-slate-300" />
                          )}
                        </button>

                        {/* Details Section */}
                        <div className="flex flex-col flex-1 min-w-0">
                          <Link to={`/orderproduct/${item._id}`} className="text-sm font-bold text-slate-800 uppercase tracking-tight leading-snug mb-0.5 line-clamp-2">
                            {item.name}
                          </Link>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                            SKU: {String(item._id).substring(0, 8)}
                          </span>

                          {/* Price and Quantity Row */}
                          <div className="flex justify-between items-end mt-auto">
                            <div className="flex flex-col">
                              <span className="text-[15px] font-black text-blue-600">{formatPrice(item.price * item.qty)}</span>
                              <span className="text-[10px] font-bold text-slate-400">{formatPrice(item.price)} / ชิ้น</span>
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center justify-between bg-slate-50 rounded-xl p-1 border border-slate-200 w-24">
                              <button
                                onClick={() => addToCartHandler(item, Math.max(1, item.qty - 1))}
                                className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-black transition-colors rounded-lg hover:bg-white border-transparent hover:border-slate-200 border"
                              >
                                <FaMinus size={8} />
                              </button>
                              <span className="text-xs font-black text-slate-800">{item.qty}</span>
                              <button
                                onClick={() => addToCartHandler(item, Math.min(item.countInStock, item.qty + 1))}
                                className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-black transition-colors rounded-lg hover:bg-white border-transparent hover:border-slate-200 border"
                              >
                                <FaPlus size={8} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* --- DESKTOP VIEW (Original Style) --- */}
                    <div className="hidden md:grid md:grid-cols-12 gap-3 md:gap-4 items-start md:items-center w-full px-2 md:px-0">
                      {/* Checkbox */}
                      <div className="col-span-1 flex items-center justify-center shrink-0 pt-1 md:pt-0">
                        <CustomCheckbox
                          checked={item.isSelected}
                          onChange={() => toggleSelectHandler(item._id)}
                        />
                      </div>

                      {/* Unified Content Container */}
                      <div className="col-span-11 flex-1 grid grid-cols-1 md:grid-cols-11 items-center gap-2 md:gap-4 min-w-0">
                        {/* Image and Details Stack */}
                        <div className="col-span-5 flex flex-col md:flex-row gap-3 md:gap-5 w-full">
                          {/* Top row: Image + Name/SKU */}
                          <div className="flex gap-3 md:gap-5 items-start md:items-center w-full">
                            {/* Image - Clickable to product detail */}
                            <button
                              onClick={() => navigate(`/product/${item._id}`)}
                              className="w-16 h-16 md:w-24 md:h-24 bg-slate-50 shrink-0 flex items-center justify-center overflow-hidden rounded-xl border border-slate-100 shadow-sm group-hover:shadow-md group-hover:border-blue-400 transition-all cursor-pointer"
                            >
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
                            </button>

                            {/* Details Context */}
                            <div className="flex flex-col flex-1 min-w-0 py-0.5 md:py-0 md:pr-6 relative">
                              <Link
                                to={`/orderproduct/${item._id}`}
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

        {cartItems.length > 0 && (
          <div className="w-full lg:w-[350px] bg-white p-4 md:p-6 lg:p-8 shrink-0 flex flex-col text-start border-l border-slate-100">
            <h2 className="text-[14px] font-bold text-gray-900 uppercase tracking-wide mb-8">
              Summary
            </h2>
            <div className="flex flex-col flex-grow">
              <div className="flex justify-between items-center mb-4 text-[13px]">
                <span className="text-gray-600 uppercase font-semibold">
                  Subtotal
                </span>
                <span className="text-gray-800 font-bold">
                  {formatPrice(itemsPrice)}
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
                  Selected {selectedItems.length} items
                </span>
              </div>

              <button
                onClick={checkoutHandler}
                disabled={selectedItems.length === 0}
                className={`w-full py-4 rounded-xl text-[14px] font-black tracking-widest uppercase transition-all shadow-xl mb-4 ${selectedItems.length > 0
                  ? "bg-black text-white hover:bg-slate-900 active:scale-95"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
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
        )}

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
