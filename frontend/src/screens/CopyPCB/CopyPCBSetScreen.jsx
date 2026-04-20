import React, { useState } from "react";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  FaTrash,
  FaClone,
  FaMinus,
  FaPlus,
  FaImages,
  FaInfoCircle,
  FaArrowLeft,
  FaFileArchive,
  FaRegFileCode,
} from "react-icons/fa";
import { BsMotherboard, BsCpu } from "react-icons/bs";

import {
  useCreatecopycartMutation,
  useUploadcopypcbZipMutation,
  useUploadMultipleCopyPCBImagesMutation,
} from "../../slices/copypcbCartApiSlice";

const CopyPCBSetScreen = () => {
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);
  const { language } = useSelector((state) => state.language);

  // --- Translations ---
  const translations = {
    en: {
      title: "Copy & Modify PCB",
      subtitle: "Clone your existing PCB or make modifications.",
      back: "Back to Home", // เปลี่ยนข้อความเป็น Back to Home
      projectDetails: "Project Details",
      projectName: "Project Name",
      phProjectName: "e.g., Old Machine Controller V2",
      frontSide: "Front Side",
      backSide: "Back Side",
      required: "Required",
      clickToUpload: "Click to Upload",
      dragPhotosHere: "or drag photos here",
      addFiles: "Additional Files (Zip/Rar)",
      addFilesDesc:
        "If you have schematics or specific files, attach them here.",
      changeFile: "Change File",
      browseFiles: "Browse Files",
      noFileChosen: "No file chosen (Optional)",
      modifications: "Modifications / Notes",
      phModifications:
        "Describe what you want to copy or change (e.g., 'Copy exactly as is' or 'Change connector to USB-C')...",
      orderSummary: "Order Summary",
      quantity: "Quantity",
      min5: "Min 5",
      frontPhotos: "Front Photos",
      backPhotos: "Back Photos",
      zipFile: "Zip File",
      yes: "Yes",
      no: "No",
      submitOrder: "SUBMIT ORDER",
      processing: "Processing...",
      waitApproval: "Wait for admin approval.",
      priceConfirm: "Price will be confirmed later.",
      errProjectName: "Please enter a project name.",
      errFrontImg: "Please upload at least 1 Front PCB image.",
      errBackImg: "Please upload at least 1 Back PCB image.",
      errLogin: "Please login to continue.",
      successMsg: "Order placed successfully!",
      failMsg: "Submission failed",
      uploadingFiles: "Uploading files and creating request",
    },
    thai: {
      title: "ก็อปปี้และปรับแต่ง PCB",
      subtitle: "โคลน PCB เดิมของคุณหรือสั่งปรับเปลี่ยนจุดต่างๆ ได้ตามต้องการ",
      back: "กลับหน้าหลัก", // เปลี่ยนข้อความเป็น กลับหน้าหลัก
      projectDetails: "รายละเอียดโปรเจกต์",
      projectName: "ชื่อโปรเจกต์",
      phProjectName: "เช่น บอร์ดควบคุมเครื่องจักรตัวเก่า V2",
      frontSide: "ภาพด้านหน้าบอร์ด",
      backSide: "ภาพด้านหลังบอร์ด",
      required: "จำเป็น",
      clickToUpload: "คลิกเพื่อเลือกรูป",
      dragPhotosHere: "หรือลากรูปภาพมาวางที่นี่",
      addFiles: "ไฟล์แนบเพิ่มเติม (Zip/Rar)",
      addFilesDesc: "หากมีวงจร โค้ด หรือไฟล์เฉพาะ สามารถแนบได้ที่นี่",
      changeFile: "เปลี่ยนไฟล์",
      browseFiles: "เลือกไฟล์",
      noFileChosen: "ไม่ได้เลือกไฟล์ (ข้ามได้)",
      modifications: "สิ่งที่ต้องการให้แก้ไข / หมายเหตุ",
      phModifications:
        "อธิบายสิ่งที่คุณต้องการ (เช่น 'ก็อปปี้ให้เหมือนเดิม 100%' หรือ 'เปลี่ยนจุดเชื่อมต่อเป็น USB-C')...",
      orderSummary: "สรุปการสั่งทำ",
      quantity: "จำนวน",
      min5: "ขั้นต่ำ 5",
      frontPhotos: "รูปด้านหน้า",
      backPhotos: "รูปด้านหลัง",
      zipFile: "ไฟล์เอกสารแนบ",
      yes: "มี",
      no: "ไม่มี",
      submitOrder: "ส่งคำขอสั่งทำ",
      processing: "กำลังประมวลผล...",
      waitApproval: "รอแอดมินตรวจสอบรายละเอียด",
      priceConfirm: "ราคาประเมินจะถูกแจ้งในภายหลัง",
      errProjectName: "กรุณาระบุชื่อโปรเจกต์",
      errFrontImg: "กรุณาอัปโหลดรูปภาพด้านหน้าอย่างน้อย 1 รูป",
      errBackImg: "กรุณาอัปโหลดรูปภาพด้านหลังอย่างน้อย 1 รูป",
      errLogin: "กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ",
      successMsg: "ส่งคำสั่งทำเรียบร้อยแล้ว!",
      failMsg: "การส่งข้อมูลล้มเหลว",
      uploadingFiles: "กำลังอัปโหลดไฟล์และสร้างคำสั่งทำ",
    },
  };
  const t = translations[language] || translations.en;

  // --- State ---
  const [formData, setFormData] = useState({
    pcbQty: 5,
    projectname: "",
    zipFile: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [frontImages, setFrontImages] = useState([]);
  const [backImages, setBackImages] = useState([]);
  const [notes, setNotes] = useState("");

  // UI State for drag highlights
  const [dragActiveFront, setDragActiveFront] = useState(false);
  const [dragActiveBack, setDragActiveBack] = useState(false);

  // --- API ---
  const [createcopycart] = useCreatecopycartMutation();
  const [uploadcopypcbZip] = useUploadcopypcbZipMutation();
  const [uploadMultipleCopyPCBImages] =
    useUploadMultipleCopyPCBImagesMutation();

  // --- Handlers ---
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const changeQty = (amount) => {
    setFormData((prev) => ({
      ...prev,
      pcbQty: Math.max(5, prev.pcbQty + amount),
    }));
  };

  const handleImageUpload = (files, type) => {
    if (!files) return;
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter((file) =>
      file.type.startsWith("image/"),
    );

    const previews = validFiles.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    if (type === "front") {
      setFrontImages((prev) => [...prev, ...previews]);
    } else {
      setBackImages((prev) => [...prev, ...previews]);
    }
  };

  const onDrag = (e, type, active) => {
    e.preventDefault();
    e.stopPropagation();
    if (type === "front") setDragActiveFront(active);
    if (type === "back") setDragActiveBack(active);
  };

  const onDrop = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    if (type === "front") setDragActiveFront(false);
    if (type === "back") setDragActiveBack(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files, type);
    }
  };

  const removeImage = (index, type) => {
    if (type === "front") {
      URL.revokeObjectURL(frontImages[index].url);
      setFrontImages((prev) => prev.filter((_, i) => i !== index));
    } else {
      URL.revokeObjectURL(backImages[index].url);
      setBackImages((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const uploadFrontImages = async () => {
    if (frontImages.length === 0) return [];
    const form = new FormData();
    frontImages.forEach((img) => form.append("images", img.file));
    const res = await uploadMultipleCopyPCBImages(form).unwrap();
    const result = res.images || res.image || res.urls || [];
    return (Array.isArray(result) ? result : [result]).map((img) =>
      typeof img === "string" ? img : img.path || img.url,
    );
  };

  const uploadBackImages = async () => {
    if (backImages.length === 0) return [];
    const form = new FormData();
    backImages.forEach((img) => form.append("images", img.file));
    const res = await uploadMultipleCopyPCBImages(form).unwrap();
    const result = res.images || res.image || res.urls || [];
    return (Array.isArray(result) ? result : [result]).map((img) =>
      typeof img === "string" ? img : img.path || img.url,
    );
  };

  const uploadcopypcbZipHandler = async () => {
    if (!formData.zipFile) return null;
    const form = new FormData();
    form.append("copypcbZip", formData.zipFile);
    const res = await uploadcopypcbZip(form).unwrap();
    // Handle both string path and object with path property
    const path =
      res.file || res.zipPath || res.url || res.copypcbZip || res.path || res;
    return typeof path === "string"
      ? path
      : path.path || path.url || path.filename;
  };

  const orderNowHandler = async (e) => {
    e.preventDefault();

    if (!formData.projectname.trim()) return toast.error(t.errProjectName);
    if (frontImages.length < 1) return toast.error(t.errFrontImg);
    if (backImages.length < 1) return toast.error(t.errBackImg);

    if (!userInfo) {
      toast.info(t.errLogin);
      return navigate("/login");
    }

    try {
      setIsLoading(true);

      const [uploadedZipPath, uploadedFront, uploadedBack] = await Promise.all([
        uploadcopypcbZipHandler(),
        uploadFrontImages(),
        uploadBackImages(),
      ]);

      await createcopycart({
        user_id: userInfo._id,
        projectname: formData.projectname,
        pcb_qty: formData.pcbQty,
        notes,
        copypcbFrontImages: uploadedFront,
        copypcbBackImages: uploadedBack,
        copypcb_zip: uploadedZipPath,
      }).unwrap();

      toast.success(t.successMsg);
      navigate("/cart/copypcbcart");
    } catch (err) {
      console.error(err);
      toast.error(err?.data?.message || t.failMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-16 font-sans text-slate-900 antialiased selection:bg-black selection:text-white">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-[9999] bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 border-4 border-slate-100 border-t-black rounded-full animate-spin"></div>
          <h5 className="mt-6 text-xl font-black text-black animate-pulse uppercase tracking-tighter">
            {t.processing}
          </h5>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">
            {t.uploadingFiles}
          </p>
        </div>
      )}

      {/* --- Header Section --- */}
      <div className="bg-white border-b border-slate-100 py-4 md:py-8 mb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-black transition-colors mb-8 w-fit uppercase tracking-[0.2em]"
          >
            <FaArrowLeft /> {t.back}
          </button>

          <div className="flex items-center gap-4 md:gap-6">
            <div className="w-16 h-16 rounded-2xl bg-black text-white flex items-center justify-center text-3xl shrink-0">
              <FaClone />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-black tracking-tighter mb-1 uppercase">
                {t.title}
              </h1>
              <p className="text-sm md:text-base text-slate-500 font-medium tracking-wide m-0">
                {t.subtitle}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* --- Main Content --- */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <form onSubmit={orderNowHandler}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 md:gap-10 items-start">
            {/* Left Column: Form Data (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              {/* 1. Project Info */}
              <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <div className="bg-slate-50/50 border-b border-slate-100 px-4 md:px-8 py-5 flex items-center gap-3">
                  <FaInfoCircle className="text-black" />
                  <h3 className="font-black text-black text-xs uppercase tracking-widest m-0">
                    {t.projectDetails}
                  </h3>
                </div>
                <div className="p-4 md:p-8">
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-3">
                    {t.projectName}
                  </label>
                  <input
                    type="text"
                    placeholder={t.phProjectName}
                    value={formData.projectname}
                    onChange={(e) =>
                      handleChange("projectname", e.target.value)
                    }
                    className="w-full bg-slate-50 border border-slate-100 text-black text-sm rounded-2xl px-4 md:px-6 py-4 focus:outline-none focus:ring-1 focus:ring-black focus:border-black focus:bg-white transition-all placeholder:text-slate-300 font-medium"
                  />
                </div>
              </div>

              {/* 2. PCB Images (Front & Back) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Front Side */}
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden flex flex-col shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                  <div className="bg-slate-50 border-b border-slate-100 px-4 md:px-6 py-4 flex items-center justify-between">
                    <span className="font-black text-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                      <BsMotherboard className="text-black text-sm" />{" "}
                      {t.frontSide}
                    </span>
                    <span className="text-[9px] font-black border border-black text-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
                      {t.required}
                    </span>
                  </div>
                  <div className="p-4 md:p-8 flex-grow flex flex-col">
                    <div
                      className={`relative flex-grow flex flex-col items-center justify-center p-4 md:p-8 rounded-2xl border-2 border-dashed transition-all mb-4 ${dragActiveFront ? "border-black bg-slate-50" : "border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200"}`}
                      onDragEnter={(e) => onDrag(e, "front", true)}
                      onDragLeave={(e) => onDrag(e, "front", false)}
                      onDragOver={(e) => onDrag(e, "front", true)}
                      onDrop={(e) => onDrop(e, "front")}
                    >
                      <input
                        type="file"
                        id="front-upload"
                        accept="image/*"
                        multiple
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        onChange={(e) =>
                          handleImageUpload(e.target.files, "front")
                        }
                      />
                      <div className="pointer-events-none flex flex-col items-center text-center">
                        <FaImages className="text-3xl text-slate-200 mb-4" />
                        <span className="font-black text-black text-[10px] uppercase tracking-widest">
                          {t.clickToUpload}
                        </span>
                        <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest mt-1">
                          {t.dragPhotosHere}
                        </span>
                      </div>
                    </div>

                    {/* Previews */}
                    {frontImages.length > 0 && (
                      <div className="flex flex-wrap gap-3 mt-auto pt-4">
                        {frontImages.map((img, idx) => (
                          <div
                            key={idx}
                            className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-100 group"
                          >
                            <img
                              src={img.url}
                              alt="front"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-[1px]"
                              onClick={() => removeImage(idx, "front")}
                            >
                              <FaTrash className="text-xs" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Back Side */}
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden flex flex-col shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                  <div className="bg-slate-50 border-b border-slate-100 px-4 md:px-6 py-4 flex items-center justify-between">
                    <span className="font-black text-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                      <BsCpu className="text-black text-sm" /> {t.backSide}
                    </span>
                    <span className="text-[9px] font-black border border-black text-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
                      {t.required}
                    </span>
                  </div>
                  <div className="p-4 md:p-8 flex-grow flex flex-col">
                    <div
                      className={`relative flex-grow flex flex-col items-center justify-center p-4 md:p-8 rounded-2xl border-2 border-dashed transition-all mb-4 ${dragActiveBack ? "border-black bg-slate-50" : "border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200"}`}
                      onDragEnter={(e) => onDrag(e, "back", true)}
                      onDragLeave={(e) => onDrag(e, "back", false)}
                      onDragOver={(e) => onDrag(e, "back", true)}
                      onDrop={(e) => onDrop(e, "back")}
                    >
                      <input
                        type="file"
                        id="back-upload"
                        accept="image/*"
                        multiple
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        onChange={(e) =>
                          handleImageUpload(e.target.files, "back")
                        }
                      />
                      <div className="pointer-events-none flex flex-col items-center text-center">
                        <FaImages className="text-3xl text-slate-200 mb-4" />
                        <span className="font-black text-black text-[10px] uppercase tracking-widest">
                          {t.clickToUpload}
                        </span>
                        <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest mt-1">
                          {t.dragPhotosHere}
                        </span>
                      </div>
                    </div>

                    {/* Previews */}
                    {backImages.length > 0 && (
                      <div className="flex flex-wrap gap-3 mt-auto pt-4">
                        {backImages.map((img, idx) => (
                          <div
                            key={idx}
                            className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-100 group"
                          >
                            <img
                              src={img.url}
                              alt="back"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-[1px]"
                              onClick={() => removeImage(idx, "back")}
                            >
                              <FaTrash className="text-xs" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Additional Files & Notes */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 md:p-6 space-y-6">
                  {/* Zip Upload */}
                  <div>
                    <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-3">
                      {t.addFiles}
                    </label>
                    <p className="text-xs text-slate-400 font-medium tracking-wide mb-4 italic">
                      {t.addFilesDesc}
                    </p>

                    <div className="relative">
                      <input
                        type="file"
                        id="zip-upload"
                        accept=".zip,.rar"
                        onChange={(e) =>
                          handleChange("zipFile", e.target.files[0])
                        }
                        className="hidden"
                      />
                      <label
                        htmlFor="zip-upload"
                        className={`flex items-center w-full border ${formData.zipFile ? "border-black bg-slate-50" : "border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200"} rounded-2xl p-3 cursor-pointer transition-all`}
                      >
                        <span className="bg-black text-white text-[9px] font-black px-5 py-3 rounded-xl mr-4 shrink-0 shadow-sm uppercase tracking-widest flex items-center gap-2">
                          {formData.zipFile ? (
                            <FaFileArchive />
                          ) : (
                            <FaRegFileCode />
                          )}
                          {formData.zipFile ? t.changeFile : t.browseFiles}
                        </span>
                        <span
                          className={`text-xs truncate font-black uppercase tracking-tight ${formData.zipFile ? "text-black" : "text-slate-300"}`}
                        >
                          {formData.zipFile
                            ? formData.zipFile.name
                            : t.noFileChosen}
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="pt-2">
                    <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-3">
                      {t.modifications}
                    </label>
                    <textarea
                      rows={5}
                      placeholder={t.phModifications}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 text-black text-sm rounded-2xl px-4 md:px-6 py-4 focus:outline-none focus:ring-1 focus:ring-black focus:border-black focus:bg-white transition-all resize-none placeholder:text-slate-300 font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Sticky Sidebar (4 cols) */}
            <div className="lg:col-span-4">
              <div className="sticky top-24 bg-black rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10 ring-1 ring-white/5">
                <div className="bg-white/5 border-b border-white/10 p-4 md:p-8 text-center">
                  <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] m-0">
                    {t.orderSummary}
                  </h3>
                </div>

                <div className="p-4 md:p-8">
                  {/* Quantity Selector */}
                  <div className="mb-8">
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest m-0">
                        {t.quantity}
                      </label>
                      <span className="text-[9px] font-black border border-white/20 text-slate-400 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                        {t.min5}
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-2 shadow-inner">
                      <button
                        type="button"
                        onClick={() => changeQty(-1)}
                        disabled={formData.pcbQty <= 5}
                        className="w-11 h-11 flex items-center justify-center text-slate-400 bg-black/40 rounded-xl shadow-lg border border-white/10 hover:text-white hover:border-white/30 transition-all disabled:opacity-20 active:scale-95"
                      >
                        <FaMinus size={12} />
                      </button>
                      <span className="font-black text-2xl text-white tracking-tighter">
                        {formData.pcbQty}
                      </span>
                      <button
                        type="button"
                        onClick={() => changeQty(1)}
                        className="w-11 h-11 flex items-center justify-center text-slate-400 bg-black/40 rounded-xl shadow-lg border border-white/10 hover:text-white hover:border-white/30 transition-all active:scale-95"
                      >
                        <FaPlus size={12} />
                      </button>
                    </div>
                  </div>

                  {/* File Checklist */}
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                      <span className="text-slate-500">{t.frontPhotos}</span>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[9px] font-black border ${frontImages.length > 0 ? "bg-white text-black border-white" : "bg-transparent text-slate-600 border-white/10"}`}
                      >
                        {frontImages.length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                      <span className="text-slate-500">{t.backPhotos}</span>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[9px] font-black border ${backImages.length > 0 ? "bg-white text-black border-white" : "bg-transparent text-slate-600 border-white/10"}`}
                      >
                        {backImages.length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                      <span className="text-slate-500">{t.zipFile}</span>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[9px] font-black border ${formData.zipFile ? "bg-white text-black border-white" : "bg-transparent text-slate-600 border-white/10"}`}
                      >
                        {formData.zipFile ? t.yes : t.no}
                      </span>
                    </div>
                  </div>

                  {/* Submit Action */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-white hover:bg-slate-200 disabled:opacity-30 text-black font-black text-xs py-5 rounded-2xl transition-all shadow-xl flex justify-center items-center gap-3 uppercase tracking-widest active:scale-[0.98]"
                  >
                    {isLoading ? t.processing : t.submitOrder}
                  </button>

                  <div className="mt-8 text-center space-y-1">
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest leading-relaxed m-0">
                      {t.waitApproval}
                    </p>
                    <p className="text-[9px] text-white/40 font-black uppercase tracking-widest leading-relaxed m-0 italic">
                      {t.priceConfirm}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CopyPCBSetScreen;
