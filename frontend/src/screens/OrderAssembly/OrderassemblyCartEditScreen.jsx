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
  Alert,
} from "react-bootstrap";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaSave,
  FaCheckCircle,
  FaTimesCircle,
  FaFileArchive,
  FaCalculator,
  FaExclamationTriangle,
} from "react-icons/fa";
import Loader from "../../components/Loader";

import {
  useGetAssemblycartByIdQuery,
  useUpdateAssemblycartMutation,
  useUploadGerberAssemblyZipMutation,
  useUploadAssemblyMultipleImagesMutation,
  useGetAssemblycartDefaultQuery,
} from "../../slices/assemblypcbCartApiSlice";
import { BASE_URL as APP_BASE_URL } from "../../constants";

const OrderassemblyCartEditScreen = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { userInfo } = useSelector((state) => state.auth);
  const { language } = useSelector((state) => state.language);

  // --- API Hooks ---
  const [updateAssemblycart, { isLoading: isUpdating }] =
    useUpdateAssemblycartMutation();
  const [uploadGerberZip] = useUploadGerberAssemblyZipMutation();
  const [uploadAssemblyMultipleImages] =
    useUploadAssemblyMultipleImagesMutation();
  const { data, isLoading: isFetchingDefault } =
    useGetAssemblycartDefaultQuery();
  const {
    data: configData,
    isLoading: isFetchingConfig,
    refetch,
  } = useGetAssemblycartByIdQuery(id);

  const defaultData = data?.data;

  // --- State ---
  const [status, setStatus] = useState("");
  const [showSMDFields, setShowSMDFields] = useState(false);
  const [showTHTFields, setShowTHTFields] = useState(false);
  const [stencilPrice, setStencilPrice] = useState(2500);
  const [topImages, setTopImages] = useState([]);
  const [bottomImages, setBottomImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alreadyHaveStencil, setAlreadyHaveStencil] = useState(false);

  // Validation States
  const [confirmProjectName, setConfirmProjectName] = useState(true);
  const [confirmQty, setConfirmQty] = useState(true);
  const [confirmBoardType, setConfirmBoardType] = useState(true);
  const [confirmTotalColumns, setConfirmTotalColumns] = useState(true);
  const [confirmTotalRows, setConfirmTotalRows] = useState(true);
  const [confirmWidth, setConfirmWidth] = useState(true);
  const [confirmHeight, setConfirmHeight] = useState(true);
  const [confirmSmdSide, setConfirmSmdSide] = useState(true);
  const [confirmCountSmd, setConfirmCountSmd] = useState(true);
  const [confirmTotalPointSmd, setConfirmTotalPointSmd] = useState(true);
  const [confirmThtSide, setConfirmThtSide] = useState(true);
  const [confirmCountTht, setConfirmCountTht] = useState(true);
  const [confirmTotalPointTht, setConfirmTotalPointTht] = useState(true);
  const [confirmNotes, setConfirmNotes] = useState(true);

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
    smd_side: "top",
    tht_side: "bottom",
    gerber_zip: null,
    notes: "",
    zipFile: null,
    smd_price: 0,
    tht_price: 0,
    setup_price: 0,
    delievery_price: 0,
    confirmed_price: "",
    adminNotes: "",
  });

  // --- Translations ---
  const translations = {
    en: {
      title: "Review Assembly Order",
      projectInfo: "Project Details",
      specs: "Specifications",
      files: "Files & Images",
      financials: "Financial Summary",
      adminAction: "Admin Decision",
      btnApprove: "Approve",
      btnReject: "Reject",
      btnSave: "Save",
      lblConfirmPrice: "Confirmed Price",
      lblReason: "Admin Notes / Reject Reason",
      stencil: "Stencil",
      smdCost: "SMD Cost",
      thtCost: "THT Cost",
      vat: "VAT (7%)",
      total: "Total Estimate",
      correct: "Correct",
      check: "Check",
      alertUnconfirmed: "Please review unconfirmed fields:",
    },
    thai: {
      title: "ตรวจสอบคำสั่งซื้อ Assembly",
      projectInfo: "รายละเอียดโปรเจกต์",
      specs: "ข้อมูลทางเทคนิค",
      files: "ไฟล์และรูปภาพ",
      financials: "สรุปยอดเงิน",
      adminAction: "การตัดสินใจ (Admin)",
      btnApprove: "อนุมัติ",
      btnReject: "ปฏิเสธ",
      btnSave: "บันทึก",
      lblConfirmPrice: "ราคาที่ยืนยัน (บาท)",
      lblReason: "หมายเหตุ Admin / สาเหตุที่ปฏิเสธ",
      stencil: "ค่า Stencil",
      smdCost: "ค่าประกอบ SMD",
      thtCost: "ค่าประกอบ THT",
      vat: "ภาษี (7%)",
      total: "ยอดรวมประเมิน",
      correct: "ถูกต้อง",
      check: "ตรวจสอบ",
      alertUnconfirmed: "รายการที่ยังไม่ได้ยืนยันความถูกต้อง:",
    },
  };
  const t = translations[language] || translations.en;

  // --- Calculations ---
  const qty = parseFloat(formData.pcb_qty) || 0;
  const smdPins = showSMDFields ? parseFloat(formData.total_point_smd) || 0 : 0;
  const thtPins = showTHTFields ? parseFloat(formData.total_point_tht) || 0 : 0;

  const smdCost = smdPins * (parseFloat(formData.smd_price) || 0);
  const thtCost = thtPins * (parseFloat(formData.tht_price) || 0);
  const setupPrice = parseFloat(formData.setup_price) || 0;
  const deliveryPrice = parseFloat(formData.delievery_price) || 0;

  let vatPrice = 0;
  let totalCost = 0;

  if (smdCost > 0 || thtCost > 0) {
    vatPrice = (qty * (smdCost + thtCost) + stencilPrice) * 0.07;
    let low_totalCost =
      qty * (smdCost + thtCost) + stencilPrice + deliveryPrice + vatPrice;
    totalCost = low_totalCost < setupPrice ? setupPrice : low_totalCost;
  }

  // --- Effects ---
  useEffect(() => {
    if (defaultData) {
      setFormData((prev) => ({
        ...prev,
        smd_price: defaultData.smd_price,
        tht_price: defaultData.tht_price,
        setup_price: defaultData.setup_price,
        delievery_price: defaultData.delivery_price,
      }));
    }
  }, [defaultData]);

  useEffect(() => {
    const stencilBase = parseFloat(defaultData?.stencil_price || 2500);
    if (alreadyHaveStencil || !showSMDFields) setStencilPrice(0);
    else if (formData.smd_side === "Both") setStencilPrice(stencilBase * 2);
    else setStencilPrice(stencilBase);
  }, [formData.smd_side, showSMDFields, alreadyHaveStencil, defaultData]);

  //  ฟังก์ชันช่วยสร้างลิงก์ Download Zip ให้ถูกต้อง (แก้ปัญหาโหลดไม่ได้)
  const getZipDownloadLink = (path) => {
    if (!path || typeof path !== "string") return "#";

    // ถ้า path มีคำว่า uploads อยู่แล้ว ให้ใช้ /uploads
    if (path.startsWith("/uploads")) {
      return `${APP_BASE_URL}${path}`;
    }
    // ถ้าไม่มี ให้เดาว่าเป็น /assemblypcbZipFiles
    // และใช้ BASE_URL เพื่อความชัวร์ (แก้ปัญหาหาไฟล์ไม่เจอ)
    return `${APP_BASE_URL}/assemblypcbZipFiles${path.startsWith("/") ? path : "/" + path}`;
  };

  useEffect(() => {
    if (configData?.success && configData.data) {
      const d = configData.data;
      setAlreadyHaveStencil(d.alreadyHaveStencil === 1);
      setStatus(d.status || "pending");

      setConfirmProjectName(d.confirmProjectName ?? true);
      setConfirmQty(d.confirmQty ?? true);

      setFormData((prev) => ({
        ...prev,
        ...d,
        gerber_zip: d.gerber_zip || null,
        confirmed_price: d.confirmed_price || "",
        adminNotes: d.adminNotes || "",
      }));

      if (parseInt(d.count_smd) > 0 || parseInt(d.total_point_smd) > 0)
        setShowSMDFields(true);
      if (parseInt(d.count_tht) > 0 || parseInt(d.total_point_tht) > 0)
        setShowTHTFields(true);

      const mapImages = (prefix) => {
        const imgs = [];
        for (let i = 1; i <= 10; i++) {
          if (d[`${prefix}_${i}`]) {
            //  ใช้ Logic เดิมที่เคยดูรูปได้
            imgs.push({
              url: `/assemblypcbImages${d[`${prefix}_${i}`]}`,
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

  // --- Handlers ---
  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file")
      setFormData((prev) => ({ ...prev, zipFile: files[0] || null }));
    else setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e, side) => {
    const files = Array.from(e.target.files);
    const newImgs = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    side === "top"
      ? setTopImages((prev) => [...prev, ...newImgs])
      : setBottomImages((prev) => [...prev, ...newImgs]);
  };

  const removeImage = (idx, side) => {
    side === "top"
      ? setTopImages((prev) => prev.filter((_, i) => i !== idx))
      : setBottomImages((prev) => prev.filter((_, i) => i !== idx));
  };

  // Upload helpers (รักษา path เดิมไว้)
  const stripPrefix = (path) => path.replace(/^\/?assemblypcbImages\//, "/");

  const uploadImages = async (images) => {
    const form = new FormData();
    const newFiles = images.filter((img) => img.file);
    // ถ้าไม่มีไฟล์ใหม่ คืนค่า url เดิม (แต่ตัด prefix ออกก่อนส่งไป DB)
    if (newFiles.length === 0) return images.map((img) => stripPrefix(img.url));

    newFiles.forEach((img) => form.append("images", img.file));
    const res = await uploadAssemblyMultipleImages(form).unwrap();

    const existing = images
      .filter((img) => !img.file)
      .map((img) => stripPrefix(img.url));
    // รวมของเก่า + ของใหม่
    return [
      ...existing,
      ...res.images.map((img) => stripPrefix(img.path || img)),
    ];
  };

  const mapImagesToFields = (urls, prefix) => {
    const res = {};
    for (let i = 0; i < 10; i++) res[`${prefix}_${i + 1}`] = urls[i] || null;
    return res;
  };

  // --- Main Action Logic ---
  const handleSubmit = async (actionType) => {
    setLoading(true);
    try {
      if (actionType === "accepted") {
        if (
          !formData.confirmed_price ||
          parseFloat(formData.confirmed_price) <= 0
        ) {
          toast.error("Please enter a valid Confirmed Price to Approve.");
          setLoading(false);
          return;
        }
      }

      if (actionType === "rejected") {
        if (!formData.adminNotes || formData.adminNotes.trim() === "") {
          toast.error("Please enter Admin Notes (Reason) to Reject.");
          setLoading(false);
          return;
        }
      }

      let uploadedZipPath = formData.gerber_zip;
      if (formData.zipFile) {
        const zipRes = await uploadGerberZip(
          new FormData().append("gerberZip", formData.zipFile),
        ).unwrap();
        // รับค่ากลับมา (backend อาจส่งมาเป็น { path: ... } หรือ { file: ... })
        uploadedZipPath = zipRes.path || zipRes.file || zipRes.zipPath;
      }

      const uploadedTop = await uploadImages(topImages);
      const uploadedBottom = await uploadImages(bottomImages);

      const payload = {
        ...formData,
        ...mapImagesToFields(uploadedTop, "image_top"),
        ...mapImagesToFields(uploadedBottom, "image_bottom"),
        status: actionType === "save" ? status : actionType,
        smd_side: showSMDFields ? formData.smd_side : "",
        count_smd: showSMDFields ? formData.count_smd : 0,
        total_point_smd: showSMDFields ? formData.total_point_smd : 0,
        tht_side: showTHTFields ? formData.tht_side : "",
        count_tht: showTHTFields ? formData.count_tht : 0,
        total_point_tht: showTHTFields ? formData.total_point_tht : 0,
        stencil_price: stencilPrice,
        setup_price: setupPrice,
        delievery_price: deliveryPrice,
        gerber_zip: uploadedZipPath,
        estimatedCost: totalCost,
        alreadyHaveStencil: alreadyHaveStencil ? 1 : 0,
        confirmProjectName,
        confirmQty,
        confirmBoardType,
        confirmTotalColumns,
        confirmTotalRows,
        confirmWidth,
        confirmHeight,
        confirmSmdSide,
        confirmCountSmd,
        confirmTotalPointSmd,
        confirmThtSide,
        confirmCountTht,
        confirmTotalPointTht,
        confirmNotes,
      };

      await updateAssemblycart({ id, updatedData: payload }).unwrap();
      toast.success(`Action: ${actionType.toUpperCase()} Successful`);
      navigate("/admin/cartassemblypcblist");
      refetch();
    } catch (err) {
      console.error(err);
      toast.error("Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const ConfirmCheck = ({ checked, setChecked, label }) => (
    <div className="d-flex align-items-center mb-2">
      <Form.Label
        className="mb-0 me-2 fw-bold text-secondary"
        style={{ fontSize: "0.9rem" }}
      >
        {label}
      </Form.Label>
      <Form.Check
        type="checkbox"
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
        className="ms-auto"
        label={
          <span
            className={
              checked
                ? "text-success small fw-bold"
                : "text-danger small fw-bold"
            }
          >
            {checked ? t.correct : t.check}
          </span>
        }
      />
    </div>
  );

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
            status === "accepted"
              ? "success"
              : status === "rejected"
                ? "danger"
                : "warning"
          }
          className="fs-6 px-3 py-2 rounded-pill"
        >
          {status ? status.toUpperCase() : "PENDING"}
        </Badge>
      </div>

      <Row className="g-4">
        {/* LEFT COLUMN: INFORMATION */}
        <Col xl={8}>
          {/* 1. Project Info */}
          <Card className="shadow-sm border-0 rounded-4 mb-4">
            <Card.Header className="bg-white pt-4 px-4 border-0">
              <h5 className="fw-bold text-dark">{t.projectInfo}</h5>
            </Card.Header>
            <Card.Body className="px-4 pb-4">
              <Row className="g-3">
                <Col md={8}>
                  <ConfirmCheck
                    checked={confirmProjectName}
                    setChecked={setConfirmProjectName}
                    label="Project Name"
                  />
                  <Form.Control
                    type="text"
                    name="projectname"
                    value={formData.projectname}
                    onChange={handleChange}
                  />
                </Col>
                <Col md={4}>
                  <ConfirmCheck
                    checked={confirmQty}
                    setChecked={setConfirmQty}
                    label="Quantity"
                  />
                  <Form.Control
                    type="number"
                    name="pcb_qty"
                    value={formData.pcb_qty}
                    onChange={handleChange}
                  />
                </Col>
                <Col md={12}>
                  <ConfirmCheck
                    checked={confirmBoardType}
                    setChecked={setConfirmBoardType}
                    label="Board Type"
                  />
                  <ButtonGroup className="w-100">
                    {["Single", "Panelized"].map((type, idx) => (
                      <ToggleButton
                        key={idx}
                        id={`-${idx}`}
                        type="radio"
                        variant="outline-primary"
                        name="board_types"
                        value={type}
                        checked={formData.board_types === type}
                        onChange={handleChange}
                      >
                        {type}
                      </ToggleButton>
                    ))}
                  </ButtonGroup>
                </Col>
                {formData.board_types === "Panelized" && (
                  <>
                    <Col md={6}>
                      <ConfirmCheck
                        checked={confirmTotalColumns}
                        setChecked={setConfirmTotalColumns}
                        label="Columns"
                      />
                      <Form.Control
                        type="number"
                        name="total_columns"
                        value={formData.total_columns}
                        onChange={handleChange}
                      />
                    </Col>
                    <Col md={6}>
                      <ConfirmCheck
                        checked={confirmTotalRows}
                        setChecked={setConfirmTotalRows}
                        label="Rows"
                      />
                      <Form.Control
                        type="number"
                        name="total_rows"
                        value={formData.total_rows}
                        onChange={handleChange}
                      />
                    </Col>
                  </>
                )}
              </Row>
            </Card.Body>
          </Card>

          {/* 2. Specs */}
          <Card className="shadow-sm border-0 rounded-4 mb-4">
            <Card.Header className="bg-white pt-4 px-4 border-0">
              <h5 className="fw-bold text-dark">{t.specs}</h5>
            </Card.Header>
            <Card.Body className="px-4 pb-4">
              <Row className="g-3 mb-4">
                <Col md={6}>
                  <ConfirmCheck
                    checked={confirmWidth}
                    setChecked={setConfirmWidth}
                    label="Width (mm)"
                  />
                  <Form.Control
                    type="number"
                    name="width_mm"
                    value={formData.width_mm}
                    onChange={handleChange}
                  />
                </Col>
                <Col md={6}>
                  <ConfirmCheck
                    checked={confirmHeight}
                    setChecked={setConfirmHeight}
                    label="Height (mm)"
                  />
                  <Form.Control
                    type="number"
                    name="high_mm"
                    value={formData.high_mm}
                    onChange={handleChange}
                  />
                </Col>
              </Row>

              {/* SMD Toggle */}
              <div className="bg-light p-3 rounded-3 mb-3">
                <Form.Check
                  type="switch"
                  id="smd-sw"
                  label={<strong>Include SMD</strong>}
                  checked={showSMDFields}
                  onChange={() => setShowSMDFields(!showSMDFields)}
                  className="mb-2"
                />
                {showSMDFields && (
                  <Row className="g-2">
                    <Col md={12}>
                      <ConfirmCheck
                        checked={confirmSmdSide}
                        setChecked={setConfirmSmdSide}
                        label="SMD Side"
                      />
                      <ButtonGroup size="sm" className="w-100 mb-2">
                        {["Top", "Bottom", "Both"].map((v, i) => (
                          <ToggleButton
                            key={i}
                            id={`-${i}`}
                            type="radio"
                            variant="outline-secondary"
                            name="smd_side"
                            value={v}
                            checked={formData.smd_side === v}
                            onChange={handleChange}
                          >
                            {v}
                          </ToggleButton>
                        ))}
                      </ButtonGroup>
                    </Col>
                    <Col md={6}>
                      <ConfirmCheck
                        checked={confirmCountSmd}
                        setChecked={setConfirmCountSmd}
                        label="Count"
                      />
                      <Form.Control
                        size="sm"
                        type="number"
                        name="count_smd"
                        value={formData.count_smd}
                        onChange={handleChange}
                      />
                    </Col>
                    <Col md={6}>
                      <ConfirmCheck
                        checked={confirmTotalPointSmd}
                        setChecked={setConfirmTotalPointSmd}
                        label="Pins"
                      />
                      <Form.Control
                        size="sm"
                        type="number"
                        name="total_point_smd"
                        value={formData.total_point_smd}
                        onChange={handleChange}
                      />
                    </Col>
                  </Row>
                )}
              </div>

              {/* THT Toggle */}
              <div className="bg-light p-3 rounded-3">
                <Form.Check
                  type="switch"
                  id="tht-sw"
                  label={<strong>Include THT</strong>}
                  checked={showTHTFields}
                  onChange={() => setShowTHTFields(!showTHTFields)}
                  className="mb-2"
                />
                {showTHTFields && (
                  <Row className="g-2">
                    <Col md={12}>
                      <ConfirmCheck
                        checked={confirmThtSide}
                        setChecked={setConfirmThtSide}
                        label="THT Side"
                      />
                      <ButtonGroup size="sm" className="w-100 mb-2">
                        {["Top", "Bottom", "Both"].map((v, i) => (
                          <ToggleButton
                            key={i}
                            id={`-${i}`}
                            type="radio"
                            variant="outline-secondary"
                            name="tht_side"
                            value={v}
                            checked={formData.tht_side === v}
                            onChange={handleChange}
                          >
                            {v}
                          </ToggleButton>
                        ))}
                      </ButtonGroup>
                    </Col>
                    <Col md={6}>
                      <ConfirmCheck
                        checked={confirmCountTht}
                        setChecked={setConfirmCountTht}
                        label="Count"
                      />
                      <Form.Control
                        size="sm"
                        type="number"
                        name="count_tht"
                        value={formData.count_tht}
                        onChange={handleChange}
                      />
                    </Col>
                    <Col md={6}>
                      <ConfirmCheck
                        checked={confirmTotalPointTht}
                        setChecked={setConfirmTotalPointTht}
                        label="Pins"
                      />
                      <Form.Control
                        size="sm"
                        type="number"
                        name="total_point_tht"
                        value={formData.total_point_tht}
                        onChange={handleChange}
                      />
                    </Col>
                  </Row>
                )}
              </div>

              <div className="mt-3">
                <Form.Check
                  type="checkbox"
                  label="Customer already has Stencil"
                  checked={alreadyHaveStencil}
                  onChange={(e) => setAlreadyHaveStencil(e.target.checked)}
                />
              </div>
            </Card.Body>
          </Card>

          {/* 3. Files & Images */}
          <Card className="shadow-sm border-0 rounded-4 mb-4">
            <Card.Header className="bg-white pt-4 px-4 border-0">
              <h5 className="fw-bold">{t.files}</h5>
            </Card.Header>
            <Card.Body className="px-4 pb-4">
              <Row className="g-3">
                <Col md={6}>
                  <Form.Label className="small fw-bold">Top Images</Form.Label>
                  <Form.Control
                    type="file"
                    multiple
                    onChange={(e) => handleImageUpload(e, "top")}
                    size="sm"
                  />
                  <div className="d-flex gap-2 mt-2 overflow-auto">
                    {topImages.map((img, i) => (
                      <div key={i} className="position-relative">
                        <Image
                          src={img.url}
                          style={{ width: 50, height: 50, objectFit: "cover" }}
                          rounded
                        />
                        <FaTimesCircle
                          className="position-absolute top-0 end-0 text-danger bg-white rounded-circle"
                          style={{ cursor: "pointer" }}
                          onClick={() => removeImage(i, "top")}
                        />
                      </div>
                    ))}
                  </div>
                </Col>
                <Col md={6}>
                  <Form.Label className="small fw-bold">
                    Bottom Images
                  </Form.Label>
                  <Form.Control
                    type="file"
                    multiple
                    onChange={(e) => handleImageUpload(e, "bottom")}
                    size="sm"
                  />
                  <div className="d-flex gap-2 mt-2 overflow-auto">
                    {bottomImages.map((img, i) => (
                      <div key={i} className="position-relative">
                        <Image
                          src={img.url}
                          style={{ width: 50, height: 50, objectFit: "cover" }}
                          rounded
                        />
                        <FaTimesCircle
                          className="position-absolute top-0 end-0 text-danger bg-white rounded-circle"
                          style={{ cursor: "pointer" }}
                          onClick={() => removeImage(i, "bottom")}
                        />
                      </div>
                    ))}
                  </div>
                </Col>
                <Col md={12}>
                  <Form.Label className="small fw-bold">Gerber Zip</Form.Label>
                  <Form.Control type="file" onChange={handleChange} size="sm" />
                  {formData.gerber_zip &&
                    typeof formData.gerber_zip === "string" && (
                      <div className="mt-2 p-2 bg-light rounded border d-inline-block">
                        {/*  Link Download ที่แก้ไขแล้ว (ใช้ http://localhost:5000) */}
                        <a
                          href={getZipDownloadLink(formData.gerber_zip)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-decoration-none d-flex align-items-center gap-2"
                        >
                          <FaFileArchive className="text-primary" />
                          <span>
                            Download: {formData.gerber_zip.split("/").pop()}
                          </span>
                        </a>
                      </div>
                    )}
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="shadow-sm border-0 rounded-4 mb-4 p-3">
            <ConfirmCheck
              checked={confirmNotes}
              setChecked={setConfirmNotes}
              label="Customer Notes"
            />
            <Form.Control
              as="textarea"
              rows={3}
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="bg-light"
            />
          </Card>
        </Col>

        {/* RIGHT COLUMN: ACTIONS */}
        <Col xl={4}>
          <div className="sticky-top" style={{ top: "20px", zIndex: 10 }}>
            {/* Financial Summary */}
            <Card className="shadow-sm border-0 rounded-4 mb-3 bg-white">
              <Card.Body>
                <h5 className="fw-bold mb-3">{t.financials}</h5>
                <ListGroup variant="flush" className="small">
                  <ListGroup.Item className="d-flex justify-content-between px-0">
                    <span>{t.stencil}</span>
                    <span>{stencilPrice.toLocaleString()} ฿</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between px-0">
                    <span>{t.smdCost}</span>
                    <span>{(smdCost * qty).toLocaleString()} ฿</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between px-0">
                    <span>{t.thtCost}</span>
                    <span>{(thtCost * qty).toLocaleString()} ฿</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between px-0">
                    <span>Delivery</span>
                    <span>{deliveryPrice.toLocaleString()} ฿</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between px-0">
                    <span>{t.vat}</span>
                    <span>{vatPrice.toFixed(2)} ฿</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between px-0 bg-light p-2 rounded mt-2">
                    <strong className="text-primary">{t.total}</strong>
                    <strong className="fs-6">
                      {totalCost.toLocaleString()} ฿
                    </strong>
                  </ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>

            {/* Validation Warning */}
            {(!confirmProjectName ||
              !confirmQty ||
              !confirmBoardType ||
              !confirmWidth ||
              !confirmHeight ||
              !confirmSmdSide ||
              !confirmCountSmd ||
              !confirmTotalPointSmd ||
              !confirmThtSide ||
              !confirmCountTht ||
              !confirmTotalPointTht ||
              !confirmNotes) && (
              <Alert variant="warning" className="small shadow-sm border-0">
                <FaExclamationTriangle className="me-2" />
                <strong>{t.alertUnconfirmed}</strong> Check the red "Check"
                boxes.
              </Alert>
            )}

            {/* Admin Actions */}
            <Card className="shadow border-0 rounded-4 border-top border-5 border-primary">
              <Card.Body>
                <h5 className="fw-bold text-center mb-4">{t.adminAction}</h5>

                {/* Confirmed Price */}
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small text-success">
                    {t.lblConfirmPrice} <span className="text-danger">*</span>
                  </Form.Label>
                  <InputGroup>
                    <InputGroup.Text className="bg-success text-white border-0">
                      ฿
                    </InputGroup.Text>
                    <Form.Control
                      type="number"
                      name="confirmed_price"
                      value={formData.confirmed_price}
                      onChange={handleChange}
                      className="fw-bold text-end fs-5"
                      placeholder="0.00"
                    />
                  </InputGroup>
                </Form.Group>

                {/* Admin Notes */}
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small text-muted">
                    {t.lblReason}
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="adminNotes"
                    value={formData.adminNotes}
                    onChange={handleChange}
                    placeholder="Required for rejection..."
                    className="bg-light"
                  />
                </Form.Group>

                <div className="d-grid gap-2">
                  {/* APPROVE BUTTON */}
                  <Button
                    variant="success"
                    className="fw-bold shadow-sm"
                    onClick={() => handleSubmit("accepted")}
                  >
                    <FaCheckCircle className="me-2" /> {t.btnApprove}
                  </Button>

                  {/* REJECT BUTTON */}
                  <Button
                    variant="outline-danger"
                    className="fw-bold"
                    onClick={() => handleSubmit("rejected")}
                  >
                    <FaTimesCircle className="me-2" /> {t.btnReject}
                  </Button>

                  {/* SAVE BUTTON */}
                  <Button
                    variant="light"
                    className="text-muted small"
                    onClick={() => handleSubmit("save")}
                  >
                    <FaSave className="me-2" /> {t.btnSave} (No Status Change)
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default OrderassemblyCartEditScreen;
