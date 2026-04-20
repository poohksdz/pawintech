import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Form,
  Button,
} from "react-bootstrap";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import Loader from "../../components/Loader";
import Message from "../../components/Message";
import { BASE_URL } from "../../constants";
import {
  useUploadGerberAssemblyZipMutation,
  useUploadAssemblyMultipleImagesMutation,
  useGetAssemblycartDefaultQuery,
} from "../../slices/assemblypcbCartApiSlice";
import { useGetAssemblyPCBByOrderIdQuery } from "../../slices/assemblypcbApiSlice";

import {
  FaRocket, FaBox, FaRulerCombined, FaMicrochip, FaCogs,
  FaCamera, FaPaperclip, FaFileAlt, FaInfoCircle, FaCheckCircle,
  FaArrowLeft, FaTimesCircle, FaCloudUploadAlt, FaHistory
} from "react-icons/fa";
import { PiCircuitryFill, PiTextColumnsFill, PiRowsFill } from "react-icons/pi";

const ReorderPCBAdminCreateAssemblyPCBScreen = () => {
  const navigate = useNavigate();
  const { id: orderID } = useParams();
  const { userInfo } = useSelector((state) => state.auth);
  const { language } = useSelector((state) => state.language);

  const [uploadGerberZip] = useUploadGerberAssemblyZipMutation();
  const [uploadAssemblyMultipleImages] = useUploadAssemblyMultipleImagesMutation();
  const { data: defaultResponse, isLoading: isFetchingDefault } = useGetAssemblycartDefaultQuery();
  const { data: configData, isLoading: isLoadingConfig, isFetching: isFetchingConfig } = useGetAssemblyPCBByOrderIdQuery(orderID);

  const defaultData = defaultResponse?.data;

  // --- States ---
  const [showSMDFields, setShowSMDFields] = useState(false);
  const [showTHTFields, setShowTHTFields] = useState(false);
  const [stencilPrice, setStencilPrice] = useState(2500);
  const [topImages, setTopImages] = useState([]);
  const [bottomImages, setBottomImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    projectname: "",
    pcb_qty: 1,
    width_mm: "",
    high_mm: "",
    count_smd: "",
    total_point_smd: "",
    count_tht: "",
    total_point_tht: "",
    board_types: "Single",
    total_columns: "",
    total_rows: "",
    smd_side: "Top",
    tht_side: "Bottom",
    gerber_zip: null,
    notes: "",
    zipFile: null,
    smd_price: "",
    tht_price: "",
    setup_price: "",
    delievery_price: "",
    user_id: "",
    userName: "",
    userEmail: "",
    confirmed_price: "",
    confirmed_reason: "",
    stencil_price: 2500,
    shippingName: "",
    shippingPhone: "",
    shippingAddress: "",
    shippingCity: "",
    shippingPostalCode: "",
    shippingCountry: "",
    billingName: "",
    billingPhone: "",
    billinggAddress: "",
    billingCity: "",
    billingPostalCode: "",
    billingCountry: "",
    billingTax: ""
  });

  // --- Logic Helpers ---
  const getFullUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    let normalizedPath = path.replace(/\\/g, "/");
    if (!normalizedPath.startsWith("/")) normalizedPath = "/" + normalizedPath;
    const baseUrl = process.env.NODE_ENV === "development" ? "http://localhost:5000" : BASE_URL || "";
    return `${baseUrl}${normalizedPath}`;
  };

  const qty = parseFloat(formData.pcb_qty) || 0;
  const smdPins = showSMDFields ? parseFloat(formData.total_point_smd) || 0 : 0;
  const thtPins = showTHTFields ? parseFloat(formData.total_point_tht) || 0 : 0;
  const smd_price = parseFloat(formData.smd_price) || 0;
  const tht_price = parseFloat(formData.tht_price) || 0;
  const setupPrice = parseFloat(formData.setup_price) || 0;
  const delieveryPrice = parseFloat(formData.delievery_price) || 0;

  const smdCost = smdPins * smd_price;
  const thtCost = thtPins * tht_price;
  const totalCost = qty * (smdCost + thtCost) + stencilPrice + setupPrice + delieveryPrice;

  // --- Effects ---
  useEffect(() => {
    if (defaultData) {
      setFormData((prev) => ({
        ...prev,
        smd_price: defaultData.smd_price,
        tht_price: defaultData.tht_price,
        setup_price: defaultData.setup_price,
        delievery_price: defaultData.delivery_price,
        stencil_price: defaultData.stencil_price,
      }));
    }
  }, [defaultData]);

  useEffect(() => {
    const stencilBase = parseFloat(formData.stencil_price) || 2500;
    if (!showSMDFields) {
      setStencilPrice(stencilBase);
    } else if (formData.smd_side === "Both") {
      setStencilPrice(stencilBase * 2);
    } else {
      setStencilPrice(stencilBase);
    }
  }, [formData.smd_side, showSMDFields, formData.stencil_price]);

  useEffect(() => {
    if (configData?.success && configData.data) {
      const d = configData?.data[0];
      setFormData((prev) => ({
        ...prev,
        ...d,
        zipFile: null,
      }));

      if (parseInt(d.count_smd) > 0 || parseInt(d.total_point_smd) > 0) setShowSMDFields(true);
      if (parseInt(d.count_tht) > 0 || parseInt(d.total_point_tht) > 0) setShowTHTFields(true);

      const topImgs = [];
      for (let i = 1; i <= 10; i++) {
        const key = `image_top_${i}`;
        if (d[key]) topImgs.push({ url: getFullUrl(d[key]), raw: d[key], file: null });
      }
      setTopImages(topImgs);

      const bottomImgs = [];
      for (let i = 1; i <= 10; i++) {
        const key = `image_bottom_${i}`;
        if (d[key]) bottomImgs.push({ url: getFullUrl(d[key]), raw: d[key], file: null });
      }
      setBottomImages(bottomImgs);
    }
  }, [configData]);

  // --- Helpers for Uploads (Restored from original) ---
  const uploadTopImages = async () => {
    const form = new FormData();
    const newFiles = topImages.filter((img) => img.file);
    if (newFiles.length === 0)
      return topImages
        .filter((img) => !img.file)
        .map((img) => img.raw || img.url);
    newFiles.forEach((img) => form.append("images", img.file));
    const res = await uploadAssemblyMultipleImages(form).unwrap();
    const oldPaths = topImages
      .filter((img) => !img.file)
      .map((img) => img.raw || img.url);
    const newPaths = (res?.images || []).map((img) =>
      typeof img === "string" ? img : img.path,
    );
    return [...oldPaths, ...newPaths];
  };

  const uploadBottomImages = async () => {
    const form = new FormData();
    const newFiles = bottomImages.filter((img) => img.file);
    if (newFiles.length === 0)
      return bottomImages
        .filter((img) => !img.file)
        .map((img) => img.raw || img.url);
    newFiles.forEach((img) => form.append("images", img.file));
    const res = await uploadAssemblyMultipleImages(form).unwrap();
    const oldPaths = bottomImages
      .filter((img) => !img.file)
      .map((img) => img.raw || img.url);
    const newPaths = (res?.images || []).map((img) =>
      typeof img === "string" ? img : img.path,
    );
    return [...oldPaths, ...newPaths];
  };

  const uploadgerberZipHandler = async () => {
    if (!formData.zipFile) return formData.gerber_zip;
    const form = new FormData();
    form.append("gerberZip", formData.zipFile);
    const res = await uploadGerberZip(form).unwrap();
    return res.path;
  };

  // --- Handlers ---
  const handleImageUpload = (e, side) => {
    const files = Array.from(e.target.files);
    const images = files.map((file) => ({ file, url: URL.createObjectURL(file) }));
    if (side === "top") setTopImages((prev) => [...prev, ...images]);
    else if (side === "bottom") setBottomImages((prev) => [...prev, ...images]);
  };

  const removeImage = (idx, side) => {
    if (side === "top") setTopImages((prev) => prev.filter((_, i) => i !== idx));
    else if (side === "bottom") setBottomImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleChange = (e) => {
    const { name, files, type, value } = e.target;
    if (type === "file") {
      setFormData((prev) => ({ ...prev, zipFile: files[0] || null }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!userInfo) { navigate("/login"); return; }
      if (!formData.projectname.trim()) { toast.error("Please enter a project name."); return; }

      if (!formData.width_mm || parseFloat(formData.width_mm) <= 0) {
        toast.error("Please enter a valid PCB width.");
        return;
      }

      if (!formData.high_mm || parseFloat(formData.high_mm) <= 0) {
        toast.error("Please enter a valid PCB height.");
        return;
      }

      if (!showSMDFields && !showTHTFields) {
        toast.error("Please select either SMD or THT option.");
        return;
      }

      if (topImages.length < 1) {
        toast.error("Please upload at least 1 top PCB images.");
        return;
      }

      if (bottomImages.length < 1) {
        toast.error("Please upload at least 1 bottom PCB images.");
        return;
      }

      if (showSMDFields) {
        const smdPinsNum = parseFloat(formData.total_point_smd);
        if (!formData.smd_side) {
          toast.error("Please select SMD side.");
          return;
        }
        if (isNaN(smdPinsNum) || smdPinsNum <= 0) {
          toast.error("SMD pin count must be greater than zero.");
          return;
        }
      }

      if (showTHTFields) {
        const thtPinsNum = parseFloat(formData.total_point_tht);
        if (!formData.tht_side) {
          toast.error("Please select THT side.");
          return;
        }

        if (isNaN(thtPinsNum) || thtPinsNum <= 0) {
          toast.error("THT pin count must be greater than zero.");
          return;
        }
      }

      const confirmPriceNumber = parseFloat(formData.confirmed_price);
      if (isNaN(confirmPriceNumber) || confirmPriceNumber <= 0) {
        toast.error("Confirm price must be greater than zero.");
        return;
      }

      // Execute uploads
      const uploadedZipPath = await uploadgerberZipHandler();
      const uploadedTop = await uploadTopImages();
      const uploadedBottom = await uploadBottomImages();

      // Note: Full API update call was commented out in original file.
      // We keep it as intended by the user but restored the data preparation logic.

      console.log("Submit Payload Prepared:", {
        ...formData,
        gerber_zip: uploadedZipPath,
        image_tops: uploadedTop,
        image_bottoms: uploadedBottom,
        estimatedCost: totalCost
      });

      toast.success("Design Applied Successfully!");
      navigate("/admin/orderassemblypcbeditlist");
    } catch (err) {
      console.error(err);
      toast.error("Error submitting order");
    } finally {
      setLoading(false);
    }
  };

  const translations = {
    en: {
      Title: "Reconfiguration Hub",
      Subtitle: "Assembly Project Overhaul",
      BasicInfo: "Core Project Details",
      PCBDetails: "Board Parameters",
      SMDSetup: "Surface Mount Device (SMD)",
      THTSetup: "Through Hole Technology (THT)",
      VisualAssests: "Visual Assets & Schematics",
      Summary: "Control Summary",
      Pricing: "Pricing Control",
      Submit: "Confirm Reorder Configuration",
      // ... more inherited ...
    },
    thai: {
      Title: "ศูย์จัดการข้อมูลใหม่",
      Subtitle: "ตั้งค่ารายการประกอบ PCB ใหม่",
      BasicInfo: "ข้อมูลโปรเจกต์พื้นฐาน",
      PCBDetails: "พารามิเตอร์แผงวงจร",
      SMDSetup: "ตั้งค่าอุปกรณ์ SMD",
      THTSetup: "ตั้งค่าอุปกรณ์ THT",
      VisualAssests: "ภาพถ่ายและไฟล์ Gerbers",
      Summary: "สรุปรายละเอียด",
      Pricing: "ควบคุมราคา (Admin Only)",
      Submit: "ยืนยันการตั้งค่าซ้ำ",
    }
  };

  const t = translations[language] || translations.en;

  if (isLoadingConfig || isFetchingConfig) return <div className="flex h-screen items-center justify-center dark:bg-black"><Loader /></div>;

  return (
    <div className="min-h-screen bg-[#f8f9fb] dark:bg-black p-4 font-sans transition-colors duration-500 md:p-10 lg:p-12">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800;900&family=Prompt:wght@400;500;600;700;800;900&display=swap');
        .font-display { font-family: 'Outfit', 'Prompt', sans-serif; }
        .font-sans { font-family: 'Inter', 'Prompt', sans-serif; }
        .glass-card {
           background: white;
           border: 1px solid rgba(0,0,0,0.08);
           border-radius: 2.5rem;
           padding: 2.5rem;
           box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.05);
           transition: all 0.3s ease;
        }
        .dark .glass-card {
          background: rgba(15, 15, 17, 0.8);
          border: 1px solid rgba(63, 63, 70, 0.5);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        .form-label-premium {
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #64748b;
          margin-bottom: 0.75rem;
        }
        .form-input-premium {
          height: 3.5rem;
          border-radius: 1.25rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 0 1.25rem;
          font-weight: 600;
          transition: all 0.2s;
        }
        .dark .form-input-premium {
          background: #09090b;
          border: 1px solid #27272a;
          color: white;
        }
        .form-input-premium:focus {
          border-color: #10b981;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
          background: white;
          outline: none;
        }
        .dark .form-input-premium:focus {
           background: #18181b;
           border-color: #10b981;
        }
        .sticky-summary {
          position: sticky;
          top: 2rem;
        }
      ` }} />

      <div className="mx-auto max-w-7xl">
        {/* --- HEADER --- */}
        <header className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-6">
            <button
              onClick={() => navigate(-1)}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white dark:bg-zinc-900 shadow-sm ring-1 ring-slate-100 dark:ring-zinc-800 text-slate-400 hover:text-slate-950 dark:hover:text-white transition-all"
            >
              <FaArrowLeft />
            </button>
            <div>
              <h1 className="font-display text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                {t.Title}
              </h1>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-500">
                {t.Subtitle} • {orderID}
              </p>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="flex items-center gap-3 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-3 pr-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                <FaHistory size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Restoration Mode</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white leading-none">Admin Override active</span>
              </div>
            </div>
          </div>
        </header>

        <Form onSubmit={handleSubmit}>
          <Row className="g-8">
            <Col xl={7} className="space-y-8">

              {/* SECTION: BASIC INFO */}
              <section className="glass-card">
                <div className="mb-10 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-emerald-400">
                    <FaRocket size={20} />
                  </div>
                  <h2 className="font-display text-xl font-black text-slate-950 dark:text-white">{t.BasicInfo}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                  <div className="flex flex-col">
                    <label className="form-label-premium">Project Identifier</label>
                    <input
                      name="projectname"
                      value={formData.projectname}
                      onChange={handleChange}
                      className="form-input-premium"
                      placeholder="Project Alpha..."
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="form-label-premium">Quantity (Units)</label>
                    <div className="relative">
                      <input
                        name="pcb_qty"
                        type="number"
                        value={formData.pcb_qty}
                        onChange={handleChange}
                        className="form-input-premium w-full pr-12"
                        min="1"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-300">PCS</span>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="form-label-premium">Board Layout Type</label>
                    <div className="flex gap-4">
                      {["Single", "Panelized"].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFormData({ ...formData, board_types: type })}
                          className={`flex-1 h-14 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all ${formData.board_types === type ? 'bg-slate-950 text-white shadow-xl dark:bg-emerald-600' : 'bg-slate-50 text-slate-400 dark:bg-zinc-900/50 hover:bg-slate-100'}`}
                        >
                          {type === "Single" ? <FaBox size={14} /> : <PiCircuitryFill size={18} />}
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {formData.board_types === "Panelized" && (
                    <>
                      <div className="flex flex-col">
                        <label className="form-label-premium">Columns</label>
                        <div className="relative group">
                          <PiTextColumnsFill size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                          <input name="total_columns" value={formData.total_columns} onChange={handleChange} className="form-input-premium pl-12 w-full" placeholder="1" />
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <label className="form-label-premium">Rows</label>
                        <div className="relative group">
                          <PiRowsFill size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                          <input name="total_rows" value={formData.total_rows} onChange={handleChange} className="form-input-premium pl-12 w-full" placeholder="1" />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </section>

              {/* SECTION: PCB DETAILS */}
              <section className="glass-card">
                <div className="mb-10 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-emerald-400">
                    <FaRulerCombined size={20} />
                  </div>
                  <h2 className="font-display text-xl font-black text-slate-950 dark:text-white">{t.PCBDetails}</h2>
                </div>
                <div className="grid grid-cols-2 gap-4 md:gap-8 text-slate-400">
                  <div className="flex flex-col">
                    <label className="form-label-premium">Width (mm)</label>
                    <input name="width_mm" value={formData.width_mm} onChange={handleChange} className="form-input-premium" placeholder="100.00" />
                  </div>
                  <div className="flex flex-col">
                    <label className="form-label-premium">Height (mm)</label>
                    <input name="high_mm" value={formData.high_mm} onChange={handleChange} className="form-input-premium" placeholder="100.00" />
                  </div>
                </div>
              </section>

              {/* SECTION: SMD SETUP */}
              <section className={`glass-card relative overflow-hidden transition-all ${!showSMDFields ? 'opacity-60 grayscale' : 'ring-2 ring-emerald-500/20 bg-white/50 dark:bg-emerald-500/[0.02]'}`}>
                <div className="absolute right-8 top-8">
                  <Form.Check
                    type="switch"
                    id="smd-toggle"
                    checked={showSMDFields}
                    onChange={() => setShowSMDFields(!showSMDFields)}
                    className="scale-150"
                  />
                </div>
                <div className="mb-10 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-emerald-400">
                    <FaMicrochip size={20} />
                  </div>
                  <h2 className="font-display text-xl font-black text-slate-950 dark:text-white">{t.SMDSetup}</h2>
                </div>
                {showSMDFields && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                    <div className="flex flex-col">
                      <label className="form-label-premium">SMD Side</label>
                      <div className="flex gap-2 p-1 bg-slate-50 dark:bg-zinc-900 rounded-2xl">
                        {["Top", "Bottom", "Both"].map(side => (
                          <button
                            key={side} type="button"
                            onClick={() => setFormData({ ...formData, smd_side: side })}
                            className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${formData.smd_side === side ? 'bg-white dark:bg-zinc-800 shadow-md text-emerald-500' : 'text-slate-400 hover:text-slate-600'}`}
                          >
                            {side}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <label className="form-label-premium">Component Count</label>
                      <input name="count_smd" value={formData.count_smd} onChange={handleChange} className="form-input-premium" placeholder="0" />
                    </div>
                    <div className="flex flex-col">
                      <label className="form-label-premium">Total Pins</label>
                      <input name="total_point_smd" value={formData.total_point_smd} onChange={handleChange} className="form-input-premium" placeholder="0" />
                    </div>
                    <div className="flex flex-col">
                      <label className="form-label-premium">Stencil (Automatic)</label>
                      <div className="form-input-premium flex items-center justify-between opacity-70">
                        <span className="text-slate-500">Stencil Cost</span>
                        <span className="font-mono text-emerald-500">{stencilPrice.toLocaleString()} ฿</span>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* SECTION: THT SETUP */}
              <section className={`glass-card relative overflow-hidden transition-all ${!showTHTFields ? 'opacity-60 grayscale' : 'ring-2 ring-emerald-500/20 bg-white/50 dark:bg-emerald-500/[0.02]'}`}>
                <div className="absolute right-8 top-8">
                  <Form.Check
                    type="switch"
                    id="tht-toggle"
                    checked={showTHTFields}
                    onChange={() => setShowTHTFields(!showTHTFields)}
                    className="scale-150"
                  />
                </div>
                <div className="mb-10 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-emerald-400">
                    <FaCogs size={20} />
                  </div>
                  <h2 className="font-display text-xl font-black text-slate-950 dark:text-white">{t.THTSetup}</h2>
                </div>
                {showTHTFields && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                    <div className="flex flex-col">
                      <label className="form-label-premium">THT Side</label>
                      <div className="flex gap-2 p-1 bg-slate-50 dark:bg-zinc-900 rounded-2xl">
                        {["Top", "Bottom", "Both"].map(side => (
                          <button
                            key={side} type="button"
                            onClick={() => setFormData({ ...formData, tht_side: side })}
                            className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${formData.tht_side === side ? 'bg-white dark:bg-zinc-800 shadow-md text-emerald-500' : 'text-slate-400 hover:text-slate-600'}`}
                          >
                            {side}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <label className="form-label-premium">Component Count</label>
                      <input name="count_tht" value={formData.count_tht} onChange={handleChange} className="form-input-premium" placeholder="0" />
                    </div>
                    <div className="flex flex-col md:col-span-2">
                      <label className="form-label-premium">Total Through-Hole Pins</label>
                      <input name="total_point_tht" value={formData.total_point_tht} onChange={handleChange} className="form-input-premium" placeholder="0" />
                    </div>
                  </div>
                )}
              </section>

              {/* SECTION: VISUAL ASSETS */}
              <section className="glass-card">
                <div className="mb-10 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-emerald-400">
                    <FaCamera size={20} />
                  </div>
                  <h2 className="font-display text-xl font-black text-slate-950 dark:text-white">{t.VisualAssests}</h2>
                </div>

                <div className="space-y-12">
                  <ImageUploadGroup
                    title="Top Component Placement"
                    onUpload={(e) => handleImageUpload(e, 'top')}
                    images={topImages}
                    onRemove={(i) => removeImage(i, 'top')}
                  />
                  <ImageUploadGroup
                    title="Bottom Component Placement"
                    onUpload={(e) => handleImageUpload(e, 'bottom')}
                    images={bottomImages}
                    onRemove={(i) => removeImage(i, 'bottom')}
                  />

                  <div className="flex flex-col p-4 md:p-8 rounded-[2rem] bg-slate-50 dark:bg-zinc-950/40 border border-dashed border-slate-200 dark:border-zinc-800">
                    <div className="flex items-center gap-4 mb-6">
                      <FaPaperclip className="text-emerald-500 rotate-45" />
                      <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">Gerber Archive</h4>
                    </div>
                    <input type="file" onChange={handleChange} className="mb-4 text-xs font-bold text-slate-400" accept=".zip,.rar" />
                    {formData.gerber_zip && (
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-zinc-900 shadow-sm border border-slate-100 dark:border-zinc-800">
                        <FaFileAlt className="text-blue-500" />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate max-w-xs">{typeof formData.gerber_zip === 'string' ? formData.gerber_zip : formData.gerber_zip.name}</span>
                        <FaCheckCircle className="text-emerald-500 ml-auto" />
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* SECTION: NOTES */}
              <section className="glass-card">
                <div className="mb-6 flex items-center gap-4">
                  <FaInfoCircle className="text-emerald-500" />
                  <h2 className="font-display text-xl font-black text-slate-950 dark:text-white">Admin Notes</h2>
                </div>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  className="form-input-premium w-full !h-auto py-4 resize-none"
                  placeholder="Internal project notes..."
                />
              </section>

            </Col>

            <Col xl={5}>
              <div className="sticky-summary space-y-8">
                {/* PRICING PANEL */}
                <div className="glass-card shadow-2xl !bg-slate-950 dark:!bg-zinc-900 border-none">
                  <h2 className="font-display text-2xl font-black text-white mb-8">Financial Control</h2>

                  <div className="space-y-4 mb-10">
                    <PriceLine label="Stencil Total" value={stencilPrice} />
                    <PriceLine label="Machine Setup Fee" value={setupPrice} />
                    <PriceLine label={`SMD Assembly (Total ${qty} pcs)`} value={qty * smdCost} />
                    <PriceLine label={`THT Assembly (Total ${qty} pcs)`} value={qty * thtCost} />
                    <PriceLine label="Delivery Fee" value={delieveryPrice} />
                    <div className="pt-4 mt-4 border-t border-white/10 flex justify-between items-center">
                      <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Calculated Total</span>
                      <span className="text-emerald-400 font-display text-3xl font-black">{totalCost.toLocaleString()} ฿</span>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-[2rem] p-4 md:p-8 border border-white/10 space-y-8">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block">Final Negotiated Price</label>
                      <div className="relative">
                        <input
                          name="confirmed_price"
                          type="number"
                          value={formData.confirmed_price}
                          onChange={handleChange}
                          className="w-full h-20 rounded-2xl bg-white text-slate-950 text-3xl font-display font-black px-4 md:px-10 focus:ring-4 focus:ring-emerald-500/50 outline-none transition-all"
                          placeholder="0"
                        />
                        <span className="absolute right-8 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300">฿</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block">Price Justification</label>
                      <textarea
                        name="confirmed_reason"
                        value={formData.confirmed_reason}
                        onChange={handleChange}
                        className="w-full rounded-2xl bg-white/5 border border-white/10 p-4 md:p-6 text-white text-sm font-semibold placeholder:text-zinc-600 outline-none focus:border-emerald-500/50 transition-all"
                        rows={4}
                        placeholder="Provide reason for price override..."
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || isFetchingConfig || isFetchingDefault}
                    className="w-full h-20 mt-8 rounded-3xl bg-emerald-500 text-white font-display text-lg font-black uppercase tracking-widest shadow-xl shadow-emerald-500/30 hover:bg-emerald-400 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : t.Submit}
                  </button>
                </div>

                {/* PROJECT INFO CARD */}
                <div className="glass-card">
                  <h3 className="font-display text-sm font-black uppercase tracking-widest text-slate-400 mb-6 underline decoration-emerald-500 decoration-2 underline-offset-8">Entity Details</h3>
                  <div className="space-y-6 text-sm">
                    <div className="flex justify-between border-b border-slate-50 dark:border-zinc-800 pb-4">
                      <span className="text-slate-500 font-bold">Owner Name</span>
                      <span className="text-slate-950 dark:text-white font-black">{formData.userName || "Guest"}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 dark:border-zinc-800 pb-4">
                      <span className="text-slate-500 font-bold">System ID</span>
                      <span className="font-mono text-xs font-bold bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded-md text-slate-500">{orderID}</span>
                    </div>
                  </div>
                </div>

              </div>
            </Col>
          </Row>
        </Form>
      </div>
    </div>
  );
};

// --- Sub-components (Internal) ---

const PriceLine = ({ label, value }) => (
  <div className="flex justify-between items-center text-sm">
    <span className="text-zinc-500 font-semibold">{label}</span>
    <span className="text-white font-mono font-bold">{value.toLocaleString()} ฿</span>
  </div>
);

const ImageUploadGroup = ({ title, onUpload, images, onRemove }) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</h4>
      <label className="flex items-center gap-2 cursor-pointer text-emerald-500 hover:text-emerald-400 transition-colors">
        <FaCloudUploadAlt size={20} />
        <span className="text-xs font-black uppercase tracking-tight">Upload</span>
        <input type="file" multiple accept="image/*" onChange={onUpload} className="hidden" />
      </label>
    </div>
    <div className="flex flex-wrap gap-4">
      {images.length > 0 ? images.map((img, idx) => (
        <div key={idx} className="group relative h-28 w-28 overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-slate-100 dark:ring-zinc-800">
          <img src={img.url} alt="upload" className="h-full w-full object-cover transition-transform group-hover:scale-110" />
          <button
            type="button"
            onClick={() => onRemove(idx)}
            className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <FaTimesCircle className="text-white" size={24} />
          </button>
        </div>
      )) : (
        <div className="h-28 w-full rounded-2xl border-2 border-dashed border-slate-100 dark:border-zinc-800 flex items-center justify-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">No Images Selected</span>
        </div>
      )}
    </div>
  </div>
);

export default ReorderPCBAdminCreateAssemblyPCBScreen;
