import { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeCanvas } from "qrcode.react";
import generatePayload from "promptpay-qr";

import CheckoutSteps from "../../components/CheckoutSteps";
import Loader from "../../components/Loader";

//  Import API ของ Order และ Cart
import { useUploadPaymentSlipImageMutation } from "../../slices/ordersApiSlice";
import { useCreateAssemblyPCBMutation } from "../../slices/assemblypcbApiSlice";
import {
  useGetAssemblycartByIdQuery,
  useUpdateAmountAssemblycartMutation,
} from "../../slices/assemblypcbCartApiSlice";

import {
  FaUniversity,
  FaFileUpload,
  FaReceipt,
  FaQrcode,
  FaCopy,
  FaShieldAlt,
  FaChevronRight,
  FaTags,
} from "react-icons/fa";

const SHOP_CONFIG = {
  promptPayID: "0992263277",
  bankName: "ธนาคารกสิกรไทย (KBANK)",
  accName: "บจก. พาวิน เทคโนโลยี",
  accNo: "012-3-45678-9",
};

const OrderassemblyPaymentScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 1. ดึง ID จาก URL
  const { id: paramId } = useParams();
  const searchParams = new URLSearchParams(location.search);
  const queryOrderId = searchParams.get("orderId");
  const orderId = paramId || queryOrderId;

  // 2. ดึงยอดเงินจาก URL (ถ้ามี)
  const rawAmount = searchParams.get("amount") || "0";
  const cleanAmount = rawAmount.toString().replace(/[^0-9.]/g, "");
  const urlAmount = Number(cleanAmount) || 0;

  // 3.  ดึงข้อมูลจาก Redux (นี่คือจุดที่เอาข้อมูลหน้า Shipping มาใช้ครับ)
  const { userInfo } = useSelector((state) => state.auth);
  const cart = useSelector((state) => state.cart);
  const { shippingAddress, receivePlace } = cart;
  // shippingAddress ตัวนี้แหละครับที่มีข้อมูลที่อยู่จากหน้าก่อนหน้า

  // 4.  ดึงข้อมูลตะกร้าจาก Database (สำรองกรณี URL ไม่มีราคา)
  const { data: cartData, isLoading: isCartLoading } =
    useGetAssemblycartByIdQuery(orderId, {
      skip: !orderId,
    });

  // คำนวณยอดเงิน: ถ้า URL มีค่าใช้ URL, ถ้าไม่มีใช้จาก Database
  const dbPrice =
    cartData?.data?.confirmed_price || cartData?.confirmed_price || 0;
  const finalAmount = urlAmount > 0 ? urlAmount : Number(dbPrice);

  // API Hooks
  const [createAssemblyPCB, { isLoading: isCreatingAssembly }] =
    useCreateAssemblyPCBMutation();
  const [updateAmountAssemblycart] = useUpdateAmountAssemblycartMutation();
  const [uploadPaymentSlipImage, { isLoading: isImageUploading }] =
    useUploadPaymentSlipImageMutation();

  const getCurrentDateTime = () => {
    const now = new Date();
    const pad = (n) => (n < 10 ? "0" + n : n);
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  };

  const [displayOrderID, setDisplayOrderID] = useState("");
  const [transferedName, setTransferedName] = useState("");
  const [customerName, setCustomerName] = useState(userInfo?.name || "");
  const [image, setImage] = useState("");
  const [qrCodePayload, setQrCodePayload] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("promptpay");
  const [transferedDate, setTransferedDate] = useState(getCurrentDateTime());

  useEffect(() => {
    if (!orderId) {
      toast.error("ไม่พบรหัสคำสั่งซื้อ");
    }

    setDisplayOrderID(`REQ-${(orderId || "00000").padStart(5, "0")}`);

    if (finalAmount > 0) {
      // Validation: เช็คจำนวนรายการซ้ำ
      console.log(`[Validation] Profile Assembly Order: ${orderId}, Final Amount: ${finalAmount}`);

      const payload = generatePayload(SHOP_CONFIG.promptPayID, {
        amount: finalAmount,
      });
      setQrCodePayload(payload);
    }
  }, [orderId, finalAmount]);

  const uploadPaymenSlipImageHandler = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
      const formData = new FormData();
      formData.append("image", file);

      try {
        const res = await uploadPaymentSlipImage(formData).unwrap();
        let uploadedImagePath =
          res.image ||
          res.path ||
          res.url ||
          res.filePath ||
          res.data?.image ||
          res;
        if (typeof uploadedImagePath !== "string") {
          uploadedImagePath = String(uploadedImagePath);
        }
        setImage(uploadedImagePath);
        toast.success("อัปโหลดสลิปเรียบร้อย");
      } catch (err) {
        toast.error(err?.data?.message || err.error || "Upload failed");
        setPreviewUrl(null);
        setImage("");
      }
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();

    if (!image) return toast.warning("กรุณาอัปโหลดสลิปให้เสร็จสมบูรณ์");
    if (!transferedName) return toast.warning("กรุณาเลือกบัญชีธนาคาร");
    if (!orderId) return toast.error("ไม่พบรหัสคำสั่งซื้อ");
    if (finalAmount <= 0)
      return toast.error("ยอดเงินไม่ถูกต้อง หรือรอแอดมินประเมินราคา");

    const mysqlFormattedDate = transferedDate.replace("T", " ") + ":00";

    //  รวบรวมข้อมูลส่ง Backend
    const coreData = {
      cartId: orderId,
      id: orderId,
      user_id: Number(userInfo?._id) || null,
      userId: Number(userInfo?._id) || null,
      userName: customerName,
      userEmail: userInfo?.email,
      transferedAmount: Number(finalAmount),
      transferedDate: mysqlFormattedDate,
      transferedName: transferedName,
      paymentSlip: image,
      paymentComfirmID: displayOrderID,

      //  จุดที่ส่งข้อมูลที่อยู่ (จากตัวแปร shippingAddress ด้านบน)
      receivePlace: receivePlace || "bysending",
      shippingName: shippingAddress?.shippingname || customerName,
      shippingPhone: shippingAddress?.phone || userInfo?.phone,
      shippingAddress: shippingAddress?.address,
      shippingCity: shippingAddress?.city,
      shippingPostalCode: shippingAddress?.postalCode,
      shippingCountry: shippingAddress?.country,
    };

    const ultimatePayload = {
      ...coreData,
      orderData: coreData,
    };

    try {
      await createAssemblyPCB(ultimatePayload).unwrap();
      await updateAmountAssemblycart({ id: orderId }).unwrap();

      toast.success("ชำระเงินสำเร็จ แอดมินกำลังตรวจสอบ");
      navigate("/profile?tab=assembly");
    } catch (err) {
      console.error("💥 Error:", err);
      const errorMsg =
        err?.data?.message || err?.error || "เกิดข้อผิดพลาดในการบันทึก";
      toast.error(`Error: ${errorMsg}`);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("คัดลอกเลขบัญชีแล้ว!");
  };

  const isProcessing = isCreatingAssembly || isImageUploading;

  return (
    <div className="bg-[#fcfdfe] min-h-screen py-4 md:py-6 md:py-10 px-4 font-prompt antialiased">
      <div className="max-w-6xl mx-auto text-start">
        <CheckoutSteps step1 step2 step3 />

        <h1 className="text-3xl md:text-4xl font-black text-slate-900 text-center mt-10 mb-8 tracking-tight uppercase">
          ยืนยันการชำระเงิน
        </h1>

        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-orange-100 shadow-sm bg-orange-50">
            <FaTags className="text-orange-600" size={14} />
            <span className="text-sm font-black uppercase tracking-wider text-orange-600">
              ชำระเงินสำหรับ : งานประกอบ Assembly PCB
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 items-start">
          {/* ส่วน QR Code */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden relative z-10">
              <div className="p-2 flex gap-1 bg-slate-50 border-b border-slate-100 relative z-20">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("promptpay")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${paymentMethod === "promptpay" ? "bg-white text-orange-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                >
                  <FaQrcode /> สแกนจ่าย (QR)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("bank")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${paymentMethod === "bank" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                >
                  <FaUniversity /> โอนผ่านบัญชี
                </button>
              </div>

              <div className="p-4 md:p-8 text-center">
                <AnimatePresence mode="wait">
                  {paymentMethod === "promptpay" ? (
                    <motion.div
                      key="qr"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      {isCartLoading ? (
                        <div className="py-4 md:py-6 md:py-10 text-slate-400 animate-pulse">
                          กำลังโหลดข้อมูลราคา...
                        </div>
                      ) : finalAmount > 0 ? (
                        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xl inline-block mb-6 relative">
                          <QRCodeCanvas
                            value={qrCodePayload}
                            size={220}
                            className="rounded-lg"
                          />
                        </div>
                      ) : (
                        <div className="p-4 md:p-8 border-2 border-dashed border-red-200 text-red-400 rounded-3xl mb-6 font-bold">
                          ไม่สามารถสร้าง QR ได้
                          <br />
                          (ไม่พบยอดเงิน)
                        </div>
                      )}
                      <h3 className="text-3xl font-black text-slate-900">
                        {Number(finalAmount).toLocaleString()} ฿
                      </h3>
                      <p className="text-slate-400 text-sm font-medium mt-2">
                        สแกนเพื่อจ่ายยอดที่ถูกต้อง
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="bank"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div className="bg-emerald-50/50 border border-emerald-100 p-4 md:p-6 rounded-3xl text-start">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                            K
                          </div>
                          <div>
                            <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-1">
                              Bank Name
                            </p>
                            <p className="font-bold text-slate-800">
                              {SHOP_CONFIG.bankName}
                            </p>
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl flex items-center justify-between border border-emerald-100">
                          <span className="text-xl font-black text-slate-900 font-mono">
                            {SHOP_CONFIG.accNo}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(SHOP_CONFIG.accNo)}
                            className="p-2 bg-slate-50 text-slate-400 hover:text-emerald-600 rounded-xl transition-all"
                          >
                            <FaCopy />
                          </button>
                        </div>
                        <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Account: {SHOP_CONFIG.accName}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="bg-slate-900 rounded-3xl p-4 md:p-6 text-white flex justify-between items-center shadow-xl shadow-slate-200">
              <div className="text-start">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  หมายเลขอ้างอิงชำระเงิน
                </p>
                <p className="font-mono font-bold text-lg">{displayOrderID}</p>
              </div>
              <FaShieldAlt className="text-orange-500 text-2xl" />
            </div>
          </div>

          {/* ส่วนฟอร์มข้อมูล */}
          <div className="lg:col-span-7 text-start">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden h-full flex flex-col relative z-10">
              <div className="bg-slate-50/50 px-4 md:px-8 py-5 border-b border-slate-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <FaReceipt className="text-orange-600" />{" "}
                  <h3 className="font-bold text-slate-800">
                    สรุปข้อมูลการชำระ
                  </h3>
                </div>
                <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm truncate max-w-[200px]">
                  Project:{" "}
                  {cartData?.data?.projectname ||
                    cartData?.projectname ||
                    "Checking..."}
                </span>
              </div>

              <form
                onSubmit={submitHandler}
                className="p-4 md:p-8 flex-grow flex flex-col gap-4 md:gap-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 text-start">
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      ชื่อผู้โอน
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      โอนเข้าบัญชีธนาคาร
                    </label>
                    <select
                      value={transferedName}
                      onChange={(e) => setTransferedName(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 outline-none appearance-none cursor-pointer focus:border-orange-500 transition-all"
                    >
                      <option value="" disabled>
                        -- เลือกบัญชีธนาคารที่คุณโอนเงินเข้า --
                      </option>
                      <option value="082-0-74742-4 (KTB)">
                        KTB ธ.กรุงไทย - 082-0-74742-4
                      </option>
                      <option value="146-2-90304-4 (SCB)">
                        SCB ธ.ไทยพาณิชย์ - 146-2-90304-4
                      </option>
                      <option value="PromptPay QR">
                        พร้อมเพย์ สแกน QR Code
                      </option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      ยอดเงินที่ต้องโอน
                    </label>
                    <div className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-black text-orange-600">
                      {Number(finalAmount).toLocaleString()} ฿
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      วันเวลาที่โอน
                    </label>
                    <div className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-500">
                      {transferedDate.replace("T", " ")}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-start">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    แนบหลักฐานการโอน (สลิป){" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <div
                    className={`relative group border-2 border-dashed rounded-3xl p-4 md:p-8 text-center transition-all duration-300 ${image ? "border-green-400 bg-green-50/30" : "border-slate-200 bg-slate-50/50 hover:border-orange-400"}`}
                  >
                    <input
                      type="file"
                      onChange={uploadPaymenSlipImageHandler}
                      accept="image/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-h-48 mx-auto rounded-2xl shadow-lg border border-white"
                      />
                    ) : (
                      <div className="py-4">
                        <FaFileUpload className="mx-auto text-slate-300 text-4xl mb-4 group-hover:text-orange-500 transition-colors" />
                        <p className="text-sm font-bold text-slate-500">
                          คลิกเพื่ออัปโหลดสลิปโอนเงิน
                        </p>
                      </div>
                    )}
                    {isImageUploading && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-3xl z-30">
                        <Loader size="sm" />
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing || !image || finalAmount <= 0}
                  className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-slate-200 text-white font-black text-lg py-5 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 mt-auto active:scale-[0.98]"
                >
                  {isProcessing ? (
                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      ยืนยันการชำระเงิน <FaChevronRight />
                    </>
                  )}
                </button>
                <div className="mt-4 flex justify-center items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                  <FaShieldAlt className="text-orange-500" /> Secure Payment
                  Processing
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderassemblyPaymentScreen;
