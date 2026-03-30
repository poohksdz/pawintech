import React, { useState } from "react";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  FaCloudUploadAlt,
  FaTrash,
  FaInfoCircle,
  FaMicrochip,
  FaPaperPlane,
  FaMinus,
  FaPlus,
  FaFileImage,
  FaArrowLeft,
} from "react-icons/fa";
import { BsShieldCheck, BsClockHistory } from "react-icons/bs";

import {
  useCreateCustomcartMutation,
  useUploadCustomCartDiagramZipMutation,
  useUploadCustomCartMultipleImagesMutation,
} from "../../slices/custompcbCartApiSlice";

const CustomPCBSetScreen = () => {
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);
  const { language } = useSelector((state) => state.language);

  // --- State Management ---
  const [projectname, setProjectName] = useState("");
  const [pcbQty, setPcbQty] = useState(5); // ค่า Default คือ 5
  const [notes, setNotes] = useState("");
  const [zipFile, setZipFile] = useState(null);
  const [diagramImages, setDiagramImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- API Mutations ---
  const [createCustomcart] = useCreateCustomcartMutation();
  const [uploadDiagramZip] = useUploadCustomCartDiagramZipMutation();
  const [uploadMultipleImages] = useUploadCustomCartMultipleImagesMutation();

  // --- Translations ---
  const translations = {
    en: {
      title: "Custom PCB Order",
      subtitle: "Turn your idea into a real electronic board.",
      projectName: "Project Name",
      phProjectName: "e.g. Smart Home Controller V1",
      diagramImg: "Diagram / Sketches / Examples",
      diagramZip: "Technical Files (Gerber/Code)",
      notes: "Requirements & Descriptions",
      phNotes:
        "Describe functionality, board size constraints, or specific components needed...",
      qty: "Quantity (pcs)",
      submit: "Send Request",
      submitting: "Processing...",
      dragDrop: "Drag & Drop files or click to browse",
      supportedImg: "JPG, PNG, JPEG",
      supportedZip: "ZIP, RAR",
      minQty: "Min 5 pcs",
      secure: "Secure & Confidential",
      fastReview: "Response within 24h",
      errProjectName: "Please enter a project name.",
      errImage: "Please upload at least 1 diagram image.",
      errLogin: "Please login to continue.",
      success: "Request submitted successfully!",
      fail: "Failed to submit order.",
      summary: "Order Summary",
      totalFiles: "Files Attached",
      estPrice: "Estimated Price",
      back: "Back to Home",
    },
    thai: {
      title: "สั่งทำไอเดียอิเล็กทรอนิกส์ (Custom PCB)",
      subtitle:
        "เปลี่ยนไอเดียของคุณให้เป็นบอร์ดจริง พร้อมคำแนะนำจากผู้เชี่ยวชาญ",
      projectName: "ชื่อโปรเจกต์",
      phProjectName: "เช่น กล่องควบคุมไฟ V1",
      diagramImg: "รูปภาพไดอะแกรม / สเก็ตช์",
      diagramZip: "ไฟล์เทคนิค (Gerber/Code) - ถ้ามี",
      notes: "รายละเอียดความต้องการ",
      phNotes: "อธิบายการทำงาน, ขนาดบอร์ด, หรืออะไหล่ที่จำเป็น...",
      qty: "จำนวนที่สั่งผลิต (ชิ้น)",
      submit: "ส่งคำขอใบเสนอราคา",
      submitting: "กำลังประมวลผล...",
      dragDrop: "ลากไฟล์มาวาง หรือคลิกเพื่อเลือกไฟล์",
      supportedImg: "JPG, PNG, JPEG",
      supportedZip: "ZIP, RAR",
      minQty: "ขั้นต่ำ 5 ชิ้น",
      secure: "ข้อมูลปลอดภัยและเป็นความลับ",
      fastReview: "ตอบกลับภายใน 24 ชม.",
      errProjectName: "กรุณาระบุชื่อโปรเจกต์",
      errImage: "กรุณาอัปโหลดรูปภาพอย่างน้อย 1 รูป",
      errLogin: "กรุณาเข้าสู่ระบบก่อนดำเนินการ",
      success: "ส่งคำขอเรียบร้อยแล้ว!",
      fail: "การส่งข้อมูลล้มเหลว",
      summary: "สรุปรายการ",
      totalFiles: "ไฟล์แนบทั้งหมด",
      estPrice: "ราคาประมาณการเบื้องต้น",
      back: "กลับหน้าหลัก",
    },
  };
  const t = translations[language] || translations.en;

  // --- Logic & Handlers ---
  const handleImageUpload = (event) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    processFiles(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const processFiles = (files) => {
    const validImages = files.filter((file) => file.type.startsWith("image/"));
    const previews = validImages.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setDiagramImages((prev) => [...prev, ...previews]);
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(diagramImages[index].url);
    setDiagramImages((prev) => prev.filter((_, i) => i !== index));
  };

  const changeQty = (amount) => {
    setPcbQty((prev) => {
      const newVal = prev + amount;
      return newVal < 5 ? 5 : newVal;
    });
  };

  const uploadImagesHandler = async () => {
    if (diagramImages.length === 0) return [];
    const form = new FormData();
    diagramImages.forEach((img) => form.append("images", img.file));
    const res = await uploadMultipleImages(form).unwrap();
    return res.images.map((img) => img.path);
  };

  const uploadZipHandler = async () => {
    if (!zipFile) return null;
    const form = new FormData();
    form.append("diagramZip", zipFile);
    const res = await uploadDiagramZip(form).unwrap();
    return res.path;
  };

  const orderNowHandler = async (e) => {
    e.preventDefault();
    if (!userInfo) {
      toast.error(t.errLogin);
      return navigate("/login");
    }
    if (!projectname.trim()) return toast.error(t.errProjectName);
    if (diagramImages.length === 0) return toast.error(t.errImage);

    try {
      setIsSubmitting(true);
      const [uploadedImagePaths, uploadedZipPath] = await Promise.all([
        uploadImagesHandler(),
        uploadZipHandler(),
      ]);

      //  แก้ไขการส่งข้อมูล: ใส่ qty เผื่อไว้หลายๆ ชื่อ ป้องกัน Backend หาไม่เจอ
      await createCustomcart({
        user_id: userInfo._id,
        projectname,
        pcb_qty: pcbQty,
        qty: pcbQty,
        notes,
        diagramImages: uploadedImagePaths,
        dirgram_zip: uploadedZipPath,
      }).unwrap();

      toast.success(t.success);
      navigate("/cart/custompcbcart");
    } catch (err) {
      console.error(err);
      toast.error(err?.data?.message || t.fail);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-16 font-sans text-slate-900 antialiased selection:bg-slate-900 selection:text-white">
      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 z-[9999] bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-slate-100 border-t-black rounded-full animate-spin"></div>
          <h5 className="mt-4 text-lg font-bold text-black animate-pulse">
            {t.submitting}
          </h5>
        </div>
      )}

      {/* --- Header Section --- */}
      <div className="bg-white border-b border-slate-100 py-8 mb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-black uppercase tracking-widest transition-colors mb-6 w-fit"
          >
            <FaArrowLeft /> {t.back}
          </button>

          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-black text-white flex items-center justify-center text-3xl shrink-0">
              <FaMicrochip />
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

      {/* --- Main Content --- */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <form onSubmit={orderNowHandler}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Left Column: Inputs (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              {/* 1. Project Info Card */}
              <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <div className="bg-slate-50/50 border-b border-slate-100 px-8 py-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FaInfoCircle className="text-black" />
                    <h3 className="font-black text-black text-xs uppercase tracking-widest m-0">
                      Project Information
                    </h3>
                  </div>
                </div>
                <div className="p-8">
                  <div className="mb-6">
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      {t.projectName} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder={t.phProjectName}
                      value={projectname}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 text-slate-900 text-sm rounded-2xl px-5 py-4 focus:outline-none focus:ring-1 focus:ring-black focus:border-black focus:bg-white transition-all placeholder:text-slate-300 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      {t.qty}
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center bg-slate-50 border border-slate-100 rounded-2xl p-1.5">
                        <button
                          type="button"
                          onClick={() => changeQty(-1)}
                          disabled={pcbQty <= 5}
                          className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-black hover:bg-white hover:shadow-sm rounded-xl transition-all disabled:opacity-20"
                        >
                          <FaMinus className="text-xs" />
                        </button>
                        <div className="w-20 text-center font-black text-xl text-black">
                          {pcbQty}
                        </div>
                        <button
                          type="button"
                          onClick={() => changeQty(1)}
                          className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-black hover:bg-white hover:shadow-sm rounded-xl transition-all"
                        >
                          <FaPlus className="text-xs" />
                        </button>
                      </div>
                      <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                        ({t.minQty})
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Attachments Card */}
              <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <div className="bg-slate-50/50 border-b border-slate-100 px-8 py-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FaCloudUploadAlt className="text-black" />
                    <h3 className="font-black text-black text-xs uppercase tracking-widest m-0">
                      Attachments
                    </h3>
                  </div>
                </div>
                <div className="p-8">
                  {/* Image Dropzone */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-bold text-slate-700 m-0">
                        {t.diagramImg} <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-xs text-slate-400">
                        {t.supportedImg}
                      </span>
                    </div>

                    <div
                      className={`relative w-full rounded-2xl border-2 border-dashed p-12 text-center transition-all ${isDragging ? "border-black bg-slate-50" : "border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200"}`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <input
                        type="file"
                        id="image-upload"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="pointer-events-none flex flex-col items-center">
                        <FaFileImage className="text-4xl text-slate-200 mb-4" />
                        <h6 className="font-black text-black text-sm uppercase tracking-widest mb-2">
                          {t.dragDrop}
                        </h6>
                        <p className="text-xs text-slate-400 font-medium">
                          {t.supportedImg}
                        </p>
                      </div>
                    </div>

                    {/* Image Previews */}
                    {diagramImages.length > 0 && (
                      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4 mt-6">
                        {diagramImages.map((img, idx) => (
                          <div
                            key={idx}
                            className="relative aspect-square rounded-2xl overflow-hidden border border-slate-100 group"
                          >
                            <img
                              src={img.url}
                              alt={`preview-${idx}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-all z-20 flex items-center justify-center backdrop-blur-[2px]"
                              onClick={(e) => {
                                e.preventDefault();
                                removeImage(idx);
                              }}
                            >
                              <FaTrash className="text-sm" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Zip Upload */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-bold text-slate-700 m-0">
                        {t.diagramZip}
                      </label>
                      <span className="text-xs text-slate-400">
                        {t.supportedZip}
                      </span>
                    </div>

                    <div className="relative">
                      <input
                        type="file"
                        id="zip-upload"
                        accept=".zip,.rar"
                        onChange={(e) => setZipFile(e.target.files[0])}
                        className="hidden"
                      />
                      <label
                        htmlFor="zip-upload"
                        className={`flex items-center w-full border ${zipFile ? "border-black bg-slate-50" : "border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200"} rounded-2xl p-2.5 cursor-pointer transition-all`}
                      >
                        <span className="bg-black text-white text-[10px] font-black uppercase tracking-widest px-5 py-3 rounded-xl mr-4 shrink-0 shadow-sm">
                          {zipFile ? "Change File" : "Choose File"}
                        </span>
                        <span
                          className={`text-xs truncate ${zipFile ? "text-black font-black uppercase tracking-tight" : "text-slate-300"}`}
                        >
                          {zipFile ? zipFile.name : "No file chosen (Optional)"}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Notes Card */}
              <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <div className="p-8">
                  <label className="block text-xs font-black text-black uppercase tracking-widest mb-4">
                    Requirements & Descriptions
                  </label>
                  <textarea
                    rows={5}
                    placeholder={t.phNotes}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 text-slate-900 text-sm rounded-2xl px-5 py-4 focus:outline-none focus:ring-1 focus:ring-black focus:border-black focus:bg-white transition-all resize-none placeholder:text-slate-300 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Sticky Summary (4 cols) */}
            <div className="lg:col-span-4">
              <div className="sticky top-24 bg-black rounded-3xl shadow-2xl overflow-hidden border border-white/10 ring-1 ring-white/5">
                {/* Summary Header */}
                <div className="bg-white/5 border-b border-white/10 p-8">
                  <h3 className="text-white font-black text-xs uppercase tracking-widest m-0">
                    {t.summary}
                  </h3>
                </div>

                <div className="p-8 flex flex-col gap-6">
                  {/* Details List */}
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                      {t.projectName}:
                    </span>
                    <span className="font-black text-white text-xs text-right line-clamp-2 uppercase tracking-tight">
                      {projectname || "-"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-500">{t.qty}:</span>
                    <span className="text-white">{pcbQty} Units</span>
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-500">{t.totalFiles}:</span>
                    <span className="text-white">
                      {diagramImages.length + (zipFile ? 1 : 0)} Files
                    </span>
                  </div>

                  <hr className="border-white/10 my-2" />

                  {/* Price Box */}
                  <div className="bg-white/5 rounded-2xl p-6 text-center border border-white/5">
                    <span className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] block mb-2">
                      {t.estPrice}
                    </span>
                    <h4 className="text-white font-black text-2xl tracking-tighter m-0 uppercase">
                      Waiting Quote
                    </h4>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-5 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-[0.15em] hover:bg-slate-200 active:scale-[0.98] transition-all shadow-xl disabled:opacity-30 disabled:hover:bg-white flex items-center justify-center gap-3"
                  >
                    <FaPaperPlane className="text-[10px]" /> {t.submit}
                  </button>

                  {/* Trust Badges */}
                  <div className="mt-2 space-y-3">
                    <div className="flex items-center text-slate-400 text-[9px] font-black uppercase tracking-widest">
                      <BsShieldCheck className="mr-3 text-white" size={14} />{" "}
                      {t.secure}
                    </div>
                    <div className="flex items-center text-slate-400 text-[9px] font-black uppercase tracking-widest">
                      <BsClockHistory className="mr-3 text-white" size={14} />{" "}
                      {t.fastReview}
                    </div>
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

export default CustomPCBSetScreen;
