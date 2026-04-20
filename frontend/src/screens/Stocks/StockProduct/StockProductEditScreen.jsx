import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaPlus,
  FaStar,
  FaRegStar,
  FaImage,
  FaUpload,
  FaTimes,
  FaSave,
  FaArrowLeft,
  FaChevronDown,
} from "react-icons/fa";
import { format } from "date-fns";
import {
  useGetStockProductByIdQuery,
  useUpdateStockProductMutation,
  useUploadStockProductImageMutation,
  useRateProductMutation,
} from "../../../slices/stockProductApiSlice";
import {
  useGetStockCategoriesQuery,
  useCreateStockCategoryMutation,
} from "../../../slices/stockCategoryApiSlice";
import {
  useGetStockSubcategoriesQuery,
  useCreateStockSubcategoryMutation,
} from "../../../slices/stockSubcategoryApiSlice";
import {
  useGetStockFootprintsQuery,
  useCreateStockFootprintMutation,
} from "../../../slices/stockFootprintApiSlice";
import {
  useGetStockManufacturesQuery,
  useCreateStockManufactureMutation,
} from "../../../slices/stockManufactureApiSlice";
import {
  useGetStockSuppliersQuery,
  useCreateStockSupplierMutation,
} from "../../../slices/stockSupplierApiSlice";

// ============================================================================
// COMPONENT: SMOOTH FORM DROPDOWN
// ============================================================================
const FormDropdown = ({
  name,
  value,
  options,
  disabled,
  placeholder,
  onChange,
  required,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options?.find(
    (o) => String(o.value) === String(value),
  );

  return (
    <div className="relative flex-1">
      {/* Hidden input for HTML5 required validation */}
      <input
        type="text"
        name={name}
        value={value || ""}
        required={required}
        readOnly
        className="absolute opacity-0 w-0 h-0 pointer-events-none"
        tabIndex={-1}
      />

      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-[48px] bg-white border ${isOpen ? "border-indigo-600 ring-4 ring-indigo-500/10" : "border-slate-300"} rounded-xl px-4 text-sm text-slate-900 flex items-center justify-between transition-all outline-none shadow-sm ${disabled ? "opacity-50 cursor-not-allowed bg-slate-50" : "cursor-pointer hover:border-indigo-400"}`}
      >
        <span
          className={`truncate ${!selectedOption ? "text-slate-400 font-normal" : "font-semibold"}`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <FaChevronDown className="text-slate-400" size={10} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && !disabled && (
          <React.Fragment key="dropdown-fragment">
            <div
              className="fixed inset-0 z-[110]"
              onClick={() => setIsOpen(false)}
            />
            <motion.ul
              initial={{ opacity: 0, y: 4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.98 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute z-[120] w-full mt-1.5 bg-white border border-slate-100 rounded-xl shadow-xl shadow-slate-200/50 py-1.5 max-h-60 overflow-y-auto custom-scrollbar"
            >
              <li
                onClick={() => {
                  onChange({ target: { name, value: "" } });
                  setIsOpen(false);
                }}
                className="px-4 py-2.5 text-xs font-bold text-slate-400 hover:bg-slate-50 hover:text-slate-800 cursor-pointer transition-colors uppercase tracking-wider"
              >
                -- Clear Selection --
              </li>
              {options?.map((opt) => (
                <li
                  key={String(opt.key)}
                  onClick={() => {
                    onChange({ target: { name, value: opt.value } });
                    setIsOpen(false);
                  }}
                  className={`px-4 py-2.5 text-sm font-medium hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer transition-colors ${String(value) === String(opt.value) ? "text-indigo-700 bg-indigo-50/50 font-bold" : "text-slate-700"}`}
                >
                  {opt.label}
                </li>
              ))}
            </motion.ul>
          </React.Fragment>
        )}
      </AnimatePresence>
    </div>
  );
};

// Reusable Modal Component
const SmoothModal = ({
  isOpen,
  onClose,
  title,
  children,
  onConfirm,
  confirmText = "Create",
}) => {
  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative bg-white rounded-3xl w-full max-w-md p-4 md:p-6 shadow-2xl z-10 border border-slate-100"
          >
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-slate-900">{title}</h3>
              <button
                onClick={onClose}
                className="w-8 h-8 bg-slate-50 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full flex items-center justify-center transition-colors"
              >
                <FaTimes size={14} />
              </button>
            </div>
            <div className="mb-6">{children}</div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-slate-50 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md transition-colors"
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

const StockProductEditScreen = () => {
  const navigate = useNavigate();
  const { id: productId } = useParams();
  const { userInfo } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    img: "",
    electotronixPN: "",
    value: "",
    category: "",
    subcategory: "",
    footprint: "",
    weight: "",
    quantity: "",
    price: "",
    manufacture: "",
    manufacturePN: "",
    supplier: "",
    supplierPN: "",
    position: "",
    moq: "",
    spq: "",
    process: "",
    link: "",
    alternative: "",
    description: "",
    note: "",
    barcode: "",
  });

  // Query hooks with refetch
  const { data: categoryData = [], refetch: refetchCategories } =
    useGetStockCategoriesQuery();
  const { data: subcategoryData = [], refetch: refetchSubcategories } =
    useGetStockSubcategoriesQuery();
  const { data: footprintData = [], refetch: refetchFootprints } =
    useGetStockFootprintsQuery();
  const { data: manufactureData = [], refetch: refetchManufactures } =
    useGetStockManufacturesQuery();
  const { data: supplierData = [], refetch: refetchSuppliers } =
    useGetStockSuppliersQuery();

  const { data } = useGetStockProductByIdQuery(productId);
  const [uploadStockProductImage, { isLoading: isUploadingImage }] =
    useUploadStockProductImageMutation();
  const [updateStockProduct, { isLoading: isUpdating }] =
    useUpdateStockProductMutation();

  // Modal States
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [createStockCategory] = useCreateStockCategoryMutation();

  const [showCreateSubcategoryModal, setShowCreateSubcategoryModal] =
    useState(false);
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const [createStockSubcategory] = useCreateStockSubcategoryMutation();

  const [showCreateFootprintModal, setShowCreateFootprintModal] =
    useState(false);
  const [newFootprintName, setNewFootprintName] = useState("");
  const [createStockFootprint] = useCreateStockFootprintMutation();

  const [showCreateSupplierModal, setShowCreateSupplierModal] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");
  const [createStockSupplier] = useCreateStockSupplierMutation();

  const [showCreateManufactureModal, setShowCreateManufactureModal] =
    useState(false);
  const [newManufactureName, setNewManufactureName] = useState("");
  const [createStockManufacture] = useCreateStockManufactureMutation();

  const [rateProductHook, { isLoading: isTogglingStar }] =
    useRateProductMutation();

  const starRatingHandler = async (newRating) => {
    try {
      const finalRating = newRating; // ให้คะแนน 1-5 โดยตรง (สะสมเฉลี่ย)
      await rateProductHook({ productId, rating: finalRating }).unwrap();
      toast.success(
        finalRating > 0 ? `Rated ${finalRating} stars` : "Rating cleared",
      );
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateStockProduct({ id: productId, ...formData }).unwrap();
      refetchCategories();
      refetchSubcategories();
      refetchFootprints();
      refetchSuppliers();
      refetchManufactures();
      toast.success("Component updated successfully!");
      navigate("/componenteditlist");
    } catch (error) {
      toast.error("Failed to update component");
    }
  };

  const uploadImageHandler = async (e) => {
    const formDataImage = new FormData();
    formDataImage.append("image", e.target.files[0]);
    try {
      const res = await uploadStockProductImage(formDataImage).unwrap();
      toast.success(res.message);
      setFormData((prev) => ({
        ...prev,
        img: res.image, // Keep full path for both preview and DB storage
      }));
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  useEffect(() => {
    if (data) {
      setFormData({
        img: data.img || "",
        electotronixPN: data.electotronixPN || "",
        value: data.value || "",
        category: data.category || "",
        subcategory: data.subcategory || "",
        footprint: data.footprint || "",
        weight: data.weight || "",
        quantity: data.quantity || "",
        price: data.price || "",
        manufacture: data.manufacture || "",
        manufacturePN: data.manufacturePN || "",
        supplier: data.supplier || "",
        supplierPN: data.supplierPN || "",
        position: data.position || "",
        moq: data.moq || "",
        spq: data.spq || "",
        process: data.process || "",
        link: data.link || "",
        alternative: data.alternative || "",
        description: data.description || "",
        note: data.note || "",
        barcode: data.barcode || "",
        username: userInfo.name || "",
      });
    }
  }, [data, userInfo.name]);

  const inputClass =
    "w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 block p-3 transition-all outline-none shadow-sm placeholder:text-slate-400 font-medium";
  const labelClass =
    "block mb-2 text-xs font-black text-slate-600 uppercase tracking-widest";

  return (
    <div className="min-h-screen bg-[#F1F5F9] py-4 md:py-6 lg:py-10 px-4 sm:px-6 lg:px-8 font-sans selection:bg-indigo-100 dark:text-white">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 bg-white border border-slate-200 text-slate-500 hover:text-slate-800 rounded-xl flex items-center justify-center shadow-sm transition-all hover:bg-slate-50"
            >
              <FaArrowLeft size={14} />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Edit Component
              </h1>
              <p className="text-slate-500 text-sm font-medium">
                ID: {productId} •{" "}
                {formData.electotronixPN ||
                  formData.manufacturePN ||
                  "Unnamed Component"}
              </p>
            </div>
          </div>

          <div className="flex items-center bg-white border border-slate-200 px-4 py-2 rounded-2xl shadow-sm">
            {[1, 2, 3, 4, 5].map((star) => (
              <motion.button
                key={star}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => starRatingHandler(star)}
                disabled={isTogglingStar}
                className="p-1 focus:outline-none"
              >
                {data?.starRating >= star ? (
                  <FaStar className="text-amber-400 text-xl drop-shadow-sm" />
                ) : (
                  <FaRegStar className="text-slate-300 text-xl hover:text-amber-200 transition-colors" />
                )}
              </motion.button>
            ))}
            {data?.starRating > 0 && (
              <span className="ml-3 font-black text-slate-700 text-sm border-l border-slate-200 pl-3">
                {data.starRating}.0
              </span>
            )}
          </div>
        </div>

        {/* Rating Info Bar */}
        {data && (data.isStarred || data.lastUnstarredBy) && (
          <div className="flex flex-col gap-2 mb-6">
            <div className="bg-indigo-50/50 border border-indigo-100 text-indigo-700 text-xs font-semibold px-4 py-3 rounded-xl flex items-center gap-2">
              <FaStar
                className={data.isStarred ? "text-amber-400" : "text-slate-400"}
              />
              {data.isStarred
                ? `Last rated ${data.starRating} stars by ${data.lastStarredBy || "Unknown"} on ${data.lastStarredAt ? format(new Date(data.lastStarredAt), "dd MMM yyyy, HH:mm") : "-"}`
                : `Last cleared by ${data.lastUnstarredBy || "Unknown"} on ${data.lastUnstarredAt ? format(new Date(data.lastUnstarredAt), "dd MMM yyyy, HH:mm") : "-"}`}
            </div>
            {data.isStarred && data.lastStarredAt && (
              <div
                className={`text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-lg border ${(new Date() - new Date(data.lastStarredAt)) /
                  (1000 * 60 * 60 * 24) >
                  80
                  ? "bg-rose-50 border-rose-100 text-rose-600 animate-pulse"
                  : "bg-slate-100 border-slate-200 text-slate-500"
                  }`}
              >
                Auto-reset on:{" "}
                {format(
                  new Date(
                    new Date(data.lastStarredAt).getTime() +
                    90 * 24 * 60 * 60 * 1000,
                  ),
                  "dd MMM yyyy",
                )}
                (
                {90 -
                  Math.floor(
                    (new Date() - new Date(data.lastStarredAt)) /
                    (1000 * 60 * 60 * 24),
                  )}{" "}
                days remaining)
              </div>
            )}
          </div>
        )}

        {/* Main Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-[2.5rem] p-4 md:p-6 sm:p-10 shadow-xl border border-slate-200 mb-10 overflow-hidden"
        >
          {/* Image Upload Section */}
          <div className="mb-10">
            <label className={labelClass}>Component Image</label>
            <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6 p-4 md:p-6 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 hover:bg-slate-50 transition-colors group">
              <div className="w-32 h-32 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                {formData.img ? (
                  <img
                    src={formData.img}
                    alt="Preview"
                    className="w-full h-full object-contain p-2 mix-blend-multiply"
                  />
                ) : (
                  <FaImage className="text-slate-300 text-4xl" />
                )}
              </div>
              <div className="flex-1 w-full text-center sm:text-left">
                <h4 className="text-sm font-bold text-slate-800 mb-1">
                  Upload Image
                </h4>
                <p className="text-xs text-slate-500 mb-4">
                  PNG, JPG, GIF up to 5MB. Clear white background recommended.
                </p>
                <div className="relative inline-block w-full sm:w-auto">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={uploadImageHandler}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 md:px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm group-hover:border-indigo-300 group-hover:text-indigo-600 transition-colors">
                    <FaUpload />{" "}
                    {isUploadingImage ? "Uploading..." : "Choose File"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* Barcode & EPN */}
            <div>
              <label className={labelClass}>Electotronix P/N</label>
              <input
                type="text"
                name="electotronixPN"
                value={formData.electotronixPN}
                onChange={handleChange}
                className={inputClass}
                placeholder="Auto-generated if blank or '-'"
              />
            </div>

            {/* Value */}
            <div>
              <label className={labelClass}>
                Value <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="value"
                value={formData.value}
                onChange={handleChange}
                required
                className={inputClass}
                placeholder="e.g. 10k, 100uF"
              />
            </div>

            {/* Position */}
            <div>
              <label className={labelClass}>Storage Position</label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleChange}
                className={inputClass}
                placeholder="e.g. R1-S2-B3"
              />
            </div>

            {/* Quantity & Price */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  Quantity <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Unit Price (฿)</label>
                <input
                  type="number"
                  step="0.0001"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Weight */}
            <div>
              <label className={labelClass}>Weight (g)</label>
              <input
                type="number"
                step="0.01"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <hr className="col-span-1 md:col-span-2 border-slate-100 my-2" />

            {/* Category */}
            <div>
              <label className={labelClass}>
                Category <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-2">
                <FormDropdown
                  name="category"
                  value={formData.category}
                  required={true}
                  options={categoryData.map((c) => ({
                    key: c.ID,
                    value: c.category,
                    label: c.category,
                  }))}
                  placeholder="-- Select Category --"
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowCreateCategoryModal(true)}
                  className="w-[48px] h-[48px] bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-slate-800 transition-colors shrink-0"
                >
                  <FaPlus size={12} />
                </button>
              </div>
            </div>

            {/* Subcategory */}
            <div>
              <label className={labelClass}>Subcategory</label>
              <div className="flex gap-2">
                <FormDropdown
                  name="subcategory"
                  value={formData.subcategory}
                  disabled={!formData.category}
                  options={subcategoryData
                    .filter((s) => s.category === formData.category)
                    .map((s) => ({
                      key: s.subcategoryID,
                      value: s.subcategory,
                      label: s.subcategory,
                    }))}
                  placeholder="-- Select Subcategory --"
                  onChange={handleChange}
                />
                <button
                  type="button"
                  disabled={!formData.category}
                  onClick={() => setShowCreateSubcategoryModal(true)}
                  className="w-[48px] h-[48px] bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-slate-800 transition-colors disabled:opacity-50 shrink-0"
                >
                  <FaPlus size={12} />
                </button>
              </div>
            </div>

            {/* Footprint */}
            <div>
              <label className={labelClass}>Footprint</label>
              <div className="flex gap-2">
                <FormDropdown
                  name="footprint"
                  value={formData.footprint}
                  options={footprintData.map((fp) => ({
                    key: fp.footprintID,
                    value: fp.namefootprint,
                    label: fp.namefootprint,
                  }))}
                  placeholder="-- Select Footprint --"
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowCreateFootprintModal(true)}
                  className="w-[48px] h-[48px] bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-slate-800 transition-colors shrink-0"
                >
                  <FaPlus size={12} />
                </button>
              </div>
            </div>

            <hr className="col-span-1 md:col-span-2 border-slate-100 my-2" />

            {/* Manufacture & MFR PN */}
            <div>
              <label className={labelClass}>Manufacture</label>
              <div className="flex gap-2">
                <FormDropdown
                  name="manufacture"
                  value={formData.manufacture}
                  options={manufactureData.map((m) => ({
                    key: m.ID,
                    value: m.namemanufacture,
                    label: m.namemanufacture,
                  }))}
                  placeholder="-- Select Manufacture --"
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowCreateManufactureModal(true)}
                  className="w-[48px] h-[48px] bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-slate-800 transition-colors shrink-0"
                >
                  <FaPlus size={12} />
                </button>
              </div>
            </div>
            <div>
              <label className={labelClass}>Manufacture PN</label>
              <input
                type="text"
                name="manufacturePN"
                value={formData.manufacturePN}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            {/* Supplier & Supplier PN */}
            <div>
              <label className={labelClass}>Supplier</label>
              <div className="flex gap-2">
                <FormDropdown
                  name="supplier"
                  value={formData.supplier}
                  options={supplierData.map((s) => ({
                    key: s.ID,
                    value: s.namesupplier,
                    label: s.namesupplier,
                  }))}
                  placeholder="-- Select Supplier --"
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowCreateSupplierModal(true)}
                  className="w-[48px] h-[48px] bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-slate-800 transition-colors shrink-0"
                >
                  <FaPlus size={12} />
                </button>
              </div>
            </div>
            <div>
              <label className={labelClass}>Supplier PN</label>
              <input
                type="text"
                name="supplierPN"
                value={formData.supplierPN}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <hr className="col-span-1 md:col-span-2 border-slate-100 my-2" />

            {/* Other Specs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>MOQ</label>
                <input
                  type="text"
                  name="moq"
                  value={formData.moq}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>SPQ</label>
                <input
                  type="text"
                  name="spq"
                  value={formData.spq}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Process</label>
              <input
                type="text"
                name="process"
                value={formData.process}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Alternative Part</label>
              <input
                type="text"
                name="alternative"
                value={formData.alternative}
                onChange={handleChange}
                className={inputClass}
                placeholder="Drop-in replacement part numbers..."
              />
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Datasheet / Link</label>
              <input
                type="text"
                name="link"
                value={formData.link}
                onChange={handleChange}
                className={inputClass}
                placeholder="https://..."
              />
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Description</label>
              <textarea
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleChange}
                className={`${inputClass} !h-auto resize-none custom-scrollbar`}
                placeholder="Brief description of the component..."
              />
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Internal Note</label>
              <textarea
                rows={3}
                name="note"
                value={formData.note}
                onChange={handleChange}
                className={`${inputClass} !h-auto resize-none custom-scrollbar`}
                placeholder="Any internal notes or warnings..."
              />
            </div>
          </div>

          <div className="mt-10 flex justify-end">
            <button
              type="submit"
              disabled={isUpdating || isUploadingImage}
              className="w-full sm:w-auto px-4 md:px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <FaSave size={16} />
              {isUpdating || isUploadingImage
                ? "Saving Changes..."
                : "Save Component"}
            </button>
          </div>
        </form>

        {/* Create Modals */}
        <SmoothModal
          isOpen={showCreateCategoryModal}
          onClose={() => setShowCreateCategoryModal(false)}
          title="New Category"
          onConfirm={async () => {
            if (!newCategoryName) return;
            try {
              await createStockCategory({
                category: newCategoryName,
                createuser: userInfo.name,
              }).unwrap();
              toast.success("Category created!");
              refetchCategories();
              setNewCategoryName("");
              setShowCreateCategoryModal(false);
            } catch (err) {
              toast.error("Failed to create");
            }
          }}
        >
          <label className={labelClass}>Category Name</label>
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className={inputClass}
            placeholder="e.g. Resistors"
          />
        </SmoothModal>

        <SmoothModal
          isOpen={showCreateSubcategoryModal}
          onClose={() => setShowCreateSubcategoryModal(false)}
          title="New Subcategory"
          onConfirm={async () => {
            if (!newSubcategoryName || !formData.category) return;
            try {
              await createStockSubcategory({
                subcategory: newSubcategoryName,
                category: formData.category,
                createuser: userInfo.name,
              }).unwrap();
              toast.success("Subcategory created!");
              refetchSubcategories();
              setNewSubcategoryName("");
              setShowCreateSubcategoryModal(false);
            } catch (err) {
              toast.error("Failed to create");
            }
          }}
        >
          <label className={labelClass}>Selected Category</label>
          <input
            type="text"
            value={formData.category}
            readOnly
            className={`${inputClass} bg-slate-100 text-slate-500 mb-4`}
          />
          <label className={labelClass}>Subcategory Name</label>
          <input
            type="text"
            value={newSubcategoryName}
            onChange={(e) => setNewSubcategoryName(e.target.value)}
            className={inputClass}
            placeholder="e.g. SMD 0603"
          />
        </SmoothModal>

        <SmoothModal
          isOpen={showCreateFootprintModal}
          onClose={() => setShowCreateFootprintModal(false)}
          title="New Footprint"
          onConfirm={async () => {
            if (!newFootprintName) return;
            try {
              await createStockFootprint({
                namefootprint: newFootprintName,
                category: formData.category || "-",
                createuser: userInfo.name,
              }).unwrap();
              toast.success("Footprint created!");
              refetchFootprints();
              setNewFootprintName("");
              setShowCreateFootprintModal(false);
            } catch (err) {
              toast.error("Failed to create");
            }
          }}
        >
          <label className={labelClass}>Footprint Name</label>
          <input
            type="text"
            value={newFootprintName}
            onChange={(e) => setNewFootprintName(e.target.value)}
            className={inputClass}
            placeholder="e.g. SOT-23"
          />
        </SmoothModal>

        <SmoothModal
          isOpen={showCreateManufactureModal}
          onClose={() => setShowCreateManufactureModal(false)}
          title="New Manufacture"
          onConfirm={async () => {
            if (!newManufactureName) return;
            try {
              await createStockManufacture({
                namemanufacture: newManufactureName,
                createuser: userInfo.name,
              }).unwrap();
              toast.success("Manufacture created!");
              refetchManufactures();
              setNewManufactureName("");
              setShowCreateManufactureModal(false);
            } catch (err) {
              toast.error("Failed to create");
            }
          }}
        >
          <label className={labelClass}>Manufacture Name</label>
          <input
            type="text"
            value={newManufactureName}
            onChange={(e) => setNewManufactureName(e.target.value)}
            className={inputClass}
            placeholder="e.g. Texas Instruments"
          />
        </SmoothModal>

        <SmoothModal
          isOpen={showCreateSupplierModal}
          onClose={() => setShowCreateSupplierModal(false)}
          title="New Supplier"
          onConfirm={async () => {
            if (!newSupplierName) return;
            try {
              await createStockSupplier({
                namesupplier: newSupplierName,
                createuser: userInfo.name,
              }).unwrap();
              toast.success("Supplier created!");
              refetchSuppliers();
              setNewSupplierName("");
              setShowCreateSupplierModal(false);
            } catch (err) {
              toast.error("Failed to create");
            }
          }}
        >
          <label className={labelClass}>Supplier Name</label>
          <input
            type="text"
            value={newSupplierName}
            onChange={(e) => setNewSupplierName(e.target.value)}
            className={inputClass}
            placeholder="e.g. Mouser Electronics"
          />
        </SmoothModal>
      </div>
      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      ` }} />
    </div>
  );
};

export default StockProductEditScreen;
