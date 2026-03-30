import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaArrowLeft,
  FaTruck,
  FaMapMarkerAlt,
  FaFileInvoice,
  FaReceipt,
  FaBoxOpen,
  FaMoneyBillWave,
  FaSearchPlus,
  FaCheckCircle,
  FaClipboardList,
  FaPrint,
  FaUserShield,
  FaTimes,
  FaClock,
} from "react-icons/fa";

import Message from "../components/Message";
import Loader from "../components/Loader";
import {
  useGetOrderDetailsQuery,
  usePayOrderMutation,
  useDeliverOrderMutation,
} from "../slices/ordersApiSlice";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

const OrderScreen = () => {
  const { id: orderId } = useParams();

  // Redux & API
  const {
    data: order,
    isLoading,
    error,
    refetch,
  } = useGetOrderDetailsQuery(orderId);
  const [payOrder, { isLoading: loadingPay }] = usePayOrderMutation();
  const [deliverOrder, { isLoading: loadingDeliver }] =
    useDeliverOrderMutation();

  const { userInfo } = useSelector((state) => state.auth);
  const { language } = useSelector((state) => state.language);

  const [zoomedImage, setZoomedImage] = useState(null);
  // State for Tracking Number Input
  const [showShipModal, setShowShipModal] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");

  // Translations
  const t = {
    en: {
      goBack: "Back",
      orderID: "Order ID",
      items: "Items",
      shipping: "Shipping",
      billing: "Billing",
      payment: "Payment",
      summary: "Summary",
      statusDelivered: "Delivered",
      statusProcessing: "Processing",
      statusPaid: "Paid",
      pickupInfo: "Pick-up at Store",
      subtotal: "Subtotal",
      shippingFee: "Shipping",
      vat: "VAT (7%)",
      total: "Total",
      transferID: "Ref ID",
      transferAccount: "Bank",
      transferDate: "Time",
      slip: "Proof of Payment",
      noSlip: "No Slip Uploaded",
      print: "Print Invoice",
      step1: "Order Placed",
      step2: "Paid",
      step3: "Processing",
      step4: "Delivered",
      adminPanel: "Admin Control",
      verifyBtn: "Verify Payment",
      shipBtn: "Mark as Shipped",
      enterTracking: "Enter Tracking Number",
    },
    thai: {
      goBack: "ย้อนกลับ",
      orderID: "คำสั่งซื้อ",
      items: "สินค้า",
      shipping: "ที่อยู่จัดส่ง",
      billing: "ใบกำกับภาษี",
      payment: "ชำระเงิน",
      summary: "สรุปยอด",
      statusDelivered: "จัดส่งสำเร็จ",
      statusProcessing: "รอจัดส่ง",
      statusPaid: "ชำระแล้ว",
      pickupInfo: "รับสินค้าหน้าร้าน",
      subtotal: "รวมสินค้าย่อย",
      shippingFee: "ค่าจัดส่ง",
      vat: "ภาษี (7%)",
      total: "ยอดสุทธิ",
      transferID: "เลขที่อ้างอิง",
      transferAccount: "ธนาคาร",
      transferDate: "เวลาโอน",
      slip: "หลักฐานการโอน",
      noSlip: "ไม่มีหลักฐาน",
      print: "พิมพ์ใบเสร็จ",
      step1: "สั่งซื้อ",
      step2: "ชำระเงิน",
      step3: "เตรียมของ",
      step4: "จัดส่งแล้ว",
      adminPanel: "แผงควบคุมแอดมิน",
      verifyBtn: "ยืนยันยอดเงิน",
      shipBtn: "แจ้งจัดส่ง",
      enterTracking: "กรอกเลขพัสดุ",
    },
  }[language || "en"];

  if (isLoading)
    return (
      <div className="min-h-screen flex justify-center items-center bg-slate-50">
        <Loader />
      </div>
    );
  if (error)
    return (
      <div className="max-w-4xl mx-auto py-10 px-4">
        <Message variant="danger">
          {error?.data?.message || error.error}
        </Message>
      </div>
    );

  // --- Logic for Timeline ---
  const steps = [
    { icon: FaClipboardList, label: t.step1, active: true },
    { icon: FaMoneyBillWave, label: t.step2, active: order.isPaid },
    { icon: FaBoxOpen, label: t.step3, active: order.isPaid },
    { icon: FaTruck, label: t.step4, active: order.isDelivered },
  ];

  // --- Admin Handlers ---
  const onVerifyPayment = async () => {
    try {
      await payOrder({ orderId, details: { payer: "Admin Manual Verify" } });
      refetch();
      toast.success("Payment Verified! Status updated to Paid.");
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const onDeliverOrder = async () => {
    try {
      await deliverOrder({
        orderId,
        transferedNumber: trackingNumber || "Not Provided",
      }).unwrap();
      refetch();
      setShowShipModal(false);
      toast.success("Order Marked as Delivered!");
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  // Helper to get slip image (supports both 'image' and 'paymentSlip' fields)
  const slipImage =
    order.paymentResult?.image || order.paymentResult?.paymentSlip;

  return (
    <div className="bg-slate-50 min-h-screen py-8 md:py-12 font-sans text-slate-900 antialiased font-prompt selection:bg-indigo-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* --- Header: Breadcrumb & Actions --- */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          {/*  อัจฉริยะ: เช็คว่าเป็น Admin ให้กลับไปหน้า AdminList ถ้าไม่ใช่ให้กลับไป Profile */}
          <Link
            to={userInfo?.isAdmin ? "/admin/orderlist" : "/profile?tab=orders"}
            className="inline-flex items-center gap-3 text-slate-500 hover:text-indigo-600 font-bold transition-all group active:scale-95"
          >
            <div className="w-10 h-10 bg-white rounded-full shadow-sm border border-slate-200 flex items-center justify-center group-hover:border-indigo-200 group-hover:shadow-md transition-all">
              <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
            </div>
            <span className="hidden sm:inline-block tracking-wide uppercase text-sm">
              {t.goBack}
            </span>
          </Link>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 rounded-full text-slate-700 font-bold shadow-sm hover:shadow-md hover:border-indigo-200 hover:text-indigo-600 transition-all active:scale-95 text-sm uppercase tracking-widest print:hidden"
          >
            <FaPrint /> {t.print}
          </button>
        </div>

        {/* --- Order Header Card (Status & Timeline) --- */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div
            className={`p-6 sm:p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-black`}
          >
            <div>
              <h4 className="text-2xl font-black mb-1 flex items-center gap-3 tracking-tight">
                {t.orderID}{" "}
                <span className="text-white/80 select-all">
                  #
                  {order.paymentResult?.paymentComfirmID ||
                    String(order._id).substring(0, 8)}
                </span>
              </h4>
              <span className="text-white/80 text-sm font-medium tracking-wide uppercase">
                {format(new Date(order.createdAt), "PPP p")}
              </span>
            </div>
            <div>
              {order.isDelivered ? (
                <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-black uppercase tracking-widest shadow-inner border border-white/20">
                  <FaCheckCircle />
                  {t.statusDelivered}
                </span>
              ) : order.isPaid ? (
                <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-black uppercase tracking-widest shadow-inner border border-white/20">
                  <FaBoxOpen />
                  {t.statusProcessing}
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-black uppercase tracking-widest shadow-inner border border-white/20">
                  <FaMoneyBillWave />
                  Pending Payment
                </span>
              )}
            </div>
          </div>

          <div className="p-6 sm:p-12">
            {/* Timeline Stepper */}
            <div className="relative flex justify-between items-center max-w-4xl mx-auto">
              {/* Background Track */}
              <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 h-1.5 bg-slate-100 rounded-full z-0"></div>

              {/* Active Track */}
              <motion.div
                className={`absolute top-1/2 left-0 -translate-y-1/2 h-1.5 rounded-full z-0 bg-black`}
                initial={{ width: 0 }}
                animate={{
                  width: `${order.isDelivered ? 100 : order.isPaid ? 50 : 0}%`,
                }}
                transition={{ duration: 1, ease: "easeOut" }}
              ></motion.div>

              {steps.map((step, index) => (
                <div
                  key={index}
                  className="text-center relative z-10 bg-white px-2"
                >
                  <div
                    className={`w-10 h-10 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-md border-2 sm:border-4 transition-all duration-500 ${step.active ? "bg-black border-slate-100 text-white" : "bg-white border-slate-100 text-slate-300"}`}
                  >
                    <step.icon className="text-lg sm:text-2xl" />
                  </div>
                  <div
                    className={`mt-3 font-bold text-[10px] sm:text-xs uppercase tracking-widest ${step.active ? "text-slate-800" : "text-slate-400"}`}
                  >
                    {step.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* --- LEFT COLUMN: Details --- */}
          <div className="lg:col-span-8 space-y-8">
            {/* Items List */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50/50 p-6 border-b border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center text-black">
                  <FaBoxOpen size={18} />
                </div>
                <h6 className="font-black text-slate-800 uppercase tracking-widest m-0">
                  {t.items}
                </h6>
              </div>
              <div className="p-0">
                {order.orderItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center p-4 sm:p-6 border-b border-slate-100 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="w-20 h-20 rounded-2xl border border-slate-200 bg-white p-1 shrink-0 overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover rounded-xl group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div className="ml-4 sm:ml-6 flex-1 min-w-0">
                      <Link
                        to={`/product/${item.product_id}`}
                        className="text-lg font-bold text-slate-800 hover:text-indigo-600 transition-colors truncate block"
                      >
                        {item.name}
                      </Link>
                      <div className="text-sm font-medium text-slate-500 mt-1 uppercase tracking-wider">
                        {item.qty}{" "}
                        <span className="mx-2 text-slate-300">x</span> ฿
                        {item.price?.toLocaleString()}
                      </div>
                    </div>
                    <div className="font-black text-slate-900 text-lg sm:text-xl tracking-tighter ml-4">
                      ฿{(item.qty * item.price).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Address Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-4 sm:p-8 relative overflow-hidden group">
                <FaMapMarkerAlt
                  className="absolute -right-4 -bottom-4 text-slate-50 opacity-10 group-hover:opacity-20 transition-opacity"
                  size={120}
                />
                <h6 className="font-black text-slate-800 flex items-center gap-3 uppercase tracking-widest mb-6 relative z-10">
                  <span className="w-8 h-8 rounded-full bg-slate-100 text-black flex items-center justify-center">
                    <FaMapMarkerAlt />
                  </span>
                  {t.shipping}
                </h6>
                {order.shippingAddress.receivePlace === "bysending" ? (
                  <div className="relative z-10 text-slate-600 font-medium leading-relaxed">
                    <p className="font-black text-slate-900 text-lg mb-1">
                      {order.shippingAddress.shippingname}
                    </p>
                    <p className="mb-2 text-black font-bold">
                      {order.shippingAddress.phone}
                    </p>
                    <p className="m-0 text-sm">
                      {order.shippingAddress.address},{" "}
                      {order.shippingAddress.city}{" "}
                      {order.shippingAddress.postalCode}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-6 bg-slate-50 rounded-2xl border border-slate-100 relative z-10">
                    <span className="font-black text-black uppercase tracking-widest">
                      {t.pickupInfo}
                    </span>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-4 sm:p-8 relative overflow-hidden group">
                <FaFileInvoice
                  className="absolute -right-4 -bottom-4 text-slate-50 opacity-10 group-hover:opacity-20 transition-opacity"
                  size={120}
                />
                <h6 className="font-black text-slate-800 flex items-center gap-3 uppercase tracking-widest mb-6 relative z-10">
                  <span className="w-8 h-8 rounded-full bg-slate-100 text-black flex items-center justify-center">
                    <FaFileInvoice />
                  </span>
                  {t.billing}
                </h6>
                <div className="relative z-10 text-slate-600 font-medium leading-relaxed">
                  <p className="font-black text-slate-900 text-lg mb-1">
                    {order.billingAddress.billingName}
                  </p>
                  <p className="mb-4 text-sm">
                    {order.billingAddress.billinggAddress},{" "}
                    {order.billingAddress.billingCity}
                  </p>
                  {order.billingAddress.tax && (
                    <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-black uppercase tracking-widest border border-slate-200">
                      TAX: {order.billingAddress.tax}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* --- RIGHT COLUMN: Summary & Payment --- */}
          <div className="lg:col-span-4 space-y-8">
            {/* 1. ADMIN PANEL (Only visible to Admin) */}
            {userInfo?.isAdmin && (
              <div className="bg-slate-900 rounded-[2rem] shadow-xl shadow-slate-900/10 overflow-hidden print:hidden border border-slate-800">
                <div className="bg-slate-800/50 p-5 flex items-center gap-3 border-b border-slate-800">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center border border-amber-500/30">
                    <FaUserShield size={18} />
                  </div>
                  <h6 className="font-black text-white m-0 uppercase tracking-widest">
                    {t.adminPanel}
                  </h6>
                </div>

                <div className="p-6">
                  {/* Verify Payment Button */}
                  {!order.isPaid ? (
                    <div className="space-y-3">
                      <button
                        onClick={onVerifyPayment}
                        disabled={loadingPay}
                        className="w-full flex items-center justify-center gap-3 bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all text-white font-black py-4 rounded-xl uppercase tracking-widest shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:scale-100"
                      >
                        {loadingPay ? (
                          "Processing..."
                        ) : (
                          <>
                            <FaCheckCircle size={18} /> {t.verifyBtn}
                          </>
                        )}
                      </button>
                      <p className="text-center text-slate-400 text-xs font-medium m-0">
                        Check the slip below before verifying.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-sm mb-4">
                      <FaCheckCircle /> Payment Verified
                    </div>
                  )}

                  {/* Ship Order Button */}
                  {order.isPaid && !order.isDelivered && (
                    <div className="mt-4">
                      <button
                        onClick={() => setShowShipModal(true)}
                        disabled={loadingDeliver}
                        className="w-full flex items-center justify-center gap-3 bg-indigo-500 hover:bg-indigo-600 active:scale-95 transition-all text-white font-black py-4 rounded-xl uppercase tracking-widest shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:scale-100"
                      >
                        {loadingDeliver ? (
                          "Processing..."
                        ) : (
                          <>
                            <FaTruck size={18} /> {t.shipBtn}
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. Order Summary */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden sticky top-8">
              <div className="p-6 sm:p-8">
                <h5 className="font-black text-slate-800 text-xl tracking-tight mb-6 uppercase">
                  {t.summary}
                </h5>

                <div className="space-y-4 mb-6 pt-2">
                  <div className="flex justify-between items-center text-sm font-medium text-slate-500">
                    <span className="uppercase tracking-widest">
                      {t.subtotal}
                    </span>
                    <span className="font-bold text-slate-700 tracking-tighter">
                      ฿{order.itemsPrice?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-medium text-slate-500">
                    <span className="uppercase tracking-widest">{t.vat}</span>
                    <span className="font-bold text-slate-700 tracking-tighter">
                      ฿{order.vatPrice?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-medium text-slate-500">
                    <span className="uppercase tracking-widest">
                      {t.shippingFee}
                    </span>
                    <span className="font-bold text-slate-700 tracking-tighter">
                      ฿{order.shippingPrice?.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-200 border-dashed pt-6 flex justify-between items-end">
                  <span className="font-black text-slate-400 uppercase tracking-widest text-xs mb-1">
                    {t.total}
                  </span>
                  <span className="font-black text-black text-4xl tracking-tighter leading-none">
                    ฿{order.totalPrice?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Payment Info & Slip */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50/50 p-6 border-b border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center border border-slate-200 shadow-sm">
                  <FaReceipt size={18} />
                </div>
                <h6 className="font-black text-slate-800 m-0 uppercase tracking-widest">
                  {t.payment}
                </h6>
              </div>

              <div className="p-6 sm:p-8">
                {order.paymentResult ? (
                  <>
                    <div className="space-y-3 mb-8">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 font-medium uppercase tracking-widest text-xs">
                          {t.transferAccount}
                        </span>
                        <span className="font-bold text-slate-800">
                          {order.paymentResult.transferedName}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 font-medium uppercase tracking-widest text-xs">
                          {t.transferDate}
                        </span>
                        <span className="font-bold text-slate-800">
                          {order.paymentResult.transferedDate
                            ? format(
                              new Date(order.paymentResult.transferedDate),
                              "p P",
                            )
                            : "-"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 font-medium uppercase tracking-widest text-xs">
                          {t.transferID}
                        </span>
                        <span className="font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-bold border border-slate-200">
                          {order.paymentResult.paymentComfirmID}
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest text-center mb-3">
                        {t.slip}
                      </p>
                      {slipImage ? (
                        <button
                          type="button"
                          className="w-full h-48 rounded-2xl border-2 border-slate-100 border-dashed relative overflow-hidden group cursor-zoom-in block"
                          onClick={() => setZoomedImage(slipImage)}
                        >
                          <img
                            src={slipImage}
                            alt="Payment Slip"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white border border-white/30 backdrop-blur-md">
                              <FaSearchPlus size={20} />
                            </div>
                          </div>
                        </button>
                      ) : (
                        <div className="bg-slate-50 rounded-2xl py-8 flex flex-col items-center justify-center border-2 border-slate-100 border-dashed text-slate-400">
                          <FaFileInvoice
                            size={32}
                            className="mb-3 opacity-50"
                          />
                          <span className="text-xs font-bold uppercase tracking-widest">
                            {t.noSlip}
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center p-4 bg-amber-50 text-amber-600 rounded-xl font-black uppercase tracking-widest text-sm border border-amber-100">
                    <FaClock className="mr-2 animate-spin-slow" /> Pending
                    Payment
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODAL: Shipping Tracking Number --- */}
      <Modal
        isOpen={showShipModal}
        onClose={() => setShowShipModal(false)}
        title={
          <span className="flex items-center gap-2 font-black uppercase tracking-widest text-lg">
            <FaTruck className="text-indigo-500" /> {t.shipBtn}
          </span>
        }
      >
        <div className="mt-4 mb-8">
          <Input
            label={t.enterTracking}
            placeholder="e.g. TH0123456789"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            icon={<FaMapMarkerAlt />}
          />
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-6">
          <Button variant="outline" onClick={() => setShowShipModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={onDeliverOrder}
            disabled={loadingDeliver}
          >
            Confirm Shipment
          </Button>
        </div>
      </Modal>

      {/* --- Lightbox Modal --- */}
      <AnimatePresence>
        {zoomedImage && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/90 backdrop-blur-md"
              onClick={() => setZoomedImage(null)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative max-w-4xl w-full max-h-[90vh] flex justify-center pointer-events-none"
            >
              <button
                onClick={() => setZoomedImage(null)}
                className="absolute -top-4 -right-4 sm:-top-6 sm:-right-6 w-12 h-12 bg-white text-slate-800 rounded-full flex items-center justify-center shadow-2xl hover:bg-slate-100 hover:scale-110 active:scale-95 transition-all pointer-events-auto z-10"
              >
                <FaTimes size={20} />
              </button>
              <img
                src={zoomedImage}
                alt="Payment Slip Full"
                className="rounded-2xl shadow-2xl max-h-[85vh] object-contain pointer-events-auto border-2 border-white/10"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
            .animate-spin-slow { animation: spin 3s linear infinite; }
            @media print {
                body { background-color: white !important; }
            }
        `}</style>
    </div>
  );
};

export default OrderScreen;
