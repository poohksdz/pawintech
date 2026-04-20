import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Form, Button, Row, Col, Image } from "react-bootstrap";
import { useSelector } from "react-redux";
import {
  FaArrowLeft,
  FaSave,
  FaBox,
  FaTags,
  FaInfoCircle,
  FaImage,
  FaMoneyBillWave,
  FaWarehouse,
  FaVideo,
  FaLanguage,
} from "react-icons/fa";
import { motion } from "framer-motion";
import { toast } from "react-toastify";

import Message from "../../components/Message";
import Loader from "../../components/Loader";
import {
  useGetProductDetailsQuery,
  useUpdateProductMutation,
  useUploadProductImageMutation,
} from "../../slices/productsApiSlice";

const ProductEditScreen = () => {
  const { id: productId } = useParams();
  const navigate = useNavigate();
  const { language } = useSelector((state) => state.language);

  // --- State for all fields ---
  const [name, setName] = useState("");
  const [nameThai, setNameThai] = useState("");
  const [productCode, setProductCode] = useState("");
  const [price, setPrice] = useState(0);
  const [image, setImage] = useState("");
  const [brand, setBrand] = useState("");
  const [brandThai, setBrandThai] = useState("");
  const [category, setCategory] = useState("");
  const [categoryThai, setCategoryThai] = useState("");
  const [countInStock, setCountInStock] = useState(0);
  const [description, setDescription] = useState("");
  const [descriptionThai, setDescriptionThai] = useState("");
  const [videoLink, setVideoLink] = useState("");

  // --- API Hooks ---
  const {
    data: product,
    isLoading,
    error,
  } = useGetProductDetailsQuery(productId);
  const [updateProduct, { isLoading: loadingUpdate }] =
    useUpdateProductMutation();
  const [uploadProductImage, { isLoading: loadingUpload }] =
    useUploadProductImageMutation();

  // --- Translations ---
  const t = {
    en: {
      title: "Edit Product",
      subtitle: "Update product details, pricing, and inventory",
      sections: {
        basic: "General Info (English)",
        basicThai: "General Info (Thai)",
        pricing: "Inventory & Shipping",
        media: "Product Media",
        category: "Classification",
      },
      lbl: {
        name: "Product Name",
        desc: "Description",
        price: "Sale Price (THB)",
        stock: "Quantity in Stock",
        image: "Image URL",
        upload: "Upload Photo",
        category: "Secondary Category",
        brand: "Manufacturer / Brand",
        video: "YouTube Video ID / URL",
      },
      btn: { save: "Save Product", back: "Back", saving: "Processing..." },
    },
    thai: {
      title: "แก้ไขสินค้า",
      subtitle: "จัดการข้อมูล ราคา และจำนวนในลิสต์สินค้า",
      sections: {
        basic: "ข้อมูลทั่วไป (อังกฤษ)",
        basicThai: "ข้อมูลทั่วไป (ไทย)",
        pricing: "ราคาและคลังสินค้า",
        media: "รูปภาพสินค้า",
        category: "การจัดหมวดหมู่",
      },
      lbl: {
        name: "ชื่อสินค้า",
        desc: "รายละเอียด",
        price: "ราคาขาย (บาท)",
        stock: "จำนวนคงเหลือ",
        image: "ลิงก์รูปภาพ",
        upload: "อัปโหลดรูปภาพ",
        category: "หมวดหมู่",
        brand: "แบรนด์/ผู้ผลิต",
        video: "วิดีโอ YouTube",
      },
      btn: { save: "บันทึกข้อมูล", back: "ย้อนกลับ", saving: "กำลังบันทึก..." },
    },
  }[language || "en"];

  // --- Initialize State ---
  useEffect(() => {
    if (product) {
      setName(product.name || "");
      setNameThai(product.nameThai || "");
      setProductCode(product.productCode || "");
      setPrice(product.price || 0);
      setImage(product.image || "");
      setBrand(product.brand || "");
      setBrandThai(product.brandThai || "");
      setCategory(product.category || "");
      setCategoryThai(product.categoryThai || "");
      setCountInStock(product.countInStock || 0);
      setDescription(product.description || "");
      setDescriptionThai(product.descriptionThai || "");
      setVideoLink(product.videoLink || "");
    }
  }, [product]);

  // --- Handlers ---
  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      await updateProduct({
        productId,
        name,
        nameThai,
        productCode,
        price,
        image,
        brand,
        brandThai,
        category,
        categoryThai,
        countInStock,
        description,
        descriptionThai,
        videoLink,
      }).unwrap();
      toast.success("Product updated successfully");
      navigate("/admin/productlist");
    } catch (err) {
      toast.error(err?.data?.message || err.error || "Failed to update");
    }
  };

  const uploadFileHandler = async (e) => {
    if (!e.target.files[0]) return;
    const formData = new FormData();
    formData.append("image", e.target.files[0]);
    try {
      const res = await uploadProductImage(formData).unwrap();
      setImage(res.image);
      toast.success("Image uploaded!");
    } catch (err) {
      toast.error(err?.data?.message || "Upload failed");
    }
  };

  // --- Utility Component for Form Card ---
  const FormCard = ({ title, icon: Icon, colorClass, children, delay = 0 }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-4 md:p-8 mb-8"
    >
      <div className="flex items-center gap-3 mb-8">
        <div
          className={`w-10 h-10 rounded-2xl ${colorClass} bg-opacity-10 flex items-center justify-center text-lg`}
        >
          <Icon className={colorClass.replace("bg-", "text-")} />
        </div>
        <h5 className="mb-0 text-xl font-black text-slate-800 tracking-tight">
          {title}
        </h5>
      </div>
      {children}
    </motion.div>
  );

  return (
    <div className="bg-slate-50 min-h-screen pb-20 selection:bg-indigo-100">
      {/* --- Sticky Header --- */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm transition-all duration-300 py-4 mb-4">
        <div className="container max-w-7xl mx-auto px-4 d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-4">
            <Link
              to="/admin/productlist"
              className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-900 hover:text-white transition-all duration-300"
            >
              <FaArrowLeft size={14} />
            </Link>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 mb-0 tracking-tight">
                {t.title}
              </h1>
              <span className="text-xs text-slate-400 font-bold uppercase tracking-widest hidden md:block">
                ID: {productId}
              </span>
            </div>
          </div>

          <div className="d-flex align-items-center gap-3">
            <button
              onClick={() => navigate("/admin/productlist")}
              className="px-4 md:px-6 py-2 rounded-full border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all hidden md:block"
            >
              Cancel
            </button>
            <Button
              form="product-form"
              type="submit"
              className="bg-slate-900 border-0 text-white px-4 md:px-8 py-2.5 rounded-full font-black text-sm shadow-xl shadow-slate-900/10 hover:bg-indigo-600 hover:scale-105 active:scale-95 transition-all d-flex align-items-center gap-2"
              disabled={loadingUpdate}
            >
              <FaSave />
              {loadingUpdate ? t.btn.saving : t.btn.save}
            </Button>
          </div>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 mt-8">
        {isLoading ? (
          <div className="min-h-[60vh] flex items-center justify-center">
            <Loader size="50px" />
          </div>
        ) : error ? (
          <div className="max-w-2xl mx-auto py-20 text-center">
            <Message variant="danger">
              {error?.data?.message || "Something went wrong"}
            </Message>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Reload
            </Button>
          </div>
        ) : (
          <Form id="product-form" onSubmit={submitHandler}>
            <Row className="gx-8">
              {/* --- Left Track: Content --- */}
              <Col lg={7}>
                {/* 1. English Info */}
                <FormCard
                  title={t.sections.basic}
                  icon={FaInfoCircle}
                  colorClass="bg-indigo-500"
                  delay={0.1}
                >
                  <Form.Group className="mb-6">
                    <Form.Label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                      {t.lbl.name}
                    </Form.Label>
                    <Form.Control
                      type="text"
                      className="rounded-2xl border-slate-200 py-3 px-4 font-medium focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-6">
                    <Form.Label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                      Product Code / SKU
                    </Form.Label>
                    <Form.Control
                      type="text"
                      className="rounded-2xl border-slate-200 py-3 px-4 font-medium focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all bg-slate-50 border-transparent focus:bg-white"
                      value={productCode}
                      onChange={(e) => setProductCode(e.target.value)}
                      required
                    />
                  </Form.Group>
                  <Form.Group>
                    <Form.Label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                      {t.lbl.desc}
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={6}
                      className="rounded-2xl border-slate-200 py-3 px-4 font-medium focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </Form.Group>
                </FormCard>

                {/* 2. Thai Info */}
                <FormCard
                  title={t.sections.basicThai}
                  icon={FaLanguage}
                  colorClass="bg-red-500"
                  delay={0.2}
                >
                  <Form.Group className="mb-6">
                    <Form.Label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                      {t.lbl.name} (TH)
                    </Form.Label>
                    <Form.Control
                      type="text"
                      className="rounded-2xl border-slate-200 py-3 px-4 font-medium focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all"
                      value={nameThai}
                      onChange={(e) => setNameThai(e.target.value)}
                    />
                  </Form.Group>
                  <Form.Group>
                    <Form.Label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                      {t.lbl.desc} (TH)
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={6}
                      className="rounded-2xl border-slate-200 py-3 px-4 font-medium focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all"
                      value={descriptionThai}
                      onChange={(e) => setDescriptionThai(e.target.value)}
                    />
                  </Form.Group>
                </FormCard>

                {/* 3. Pricing & Inventory */}
                <FormCard
                  title={t.sections.pricing}
                  icon={FaMoneyBillWave}
                  colorClass="bg-green-500"
                  delay={0.3}
                >
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-6">
                        <Form.Label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                          {t.lbl.price}
                        </Form.Label>
                        <div className="relative group">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 group-hover:text-green-600 transition-colors">
                            ฿
                          </span>
                          <Form.Control
                            type="number"
                            className="rounded-2xl border-slate-200 py-3 pl-10 pr-4 font-bold text-lg focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            required
                          />
                        </div>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-6">
                        <Form.Label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                          {t.lbl.stock}
                        </Form.Label>
                        <div className="relative">
                          <FaWarehouse className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <Form.Control
                            type="number"
                            className="rounded-2xl border-slate-200 py-3 pl-10 pr-4 font-bold text-lg focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all"
                            value={countInStock}
                            onChange={(e) => setCountInStock(e.target.value)}
                            required
                          />
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>
                </FormCard>
              </Col>

              {/* --- Right Track: Media & Meta --- */}
              <Col lg={5}>
                {/* A. Media Wrapper */}
                <FormCard
                  title={t.sections.media}
                  icon={FaImage}
                  colorClass="bg-amber-500"
                  delay={0.4}
                >
                  <div className="relative group mb-8">
                    <div className="aspect-square rounded-3xl overflow-hidden bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center transition-all group-hover:border-amber-400">
                      {image ? (
                        <Image
                          src={image}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-center p-4 md:p-8">
                          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                            <FaImage className="text-slate-300 text-2xl" />
                          </div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            No Photo Selected
                          </p>
                        </div>
                      )}

                      {loadingUpload && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                          <Loader size="30px" />
                        </div>
                      )}
                    </div>
                  </div>

                  <Form.Group className="mb-6">
                    <Form.Label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                      {t.lbl.upload}
                    </Form.Label>
                    <div className="relative">
                      <Form.Control
                        type="file"
                        className="hidden"
                        id="image-upload"
                        onChange={uploadFileHandler}
                      />
                      <label
                        htmlFor="image-upload"
                        className="w-full h-14 rounded-2xl border-2 border-slate-100 bg-slate-50 flex items-center justify-center cursor-pointer hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all duration-300 font-bold text-sm"
                      >
                        Choose File
                      </label>
                    </div>
                  </Form.Group>

                  <Form.Group>
                    <Form.Label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                      {t.lbl.video}
                    </Form.Label>
                    <div className="relative group">
                      <FaVideo className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-amber-500 transition-colors" />
                      <Form.Control
                        type="text"
                        className="rounded-2xl border-slate-200 py-3 pl-10 pr-4 font-medium focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all bg-slate-50 border-transparent focus:bg-white"
                        value={videoLink}
                        onChange={(e) => setVideoLink(e.target.value)}
                        placeholder="e.g., https://youtube.com/watch?v=..."
                      />
                    </div>
                  </Form.Group>
                </FormCard>

                {/* B. Category & Brand Wrapper */}
                <FormCard
                  title={t.sections.category}
                  icon={FaTags}
                  colorClass="bg-sky-500"
                  delay={0.5}
                >
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-6">
                        <Form.Label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                          {t.lbl.brand} (EN)
                        </Form.Label>
                        <Form.Control
                          type="text"
                          className="rounded-2xl border-slate-200 py-3 px-4 font-medium focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all"
                          value={brand}
                          onChange={(e) => setBrand(e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-6">
                        <Form.Label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                          {t.lbl.brand} (TH)
                        </Form.Label>
                        <Form.Control
                          type="text"
                          className="rounded-2xl border-slate-200 py-3 px-4 font-medium focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all"
                          value={brandThai}
                          onChange={(e) => setBrandThai(e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-6">
                        <Form.Label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                          {t.lbl.category} (EN)
                        </Form.Label>
                        <Form.Control
                          type="text"
                          className="rounded-2xl border-slate-200 py-3 px-4 font-medium focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-6">
                        <Form.Label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                          {t.lbl.category} (TH)
                        </Form.Label>
                        <Form.Control
                          type="text"
                          className="rounded-2xl border-slate-200 py-3 px-4 font-medium focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all"
                          value={categoryThai}
                          onChange={(e) => setCategoryThai(e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </FormCard>
              </Col>
            </Row>
          </Form>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        body { font-family: 'Prompt', sans-serif !important; }
        .form-control:focus { outline: none; opacity: 1; }
        .hidden { display: none; }
      ` }} />
    </div>
  );
};

export default ProductEditScreen;
