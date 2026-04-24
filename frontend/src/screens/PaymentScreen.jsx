import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeCanvas } from "qrcode.react";
import generatePayload from "promptpay-qr";

import CheckoutSteps from "../components/CheckoutSteps";
import Loader from "../components/Loader";
import { clearCartItems } from "../slices/cartSlice";
import {
  useCreateOrderMutation,
  useUploadPaymentSlipImageMutation,
} from "../slices/ordersApiSlice";

//  ดึงข้อมูล API ของ Custom PCB ที่ต้องแก้ไข
import { useCreateCustomPCBMutation } from "../slices/custompcbApiSlice";
import { useUpdateAmountCustomcartMutation } from "../slices/custompcbCartApiSlice";

import { generateOrderID } from "../utils/generateOrderID";
import {
  FaUniversity,
  FaMoneyBillWave,
  FaFileUpload,
  FaReceipt,
  FaQrcode,
  FaCopy,
  FaTimes,
  FaShieldAlt,
  FaChevronRight,
  FaTags,
  FaClock,
  FaCalendarAlt,
  FaBox,
} from "react-icons/fa";

const SHOP_CONFIG = {
  promptPayID: "0992263277", // เบอร์พร้อมเพย์สำหรับรับเงิน
  accName: "บจ. พาวินอิเล็คโทรนิกส์",
};

const BANK_ACCOUNTS = [
  {
    id: "KTB",
    label: "KTB บ.กรุงไทย - 082-0-74742-4",
    value: "082-0-74742-4 (KTB)",
    bankName: "ธนาคารกรุงไทย (KTB)",
    accNo: "082-0-74742-4",
    initial: "K",
    color: "bg-[#00AEEF]", // KTB Blue
  },
  {
    id: "SCB",
    label: "SCB บ.ไทยพาณิชย์ - 146-2-90304-4",
    value: "146-2-90304-4 (SCB)",
    bankName: "ธนาคารไทยพาณิชย์ (SCB)",
    accNo: "146-2-90304-4",
    initial: "S",
    color: "bg-[#4E2E7F]", // SCB Purple
  },
  {
    id: "KBANK",
    label: "KBANK บ.กสิกรไทย - 012-3-45678-9",
    value: "012-3-45678-9 (KBANK)",
    bankName: "ธนาคารกสิกรไทย (KBANK)",
    accNo: "012-3-45678-9",
    initial: "K",
    color: "bg-[#138000]", // KBANK Green
  },
];

const PaymentScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  //  1. ดึงข้อมูลคำสั่งซื้อจาก URL Parameters
  const searchParams = new URLSearchParams(location.search);
  const orderType = searchParams.get("type") || "product";
  const urlOrderId = searchParams.get("orderId") || "";
  const urlAmount = Number(searchParams.get("amount") || 0);
  const urlProductId = searchParams.get("productId") || "";
  const urlQty = Number(searchParams.get("qty") || 1);
  const urlPrice = Number(searchParams.get("price") || 0);
  const urlProductName = searchParams.get("name") || "";
  const urlProductImage = searchParams.get("image") || "";

  // ตรวจสอบว่าคือการสั่งซื้อแบบไหน
  const isBuyNow = orderType === "buynow";

  //  ใช้งาน API Hooks
  const [createOrder, { isLoading: isCreatingProductOrder }] =
    useCreateOrderMutation();
  const [createCustomPCB, { isLoading: isCreatingCustom }] =
    useCreateCustomPCBMutation();
  const [updateAmountCustomcart] = useUpdateAmountCustomcartMutation();
  const [uploadPaymentSlipImage, { isLoading: isImageUploading }] =
    useUploadPaymentSlipImageMutation();

  const { userInfo } = useSelector((state) => state.auth);
  const cart = useSelector((state) => state.cart);
  //  ดึงข้อมูลที่อยู่จัดส่งและวิธีรับสินค้าจาก Shipping (ใน Redux)
  const { shippingAddress, receivePlace } = cart;
  const { language } = useSelector((state) => state.language);

  // Calculate prices from cart items (always recalculate for accuracy)
  const calculatedPrices = useMemo(() => {
    if (orderType !== "product" && orderType !== "buynow") {
      return { itemsPrice: 0, vatPrice: 0, shippingPrice: 0, totalPrice: 0 };
    }

    // Buy Now mode: ใช้ข้อมูลจาก URL params แทนตะกร้า
    if (isBuyNow) {
      const itemsPrice = urlPrice * urlQty;
      const shippingPrice = Number(cart?.shippingPrice) || 0;
      const vatPrice = itemsPrice * 0.07;
      const totalPrice = itemsPrice + vatPrice + shippingPrice;
      return {
        itemsPrice: Math.round(itemsPrice * 100) / 100,
        vatPrice: Math.round(vatPrice * 100) / 100,
        shippingPrice: Math.round(shippingPrice * 100) / 100,
        totalPrice: Math.round(totalPrice * 100) / 100,
      };
    }

    const cartItems = cart?.cartItems || [];
    const selectedItems = cartItems.filter(item => item.isSelected !== false);

    // Calculate items price: sum of (price * qty) for each selected item
    const itemsPrice = selectedItems.reduce(
      (acc, item) => acc + (Number(item.price) * Number(item.qty)),
      0
    );

    // Get shipping price from cart state
    const shippingPrice = Number(cart?.shippingPrice) || 0;

    // Calculate VAT (7% of items price) and total
    const vatPrice = itemsPrice * 0.07;
    const totalPrice = itemsPrice + vatPrice + shippingPrice;

    return {
      itemsPrice: Math.round(itemsPrice * 100) / 100,
      vatPrice: Math.round(vatPrice * 100) / 100,
      shippingPrice: Math.round(shippingPrice * 100) / 100,
      totalPrice: Math.round(totalPrice * 100) / 100,
    };
  }, [cart?.cartItems, cart?.shippingPrice, cart?.receivePlace, orderType, isBuyNow, urlPrice, urlQty]);

  // Always use calculated prices for display (more reliable)
  const displayItemsPrice = calculatedPrices.itemsPrice;
  const displayVatPrice = calculatedPrices.vatPrice;
  const displayShippingPrice = calculatedPrices.shippingPrice;
  const displayTotalPrice = calculatedPrices.totalPrice;

  const getCurrentDateTime = () => {
    const now = new Date();
    const pad = (n) => (n < 10 ? "0" + n : n);
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  };

  // State
  const [orderID, setOrderID] = useState("");
  const [paymentComfirmID, setPaymentComfirmID] = useState("");
  const [transferedName, setTransferedName] = useState("");
  const [customerName, setCustomerName] = useState(userInfo?.name || "");
  const [image, setImage] = useState("");
  const [qrCodePayload, setQrCodePayload] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("promptpay");
  const [transferedDate, setTransferedDate] = useState(getCurrentDateTime());
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  //  คำนวณราคารวมทั้งหมด (ใช้ calculated price หรือ fallback)
  // CRITICAL FIX: ใช้ calculatedPrices ที่คำนวณจาก selectedItems จริงๆ ทุกครั้ง
  const transferedAmount =
    (orderType === "product" || isBuyNow) ? calculatedPrices.totalPrice : urlAmount;

  useEffect(() => {
    console.log("[PaymentScreen] useEffect triggered, cart.cartItems:", cart.cartItems?.length);

    if (isBuyNow) {
      // Buy Now mode: ไม่ต้องเช็คตะกร้าหรือที่อยู่จัดส่ง (ผ่าน ShippingScreen มาแล้ว)
      const tempOrderID = `PWT-${generateOrderID()}`;
      setOrderID(tempOrderID);
      setPaymentComfirmID(tempOrderID);
    } else if (orderType === "product") {
      if (!cart.cartItems || cart.cartItems.length === 0) {
        console.log("[PaymentScreen] Cart empty, redirecting to /cart");
        navigate("/cart");
        return;
      } else if (!cart.shippingAddress?.address) {
        console.log("[PaymentScreen] No shipping address, redirecting to /shipping");
        navigate("/shipping");
        return;
      }

      // Removed erroneous toast.error
      const selectedItems = cart.cartItems.filter(item => item.isSelected !== false);
      console.log("[PaymentScreen] Selected items for payment:", selectedItems.length);

      const tempOrderID = `PWT-${generateOrderID()}`;
      setOrderID(tempOrderID);
      setPaymentComfirmID(tempOrderID);
    } else {
      if (!urlOrderId || urlAmount <= 0) {
        toast.error("ข้อมูลคำสั่งซื้อไม่ถูกต้อง โปรดตรวจสอบอีกครั้ง");
        navigate("/");
        return;
      }
      setOrderID(`REQ-${urlOrderId.padStart(5, "0")}`);
      setPaymentComfirmID(urlOrderId);
    }

    // 1. ตรวจสอบความถูกต้องของข้อมูล (Validation)
    let amountToPay = 0;
    if (isBuyNow) {
      // Buy Now mode: ใช้ข้อมูลจาก URL params
      amountToPay = calculatedPrices.totalPrice;
      console.log(`[PaymentScreen] BuyNow: Price=${urlPrice}, Qty=${urlQty}, Total=${amountToPay}`);
    } else if (orderType === "product") {
      // เตรียมข้อมูลการสั่งซื้อ (Selected Items)
      const allItems = cart.cartItems || [];
      const items = allItems.filter(item => item.isSelected !== false);
      const totalItemsQty = items.reduce((acc, item) => acc + Number(item.qty), 0);
      const uniqueItemsCount = new Set(items.map((i) => i.product)).size;

      // ตรวจสอบความถูกต้องของข้อมูล (ตรวจสอบราคาที่ถูกต้อง + ส่วนลด + ค่าส่ง)
      const calculatedItemsPrice = items.reduce(
        (acc, item) => acc + (Number(item.price) * Number(item.qty)),
        0
      );

      // คำนวณรวมทั้งหมด (Items + VAT 7% + Shipping)
      const shippingCost = Number(cart.shippingPrice) || 0;
      const itemsWithVat = calculatedItemsPrice * 1.07;
      const expectedTotal = itemsWithVat + shippingCost;

      console.log(`[PaymentScreen] Items: ${items.length}, ItemsPrice: ${calculatedItemsPrice}, VAT(7%): ${calculatedItemsPrice * 0.07}, Shipping: ${shippingCost}, Total: ${expectedTotal}`);

      if (items.length !== uniqueItemsCount) {
        console.warn("ข้อมูลสั่งซื้อไม่ถูกต้องในรายการ");
      }

      // ใช้ข้อมูลที่คำนวณไว้แล้วในขั้นตอนก่อนหน้า
      amountToPay = expectedTotal;
    } else {
      amountToPay = urlAmount;
    }

    // 2. สร้าง QR Code
    if (amountToPay > 0) {
      const payload = generatePayload(SHOP_CONFIG.promptPayID, {
        amount: amountToPay,
      });
      setQrCodePayload(payload);
    }
  }, [cart, navigate, orderType, urlOrderId, urlAmount]);

  const uploadPaymenSlipImageHandler = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
      const formData = new FormData();
      formData.append("image", file);
      try {
        const res = await uploadPaymentSlipImage(formData).unwrap();
        setImage(res.image);
        toast.success("อัปโหลดสลีปเรียบร้อยแล้ว กรุณารอการตรวจสอบ");
      } catch (err) {
        toast.error(err?.data?.message || err.error);
        setPreviewUrl(null);
        setImage("");
      }
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    if (!image) {
      toast.error(
        language === "thai"
          ? "กรุณาอัปโหลดสลีปชำระเงิน"
          : "Please upload payment slip",
      );
      return;
    }
    if (!transferedName) {
      toast.error(
        language === "thai"
          ? "กรุณากรอกรายละเอียดการโอน"
          : "Please select a bank account",
      );
      return;
    }

    if (isBuyNow) {
      // Buy Now mode: สั่งซื้อสินค้าชิ้นเดียวจาก URL params (ไม่เกี่ยวกับตะกร้า)
      try {
        const buyNowOrderItems = [{
          name: urlProductName || `Product ${urlProductId}`,
          qty: Number(urlQty),
          image: urlProductImage,
          price: Number(urlPrice),
          product: urlProductId,
        }];

        const res = await createOrder({
          orderItems: buyNowOrderItems,
          shippingAddress: cart.shippingAddress,
          billingAddress: cart.billingAddress,
          paymentResult: {
            paymentComfirmID,
            transferedName,
            transferedAmount: calculatedPrices.totalPrice,
            transferedDate,
            image,
            status: "COMPLETED",
            email_address: userInfo.email,
          },
          receivePlace: cart.receivePlace,
          itemsPrice: calculatedPrices.itemsPrice,
          shippingPrice: calculatedPrices.shippingPrice,
          totalPrice: calculatedPrices.totalPrice,
        }).unwrap();

        // Buy Now ไม่ต้อง clear cart เพราะไม่ได้ใช้ตะกร้า
        navigate(`/order/${res.orderId}`);
      } catch (err) {
        toast.error(err?.data?.message || "เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ");
        setImage("");
        setPreviewUrl(null);
      }
    } else if (orderType === "product") {
      //  หมายเหตุ: สั่งซื้อแล้ว - ส่งข้อมูลการสั่งซื้อที่แก้ไขแล้ว
      try {
        const selectedItems = cart.cartItems.filter(item => item.isSelected !== false);

        if (selectedItems.length === 0) {
          toast.error(
            language === "thai"
              ? "กรุณากรอกรายละเอียดสั่งซื้อให้ครบ 1 รายการ"
              : "Please select at least 1 item",
          );
          return;
        }

        const cleanedOrderItems = selectedItems.map((item) => ({
          name: item.name,
          qty: Number(item.qty),
          image: item.image,
          price: Number(item.price),
          product: item.product,
        }));

        const res = await createOrder({
          orderItems: cleanedOrderItems,
          shippingAddress: cart.shippingAddress,
          billingAddress: cart.billingAddress,
          paymentResult: {
            paymentComfirmID,
            transferedName,
            transferedAmount: calculatedPrices.totalPrice,
            transferedDate,
            image,
            status: "COMPLETED",
            email_address: userInfo.email,
          },
          receivePlace: cart.receivePlace,
          itemsPrice: calculatedPrices.itemsPrice,
          shippingPrice: calculatedPrices.shippingPrice,
          totalPrice: calculatedPrices.totalPrice,
        }).unwrap();

        dispatch(clearCartItems());
        navigate(`/order/${res.orderId}`);
      } catch (err) {
        toast.error(err?.data?.message || "เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ");
        setImage("");
        setPreviewUrl(null);
      }
    } else if (orderType === "custom") {
      // 📌 หมายเหตุ: อินทิเกรต (Custom PCB) - ส่งข้อมูลที่แก้ไขแล้วให้แก้ไข
      try {
        await createCustomPCB({
          orderData: {
            cartId: urlOrderId,
            userId: userInfo?._id,
            userName: customerName,
            userEmail: userInfo?.email,
            transferedAmount,
            transferedDate,
            transferedName,
            paymentSlip: image,

            //  หมายเหตุ: ส่งข้อมูลที่แก้ไขแล้วให้ "เพิ่มใหม่" จากหน้า Shipping ด้วย
            receivePlace: receivePlace || "bysending",
            shippingName: shippingAddress?.shippingname || customerName,
            shippingPhone: shippingAddress?.phone || userInfo?.phone,
            shippingAddress: shippingAddress?.address,
            shippingCity: shippingAddress?.city,
            shippingPostalCode: shippingAddress?.postalCode,
            shippingCountry: shippingAddress?.country,
          },
        }).unwrap();

        // อัพเดทสถานะให้กับคำสั่งซื้อ
        await updateAmountCustomcart({ id: urlOrderId }).unwrap();

        toast.success("อัปเดตข้อมูลเรียบร้อยแล้ว กรุณาตรวจสอบสถานะ");
        navigate("/profile");
      } catch (err) {
        toast.error(err?.data?.message || "Error updating payment");
        setImage("");
        setPreviewUrl(null);
      }
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("บันทึกข้อมูลเรียบร้อยแล้ว!");
  };

  const t = {
    en: {
      stepTitle: "Confirm Payment",
      scanQR: "PromptPay QR",
      bankTransfer: "Bank Account",
      amount: "Amount to Transfer",
      date: "Transaction Date",
      customer: "Payer Name",
      upload: "Upload Slip",
      confirm: "Confirm Payment",
      summary: "Payment Info",
      summaryDetail: "Order Summary",
      total: "Net Amount",
      selectMethod: "Choose Method",
      scanHint: "Scan to pay exact amount",
      account: "Transfer Account",
      itemsPrice: "Products",
      vatPrice: "VAT (7%)",
      shippingPrice: "Shipping",
    },
    thai: {
      stepTitle: "ยืนยันการชำระเงิน",
      scanQR: "สแกนจ่าย (QR)",
      bankTransfer: "โอนเงินผ่านธนาคาร",
      amount: "จำนวนเงินที่ต้องชำระ",
      date: "วันที่และเวลาที่โอน",
      customer: "ชื่อผู้โอน",
      upload: "อัปโหลดหลักฐานการโอน (สลีป)",
      confirm: "ยืนยันการชำระเงิน",
      summary: "สรุปข้อมูลการสั่งซื้อ",
      summaryDetail: "สรุปรายละเอียดการสั่งซื้อ",
      total: "จำนวนเงินรวมทั้งสิ้น",
      selectMethod: "เลือกวิธีการชำระเงิน",
      scanHint: "สแกนเพื่อจ่ายด้วยการสแกน QR",
      account: "บัญชีธนาคารปลายทาง",
      itemsPrice: "ราคาสินค้า",
      vatPrice: "VAT (7%)",
      shippingPrice: "ค่าจัดส่ง",
    },
  }[language || "en"];

  const getCategoryName = (type) => {
    switch (type) {
      case "product":
        return {
          name: "สินค้าทั่วไป (Cart)",
          color: "text-black",
          bg: "bg-slate-50",
        };
      case "custom":
        return {
          name: "สั่งทำ Custom PCB",
          color: "text-black",
          bg: "bg-slate-50",
        };
      case "pcb":
        return {
          name: "Copy PCB",
          color: "text-black",
          bg: "bg-slate-50",
        };
      case "assembly":
        return {
          name: "ออร์เดอร์ Assembly",
          color: "text-black",
          bg: "bg-slate-50",
        };
      case "orderpcb":
        return {
          name: "สั่งซื้อ PCB",
          color: "text-black",
          bg: "bg-slate-50",
        };
      case "buynow":
        return {
          name: language === "thai" ? "สั่งซื้อทันที" : "Buy Now",
          color: "text-black",
          bg: "bg-slate-50",
        };
      default:
        return {
          name: "รายการสั่งซื้อทั้งหมด",
          color: "text-slate-600",
          bg: "bg-slate-50",
        };
    }
  };
  const categoryInfo = getCategoryName(orderType);
  const isProcessing =
    isCreatingProductOrder || isCreatingCustom || isImageUploading;

  return (
    <div className="bg-[#fcfdfe] min-h-screen py-4 md:py-8 px-4 font-sans antialiased">
      <div className="max-w-6xl mx-auto">
        {(orderType === "product" || isBuyNow) && <CheckoutSteps step1 step2 step3 />}

        <h1 className="text-2xl md:text-4xl font-black text-slate-900 text-center mt-6 md:mt-10 mb-6 md:mb-8 tracking-tight uppercase">
          {t.stepTitle}
        </h1>

        <div className="flex justify-center mb-8 md:mb-12 px-2">
          <div
            className={`inline-flex items-center gap-2 px-4 md:px-5 py-2 rounded-full border border-slate-100 shadow-sm ${categoryInfo.bg}`}
          >
            <FaTags className={categoryInfo.color} size={14} />
            <span
              className={`text-[10px] md:text-sm font-black uppercase tracking-wider ${categoryInfo.color}`}
            >
              อัปเดตสถานะ : {categoryInfo.name}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 items-start">
          {/* LEFT: Payment Methods */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden relative z-10">
              <div className="p-2 flex gap-1 bg-slate-50 border-b border-slate-100 relative z-20">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("promptpay")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${paymentMethod === "promptpay" ? "bg-white text-black shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                >
                  <FaQrcode /> {t.scanQR}
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("bank")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${paymentMethod === "bank" ? "bg-white text-black shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                >
                  <FaUniversity /> {t.bankTransfer}
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
                      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xl inline-block mb-6 relative">
                        <QRCodeCanvas
                          value={qrCodePayload}
                          size={220}
                          className="rounded-lg"
                        />
                      </div>
                      <h3 className="text-3xl font-black text-slate-900">
                        ฿{displayTotalPrice.toLocaleString()}
                      </h3>
                      <p className="text-slate-400 text-sm font-medium mt-2">
                        {t.scanHint}
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
                      {/* Dynamic Bank Display */}
                      {(() => {
                        const selectedBank =
                          BANK_ACCOUNTS.find(
                            (b) => b.value === transferedName,
                          ) || BANK_ACCOUNTS[0];

                        return (
                          <div className="bg-slate-50 border border-slate-100 p-4 md:p-6 rounded-3xl text-start">
                            <div className="flex items-center gap-4 mb-4">
                              <div
                                className={`w-12 h-12 ${selectedBank.color} rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg`}
                              >
                                {selectedBank.initial}
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                  Bank Name
                                </p>
                                <p className="font-bold text-slate-800">
                                  {selectedBank.bankName}
                                </p>
                              </div>
                            </div>
                            <div className="bg-white p-4 rounded-2xl flex items-center justify-between border border-slate-100">
                              <span className="text-xl font-black text-slate-900 font-mono">
                                {selectedBank.accNo}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  copyToClipboard(selectedBank.accNo)
                                }
                                className="p-2 bg-slate-50 text-slate-400 hover:text-black rounded-xl transition-all"
                              >
                                <FaCopy />
                              </button>
                            </div>
                            <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                              Account: {SHOP_CONFIG.accName}
                            </p>
                          </div>
                        );
                      })()}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Order Summary Card - Left Side */}
            {(orderType === "product" || isBuyNow) && (
              <div className="bg-white rounded-3xl p-4 md:p-6 shadow-sm border border-slate-100">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <FaReceipt size={12} />
                  {t.summaryDetail}
                </h4>
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-slate-500">
                      {t.itemsPrice}
                    </span>
                    <span className="text-sm font-bold text-slate-700">
                      ฿{displayItemsPrice.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-slate-500">
                      {t.vatPrice}
                    </span>
                    <span className="text-sm font-bold text-slate-700">
                      ฿{displayVatPrice.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-slate-500">
                      {t.shippingPrice}
                    </span>
                    <span className="text-sm font-bold text-slate-700">
                      {displayShippingPrice === 0 ? (
                        <span className="text-emerald-600">{language === "thai" ? "ฟรี" : "Free"}</span>
                      ) : (
                        <>฿{displayShippingPrice.toLocaleString()}</>
                      )}
                    </span>
                  </div>
                  <div className="border-t border-slate-100 pt-2.5 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-slate-700 uppercase tracking-wide">
                        {t.total}
                      </span>
                      <span className="text-base font-black text-indigo-600">
                        ฿{displayTotalPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-slate-900 rounded-3xl p-4 md:p-6 text-white flex justify-between items-center shadow-xl shadow-slate-200">
              <div className="text-start">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  รายละเอียดการชำระเงิน
                </p>
                <p className="font-mono font-bold text-lg">{orderID}</p>
              </div>
              <FaShieldAlt className="text-black text-2xl" />
            </div>
          </div>

          {/* RIGHT: Confirmation Form */}
          <div className="lg:col-span-7 text-start">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden h-full flex flex-col relative z-10">
              <div className="bg-slate-50/50 px-4 md:px-8 py-4 md:py-5 border-b border-slate-100 flex items-center gap-3">
                <FaReceipt className="text-black" />{" "}
                <h3 className="font-bold text-slate-800 text-sm md:text-base">
                  {t.summary}
                </h3>
              </div>

              <form
                onSubmit={submitHandler}
                className="p-4 md:p-8 flex-grow flex flex-col gap-4 md:gap-6"
              >


                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 text-start">
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      {t.customer}
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      {t.account}
                    </label>
                    {(() => {
                      const selectedOption =
                        transferedName === "PromptPay QR"
                          ? { icon: "📱", label: "พร้อมเพย์ (Scan QR Code)" }
                          : BANK_ACCOUNTS.find(
                            (b) => b.value === transferedName,
                          )
                            ? {
                              icon: "🏦",
                              label: BANK_ACCOUNTS.find(
                                (b) => b.value === transferedName,
                              ).label,
                            }
                            : {
                              icon: "🏦",
                              label: "-- เลือกช่องทางที่สะดวกในการชำระเงิน --",
                            };

                      const handleSelect = (val) => {
                        setTransferedName(val);
                        if (val === "PromptPay QR") {
                          setPaymentMethod("promptpay");
                        } else {
                          setPaymentMethod("bank");
                        }
                        setIsDropdownOpen(false);
                      };

                      return (
                        <div className="relative">
                          {/* Selected View */}
                          <div
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className={`w-full bg-white border-2 rounded-[1.2rem] px-4 py-3 flex items-center justify-between cursor-pointer transition-all duration-300 ${isDropdownOpen ? "border-black shadow-lg scale-[1.01]" : "border-slate-100 hover:border-slate-300 shadow-sm"}`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{selectedOption.icon}</span>
                              <span className="text-sm font-bold text-slate-800">
                                {selectedOption.label}
                              </span>
                            </div>
                            <FaChevronRight
                              className={`text-slate-400 transition-transform duration-300 ${isDropdownOpen ? "rotate-90 text-black" : "rotate-0"}`}
                              size={10}
                            />
                          </div>

                          {/* Dropdown Menu */}
                          <AnimatePresence>
                            {isDropdownOpen && (
                              <>
                                {/* Overlay to close */}
                                <div
                                  className="fixed inset-0 z-[60]"
                                  onClick={() => setIsDropdownOpen(false)}
                                />
                                <motion.div
                                  initial={{ opacity: 0, y: 5, scale: 0.98 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: 5, scale: 0.98 }}
                                  className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-100 rounded-[1.5rem] shadow-2xl overflow-hidden z-[70] py-1"
                                >
                                  <div
                                    onClick={() => handleSelect("PromptPay QR")}
                                    className={`px-4 py-3 flex items-center gap-3 hover:bg-slate-50 cursor-pointer transition-colors ${transferedName === "PromptPay QR" ? "bg-slate-50" : ""}`}
                                  >
                                    <span className="text-xl text-start">📱</span>
                                    <div className="flex flex-col text-start">
                                      <span className="text-sm font-bold text-slate-800 leading-tight">
                                        พร้อมเพย์ (Scan QR Code)
                                      </span>
                                      <span className="text-[10px] font-medium text-slate-400">
                                        Scan and Pay instantly
                                      </span>
                                    </div>
                                    {transferedName === "PromptPay QR" && (
                                      <div className="ml-auto w-1.5 h-1.5 bg-black rounded-full" />
                                    )}
                                  </div>

                                  <div className="mx-4 border-t border-slate-50 my-0.5" />

                                  {BANK_ACCOUNTS.map((bank) => (
                                    <div
                                      key={bank.id}
                                      onClick={() => handleSelect(bank.value)}
                                      className={`px-4 py-3 flex items-center gap-3 hover:bg-slate-50 cursor-pointer transition-colors ${transferedName === bank.value ? "bg-slate-50" : ""}`}
                                    >
                                      <span className="text-xl text-start">🏦</span>
                                      <div className="flex flex-col text-start">
                                        <span className="text-sm font-bold text-slate-800 leading-tight">
                                          {bank.label}
                                        </span>
                                        <span className="text-[10px] font-medium text-slate-400">
                                          {bank.bankName}
                                        </span>
                                      </div>
                                      {transferedName === bank.value && (
                                        <div className="ml-auto w-1.5 h-1.5 bg-black rounded-full" />
                                      )}
                                    </div>
                                  ))}
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      {t.amount}
                    </label>
                    <div className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-black text-black">
                      ฿{displayTotalPrice.toLocaleString()}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      {t.date}
                    </label>
                    <div className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-500">
                      {transferedDate.replace("T", " ")}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-start">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    {t.upload} <span className="text-rose-500">*</span>
                  </label>
                  <div
                    className={`relative group border-2 border-dashed rounded-3xl p-4 md:p-8 text-center transition-all duration-300 ${image ? "border-green-400 bg-green-50/30" : "border-slate-200 bg-slate-50/50 hover:border-blue-400"}`}
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
                        <FaFileUpload className="mx-auto text-slate-300 text-4xl mb-4 group-hover:text-blue-500 transition-colors" />
                        <p className="text-sm font-bold text-slate-500">
                          ตรวจสอบและบันทึกสลีปชำระเงิน
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
                  disabled={isProcessing || !image}
                  className="w-full bg-black hover:bg-black/90 disabled:bg-slate-200 text-white font-black text-lg py-5 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 mt-auto active:scale-[0.98]"
                >
                  {isProcessing ? (
                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      {t.confirm} <FaChevronRight />
                    </>
                  )}
                </button>
                <div className="mt-4 flex justify-center items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                  <FaShieldAlt className="text-black" /> Secure Payment
                  Processing
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div >
  );
};

export default PaymentScreen;
