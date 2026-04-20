import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { format, isValid } from "date-fns";

import { useGetOrderPCBByIdQuery, useGetOrderPCBByorderpaymentIDQuery, useUpdateOrderPCBMutation } from "../slices/orderpcbSlice";
import { useGetDefaultInvoiceUsedQuery } from "../slices/defaultInvoicesApiSlice";
import { BASE_URL } from "../constants";
import { savePCBOrderDetails } from "../slices/pcbCartSlice";
import { toast } from "react-toastify";

import Loader from "../components/Loader";
import Message from "../components/Message";
import FullTaxInvoiceA4 from "../components/FullTaxInvoiceA4";
import AbbreviatedTaxInvoice from "../components/AbbreviatedTaxInvoice";

import {
  FaChevronLeft,
  FaFileDownload,
  FaMapMarkerAlt,
  FaFileInvoice,
  FaSearchPlus,
  FaBoxOpen,
  FaLayerGroup,
  FaCheckCircle,
  FaMicrochip,
  FaClock,
  FaTools,
  FaTruck,
  FaRulerCombined,
  FaPalette,
  FaMoneyBillWave,
  FaCheck,
  FaReceipt,
} from "react-icons/fa";

// ==========================================
// Main Component
// ==========================================
const OrderPCBDetailScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { language } = useSelector((state) => state.language);
  const { userInfo } = useSelector((state) => state.auth);

  const {
    data: order,
    isLoading,
    error,
    refetch,
  } = useGetOrderPCBByIdQuery(id);
  const [updateOrderPCB, { isLoading: isUpdating }] =
    useUpdateOrderPCBMutation();

  // Fetch related orders if payment ID exists
  const { data: orderSamepaymentID, isLoading: isLoadingSamepaymentID } =
    useGetOrderPCBByorderpaymentIDQuery(order?.paymentComfirmID, {
      skip: !order?.paymentComfirmID,
    });
  const { data: companyInfo } = useGetDefaultInvoiceUsedQuery();

  const [zoomedImage, setZoomedImage] = useState(null);
  const [printMode, setPrintMode] = useState(null);

  const handlePrint = (mode) => {
    setPrintMode(mode);
    setTimeout(() => {
      const originalTitle = document.title;
      const invoiceNo = order?.paymentComfirmID || order?.id || order?._id;
      document.title = `${mode === "full" ? "Tax_Invoice" : "Short_Receipt"}_${invoiceNo}`;
      window.print();
      setTimeout(() => {
        setPrintMode(null);
        document.title = originalTitle;
      }, 1000);
    }, 100);
  };

  // Scroll lock when image is zoomed
  useEffect(() => {
    if (zoomedImage) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [zoomedImage]);

  const t = useMemo(
    () =>
      ({
        en: {
          goBack: "Back",
          orderHeader: "Order Details",
          placedOn: "Date Placed",
          fulfillment: "Fulfillment & Logistics",
          specifications: "Technical Specifications",
          summary: "Financial Settlement",
          shipping: "Delivery Destination",
          billing: "Billing Entity",
          gerber: "Gerber Archive",
          status: {
            verify: "Verification",
            produce: "Manufacturing",
            deliver: "Logistics",
          },
          labels: {
            tracking: "Track ID",
            vat: "Sales Tax (7%)",
            shipping: "Logistic Fee",
            total: "Payable Amount",
            size: "Dimensions",
            layers: "Layer Count",
            material: "Base Substrate",
            thickness: "Board Thickness",
            finish: "Surface Finish",
            copper: "Copper Weight",
            weight: "Mass (Est.)",
            color: "Mask / Silk",
          },
        },
        thai: {
          goBack: "ย้อนกลับ",
          orderHeader: "รายละเอียดคำสั่งซื้อ",
          placedOn: "วันที่สั่งซื้อ",
          fulfillment: "ข้อมูลการจัดส่ง",
          specifications: "สเปคแผ่นปริ้น (PCB)",
          summary: "สรุปรายการชำระ",
          shipping: "ที่อยู่จัดส่ง",
          billing: "ข้อมูลใบเสร็จ",
          gerber: "ไฟล์ Gerber",
          status: {
            verify: "ตรวจสอบข้อมูล",
            produce: "กำลังผลิต",
            deliver: "กำลังจัดส่ง",
          },
          labels: {
            tracking: "เลขพัสดุ",
            vat: "ภาษี (7%)",
            shipping: "ค่าจัดส่ง",
            total: "ยอดสุทธิ",
            size: "ขนาดบอร์ด",
            layers: "จำนวนชั้น",
            material: "วัสดุฐาน",
            thickness: "ความหนา",
            finish: "ผิวเคลือบ",
            copper: "น้ำหนักทองแดง",
            weight: "น้ำหนักโดยประมาณ",
            color: "สี/สกรีน",
          },
        },
      })[language || "en"],
    [language],
  );

  const formatDateSafe = (dateString, fmt = "MMM d, yyyy • HH:mm") => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return isValid(date) ? format(date, fmt) : "-";
  };

  const getGerberFilename = (path) => {
    if (!path) return "";
    // Handle both forward and backward slashes
    return path.split(/[/\\]/).pop();
  };

  const handleGerberDownload = (path) => {
    if (!path) return;
    const filename = getGerberFilename(path);

    // Determine backend URL for robust redirection-free download
    const downloadUrl = `${BASE_URL}/api/gerber/download/${filename}`;

    // window.open to a direct backend URL with Content-Disposition attachment
    // will trigger a download without changing UI state.
    window.open(downloadUrl, "_blank");
  };

  if (isLoading || isLoadingSamepaymentID)
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader />
      </div>
    );
  if (error)
    return (
      <div className="mx-auto max-w-2xl p-4 md:p-8">
        <Message variant="danger">
          {error?.data?.message || "Failed to load order"}
        </Message>
      </div>
    );
  if (!order) return null;

  const isPaid = ["accepted", "paid"].includes(order.status?.toLowerCase());
  const isManufacturing = order.isManufacting === 1;
  const isDelivered = order.isDelivered === 1;

  // Financial calculations
  const relatedOrders = orderSamepaymentID || [order];
  const financials = {
    subtotal: relatedOrders.reduce((s, i) => {
      const total = Number(
        i.quoted_price_to_customer || i.total_amount_cost || 0,
      );
      const ems = Number(i.ems || 0);
      const vat = Number(i.vatPrice || 0);
      const itemCost = i.pcb_cost ? Number(i.pcb_cost) : total - ems - vat;
      return s + itemCost;
    }, 0),
    tax: relatedOrders.reduce((s, i) => s + Number(i.vatPrice || 0), 0),
    shipping: relatedOrders.reduce((s, i) => s + Number(i.ems || 0), 0),
    total: relatedOrders.reduce(
      (s, i) =>
        s + Number(i.quoted_price_to_customer || i.total_amount_cost || 0),
      0,
    ),
  };

  const handleApprove = async () => {
    try {
      // 1. Update status in database
      await updateOrderPCB({
        id: order.id || order._id,
        updatedData: { status: "Accepted" },
      }).unwrap();

      // 2. Map order data to cart format
      const cartItem = {
        projectname: order.projectname,
        pcb_quantity: order.pcb_quantity,
        length_cm: order.length_cm,
        width_cm: order.width_cm,
        base_material: order.base_material,
        layers: order.layers,
        thickness_mm: order.thickness_mm,
        color: order.color,
        silkscreen_color: order.silkscreen_color,
        surface_finish: order.surface_finish,
        copper_weight_oz: order.copper_weight_oz,
        gerberZip: order.gerberZip,
        price: order.quoted_price_to_customer || order.total_amount_cost,
        user: {
          id: userInfo?._id,
          name: userInfo?.name,
          email: userInfo?.email,
        },
        shippingAddress: {
          name: order.shippingName,
          address: order.shippingAddress,
          city: order.shippingCity,
          postalCode: order.shippingPostalCode,
          country: order.shippingCountry,
          phone: order.shippingPhone,
        },
        billingAddress: {
          name: order.billingName,
          address: order.billinggAddress,
          city: order.billingCity,
          postalCode: order.billingPostalCode,
          country: order.billingCountry,
          phone: order.billingPhone,
          tax: order.billingTax || "",
        },
      };

      // 3. Add to Redux Cart
      dispatch(savePCBOrderDetails(cartItem));

      toast.success(
        language === "thai"
          ? "อนุมัติเรียบร้อยแล้ว เพิ่มรายการลงตะกร้าแล้ว"
          : "Approved! Item added to cart.",
      );

      // 4. Update UI and Redirect
      refetch();
      navigate("/cart/pcbcart");
    } catch (err) {
      toast.error(err?.data?.message || err.error || "Failed to approve order");
    }
  };

  return (
    <>
      <div className="min-h-screen bg-slate-50/50 pb-20 pt-10 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header - Invoice Style */}
          <div className="mb-10 border-b-2 border-slate-200 pb-8">
            {/* Back Button */}
            <div className="mb-6 flex justify-between items-center">
              <button
                onClick={() => navigate("/cart/pcbcart")}
                className="group flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 transition-colors hover:text-slate-900"
              >
                <FaChevronLeft className="transition-transform group-hover:-translate-x-1" />
                {t.goBack}
              </button>

              {isPaid && order.billingTax && order.billingTax !== "N/A" && (
                <div className="flex gap-2 no-print">
                  <button
                    onClick={() => handlePrint("full")}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full font-bold shadow-lg hover:bg-slate-900 transition-all active:scale-95 text-[10px] uppercase tracking-widest"
                  >
                    <FaFileInvoice size={12} /> Full Invoice
                  </button>
                  <button
                    onClick={() => handlePrint("short")}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-full font-bold shadow-sm hover:bg-slate-50 transition-all active:scale-95 text-[10px] uppercase tracking-widest"
                  >
                    <FaReceipt size={12} /> Short Receipt
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4 md:gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6 min-w-0">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
                  <FaCheckCircle className="text-3xl" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-slate-900 truncate">
                    {order.projectname}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm font-medium text-slate-500 sm:gap-4">
                    <span>
                      Order{" "}
                      <span className="font-mono font-bold text-slate-700">
                        #{order.orderID}
                      </span>
                    </span>
                    <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />
                    <span>
                      {t.placedOn}:{" "}
                      <span className="font-semibold text-slate-700">
                        {formatDateSafe(order.created_at)}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Timeline Overview */}
              <div className="flex shrink-0 items-center gap-2 overflow-x-auto rounded-2xl bg-white p-2 md:p-3 shadow-sm ring-1 ring-slate-200 hide-scrollbar">
                <StatusBadge
                  active={!isPaid}
                  completed={isPaid}
                  icon={<FaClock />}
                  label={t.status.verify}
                />
                <div className="h-px w-3 md:w-6 shrink-0 bg-slate-200" />
                <StatusBadge
                  active={isPaid && !isManufacturing}
                  completed={isManufacturing}
                  icon={<FaTools />}
                  label={t.status.produce}
                />
                <div className="h-px w-3 md:w-6 shrink-0 bg-slate-200" />
                <StatusBadge
                  active={isManufacturing && !isDelivered}
                  completed={isDelivered}
                  icon={<FaTruck />}
                  label={t.status.deliver}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:gap-8 lg:grid-cols-3">
            {/* Left/Main Column: Project Details */}
            <div className="space-y-8 lg:col-span-2">
              {/* 1. Technical Configuration Summary */}
              <div className="rounded-3xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm sm:p-8">
                <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
                  <FaMicrochip className="text-xl shrink-0 text-blue-500" />
                  <h2 className="text-lg font-black uppercase tracking-wide text-slate-800">
                    {t.specifications}
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <InfoBlock
                    label={t.labels.size}
                    value={`${order.length_cm} × ${order.width_cm} mm`}
                    icon={<FaRulerCombined />}
                  />
                  <InfoBlock
                    label={t.labels.layers}
                    value={`${order.layers} Layers`}
                    icon={<FaLayerGroup />}
                  />
                  <InfoBlock
                    label={t.labels.thickness}
                    value={`${order.thickness_mm} mm`}
                    icon={<FaRulerCombined />}
                  />
                  <InfoBlock
                    label="Quantity"
                    value={`${order.pcb_quantity} Units`}
                    icon={<FaBoxOpen />}
                  />

                  <InfoBlock
                    label={t.labels.material}
                    value={order.base_material}
                    icon={<FaLayerGroup />}
                  />
                  <InfoBlock
                    label={t.labels.color}
                    value={order.color}
                    icon={<FaPalette />}
                  />
                  <InfoBlock
                    label={t.labels.finish}
                    value={order.surface_finish}
                    icon={<FaMicrochip />}
                  />
                  <InfoBlock
                    label={t.labels.copper}
                    value={`${order.copper_weight_oz} oz`}
                    icon={<FaMicrochip />}
                  />
                </div>

                {/* Download Action */}
                {order.gerberZip && (
                  <button
                    onClick={() => handleGerberDownload(order.gerberZip)}
                    className="group mt-8 flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-all hover:border-blue-200 hover:bg-blue-50"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm transition-transform group-hover:scale-110">
                        <FaFileDownload size={20} />
                      </div>
                      <div className="min-w-0 text-left">
                        <div className="truncate font-bold text-slate-900 group-hover:text-blue-900">
                          {t.gerber}
                        </div>
                        <div className="truncate text-xs font-medium text-slate-500">
                          {getGerberFilename(order.gerberZip)}
                        </div>
                      </div>
                    </div>
                    <span className="hidden shrink-0 rounded-full bg-white px-4 md:px-6 py-2 text-[10px] font-black uppercase tracking-widest text-blue-600 shadow-sm transition-all group-hover:bg-blue-600 group-hover:text-white sm:block">
                      Download Now
                    </span>
                  </button>
                )}
              </div>

              {/* 2. Logistics & Fulfillment */}
              <div className="rounded-3xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm sm:p-8">
                <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
                  <FaTruck className="text-xl shrink-0 text-emerald-500" />
                  <h2 className="text-lg font-black uppercase tracking-wide text-slate-800">
                    {t.fulfillment}
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-2 md:gap-8">
                  {/* Shipping Details */}
                  <div className="flex flex-col h-full">
                    <div className="mb-4 flex shrink-0 items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <FaMapMarkerAlt className="shrink-0" />{" "}
                      <span className="truncate">{t.shipping}</span>
                    </div>

                    {order.receivePlace === "bysending" ? (
                      <div className="flex flex-1 flex-col rounded-2xl bg-slate-50 p-5">
                        <p className="mb-1 break-words text-base font-bold text-slate-900">
                          {order.shippingName}
                        </p>
                        <p className="mb-2 break-words text-sm font-medium text-blue-600">
                          {order.shippingPhone}
                        </p>
                        <p className="break-words text-sm leading-relaxed text-slate-600">
                          {order.shippingAddress}
                          <br />
                          {order.shippingCity} {order.shippingPostalCode}
                        </p>
                        {isDelivered && order.deliveryID && (
                          <div className="mt-auto pt-4">
                            <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-900 px-4 py-3 text-white">
                              <span className="shrink-0 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                {t.labels.tracking}
                              </span>
                              <span className="truncate font-mono text-xs font-bold text-emerald-400">
                                {order.deliveryID}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex min-h-[160px] flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 md:p-6 text-center">
                        <FaBoxOpen
                          className="mb-3 shrink-0 text-slate-300"
                          size={32}
                        />
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                          Warehouse Pickup
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Billing Details */}
                  <div className="flex flex-col h-full">
                    <div className="mb-4 flex shrink-0 items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <FaFileInvoice className="shrink-0" />{" "}
                      <span className="truncate">{t.billing}</span>
                    </div>
                    <div className="flex flex-1 flex-col rounded-2xl bg-slate-50 p-5">
                      <p className="mb-1 break-words text-base font-bold text-slate-900">
                        {order.billingName}
                      </p>
                      <p className="mb-3 break-words text-sm leading-relaxed text-slate-600">
                        {order.billinggAddress}
                      </p>
                      {order.billingTax && (
                        <div className="mt-auto pt-2">
                          <div className="inline-flex max-w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 shadow-sm">
                            <span className="shrink-0">Tax ID:</span>
                            <span className="truncate">{order.billingTax}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Settlement & Payment */}
            <div className="lg:col-span-1">
              <div className="sticky top-10 space-y-6">
                {/* Financial Dashboard */}
                <div className="overflow-hidden rounded-3xl bg-slate-900 p-4 md:p-6 shadow-xl sm:p-8">
                  <div className="mb-6 flex items-center gap-3 border-b border-white/10 pb-4">
                    <FaMoneyBillWave
                      className="shrink-0 text-emerald-400"
                      size={20}
                    />
                    <h2 className="text-sm font-black uppercase tracking-wide text-white">
                      {t.summary}
                    </h2>
                  </div>

                  {/* Order Lines */}
                  <div className="mb-8 space-y-4">
                    {relatedOrders.map((item, idx) => {
                      const total = Number(
                        item.quoted_price_to_customer ||
                        item.total_amount_cost ||
                        0,
                      );
                      const ems = Number(item.ems || 0);
                      const vat = Number(item.vatPrice || 0);
                      const itemCost = item.pcb_cost
                        ? Number(item.pcb_cost)
                        : total - ems - vat;

                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-4 text-sm"
                        >
                          <div className="flex min-w-0 flex-col">
                            <span
                              className="truncate font-bold text-slate-200"
                              title={item.projectname}
                            >
                              {item.projectname}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] uppercase tracking-widest text-slate-500">
                                Qty: {item.pcb_quantity}
                              </span>
                              {item.gerberZip && (
                                <button
                                  onClick={() =>
                                    handleGerberDownload(item.gerberZip)
                                  }
                                  className="text-blue-400 hover:text-blue-300 transition-colors bg-transparent border-0 p-0"
                                  title="Download Gerber"
                                >
                                  <FaFileDownload size={12} />
                                </button>
                              )}
                            </div>
                          </div>
                          <span className="shrink-0 font-mono text-slate-300">
                            ฿{itemCost.toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mb-8 space-y-3 border-t border-white/10 pt-6">
                    <div className="flex justify-between gap-4 text-sm text-slate-400">
                      <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest">
                        {t.labels.shipping}
                      </span>
                      <span className="shrink-0 font-mono text-slate-300">
                        ฿{financials.shipping.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4 text-sm text-emerald-400/80">
                      <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest">
                        {t.labels.vat}
                      </span>
                      <span className="shrink-0 font-mono text-emerald-400">
                        ฿{financials.tax.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white/5 p-4 text-center">
                    <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {t.labels.total}
                    </span>
                    <span className="break-words font-display text-3xl font-black text-white sm:text-4xl">
                      ฿{financials.total.toLocaleString()}
                    </span>
                  </div>

                  {/* Approval Button Flow */}
                  {!isPaid && order.status?.toLowerCase() !== "rejected" && (
                    <div className="mt-8 border-t border-white/10 pt-6">
                      <button
                        onClick={handleApprove}
                        disabled={isUpdating}
                        className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-amber-500 py-4 text-sm font-black uppercase tracking-widest text-amber-950 transition-all hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/20 active:scale-[0.98] disabled:opacity-50"
                      >
                        {isUpdating ? (
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-950 border-t-transparent" />
                        ) : (
                          <>
                            <FaCheck className="text-lg transition-transform group-hover:scale-110" />
                            <span>
                              {language === "thai"
                                ? "อนุมัติ & รับออเดอร์"
                                : "Approve & Order"}
                            </span>
                          </>
                        )}
                      </button>
                      <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {language === "thai"
                          ? "ยืนยันเพื่อเพิ่มรายการลงในตะกร้าและชำระเงิน"
                          : "Confirm to add items to cart and proceed to payment"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Payment Slip Interactive Card */}
                <div
                  onClick={() => setZoomedImage(order.paymentSlip)}
                  className={`group relative cursor-pointer overflow-hidden rounded-3xl border p-3 shadow-sm transition-all hover:shadow-md ${order.paymentSlip ? "border-slate-200 bg-white" : "border-dashed border-slate-300 bg-slate-50"}`}
                >
                  {order.paymentSlip ? (
                    <div className="relative h-64 overflow-hidden rounded-[1.5rem]">
                      <img
                        src={order.paymentSlip}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        alt="Order Receipt"
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/40 opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:opacity-100">
                        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white text-slate-900 shadow-xl">
                          <FaSearchPlus size={20} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white">
                          View Receipt
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-64 flex-col items-center justify-center gap-4 text-center p-4">
                      <FaClock size={28} className="shrink-0 text-slate-300" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Awaiting Payment Confirm
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- IMMERSIVE LIGHTBOX (PORTALED) --- */}
        {typeof document !== "undefined" &&
          createPortal(
            <AnimatePresence mode="wait">
              {zoomedImage && (
                <motion.div
                  key="zoom-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setZoomedImage(null)}
                  className="fixed inset-0 z-[9999] flex cursor-zoom-out items-center justify-center bg-slate-900/95 p-4 backdrop-blur-xl md:p-12"
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative flex h-full w-full max-w-5xl items-center justify-center"
                  >
                    <img
                      src={zoomedImage}
                      className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
                      alt="Receipt Zoom"
                    />
                    <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/10 px-4 md:px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-md">
                      Tap Anywhere to Exit
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>,
            document.body,
          )}

        <FullTaxInvoiceA4
          order={order ? {
            id: order.id || order._id,
            createdAt: order.createdAt,
            paymentMethod: order.paymentMethod,
            billingAddress: {
              billingName: order.billingAddress?.billingName,
              billinggAddress: order.billingAddress?.billinggAddress,
              billingCity: order.billingAddress?.billingCity,
              billingPostalCode: order.billingAddress?.billingPostalCode,
              tax: order.billingAddress?.tax,
              branch: order.billingAddress?.branch,
            },
            shippingAddress: order.shippingAddress,
            items: relatedOrders.map((item) => ({
              product_id: item.id || item._id,
              name: `${item.projectname} (${item.layers} Layer, ${item.pcb_qty} PCS)`,
              qty: 1,
              price: parseFloat(item.confirmed_price || item.total_amount_cost) / 1.07,
            })),
            itemsPrice: order.itemsPrice,
            vatPrice: order.taxPrice,
            totalPrice: order.totalPrice,
            paymentComfirmID: order.paymentComfirmID,
          } : null}
          companyInfo={companyInfo}
          printMode={printMode}
        />
        <AbbreviatedTaxInvoice
          order={order ? {
            id: order.id || order._id,
            createdAt: order.created_at || order.createdAt,
            paymentMethod: "Bank Transfer",
            billingAddress: {
              billingName: order.billingName,
              billinggAddress: order.billinggAddress,
              billingCity: order.billingCity,
              billingPostalCode: order.billingPostalCode,
              tax: order.billingTax,
            },
            shippingAddress: {
              shippingname: order.shippingName,
              phone: order.shippingPhone,
            },
            items: relatedOrders.map(i => ({
              name: i.projectname,
              qty: i.pcb_quantity,
              price: (Number(i.quoted_price_to_customer || i.total_amount_cost || 0) - Number(i.ems || 0) - Number(i.vatPrice || 0)) / i.pcb_quantity
            })),
            itemsPrice: financials.subtotal,
            vatPrice: financials.tax,
            shippingPrice: financials.shipping,
            totalPrice: financials.total,
            paymentComfirmID: order.paymentComfirmID,
          } : null}
          companyInfo={companyInfo}
          printMode={printMode}
        />

        <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white !important; }
        }
      ` }} />
      </div>
    </>
  );
};

// ==========================================
// Sub-Components
// ==========================================
const StatusBadge = ({ active, completed, icon, label }) => (
  <div
    className={`flex shrink-0 items-center gap-1.5 md:gap-2 rounded-xl px-2 py-1.5 md:px-3 md:py-2 transition-colors whitespace-nowrap ${completed
      ? "bg-emerald-50 text-emerald-700"
      : active
        ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
        : "text-slate-400 opacity-50"
      }`}
  >
    {completed ? (
      <FaCheckCircle className="shrink-0" />
    ) : (
      <span className="shrink-0">{icon}</span>
    )}
    <span className="truncate text-[9px] md:text-[10px] font-bold uppercase tracking-widest">
      {label}
    </span>
  </div>
);

const InfoBlock = ({ label, value, icon }) => (
  <div className="flex min-w-0 flex-col rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
    <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
      {icon && <span className="shrink-0 opacity-50">{icon}</span>}
      <span className="truncate">{label}</span>
    </div>
    <div className="truncate font-semibold text-slate-900" title={value}>
      {value || "-"}
    </div>
  </div>
);

export default OrderPCBDetailScreen;
