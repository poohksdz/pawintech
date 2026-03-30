import React, { useState, useEffect } from "react";
import { Container, Row, Col, Form, Image } from "react-bootstrap";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  FaArrowLeft,
  FaCloudUploadAlt,
  FaTrashAlt,
  FaFileArchive,
  FaMicrochip,
  FaSave,
  FaImages,
} from "react-icons/fa";
import {
  useGetcopycartByIdQuery,
  useUpdatecopycartMutation,
  useUploadcopypcbZipMutation,
  useUploadMultipleCopyPCBImagesMutation,
} from "../../slices/copypcbCartApiSlice";

const CopyPCBCartEditScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data } = useGetcopycartByIdQuery(id);
  const [updatecopycart, { isLoading: updateLoading }] =
    useUpdatecopycartMutation();
  const [uploadZip] = useUploadcopypcbZipMutation();
  const [uploadImages] = useUploadMultipleCopyPCBImagesMutation();

  const [formData, setFormData] = useState({
    projectname: "",
    pcbQty: 1,
    zipFile: null,
    notes: "",
    frontImages: [],
    backImages: [],
  });

  const [existingZip, setExistingZip] = useState(null);
  const [existingFront, setExistingFront] = useState([]);
  const [existingBack, setExistingBack] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const getFullUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    let normalizedPath = path.replace(/\\/g, "/");
    if (!normalizedPath.startsWith("/")) {
      normalizedPath = "/" + normalizedPath;
    }
    const baseUrl =
      process.env.NODE_ENV === "development" ? "http://localhost:5000" : "";
    return `${baseUrl}${normalizedPath}`;
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e, type) => {
    const files = Array.from(e.target.files).map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setFormData((prev) => ({
      ...prev,
      [type === "front" ? "frontImages" : "backImages"]: [
        ...prev[type === "front" ? "frontImages" : "backImages"],
        ...files,
      ],
    }));
  };

  const removeImage = (index, type) => {
    setFormData((prev) => ({
      ...prev,
      [type === "front" ? "frontImages" : "backImages"]: prev[
        type === "front" ? "frontImages" : "backImages"
      ].filter((_, i) => i !== index),
    }));
  };

  const removeExistingImage = (index, type) => {
    if (type === "front") {
      setExistingFront((prev) => prev.filter((_, i) => i !== index));
    } else {
      setExistingBack((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const uploadImagesHandler = async (images) => {
    if (images.length === 0) return [];
    const form = new FormData();
    images.forEach((img) => form.append("images", img.file));
    const res = await uploadImages(form).unwrap();
    // Supporting both string and object formats
    return (res?.images || []).map((img) =>
      typeof img === "string" ? img : img.path,
    );
  };

  const uploadZipHandler = async () => {
    if (formData.zipFile) {
      const form = new FormData();
      form.append("copypcbZip", formData.zipFile);
      const res = await uploadZip(form).unwrap();
      return res.file || res.path || res.url;
    }
    return existingZip || null;
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    if (!formData.projectname.trim())
      return toast.error("Project name required.");

    try {
      setIsLoading(true);
      const frontPaths = await uploadImagesHandler(formData.frontImages);
      const backPaths = await uploadImagesHandler(formData.backImages);
      const zipPathResult = await uploadZipHandler();

      await updatecopycart({
        id,
        updatedData: {
          projectname: formData.projectname,
          pcb_qty: formData.pcbQty,
          notes: formData.notes,
          copypcb_zip: zipPathResult,
          copypcbFrontImages: [...existingFront, ...frontPaths],
          copypcbBackImages: [...existingBack, ...backPaths],
        },
      }).unwrap();

      toast.success("Order updated successfully!");
      navigate("/admin/cartcopypcblist");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update order.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (data?.success && data.data) {
      const order = data.data;
      setFormData((prev) => ({
        ...prev,
        projectname: order.projectname || "",
        pcbQty: order.pcb_qty || 1,
        notes: order.notes || "",
      }));
      setExistingZip(order.copypcb_zip || null);

      const frontImgs = [];
      const backImgs = [];

      for (let i = 1; i <= 10; i++) {
        if (order[`front_image_${i}`]) {
          frontImgs.push(order[`front_image_${i}`]);
        }
        if (order[`back_image_${i}`]) {
          backImgs.push(order[`back_image_${i}`]);
        }
      }
      setExistingFront(frontImgs);
      setExistingBack(backImgs);
    }
  }, [data]);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 font-prompt">
      <Container className="py-6">
        {/* Header & Navigation */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              to="/admin/cartcopypcblist"
              className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all"
            >
              <FaArrowLeft size={16} />
            </Link>
            <div>
              <nav className="flex mb-1" aria-label="Breadcrumb">
                <ol className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <li>
                    <Link
                      to="/admin/cartcopypcblist"
                      className="hover:text-blue-500 transition-colors"
                    >
                      Admin
                    </Link>
                  </li>
                  <li>/</li>
                  <li className="text-slate-900">Edit Copy PCB Order</li>
                </ol>
              </nav>
              <h1 className="text-2xl font-bold text-slate-900 m-0">
                Edit Project
              </h1>
            </div>
          </div>
        </div>

        <Form onSubmit={submitHandler}>
          <Row className="g-4">
            {/* Left Column */}
            <Col lg={8}>
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
                      <FaMicrochip size={18} />
                    </div>
                    <h5 className="text-lg font-bold text-slate-900 m-0">
                      Basic Information
                    </h5>
                  </div>
                  <Form.Group>
                    <Form.Label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
                      Project Name
                    </Form.Label>
                    <Form.Control
                      type="text"
                      className="bg-slate-50 border-2 border-slate-50 rounded-2xl py-3 px-4 font-bold text-slate-800 focus:bg-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                      placeholder="Enter project name"
                      value={formData.projectname}
                      onChange={(e) =>
                        handleChange("projectname", e.target.value)
                      }
                    />
                  </Form.Group>
                </div>

                {/* Front Images Grid */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                        <FaImages size={18} />
                      </div>
                      <h5 className="text-lg font-bold text-slate-900 m-0">
                        Front PCB Images
                      </h5>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {formData.frontImages.length + existingFront.length} / 10
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {/* New Front Images */}
                    {formData.frontImages.map((img, idx) => (
                      <div
                        key={`new-front-${idx}`}
                        className="group relative aspect-square rounded-3xl overflow-hidden border border-slate-100 shadow-sm border-2 border-blue-200"
                      >
                        <Image
                          src={img.url}
                          className="w-full h-full object-contain p-2 bg-slate-50"
                        />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                          <button
                            type="button"
                            onClick={() => removeImage(idx, "front")}
                            className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center border-none shadow-lg hover:bg-rose-700 transition-all"
                          >
                            <FaTrashAlt size={12} />
                          </button>
                        </div>
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-blue-600 text-white text-[8px] font-bold uppercase tracking-wider">
                          New
                        </div>
                      </div>
                    ))}
                    {/* Existing Front Images */}
                    {existingFront.map((img, idx) => (
                      <div
                        key={`existing-front-${idx}`}
                        className="group relative aspect-square rounded-3xl overflow-hidden border border-slate-100 shadow-sm"
                      >
                        <Image
                          src={getFullUrl(img)}
                          className="w-full h-full object-contain p-2 bg-slate-50"
                        />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                          <button
                            type="button"
                            onClick={() => removeExistingImage(idx, "front")}
                            className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center border-none shadow-lg hover:bg-rose-700 transition-all"
                          >
                            <FaTrashAlt size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {/* Upload Front */}
                    {formData.frontImages.length + existingFront.length <
                      10 && (
                      <label className="aspect-square rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50/50 hover:border-blue-200 transition-all group">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => handleImageUpload(e, "front")}
                        />
                        <FaCloudUploadAlt
                          size={20}
                          className="text-slate-300 group-hover:text-blue-500 mb-2 transition-colors"
                        />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-blue-500">
                          Upload Front
                        </span>
                      </label>
                    )}
                  </div>
                </div>

                {/* Back Images Grid */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                        <FaImages size={18} />
                      </div>
                      <h5 className="text-lg font-bold text-slate-900 m-0">
                        Back PCB Images
                      </h5>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {formData.backImages.length + existingBack.length} / 10
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {/* New Back Images */}
                    {formData.backImages.map((img, idx) => (
                      <div
                        key={`new-back-${idx}`}
                        className="group relative aspect-square rounded-3xl overflow-hidden border-2 border-blue-200 shadow-sm"
                      >
                        <Image
                          src={img.url}
                          className="w-full h-full object-contain p-2 bg-slate-50"
                        />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                          <button
                            type="button"
                            onClick={() => removeImage(idx, "back")}
                            className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center border-none shadow-lg hover:bg-rose-700 transition-all"
                          >
                            <FaTrashAlt size={12} />
                          </button>
                        </div>
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-blue-600 text-white text-[8px] font-bold uppercase tracking-wider">
                          New
                        </div>
                      </div>
                    ))}
                    {/* Existing Back Images */}
                    {existingBack.map((img, idx) => (
                      <div
                        key={`existing-back-${idx}`}
                        className="group relative aspect-square rounded-3xl overflow-hidden border border-slate-100 shadow-sm"
                      >
                        <Image
                          src={getFullUrl(img)}
                          className="w-full h-full object-contain p-2 bg-slate-50"
                        />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                          <button
                            type="button"
                            onClick={() => removeExistingImage(idx, "back")}
                            className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center border-none shadow-lg hover:bg-rose-700 transition-all"
                          >
                            <FaTrashAlt size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {/* Upload Back */}
                    {formData.backImages.length + existingBack.length < 10 && (
                      <label className="aspect-square rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50/50 hover:border-blue-200 transition-all group">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => handleImageUpload(e, "back")}
                        />
                        <FaCloudUploadAlt
                          size={20}
                          className="text-slate-300 group-hover:text-blue-500 mb-2 transition-colors"
                        />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-blue-500">
                          Upload Back
                        </span>
                      </label>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
                      <FaFileArchive size={18} />
                    </div>
                    <h5 className="text-lg font-bold text-slate-900 m-0">
                      Additional Notes
                    </h5>
                  </div>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    className="bg-slate-50 border-2 border-slate-50 rounded-2xl py-4 px-4 font-medium text-slate-600 focus:bg-white focus:border-blue-500/50 transition-all outline-none resize-none"
                    placeholder="Describe specific requirements..."
                    value={formData.notes}
                    onChange={(e) => handleChange("notes", e.target.value)}
                  />
                </div>
              </div>
            </Col>

            {/* Right Column */}
            <Col lg={4}>
              <div className="sticky top-6 space-y-6">
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 text-center">
                  <h5 className="text-lg font-bold text-slate-900 mb-8">
                    Settings & Submit
                  </h5>

                  <div className="mb-8 text-left">
                    <Form.Label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
                      PCB Quantity
                    </Form.Label>
                    <div className="relative">
                      <Form.Control
                        type="number"
                        min="1"
                        className="bg-slate-50 border-2 border-slate-50 rounded-2xl py-4 px-4 font-bold text-slate-800 focus:bg-white focus:border-blue-500/50 transition-all outline-none"
                        value={formData.pcbQty}
                        onChange={(e) =>
                          handleChange(
                            "pcbQty",
                            Math.max(1, parseInt(e.target.value || 0)),
                          )
                        }
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Units
                      </span>
                    </div>
                  </div>

                  {/* ZIP File */}
                  <div className="mb-8 text-left">
                    <Form.Label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
                      Project Files
                    </Form.Label>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 relative group">
                      <input
                        type="file"
                        accept=".zip,.rar"
                        className="hidden"
                        id="zipFile"
                        onChange={(e) =>
                          handleChange("zipFile", e.target.files[0])
                        }
                      />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <FaFileArchive
                            size={16}
                            className="text-amber-500 flex-shrink-0"
                          />
                          <div className="overflow-hidden">
                            <p className="text-xs font-bold text-slate-800 m-0 truncate">
                              {formData.zipFile?.name ||
                                existingZip?.split("/").pop() ||
                                "No file selected"}
                            </p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest m-0">
                              {formData.zipFile
                                ? "Ready to upload"
                                : existingZip
                                  ? "Existing file"
                                  : "Click upload"}
                            </p>
                          </div>
                        </div>
                        <label
                          htmlFor="zipFile"
                          className="p-2 cursor-pointer text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <FaCloudUploadAlt size={16} />
                        </label>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 rounded-2xl bg-blue-600 text-white font-bold text-sm shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 border-none disabled:opacity-50"
                    disabled={isLoading || updateLoading}
                  >
                    {isLoading || updateLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <FaSave /> Update Order
                      </>
                    )}
                  </button>

                  <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest m-0 px-4">
                    Ensure all technical details are correct before saving.
                  </p>
                </div>
              </div>
            </Col>
          </Row>
        </Form>
      </Container>
      <style>{` .font-prompt { font-family: 'Prompt', sans-serif !important; } `}</style>
    </div>
  );
};

export default CopyPCBCartEditScreen;
