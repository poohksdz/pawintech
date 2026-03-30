import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaArrowLeft,
  FaSave,
  FaTrash,
  FaCloudUploadAlt,
  FaFileArchive,
  FaUser,
  FaTruck,
  FaFileInvoiceDollar,
  FaRegCreditCard,
} from "react-icons/fa";
import {
  useGetCustomPCBByIdQuery,
  useUpdateCustomPCBMutation,
  useUploadDiagramZipMutation as useUploadZip,
  useUploadMultipleImagesMutation as useUploadImages,
} from "../../slices/custompcbApiSlice";
import { BASE_URL } from "../../constants";
import Loader from "../../components/Loader";
import Message from "../../components/Message";

const CustomPCBOrderEditScreen = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { language } = useSelector((state) => state.language);

  const [formData, setFormData] = useState({
    pcbQty: 5,
    zipFile: null,
    confirmed_price: "",
    status: "pending",
    billingName: "",
    billingPhone: "",
    billinggAddress: "",
    billingCity: "",
    billingPostalCode: "",
    billingCountry: "",
    tax: "",
    shippingName: "",
    shippingPhone: "",
    shippingAddress: "",
    shippingCity: "",
    shippingPostalCode: "",
    shippingCountry: "",
    userName: "",
    userEmail: "",
    receivePlace: "bysending",
  });

  const [projectname, setProjectName] = useState("");
  const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);
  const [diagramImages, setDiagramImages] = useState([]);
  const [notes, setNotes] = useState("");
  const [existingZip, setExistingZip] = useState(null);

  const { data, isLoading, error } = useGetCustomPCBByIdQuery(id);
  const [updateCustomPCB, { isLoading: updateLoading }] =
    useUpdateCustomPCBMutation();
  const [uploadDiagramZip] = useUploadZip();
  const [uploadMultipleImages] = useUploadImages();

  const getFullUrl = (pathInput) => {
    if (!pathInput) return null;
    let path =
      typeof pathInput === "object"
        ? pathInput.path || pathInput.url
        : pathInput;
    if (!path || typeof path !== "string") return null;
    if (path.startsWith("http")) return path;
    let normalizedPath = path.replace(/\\/g, "/");
    if (!normalizedPath.startsWith("/")) normalizedPath = "/" + normalizedPath;
    const baseUrl =
      process.env.NODE_ENV === "development"
        ? "http://localhost:5000"
        : BASE_URL || "";
    return `${baseUrl}${normalizedPath}`;
  };

  const handleChange = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    const previews = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setDiagramImages((prev) => [...prev, ...previews]);
  };

  const removeImage = (index) =>
    setDiagramImages((prev) => prev.filter((_, i) => i !== index));

  const uploadDiagramImages = async () => {
    const newImages = diagramImages.filter((img) => img.file);
    if (newImages.length === 0) return [];
    const form = new FormData();
    newImages.forEach((img) => form.append("images", img.file));
    const res = await uploadMultipleImages(form).unwrap();
    return (res?.images || []).map((img) =>
      typeof img === "string" ? img : img.path || img.url,
    );
  };

  const uploadDiagramZipHandler = async () => {
    if (!formData.zipFile) return existingZip || null;
    const form = new FormData();
    form.append("diagramZip", formData.zipFile);
    const res = await uploadDiagramZip(form).unwrap();
    return res.path;
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    if (!projectname.trim())
      return toast.error(
        language === "thai"
          ? "กรุณาระบุชื่อโปรเจกต์"
          : "Please enter a project name.",
      );

    try {
      setIsLoadingSubmit(true);
      const uploadedNewImages = await uploadDiagramImages();
      const existingImages = diagramImages
        .filter((img) => !img.file)
        .map((img) => img.raw || img.url);
      const allImages = [...existingImages, ...uploadedNewImages];
      const uploadedZipPath = await uploadDiagramZipHandler();

      await updateCustomPCB({
        id,
        updatedData: {
          projectname,
          pcb_qty: formData.pcbQty,
          notes,
          diagramImages: allImages,
          dirgram_zip: uploadedZipPath,
          ...formData,
        },
      }).unwrap();

      toast.success(
        language === "thai"
          ? "อัปเดตข้อมูลสำเร็จ!"
          : "Order updated successfully!",
      );
      navigate("/admin/ordercustompcblist");
    } catch (err) {
      console.error(err);
      toast.error(
        err?.data?.message ||
          (language === "thai"
            ? "อัปเดตข้อมูลล้มเหลว"
            : "Failed to update order."),
      );
    } finally {
      setIsLoadingSubmit(false);
    }
  };

  useEffect(() => {
    if (data?.success && data.data) {
      const order = data.data;
      setProjectName(order.projectname || "");
      setFormData((prev) => ({
        ...prev,
        pcbQty: order.pcb_qty || 1,
        zipFile: null,
        confirmed_price: order.confirmed_price || "",
        status: order.status || "pending",
        billingName: order.billingName || "",
        billingPhone: order.billingPhone || "",
        billinggAddress: order.billinggAddress || "",
        billingCity: order.billingCity || "",
        billingPostalCode: order.billingPostalCode || "",
        billingCountry: order.billingCountry || "",
        tax: order.billingTax || "",
        shippingName: order.shippingName || "",
        shippingPhone: order.shippingPhone || "",
        shippingAddress: order.shippingAddress || "",
        shippingCity: order.shippingCity || "",
        shippingPostalCode: order.shippingPostalCode || "",
        shippingCountry: order.shippingCountry || "",
        userName: order.userName || "",
        userEmail: order.userEmail || "",
        receivePlace: order.receivePlace || "bysending",
      }));
      setNotes(order.notes || "");
      setExistingZip(order.dirgram_zip || null);

      const images = [];
      for (let i = 1; i <= 10; i++) {
        const key = `dirgram_image_${i}`;
        if (order[key])
          images.push({ url: getFullUrl(order[key]), raw: order[key] });
      }
      setDiagramImages(images);
    }
  }, [data]);

  const InputField = ({
    label,
    value,
    onChange,
    type = "text",
    placeholder = "",
    readOnly = false,
  }) => (
    <div className="mb-4">
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all disabled:opacity-60"
        placeholder={placeholder}
        readOnly={readOnly}
      />
    </div>
  );

  if (isLoading)
    return (
      <div className="py-20 flex justify-center">
        <Loader />
      </div>
    );
  if (error)
    return (
      <div className="p-6">
        <Message variant="danger">
          {error?.data?.message || error.message}
        </Message>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-600 shadow-sm border border-slate-200 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
          >
            <FaArrowLeft />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {language === "thai"
                ? "แก้ไขใบสั่งผลิต Custom PCB"
                : "Edit Custom PCB Order"}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-indigo-50 text-indigo-700 border border-indigo-200/50 px-2.5 py-0.5 rounded-md text-xs font-mono font-bold">
                #{data?.data?.orderID}
              </span>
            </div>
          </div>
        </div>

        <form
          onSubmit={submitHandler}
          className="flex flex-col lg:flex-row gap-6"
        >
          <div className="flex-1 space-y-6">
            {/* Project Info Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/30">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <FaFileArchive className="text-indigo-500" /> Project
                  Information
                </h2>
              </div>
              <div className="p-6">
                <InputField
                  label="Project Name"
                  value={projectname}
                  onChange={setProjectName}
                />

                {/* Diagram Images */}
                <div className="mb-6">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Diagram Images (Max 10)
                  </label>
                  <label className="cursor-pointer group flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-8 bg-slate-50 hover:bg-slate-100 hover:border-indigo-300 transition-all">
                    <div className="w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform mb-3">
                      <FaCloudUploadAlt size={24} />
                    </div>
                    <span className="text-sm font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">
                      Click to Upload Images
                    </span>
                    <span className="text-xs text-slate-400 mt-1">
                      Support JPG, PNG
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>

                  {diagramImages.length > 0 && (
                    <div className="flex flex-wrap gap-4 mt-4">
                      <AnimatePresence>
                        {diagramImages.map((img, idx) => (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            key={idx}
                            className="relative group rounded-xl overflow-hidden border border-slate-200 shadow-sm w-24 h-24"
                          >
                            <img
                              src={img.url}
                              alt={`Diagram ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => removeImage(idx)}
                                className="w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center hover:bg-rose-600 hover:scale-110 transition-all shadow-lg"
                              >
                                <FaTrash size={12} />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {/* Gerber ZIP */}
                <div className="mb-6">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Gerber / Design Files (ZIP)
                  </label>
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                    <input
                      type="file"
                      accept=".zip,.rar"
                      onChange={(e) =>
                        handleChange("zipFile", e.target.files[0])
                      }
                      className="text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all cursor-pointer w-full focus:outline-none"
                    />
                    {formData.zipFile ? (
                      <div className="mt-3 text-sm font-semibold text-indigo-600 flex items-center gap-2">
                        <FaFileArchive /> New: {formData.zipFile.name}
                      </div>
                    ) : existingZip ? (
                      <div className="mt-3 text-sm flex items-center gap-2">
                        <span className="text-slate-500">Current:</span>
                        <a
                          href={getFullUrl(existingZip)}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
                        >
                          <FaFileArchive /> {existingZip.split("/").pop()}
                        </a>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="mb-0">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Admin Notes
                  </label>
                  <textarea
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Internal notes or messages to customer..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none"
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Address Details */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/30">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <FaTruck className="text-indigo-500" /> Contact & Shipping
                  Details
                </h2>
              </div>
              <div className="p-6 grid lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-4 border-b border-indigo-100 pb-2 flex items-center gap-2">
                      <FaUser /> Customer Contact
                    </h3>
                    <InputField
                      label="Name"
                      value={formData.userName}
                      onChange={(val) => handleChange("userName", val)}
                    />
                    <InputField
                      label="Email"
                      type="email"
                      value={formData.userEmail}
                      onChange={(val) => handleChange("userEmail", val)}
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-4 border-b border-indigo-100 pb-2 flex items-center gap-2">
                      <FaFileInvoiceDollar /> Billing Info
                    </h3>
                    <InputField
                      label="Name"
                      value={formData.billingName}
                      onChange={(val) => handleChange("billingName", val)}
                    />
                    <InputField
                      label="Phone"
                      value={formData.billingPhone}
                      onChange={(val) => handleChange("billingPhone", val)}
                    />
                    <InputField
                      label="Address"
                      value={formData.billinggAddress}
                      onChange={(val) => handleChange("billinggAddress", val)}
                    />
                    <InputField
                      label="Tax ID"
                      value={formData.tax}
                      onChange={(val) => handleChange("tax", val)}
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div>
                  <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-4 border-b border-indigo-100 pb-2 flex items-center gap-2">
                    <FaTruck /> Shipping Info
                  </h3>
                  <InputField
                    label="Name"
                    value={formData.shippingName}
                    onChange={(val) => handleChange("shippingName", val)}
                  />
                  <InputField
                    label="Phone"
                    value={formData.shippingPhone}
                    onChange={(val) => handleChange("shippingPhone", val)}
                  />
                  <InputField
                    label="Address"
                    value={formData.shippingAddress}
                    onChange={(val) => handleChange("shippingAddress", val)}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <InputField
                      label="City"
                      value={formData.shippingCity}
                      onChange={(val) => handleChange("shippingCity", val)}
                    />
                    <InputField
                      label="Postal Code"
                      value={formData.shippingPostalCode}
                      onChange={(val) =>
                        handleChange("shippingPostalCode", val)
                      }
                    />
                  </div>

                  <div className="mt-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Receive Place
                    </label>
                    <select
                      value={formData.receivePlace}
                      onChange={(e) =>
                        handleChange("receivePlace", e.target.value)
                      }
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all cursor-pointer font-semibold appearance-none"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: "right 0.5rem center",
                        backgroundRepeat: "no-repeat",
                        backgroundSize: "1.5em 1.5em",
                        paddingRight: "2.5rem",
                      }}
                    >
                      <option value="bysending">By Sending</option>
                      <option value="byyourself">Pick up yourself</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Config & Save */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 sticky top-6">
              <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                <FaRegCreditCard className="text-indigo-500" /> Order
                Configuration
              </h2>

              <div className="space-y-5 mb-8">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Order Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleChange("status", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all cursor-pointer font-bold appearance-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: "right 0.5rem center",
                      backgroundRepeat: "no-repeat",
                      backgroundSize: "1.5em 1.5em",
                      paddingRight: "2.5rem",
                    }}
                  >
                    <option value="pending">Waiting (Pending)</option>
                    <option value="accepted">Approved (Accepted)</option>
                    <option value="paid">Paid</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.pcbQty}
                    onChange={(e) =>
                      handleChange("pcbQty", parseInt(e.target.value) || 1)
                    }
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex justify-between">
                    <span>Quoted Price</span>
                    <span className="text-emerald-600">THB</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.confirmed_price}
                      onChange={(e) =>
                        handleChange("confirmed_price", e.target.value)
                      }
                      className="w-full pl-9 pr-4 py-3 rounded-xl bg-emerald-50/50 border border-emerald-200 text-emerald-700 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-bold text-lg"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-emerald-600">
                      ฿
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={isLoadingSubmit || updateLoading}
                  className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm shadow-indigo-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed group"
                >
                  {isLoadingSubmit || updateLoading ? (
                    <Loader />
                  ) : (
                    <>
                      <FaSave className="group-hover:scale-110 transition-transform" />{" "}
                      SAVE CHANGES
                    </>
                  )}
                </button>
                <Link
                  to="/admin/ordercustompcblist"
                  className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl font-bold flex items-center justify-center gap-2 transition-all block text-center"
                >
                  Cancel
                </Link>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomPCBOrderEditScreen;
