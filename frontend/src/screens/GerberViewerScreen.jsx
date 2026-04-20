import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  FaCheck,
  FaCloudUploadAlt,
  FaFileArchive,
  FaMicrochip,
  FaReceipt,
  FaRulerCombined,
  FaLayerGroup,
  FaPalette,
  FaWeightHanging,
  FaShieldAlt,
  FaChevronRight,
  FaExclamationCircle,
  FaPlus,
  FaMinus,
  FaArrowLeft,
} from "react-icons/fa";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useGetOwnShippingRatesQuery } from "../slices/orderpcbSlice";
import { useCreateOrderpcbCartMutation } from "../slices/orderpcbCartApiSlice";
import { savePCBOrderDetails } from "../slices/pcbCartSlice";
import Meta from "../components/Meta";

const GerberViewerScreen = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);
  const { language } = useSelector((state) => state.language);

  const { data, isLoading: isDataLoading } = useGetOwnShippingRatesQuery();

  // --- Translations ---
  const translations = {
    en: {
      title: "Instant PCB Quote",
      subtitle:
        "Professional Manufacturing • Quality Guaranteed • Fast Delivery",
      gerberTitle: "Gerber Files",
      gerberDesc: "Upload design (.zip / .rar)",
      uploadHint: "Click or Drag Gerber File Here",
      uploadSupport: "Support .zip / .rar (Max 10MB)",
      pcbSpecs: "PCB Specifications",
      specsDesc: "Customize your board requirements",
      dimQty: "Dimensions & Qty",
      boardSize: "Board Size (mm)",
      qty: "Quantity (pcs)",
      layers: "Layers",
      thickness: "Thickness",
      material: "Base Material",
      solderMask: "Solder Mask Color",
      silkscreen: "Silkscreen",
      finish: "Surface Finish",
      copper: "Copper Weight",
      summary: "Order Summary",
      engFee: "Engineering / Setup Fee",
      boardCost: "Board Area Cost",
      customOptions: "Options Surcharge",
      shipping: "Shipping (Weight-based)",
      vat: "VAT",
      total: "Total",
      addCart: "ADD TO CART",
      secure: "Secure SSL Encryption",
      minOrder: "Minimum order",
      priceAdjusted: "Price adjusted to minimum.",
      errGerber: "Please upload a Gerber ZIP file.",
      errDim: "Please enter valid board dimensions",
      successCart: "Submitted to cart! Please wait for admin review and pricing.",
    },
    thai: {
      title: "ประเมินราคา PCB ทันที",
      subtitle: "ผลิตอย่างมืออาชีพ • รับประกันคุณภาพ • จัดส่งรวดเร็ว",
      gerberTitle: "ไฟล์ Gerber",
      gerberDesc: "อัปโหลดไฟล์ออกแบบ (.zip / .rar)",
      uploadHint: "คลิกหรือลากไฟล์ Gerber มาที่นี่",
      uploadSupport: "รองรับ .zip / .rar (สูงสุด 10MB)",
      pcbSpecs: "ข้อมูลจำเพาะ PCB",
      specsDesc: "ปรับแต่งความต้องการบอร์ดของคุณ",
      dimQty: "ขนาดและจำนวน",
      boardSize: "ขนาดบอร์ด (มม.)",
      qty: "จำนวน (ชิ้น)",
      layers: "จำนวนชั้น",
      thickness: "ความหนา",
      material: "วัสดุฐาน",
      solderMask: "สีบอร์ด (Solder Mask)",
      silkscreen: "สีอักษร (Silkscreen)",
      finish: "การเคลือบผิว",
      copper: "น้ำหนักทองแดง",
      summary: "สรุปรายการสั่งซื้อ",
      engFee: "ค่าเปิดเครื่อง (Setup Fee)",
      boardCost: "ค่าพื้นที่บอร์ด (Area Cost)",
      customOptions: "ค่าออปชั่นเสริม",
      shipping: "ค่าจัดส่ง (ตามน้ำหนัก)",
      vat: "ภาษีมูลค่าเพิ่ม",
      total: "ราคารวมทั้งหมด",
      addCart: "เพิ่มลงตะกร้า",
      secure: "การเข้ารหัส SSL ปลอดภัย",
      minOrder: "ราคาขั้นต่ำ",
      priceAdjusted: "ปรับราคาเป็นราคาเริ่มต้นขั้นต่ำแล้ว",
      errGerber: "กรุณาอัปโหลดไฟล์ Gerber ZIP",
      errDim: "กรุณาระบุขนาดบอร์ดที่ถูกต้อง",
      successCart: "ส่งข้อมูลไปยังตะกร้าแล้ว! กรุณารอแอดมินตรวจสอบและประเมินราคา",
    },
  };

  const t = translations[language] || translations.en;

  // --- Pricing Config จาก Database ---
  const buildTime = Number(data?.defaultPricing?.build_time ?? 10);
  const basePrice = Number(data?.defaultPricing?.base_price ?? 700);
  const pricePerCm = Number(data?.defaultPricing?.price_per_cm2 ?? 0.0016); // อิงเรท 0.0016 เพื่อให้คำนวณแบบตร.มม.
  const extraServiceFee = Number(
    data?.defaultPricing?.extra_service_fee ?? 795,
  ); // ค่าธรรมเนียมคงที่
  const profitMargin = Number(data?.defaultPricing?.profit_margin ?? 50); // กำไร 50%
  const vatRate = Number(data?.defaultPricing?.vat_percent ?? 7);
  const dhlServiceFixed = Number(data?.defaultPricing?.dhl_service_fixed ?? 0);

  const baseMaterials = data?.baseMaterials || [{ name: "FR-4", price: 0 }];
  const surfaceFinishes = data?.surfaceFinishes || [
    { name: "HASL(With lead)", price: 0 },
  ];
  const copperWeights = data?.copperWeights || [{ name: "1 oz", price: 0 }];
  const pcbColors = data?.pcbColors || [
    { name: "Green", price: 0 },
    { name: "Purple", price: 1 },
    { name: "Red", price: 1 },
    { name: "Yellow", price: 1 },
    { name: "Blue", price: 1 },
    { name: "White", price: 1 },
    { name: "Black", price: 1 },
  ];
  const shippingRates = data?.shippingRates || [];

  const [materialOptions, setMaterialOptions] = useState([]);
  const [finishOptions, setFinishOptions] = useState([]);
  const [copperOptions, setCopperOptions] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);

  // ตั้งค่าเริ่มต้นบอร์ดที่ 0x0mm
  const [formData, setFormData] = useState({
    baseMaterial: "FR-4",
    layers: 2,
    dimensions: { x: 0, y: 0 },
    pcbQty: 5,
    thickness: "1.6mm",
    pcbColor: "Green",
    silkscreen: "White",
    surfaceFinish: "HASL(With lead)",
    copperWeight: "1 oz",
  });

  const [zipFileName, setZipFileName] = useState("");
  const [gerberFiles, setGerberFiles] = useState([]);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  useEffect(() => {
    if (data) {
      setMaterialOptions(baseMaterials);
      setFinishOptions(surfaceFinishes);
      setCopperOptions(copperWeights);
      setColorOptions(pcbColors);
    }
  }, [data, baseMaterials, surfaceFinishes, copperWeights, pcbColors]);

  // ==========================================
  // ️ SYSTEMATIC PCB PRICING ENGINE
  // ==========================================

  // 1. คำนวณน้ำหนักบอร์ด (อิงตามโค้ดลูกค้า)
  const getThicknessPrice = () => (formData.thickness === "0.8mm" ? 0.5 : 1.0);

  const getkilogram = () => {
    const area = Number(formData.dimensions.x) * Number(formData.dimensions.y);
    const thickness = getThicknessPrice();
    const weight = area * 0.0000035 * Number(formData.pcbQty) * thickness;
    const weightPack = weight + 0.3; // +0.3kg packaging
    return parseFloat(weightPack.toFixed(2));
  };

  const getEmsDeliveryPrice = () => {
    const kg = getkilogram();
    const emsRates = shippingRates
      .filter((rate) => rate.shipping_type === "EMS")
      .sort((a, b) => Number(a.weight_kg) - Number(b.weight_kg));
    if (emsRates.length === 0) return 50.0; // ค่าจัดส่ง EMS แบบ fallback เป็น 50 หรือง่ายๆ
    for (const rate of emsRates) {
      if (kg <= Number(rate.weight_kg)) return Number(rate.price);
    }
    return Number(emsRates[emsRates.length - 1].price);
  };

  const getDhlDeliveryPrice = () => {
    const kg = getkilogram();
    const dhlRates = shippingRates
      .filter((rate) => rate.shipping_type === "DHL")
      .sort((a, b) => Number(a.weight_kg) - Number(b.weight_kg));
    if (dhlRates.length === 0) return 0;
    for (const rate of dhlRates) {
      if (kg <= Number(rate.weight_kg)) return Number(rate.price);
    }
    return Number(dhlRates[dhlRates.length - 1].price);
  };

  // 2. Helper สำหรับดึงราคาออปชั่นรายตัว
  const getBaseMaterialPrice = () =>
    Number(
      baseMaterials.find((m) => m.name === formData.baseMaterial)?.price,
    ) || 0;
  const getColorPrice = () =>
    Number(pcbColors.find((i) => i.name === formData.pcbColor)?.price) || 0;
  const getSurfaceFinishPrice = () =>
    Number(
      surfaceFinishes.find((s) => s.name === formData.surfaceFinish)?.price,
    ) || 0;
  const getCopperWeightPrice = () =>
    Number(
      copperWeights.find((c) => c.name === formData.copperWeight)?.price,
    ) || 0;

  const getOptionAddOnTotal = () =>
    getBaseMaterialPrice() +
    getColorPrice() +
    getSurfaceFinishPrice() +
    getCopperWeightPrice();

  // 3. คำนวณราคา Price (Sub Price) สำหรับแสดงในตาราง Summary (แสดงราคาพร้อมกำไรและVATตามเว็บจริง)
  const getSubPriceRaw = () => {
    const area = Number(formData.dimensions.x) * Number(formData.dimensions.y);
    const qty = Number(formData.pcbQty);
    const priceCm = Number(pricePerCm);
    const extraFee = Number(extraServiceFee);
    const margin = Number(profitMargin);
    const dhlRate = Number(getDhlDeliveryPrice());
    const dhlService = Number(dhlServiceFixed);
    const addons = getOptionAddOnTotal(); // เพิ่มตัวแปร addons

    if (area === 0) return 0;

    const totalArea = area * qty;
    const materialCost = totalArea * priceCm + extraFee;
    // นำ addons มารวมในต้นทุนหลัก
    const extratotal = materialCost + dhlRate + dhlService + addons;
    const withMargin = extratotal * (1 + margin / 100);
    const vatAmount = withMargin * (Number(vatRate) / 100);
    const withVat = withMargin + vatAmount;

    return withVat;
  };

  // 4. คำนวณราคารวมทั้งหมด (Total Price) ตามสูตรเป๊ะๆ
  const calculateTotalPriceRaw = () => {
    const area = Number(formData.dimensions.x) * Number(formData.dimensions.y);
    const qty = Number(formData.pcbQty);
    const priceCm = Number(pricePerCm);
    const base = Number(basePrice);
    const extraFee = Number(extraServiceFee);
    const margin = Number(profitMargin);
    const vatPercent = Number(vatRate);
    const dhlRate = Number(getDhlDeliveryPrice());
    const emsRate = Number(getEmsDeliveryPrice());
    const addons = getOptionAddOnTotal();
    const dhlService = Number(dhlServiceFixed);

    if (area === 0) return 0;

    const materialCost =
      area * priceCm * qty + extraFee + dhlRate + dhlService + addons;
    const withMargin = materialCost * (1 + margin / 100);
    const vatAmount = withMargin * (vatPercent / 100);
    const withVat = withMargin + vatAmount + emsRate;
    const calculateTotal = withVat < base ? base : withVat;

    return calculateTotal;
  };

  // 5. คำนวณ VAT แยกต่างหากเพื่อแสดงใน Summary
  const calculateVatAmount = () => {
    const area = Number(formData.dimensions.x) * Number(formData.dimensions.y);
    const qty = Number(formData.pcbQty);
    const priceCm = Number(pricePerCm);
    const extraFee = Number(extraServiceFee);
    const margin = Number(profitMargin);
    const vatPercent = Number(vatRate);
    const dhlRate = Number(getDhlDeliveryPrice());
    const dhlService = Number(dhlServiceFixed);
    const addons = getOptionAddOnTotal(); // เพิ่มตัวแปร addons

    if (area === 0) return 0;

    const totalArea = area * qty;
    const materialCost = totalArea * priceCm + extraFee;
    // นำ addons มารวมในต้นทุนหลัก
    const extratotal = materialCost + dhlRate + dhlService + addons;
    const withMargin = extratotal * (1 + margin / 100);
    const vatAmount = withMargin * (vatPercent / 100);

    return vatAmount;
  };

  // ==========================================

  const handleChange = (field, value) =>
    setFormData({ ...formData, [field]: value });

  const handleZipUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !/\.(zip|rar)$/i.test(file.name)) {
      toast.error(
        language === "thai"
          ? "กรุณาอัปโหลดไฟล์ .zip หรือ .rar ที่ถูกต้อง"
          : "Please upload a valid .zip or .rar file.",
      );
      return;
    }
    setZipFileName(file.name);
    const formDataUpload = new FormData();
    formDataUpload.append("gerberZip", file);
    try {
      const response = await fetch("/api/gerber/upload-zip", {
        method: "POST",
        body: formDataUpload,
      });
      const result = await response.json();
      if (response.ok) {
        setUploadSuccess(true);
        setUploadMessage(
          language === "thai"
            ? "อัปโหลดไฟล์สำเร็จ!"
            : "File uploaded successfully!",
        );
        setGerberFiles([`${result.path}`]);
      } else {
        setUploadSuccess(false);
        setUploadMessage(
          language === "thai" ? "อัปโหลดไม่สำเร็จ" : "Upload failed",
        );
      }
    } catch (err) {
      setUploadSuccess(false);
      setUploadMessage("Error");
    }
  };

  const [createOrderpcbCart, { isLoading: isCartLoading }] =
    useCreateOrderpcbCartMutation();

  const orderNowHandler = async (e) => {
    e.preventDefault();
    if (!userInfo) return navigate("/login");
    if (!zipFileName && (!gerberFiles || gerberFiles.length === 0))
      return toast.error(t.errGerber);
    if (formData.dimensions.x <= 0 || formData.dimensions.y <= 0)
      return toast.error(t.errDim);

    const totalPrice = calculateTotalPriceRaw().toFixed(2);
    const shipping = userInfo.shippingAddress || {};
    const billing = userInfo.billingAddress || {};

    const orderDetails = {
      projectname: zipFileName?.replace(/\.(zip|rar)$/i, "") || "My PCB",
      pcb_quantity: Number(formData.pcbQty),
      length_cm: Number(formData.dimensions.x),
      width_cm: Number(formData.dimensions.y),
      base_material: formData.baseMaterial,
      layers: Number(formData.layers),
      thickness_mm: parseFloat(formData.thickness),
      color: formData.pcbColor,
      silkscreen_color: formData.silkscreen,
      surface_finish: formData.surfaceFinish,
      copper_weight_oz: formData.copperWeight,
      gerberZip: gerberFiles[0],
      price: totalPrice,
      vat_price: calculateVatAmount().toFixed(2),

      user: {
        id: userInfo._id,
        name: userInfo.name,
        email: userInfo.email,
      },

      shippingAddress: {
        name: shipping.shippingname,
        address: shipping.address,
        city: shipping.city,
        postalCode: shipping.postalCode,
        country: shipping.country,
        phone: shipping.phone,
      },

      billingAddress: {
        name: billing.billingName,
        address: billing.billingAddress,
        city: billing.billingCity,
        postalCode: billing.billingPostalCode,
        country: billing.billingCountry,
        phone: billing.billingPhone,
        tax: billing.tax || "",
      },
    };

    dispatch(savePCBOrderDetails(orderDetails));

    try {
      await createOrderpcbCart({
        ...orderDetails,
        user_id: userInfo._id, // Add specifically for the cart table
        pcb_qty: orderDetails.pcb_quantity, // Map to field names from controller
      }).unwrap();
      localStorage.setItem("pcbcart", JSON.stringify(orderDetails));
      toast.success(t.successCart);
      navigate("/cart/pcbcart");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to add to cart");
    }
  };

  const renderOptionTiles = (field, options) => {
    const isColorField = field === "pcbColor";
    const disableAllButFirst = [
      "surfaceFinish",
      "copperWeight",
      "baseMaterial",
    ];
    const colorMap = {
      Green: "bg-green-600",
      Red: "bg-red-600",
      Blue: "bg-blue-600",
      Yellow: "bg-yellow-400",
      Black: "bg-gray-900",
      White: "bg-gray-100",
      Purple: "bg-purple-600",
    };

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-2">
        {options.map((option, index) => {
          const name = typeof option === "object" ? option.name : option;
          const isSelected = formData[field] === name;
          const isDisabled = disableAllButFirst.includes(field) && index !== 0;

          return (
            <button
              key={index}
              type="button"
              disabled={isDisabled}
              onClick={() => !isDisabled && handleChange(field, name)}
              className={`relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 ${isDisabled
                ? "opacity-40 cursor-not-allowed bg-slate-50 border-slate-100"
                : isSelected
                  ? "border-black bg-black text-white shadow-lg scale-[1.02]"
                  : "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200"
                }`}
            >
              {isColorField && (
                <div
                  className={`w-6 h-6 rounded-full mb-2 shadow-inner border border-black/10 ${colorMap[name] || "bg-gray-400"}`}
                />
              )}
              <span
                className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? "text-white" : "text-slate-400"}`}
              >
                {name}
              </span>
              {isSelected && !isDisabled && (
                <FaCheck className="absolute top-2 right-2 text-white text-[8px]" />
              )}
            </button>
          );
        })}
      </div>
    );
  };

  const changeQty = (amount) => {
    setFormData((prev) => ({
      ...prev,
      pcbQty: Math.max(5, prev.pcbQty + amount),
    }));
  };

  return (
    <div className="min-h-screen bg-white font-sans pb-20 selection:bg-black selection:text-white">
      <Meta title={t.title} />

      {/* --- Header Section --- */}
      <div className="bg-white border-b border-slate-100 py-4 md:py-8 mb-12">
        <div className="max-w-7xl mx-auto px-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-black transition-colors mb-8 w-fit uppercase tracking-[0.2em]"
          >
            <FaArrowLeft /> BACK
          </button>

          <div className="flex items-center gap-4 md:gap-6">
            <div className="w-16 h-16 rounded-2xl bg-black text-white flex items-center justify-center text-3xl shrink-0">
              <FaLayerGroup />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-black tracking-tighter mb-1 uppercase">
                {t.title}
              </h1>
              <p className="text-sm text-slate-500 font-medium tracking-wide m-0">
                {t.subtitle}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8">
          <div className="lg:col-span-8 space-y-8">
            {/* Gerber Files Card */}
            <section className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              <div className="px-4 md:px-8 py-5 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
                <div className="text-black">
                  <FaCloudUploadAlt size={20} />
                </div>
                <div>
                  <h2 className="text-xs font-black text-black uppercase tracking-widest leading-none">
                    {t.gerberTitle}
                  </h2>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-black">
                    {t.gerberDesc}
                  </p>
                </div>
              </div>
              <div className="p-4 md:p-8">
                <div
                  className={`relative group border-2 border-dashed rounded-2xl p-12 text-center transition-all ${uploadSuccess
                    ? "border-black bg-slate-50"
                    : "border-slate-100 hover:border-slate-200 bg-slate-50/50"
                    }`}
                >
                  <input
                    type="file"
                    accept=".zip,.rar"
                    onChange={handleZipUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="space-y-4">
                    {uploadSuccess ? (
                      <FaCheck className="mx-auto text-black text-5xl" />
                    ) : (
                      <FaFileArchive className="mx-auto text-slate-200 group-hover:text-black text-5xl transition-colors" />
                    )}
                    <div>
                      <h3 className="text-sm font-black text-black uppercase tracking-widest">
                        {zipFileName || t.uploadHint}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                        {t.uploadSupport}
                      </p>
                    </div>
                    {uploadMessage && (
                      <span
                        className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border ${uploadSuccess ? "bg-black text-white border-black" : "bg-white text-black border-black"}`}
                      >
                        {uploadMessage}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Specifications Card */}
            <section className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              <div className="px-4 md:px-8 py-5 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
                <div className="text-black">
                  <FaMicrochip size={20} />
                </div>
                <div>
                  <h2 className="text-xs font-black text-black uppercase tracking-widest leading-none">
                    {t.pcbSpecs}
                  </h2>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase font-black tracking-widest">
                    {t.specsDesc}
                  </p>
                </div>
              </div>
              <div className="p-4 md:p-8 space-y-12">
                <div className="p-4 md:p-8 bg-slate-50/50 border border-slate-100 rounded-3xl">
                  <h4 className="text-[10px] font-black text-black uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                    <FaRulerCombined className="text-xs" /> {t.dimQty}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 md:gap-10">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">
                        {t.boardSize}
                      </label>
                      <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                          <input
                            type="number"
                            placeholder="W"
                            value={formData.dimensions.x}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                dimensions: {
                                  ...formData.dimensions,
                                  x: parseInt(e.target.value) || 0,
                                },
                              })
                            }
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-4 font-black uppercase tracking-tighter focus:ring-1 focus:ring-black focus:border-black focus:outline-none text-center"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300 uppercase">
                            mm
                          </span>
                        </div>
                        <span className="text-slate-200 font-black">×</span>
                        <div className="relative flex-1">
                          <input
                            type="number"
                            placeholder="H"
                            value={formData.dimensions.y}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                dimensions: {
                                  ...formData.dimensions,
                                  y: parseInt(e.target.value) || 0,
                                },
                              })
                            }
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-4 font-black uppercase tracking-tighter focus:ring-1 focus:ring-black focus:border-black focus:outline-none text-center"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300 uppercase">
                            mm
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">
                        {t.qty}
                      </label>
                      <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1.5 shadow-sm">
                        <button
                          type="button"
                          onClick={() => changeQty(-5)}
                          disabled={formData.pcbQty <= 5}
                          className="w-12 h-11 flex items-center justify-center text-slate-400 hover:text-black hover:bg-slate-50 rounded-lg transition-all disabled:opacity-20"
                        >
                          <FaMinus className="text-[10px]" />
                        </button>
                        <div className="flex-1 text-center font-black text-xl text-black tracking-tighter">
                          {formData.pcbQty}
                        </div>
                        <button
                          type="button"
                          onClick={() => changeQty(5)}
                          className="w-12 h-11 flex items-center justify-center text-slate-400 hover:text-black hover:bg-slate-50 rounded-lg transition-all"
                        >
                          <FaPlus className="text-[10px]" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 md:gap-10">
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">
                      {t.layers}
                    </label>
                    {renderOptionTiles("layers", [1, 2])}
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">
                      {t.thickness}
                    </label>
                    {renderOptionTiles("thickness", ["0.8mm", "1.6mm"])}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">
                    {t.material}
                  </label>
                  {renderOptionTiles(
                    "baseMaterial",
                    materialOptions.length
                      ? materialOptions
                      : ["FR-4", "Aluminum"],
                  )}
                </div>

                <div className="space-y-8 pt-6 border-t border-slate-100">
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">
                      {t.solderMask}
                    </label>
                    {renderOptionTiles(
                      "pcbColor",
                      colorOptions.length
                        ? colorOptions
                        : [
                          "Green",
                          "Purple",
                          "Red",
                          "Yellow",
                          "Blue",
                          "White",
                          "Black",
                        ],
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 md:gap-10">
                    <div>
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">
                        {t.silkscreen}
                      </label>
                      {renderOptionTiles("silkscreen", ["White", "Black"])}
                    </div>
                    <div>
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">
                        {t.finish}
                      </label>
                      {renderOptionTiles(
                        "surfaceFinish",
                        finishOptions.length
                          ? finishOptions
                          : ["HASL(With lead)", "LeadFree HASL", "ENIG"],
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">
                    {t.copper}
                  </label>
                  {renderOptionTiles(
                    "copperWeight",
                    copperOptions.length ? copperOptions : ["1 oz", "2 oz"],
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT: Summary Area */}
          <div className="lg:col-span-4 space-y-6">
            <div className="sticky top-24 space-y-6">
              {/* 1. Summary Selected Card */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden text-start">
                <div className="px-4 md:px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                  <h2 className="text-[10px] font-black tracking-widest uppercase text-slate-400 mb-0">
                    Summary Selected
                  </h2>
                </div>
                <div className="p-4 md:p-6 space-y-4">
                  {[
                    { label: "Base Material", value: formData.baseMaterial },
                    { label: "Layers", value: formData.layers },
                    {
                      label: "Dimensions",
                      value: `${formData.dimensions.x} × ${formData.dimensions.y} mm`,
                    },
                    { label: "Thickness", value: formData.thickness },
                    { label: "Color", value: formData.pcbColor },
                    { label: "Silkscreen", value: formData.silkscreen },
                    { label: "Surface Finish", value: formData.surfaceFinish },
                    { label: "Copper Weight", value: formData.copperWeight },
                    { label: "PCB Quantity", value: formData.pcbQty },
                  ].map((row, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center text-[10px] font-bold"
                    >
                      <span className="text-slate-400 uppercase tracking-wider">
                        {row.label}
                      </span>
                      <span className="text-black uppercase tracking-tighter">
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Charge Details Card */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden text-start ring-1 ring-black/5">
                <div className="px-4 md:px-6 py-4 border-b border-slate-100 bg-black text-white">
                  <h2 className="text-[10px] font-black tracking-widest uppercase mb-0">
                    Charge Details
                  </h2>
                </div>
                <div className="p-4 md:p-6 space-y-5">
                  {[
                    { label: "Price", value: getSubPriceRaw().toFixed(2) },
                    {
                      label: "Base Material",
                      value: getBaseMaterialPrice().toFixed(2),
                    },
                    {
                      label: "Surface Finish",
                      value: getSurfaceFinishPrice().toFixed(2),
                    },
                    {
                      label: "Solder Mark Color",
                      value: getColorPrice().toFixed(2),
                    },
                    {
                      label: "Copper Weight",
                      value: getCopperWeightPrice().toFixed(2),
                    },
                    { label: "Build Time", value: `${buildTime} days` },
                    {
                      label: "Delivery",
                      value: getEmsDeliveryPrice().toFixed(2),
                    },
                    { label: "Vat 7%", value: calculateVatAmount().toFixed(2) },
                  ].map((row, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center text-[11px] font-black"
                    >
                      <span className="text-slate-400 uppercase tracking-widest">
                        {row.label}
                      </span>
                      <span className="text-black tracking-tighter">
                        {row.value}{" "}
                        {typeof row.value === "string" &&
                          row.value.includes("days")
                          ? ""
                          : "฿"}
                      </span>
                    </div>
                  ))}

                  <div className="pt-4 border-t border-slate-100 flex justify-between items-baseline">
                    <span className="text-xs font-black uppercase text-black">
                      Total Price
                    </span>
                    <div className="text-right">
                      <span className="text-3xl font-black text-black tracking-tighter">
                        {calculateTotalPriceRaw().toFixed(2)}
                      </span>
                      <span className="text-[10px] ml-1 font-black text-slate-400 uppercase">
                        ฿
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={orderNowHandler}
                    className="w-full py-4 bg-black text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all hover:bg-slate-900 shadow-lg active:scale-95"
                  >
                    ORDER NOW
                  </button>

                  <div className="pt-2">
                    <p className="text-[9px] text-red-500 font-bold uppercase tracking-wide leading-relaxed italic">
                      * If your order is lower than the minimum{" "}
                      {basePrice.toLocaleString()} ฿ charge, the minimum charge
                      will apply.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GerberViewerScreen;
