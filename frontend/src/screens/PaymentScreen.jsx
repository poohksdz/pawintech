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

//  à¸™à¸³à¹€à¸‚à¹‰à¸² API à¸‚à¸­à¸‡ Custom PCB à¹ƒà¸«à¹‰à¸„à¸£à¸šà¸–à¹‰à¸§à¸™
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
  promptPayID: "0992263277", // à¹€à¸šà¸­à¸£à¹Œà¸ªà¸³à¸«à¸£à¸±à¸šà¹€à¸—à¸ªà¸£à¸°à¸šà¸š
  accName: "à¸šà¸ˆà¸. à¸žà¸²à¸§à¸´à¸™ à¹€à¸—à¸„à¹‚à¸™à¹‚à¸¥à¸¢à¸µ",
};

const BANK_ACCOUNTS = [
  {
    id: "KTB",
    label: "KTB à¸˜.à¸à¸£à¸¸à¸‡à¹„à¸—à¸¢ - 082-0-74742-4",
    value: "082-0-74742-4 (KTB)",
    bankName: "à¸˜à¸™à¸²à¸„à¸²à¸£à¸à¸£à¸¸à¸‡à¹„à¸—à¸¢ (KTB)",
    accNo: "082-0-74742-4",
    initial: "K",
    color: "bg-[#00AEEF]", // KTB Blue
  },
  {
    id: "SCB",
    label: "SCB à¸˜.à¹„à¸—à¸¢à¸žà¸²à¸“à¸´à¸Šà¸¢à¹Œ - 146-2-90304-4",
    value: "146-2-90304-4 (SCB)",
    bankName: "à¸˜à¸™à¸²à¸„à¸²à¸£à¹„à¸—à¸¢à¸žà¸²à¸“à¸´à¸Šà¸¢à¹Œ (SCB)",
    accNo: "146-2-90304-4",
    initial: "S",
    color: "bg-[#4E2E7F]", // SCB Purple
  },
  {
    id: "KBANK",
    label: "KBANK à¸˜.à¸à¸ªà¸´à¸à¸£à¹„à¸—à¸¢ - 012-3-45678-9",
    value: "012-3-45678-9 (KBANK)",
    bankName: "à¸˜à¸™à¸²à¸„à¸²à¸£à¸à¸ªà¸´à¸à¸£à¹„à¸—à¸¢ (KBANK)",
    accNo: "012-3-45678-9",
    initial: "K",
    color: "bg-[#138000]", // KBANK Green
  },
];

const PaymentScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  //  1. à¸£à¸°à¸šà¸šà¹à¸¢à¸à¸›à¸£à¸°à¹€à¸ à¸— Order à¸ˆà¸²à¸ URL Parameters
  const searchParams = new URLSearchParams(location.search);
  const orderType = searchParams.get("type") || "product";
  const urlOrderId = searchParams.get("orderId") || "";
  const urlAmount = Number(searchParams.get("amount") || 0);
  const urlProductId = searchParams.get("productId") || "";
  const urlQty = Number(searchParams.get("qty") || 1);
  const urlPrice = Number(searchParams.get("price") || 0);

  // à¸•à¸£à¸§à¸ˆà¸ªà¸­à¸šà¸§à¹ˆà¸²à¹€à¸›à¹‡à¸™à¸à¸²à¸£à¸‹à¸·à¹‰à¸­à¸—à¸±à¸™à¸—à¸µà¸«à¸£à¸·à¸­à¹„à¸¡à¹ˆ
  const isBuyNow = orderType === "buynow";

  //  à¹€à¸£à¸µà¸¢à¸à¹ƒà¸Šà¹‰ API Hooks
  const [createOrder, { isLoading: isCreatingProductOrder }] =
    useCreateOrderMutation();
  const [createCustomPCB, { isLoading: isCreatingCustom }] =
    useCreateCustomPCBMutation();
  const [updateAmountCustomcart] = useUpdateAmountCustomcartMutation();
  const [uploadPaymentSlipImage, { isLoading: isImageUploading }] =
    useUploadPaymentSlipImageMutation();

  const { userInfo } = useSelector((state) => state.auth);
  const cart = useSelector((state) => state.cart);
  //  à¸”à¸¶à¸‡à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸—à¸µà¹ˆà¸­à¸¢à¸¹à¹ˆà¹à¸¥à¸°à¸§à¸´à¸˜à¸µà¸£à¸±à¸šà¸‚à¸­à¸‡à¸—à¸µà¹ˆà¹€à¸žà¸´à¹ˆà¸‡à¹€à¸¥à¸·à¸­à¸à¸¡à¸²à¸ˆà¸²à¸à¸«à¸™à¹‰à¸² Shipping (à¹ƒà¸™ Redux)
  const { shippingAddress, receivePlace } = cart;
  const { language } = useSelector((state) => state.language);

  // Calculate prices from cart items (always recalculate for accuracy)
  const calculatedPrices = useMemo(() => {
    if (orderType !== "product") {
      return { itemsPrice: 0, vatPrice: 0, shippingPrice: 0, totalPrice: 0 };
    }

    const selectedItems = (cart.cartItems || []).filter(item => item.isSelected !== false);

    // Calculate items price: sum of (price * qty) for each selected item
    const itemsPrice = selectedItems.reduce(
      (acc, item) => acc + (Number(item.price) * Number(item.qty)),
      0
    );

    // Get shipping price
    const shippingPrice = Number(cart.shippingPrice) || 0;

    // Calculate VAT (7% of items price) and total
    const vatPrice = itemsPrice * 0.07;
    const totalPrice = itemsPrice + vatPrice + shippingPrice;

    console.log("[PaymentScreen] useMemo calculated:", {
      itemsPrice,
      vatPrice,
      shippingPrice,
      totalPrice,
      selectedItems: selectedItems.length,
      cartItems: cart.cartItems?.length
    });

    return {
      itemsPrice: Math.round(itemsPrice * 100) / 100,
      vatPrice: Math.round(vatPrice * 100) / 100,
      shippingPrice: Math.round(shippingPrice * 100) / 100,
      totalPrice: Math.round(totalPrice * 100) / 100,
    };
  }, [cart.cartItems, cart.shippingPrice, orderType]);

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

  //  à¸à¸³à¸«à¸™à¸”à¸¢à¸­à¸”à¹€à¸‡à¸´à¸™ (à¹ƒà¸Šà¹‰ calculated price à¹€à¸›à¹‡à¸™ fallback)
  const transferedAmount =
    orderType === "product" ? displayTotalPrice : urlAmount;

  useEffect(() => {
    console.log("[PaymentScreen] useEffect triggered, cart.cartItems:", cart.cartItems?.length);

    if (orderType === "product") {
      if (!cart.cartItems || cart.cartItems.length === 0) {
        console.log("[PaymentScreen] Cart empty, redirecting to /cart");
        navigate("/cart");
        return;
      } else if (!cart.shippingAddress?.address) {
        console.log("[PaymentScreen] No shipping address, redirecting to /shipping");
        navigate("/shipping");
        return;
      }

      // à¸•à¸£à¸§à¸ˆà¸ªà¸­à¸šà¸ˆà¸³à¸™à¸§à¸™à¸ªà¸´à¸™à¸„à¹‰à¸²à¸—à¸µà¹ˆà¹€à¸¥à¸·à¸­à¸
      const selectedItems = cart.cartItems.filter(item => item.isSelected !== false);
      console.log("[PaymentScreen] Selected items for payment:", selectedItems.length);

      const tempOrderID = `PWT-${generateOrderID()}`;
      setOrderID(tempOrderID);
      setPaymentComfirmID(tempOrderID);
    } else {
      if (!urlOrderId || urlAmount <= 0) {
        toast.error("à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸„à¸³à¸ªà¸±à¹ˆà¸‡à¸‹à¸·à¹‰à¸­à¹„à¸¡à¹ˆà¸ªà¸¡à¸šà¸¹à¸£à¸“à¹Œ");
        navigate("/");
        return;
      }
      setOrderID(`REQ-${urlOrderId.padStart(5, "0")}`);
      setPaymentComfirmID(urlOrderId);
    }

    // 1. à¹€à¸Šà¹‡à¸„à¸ˆà¸³à¸™à¸§à¸™à¸ªà¸´à¸™à¸„à¹‰à¸²à¹à¸¥à¸°à¸£à¸²à¸¢à¸à¸²à¸£à¸‹à¹‰à¸³ (Validation)
    let amountToPay = 0;
    if (orderType === "product") {
      // à¹€à¸‰à¸žà¸²à¸°à¸£à¸²à¸¢à¸à¸²à¸£à¸—à¸µà¹ˆà¸–à¸¹à¸à¹€à¸¥à¸·à¸­à¸ (Selected Items)
      const allItems = cart.cartItems || [];
      const items = allItems.filter(item => item.isSelected !== false);
      const totalItemsQty = items.reduce((acc, item) => acc + Number(item.qty), 0);
      const uniqueItemsCount = new Set(items.map((i) => i.product)).size;

      // à¸•à¸£à¸§à¸ˆà¸ªà¸­à¸šà¸„à¸§à¸²à¸¡à¸–à¸¹à¸à¸•à¹‰à¸­à¸‡à¸‚à¸­à¸‡à¸¢à¸­à¸”à¹€à¸‡à¸´à¸™ (à¸„à¸³à¸™à¸§à¸“à¸ˆà¸²à¸à¸£à¸²à¸¢à¸à¸²à¸£à¸—à¸µà¹ˆà¹€à¸¥à¸·à¸­à¸ + à¸ à¸²à¸©à¸µ + à¸‚à¸™à¸ªà¹ˆà¸‡)
      const calculatedItemsPrice = items.reduce(
        (acc, item) => acc + (Number(item.price) * Number(item.qty)),
        0
      );

      // à¸„à¸³à¸™à¸§à¸“à¸¢à¸­à¸”à¸£à¸§à¸¡ (Items + VAT 7% + Shipping)
      const shippingCost = Number(cart.shippingPrice) || 0;
      const itemsWithVat = calculatedItemsPrice * 1.07;
      const expectedTotal = itemsWithVat + shippingCost;

      console.log(`[PaymentScreen] Items: ${items.length}, ItemsPrice: ${calculatedItemsPrice}, VAT(7%): ${calculatedItemsPrice * 0.07}, Shipping: ${shippingCost}, Total: ${expectedTotal}`);

      if (items.length !== uniqueItemsCount) {
        console.warn("à¸žà¸šà¸£à¸²à¸¢à¸à¸²à¸£à¸ªà¸´à¸™à¸„à¹‰à¸²à¸‹à¹‰à¸³à¹ƒà¸™à¸£à¸²à¸¢à¸à¸²à¸£à¸—à¸µà¹ˆà¹€à¸¥à¸·à¸­à¸");
      }

      // à¹ƒà¸Šà¹‰à¸¢à¸­à¸”à¸—à¸µà¹ˆà¸„à¸³à¸™à¸§à¸“à¹ƒà¸«à¸¡à¹ˆà¹€à¸žà¸·à¹ˆà¸­à¸„à¸§à¸²à¸¡à¸Šà¸±à¸§à¸£à¹Œ
      amountToPay = expectedTotal;
    } else {
      amountToPay = urlAmount;
    }

    // 2. à¸ªà¸£à¹‰à¸²à¸‡ QR Code
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
        toast.success("à¸­à¸±à¸›à¹‚à¸«à¸¥à¸”à¸ªà¸¥à¸´à¸›à¹€à¸£à¸µà¸¢à¸šà¸£à¹‰à¸­à¸¢ à¸£à¸°à¸šà¸šà¸à¸³à¸¥à¸±à¸‡à¸£à¸­à¸à¸²à¸£à¸¢à¸·à¸™à¸¢à¸±à¸™");
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
          ? "à¸à¸£à¸¸à¸“à¸²à¹à¸™à¸šà¸ªà¸¥à¸´à¸›à¹‚à¸­à¸™à¹€à¸‡à¸´à¸™"
          : "Please upload payment slip",
      );
      return;
    }
    if (!transferedName) {
      toast.error(
        language === "thai"
          ? "à¸à¸£à¸¸à¸“à¸²à¹€à¸¥à¸·à¸­à¸à¸šà¸±à¸à¸Šà¸µà¸˜à¸™à¸²à¸„à¸²à¸£"
          : "Please select a bank account",
      );
      return;
    }

    if (orderType === "product") {
      //  à¸à¸£à¸“à¸µ: à¸ªà¸´à¸™à¸„à¹‰à¸²à¸—à¸±à¹ˆà¸§à¹„à¸› - à¸ªà¹ˆà¸‡à¹€à¸‰à¸žà¸²à¸°à¸£à¸²à¸¢à¸à¸²à¸£à¸—à¸µà¹ˆà¹€à¸¥à¸·à¸­à¸à¹€à¸—à¹ˆà¸²à¸™à¸±à¹‰à¸™
      try {
        const selectedItems = cart.cartItems.filter(item => item.isSelected !== false);

        if (selectedItems.length === 0) {
          toast.error(
            language === "thai"
              ? "à¸à¸£à¸¸à¸“à¸²à¹€à¸¥à¸·à¸­à¸à¸ªà¸´à¸™à¸„à¹‰à¸²à¸­à¸¢à¹ˆà¸²à¸‡à¸™à¹‰à¸­à¸¢ 1 à¸£à¸²à¸¢à¸à¸²à¸£"
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
            transferedAmount: Number(transferedAmount),
            transferedDate,
            image,
            status: "COMPLETED",
            email_address: userInfo.email,
          },
          receivePlace: cart.receivePlace,
          itemsPrice: Number(cart.itemsPrice),
          shippingPrice: Number(cart.shippingPrice),
          totalPrice: Number(cart.totalPrice),
        }).unwrap();

        dispatch(clearCartItems());
        navigate(`/order/${res.orderId}`);
      } catch (err) {
        toast.error(err?.data?.message || "à¹€à¸à¸´à¸”à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸”à¹ƒà¸™à¸à¸²à¸£à¸ªà¸£à¹‰à¸²à¸‡à¸­à¸­à¹€à¸”à¸­à¸£à¹Œ");
        setImage("");
        setPreviewUrl(null);
      }
    } else if (orderType === "custom") {
      // ï¸ à¸à¸£à¸“à¸µ: à¸‡à¸²à¸™à¸ªà¸±à¹ˆà¸‡à¸—à¸³ (Custom PCB) - à¸ªà¹ˆà¸‡à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸—à¸µà¹ˆà¸­à¸¢à¸¹à¹ˆà¹ƒà¸«à¸¡à¹ˆà¸žà¹ˆà¸§à¸‡à¹„à¸›à¸”à¹‰à¸§à¸¢
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

            //  à¸«à¸±à¸§à¹ƒà¸ˆà¸ªà¸³à¸„à¸±à¸: à¸ªà¹ˆà¸‡à¸—à¸µà¹ˆà¸­à¸¢à¸¹à¹ˆà¸—à¸µà¹ˆ "à¹€à¸žà¸´à¹ˆà¸‡à¸à¸£à¸­à¸à¹ƒà¸«à¸¡à¹ˆ" à¸ˆà¸²à¸à¸«à¸™à¹‰à¸² Shipping à¹„à¸›à¸¢à¸±à¸‡ Backend
            receivePlace: receivePlace || "bysending",
            shippingName: shippingAddress?.shippingname || customerName,
            shippingPhone: shippingAddress?.phone || userInfo?.phone,
            shippingAddress: shippingAddress?.address,
            shippingCity: shippingAddress?.city,
            shippingPostalCode: shippingAddress?.postalCode,
            shippingCountry: shippingAddress?.country,
          },
        }).unwrap();

        // à¸­à¸±à¸›à¹€à¸”à¸•à¸ªà¸–à¸²à¸™à¸°à¸šà¸´à¸¥à¹ƒà¸™à¸•à¸°à¸à¸£à¹‰à¸²
        await updateAmountCustomcart({ id: urlOrderId }).unwrap();

        toast.success("à¸Šà¸³à¸£à¸°à¹€à¸‡à¸´à¸™à¸ªà¸³à¹€à¸£à¹‡à¸ˆ à¹à¸­à¸”à¸¡à¸´à¸™à¸à¸³à¸¥à¸±à¸‡à¸•à¸£à¸§à¸ˆà¸ªà¸­à¸š");
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
    toast.success("à¸„à¸±à¸”à¸¥à¸­à¸à¹€à¸¥à¸‚à¸šà¸±à¸à¸Šà¸µà¹à¸¥à¹‰à¸§!");
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
      stepTitle: "à¸¢à¸·à¸™à¸¢à¸±à¸™à¸à¸²à¸£à¸Šà¸³à¸£à¸°à¹€à¸‡à¸´à¸™",
      scanQR: "à¸ªà¹à¸à¸™à¸ˆà¹ˆà¸²à¸¢ (QR)",
      bankTransfer: "à¹‚à¸­à¸™à¸œà¹ˆà¸²à¸™à¸šà¸±à¸à¸Šà¸µ",
      amount: "à¸¢à¸­à¸”à¹€à¸‡à¸´à¸™à¸—à¸µà¹ˆà¸•à¹‰à¸­à¸‡à¹‚à¸­à¸™",
      date: "à¸§à¸±à¸™à¹€à¸§à¸¥à¸²à¸—à¸µà¹ˆà¹‚à¸­à¸™",
      customer: "à¸Šà¸·à¹ˆà¸­à¸œà¸¹à¹‰à¹‚à¸­à¸™",
      upload: "à¹à¸™à¸šà¸«à¸¥à¸±à¸à¸à¸²à¸™à¸à¸²à¸£à¹‚à¸­à¸™ (à¸ªà¸¥à¸´à¸›)",
      confirm: "à¸¢à¸·à¸™à¸¢à¸±à¸™à¸à¸²à¸£à¸Šà¸³à¸£à¸°à¹€à¸‡à¸´à¸™",
      summary: "à¸ªà¸£à¸¸à¸›à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸à¸²à¸£à¸Šà¸³à¸£à¸°",
      summaryDetail: "à¸ªà¸£à¸¸à¸›à¸£à¸²à¸¢à¸à¸²à¸£à¸ªà¸±à¹ˆà¸‡à¸‹à¸·à¹‰à¸­",
      total: "à¸¢à¸­à¸”à¸£à¸§à¸¡à¸ªà¸¸à¸—à¸˜à¸´",
      selectMethod: "à¹€à¸¥à¸·à¸­à¸à¸§à¸´à¸˜à¸µà¸Šà¸³à¸£à¸°à¹€à¸‡à¸´à¸™",
      scanHint: "à¸ªà¹à¸à¸™à¹€à¸žà¸·à¹ˆà¸­à¸ˆà¹ˆà¸²à¸¢à¸¢à¸­à¸”à¸—à¸µà¹ˆà¸–à¸¹à¸à¸•à¹‰à¸­à¸‡",
      account: "à¹‚à¸­à¸™à¹€à¸‚à¹‰à¸²à¸šà¸±à¸à¸Šà¸µà¸˜à¸™à¸²à¸„à¸²à¸£",
      itemsPrice: "à¸£à¸²à¸„à¸²à¸ªà¸´à¸™à¸„à¹‰à¸²",
      vatPrice: "VAT (7%)",
      shippingPrice: "à¸„à¹ˆà¸²à¸ˆà¸±à¸”à¸ªà¹ˆà¸‡",
    },
  }[language || "en"];

  const getCategoryName = (type) => {
    switch (type) {
      case "product":
        return {
          name: "à¸ªà¸´à¸™à¸„à¹‰à¸²à¸—à¸±à¹ˆà¸§à¹„à¸› (Cart)",
          color: "text-black",
          bg: "bg-slate-50",
        };
      case "custom":
        return {
          name: "à¸ªà¸±à¹ˆà¸‡à¸—à¸³ Custom PCB",
          color: "text-black",
          bg: "bg-slate-50",
        };
      case "pcb":
        return {
          name: "à¸à¹Šà¸­à¸›à¸›à¸µà¹‰ Copy PCB",
          color: "text-black",
          bg: "bg-slate-50",
        };
      case "assembly":
        return {
          name: "à¸‡à¸²à¸™à¸›à¸£à¸°à¸à¸­à¸š (Assembly)",
          color: "text-black",
          bg: "bg-slate-50",
        };
      case "orderpcb":
        return {
          name: "à¸­à¸­à¹€à¸”à¸­à¸£à¹Œà¹à¸œà¹ˆà¸™ PCB",
          color: "text-black",
          bg: "bg-slate-50",
        };
      default:
        return {
          name: "à¸£à¸²à¸¢à¸à¸²à¸£à¸­à¸·à¹ˆà¸™à¹†",
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
        {orderType === "product" && <CheckoutSteps step1 step2 step3 />}

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
              à¸Šà¸³à¸£à¸°à¹€à¸‡à¸´à¸™à¸ªà¸³à¸«à¸£à¸±à¸š : {categoryInfo.name}
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
                        à¸¿{displayTotalPrice.toLocaleString()}
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
            {orderType === "product" && (
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
                      à¸¿{displayItemsPrice.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-slate-500">
                      {t.vatPrice}
                    </span>
                    <span className="text-sm font-bold text-slate-700">
                      à¸¿{displayVatPrice.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-slate-500">
                      {t.shippingPrice}
                    </span>
                    <span className="text-sm font-bold text-slate-700">
                      {displayShippingPrice === 0 ? (
                        <span className="text-emerald-600">{language === "thai" ? "à¸Ÿà¸£à¸µ" : "Free"}</span>
                      ) : (
                        <>à¸¿{displayShippingPrice.toLocaleString()}</>
                      )}
                    </span>
                  </div>
                  <div className="border-t border-slate-100 pt-2.5 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-slate-700 uppercase tracking-wide">
                        {t.total}
                      </span>
                      <span className="text-base font-black text-indigo-600">
                        à¸¿{displayTotalPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-slate-900 rounded-3xl p-4 md:p-6 text-white flex justify-between items-center shadow-xl shadow-slate-200">
              <div className="text-start">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  à¸«à¸¡à¸²à¸¢à¹€à¸¥à¸‚à¸­à¹‰à¸²à¸‡à¸­à¸´à¸‡à¸Šà¸³à¸£à¸°à¹€à¸‡à¸´à¸™
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
                {/* Order Summary Breakdown */}
                {orderType === "product" && (
                  <div className="bg-gradient-to-br from-slate-50 to-indigo-50 rounded-3xl p-4 md:p-6 border border-slate-100 shadow-sm">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <FaReceipt size={12} />
                      {t.summaryDetail}
                    </h4>
                    <div className="space-y-3">
                      {/* Products */}
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-600">
                          {t.itemsPrice}
                        </span>
                        <span className="text-sm font-bold text-slate-800">
                          à¸¿{displayItemsPrice.toLocaleString()}
                        </span>
                      </div>
                      {/* VAT */}
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-600">
                          {t.vatPrice}
                        </span>
                        <span className="text-sm font-bold text-slate-800">
                          à¸¿{displayVatPrice.toLocaleString()}
                        </span>
                      </div>
                      {/* Shipping */}
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-600">
                          {t.shippingPrice}
                        </span>
                        <span className="text-sm font-bold text-slate-800">
                          {displayShippingPrice === 0 ? (
                            <span className="text-emerald-600">{language === "thai" ? "à¸Ÿà¸£à¸µ" : "Free"}</span>
                          ) : (
                            <>à¸¿{displayShippingPrice.toLocaleString()}</>
                          )}
                        </span>
                      </div>
                      {/* Divider */}
                      <div className="border-t border-slate-200 my-2"></div>
                      {/* Total */}
                      <div className="flex justify-between items-center">
                        <span className="text-base font-black text-slate-900 uppercase tracking-wide">
                          {t.total}
                        </span>
                        <span className="text-xl font-black text-indigo-600">
                          à¸¿{displayTotalPrice.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* BuyNow Product Detail */}
                {isBuyNow && (
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-4 md:p-6 border border-amber-200 shadow-sm">
                    <h4 className="text-xs font-black text-amber-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <FaReceipt size={12} />
                      {language === "thai" ? "สินค้าสั่งซื้อทันที" : "Direct Purchase"}
                    </h4>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white rounded-xl border border-amber-100 flex items-center justify-center shadow-sm">
                        <FaBox size={24} className="text-amber-300" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-slate-800 text-sm">
                          {language === "thai" ? "สินค้าชิ้นเดียว x" : "Single Item x"}{" "}{urlQty}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          ฿{urlPrice.toLocaleString()} / ชิ้น
                        </p>
                      </div>
                    </div>
                  </div>
                )}

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
                          ? { icon: "ðŸ“²", label: "à¸žà¸£à¹‰à¸­à¸¡à¹€à¸žà¸¢à¹Œ (Scan QR Code)" }
                          : BANK_ACCOUNTS.find(
                            (b) => b.value === transferedName,
                          )
                            ? {
                              icon: "ðŸ¦",
                              label: BANK_ACCOUNTS.find(
                                (b) => b.value === transferedName,
                              ).label,
                            }
                            : {
                              icon: "ðŸ’³",
                              label: "-- à¹€à¸¥à¸·à¸­à¸à¸Šà¹ˆà¸­à¸‡à¸—à¸²à¸‡à¸—à¸µà¹ˆà¸„à¸¸à¸“à¸Šà¸³à¸£à¸°à¹€à¸‡à¸´à¸™ --",
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
                                    <span className="text-xl text-start">ðŸ“²</span>
                                    <div className="flex flex-col text-start">
                                      <span className="text-sm font-bold text-slate-800 leading-tight">
                                        à¸žà¸£à¹‰à¸­à¸¡à¹€à¸žà¸¢à¹Œ (Scan QR Code)
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
                                      <span className="text-xl text-start">ðŸ¦</span>
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
                      à¸¿{displayTotalPrice.toLocaleString()}
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
                          à¸„à¸¥à¸´à¸à¹€à¸žà¸·à¹ˆà¸­à¸­à¸±à¸›à¹‚à¸«à¸¥à¸”à¸ªà¸¥à¸´à¸›à¹‚à¸­à¸™à¹€à¸‡à¸´à¸™
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
