import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import Message from "../components/Message";
import Loader from "../components/Loader";
import { useProfileMutation } from "../slices/usersApiSlice";
import { useGetMyOrdersQuery } from "../slices/ordersApiSlice";
import { setCredentials } from "../slices/authSlice";
import {
  FaUser,
  FaBoxOpen,
  FaMapMarkerAlt,
  FaShoppingBag,
  FaCheckCircle,
  FaRegClock,
  FaTruck,
  FaCopy,
  FaStore,
  FaMicrochip,
  FaIdCard,
  FaCog,
  FaReceipt,
} from "react-icons/fa";

const ProfileScreen = () => {
  const [activeTab, setActiveTab] = useState("orders");
  const [orderFilter, setOrderFilter] = useState("all");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [shippingName, setShippingName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("Thailand");
  const [taxId, setTaxId] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);

  const [updateProfile, { isLoading: loadingUpdateProfile }] =
    useProfileMutation();
  const {
    data: orders,
    isLoading: loadingOrders,
    error: errorOrders,
    refetch,
  } = useGetMyOrdersQuery();

  useEffect(() => {
    if (userInfo) {
      setName(userInfo.name || "");
      setEmail(userInfo.email || "");

      const shipAddr = userInfo.shippingAddress || {};
      setShippingName(shipAddr.shippingname || userInfo.name || "");
      setPhone(shipAddr.phone || userInfo.phone || "");
      setAddress(shipAddr.address || "");
      setCity(shipAddr.city || "");
      setPostalCode(shipAddr.postalCode || "");
      setCountry(shipAddr.country || "Thailand");

      setTaxId(userInfo.billingAddress?.tax || "");
    }
    refetch();
  }, [userInfo, refetch]);

  const submitHandler = async (e) => {
    e.preventDefault();
    if (password && password !== confirmPassword) {
      toast.error("รหัสผ่านไม่ตรงกัน");
      return;
    }

    try {
      const updatedData = {
        _id: userInfo._id,
        name,
        email,
        password,
        shippingAddress: {
          shippingname: shippingName,
          phone,
          address,
          city,
          postalCode,
          country,
        },
        billingAddress: { ...userInfo.billingAddress, tax: taxId },
      };

      const res = await updateProfile(updatedData).unwrap();
      dispatch(setCredentials({ ...res }));
      toast.success("อัปเดตข้อมูลสำเร็จเรียบร้อย");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const getCategoryStyle = (type) => {
    return {
      name:
        type === "product"
          ? "สินค้าทั่วไป"
          : type === "custom"
            ? "สั่งทำ PCB"
            : type === "pcb"
              ? "สั่งผลิต PCB"
              : type === "copy"
                ? "ก๊อปปี้ PCB"
                : type === "assembly"
                  ? "งานประกอบ"
                  : "รายการสั่งซื้อ",
      color: "bg-black text-white border-black",
    };
  };

  const handleCopyTracking = (trackingNo) => {
    if (
      !trackingNo ||
      trackingNo.includes("SUCCESS") ||
      trackingNo.includes("PICKUP")
    )
      return;
    navigator.clipboard.writeText(trackingNo);
    toast.success("คัดลอกเลขพัสดุแล้ว!");
  };

  const paidOrders = orders
    ? [...orders]
        .filter(
          (order) =>
            order.isPaid ||
            order.status === "paid" ||
            order.status === "accepted" ||
            order.status === "manufacturing" ||
            (order.paymentSlip && order.paymentSlip.trim() !== ""),
        )
        .sort(
          (a, b) =>
            new Date(b.createdAt || b.created_at) -
            new Date(a.createdAt || a.created_at),
        )
    : [];

  const filteredOrders = paidOrders.filter((order) => {
    const isDeliv = order.isDelivered === 1 || order.isDelivered === true;
    if (orderFilter === "processing") return !isDeliv;
    if (orderFilter === "delivered") return isDeliv;
    return true;
  });

  const processingCount = paidOrders.filter(
    (o) => !(o.isDelivered === 1 || o.isDelivered === true),
  ).length;
  const deliveredCount = paidOrders.filter(
    (o) => o.isDelivered === 1 || o.isDelivered === true,
  ).length;

  return (
    <div className="bg-slate-50 min-h-screen pt-20 md:pt-32 pb-20 font-prompt text-slate-800 antialiased overflow-x-hidden selection:bg-black selection:text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-start">
          {/*  SIDEBAR: แผงเมนูด้านซ้าย */}
          <div className="w-full lg:w-1/4 flex flex-col gap-6 sticky top-22 z-10 self-start">
            {/* Profile Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center text-center relative overflow-hidden group w-full transition-all duration-500 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="relative w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 mb-5 shadow-inner border-4 border-white transform group-hover:scale-105 transition-transform duration-500">
                <FaUser size={40} className="drop-shadow-sm" />
              </div>

              <h2 className="relative text-xl font-black text-slate-900 mb-1 tracking-tight truncate w-full px-2">
                {userInfo?.name}
              </h2>
              <p className="relative text-sm font-medium text-slate-500 mb-5 truncate w-full px-2">
                {userInfo?.email}
              </p>

              <span className="relative px-5 py-2 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm backdrop-blur-sm">
                {userInfo?.isAdmin ? "Administrator" : "Member"}
              </span>
            </div>

            {/* Navigation Menu */}
            <div className="bg-white/80 backdrop-blur-xl rounded-[1.5rem] md:rounded-[2rem] border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col p-2 gap-2 w-full sticky top-20 lg:static z-20">
              <button
                onClick={() => setActiveTab("orders")}
                className={`w-full flex items-center justify-center lg:justify-start gap-2.5 md:gap-3 px-4 md:px-5 py-3.5 md:py-4 rounded-[1.2rem] md:rounded-[1.5rem] transition-all duration-500 ease-out border ${
                  activeTab === "orders"
                    ? "bg-black text-white border-black shadow-lg transform scale-[1.02]"
                    : "bg-transparent text-slate-500 border-transparent hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <FaShoppingBag
                  className={`shrink-0 text-[18px] transition-transform duration-500 ${activeTab === "orders" ? "text-white scale-110" : "text-slate-400 group-hover:scale-110"}`}
                />
                <span className="text-sm font-bold whitespace-nowrap tracking-tight">
                  ประวัติสั่งซื้อ
                </span>
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={`w-full flex items-center justify-center lg:justify-start gap-2.5 md:gap-3 px-4 md:px-5 py-3.5 md:py-4 rounded-[1.2rem] md:rounded-[1.5rem] transition-all duration-500 ease-out border ${
                  activeTab === "settings"
                    ? "bg-black text-white border-black shadow-lg transform scale-[1.02]"
                    : "bg-transparent text-slate-500 border-transparent hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <FaCog
                  className={`shrink-0 text-[18px] transition-transform duration-500 ${activeTab === "settings" ? "text-white rotate-90" : "text-slate-400 group-hover:rotate-90"}`}
                />
                <span className="text-sm font-bold whitespace-nowrap tracking-tight">
                  ตั้งค่าที่อยู่
                </span>
              </button>
            </div>
          </div>

          {/*  MAIN CONTENT: พื้นที่แสดงข้อมูลฝั่งขวา */}
          <div className="w-full lg:w-3/4 self-start">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.98 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              >
                {/*  TAB: ประวัติการสั่งซื้อ */}
                {activeTab === "orders" && (
                  <div className="space-y-6 text-start">
                    {/* แถบสรุปตัวเลข (Glassmorphism Stats) */}
                    <div className="grid grid-cols-2 gap-4 md:gap-6">
                      <div className="bg-white/80 backdrop-blur-xl border border-white/50 p-5 md:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col sm:flex-row items-center sm:items-start gap-4 md:gap-5 text-center sm:text-left transition-transform duration-500 hover:-translate-y-1">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-amber-50 to-orange-50 text-amber-500 rounded-[1.2rem] flex items-center justify-center shrink-0 border border-amber-100/50 shadow-inner">
                          <FaRegClock size={24} className="md:hidden" />
                          <FaRegClock size={28} className="hidden md:block" />
                        </div>
                        <div>
                          <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-1 md:mb-2 truncate">
                            กำลังดำเนินการ
                          </p>
                          <p className="text-2xl md:text-4xl font-black text-slate-900 leading-none tracking-tight">
                            {processingCount}{" "}
                            <span className="text-[10px] md:text-sm font-bold text-slate-400 tracking-normal ml-1">
                              รายการ
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="bg-white/80 backdrop-blur-xl border border-white/50 p-5 md:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col sm:flex-row items-center sm:items-start gap-4 md:gap-5 text-center sm:text-left transition-transform duration-500 hover:-translate-y-1">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-500 rounded-[1.2rem] flex items-center justify-center shrink-0 border border-emerald-100/50 shadow-inner">
                          <FaCheckCircle size={24} className="md:hidden" />
                          <FaCheckCircle
                            size={28}
                            className="hidden md:block"
                          />
                        </div>
                        <div>
                          <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-1 md:mb-2 truncate">
                            จัดส่งสำเร็จ
                          </p>
                          <p className="text-2xl md:text-4xl font-black text-slate-900 leading-none tracking-tight">
                            {deliveredCount}{" "}
                            <span className="text-[10px] md:text-sm font-bold text-slate-400 tracking-normal ml-1">
                              รายการ
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Filters (Pill Design) */}
                    <div className="flex flex-wrap gap-2 p-1.5 bg-white/60 backdrop-blur-md rounded-2xl w-fit shadow-sm border border-slate-200/50">
                      <button
                        onClick={() => setOrderFilter("all")}
                        className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 ease-out ${orderFilter === "all" ? "bg-slate-900 text-white shadow-md transform scale-105" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"}`}
                      >
                        ทั้งหมด{" "}
                        <span className="opacity-70 ml-1">
                          ({paidOrders.length})
                        </span>
                      </button>
                      <button
                        onClick={() => setOrderFilter("processing")}
                        className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 ease-out ${orderFilter === "processing" ? "bg-slate-900 text-white shadow-md transform scale-105" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"}`}
                      >
                        กำลังเตรียม{" "}
                        <span className="opacity-70 ml-1">
                          ({processingCount})
                        </span>
                      </button>
                      <button
                        onClick={() => setOrderFilter("delivered")}
                        className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 ease-out ${orderFilter === "delivered" ? "bg-slate-900 text-white shadow-md transform scale-105" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"}`}
                      >
                        จัดส่งแล้ว{" "}
                        <span className="opacity-70 ml-1">
                          ({deliveredCount})
                        </span>
                      </button>
                    </div>

                    {/* Order List */}
                    {loadingOrders ? (
                      <Loader />
                    ) : errorOrders ? (
                      <Message variant="danger">
                        เกิดข้อผิดพลาดในการโหลดข้อมูล
                      </Message>
                    ) : filteredOrders.length === 0 ? (
                      <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-16 text-center border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center justify-center min-h-[300px]">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                          <FaBoxOpen className="text-5xl text-slate-300" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">
                          ไม่พบรายการสั่งซื้อ
                        </h3>
                        <p className="text-slate-400 text-sm font-medium mt-2">
                          ไม่มีออเดอร์ในสถานะที่คุณเลือกในขณะนี้
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-5">
                        {filteredOrders.map((order, index) => {
                          const isDelivered =
                            order.isDelivered === 1 ||
                            order.isDelivered === true;
                          const isAtCompany =
                            order.receivePlace === "atcompany";
                          const cat = getCategoryStyle(order.orderType);

                          return (
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                duration: 0.4,
                                delay: index * 0.05,
                              }}
                              key={`${order.orderType}-${order.id}`}
                              onClick={() =>
                                navigate(
                                  order.orderType === "product"
                                    ? `/order/${order.id}`
                                    : `/orderpcbs/${order.id}`,
                                )
                              }
                              className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 overflow-hidden flex flex-col cursor-pointer group/card"
                            >
                              {/* Card Header */}
                              <div className="flex flex-wrap justify-between items-center gap-3 px-5 py-4 bg-slate-50/50 border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm border border-slate-200 shrink-0">
                                    <FaReceipt
                                      className="text-slate-400"
                                      size={14}
                                    />
                                  </div>
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono font-black text-sm text-slate-900 tracking-tight">
                                        #{String(order.id).padStart(6, "0")}
                                      </span>
                                      <span
                                        className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider border ${cat.color}`}
                                      >
                                        {cat.name}
                                      </span>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 mt-0.5">
                                      <FaRegClock
                                        className="inline mr-1"
                                        size={9}
                                      />
                                      {new Date(
                                        order.createdAt || order.created_at,
                                      ).toLocaleDateString("th-TH", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">
                                    ยอดสุทธิ
                                  </p>
                                  <p className="text-base font-black text-black tracking-tight">
                                    {order.amount
                                      ? Number(order.amount).toLocaleString()
                                      : "0"}{" "}
                                    <span className="text-xs font-bold ml-0.5">
                                      ฿
                                    </span>
                                  </p>
                                </div>
                              </div>

                              {/*  แก้ไข Card Body (Items): ให้กะทัดรัด (Compact) อ่านง่าย ไม่รกตา */}
                              <div className="px-5 py-3 bg-white">
                                {order.orderType === "product" &&
                                Array.isArray(order.orderItems) ? (
                                  <div className="flex flex-col gap-2">
                                    {order.orderItems.map((item, idx) => (
                                      <div
                                        key={idx}
                                        className="flex justify-between items-center text-sm py-1.5 border-b border-slate-50 last:border-0"
                                      >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                          {item.image ? (
                                            <img
                                              src={item.image}
                                              className="w-7 h-7 rounded border border-slate-200/60 object-cover shrink-0"
                                              alt="item"
                                            />
                                          ) : (
                                            <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center shrink-0">
                                              <FaBoxOpen className="text-slate-400 text-[10px]" />
                                            </div>
                                          )}
                                          <span className="font-medium text-slate-700 text-xs md:text-sm truncate max-w-[200px] md:max-w-md">
                                            {item.name}
                                          </span>
                                        </div>
                                        <span className="text-slate-500 font-bold bg-slate-50 px-2 py-0.5 rounded text-[10px] md:text-xs shrink-0 ml-2">
                                          x{item.qty}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="flex justify-between items-center text-sm py-1.5">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                      <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center shrink-0">
                                        <FaMicrochip
                                          className="text-slate-500"
                                          size={12}
                                        />
                                      </div>
                                      <span className="font-medium text-slate-700 text-xs md:text-sm truncate max-w-[200px] md:max-w-md">
                                        {order.projectname ||
                                          "งานสั่งผลิตพิเศษ"}
                                      </span>
                                    </div>
                                    <span className="text-slate-500 font-bold bg-slate-50 px-2 py-0.5 rounded text-[10px] md:text-xs shrink-0 ml-2">
                                      x{order.pcb_quantity || order.qty || 1}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Card Footer (Status & Action) */}
                              <div className="flex flex-wrap justify-between items-center gap-3 px-5 py-3.5 bg-slate-50/30 border-t border-slate-100 mt-auto">
                                <div>
                                  {isDelivered ? (
                                    <div
                                      className={`flex items-center gap-2 px-2 py-1 rounded-md w-fit ${isAtCompany ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}
                                    >
                                      {isAtCompany ? (
                                        <FaStore size={10} />
                                      ) : (
                                        <FaTruck size={10} />
                                      )}
                                      <span className="text-[10px] font-bold uppercase tracking-wide">
                                        {isAtCompany
                                          ? "รับสินค้าที่บริษัท"
                                          : "จัดส่งสำเร็จ"}
                                      </span>
                                    </div>
                                  ) : order.isManufacting ||
                                    order.status === "manufacturing" ? (
                                    <div className="flex items-center gap-2 px-2 py-1 rounded-md w-fit bg-amber-50 text-amber-700 border border-amber-100">
                                      <FaMicrochip
                                        size={10}
                                        className="animate-pulse"
                                      />
                                      <span className="text-[10px] font-bold uppercase tracking-wide">
                                        กำลังผลิต
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 px-2 py-1 rounded-md w-fit bg-blue-50 text-blue-700 border border-blue-100">
                                      <FaRegClock
                                        size={10}
                                        className="animate-spin-slow"
                                      />
                                      <span className="text-[10px] font-bold uppercase tracking-wide">
                                        กำลังจัดเตรียม
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {isDelivered &&
                                  !isAtCompany &&
                                  order.deliveryID && (
                                    <button
                                      onClick={() =>
                                        handleCopyTracking(order.deliveryID)
                                      }
                                      className="flex items-center gap-2 px-2.5 py-1.5 bg-white border border-slate-200 shadow-sm rounded-md cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors group/trk active:scale-95"
                                    >
                                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest hidden sm:inline">
                                        Track:
                                      </span>
                                      <span className="font-mono font-bold text-slate-700 text-[10px] tracking-wider">
                                        {order.deliveryID}
                                      </span>
                                      <FaCopy
                                        className="text-slate-400 group-hover/trk:text-blue-600 transition-colors ml-1"
                                        size={10}
                                      />
                                    </button>
                                  )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ️ TAB: ตั้งค่าบัญชี & ที่อยู่ */}
                {activeTab === "settings" && (
                  <div className="space-y-6 text-start">
                    <form onSubmit={submitHandler} className="space-y-6">
                      {/*  Section 1: ข้อมูลส่วนตัว */}
                      <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 md:p-10 transition-all duration-500 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
                        <div className="flex items-center gap-4 mb-6 md:mb-8 pb-5 border-b border-slate-100/80">
                          <div className="w-12 h-12 rounded-[1rem] bg-gradient-to-br from-blue-50 to-blue-100/50 text-blue-600 flex items-center justify-center border border-blue-200/50 shadow-inner">
                            <FaUser size={18} />
                          </div>
                          <div>
                            <h3 className="text-base font-black text-slate-900 uppercase tracking-wide">
                              ข้อมูลส่วนตัว
                            </h3>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">
                              จัดการข้อมูลพื้นฐานบัญชีของคุณ
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                          {/* Modern Floating Label Input */}
                          <div className="relative bg-slate-50/80 border border-slate-200 focus-within:border-black focus-within:ring-4 focus-within:ring-black/5 focus-within:bg-white rounded-[1.2rem] px-5 py-3.5 transition-all duration-300 group">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 group-focus-within:text-black transition-colors">
                              ชื่อ - นามสกุล
                            </label>
                            <input
                              type="text"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none"
                            />
                          </div>
                          <div className="relative bg-slate-50/80 border border-slate-200 focus-within:border-black focus-within:ring-4 focus-within:ring-black/5 focus-within:bg-white rounded-[1.2rem] px-5 py-3.5 transition-all duration-300 group">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 group-focus-within:text-black transition-colors">
                              อีเมลติดต่อ
                            </label>
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/*  Section 2: ที่อยู่จัดส่งหลัก */}
                      <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 md:p-10 transition-all duration-500 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
                        <div className="flex items-center gap-4 mb-6 md:mb-8 pb-5 border-b border-slate-100/80">
                          <div className="w-12 h-12 rounded-[1rem] bg-gradient-to-br from-rose-50 to-rose-100/50 text-rose-500 flex items-center justify-center border border-rose-200/50 shadow-inner">
                            <FaMapMarkerAlt size={18} />
                          </div>
                          <div>
                            <h3 className="text-base font-black text-slate-900 uppercase tracking-wide">
                              ที่อยู่จัดส่งหลัก
                            </h3>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">
                              ข้อมูลสำหรับจัดส่งสินค้าและเอกสาร
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                          <div className="relative bg-slate-50/80 border border-slate-200 focus-within:border-rose-400 focus-within:ring-4 focus-within:ring-rose-400/10 focus-within:bg-white rounded-[1.2rem] px-5 py-3.5 transition-all duration-300 group">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 group-focus-within:text-rose-500 transition-colors">
                              ชื่อผู้รับ
                            </label>
                            <input
                              type="text"
                              value={shippingName}
                              onChange={(e) => setShippingName(e.target.value)}
                              placeholder="ระบุชื่อผู้รับ"
                              className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none placeholder:text-slate-300 placeholder:font-medium"
                            />
                          </div>
                          <div className="relative bg-slate-50/80 border border-slate-200 focus-within:border-rose-400 focus-within:ring-4 focus-within:ring-rose-400/10 focus-within:bg-white rounded-[1.2rem] px-5 py-3.5 transition-all duration-300 group">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 group-focus-within:text-rose-500 transition-colors">
                              เบอร์โทรศัพท์
                            </label>
                            <input
                              type="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="08X-XXX-XXXX"
                              className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none placeholder:text-slate-300 placeholder:font-medium"
                            />
                          </div>
                          <div className="md:col-span-2 relative bg-slate-50/80 border border-slate-200 focus-within:border-rose-400 focus-within:ring-4 focus-within:ring-rose-400/10 focus-within:bg-white rounded-[1.2rem] px-5 py-3.5 transition-all duration-300 group">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 group-focus-within:text-rose-500 transition-colors">
                              บ้านเลขที่, ถนน, ซอย
                            </label>
                            <textarea
                              rows="2"
                              value={address}
                              onChange={(e) => setAddress(e.target.value)}
                              placeholder="รายละเอียดที่อยู่..."
                              className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none resize-none placeholder:text-slate-300 placeholder:font-medium"
                            ></textarea>
                          </div>
                          <div className="relative bg-slate-50/80 border border-slate-200 focus-within:border-rose-400 focus-within:ring-4 focus-within:ring-rose-400/10 focus-within:bg-white rounded-[1.2rem] px-5 py-3.5 transition-all duration-300 group">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 group-focus-within:text-rose-500 transition-colors">
                              จังหวัด / เขต
                            </label>
                            <input
                              type="text"
                              value={city}
                              onChange={(e) => setCity(e.target.value)}
                              placeholder="กรุงเทพมหานคร"
                              className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none placeholder:text-slate-300 placeholder:font-medium"
                            />
                          </div>
                          <div className="relative bg-slate-50/80 border border-slate-200 focus-within:border-rose-400 focus-within:ring-4 focus-within:ring-rose-400/10 focus-within:bg-white rounded-[1.2rem] px-5 py-3.5 transition-all duration-300 group">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 group-focus-within:text-rose-500 transition-colors">
                              รหัสไปรษณีย์
                            </label>
                            <input
                              type="text"
                              value={postalCode}
                              onChange={(e) => setPostalCode(e.target.value)}
                              placeholder="10xxx"
                              className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none placeholder:text-slate-300 placeholder:font-medium"
                            />
                          </div>
                        </div>
                      </div>

                      {/*  Section 3: ข้อมูลใบกำกับภาษี */}
                      <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 md:p-10 transition-all duration-500 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
                        <div className="flex items-center gap-4 mb-6 md:mb-8 pb-5 border-b border-slate-100/80">
                          <div className="w-12 h-12 rounded-[1rem] bg-gradient-to-br from-emerald-50 to-emerald-100/50 text-emerald-600 flex items-center justify-center border border-emerald-200/50 shadow-inner">
                            <FaIdCard size={18} />
                          </div>
                          <div>
                            <h3 className="text-base font-black text-slate-900 uppercase tracking-wide">
                              ข้อมูลใบกำกับภาษี
                            </h3>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">
                              ระบุหากต้องการขอใบกำกับภาษีเต็มรูปแบบ
                            </p>
                          </div>
                        </div>
                        <div className="relative md:w-2/3 bg-slate-50/80 border border-slate-200 focus-within:border-black focus-within:ring-4 focus-within:ring-black/5 focus-within:bg-white rounded-[1.2rem] px-5 py-3.5 transition-all duration-300 group">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 group-focus-within:text-black transition-colors">
                            เลขประจำตัวผู้เสียภาษี (Tax ID)
                          </label>
                          <input
                            type="text"
                            value={taxId}
                            onChange={(e) => setTaxId(e.target.value)}
                            placeholder="เลข 13 หลัก (เว้นว่างได้)"
                            className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none placeholder:text-slate-300 placeholder:font-medium"
                          />
                        </div>
                      </div>

                      {/* ปุ่มบันทึก (Floating Save Button) */}
                      <div className="flex justify-end pt-4">
                        <button
                          type="submit"
                          disabled={loadingUpdateProfile}
                          className="w-full md:w-auto px-10 py-4 md:py-5 rounded-[1.5rem] bg-black text-white font-black text-sm uppercase tracking-widest hover:bg-black/90 shadow-[0_10px_20px_rgba(0,0,0,0.1)] transition-all duration-500 active:scale-95 disabled:bg-slate-300 disabled:shadow-none flex items-center justify-center gap-3 transform hover:-translate-y-1"
                        >
                          {loadingUpdateProfile ? (
                            <Loader size={20} color="white" />
                          ) : (
                            <>
                              <FaCheckCircle size={18} /> ยืนยันการเปลี่ยนแปลง
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <style>{`
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .animate-spin-slow { animation: spin 3s linear infinite; }
            `}</style>
    </div>
  );
};

export default ProfileScreen;
