import React from "react";
import { useSelector } from "react-redux";
import {
  FaBoxOpen,
  FaSearch,
  FaChevronRight,
  FaTruck,
  FaMicrochip,
  FaRegClock,
  FaCopy,
} from "react-icons/fa";
import { toast } from "react-toastify";
import Message from "../../components/Message";
import Loader from "../../components/Loader";
import { useGetMyOrdersQuery } from "../../slices/ordersApiSlice";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const CustomerOrderPCBList = () => {
  const { data: orders, isLoading, error } = useGetMyOrdersQuery();
  const { language } = useSelector((state) => state.language);

  const translations = {
    // ... (previous change already did this, but I need to be careful with TargetContent)
    en: {
      productorders: "PCB Order History",
      qty: "Units",
      orderIdLbl: "Order ID",
      orderDateLbl: "Date",
      orderTotalLbl: "Total Cost",
      orderDeliveredLbl: "Status",
      orderDetailsLbl: "Details",
      statusDelivered: "Delivered",
      statusProcessing: "Processing",
      emptyState: "No PCB orders found",
      trackingLbl: "Tracking No.",
    },
    thai: {
      productorders: "ประวัติการสั่งผลิต PCB",
      qty: "จำนวน",
      orderIdLbl: "รหัสสั่งซื้อ",
      orderDateLbl: "วันที่สั่ง",
      orderTotalLbl: "ยอดรวม",
      orderDeliveredLbl: "สถานะ",
      orderDetailsLbl: "รายละเอียด",
      statusDelivered: "จัดส่งแล้ว",
      statusProcessing: "กำลังผลิต/เตรียมส่ง",
      emptyState: "ไม่พบรายการสั่งผลิต PCB",
      trackingLbl: "เลขพัสดุ",
    },
  }[language || "en"];

  if (isLoading)
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader />
      </div>
    );
  if (error)
    return (
      <div className="mt-8">
        <Message variant="danger">
          {error?.data?.message || error.error}
        </Message>
      </div>
    );

  // Empty State
  if (!orders || orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-[2rem] border border-slate-100 shadow-sm mt-8">
        <div className="w-24 h-24 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-6 shadow-inner border border-slate-100/50">
          <FaBoxOpen size={40} />
        </div>
        <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">
          {translations.emptyState}
        </h3>
        <p className="text-sm font-medium text-slate-400">
          You haven't placed any product orders yet.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-pageFade">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center shadow-sm border border-indigo-100/50">
            <FaBoxOpen size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight m-0">
              {translations.productorders}
            </h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
              Total: {orders.length} Orders
            </p>
          </div>
        </div>
      </div>

      {/* Modern List Section */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 items-center bg-slate-50/50 px-6 py-4 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-3">{translations.orderIdLbl}</div>
          <div className="col-span-2">{translations.orderDateLbl}</div>
          <div className="col-span-2 text-center">{translations.qty}</div>
          <div className="col-span-2 text-right">
            {translations.orderTotalLbl}
          </div>
          <div className="col-span-2 text-center">
            {translations.orderDeliveredLbl}
          </div>
        </div>

        <div className="divide-y divide-slate-50">
          {[...orders]
            .filter((o) => o.orderType === "pcb")
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map((order, index) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                key={order.id}
                className="group relative flex flex-col md:grid md:grid-cols-12 gap-4 items-start md:items-center p-6 hover:bg-slate-50/50 transition-colors"
              >
                {/* Mobile Header: Order ID & Date */}
                <div className="w-full md:hidden flex justify-between items-center mb-2">
                  <span className="font-mono text-sm font-bold text-slate-800">
                    {order.paymentComfirmID || String(order.id).substring(0, 8)}
                  </span>
                  <span className="text-xs font-medium text-slate-400">
                    {order.createdAt?.substring(0, 10)}
                  </span>
                </div>

                {/* Desktop: Index */}
                <div className="hidden md:block col-span-1 text-center font-bold text-slate-300 text-xs">
                  {index + 1}
                </div>

                {/* Desktop: Order ID */}
                <div className="hidden md:block col-span-3 font-mono text-sm font-bold text-slate-800 truncate pr-4">
                  {order.paymentComfirmID || order.id}
                </div>

                {/* Desktop: Date */}
                <div className="hidden md:block col-span-2 text-sm font-medium text-slate-500">
                  {order.createdAt?.substring(0, 10)}
                </div>

                {/* Shared: Qty */}
                <div className="col-span-12 md:col-span-2 w-full md:w-auto flex justify-between md:justify-center items-center">
                  <span className="md:hidden text-xs font-bold uppercase tracking-widest text-slate-400">
                    {translations.qty}
                  </span>
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold border border-slate-200 shadow-sm">
                    {order.totalQty || 0}
                  </span>
                </div>

                {/* Shared: Total Price */}
                <div className="col-span-12 md:col-span-2 w-full md:w-auto flex justify-between md:right text-right items-center">
                  <span className="md:hidden text-xs font-bold uppercase tracking-widest text-slate-400">
                    {translations.orderTotalLbl}
                  </span>
                  <span className="font-black text-slate-900 md:text-right w-full text-base tracking-tight">
                    {order.totalPrice?.toLocaleString()} ฿
                  </span>
                </div>

                {/* Shared: Status & Action Link */}
                <div className="col-span-12 md:col-span-2 w-full md:w-auto flex justify-between md:justify-center items-center mt-2 md:mt-0 pt-4 md:pt-0 border-t md:border-0 border-slate-100">
                  <span className="md:hidden text-xs font-bold uppercase tracking-widest text-slate-400">
                    {translations.orderDeliveredLbl}
                  </span>
                  <div className="flex items-center gap-4 md:justify-center">
                    {order.isDelivered ? (
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                        {translations.statusDelivered}
                      </span>
                    ) : order.isManufacting ||
                      order.status === "manufacturing" ? (
                      <span className="px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap flex items-center gap-1.5">
                        <FaMicrochip className="animate-pulse" size={10} />
                        {language === "thai" ? "กำลังผลิต" : "Manufacturing"}
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                        {translations.statusProcessing}
                      </span>
                    )}

                    {order.isDelivered && order.deliveryID && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          navigator.clipboard.writeText(order.deliveryID);
                          toast.success(
                            language === "thai"
                              ? "คัดลอกเลขพัสดุแล้ว!"
                              : "Tracking copied!",
                          );
                        }}
                        className="hidden lg:flex flex-col items-end min-w-[120px] hover:bg-slate-50 p-1 px-2 rounded-lg transition-colors group/trk"
                      >
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1">
                          {translations.trackingLbl}
                          <FaCopy
                            className="opacity-0 group-hover/trk:opacity-100 transition-opacity"
                            size={8}
                          />
                        </span>
                        <span className="font-mono text-xs font-black text-indigo-600">
                          {order.deliveryID}
                        </span>
                      </button>
                    )}

                    <Link
                      to={`/order/${order.id}`}
                      className="absolute inset-0 z-10"
                      title={translations.orderDetailsLbl}
                    >
                      <span className="sr-only">View Details</span>
                    </Link>

                    {/* Visual Chevron for Desktop Clickability */}
                    <div className="hidden md:flex w-8 h-8 rounded-full bg-white border border-slate-200 items-center justify-center text-slate-300 group-hover:border-indigo-200 group-hover:text-indigo-500 group-hover:shadow-sm transition-all group-active:scale-95 z-20 pointer-events-none">
                      <FaChevronRight
                        size={12}
                        className="group-hover:translate-x-0.5 transition-transform"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default CustomerOrderPCBList;
