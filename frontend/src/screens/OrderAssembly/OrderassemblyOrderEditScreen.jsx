import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Card,
  ListGroup,
  Image,
  ButtonGroup,
  ToggleButton,
  Badge,
  InputGroup,
} from "react-bootstrap";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaSave,
  FaCheckCircle,
  FaTimesCircle,
  FaFileArchive,
  FaImages,
  FaCalculator,
} from "react-icons/fa";
import Loader from "../../components/Loader";
import Message from "../../components/Message";
import {
  useUploadGerberAssemblyZipMutation,
  useUploadAssemblyMultipleImagesMutation,
  useGetAssemblycartDefaultQuery,
} from "../../slices/assemblypcbCartApiSlice";
import {
  useGetAssemblyPCBByIdQuery,
  useUpdateAssemblyPCBMutation,
} from "../../slices/assemblypcbApiSlice";
import { BASE_URL as APP_BASE_URL } from "../../constants";

const OrderassemblyOrderEditScreen = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { userInfo } = useSelector((state) => state.auth);
  const { language } = useSelector((state) => state.language);

  // API Hooks
  const [updateAssemblyPCB, { isLoading: isUpdating }] =
    useUpdateAssemblyPCBMutation();
  const [uploadGerberZip] = useUploadGerberAssemblyZipMutation();
  const [uploadAssemblyMultipleImages] =
    useUploadAssemblyMultipleImagesMutation();
  const { data, isLoading: isFetchingDefault } =
    useGetAssemblycartDefaultQuery();
  const { data: configData, isLoading: isFetchingConfig } =
    useGetAssemblyPCBByIdQuery(id);

  const defaultData = data?.data;

  // Local State
  const [showSMDFields, setShowSMDFields] = useState(false);
  const [showTHTFields, setShowTHTFields] = useState(false);
  const [stencilPrice, setStencilPrice] = useState(2500);
  const [topImages, setTopImages] = useState([]);
  const [bottomImages, setBottomImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const getFullUrl = (pathInput) => {
    if (!pathInput) return null;
    const path =
      typeof pathInput === "object"
        ? pathInput.path || pathInput.url
        : pathInput;
    if (!path || typeof path !== "string") return null;

    if (path.startsWith("http")) return path;
    let normalizedPath = path.replace(/\\/g, "/");
    if (!normalizedPath.startsWith("/")) {
      normalizedPath = "/" + normalizedPath;
    }
    const baseUrl =
      process.env.NODE_ENV === "development"
        ? "http://localhost:5000"
        : APP_BASE_URL || "";
    return `${baseUrl}${normalizedPath}`;
  };

  // Form Data
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
    smd_price: 0,
    tht_price: 0,
    setup_price: 0,
    delievery_price: 0,
    stencil_price: 0,
    confirmed_price: "",
    confirmed_reason: "",
    status: "", // Track current status
    // User & Shipping Info
    userName: "",
    userEmail: "",
    billingName: "",
    billingPhone: "",
    billinggAddress: "",
    billingCity: "",
    billingPostalCode: "",
    billingCountry: "",
    billingTax: "",
    shippingName: "",
    shippingPhone: "",
    shippingAddress: "",
    shippingCity: "",
    shippingPostalCode: "",
    shippingCountry: "",
  });

  // Calculations
  const qty = parseFloat(formData.pcb_qty) || 0;
  const smdPins = showSMDFields ? parseFloat(formData.total_point_smd) || 0 : 0;
  const thtPins = showTHTFields ? parseFloat(formData.total_point_tht) || 0 : 0;
  const smdCost = smdPins * (parseFloat(formData.smd_price) || 0);
  const thtCost = thtPins * (parseFloat(formData.tht_price) || 0);
  const totalCost =
    qty * (smdCost + thtCost) +
    stencilPrice +
    (parseFloat(formData.setup_price) || 0) +
    (parseFloat(formData.delievery_price) || 0);

  // Translations
  const translations = {
    en: {
      title: "Edit Assembly Order",
      projectInfo: "Project Information",
      specs: "Technical Specifications",
      files: "Files & Images",
      adminAction: "Admin Actions",
      financials: "Financial Summary",
      btnApprove: "Approve Order",
      btnReject: "Reject Order",
      btnSave: "Save Changes",
      lblConfirmPrice: "Confirmed Price",
      lblReason: "Reason / Admin Note",
      placeholderReason: "Required for rejection...",
      estCost: "Estimated Cost",
      stencil: "Stencil",
      setup: "Setup",
      delivery: "Delivery",
      status: "Current Status",
    },
    thai: {
      title: "แก้ไขคำสั่งซื้อ Assembly",
      projectInfo: "ข้อมูลโปรเจกต์",
      specs: "ข้อมูลทางเทคนิค",
      files: "ไฟล์และรูปภาพ",
      adminAction: "การจัดการ (Admin)",
      financials: "สรุปยอดเงิน",
      btnApprove: "อนุมัติคำสั่งซื้อ",
      btnReject: "ปฏิเสธคำสั่งซื้อ",
      btnSave: "บันทึกการแก้ไข",
      lblConfirmPrice: "ราคาที่ยืนยัน (บาท)",
      lblReason: "เหตุผล / หมายเหตุ Admin",
      placeholderReason: "ระบุเหตุผลหากต้องการปฏิเสธ...",
      estCost: "ราคาประเมินโดยระบบ",
      stencil: "ค่า Stencil",
      setup: "ค่า Setup",
      delivery: "ค่าจัดส่ง",
      status: "สถานะปัจจุบัน",
    },
  };
  const t = translations[language] || translations.en;

  // Effects
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
    const stencilBase = parseFloat(formData.stencil_price || 0);
    if (!showSMDFields) setStencilPrice(stencilBase);
    else if (formData.smd_side === "Both") setStencilPrice(stencilBase * 2);
    else setStencilPrice(stencilBase);
  }, [formData.smd_side, showSMDFields, formData.stencil_price]);

  useEffect(() => {
    if (configData?.success && configData.data) {
      const d = configData.data;
      setFormData((prev) => ({
        ...prev,
        ...d,
        gerber_zip: d.gerber_zip || null,
        confirmed_price: d.confirmed_price || "",
        confirmed_reason: d.confirmed_reason || "",
      }));

      if (parseInt(d.count_smd) > 0 || parseInt(d.total_point_smd) > 0)
        setShowSMDFields(true);
      if (parseInt(d.count_tht) > 0 || parseInt(d.total_point_tht) > 0)
        setShowTHTFields(true);

      const mapImages = (prefix) => {
        const imgs = [];
        for (let i = 1; i <= 10; i++) {
          if (d[`${prefix}_${i}`]) {
            imgs.push({
              url: getFullUrl(d[`${prefix}_${i}`]),
              raw: d[`${prefix}_${i}`],
              file: null,
            });
          }
        }
        return imgs;
      };
      setTopImages(mapImages("image_top"));
      setBottomImages(mapImages("image_bottom"));
    }
  }, [configData]);

  // Handlers
  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file")
      setFormData((prev) => ({ ...prev, zipFile: files[0] || null }));
    else setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e, side) => {
    const files = Array.from(e.target.files);
    const newImages = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    if (side === "top") setTopImages((prev) => [...prev, ...newImages]);
    else setBottomImages((prev) => [...prev, ...newImages]);
  };

  const removeImage = (idx, side) => {
    if (side === "top")
      setTopImages((prev) => prev.filter((_, i) => i !== idx));
    else setBottomImages((prev) => prev.filter((_, i) => i !== idx));
  };

  // Upload Logic
  const uploadImages = async (images) => {
    const form = new FormData();
    const newFiles = images.filter((img) => img.file);
    if (newFiles.length === 0) return images.map((img) => img.raw || img.url); // Return existing paths directly
    newFiles.forEach((img) => form.append("images", img.file));
    const res = await uploadAssemblyMultipleImages(form).unwrap();

    // Merge existing (old) paths with new uploaded paths
    const oldPaths = images
      .filter((img) => !img.file)
      .map((img) => img.raw || img.url);
    const newPaths = (res?.images || []).map((img) =>
      typeof img === "string" ? img : img.path,
    );
    return [...oldPaths, ...newPaths];
  };

  const uploadZip = async () => {
    if (!formData.zipFile) return formData.gerber_zip;
    const form = new FormData();
    form.append("gerberZip", formData.zipFile);
    const res = await uploadGerberZip(form).unwrap();
    return res.path;
  };

  // Main Submit Function
  const submitAction = async (newStatus) => {
    setLoading(true);
    try {
      // Validation Logic
      if (newStatus === "accepted") {
        if (
          !formData.confirmed_price ||
          parseFloat(formData.confirmed_price) <= 0
        ) {
          toast.error("Please enter a valid Confirmed Price to approve.");
          setLoading(false);
          return;
        }
      }

      if (newStatus === "rejected") {
        if (
          !formData.confirmed_reason ||
          formData.confirmed_reason.trim() === ""
        ) {
          toast.error("Please enter a Reason to reject this order.");
          setLoading(false);
          return;
        }
      }

      // Uploads
      const [zipPath, topPaths, bottomPaths] = await Promise.all([
        uploadZip(),
        uploadImages(topImages),
        uploadImages(bottomImages),
      ]);

      const payload = {
        ...formData,
        status: newStatus || formData.status, // Update status if provided
        smd_side: showSMDFields ? formData.smd_side : "",
        count_smd: showSMDFields ? formData.count_smd : 0,
        total_point_smd: showSMDFields ? formData.total_point_smd : 0,
        tht_side: showTHTFields ? formData.tht_side : "",
        count_tht: showTHTFields ? formData.count_tht : 0,
        total_point_tht: showTHTFields ? formData.total_point_tht : 0,
        stencil_price: stencilPrice,
        gerber_zip: zipPath,
        image_tops: topPaths,
        image_bottoms: bottomPaths,
        estimatedCost: totalCost,
        // If rejecting, we might want to clear price or keep it as 0/history
        confirmed_price:
          newStatus === "rejected" ? 0 : formData.confirmed_price,
      };

      await updateAssemblyPCB({ id, updatedData: payload }).unwrap();
      toast.success(
        `Order ${newStatus === "accepted" ? "Approved" : newStatus === "rejected" ? "Rejected" : "Saved"} Successfully!`,
      );
      navigate("/admin/orderassemblypcbeditlist"); // Adjust path as needed
    } catch (err) {
      console.error(err);
      toast.error(err?.data?.message || "Error updating order");
    } finally {
      setLoading(false);
    }
  };

  if (loading || isFetchingConfig || isFetchingDefault || isUpdating)
    return <Loader />;

  return (
    <Container className="py-4 font-prompt">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0 fw-bold text-primary">
          <FaCalculator className="me-2" />
          {t.title}
        </h2>
        <Badge
          bg={
            formData.status === "accepted"
              ? "success"
              : formData.status === "rejected"
                ? "danger"
                : "warning"
          }
          className="fs-6"
        >
          {formData.status?.toUpperCase() || "PENDING"}
        </Badge>
      </div>

      <Form>
        <Row className="g-4">
          {/* LEFT COLUMN: SPECS */}
          <Col lg={8}>
            {/* 1. Project Info */}
            <Card className="shadow-sm border-0 rounded-4 mb-4">
              <Card.Header className="bg-white border-bottom-0 pt-4 px-4">
                <h5 className="fw-bold">{t.projectInfo}</h5>
              </Card.Header>
              <Card.Body className="px-4 pb-4">
                <Row className="g-3">
                  <Col md={8}>
                    <Form.Group>
                      <Form.Label className="text-muted small mb-1">
                        {t.projectnamelbl}
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="projectname"
                        value={formData.projectname}
                        onChange={handleChange}
                        required
                        className="fw-bold"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="text-muted small mb-1">
                        {t.qtylbl}
                      </Form.Label>
                      <Form.Control
                        type="number"
                        name="pcb_qty"
                        value={formData.pcb_qty}
                        onChange={handleChange}
                        min="1"
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* 2. Technical Specs */}
            <Card className="shadow-sm border-0 rounded-4 mb-4">
              <Card.Header className="bg-white border-bottom-0 pt-4 px-4">
                <h5 className="fw-bold">{t.specs}</h5>
              </Card.Header>
              <Card.Body className="px-4 pb-4">
                <Row className="g-3 mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="text-muted small mb-1">
                        {t.width}
                      </Form.Label>
                      <InputGroup>
                        <Form.Control
                          type="number"
                          name="width_mm"
                          value={formData.width_mm}
                          onChange={handleChange}
                        />
                        <InputGroup.Text>mm</InputGroup.Text>
                      </InputGroup>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="text-muted small mb-1">
                        {t.height}
                      </Form.Label>
                      <InputGroup>
                        <Form.Control
                          type="number"
                          name="high_mm"
                          value={formData.high_mm}
                          onChange={handleChange}
                        />
                        <InputGroup.Text>mm</InputGroup.Text>
                      </InputGroup>
                    </Form.Group>
                  </Col>
                </Row>

                <hr className="my-4 text-muted opacity-25" />

                {/* SMD Section */}
                <div className="mb-4">
                  <Form.Check
                    type="switch"
                    id="toggleSMD"
                    label={<strong>{t.includeSMD}</strong>}
                    checked={showSMDFields}
                    onChange={() => setShowSMDFields(!showSMDFields)}
                    className="mb-3 fs-5"
                  />
                  {showSMDFields && (
                    <div className="bg-light p-3 rounded-3">
                      <Row className="g-3">
                        <Col md={4}>
                          <Form.Label className="small">{t.smdSide}</Form.Label>
                          <ButtonGroup className="w-100">
                            {["Top", "Bottom", "Both"].map((side, idx) => (
                              <ToggleButton
                                key={idx}
                                id={`smd-${side}`}
                                type="radio"
                                variant="outline-primary"
                                name="smd_side"
                                value={side}
                                checked={formData.smd_side === side}
                                onChange={handleChange}
                                size="sm"
                              >
                                {side}
                              </ToggleButton>
                            ))}
                          </ButtonGroup>
                        </Col>
                        <Col md={4}>
                          <Form.Label className="small">
                            {t.smdCount}
                          </Form.Label>
                          <Form.Control
                            type="number"
                            name="count_smd"
                            value={formData.count_smd}
                            onChange={handleChange}
                            size="sm"
                          />
                        </Col>
                        <Col md={4}>
                          <Form.Label className="small">{t.smdPins}</Form.Label>
                          <Form.Control
                            type="number"
                            name="total_point_smd"
                            value={formData.total_point_smd}
                            onChange={handleChange}
                            size="sm"
                          />
                        </Col>
                      </Row>
                    </div>
                  )}
                </div>

                {/* THT Section */}
                <div>
                  <Form.Check
                    type="switch"
                    id="toggleTHT"
                    label={<strong>{t.includeTHT}</strong>}
                    checked={showTHTFields}
                    onChange={() => setShowTHTFields(!showTHTFields)}
                    className="mb-3 fs-5"
                  />
                  {showTHTFields && (
                    <div className="bg-light p-3 rounded-3">
                      <Row className="g-3">
                        <Col md={4}>
                          <Form.Label className="small">{t.thtSide}</Form.Label>
                          <ButtonGroup className="w-100">
                            {["Top", "Bottom", "Both"].map((side, idx) => (
                              <ToggleButton
                                key={idx}
                                id={`tht-${side}`}
                                type="radio"
                                variant="outline-primary"
                                name="tht_side"
                                value={side}
                                checked={formData.tht_side === side}
                                onChange={handleChange}
                                size="sm"
                              >
                                {side}
                              </ToggleButton>
                            ))}
                          </ButtonGroup>
                        </Col>
                        <Col md={4}>
                          <Form.Label className="small">
                            {t.thtCount}
                          </Form.Label>
                          <Form.Control
                            type="number"
                            name="count_tht"
                            value={formData.count_tht}
                            onChange={handleChange}
                            size="sm"
                          />
                        </Col>
                        <Col md={4}>
                          <Form.Label className="small">{t.thtPins}</Form.Label>
                          <Form.Control
                            type="number"
                            name="total_point_tht"
                            value={formData.total_point_tht}
                            onChange={handleChange}
                            size="sm"
                          />
                        </Col>
                      </Row>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>

            {/* 3. Files */}
            <Card className="shadow-sm border-0 rounded-4 mb-4">
              <Card.Header className="bg-white border-bottom-0 pt-4 px-4">
                <h5 className="fw-bold">{t.files}</h5>
              </Card.Header>
              <Card.Body className="px-4 pb-4">
                <Row className="g-4">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold small">
                        <FaImages className="me-1" /> {t.topImages}
                      </Form.Label>
                      <Form.Control
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, "top")}
                        size="sm"
                      />
                      <div className="d-flex flex-wrap mt-2 gap-2">
                        {topImages.map((img, idx) => (
                          <div key={idx} className="position-relative">
                            <Image
                              src={img.url}
                              thumbnail
                              style={{
                                width: "60px",
                                height: "60px",
                                objectFit: "cover",
                              }}
                            />
                            <FaTimesCircle
                              className="text-danger position-absolute top-0 end-0 bg-white rounded-circle"
                              style={{ cursor: "pointer" }}
                              onClick={() => removeImage(idx, "top")}
                            />
                          </div>
                        ))}
                      </div>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold small">
                        <FaImages className="me-1" /> {t.bottomImages}
                      </Form.Label>
                      <Form.Control
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, "bottom")}
                        size="sm"
                      />
                      <div className="d-flex flex-wrap mt-2 gap-2">
                        {bottomImages.map((img, idx) => (
                          <div key={idx} className="position-relative">
                            <Image
                              src={img.url}
                              thumbnail
                              style={{
                                width: "60px",
                                height: "60px",
                                objectFit: "cover",
                              }}
                            />
                            <FaTimesCircle
                              className="text-danger position-absolute top-0 end-0 bg-white rounded-circle"
                              style={{ cursor: "pointer" }}
                              onClick={() => removeImage(idx, "bottom")}
                            />
                          </div>
                        ))}
                      </div>
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="fw-bold small">
                        <FaFileArchive className="me-1" /> {t.zipFile}
                      </Form.Label>
                      <Form.Control
                        type="file"
                        accept=".zip,.rar"
                        onChange={handleChange}
                        size="sm"
                      />
                      {formData.gerber_zip && (
                        <div className="mt-1 small">
                          Current:{" "}
                          <a
                            href={getFullUrl(
                              typeof formData.gerber_zip === "string"
                                ? formData.gerber_zip
                                : formData.gerber_zip.name,
                            )}
                            target="_blank"
                            rel="noreferrer"
                            className="text-decoration-none"
                          >
                            {typeof formData.gerber_zip === "string"
                              ? formData.gerber_zip.split("/").pop()
                              : formData.gerber_zip.name}
                          </a>
                        </div>
                      )}
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>

          {/* RIGHT COLUMN: ACTIONS & FINANCE */}
          <Col lg={4}>
            <div className="sticky-top" style={{ top: "20px", zIndex: 10 }}>
              {/* Financial Summary */}
              <Card className="shadow-sm border-0 rounded-4 mb-4 bg-light">
                <Card.Body className="p-4">
                  <h5 className="fw-bold mb-3">{t.financials}</h5>
                  <ListGroup variant="flush" className="bg-transparent">
                    <ListGroup.Item className="d-flex justify-content-between bg-transparent px-0 py-2 border-dashed">
                      <span className="text-muted">{t.stencil}</span>
                      <span>{stencilPrice.toLocaleString()} ฿</span>
                    </ListGroup.Item>
                    <ListGroup.Item className="d-flex justify-content-between bg-transparent px-0 py-2 border-dashed">
                      <span className="text-muted">SMD Cost</span>
                      <span>{(smdCost * qty).toLocaleString()} ฿</span>
                    </ListGroup.Item>
                    <ListGroup.Item className="d-flex justify-content-between bg-transparent px-0 py-2 border-dashed">
                      <span className="text-muted">THT Cost</span>
                      <span>{(thtCost * qty).toLocaleString()} ฿</span>
                    </ListGroup.Item>
                    <ListGroup.Item className="d-flex justify-content-between bg-transparent px-0 py-2 border-dashed">
                      <span className="text-muted">{t.delivery}</span>
                      <span>{formData.delievery_price} ฿</span>
                    </ListGroup.Item>
                    <ListGroup.Item className="d-flex justify-content-between bg-white rounded-3 px-3 py-3 mt-2 shadow-sm">
                      <strong className="text-primary">{t.estCost}</strong>
                      <strong className="fs-5">
                        {totalCost.toLocaleString()} ฿
                      </strong>
                    </ListGroup.Item>
                  </ListGroup>
                </Card.Body>
              </Card>

              {/* ADMIN ACTIONS */}
              <Card className="shadow border-0 rounded-4 border-top border-5 border-primary">
                <Card.Body className="p-4">
                  <h5 className="fw-bold mb-4 text-center">{t.adminAction}</h5>

                  {/* Approve Section */}
                  <div className="mb-4">
                    <Form.Label className="fw-bold text-success small">
                      {t.lblConfirmPrice}
                    </Form.Label>
                    <InputGroup className="mb-2">
                      <InputGroup.Text className="bg-success text-white border-0">
                        ฿
                      </InputGroup.Text>
                      <Form.Control
                        type="number"
                        name="confirmed_price"
                        value={formData.confirmed_price}
                        onChange={handleChange}
                        placeholder="0.00"
                        className="fw-bold text-end"
                      />
                    </InputGroup>
                    <Button
                      variant="success"
                      className="w-100 rounded-pill fw-bold"
                      onClick={() => submitAction("accepted")}
                    >
                      <FaCheckCircle className="me-2" /> {t.btnApprove}
                    </Button>
                  </div>

                  <hr className="my-4" />

                  {/* Reject Section */}
                  <div className="mb-4">
                    <Form.Label className="fw-bold text-danger small">
                      {t.lblReason}
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="confirmed_reason"
                      value={formData.confirmed_reason}
                      onChange={handleChange}
                      placeholder={t.placeholderReason}
                      className="mb-2 bg-light"
                    />
                    <Button
                      variant="outline-danger"
                      className="w-100 rounded-pill fw-bold"
                      onClick={() => submitAction("rejected")}
                    >
                      <FaTimesCircle className="me-2" /> {t.btnReject}
                    </Button>
                  </div>

                  {/* Save Draft */}
                  <Button
                    variant="light"
                    className="w-100 rounded-pill text-muted small"
                    onClick={() => submitAction(formData.status)}
                  >
                    <FaSave className="me-1" /> {t.btnSave} (No Status Change)
                  </Button>
                </Card.Body>
              </Card>
            </div>
          </Col>
        </Row>
      </Form>

      <style>{`
        .font-prompt { font-family: 'Prompt', sans-serif; }
        .border-dashed { border-bottom: 1px dashed #dee2e6; }
      `}</style>
    </Container>
  );
};

export default OrderassemblyOrderEditScreen;
