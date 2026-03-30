import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion"; //  เพิ่ม AnimatePresence ตรงนี้ครับ
import {
  FaMapMarkerAlt,
  FaFileInvoice,
  FaBoxOpen,
  FaMoneyBillWave,
  FaChevronRight,
  FaInfoCircle,
  FaShieldAlt,
} from "react-icons/fa";

import Message from "../components/Message";
import CheckoutSteps from "../components/CheckoutSteps";

import { useCreateOrderMutation } from "../slices/ordersApiSlice";
import { clearCartItems } from "../slices/cartSlice";
import Meta from "../components/Meta";

const PlaceOrderScreen = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart);
  const { language } = useSelector((state) => state.language);

  const [createOrder, { isLoading, error }] = useCreateOrderMutation();

  //  Helper ฟังก์ชันสำหรับแก้ปัญหา .toFixed is not a function
  const safeFixed = (amount, decimals = 2) => {
    return Number(amount || 0).toFixed(decimals);
  };

  useEffect(() => {
    if (!cart.shippingAddress.address || !cart.billingAddress.billinggAddress) {
      navigate("/shipping");
    } else if (!cart.paymentTransfer) {
      navigate("/payment");
    }
  }, [
    cart.paymentTransfer,
    cart.shippingAddress.address,
    cart.billingAddress.billinggAddress,
    navigate,
  ]);

  const placeOrderHandler = async () => {
    try {
      const res = await createOrder({
        orderItems: cart.cartItems,
        shippingAddress: cart.shippingAddress,
        billingAddress: cart.billingAddress,
        paymentResult: cart.paymentTransfer,
        itemsPrice: cart.itemsPrice,
        shippingPrice: cart.shippingPrice,
        totalPrice: cart.totalPrice,
        receivePlace: cart.receivePlace,
      }).unwrap();

      dispatch(clearCartItems());
      navigate(`/order/${res._id}`);
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const t = {
    en: {
      stepTitle: "Review & Place Order",
      shipping: "Shipping Address",
      billing: "Tax Invoice Details",
      items: "Items to be ordered",
      summary: "Order Summary",
      itemsCost: "Items Total",
      shippingCost: "Shipping Fee",
      vat: "VAT (7%)",
      total: "Grand Total",
      confirmBtn: "PLACE ORDER NOW",
      emptyCart: "Your cart is empty",
      customerPickUp: "Pickup at Company",
    },
    thai: {
      stepTitle: "ยืนยันรายการสั่งซื้อ",
      shipping: "ที่อยู่สำหรับจัดส่ง",
      billing: "รายละเอียดใบกำกับภาษี",
      items: "รายการสินค้าที่จะสั่ง",
      summary: "สรุปยอดชำระเงิน",
      itemsCost: "รวมค่าสินค้า",
      shippingCost: "ค่าจัดส่งสินค้า",
      vat: "ภาษีมูลค่าเพิ่ม (7%)",
      total: "ยอดชำระสุทธิ",
      confirmBtn: "ยืนยันสั่งซื้อสินค้า",
      emptyCart: "ไม่มีสินค้าในตะกร้า",
      customerPickUp: "มารับสินค้าด้วยตนเองที่บริษัท",
    },
  }[language || "en"];

  // Address Display Component
  const AddressCard = ({ title, icon, data, isPickup = false }) => (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`p-2 rounded-lg ${title === t.shipping ? "bg-slate-100 text-black" : "bg-slate-100 text-black"}`}
        >
          {icon}
        </div>
        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">
          {title}
        </h4>
      </div>

      {isPickup ? (
        <div className="flex-grow flex items-center justify-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-4">
          <p className="text-slate-400 text-sm font-bold">{t.customerPickUp}</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-slate-900 font-bold">
            {data.shippingname || data.billingName}
          </p>
          <p className="text-slate-500 text-sm leading-relaxed">
            {data.address || data.billinggAddress}
            <br />
            {data.city || data.billingCity},{" "}
            {data.postalCode || data.billingPostalCode}
            <br />
            {data.country || data.billingCountry}
          </p>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mt-3 pt-3 border-t border-slate-50">
            <FaInfoCircle /> {data.phone || data.billingPhone}
            {data.tax && data.tax !== "N/A" && (
              <span className="ml-auto text-black">Tax: {data.tax}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 md:px-8 font-sans selection:bg-black selection:text-white">
      <Meta title={t.stepTitle} />
      <div className="max-w-6xl mx-auto">
        <CheckoutSteps step1 step2 step3 step4 />

        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-black text-slate-900 text-center mt-12 mb-12 tracking-tight uppercase"
        >
          {t.stepTitle}
        </motion.h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AddressCard
                title={t.shipping}
                icon={<FaMapMarkerAlt />}
                data={cart.shippingAddress}
                isPickup={cart.receivePlace === "atcompany"}
              />
              <AddressCard
                title={t.billing}
                icon={<FaFileInvoice />}
                data={cart.billingAddress}
              />
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="bg-slate-50/50 px-8 py-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 flex items-center gap-3">
                  <FaBoxOpen className="text-slate-400" /> {t.items}
                </h3>
                <span className="bg-white px-3 py-1 rounded-full text-[10px] font-black text-slate-400 border border-slate-200 uppercase tracking-widest">
                  {cart.cartItems.length} Products
                </span>
              </div>

              <div className="p-0">
                {cart.cartItems.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 font-medium">
                    {t.emptyCart}
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {cart.cartItems.map((item, index) => (
                      <div
                        key={index}
                        className="p-6 flex items-center gap-6 hover:bg-slate-50/50 transition-colors group"
                      >
                        <div className="w-20 h-20 shrink-0 rounded-2xl overflow-hidden border border-slate-100 bg-white p-1">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="flex-grow min-w-0">
                          <Link
                            to={`/product/${item.product}`}
                            className="block text-slate-900 font-bold hover:text-black transition-colors truncate"
                          >
                            {item.name}
                          </Link>
                          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-tighter">
                            REF: {item.product}
                          </p>
                        </div>
                        <div className="text-right whitespace-nowrap">
                          <p className="text-xs font-bold text-slate-400">
                            {item.qty} x {safeFixed(item.price)} ฿
                          </p>
                          <p className="text-sm font-black text-slate-900 mt-0.5">
                            {safeFixed(item.qty * item.price)} ฿
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 lg:sticky lg:top-10">
            <div className="bg-slate-900 rounded-[2.5rem] text-white shadow-2xl overflow-hidden border border-white/10 ring-1 ring-white/5">
              <div className="p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-black rounded-xl shadow-lg shadow-black/30">
                    <FaMoneyBillWave size={18} />
                  </div>
                  <h2 className="text-xl font-black tracking-tight uppercase">
                    {t.summary}
                  </h2>
                </div>

                <div className="space-y-4 mb-10 text-sm font-medium">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>{t.itemsCost}</span>
                    <span className="text-white text-lg font-bold">
                      {safeFixed(cart.itemsPrice)} ฿
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>{t.shippingCost}</span>
                    <span
                      className={`text-lg font-bold ${Number(cart.shippingPrice) === 0 ? "text-emerald-400" : "text-white"}`}
                    >
                      {Number(cart.shippingPrice) === 0
                        ? "FREE"
                        : `${safeFixed(cart.shippingPrice)} ฿`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>{t.vat}</span>
                    <span className="text-white text-lg font-bold">
                      {safeFixed(cart.vatPrice)} ฿
                    </span>
                  </div>
                  <div className="pt-6 border-t border-white/10 mt-6 flex justify-between items-end">
                    <span className="text-sm font-black text-white/60 uppercase tracking-widest">
                      {t.total}
                    </span>
                    <div className="text-right">
                      <span className="text-4xl font-black">
                        {safeFixed(cart.totalPrice)}
                      </span>
                      <span className="text-xs ml-1 text-slate-400 font-bold uppercase tracking-widest">
                        THB
                      </span>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-6 overflow-hidden"
                    >
                      <Message variant="danger">
                        {error?.data?.message || error.error}
                      </Message>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  onClick={placeOrderHandler}
                  disabled={cart.cartItems.length === 0 || isLoading}
                  className="w-full py-5 bg-white text-black hover:bg-slate-100 disabled:bg-slate-700 rounded-2xl font-black text-lg transition-all shadow-xl shadow-black/30 flex items-center justify-center gap-3 group active:scale-[0.98]"
                >
                  {isLoading ? (
                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      {t.confirmBtn}
                      <FaChevronRight className="text-sm group-hover:translate-x-1.5 transition-transform" />
                    </>
                  )}
                </button>
                <div className="mt-8 flex justify-center items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                  <FaShieldAlt className="text-white" /> SECURE CHECKOUT
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceOrderScreen;
