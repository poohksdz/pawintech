import { useSelector } from "react-redux";
import { useState, useRef, useMemo } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaArrowLeft,
  FaSave,
  FaBox,
  FaTags,
  FaFilePdf,
  FaImage,
  FaVideo,
  FaInfoCircle,
  FaListAlt,
  FaCloudUploadAlt,
  FaArrowRight,
  FaChevronLeft,
} from "react-icons/fa";
import { toast } from "react-toastify";
import Loader from "../../components/Loader";

import {
  useCreateProductMutation,
  useUploadProductImageMutation,
  useUploadProductMutipleImageMutation,
  useUploadProductDatasheetMutation,
  useUploadProductManualMutation,
} from "../../slices/productsApiSlice";
import { useGetCategorysQuery } from "../../slices/categorySlice.js";

const ProductCreateScreen = () => {
  const navigate = useNavigate();
  const { language } = useSelector((state) => state.language);

  // --- State for Tabs ---
  const [activeTab, setActiveTab] = useState("general");

  // --- Form State ---
  const [productCode, setProductCode] = useState("");
  const [name, setName] = useState("");
  const [nameThai, setNameThai] = useState("");
  const [price, setPrice] = useState(0);
  const [countInStock, setCountInStock] = useState(0);
  const [quantity, setQuantity] = useState(0); // Added
  const [weight, setWeight] = useState(0); // Added
  const [position, setPosition] = useState(""); // Added

  const [image, setImage] = useState("");
  const [mutipleImage, setMutipleImage] = useState([]);
  const [datasheet, setDatasheet] = useState("");
  const [manual, setManual] = useState("");

  const [brand, setBrand] = useState("");
  const [brandThai, setBrandThai] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categoryThai, setCategoryThai] = useState("");
  const [subcategory, setSubcategory] = useState(""); // Added

  const [electotronixPN, setElectotronixPN] = useState(""); // Added
  const [manufacture, setManufacture] = useState(""); // Added
  const [manufacturePN, setManufacturePN] = useState(""); // Added

  const [description, setDescription] = useState("");
  const [descriptionThai, setDescriptionThai] = useState("");
  const [videoLink, setVideoLink] = useState("");

  // --- API Hooks ---
  const [createProduct, { isLoading }] = useCreateProductMutation();
  const [uploadProductImage, { isLoading: loadingUpload }] =
    useUploadProductImageMutation();
  const [uploadProductMutipleImage, { isLoading: loadingMultiple }] =
    useUploadProductMutipleImageMutation();
  const [uploadProductDatasheet, { isLoading: loadingDatasheet }] =
    useUploadProductDatasheetMutation();
  const [uploadProductManual, { isLoading: loadingManual }] =
    useUploadProductManualMutation();

  const { data: categorys } = useGetCategorysQuery({});

  // --- Translations ---
  const t = {
    en: {
      title: "Create Product",
      subtitle: "Add a new product to your catalog",
      tabs: {
        general: "General Info",
        details: "Descriptions",
        files: "Files & Media",
        extra: "Extra Info",
      },
      lbl: {
        code: "Product Code",
        nameEn: "Name (EN)",
        nameTh: "Name (TH)",
        price: "Price",
        stock: "Stock",
        brandEn: "Brand (EN)",
        brandTh: "Brand (TH)",
        cat: "Category",
        vid: "Video Link",
        img: "Main Image",
        imgs: "Gallery Images",
        sheet: "Datasheet (PDF)",
        manual: "Manual (PDF)",
        descEn: "Description (EN)",
        descTh: "Description (TH)",
        quantity: "Quantity",
        weight: "Weight",
        position: "Storage Position",
        subcat: "Subcategory",
        electroPN: "Electotronix PN",
        mfg: "Manufacturer",
        mfgPN: "Manufacturer PN",
      },
      btn: {
        save: "Create Product",
        saving: "Saving...",
        back: "Back",
        next: "Next Step",
        prev: "Previous",
        upload: "Upload",
      },
      ph: {
        code: "Enter code",
        name: "Enter name",
        url: "Enter URL or upload file",
      },
    },
    thai: {
      title: "สร้างสินค้าใหม่",
      subtitle: "เพิ่มรายการสินค้าใหม่ลงในระบบ",
      tabs: {
        general: "ข้อมูลทั่วไป",
        details: "รายละเอียดสินค้า",
        files: "ไฟล์และสื่อ",
        extra: "ข้อมูลเพิ่มเติม",
      },
      lbl: {
        code: "รหัสสินค้า",
        nameEn: "ชื่อสินค้า (อังกฤษ)",
        nameTh: "ชื่อสินค้า (ไทย)",
        price: "ราคาขาย",
        stock: "จำนวนในสต็อก",
        brandEn: "แบรนด์ (อังกฤษ)",
        brandTh: "แบรนด์ (ไทย)",
        cat: "หมวดหมู่",
        vid: "ลิงก์วิดีโอ",
        img: "รูปภาพหลัก",
        imgs: "รูปภาพเพิ่มเติม",
        sheet: "ดาต้าชีท (PDF)",
        manual: "คู่มือการใช้งาน (PDF)",
        descEn: "รายละเอียด (อังกฤษ)",
        descTh: "รายละเอียด (ไทย)",
        quantity: "ปริมาณ (Quantity)",
        weight: "น้ำหนัก (Weight)",
        position: "ตำแหน่งที่เก็บ (Position)",
        subcat: "หมวดหมู่ย่อย (Subcategory)",
        electroPN: "รหัส Electotronix PN",
        mfg: "ผู้ผลิต (Manufacturer)",
        mfgPN: "รหัสผู้ผลิต (Manufacturer PN)",
      },
      btn: {
        save: "สร้างสินค้า",
        saving: "กำลังบันทึก...",
        back: "กลับหน้ารายการ",
        next: "ถัดไป",
        prev: "ย้อนกลับ",
        upload: "อัปโหลด",
      },
      ph: {
        code: "ระบุรหัสสินค้า",
        name: "ระบุชื่อสินค้า",
        url: "ระบุลิงก์หรืออัปโหลดไฟล์",
      },
    },
  }[language || "en"];

  // --- Quill Modules ---
  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, false] }],
          ["bold", "italic", "underline", "strike", "blockquote"],
          [{ list: "ordered" }, { list: "bullet" }],
          ["link", "image"],
          ["clean"],
        ],
      },
    }),
    [],
  );

  // --- Tab Navigation Handlers ---
  const tabsList = ["general", "details", "files", "extra"];
  const handleNextTab = () => {
    const idx = tabsList.indexOf(activeTab);
    if (idx < tabsList.length - 1) setActiveTab(tabsList[idx + 1]);
  };
  const handlePrevTab = () => {
    const idx = tabsList.indexOf(activeTab);
    if (idx > 0) setActiveTab(tabsList[idx - 1]);
  };

  // --- Upload Handlers ---
  const uploadFileHandler = async (e) => {
    const formData = new FormData();
    formData.append("image", e.target.files[0]);
    try {
      const res = await uploadProductImage(formData).unwrap();
      setImage(res.image);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const uploadMultipleImageHandler = async (e) => {
    const formData = new FormData();
    for (let i = 0; i < e.target.files.length; i++) {
      formData.append("images", e.target.files[i]);
    }
    try {
      const res = await uploadProductMutipleImage(formData).unwrap();
      const paths = (res?.images || []).map((img) =>
        typeof img === "string" ? img : img.path,
      );
      setMutipleImage(paths);
      toast.success("Gallery images uploaded");
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const uploadDatasheetHandler = async (e) => {
    const formData = new FormData();
    formData.append("datasheet", e.target.files[0]);
    try {
      const res = await uploadProductDatasheet(formData).unwrap();
      setDatasheet(res.datasheet);
      toast.success("Datasheet uploaded");
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const uploadManualHandler = async (e) => {
    const formData = new FormData();
    formData.append("manual", e.target.files[0]);
    try {
      const res = await uploadProductManual(formData).unwrap();
      setManual(res.manual);
      toast.success("Manual uploaded");
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  // --- Submit ---
  const submitHandler = async (e) => {
    e.preventDefault();
    if (!name || !image) {
      toast.error("Name and Main Image are required.");
      return;
    }

    try {
      const formattedMultipleImage = Array.isArray(mutipleImage)
        ? mutipleImage.join(",")
        : mutipleImage;

      await createProduct({
        productCode,
        name,
        nameThai,
        price,
        countInStock,
        image,
        mutipleImage: formattedMultipleImage,
        datasheet,
        manual,
        brand,
        brandThai,
        category: selectedCategory,
        categoryThai,
        description,
        descriptionThai,
        videoLink,
        quantity,
        weight,
        position,
        subcategory,
        electotronixPN,
        manufacture,
        manufacturePN,
      }).unwrap();

      toast.success("Product created successfully");
      navigate("/admin/productlist");
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const InputLabel = ({ children, required }) => (
    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
      {children} {required && <span className="text-rose-500">*</span>}
    </label>
  );

  const TextInput = ({
    value,
    onChange,
    placeholder,
    required,
    type = "text",
  }) => (
    <input
      type={type}
      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-slate-200 focus:border-slate-400 transition-all placeholder:text-slate-400"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
    />
  );

  return (
    <div className="min-h-screen bg-slate-50 py-4 md:py-6 md:py-10 px-4 md:px-8 font-['Prompt',sans-serif] text-slate-800 flex justify-center w-full">
      <div className="w-full max-w-[1000px] flex flex-col gap-4 md:gap-6">
        {/* Header */}
        <div>
          <Link
            to="/admin/productlist"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-800 uppercase tracking-widest transition-colors mb-6"
          >
            <FaArrowLeft /> {t.btn.back}
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100 shrink-0 text-indigo-600">
              <FaBox size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
              <p className="text-sm text-slate-500 mt-1">{t.subtitle}</p>
            </div>
          </div>
        </div>

        {(isLoading ||
          loadingUpload ||
          loadingMultiple ||
          loadingDatasheet ||
          loadingManual) && (
          <div className="flex justify-center py-4">
            <Loader />
          </div>
        )}

        <form
          onSubmit={submitHandler}
          className="flex flex-col md:flex-row gap-4 md:gap-6 items-start"
        >
          {/* Navigation Sidebar */}
          <div className="w-full md:w-64 shrink-0 bg-white border border-slate-200 rounded-xl p-2 shadow-sm grid grid-cols-2 md:grid-cols-1 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("general")}
              className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-3 md:py-3.5 rounded-lg text-xs md:text-sm font-semibold transition-all ${activeTab === "general" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}
            >
              <FaInfoCircle size={14} className="shrink-0" /> {t.tabs.general}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("details")}
              className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-3 md:py-3.5 rounded-lg text-xs md:text-sm font-semibold transition-all ${activeTab === "details" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}
            >
              <FaListAlt size={14} className="shrink-0" /> {t.tabs.details}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("files")}
              className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-3 md:py-3.5 rounded-lg text-xs md:text-sm font-semibold transition-all ${activeTab === "files" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}
            >
              <FaImage size={14} className="shrink-0" /> {t.tabs.files}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("extra")}
              className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-3 md:py-3.5 rounded-lg text-xs md:text-sm font-semibold transition-all ${activeTab === "extra" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}
            >
              <FaTags size={14} className="shrink-0" /> {t.tabs.extra}
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 bg-white border border-slate-200 shadow-sm rounded-xl w-full flex flex-col">
            {/* Remove overflow-hidden from this container so Quill dropdowns and buttons aren't cut off */}
            <div className="p-4 md:p-8 flex-1 min-h-[350px]">
              <AnimatePresence mode="wait">
                {/* TAB 1: General Info */}
                {activeTab === "general" && (
                  <motion.div
                    key="general"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex flex-col gap-4 md:gap-6"
                  >
                    <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-4">
                      {t.tabs.general}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      <div>
                        <InputLabel>{t.lbl.code}</InputLabel>
                        <TextInput
                          value={productCode}
                          onChange={(e) => setProductCode(e.target.value)}
                          placeholder={t.ph.code}
                        />
                      </div>
                      <div>
                        <InputLabel>{t.lbl.electroPN}</InputLabel>
                        <TextInput
                          value={electotronixPN}
                          onChange={(e) => setElectotronixPN(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      <div>
                        <InputLabel required>{t.lbl.nameEn}</InputLabel>
                        <TextInput
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder={t.ph.name}
                          required
                        />
                      </div>
                      <div>
                        <InputLabel>{t.lbl.nameTh}</InputLabel>
                        <TextInput
                          value={nameThai}
                          onChange={(e) => setNameThai(e.target.value)}
                          placeholder={t.ph.name}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                      <div>
                        <InputLabel>{t.lbl.price}</InputLabel>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                            ฿
                          </span>
                          <input
                            type="number"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 pl-10 pr-4 text-sm text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-slate-200 focus:border-slate-400 transition-all font-bold"
                            value={price}
                            onChange={(e) => setPrice(Number(e.target.value))}
                          />
                        </div>
                      </div>
                      <div>
                        <InputLabel>{t.lbl.stock}</InputLabel>
                        <input
                          type="number"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-slate-200 focus:border-slate-400 transition-all font-bold"
                          value={countInStock}
                          onChange={(e) =>
                            setCountInStock(Number(e.target.value))
                          }
                        />
                      </div>
                      <div>
                        <InputLabel>{t.lbl.quantity}</InputLabel>
                        <input
                          type="number"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-slate-200 focus:border-slate-400 transition-all font-bold"
                          value={quantity}
                          onChange={(e) => setQuantity(Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      <div>
                        <InputLabel>{t.lbl.weight}</InputLabel>
                        <TextInput
                          type="number"
                          value={weight}
                          onChange={(e) => setWeight(Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <InputLabel>{t.lbl.position}</InputLabel>
                        <TextInput
                          value={position}
                          onChange={(e) => setPosition(e.target.value)}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* TAB 2: Descriptions */}
                {activeTab === "details" && (
                  <motion.div
                    key="details"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex flex-col gap-4 md:gap-6"
                  >
                    <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-4">
                      {t.tabs.details}
                    </h2>

                    <div className="quill-custom relative pb-10">
                      <InputLabel>{t.lbl.descEn}</InputLabel>
                      <ReactQuill
                        theme="snow"
                        value={description}
                        onChange={setDescription}
                        modules={modules}
                        style={{ height: "200px" }}
                      />
                    </div>
                    <div className="quill-custom relative pb-10">
                      <InputLabel>{t.lbl.descTh}</InputLabel>
                      <ReactQuill
                        theme="snow"
                        value={descriptionThai}
                        onChange={setDescriptionThai}
                        modules={modules}
                        style={{ height: "200px" }}
                      />
                    </div>
                  </motion.div>
                )}

                {/* TAB 3: Files & Media */}
                {activeTab === "files" && (
                  <motion.div
                    key="files"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex flex-col gap-4 md:gap-6"
                  >
                    <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-4">
                      {t.tabs.files}
                    </h2>

                    <div>
                      <InputLabel required>{t.lbl.img}</InputLabel>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="text"
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-slate-200 focus:border-slate-400 transition-all"
                          value={image}
                          onChange={(e) => setImage(e.target.value)}
                          placeholder={t.ph.url}
                        />
                        <div className="relative overflow-hidden shrink-0 rounded-lg border border-slate-200 hover:border-slate-300">
                          <button
                            type="button"
                            className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-widest px-4 md:px-6 py-3.5 transition-colors flex items-center justify-center gap-2"
                          >
                            <FaCloudUploadAlt size={16} /> {t.btn.upload}
                          </button>
                          <input
                            type="file"
                            onChange={uploadFileHandler}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <InputLabel>{t.lbl.imgs}</InputLabel>
                      <div className="border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors rounded-xl p-4 md:p-8 text-center relative cursor-pointer group">
                        <input
                          type="file"
                          multiple
                          onChange={uploadMultipleImageHandler}
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        <div className="flex flex-col items-center justify-center pointer-events-none">
                          <FaImage className="text-slate-300 group-hover:text-slate-400 transition-colors mb-3 text-4xl" />
                          <p className="text-sm text-slate-500 font-medium">
                            Click or Drag to upload gallery images
                          </p>
                          {mutipleImage.length > 0 && (
                            <span className="mt-3 px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-md">
                              {mutipleImage.length} files selected
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      <div>
                        <InputLabel>
                          <span className="flex items-center gap-1.5">
                            <FaFilePdf /> {t.lbl.sheet}
                          </span>
                        </InputLabel>
                        <div className="flex relative">
                          <input
                            type="text"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 pr-12 text-sm text-slate-800 outline-none focus:bg-white focus:ring-2 focus:border-slate-400 transition-all"
                            value={datasheet}
                            onChange={(e) => setDatasheet(e.target.value)}
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 overflow-hidden rounded-md border border-transparent hover:border-slate-200">
                            <button
                              type="button"
                              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                            >
                              <FaCloudUploadAlt />
                            </button>
                            <input
                              type="file"
                              onChange={uploadDatasheetHandler}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <InputLabel>
                          <span className="flex items-center gap-1.5">
                            <FaFilePdf /> {t.lbl.manual}
                          </span>
                        </InputLabel>
                        <div className="flex relative">
                          <input
                            type="text"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 pr-12 text-sm text-slate-800 outline-none focus:bg-white focus:ring-2 focus:border-slate-400 transition-all"
                            value={manual}
                            onChange={(e) => setManual(e.target.value)}
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 overflow-hidden rounded-md border border-transparent hover:border-slate-200">
                            <button
                              type="button"
                              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                            >
                              <FaCloudUploadAlt />
                            </button>
                            <input
                              type="file"
                              onChange={uploadManualHandler}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* TAB 4: Extra Info */}
                {activeTab === "extra" && (
                  <motion.div
                    key="extra"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex flex-col gap-4 md:gap-6"
                  >
                    <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-4">
                      {t.tabs.extra}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        <div>
                          <InputLabel>{t.lbl.cat}</InputLabel>
                          <select
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-slate-200 focus:border-slate-400 transition-all cursor-pointer"
                            value={selectedCategory}
                            onChange={(e) => {
                              const val = e.target.value;
                              const obj = categorys?.find(
                                (c) => c.categoryName === val,
                              );
                              setSelectedCategory(val);
                              if (obj) setCategoryThai(obj.categoryNameThai);
                            }}
                          >
                            <option value="" className="text-slate-400">
                              -- Select Category --
                            </option>
                            {categorys?.map((c) => (
                              <option key={c.id} value={c.categoryName}>
                                {c.categoryName} ({c.categoryNameThai})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <InputLabel>{t.lbl.subcat}</InputLabel>
                          <TextInput
                            value={subcategory}
                            onChange={(e) => setSubcategory(e.target.value)}
                          />
                        </div>
                      </div>

                      <div>
                        <InputLabel>{t.lbl.brandEn}</InputLabel>
                        <TextInput
                          value={brand}
                          onChange={(e) => setBrand(e.target.value)}
                        />
                      </div>
                      <div>
                        <InputLabel>{t.lbl.brandTh}</InputLabel>
                        <TextInput
                          value={brandThai}
                          onChange={(e) => setBrandThai(e.target.value)}
                        />
                      </div>

                      <div>
                        <InputLabel>{t.lbl.mfg}</InputLabel>
                        <TextInput
                          value={manufacture}
                          onChange={(e) => setManufacture(e.target.value)}
                        />
                      </div>
                      <div>
                        <InputLabel>{t.lbl.mfgPN}</InputLabel>
                        <TextInput
                          value={manufacturePN}
                          onChange={(e) => setManufacturePN(e.target.value)}
                        />
                      </div>

                      <div className="col-span-full">
                        <InputLabel>
                          <span className="flex items-center gap-1.5">
                            <FaVideo /> {t.lbl.vid}
                          </span>
                        </InputLabel>
                        <textarea
                          rows={3}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-slate-200 focus:border-slate-400 transition-all resize-y"
                          value={videoLink}
                          onChange={(e) => setVideoLink(e.target.value)}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Tab Footer Controls */}
            <div className="bg-slate-50 mt-auto border-t border-slate-100 p-4 shrink-0 flex items-center justify-between rounded-b-xl z-10 w-full relative">
              <button
                type="button"
                onClick={handlePrevTab}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold uppercase tracking-widest transition-all border ${activeTab === "general" ? "opacity-0 pointer-events-none" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100 shadow-sm"}`}
              >
                <FaChevronLeft size={10} /> {t.btn.prev}
              </button>

              {activeTab !== "extra" ? (
                <button
                  type="button"
                  onClick={handleNextTab}
                  className="flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-lg text-sm font-bold uppercase tracking-widest bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-md"
                >
                  {t.btn.next} <FaArrowRight size={10} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 md:px-8 py-2.5 rounded-lg text-sm font-bold uppercase tracking-widest bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-md disabled:bg-indigo-400"
                >
                  <FaSave size={14} /> {isLoading ? t.btn.saving : t.btn.save}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
                .quill-custom .ql-toolbar {
                    border-top-left-radius: 0.5rem;
                    border-top-right-radius: 0.5rem;
                    border-color: #e2e8f0;
                    background-color: #f8fafc;
                }
                .quill-custom .ql-container {
                    border-bottom-left-radius: 0.5rem;
                    border-bottom-right-radius: 0.5rem;
                    border-color: #e2e8f0;
                    font-family: inherit;
                    font-size: 0.875rem;
                }
                .quill-custom .ql-editor:focus {
                    box-shadow: 0 0 0 2px #e2e8f0;
                    border-color: #94a3b8;
                    border-radius: 0.5rem;
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none; /* IE and Edge */
                    scrollbar-width: none; /* Firefox */
                }
            ` }} />
    </div>
  );
};

export default ProductCreateScreen;
