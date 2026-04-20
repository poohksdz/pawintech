import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaArrowLeft,
  FaFileArchive,
  FaImages,
  FaDownload,
  FaTruck,
  FaCalendarAlt,
  FaBoxOpen,
  FaReceipt,
  FaFileInvoice,
  FaSearchPlus,
  FaCheckCircle,
  FaClock,
} from "react-icons/fa";
import { format } from "date-fns";
import JSZip from "jszip";
import { saveAs } from "file-saver";

import { useGetcopyPCBByIdQuery } from "../../slices/copypcbApiSlice";
import { useGetDefaultInvoiceUsedQuery } from "../../slices/defaultInvoicesApiSlice";
import Loader from "../../components/Loader";
import Message from "../../components/Message";
import FullTaxInvoiceA4 from "../../components/FullTaxInvoiceA4";
import AbbreviatedTaxInvoice from "../../components/AbbreviatedTaxInvoice";
import { BASE_URL } from "../../constants";

const CopyPCBDetailScreen = () => {
  const { id } = useParams();
  const { language } = useSelector((state) => state.language);
  const { data: order, isLoading, error } = useGetcopyPCBByIdQuery(id);
  const { data: companyInfo } = useGetDefaultInvoiceUsedQuery();
  const orderData = order?.data;
  const [zoomedImage, setZoomedImage] = useState(null);
  const [printMode, setPrintMode] = useState(null);

  const handlePrint = (mode) => {
    setPrintMode(mode);
    setTimeout(() => {
      const originalTitle = document.title;
      const invoiceNo = orderData?.paymentComfirmID || orderData?.orderID || orderData?.id;
      document.title = `${mode === "full" ? "Tax_Invoice" : "Short_Receipt"}_${invoiceNo}`;
      window.print();
      setTimeout(() => {
        setPrintMode(null);
        document.title = originalTitle;
      }, 1000);
    }, 100);
  };

  const getFullUrl = (pathInput) => {
    if (!pathInput) return null;
    let path =
      typeof pathInput === "object"
        ? pathInput.path || pathInput.url
        : pathInput;
    if (!path || typeof path !== "string") return null;

    if (path.startsWith("http")) return path;

    let normalizedPath = path.replace(/\\/g, "/");
    if (!normalizedPath.startsWith("/")) {
      normalizedPath = "/" + normalizedPath;
    }

    const baseUrl =
      process.env.NODE_ENV === "development"
        ? "http://localhost:5000"
        : BASE_URL || "";
    return `${baseUrl}${normalizedPath}`;
  };

  const existingImages = orderData
    ? Array.from({ length: 10 }, (_, i) => [
      orderData[`front_image_${i + 1}`],
      orderData[`back_image_${i + 1}`],
    ])
      .flat()
      .filter(Boolean)
    : [];

  const t = {
    en: {
      lbl: {
        project: "Project",
        qty: "Qty",
        total: "Total",
        date: "Date",
        status: "Status",
        tracking: "Tracking",
        delivered: "Delivered",
        pickup: "Pickup at Store",
        note: "Note",
        pricePerUnit: "Price/Unit",
        name: "Name",
        phone: "Tel",
        address: "Address",
        tax: "Tax ID",
      },
      headers: {
        shipping: "Shipping & Billing",
        slip: "Payment Slip",
        images: "PCB Images",
        downloads: "Downloads",
      },
      btn: {
        back: "Back",
        dlAll: "Download Full Project",
        dlZip: "Gerber",
        dlImg: "Images",
      },
    },
    thai: {
      lbl: {
        project: "โปรเจกต์",
        qty: "จำนวน",
        total: "ยอดสุทธิ",
        date: "วันที่สั่ง",
        status: "สถานะ",
        tracking: "เลขพัสดุ",
        delivered: "จัดส่งสำเร็จ",
        pickup: "รับสินค้าเองที่บริษัท",
        note: "หมายเหตุ",
        pricePerUnit: "ราคา/ชิ้น",
        name: "ชื่อ",
        phone: "โทร",
        address: "ที่อยู่",
        tax: "เลขผู้เสียภาษี",
      },
      headers: {
        shipping: "ข้อมูลจัดส่ง & ใบกำกับภาษี",
        slip: "หลักฐานการโอนเงิน",
        images: "รูปภาพ PCB",
        downloads: "ดาวน์โหลด",
      },
      btn: {
        back: "กลับ",
        dlAll: "ดาวน์โหลดโปรเจกต์ทั้งหมด",
        dlZip: "ไฟล์ Gerber",
        dlImg: "รูปภาพ",
      },
    },
  }[language || "en"];

  const handleDownloadAll = async (e) => {
    e.preventDefault();
    if (!orderData) return;

    const zip = new JSZip();
    const folder = zip.folder(orderData.projectname || "project");

    try {
      if (orderData.copypcb_zip) {
        const zipUrl = getFullUrl(orderData.copypcb_zip);
        const resp = await fetch(zipUrl);
        if (resp.ok) {
          folder.file(
            orderData.copypcb_zip.split("/").pop() || "source.zip",
            await resp.blob(),
          );
        }
      }

      for (let i = 1; i <= 10; i++) {
        const f = orderData[`front_image_${i}`];
        const b = orderData[`back_image_${i}`];
        if (f) {
          const r = await fetch(getFullUrl(f));
          if (r.ok) {
            const ext = f.split(".").pop() || "jpg";
            folder.file(`front-${i}.${ext}`, await r.blob());
          }
        }
        if (b) {
          const r = await fetch(getFullUrl(b));
          if (r.ok) {
            const ext = b.split(".").pop() || "jpg";
            folder.file(`back-${i}.${ext}`, await r.blob());
          }
        }
      }

      saveAs(
        await zip.generateAsync({ type: "blob" }),
        `${orderData.projectname}-full.zip`,
      );
    } catch (error) {
      alert(`Failed: ${error.message}`);
    }
  };

  if (isLoading) return <Loader />;
  if (error)
    return (
      <Message variant="danger">{error?.data?.message || error.error}</Message>
    );
  if (!orderData) return <Message variant="info">No Data Found</Message>;

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-900 antialiased font-prompt selection:bg-blue-100 uppercase">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-12 no-print">
        {/* Header & Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <Link
            to="/cart/copypcbcart"
            className="inline-flex items-center gap-3 text-slate-500 hover:text-blue-600 font-bold transition-all group active:scale-95"
          >
            <div className="w-10 h-10 bg-white rounded-full shadow-sm border border-slate-200 flex items-center justify-center group-hover:border-blue-200 group-hover:shadow-md transition-all">
              <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
            </div>
            <span className="hidden sm:inline-block tracking-wide uppercase text-sm">
              {t.btn.back}
            </span>
          </Link>

          <div className="flex flex-wrap gap-3">
            {orderData.status === "paid" && orderData.billingTax && orderData.billingTax !== "N/A" && (
              <div className="flex gap-2">
                <button
                  onClick={() => handlePrint("full")}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-full font-bold shadow-lg hover:bg-slate-900 transition-all active:scale-95 text-xs uppercase tracking-widest"
                >
                  <FaFileInvoice /> Full Invoice (PDF)
                </button>
                <button
                  onClick={() => handlePrint("short")}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-full font-bold shadow-sm hover:shadow-md hover:border-slate-300 transition-all active:scale-95 text-xs uppercase tracking-widest"
                >
                  <FaReceipt /> Short Receipt
                </button>
              </div>
            )}
            <button
              onClick={handleDownloadAll}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-full font-bold shadow-lg hover:bg-blue-700 transition-all active:scale-95 text-xs uppercase tracking-widest"
            >
              <FaDownload /> {t.btn.dlAll}
            </button>
          </div>
        </div>

        {/* Order Info Card */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden mb-8 ring-4 ring-blue-600/5">
          <div className="p-6 md:p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-black">
            <div>
              <h4 className="text-2xl font-black mb-1 flex items-center gap-3 tracking-tight uppercase">
                {orderData.orderID}
              </h4>
              <span className="text-white/60 text-sm font-medium tracking-wide">
                {orderData.created_at ? format(new Date(orderData.created_at), "PPP p") : "-"}
              </span>
            </div>
            <div>
              {orderData.isDelivered ? (
                <span className="inline-flex items-center gap-2 bg-emerald-500/20 backdrop-blur-md text-emerald-400 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border border-emerald-500/30">
                  <FaCheckCircle /> {t.lbl.delivered}
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 bg-amber-500/20 backdrop-blur-md text-amber-400 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border border-amber-500/30">
                  <FaClock className="animate-pulse" /> {language === "thai" ? "รอจัดส่ง" : "Processing"}
                </span>
              )}
            </div>
          </div>

          <div className="p-8 md:p-12">
            <h2 className="text-3xl font-black text-slate-900 mb-8 uppercase tracking-tight">
              {orderData.projectname}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantity</p>
                <p className="text-xl font-black text-slate-900">{orderData.pcb_qty} PCS</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Service Type</p>
                <p className="text-xl font-black text-slate-900 uppercase">Copy PCB</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confirmed Price</p>
                <p className="text-xl font-black text-blue-600 tracking-tighter">฿{Number(orderData.confirmed_price || 0).toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit Price</p>
                <p className="text-xl font-black text-slate-900 tracking-tighter">฿{(Number(orderData.confirmed_price || 0) / (orderData.pcb_qty || 1)).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Client Details */}
          <div className="lg:col-span-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8 relative overflow-hidden group">
                <FaTruck className="absolute -right-4 -bottom-4 text-slate-50 opacity-10 group-hover:opacity-20 transition-opacity" size={120} />
                <h6 className="font-black text-slate-800 flex items-center gap-3 uppercase tracking-widest mb-6 relative z-10">
                  <span className="w-8 h-8 rounded-full bg-slate-100 text-black flex items-center justify-center">
                    <FaTruck />
                  </span>
                  {t.headers.shipping}
                </h6>
                {orderData.receivePlace === "bysending" ? (
                  <div className="relative z-10 text-slate-600 font-medium leading-relaxed">
                    <p className="font-black text-slate-900 text-lg mb-1">{orderData.shippingName}</p>
                    <p className="mb-2 text-black font-bold">{orderData.shippingPhone}</p>
                    <p className="m-0 text-sm">
                      {orderData.shippingAddress}, {orderData.shippingCity} {orderData.shippingPostalCode}
                    </p>
                    {orderData.transferedNumber && (
                      <div className="mt-4 p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 font-black text-xs tracking-widest uppercase">
                        Tracking: {orderData.transferedNumber}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-slate-50 rounded-2xl border border-slate-100 relative z-10">
                    <span className="font-black text-black uppercase tracking-widest">
                      {t.lbl.pickup}
                    </span>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8 relative overflow-hidden group">
                <FaReceipt className="absolute -right-4 -bottom-4 text-slate-50 opacity-10 group-hover:opacity-20 transition-opacity" size={120} />
                <h6 className="font-black text-slate-800 flex items-center gap-3 uppercase tracking-widest mb-6 relative z-10">
                  <span className="w-8 h-8 rounded-full bg-slate-100 text-black flex items-center justify-center">
                    <FaReceipt />
                  </span>
                  Billing Details
                </h6>
                <div className="relative z-10 text-slate-600 font-medium leading-relaxed">
                  <p className="font-black text-slate-900 text-lg mb-1">{orderData.billingName}</p>
                  <p className="mb-4 text-sm text-slate-500">
                    {orderData.billingAddress}
                  </p>
                  {orderData.billingTax && (
                    <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-black uppercase tracking-widest border border-slate-200">
                      TAX ID: {orderData.billingTax}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8">
              <h6 className="font-black text-slate-800 flex items-center gap-3 uppercase tracking-widest mb-6 border-b border-slate-100 pb-4">
                <span className="w-8 h-8 rounded-full bg-slate-100 text-black flex items-center justify-center">
                  <FaImages />
                </span>
                {t.headers.images}
              </h6>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {existingImages.map((img, idx) => (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileActive={{ scale: 0.95 }}
                    key={idx}
                    onClick={() => setZoomedImage(getFullUrl(img))}
                    className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 cursor-pointer shadow-sm group"
                  >
                    <img
                      src={getFullUrl(img)}
                      alt="PCB Preview"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                      <FaSearchPlus size={20} className="text-white" />
                    </div>
                  </motion.div>
                ))}
              </div>

              {orderData.notes && (
                <div className="mt-8 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Internal Note</p>
                  <p className="text-slate-600 text-sm leading-relaxed m-0">{orderData.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Financial & Downloads */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden sticky top-8">
              <div className="p-8">
                <h5 className="font-black text-slate-800 text-xl tracking-tight mb-8 uppercase">Summary</h5>
                <div className="space-y-4 mb-8 pt-2">
                  <div className="flex justify-between items-center text-sm font-medium text-slate-500">
                    <span className="uppercase tracking-widest">Base Price</span>
                    <span className="font-bold text-slate-700">฿{(Number(orderData.confirmed_price || 0) / 1.07).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-medium text-blue-500 pt-4 border-t border-slate-100">
                    <span className="uppercase tracking-widest font-black">VAT (7%)</span>
                    <span className="font-black">฿{(Number(orderData.confirmed_price || 0) * 0.07 / 1.07).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
                <div className="border-t border-slate-200 border-dashed pt-6 flex justify-between items-end mb-8">
                  <span className="font-black text-slate-400 uppercase tracking-widest text-xs mb-1">Grand Total</span>
                  <span className="font-black text-black text-4xl tracking-tighter leading-none">฿{Number(orderData.confirmed_price || 0).toLocaleString()}</span>
                </div>

                <div className="bg-slate-50/50 p-6 border-b border-slate-100 flex flex-col items-center gap-3 rounded-3xl mb-8">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mb-0">Payment Proof</p>
                  {orderData.paymentSlip ? (
                    <button
                      type="button"
                      className="w-full h-48 rounded-2xl border border-slate-200 relative overflow-hidden group cursor-zoom-in block bg-white"
                      onClick={() => setZoomedImage(getFullUrl(orderData.paymentSlip))}
                    >
                      <img
                        src={getFullUrl(orderData.paymentSlip)}
                        alt="Payment Slip"
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white border border-white/30 backdrop-blur-md">
                          <FaSearchPlus size={20} />
                        </div>
                      </div>
                    </button>
                  ) : (
                    <div className="bg-slate-50 rounded-2xl py-8 w-full flex flex-col items-center justify-center border-2 border-slate-100 border-dashed text-slate-400">
                      <FaClock size={32} className="mb-3 opacity-30 animate-pulse" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Pending Verification</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Project Assets</p>
                  {orderData.copypcb_zip && (
                    <a
                      href={getFullUrl(orderData.copypcb_zip)}
                      download
                      className="flex items-center justify-between w-full p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:shadow transition-shadow">
                          <FaFileArchive className="text-blue-600" />
                        </div>
                        <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">Gerber Data</span>
                      </div>
                      <FaDownload className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
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
                className="absolute -top-4 -right-4 w-10 h-10 bg-white text-slate-800 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all pointer-events-auto z-10"
              >
                &times;
              </button>
              <img
                src={zoomedImage}
                alt="Zoomed View"
                className="rounded-2xl shadow-2xl max-h-[85vh] object-contain pointer-events-auto border-2 border-white/10"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <FullTaxInvoiceA4
        order={orderData ? {
          id: orderData.id || orderData._id,
          createdAt: orderData.created_at || orderData.createdAt,
          paymentMethod: "Bank Transfer",
          billingAddress: {
            billingName: orderData.billingName,
            billinggAddress: orderData.billinggAddress,
            billingCity: orderData.billingCity,
            billingPostalCode: orderData.billingPostalCode,
            tax: orderData.billingTax,
            branch: orderData.billingBranch,
          },
          shippingAddress: {
            shippingname: orderData.shippingName,
            phone: orderData.shippingPhone,
          },
          items: [
            {
              product_id: orderData.id || orderData._id,
              name: `Copy PCB: ${orderData.projectname}`,
              qty: orderData.pcb_qty,
              price: (Number(orderData.confirmed_price || 0) / 1.07) / orderData.pcb_qty,
            }
          ],
          itemsPrice: Number(orderData.confirmed_price || 0) / 1.07,
          vatPrice: Number(orderData.confirmed_price || 0) * 0.07 / 1.07,
          shippingPrice: 0,
          totalPrice: Number(orderData.confirmed_price || 0),
          paymentComfirmID: orderData.paymentComfirmID || orderData.orderID,
        } : null}
        companyInfo={companyInfo}
        printMode={printMode}
      />
      <AbbreviatedTaxInvoice
        order={orderData ? {
          id: orderData.id || orderData._id,
          createdAt: orderData.created_at || orderData.createdAt,
          paymentMethod: "Bank Transfer",
          billingAddress: {
            billingName: orderData.billingName,
            billinggAddress: orderData.billinggAddress,
            billingCity: orderData.billingCity,
            billingPostalCode: orderData.billingPostalCode,
            tax: orderData.billingTax,
            branch: orderData.billingBranch,
          },
          shippingAddress: {
            shippingname: orderData.shippingName,
            phone: orderData.shippingPhone,
          },
          items: [
            {
              product_id: orderData.id || orderData._id,
              name: `Copy PCB: ${orderData.projectname}`,
              qty: orderData.pcb_qty,
              price: (Number(orderData.confirmed_price || 0) / 1.07) / orderData.pcb_qty,
            }
          ],
          itemsPrice: Number(orderData.confirmed_price || 0) / 1.07,
          vatPrice: Number(orderData.confirmed_price || 0) * 0.07 / 1.07,
          shippingPrice: 0,
          totalPrice: Number(orderData.confirmed_price || 0),
          paymentComfirmID: orderData.paymentComfirmID || orderData.orderID,
        } : null}
        companyInfo={companyInfo}
        printMode={printMode}
      />

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white !important; padding: 0 !important; }
        }
      ` }} />
    </div>
  );
};

export default CopyPCBDetailScreen;
