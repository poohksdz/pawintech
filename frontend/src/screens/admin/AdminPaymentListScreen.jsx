import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import html2pdf from "html2pdf.js";
import { FaCheck, FaTimes, FaEye, FaUser, FaCalendarAlt, FaSearch, FaFileInvoiceDollar, FaTruck, FaStore, FaPhoneAlt, FaClock, FaDownload, FaFilter, FaChartLine, FaInfoCircle, FaArrowRight } from "react-icons/fa";
import { toast } from "react-toastify";

import {
  useGetAllPaymentsQuery,
  useUpdatePaymentStatusMutation,
} from "../../slices/paymentApiSlice";
import Loader from "../../components/Loader";
import Message from "../../components/Message";
import { BASE_URL } from "../../constants";

// ==========================================
// 1. Helper Functions
// ==========================================
const formatDateTime = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return (
    date.toLocaleString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }) + " น."
  );
};

const checkIsPaid = (item) => {
  const s = item.status?.toLowerCase();
  return (
    item.isPaid === true ||
    item.isPaid === 1 ||
    s === "paid" ||
    s === "completed" ||
    s === "accepted"
  );
};

const checkIsRejected = (item) => {
  const s = item.status?.toLowerCase();
  return s === "reject" || s === "rejected";
};

const getDetailLink = (item) => {
  const id = item._id;
  switch (item.orderType) {
    case "product":
      return `/order/${id}`;
    case "pcb":
      return `/copypcb/${id}`;
    case "custom":
      return `/custompcb/${id}`;
    case "assembly":
      return `/assemblypcb/${id}`;
    case "orderpcb":
      return `/orderpcbs/${id}`;
    default:
      return "#";
  }
};

const getSlipUrl = (slipPath) => {
  if (!slipPath) return "";
  if (slipPath.startsWith("http")) return slipPath;
  let cleanPath = slipPath.replace(/\\/g, "/").replace(/^\/+/, "");

  // If it doesn't start with uploads/ and doesn't start with a known root-level static folder, then add uploads/
  if (
    !cleanPath.startsWith("uploads/") &&
    !cleanPath.startsWith("paymentSlipImages/")
  ) {
    cleanPath = `uploads/${cleanPath}`;
  }

  return `${BASE_URL}/${cleanPath}`;
};

const tabOptions = [
  { id: "all", label: "ทั้งหมด" },
  { id: "product", label: "สินค้าทั่วไป" },
  { id: "custom", label: "Custom PCB" },
  { id: "pcb", label: "Copy PCB" },
  { id: "orderpcb", label: "สั่งทำ PCB" },
  { id: "assembly", label: "งานประกอบ" },
];

const FaTimesCircle = ({ className }) => (
  <svg
    className={className}
    stroke="currentColor"
    fill="currentColor"
    strokeWidth="0"
    viewBox="0 0 512 512"
    height="1em"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm121.6 313.1c4.7 4.7 4.7 12.3 0 17L338 377.6c-4.7 4.7-12.3 4.7-17 0L256 312l-65.1 65.6c-4.7 4.7-12.3 4.7-17 0L134.4 338c-4.7-4.7-4.7-12.3 0-17l65.6-65-65.6-65.1c-4.7-4.7-4.7-12.3 0-17l39.6-39.6c4.7-4.7 12.3-4.7 17 0l65 65.7 65.1-65.6c4.7-4.7 12.3-4.7 17 0l39.6 39.6c4.7 4.7 4.7 12.3 0 17L312 256l65.6 65.1z"></path>
  </svg>
);

// ==========================================
// 2. Sub-Components
// ==========================================
const StatCard = ({ title, count, amount, colorTheme }) => {
  const themes = {
    rose: {
      border: "border-rose-200",
      accent: "bg-rose-500",
      text: "text-rose-600",
      light: "bg-rose-50/50",
    },
    emerald: {
      border: "border-emerald-200",
      accent: "bg-emerald-500",
      text: "text-emerald-600",
      light: "bg-emerald-50/50",
    },
  };
  const theme = themes[colorTheme] || themes.emerald;

  return (
    <div className={`bg-white px-4 md:px-6 py-4 rounded-2xl border ${theme.border} shadow-sm relative overflow-hidden group min-w-[220px] transition-all hover:shadow-md`}>
      <div className={`absolute top-0 left-0 w-1 h-full ${theme.accent}`}></div>
      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          {title} ({count})
        </p>
        <div className="flex items-baseline gap-1">
          <p className={`text-2xl font-black ${theme.text} tracking-tight`}>
            {Number(amount).toLocaleString()}
          </p>
          <span className="text-xs font-bold text-slate-400">THB</span>
        </div>
      </div>
    </div>
  );
};

const PaymentTableRow = ({
  item,
  index,
  trackingInput,
  setTrackingInput,
  onShowSlip,
  onUpdateStatus,
  onShipOrder,
  onDownloadPDF,
}) => {
  const amount = item.amount || 0;
  const isPaid = checkIsPaid(item);
  const isRejected = checkIsRejected(item);
  const isAtCompany = item.receivePlace === "atcompany";
  const isCompleted = item.status?.toLowerCase() === "completed" || item.isReceived === true;

  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors group"
    >
      {/* Column 1: Reference & Info */}
      <td className="px-4 md:px-6 py-4 md:py-6 vertical-top align-top">
        <div className="flex flex-col gap-2 text-start">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase bg-blue-50 text-blue-600 border-blue-100`}>
              {item.orderType || "Product"}
            </span>
            <span className="text-xs font-bold text-slate-900">
              #{String(item._id).slice(-8).toUpperCase()}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-blue-600">
                {Number(amount).toLocaleString()}
              </span>
              <span className="text-[10px] font-bold text-slate-400">THB</span>
            </div>
          </div>
          <div className="flex flex-col gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-tight">
            <div className="flex items-center gap-1.5">
              <FaCalendarAlt className="text-slate-300" />
              <span>{formatDateTime(item.createdAt)}</span>
            </div>
            {item.paymentDate && (
              <div className="flex items-center gap-1.5 text-emerald-500/80">
                <FaClock className="text-emerald-400" />
                <span>{formatDateTime(item.paymentDate)}</span>
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-2">
            {item.paymentSlip ? (
              <button
                onClick={() => onShowSlip(item.paymentSlip)}
                className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-900 hover:text-white transition-all shadow-sm"
              >
                <FaEye size={12} /> สลิป
              </button>
            ) : (
              <span className="bg-slate-50 text-slate-300 text-[9px] font-bold px-3 py-1.5 rounded-lg border border-slate-100 border-dashed">
                NO SLIP
              </span>
            )}
            <button
              onClick={() => onDownloadPDF(item)}
              className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm"
            >
              <FaDownload size={12} /> PDF
            </button>
            <a
              href={getDetailLink(item)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-[10px] font-bold text-purple-600 bg-purple-50 border border-purple-100 px-3 py-1.5 rounded-lg hover:bg-purple-600 hover:text-white transition-all shadow-sm"
            >
              <FaInfoCircle size={12} /> ออเดอร์
            </a>
          </div>
        </div>
      </td>

      {/* Column 2: Customer & Shipping */}
      <td className="px-4 md:px-6 py-4 md:py-6 align-top">
        <div className="flex flex-col gap-3 text-start">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 font-bold text-[10px] uppercase tracking-wider ${isAtCompany ? "text-amber-600" : "text-blue-500"}`}>
              {isAtCompany ? <FaStore /> : <FaTruck />}
              {isAtCompany ? "รับที่บริษัท" : "จัดส่งพัสดุ"}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                <FaUser size={12} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 leading-none">
                  {item.shippingName || item.user?.name || "ลูกค้าโครงการ"}
                </p>
                {item.user?.email && (
                  <span className="text-[10px] text-slate-400 font-medium">{item.user.email}</span>
                )}
              </div>
            </div>
            <div className="pl-10 space-y-1">
              <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-[280px]">
                {item.shippingAddress || "ไม่พบข้อมูลที่อยู่นัดรับหรือจัดส่ง"}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-900">
                <FaPhoneAlt size={10} className="text-slate-300" />
                <span>{item.shippingPhone || "N/A"}</span>
              </div>
            </div>
          </div>
        </div>
      </td>

      {/* Column 3: Status */}
      <td className="px-4 md:px-6 py-4 md:py-6 align-middle text-center border-x border-slate-50">
        <div className="flex flex-col items-center justify-center min-w-[100px]">
          {isRejected ? (
            <div className="flex flex-col items-center text-rose-400 gap-1.5">
              <FaTimesCircle className="text-xl" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Rejected</span>
            </div>
          ) : item.isDelivered ? (
            <div className="flex flex-col items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${isAtCompany && !isCompleted ? "bg-amber-500" : "bg-emerald-500"} text-white`}>
                {isAtCompany && !isCompleted ? <FaClock size={12} /> : <FaCheck size={12} />}
              </div>
              <p className={`text-[9px] font-bold uppercase tracking-wider ${isAtCompany && !isCompleted ? "text-amber-600" : "text-emerald-600"}`}>
                {isAtCompany ? (isCompleted ? "จัดส่งสำเร็จ" : "รอยืนยัน") : "ส่งแล้ว"}
              </p>
            </div>
          ) : isPaid ? (
            <div className={`px-3 py-1 rounded-full border text-[9px] font-bold uppercase tracking-wider ${item.isManufacting
              ? "bg-blue-50 border-blue-100 text-blue-600"
              : "bg-emerald-50 border-emerald-100 text-emerald-600"
              }`}>
              {item.isManufacting ? "กำลังผลิต" : "ชำระแล้ว"}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-[9px] font-bold text-rose-500 uppercase tracking-widest bg-rose-50 px-3 py-1 rounded-full border border-rose-100 animate-pulse">
                รอตรวจสอบ
              </span>
            </div>
          )}
        </div>
      </td>

      {/* Column 4: Actions */}
      <td className="px-4 md:px-6 py-4 md:py-6 align-middle">
        <div className="flex items-center justify-center">
          {isRejected ? (
            <div className="w-8 h-px bg-slate-100" />
          ) : item.isDelivered ? (
            <div className="text-center">
              {!isAtCompany && (
                <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded border border-slate-100 block">
                  {item.deliveryID || item.transferedNumber}
                </span>
              )}
              {isAtCompany && <div className="w-8 h-px bg-slate-100" />}
            </div>
          ) : isPaid ? (
            <div className="w-full max-w-[220px]">
              {isAtCompany ? (
                <button
                  onClick={() => onShipOrder(item._id, item.orderType, "atcompany")}
                  className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-wider shadow-sm"
                >
                  ลูกค้ารับสินค้าแล้ว <FaArrowRight size={10} />
                </button>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="เลขพัสดุ..."
                    className="flex-1 text-[11px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:bg-white transition-all font-bold"
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(item._id, e.target.value)}
                  />
                  <button
                    onClick={() => onShipOrder(item._id, item.orderType, "bysending")}
                    className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 shadow-md shadow-blue-200 transition-all active:scale-95"
                    title="บันทึก"
                  >
                    <FaTruck size={14} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => onUpdateStatus(item._id, "Paid", item.orderType)}
                className="w-10 h-10 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-200/50 flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                title="อนุมัติ"
              >
                <FaCheck size={16} />
              </button>
              <button
                onClick={() => onUpdateStatus(item._id, "Reject", item.orderType)}
                className="w-10 h-10 bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-200/50 flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                title="ปฏิเสธ"
              >
                <FaTimes size={16} />
              </button>
            </div>
          )}
        </div>
      </td>
    </motion.tr>
  );
};

// ==========================================
// 3. Main Component
// ==========================================
const AdminPaymentListScreen = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [showSlip, setShowSlip] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [trackingInputs, setTrackingInputs] = useState({});

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");

  const {
    data: payments,
    isLoading,
    error,
    refetch,
  } = useGetAllPaymentsQuery();
  const [updatePayment] = useUpdatePaymentStatusMutation();

  useEffect(() => {
    document.body.style.overflow = showSlip ? "hidden" : "unset";
  }, [showSlip]);

  const handleUpdateStatus = async (id, status, type) => {
    const actionText = status === "Paid" ? "อนุมัติ" : "ปฏิเสธ";
    if (window.confirm(`ยืนยันการ ${actionText} สลิปโอนเงินนี้ใช่หรือไม่ ? `)) {
      try {
        await updatePayment({ id, status, orderType: type }).unwrap();
        toast.success(`ทำรายการ ${actionText} สำเร็จ`);
        refetch();
      } catch (err) {
        toast.error(err?.data?.message || err.error);
      }
    }
  };

  const handleShipOrder = async (id, type, receivePlace) => {
    const isPickUp = receivePlace === "atcompany";
    const trackingNo = isPickUp ? "PICKUP_AT_STORE" : trackingInputs[id];

    if (!isPickUp && !trackingNo) {
      return toast.warning("กรุณากรอกเลขพัสดุก่อนแจ้งจัดส่ง!");
    }

    // ปรับข้อความ Popup แจ้งเตือนแอดมินให้เข้าใจได้ชัดเจนเรื่องการกดยืนยัน 2 ขั้นตอน
    const confirmMsg = isPickUp
      ? 'ยืนยันว่าลูกค้ามารับสินค้าที่บริษัทแล้วใช่หรือไม่ ?\n(สถานะจะเปลี่ยนเป็น "รอลูกค้ายืนยัน" เพื่อให้ลูกค้ากดยืนยันในระบบอีกครั้ง)'
      : `ยืนยันจัดส่งพัสดุด้วยเลขติดตาม: ${trackingNo} ?`;

    if (window.confirm(confirmMsg)) {
      try {
        let endpoint = "";
        if (type === "custom") endpoint = `/api/custompcbs/delivery/${id}`;
        else if (type === "pcb") endpoint = `/api/pcbcopy/delivery/${id}`;
        else if (type === "assembly")
          endpoint = `/api/pcbassembly/delivery/${id}`;
        else if (type === "orderpcb") endpoint = `/api/orderpcbs/${id}/deliver`;
        else endpoint = `/api/orders/${id}/deliver`;

        if (endpoint) {
          const res = await fetch(`${BASE_URL}${endpoint}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              transferedNumber: trackingNo,
              isDelivered: true,
            }),
          });

          if (res.ok) {
            toast.success(
              isPickUp
                ? "ส่งมอบสำเร็จ! รอผู้ซื้อกดยืนยัน"
                : "แจ้งเลขพัสดุสำเร็จ 🚚",
            );
            refetch();
          } else {
            const { message } = await res.json();
            toast.error(message || "ไม่สามารถอัปเดตข้อมูลได้");
          }
        }
      } catch (err) {
        toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
      }
    }
  };

  const handleTrackingInputChange = (id, value) => {
    setTrackingInputs((prev) => ({ ...prev, [id]: value }));
  };

  const filteredPayments = useMemo(() => {
    if (!payments) return [];
    let result = payments;

    if (activeTab !== "all")
      result = result.filter((p) => p.orderType === activeTab);

    if (statusFilter !== "all") {
      result = result.filter((p) => {
        const isPaid = checkIsPaid(p);
        const isRejected = checkIsRejected(p);
        if (statusFilter === "pending") return !isPaid && !isRejected;
        if (statusFilter === "paid") return isPaid;
        if (statusFilter === "rejected") return isRejected;
        return true;
      });
    }

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          String(p._id).toLowerCase().includes(lowerSearch) ||
          (p.user?.name && p.user.name.toLowerCase().includes(lowerSearch)) ||
          (p.user?.email && p.user.email.toLowerCase().includes(lowerSearch)) ||
          (p.shippingName &&
            p.shippingName.toLowerCase().includes(lowerSearch)) ||
          (p.shippingPhone &&
            p.shippingPhone.toLowerCase().includes(lowerSearch)),
      );
    }

    if (dateRange !== "all") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      result = result.filter((p) => {
        const pDate = new Date(p.createdAt);
        if (dateRange === "today") return pDate >= today;
        if (dateRange === "week") {
          const weekAgo = new Date(today);
          weekAgo.setDate(today.getDate() - 7);
          return pDate >= weekAgo;
        }
        if (dateRange === "month") {
          const monthAgo = new Date(today);
          monthAgo.setMonth(today.getMonth() - 1);
          return pDate >= monthAgo;
        }
        return true;
      });
    }
    return result;
  }, [payments, activeTab, statusFilter, searchTerm, dateRange]);

  const stats = useMemo(() => {
    if (!payments)
      return { pending: 0, pendingAmount: 0, paid: 0, paidAmount: 0 };
    return payments.reduce(
      (acc, p) => {
        const isPaid = checkIsPaid(p);
        const isRejected = checkIsRejected(p);
        const amt = Number(p.amount) || 0;
        if (!isPaid && !isRejected) {
          acc.pending++;
          acc.pendingAmount += amt;
        } else if (isPaid) {
          acc.paid++;
          acc.paidAmount += amt;
        }
        return acc;
      },
      { pending: 0, pendingAmount: 0, paid: 0, paidAmount: 0 },
    );
  }, [payments]);

  const handleExport = () => {
    if (filteredPayments.length === 0)
      return toast.info("ไม่มีข้อมูลสำหรับการส่งออก");
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(filteredPayments, null, 2));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute(
      "download",
      `payment_report_${new Date().toISOString().slice(0, 10)}.json`,
    );
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    toast.success("ส่งออกข้อมูลสำเร็จ");
  };

  const handleDownloadPDF = (item) => {
    const content = `
      <div style="font-family:sans-serif;padding:20px;max-width:600px;margin:0 auto;">
        <div style="text-align:center;border-bottom:2px solid #000;padding-bottom:16px;margin-bottom:20px;">
          <h2 style="margin:0;">ใบเสร็จรับเงิน / Payment Receipt</h2>
          <p style="margin:4px 0 0;font-size:12px;color:#666;">Order #${String(item._id).slice(-8).toUpperCase()}</p>
        </div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          <tr><td style="padding:8px 4px;font-weight:bold;width:40%;">วันที่ / Date</td><td style="padding:8px 4px;">${formatDateTime(item.createdAt)}</td></tr>
          <tr style="background:#f5f5f5;"><td style="padding:8px 4px;font-weight:bold;">ประเภทออเดอร์ / Order Type</td><td style="padding:8px 4px;text-transform:uppercase;">${item.orderType || "Product"}</td></tr>
          <tr><td style="padding:8px 4px;font-weight:bold;">ชื่อลูกค้า / Customer</td><td style="padding:8px 4px;">${item.shippingName || item.user?.name || "N/A"}</td></tr>
          <tr style="background:#f5f5f5;"><td style="padding:8px 4px;font-weight:bold;">เบอร์โทร / Phone</td><td style="padding:8px 4px;">${item.shippingPhone || "N/A"}</td></tr>
          <tr><td style="padding:8px 4px;font-weight:bold;">ที่อยู่ / Address</td><td style="padding:8px 4px;">${item.shippingAddress || "N/A"}</td></tr>
          <tr style="background:#f5f5f5;"><td style="padding:8px 4px;font-weight:bold;">สถานะการชำระ / Payment Status</td><td style="padding:8px 4px;">${checkIsPaid(item) ? "✅ ชำระแล้ว / Paid" : "⏳ รอตรวจสอบ / Pending"}</td></tr>
        </table>
        <div style="background:#000;color:#fff;padding:16px;border-radius:8px;text-align:center;">
          <p style="margin:0;font-size:12px;">จำนวนเงิน / Amount</p>
          <p style="margin:4px 0 0;font-size:28px;font-weight:bold;">฿${Number(item.amount || 0).toLocaleString()} THB</p>
        </div>
        <div style="margin-top:20px;padding:12px;background:#f9f9f9;border-radius:8px;font-size:11px;color:#666;text-align:center;">
          ระบบจัดการออเดอร์ PAWIN TECH | Order Management System<br/>
          https://pawin-tech.com/admin/paymentlist
        </div>
      </div>
    `;

    const opt = {
      margin: 10,
      filename: `PaymentReceipt_${String(item._id).slice(-8).toUpperCase()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a5', orientation: 'portrait' },
    };

    html2pdf().set(opt).from(content).save();
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-4 md:py-8 px-4 md:px-10 font-['Prompt'] antialiased text-start">
      <style dangerouslySetInnerHTML={{ __html: `.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }` }} />

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg shrink-0">
              <FaFileInvoiceDollar size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  การจัดการการเงิน
                </h1>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-bold uppercase rounded-md border border-blue-200">
                  ADMIN
                </span>
              </div>
              <p className="text-slate-400 text-xs font-bold flex items-center gap-1.5 uppercase tracking-wide">
                <FaChartLine className="text-blue-500" /> Dashboard & Payment Verification
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <StatCard
              title="รอกดยืนยัน"
              count={stats.pending}
              amount={stats.pendingAmount}
              colorTheme="rose"
            />
            <StatCard
              title="ตรวจสอบแล้ว"
              count={stats.paid}
              amount={stats.paidAmount}
              colorTheme="emerald"
            />
          </div>
        </div>

        {/* Content Section */}
        {isLoading ? (
          <Loader />
        ) : error ? (
          <Message variant="danger">
            {error?.data?.message || error.error}
          </Message>
        ) : (
          <div className="space-y-4">
            {/* Control Panel: Filters & Search */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              {/* Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
                {tabOptions.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all whitespace-nowrap ${activeTab === tab.id
                      ? "bg-slate-900 text-white shadow-lg"
                      : "text-slate-400 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="h-px bg-slate-100 w-full"></div>

              {/* Search & Filters */}
              <div className="flex flex-col lg:flex-row gap-3">
                {/* 1. ช่องค้นหา */}
                <div className="relative group flex-1">
                  <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="ค้นหา ชื่อ, ออเดอร์ไอดี, เบอร์โทร..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 pl-11 pr-4 py-3 rounded-xl border border-slate-100 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all font-bold text-sm"
                  />
                </div>

                {/* 2. ฟิลเตอร์สถานะและเวลา */}
                <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-slate-50 px-4 py-3 pr-10 rounded-xl border border-slate-100 outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-sm appearance-none cursor-pointer min-w-[150px]"
                    >
                      <option value="all">สถานะทั้งหมด</option>
                      <option value="pending">รอตรวจสอบ</option>
                      <option value="paid">ชำระแล้ว</option>
                      <option value="rejected">ปฏิเสธแล้ว</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <FaFilter size={10} />
                    </div>
                  </div>

                  <div className="relative">
                    <select
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                      className="bg-slate-50 px-4 py-3 pr-10 rounded-xl border border-slate-100 outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-sm appearance-none cursor-pointer min-w-[180px]"
                    >
                      <option value="all">ทุกช่วงเวลา</option>
                      <option value="today">วันนี้</option>
                      <option value="week">สัปดาห์นี้</option>
                      <option value="month">เดือนนี้</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <FaCalendarAlt size={10} />
                    </div>
                  </div>
                </div>

                {/* 3. ปุ่มส่งออก */}
                <button
                  onClick={handleExport}
                  className="bg-slate-900 text-white px-4 md:px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95 shrink-0 whitespace-nowrap"
                >
                  <FaDownload size={14} /> <span>รายงาน</span>
                </button>
              </div>
            </div>


            {/* Order Table */}
            {filteredPayments.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl py-24 text-center border border-slate-200 border-dashed shadow-sm"
              >
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaSearch size={24} className="text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">
                  ไม่พบรายการที่คุณต้องการ
                </h3>
                <p className="text-slate-400 text-sm mt-1">
                  ลองปรับเปลี่ยนฟิลเตอร์หรือคำค้นหาของคุณ
                </p>
              </motion.div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                        <th className="px-4 md:px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-start">
                          ข้อมูลออเดอร์
                        </th>
                        <th className="px-4 md:px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-start">
                          การจัดส่ง
                        </th>
                        <th className="px-4 md:px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-center w-28">
                          สถานะ
                        </th>
                        <th className="px-4 md:px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-center">
                          จัดการรายการ
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      <AnimatePresence>
                        {filteredPayments.map((item, index) => (
                          <PaymentTableRow
                            key={`${item._id}-${index}`}
                            item={item}
                            index={index}
                            trackingInput={trackingInputs[item._id] || ""}
                            setTrackingInput={handleTrackingInputChange}
                            onShowSlip={(slipPath) => {
                              setSelectedSlip(slipPath);
                              setShowSlip(true);
                            }}
                            onUpdateStatus={handleUpdateStatus}
                            onShipOrder={handleShipOrder}
                            onDownloadPDF={handleDownloadPDF}
                          />
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Slip Modal Preview */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {showSlip && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md"
                onClick={() => setShowSlip(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, y: 10 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 10 }}
                  className="bg-white rounded-2xl p-4 md:p-6 max-w-lg w-full relative shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="font-bold text-slate-900 text-lg">
                      หลักฐานการโอนเงิน (Slip)
                    </h4>
                    <button
                      onClick={() => setShowSlip(false)}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-500 hover:text-white transition-all border border-slate-100"
                    >
                      <FaTimes size={18} />
                    </button>
                  </div>
                  <img
                    src={getSlipUrl(selectedSlip)}
                    className="w-full h-auto rounded-xl max-h-[70vh] object-contain shadow-inner border border-slate-100 bg-slate-50"
                    alt="Slip Preview"
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
};

export default AdminPaymentListScreen;
