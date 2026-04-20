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
} from "react-icons/fa";
import {
  useGetCustomcartByIdQuery,
  useUpdateCustomcartMutation,
  useUploadCustomCartDiagramZipMutation,
  useUploadCustomCartMultipleImagesMutation,
} from "../../slices/custompcbCartApiSlice";

const IMAGE_FOLDER = "/custompcbImages";

const CustomPCBCartEditScreen = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({ pcbQty: 1, zipFile: null });
  const [projectname, setProjectName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [diagramImages, setDiagramImages] = useState([]); // {url, file} objects
  const [notes, setNotes] = useState("");
  const [zipPath, setZipPath] = useState("");

  const { data } = useGetCustomcartByIdQuery(id);
  const [updateCustomcart, { isLoading: updateLoading }] =
    useUpdateCustomcartMutation();
  const [uploadDiagramZip] = useUploadCustomCartDiagramZipMutation();
  const [uploadMultipleImages] = useUploadCustomCartMultipleImagesMutation();

  // Load existing data on mount or when data changes
  useEffect(() => {
    if (data && data.success && data.data) {
      const d = data.data;

      setProjectName(d.projectname || "");
      setFormData((prev) => ({
        ...prev,
        pcbQty: d.pcb_qty || 1,
      }));
      setNotes(d.notes || "");

      // Build existing images list
      const existingImages = [];
      for (let i = 1; i <= 10; i++) {
        const path = d[`dirgram_image_${i}`];
        if (path) {
          let fullPath = path;
          // If path starts with /images-, prefix with IMAGE_FOLDER
          if (path.startsWith("/images-")) {
            fullPath = `${IMAGE_FOLDER}${path}`;
          }
          existingImages.push({ url: fullPath, file: null });
        }
      }
      setDiagramImages(existingImages);

      // Zip file info
      if (d.dirgram_zip) {
        setZipPath(d.dirgram_zip);
        setFormData((prev) => ({
          ...prev,
          zipFile: { name: d.dirgram_zip, isUploaded: true },
        }));
      }
    }
  }, [data]);

  // Cleanup object URLs when component unmounts or images change
  useEffect(() => {
    return () => {
      diagramImages.forEach((img) => {
        if (img.file && img.url) {
          URL.revokeObjectURL(img.url);
        }
      });
    };
  }, [diagramImages]);

  // Handle simple form data changes
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Add newly uploaded images to state with preview URLs
  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    const previews = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setDiagramImages((prev) => [...prev, ...previews]);
  };

  // Remove image by index and revoke URL if it was newly uploaded
  const removeImage = (index) => {
    setDiagramImages((prev) => {
      const removed = prev[index];
      if (removed.file && removed.url) {
        URL.revokeObjectURL(removed.url);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  // Upload new images to server, return array of uploaded image paths
  const uploadDiagramImages = async () => {
    const form = new FormData();
    const newImages = diagramImages.filter((img) => img.file);
    if (newImages.length === 0) return [];
    newImages.forEach((img) => form.append("images", img.file));
    const res = await uploadMultipleImages(form).unwrap();
    return (res?.images || []).map((img) =>
      typeof img === "string" ? img : img.path,
    );
  };

  // Upload zip file if changed, else return existing path
  const uploadDiagramZipHandler = async () => {
    if (!formData.zipFile || formData.zipFile.isUploaded)
      return formData.zipFile?.name || null;

    const form = new FormData();
    form.append("diagramZip", formData.zipFile);
    const res = await uploadDiagramZip(form).unwrap();
    return res.path;
  };

  // Handle form submit to update the order
  const orderNowHandler = async (e) => {
    e.preventDefault();
    if (!projectname.trim()) return toast.error("Please enter a project name.");
    if (diagramImages.length === 0)
      return toast.error("Please upload at least 1 diagram image.");

    try {
      setIsLoading(true);

      // Upload only new images and get their paths
      const uploadedImages = await uploadDiagramImages();

      // Upload zip if needed
      const uploadedZipPath = await uploadDiagramZipHandler();

      // Build the data object for update
      const updatedData = {
        projectname,
        pcb_qty: formData.pcbQty,
        notes,
        dirgram_zip: uploadedZipPath,
      };

      // Combine existing images (without file) with newly uploaded images
      // Map existing images without file as is; replace new ones with uploaded paths
      let existingIndex = 0;
      diagramImages.forEach((img, idx) => {
        if (img.file) {
          // This image was uploaded just now; use uploadedImages in order
          updatedData[`dirgram_image_${idx + 1}`] =
            uploadedImages[existingIndex];
          existingIndex++;
        } else {
          // Existing image URL, extract path relative to IMAGE_FOLDER
          const relativePath = img.url.startsWith(IMAGE_FOLDER)
            ? img.url.slice(IMAGE_FOLDER.length)
            : img.url;
          updatedData[`dirgram_image_${idx + 1}`] = relativePath;
        }
      });

      // Clear any leftover images from 10+ (if images removed)
      for (let i = diagramImages.length + 1; i <= 10; i++) {
        updatedData[`dirgram_image_${i}`] = null;
      }

      // Send update request
      await updateCustomcart({ id, data: updatedData }).unwrap();

      toast.success("Order updated successfully!");
      navigate("/admin/cartcustompcblist"); // Redirect after success, adjust as needed
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit order.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 font-prompt">
      <Container className="py-4 md:py-6">
        {/* Header & Navigation */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              to="/admin/cartcustompcblist"
              className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all"
            >
              <FaArrowLeft size={16} />
            </Link>
            <div>
              <nav className="flex mb-1" aria-label="Breadcrumb">
                <ol className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <li>
                    <Link
                      to="/admin/cartcustompcblist"
                      className="hover:text-blue-500 transition-colors"
                    >
                      Admin
                    </Link>
                  </li>
                  <li>/</li>
                  <li className="text-slate-900">Edit Order</li>
                </ol>
              </nav>
              <h1 className="text-2xl font-bold text-slate-900 m-0">
                Edit Custom PCB Project
              </h1>
            </div>
          </div>
        </div>

        <Form onSubmit={orderNowHandler}>
          <Row className="g-4">
            {/* Left Column: Form Details */}
            <Col lg={8}>
              <div className="space-y-6">
                {/* Project Name Card */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-4 md:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
                      <FaMicrochip size={18} />
                    </div>
                    <h5 className="text-lg font-bold text-slate-900 m-0">
                      Basic Information
                    </h5>
                  </div>

                  <Form.Group className="mb-0">
                    <Form.Label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
                      Project Name
                    </Form.Label>
                    <Form.Control
                      type="text"
                      className="bg-slate-50 border-2 border-slate-50 rounded-2xl py-3 px-4 font-bold text-slate-800 focus:bg-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                      placeholder="Enter project name"
                      value={projectname}
                      onChange={(e) => setProjectName(e.target.value)}
                    />
                  </Form.Group>
                </div>

                {/* Images Card */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-4 md:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
                        <FaCloudUploadAlt size={18} />
                      </div>
                      <h5 className="text-lg font-bold text-slate-900 m-0">
                        Diagram Images
                      </h5>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {diagramImages.length} / 10 Images
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {diagramImages.map((img, idx) => (
                      <div
                        key={idx}
                        className="group relative aspect-square rounded-3xl overflow-hidden border border-slate-100 shadow-sm"
                      >
                        <Image
                          src={img.url}
                          className="w-full h-full object-fit-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="w-10 h-10 rounded-2xl bg-rose-600 text-white shadow-lg hover:bg-rose-700 active:scale-95 transition-all flex items-center justify-center border-none"
                          >
                            <FaTrashAlt size={14} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {diagramImages.length < 10 && (
                      <label className="aspect-square rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50/50 hover:border-blue-200 transition-all group overflow-hidden">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                        <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-blue-500 mb-2 transition-colors">
                          <FaCloudUploadAlt size={18} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-blue-500 transition-colors">
                          Upload
                        </span>
                      </label>
                    )}
                  </div>
                </div>

                {/* Technical Files Card */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-4 md:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
                      <FaFileArchive size={18} />
                    </div>
                    <h5 className="text-lg font-bold text-slate-900 m-0">
                      Technical Files
                    </h5>
                  </div>

                  <div className="relative">
                    <input
                      type="file"
                      accept=".zip,.rar"
                      id="zipFileInput"
                      className="hidden"
                      onChange={(e) =>
                        handleChange("zipFile", e.target.files[0])
                      }
                    />

                    {formData.zipFile ? (
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-amber-500 flex-shrink-0">
                            <FaFileArchive size={16} />
                          </div>
                          <div className="overflow-hidden">
                            <div className="text-xs font-bold text-slate-800 truncate">
                              {formData.zipFile.name ||
                                zipPath.split("/").pop()}
                            </div>
                            <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                              {formData.zipFile.isUploaded
                                ? "Current File"
                                : "Newly Selected"}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleChange("zipFile", null)}
                          className="p-2 text-slate-400 hover:text-rose-500 transition-colors border-none bg-transparent"
                        >
                          <FaTrashAlt size={14} />
                        </button>
                      </div>
                    ) : (
                      <label
                        htmlFor="zipFileInput"
                        className="block w-full py-4 md:py-6 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-amber-50/50 hover:border-amber-200 transition-all cursor-pointer group text-center"
                      >
                        <FaCloudUploadAlt
                          size={24}
                          className="text-slate-300 group-hover:text-amber-500 mb-2 mx-auto transition-colors"
                        />
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest group-hover:text-amber-500 transition-colors">
                          Click to Upload ZIP/RAR
                        </span>
                      </label>
                    )}
                  </div>
                </div>

                {/* Notes Card */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-4 md:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                      <FaSave size={18} />
                    </div>
                    <h5 className="text-lg font-bold text-slate-900 m-0">
                      Additional Notes
                    </h5>
                  </div>
                  <Form.Control
                    as="textarea"
                    rows={6}
                    className="bg-slate-50 border-2 border-slate-50 rounded-2xl py-4 px-4 font-medium text-slate-600 focus:bg-white focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none resize-none"
                    placeholder="Enter any specific details or requirements..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </Col>

            {/* Right Column: Summary & Submit */}
            <Col lg={4}>
              <div className="sticky top-6 space-y-6">
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-4 md:p-8">
                  <h5 className="text-lg font-bold text-slate-900 mb-6">
                    Configuration
                  </h5>

                  <Form.Group className="mb-8">
                    <Form.Label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
                      PCB Quantity
                    </Form.Label>
                    <div className="relative">
                      <Form.Control
                        type="number"
                        min="0"
                        className="bg-slate-50 border-2 border-slate-50 rounded-2xl py-3 px-4 font-bold text-slate-800 focus:bg-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                        value={formData.pcbQty}
                        onChange={(e) =>
                          handleChange(
                            "pcbQty",
                            Math.max(0, parseInt(e.target.value || 0)),
                          )
                        }
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Units
                      </span>
                    </div>
                  </Form.Group>

                  <button
                    type="submit"
                    className="w-full py-4 rounded-2xl bg-blue-600 text-white font-bold text-sm shadow-xl shadow-blue-100 hover:shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 border-none disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                    disabled={isLoading || updateLoading}
                  >
                    {isLoading || updateLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <FaSave /> Update Project
                      </>
                    )}
                  </button>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 italic">
                    <p className="text-[10px] font-medium text-slate-500 text-center m-0 leading-relaxed">
                      All changes will be updated in the system immediately.
                      Admins can review these changes in the list view.
                    </p>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Form>
      </Container>
    </div>
  );
};

export default CustomPCBCartEditScreen;
