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
} from "react-bootstrap";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Loader from "../../components/Loader";
import Message from "../../components/Message";
import {
  useCreateAssemblycartMutation,
  useUploadGerberAssemblyZipMutation,
  useUploadAssemblyMultipleImagesMutation,
  useGetAssemblycartDefaultQuery,
} from "../../slices/assemblypcbCartApiSlice";

const OrderassemblyCartYouSupplyPartScreen = () => {
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);
  const [createAssemblycart, { isLoading: isCreating }] =
    useCreateAssemblycartMutation();
  const [uploadGerberZip, { isLoading: isUploadingGerber }] =
    useUploadGerberAssemblyZipMutation();
  const [uploadAssemblyMultipleImages, { isLoading: isUploadingImages }] =
    useUploadAssemblyMultipleImagesMutation();
  const { data, isLoading: isFetchingDefault } =
    useGetAssemblycartDefaultQuery();
  const defaultData = data?.data;

  const [showSMDFields, setShowSMDFields] = useState(false);
  const [showTHTFields, setShowTHTFields] = useState(false);
  const [stencilPrice, setStencilPrice] = useState(3000);
  const [alreadyHaveStencil, setAlreadyHaveStencil] = useState(false);
  const [topImages, setTopImages] = useState([]);
  const [bottomImages, setBottomImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    projectname: "",
    pcb_qty: 5,
    width_mm: "",
    high_mm: "",
    count_smd: "",
    total_point_smd: "",
    count_tht: "",
    total_point_tht: "",
    board_types: "",
    total_columns: "",
    total_rows: "",
    smd_side: "",
    tht_side: "",
    gerber_zip: null,
    notes: "",
    zipFile: null,
    smd_price: "",
    tht_price: "",
    setup_price: "",
    delievery_price: "",
    user_id: userInfo?._id || "",
    userName: userInfo?.name || "",
    userEmail: userInfo?.email || "",
  });

  // Properly parsed numeric values
  const qty = parseFloat(formData.pcb_qty);
  const smdPins = showSMDFields ? parseFloat(formData.total_point_smd) || 0 : 0;
  const thtPins = showTHTFields ? parseFloat(formData.total_point_tht) || 0 : 0;
  const smd_price = parseFloat(formData.smd_price);
  const tht_price = parseFloat(formData.tht_price);
  const setupPrice = parseFloat(formData.setup_price);
  const delieveryPrice = parseFloat(formData.delievery_price);

  // Calculate costs
  const smdCost = smdPins * smd_price;
  const thtCost = thtPins * tht_price;

  let vatPrice = 0;
  let low_totalCost = 0;
  let totalCost = 0;

  if (smdCost > 0 || thtCost > 0) {
    vatPrice = (qty * (smdCost + thtCost) + stencilPrice) * 0.07;
    low_totalCost =
      qty * (smdCost + thtCost) + stencilPrice + delieveryPrice + vatPrice;
    if (low_totalCost < setupPrice) {
      totalCost = setupPrice;
    } else {
      totalCost = low_totalCost;
    }
  } else {
    totalCost = 0;
  }

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

  // useEffect(() => {
  //   const stencilBase = parseFloat(formData.stencil_price);

  //   if (!showSMDFields) {
  //     setStencilPrice(stencilBase);
  //     return;
  //   }

  //   if (formData.smd_side === 'Both') {
  //     setStencilPrice(stencilBase * 2);
  //   } else {
  //     setStencilPrice(stencilBase);
  //   }
  // }, [formData.smd_side, showSMDFields, formData.stencil_price]);

  useEffect(() => {
    const stencilBase = parseFloat(formData.stencil_price) || 0;

    if (alreadyHaveStencil || !showSMDFields) {
      setStencilPrice(0);
    } else if (formData.smd_side === "Both") {
      setStencilPrice(stencilBase * 2);
    } else {
      setStencilPrice(stencilBase);
    }
  }, [
    formData.smd_side,
    showSMDFields,
    formData.stencil_price,
    alreadyHaveStencil,
  ]);

  const uploadTopImages = async () => {
    const form = new FormData();
    topImages.forEach((img) => form.append("images", img.file));
    const res = await uploadAssemblyMultipleImages(form).unwrap();
    return res.images.map((img) => img.path);
  };

  const uploadBottomImages = async () => {
    const form = new FormData();
    bottomImages.forEach((img) => form.append("images", img.file));
    const res = await uploadAssemblyMultipleImages(form).unwrap();
    return res.images.map((img) => img.path);
  };

  const uploadgerberZipHandler = async () => {
    if (!formData.zipFile) return null;
    const form = new FormData();
    form.append("gerberZip", formData.zipFile);
    const res = await uploadGerberZip(form).unwrap();
    return res.path;
  };

  const handleImageUpload = (e, side) => {
    const files = Array.from(e.target.files);
    const images = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    if (side === "top") setTopImages((prev) => [...prev, ...images]);
    else if (side === "bottom") setBottomImages((prev) => [...prev, ...images]);
  };

  const removeImage = (idx, side) => {
    if (side === "top") {
      setTopImages((prev) => prev.filter((_, i) => i !== idx));
    } else if (side === "bottom") {
      setBottomImages((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  const handleChange = (e) => {
    const { name, files, type, value } = e.target;
    if (type === "file") {
      setFormData((prev) => ({
        ...prev,
        zipFile: files[0] || null,
        gerber_zip: files[0] || null,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!userInfo) {
        navigate("/login");
        return;
      }

      if (!formData.projectname.trim()) {
        toast.error("Please enter a project name.");
        return;
      }

      if (!formData.width_mm || parseFloat(formData.width_mm) <= 0) {
        toast.error("Please enter a valid PCB width.");
        setLoading(false);
        return;
      }

      if (!formData.high_mm || parseFloat(formData.high_mm) <= 0) {
        toast.error("Please enter a valid PCB height.");
        setLoading(false);
        return;
      }

      if (!showSMDFields && !showTHTFields) {
        toast.error("Please select either SMD or THT option.");
        setLoading(false);
        return;
      }

      if (!formData.board_types) {
        toast.error("Please select board types option.");
        setLoading(false);
        return;
      }

      if (showSMDFields && !formData.smd_side) {
        toast.error("Please select either SMD option.");
        setLoading(false);
        return;
      }
      if (showTHTFields && !formData.tht_side) {
        toast.error("Please select either THT option.");
        setLoading(false);
        return;
      }

      if (topImages.length < 1) {
        toast.error("Please upload at least 1 top PCB image.");
        return;
      }

      if (bottomImages.length < 1) {
        toast.error("Please upload at least 1 bottom PCB image.");
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

      const uploadedZipPath = await uploadgerberZipHandler();
      const uploadedTop = await uploadTopImages();
      const uploadedBottom = await uploadBottomImages();

      await createAssemblycart({
        orderData: {
          ...formData,
          smd_side: formData.smd_side,
          count_smd: formData.count_smd,
          total_point_smd: formData.total_point_smd,
          tht_side: formData.tht_side,
          count_tht: formData.count_tht,
          total_point_tht: formData.total_point_tht,
          stencil_price: stencilPrice,
          setup_price: setupPrice,
          delievery_price: delieveryPrice,
          gerber_zip: uploadedZipPath,
          image_tops: uploadedTop,
          image_bottoms: uploadedBottom,
          estimatedCost: totalCost,
          alreadyHaveStencil: alreadyHaveStencil,
          vatPrice: vatPrice,
        },
      }).unwrap();

      toast.success("Order submitted successfully!");
      setLoading(false);
      navigate("/cart/assemblycart");
    } catch (err) {
      console.error(err);
      setError("Failed to submit order");
      toast.error("Error submitting order");
      setLoading(false);
    }
  };

  const { language } = useSelector((state) => state.language);

  const translations = {
    en: {
      pcbassemblyorderlbl: "PCB Assembly Order (You Supply Parts)",
      projectnamelbl: "Project Name",
      qtylbl: "Quantity",
      boardType: "Board Type",
      singlePiece: "Single Piece",
      panelized: "Panelized",
      totalColumns: "Total Columns",
      totalRows: "Total Rows",
      width: "Width (mm)",
      height: "Height (mm)",
      includeSMD: "Include Surface Mount Device (SMD)",
      smdSide: "SMD Side",
      smdCount: "SMD Component Count",
      smdPins: "Total SMD Pins",
      stencilPrice: "Stencil Price (Baht)",
      includeTHT: "Include Through Hole (THT)",
      thtSide: "THT Side",
      thtCount: "Through Hole Component Count",
      thtPins: "Total Through Hole Pins",
      topImages: "Top Images (At least 1)",
      bottomImages: "Bottom Images (At least 1)",
      zipFile: "ZIP File or RAR File",
      notes: "Additional Notes",
      submitOrder: "Submit Order",
      selectedSummary: "Selected Summary",
      calculatedSummary: "Calculated Summary",
      smdCost: "Total SMD Cost",
      thtCost: "Total THT Cost",
      setupFee: "Setup Fee",
      deliveryFee: "Delivery Fee",
      totalQty: "Total Quantity",
      totalCost: "Total Estimated Cost",
      vatFee: "VAT",
    },
    thai: {
      pcbassemblyorderlbl: "คำสั่งประกอบ PCB (คุณจัดหาชิ้นส่วน)",
      projectnamelbl: "ชื่อโปรเจกต์",
      qtylbl: "จำนวน",
      boardType: "ประเภทบอร์ด",
      singlePiece: "ชิ้นเดียว",
      panelized: "จัดวางแผง",
      totalColumns: "จำนวนคอลัมน์",
      totalRows: "จำนวนแถว",
      width: "ความกว้าง (มม.)",
      height: "ความสูง (มม.)",
      includeSMD: "รวมอุปกรณ์ SMD",
      smdSide: "ด้าน SMD",
      smdCount: "จำนวนอุปกรณ์ SMD",
      smdPins: "จำนวนขา SMD ทั้งหมด",
      stencilPrice: "ราคาสตันซิล (บาท)",
      includeTHT: "รวมอุปกรณ์แบบขา (THT)",
      thtSide: "ด้าน THT",
      thtCount: "จำนวนอุปกรณ์ THT",
      thtPins: "จำนวนขา THT ทั้งหมด",
      topImages: "ภาพด้านบน (อย่างน้อย 1 ภาพ)",
      bottomImages: "ภาพด้านล่าง (อย่างน้อย 1 ภาพ)",
      zipFile: "ไฟล์ ZIP หรือ RAR",
      notes: "หมายเหตุเพิ่มเติม",
      submitOrder: "ส่งคำสั่งซื้อ",
      selectedSummary: "สรุปรายการที่เลือก",
      calculatedSummary: "สรุปคำนวณ",
      smdCost: "รวมค่า SMD",
      thtCost: "รวมค่า THT",
      setupFee: "ค่าติดตั้ง",
      deliveryFee: "ค่าจัดส่ง",
      totalQty: "จำนวนทั้งหมด",
      totalCost: "ราคารวมโดยประมาณ",
      vatFee: "ภาษี",
    },
  };

  const t = translations[language] || translations.en;

  return (
    <Container>
      <h2 className="my-3">{t.pcbassemblyorderlbl}</h2>
      {loading && <Loader />}
      {error && <Message variant="danger">{error}</Message>}
      <Form onSubmit={handleSubmit}>
        <Row>
          <Col xl={6}>
            <Card className="mb-3 p-3">
              <Form.Group controlId="projectname" className="mb-3">
                <Form.Label>{t.projectnamelbl}</Form.Label>
                <Form.Control
                  type="text"
                  name="projectname"
                  value={formData.projectname}
                  onChange={handleChange}
                  required
                  placeholder="Enter project name"
                />
              </Form.Group>

              <Form.Group controlId="pcb_qty" className="mb-3">
                <Form.Label>{t.qtylbl}</Form.Label>
                <Form.Control
                  type="number"
                  name="pcb_qty"
                  value={formData.pcb_qty}
                  onChange={handleChange}
                  min="5"
                  required
                />
              </Form.Group>

              <Form.Group controlId="board_types" className="mb-3">
                <Form.Label>{t.boardType}</Form.Label> <br></br>
                <ButtonGroup>
                  {[
                    { value: "Single", label: t.singlePiece },
                    { value: "Panelized", label: t.panelized },
                  ].map(({ value, label }) => (
                    <ToggleButton
                      key={value}
                      id={`board_types-${value}`}
                      type="radio"
                      variant="outline-primary"
                      name="board_types"
                      value={value}
                      checked={formData.board_types === value}
                      onChange={handleChange}
                    >
                      {label}
                    </ToggleButton>
                  ))}
                </ButtonGroup>
              </Form.Group>

              {formData.board_types === "Panelized" && (
                <Row>
                  <Col>
                    <Form.Group controlId="total_columns" className="mb-3">
                      <Form.Label>{t.totalColumns}</Form.Label>
                      <Form.Control
                        type="number"
                        name="total_columns"
                        value={formData.total_columns}
                        onChange={handleChange}
                        placeholder="Number of columns"
                        min="0"
                      />
                    </Form.Group>
                  </Col>

                  <Col>
                    <Form.Group controlId="total_rows" className="mb-3">
                      <Form.Label>{t.totalRows}</Form.Label>
                      <Form.Control
                        type="number"
                        name="total_rows"
                        value={formData.total_rows}
                        onChange={handleChange}
                        placeholder="Number of rows"
                        min="0"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              )}

              <Row>
                <Col>
                  <Form.Group controlId="width_mm" className="mb-3">
                    <Form.Label>{t.width}</Form.Label>
                    <Form.Control
                      type="number"
                      name="width_mm"
                      value={formData.width_mm}
                      onChange={handleChange}
                      placeholder="PCB width in mm"
                      step="0.01"
                    />
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group controlId="high_mm" className="mb-3">
                    <Form.Label>{t.height}</Form.Label>
                    <Form.Control
                      type="number"
                      name="high_mm"
                      value={formData.high_mm}
                      onChange={handleChange}
                      placeholder="PCB height in mm"
                      step="0.01"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card>

            <Card className="mb-3 p-3">
              <Form.Check
                type="checkbox"
                id="toggleSMD"
                label={t.includeSMD}
                checked={showSMDFields}
                onChange={() => setShowSMDFields((prev) => !prev)}
              />

              {showSMDFields && (
                <>
                  <Form.Group controlId="smd_side" className="my-3">
                    <Form.Label>{t.smdSide}</Form.Label> <br></br>
                    <ButtonGroup>
                      {["Top", "Bottom", "Both"].map((val) => (
                        <ToggleButton
                          key={val}
                          id={`smd_side-${val}`}
                          type="radio"
                          variant="outline-primary"
                          name="smd_side"
                          value={val}
                          checked={formData.smd_side === val}
                          onChange={handleChange}
                        >
                          {val}
                        </ToggleButton>
                      ))}
                    </ButtonGroup>
                  </Form.Group>

                  {/* <Form.Group controlId="smd_side" className="mb-3">
                  <Form.Label>{t.smdSide}</Form.Label> 
                  <Form.Control
                    as="select"
                    name="smd_side"
                    value={formData.smd_side}
                    onChange={handleChange}
                    required={showSMDFields}
                  >
                    <option value="Top">Top</option>
                    <option value="Bottom">Bottom</option>
                    <option value="Both">Both</option>
                  </Form.Control>
                </Form.Group> */}

                  <Form.Group controlId="count_smd" className="mb-3">
                    <Form.Label>{t.smdCount}</Form.Label>
                    <Form.Control
                      type="number"
                      name="count_smd"
                      value={formData.count_smd}
                      onChange={handleChange}
                      placeholder="Number of SMD components"
                      required={showSMDFields}
                      min="0"
                    />
                  </Form.Group>

                  <Form.Group controlId="total_point_smd" className="mb-3">
                    <Form.Label>{t.smdPins}</Form.Label>
                    <Form.Control
                      type="number"
                      name="total_point_smd"
                      value={formData.total_point_smd}
                      onChange={handleChange}
                      placeholder="Total solder pins for SMD"
                      required={showSMDFields}
                      min="0"
                    />
                  </Form.Group>

                  <Form.Group controlId="stencil_price">
                    <Form.Label>{t.stencilPrice}</Form.Label>
                    <Form.Control
                      type="number"
                      name="stencil_price"
                      value={stencilPrice}
                      readOnly
                      min="0"
                    />
                  </Form.Group>

                  <Form.Check
                    type="checkbox"
                    id="alreadyHaveStencil"
                    label="I already have the stencil"
                    checked={alreadyHaveStencil}
                    onChange={(e) => setAlreadyHaveStencil(e.target.checked)}
                    className="my-1"
                  />
                </>
              )}
            </Card>

            <Card className="mb-3 p-3">
              <Form.Check
                type="checkbox"
                id="toggleTHT"
                label={t.includeTHT}
                checked={showTHTFields}
                onChange={() => setShowTHTFields((prev) => !prev)}
              />

              {showTHTFields && (
                <>
                  <Form.Group controlId="tht_side" className="my-3">
                    <Form.Label>{t.thtSide}</Form.Label> <br></br>
                    <ButtonGroup>
                      {["Top", "Bottom", "Both"].map((val) => (
                        <ToggleButton
                          key={val}
                          id={`tht_side-${val}`}
                          type="radio"
                          variant="outline-primary"
                          name="tht_side"
                          value={val}
                          checked={formData.tht_side === val}
                          onChange={handleChange}
                        >
                          {val}
                        </ToggleButton>
                      ))}
                    </ButtonGroup>
                  </Form.Group>

                  {/* <Form.Group controlId="tht_side" className="mb-3">
                  <Form.Label>{t.thtSide}</Form.Label>
                  <Form.Control
                    as="select"
                    name="tht_side"
                    value={formData.tht_side}
                    onChange={handleChange}
                    required={showTHTFields}
                  >
                    <option value="Top">Top</option>
                    <option value="Bottom">Bottom</option>
                    <option value="Both">Both</option>
                  </Form.Control>
                </Form.Group> */}

                  <Form.Group controlId="count_tht" className="mb-3">
                    <Form.Label>{t.thtCount}</Form.Label>
                    <Form.Control
                      type="number"
                      name="count_tht"
                      value={formData.count_tht}
                      onChange={handleChange}
                      placeholder="Number of through hole components"
                      required={showTHTFields}
                      min="0"
                    />
                  </Form.Group>

                  <Form.Group controlId="total_point_tht" className="mb-3">
                    <Form.Label>{t.thtPins}</Form.Label>
                    <Form.Control
                      type="number"
                      name="total_point_tht"
                      value={formData.total_point_tht}
                      onChange={handleChange}
                      placeholder="Total solder pins for through hole"
                      required={showTHTFields}
                      min="0"
                    />
                  </Form.Group>
                </>
              )}
            </Card>

            <Card className="mb-3 p-3">
              <Form.Group controlId="top_images" className="mb-3">
                <Form.Label>{t.topImages}</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleImageUpload(e, "top")}
                />
                <div className="d-flex flex-wrap mt-3 gap-2">
                  {topImages.map((img, idx) => (
                    <div key={idx} style={{ position: "relative" }}>
                      <Image
                        src={img.url}
                        alt={`Top ${idx + 1}`}
                        thumbnail
                        style={{
                          width: "100px",
                          height: "100px",
                          objectFit: "cover",
                        }}
                      />
                      <Button
                        variant="danger"
                        size="sm"
                        style={{
                          position: "absolute",
                          top: "2px",
                          right: "2px",
                          padding: "0 2px",
                          borderRadius: "50%",
                          lineHeight: "1",
                        }}
                        onClick={() => removeImage(idx, "top")}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </Form.Group>

              <Form.Group controlId="bottom_images" className="mb-3">
                <Form.Label>{t.bottomImages}</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleImageUpload(e, "bottom")}
                />
                <div className="d-flex flex-wrap mt-3 gap-2">
                  {bottomImages.map((img, idx) => (
                    <div key={idx} style={{ position: "relative" }}>
                      <Image
                        src={img.url}
                        alt={`Bottom ${idx + 1}`}
                        thumbnail
                        style={{
                          width: "100px",
                          height: "100px",
                          objectFit: "cover",
                        }}
                      />
                      <Button
                        variant="danger"
                        size="sm"
                        style={{
                          position: "absolute",
                          top: "2px",
                          right: "2px",
                          padding: "0 2px",
                          borderRadius: "50%",
                          lineHeight: "1",
                        }}
                        onClick={() => removeImage(idx, "bottom")}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </Form.Group>

              <Form.Group controlId="gerber_zip" className="mb-3">
                <Form.Label>{t.zipFile}</Form.Label>
                <Form.Control
                  type="file"
                  name="gerber_zip"
                  onChange={handleChange}
                  accept=".zip,.rar"
                />

                {/* <Form.Control
                type="file"
                name="gerber_zip"
                onChange={handleChange}
                accept=".zip"
              /> */}
              </Form.Group>

              <Form.Group controlId="notes" className="mb-3">
                <Form.Label>{t.notes}</Form.Label>
                <Form.Control
                  as="textarea"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Enter any notes or special instructions"
                />
              </Form.Group>
            </Card>
          </Col>

          <Col xl={6}>
            <Card className="mb-3 p-3">
              <h4>{t.selectedSummary}</h4>
              <ListGroup variant="flush">
                <ListGroup.Item className="d-flex justify-content-between">
                  <strong>{t.projectnamelbl}:</strong>
                  <span>{formData.projectname || "-"}</span>
                </ListGroup.Item>

                <ListGroup.Item className="d-flex justify-content-between">
                  <strong>{t.qtylbl}:</strong>
                  <span>{formData.pcb_qty}</span>
                </ListGroup.Item>

                <ListGroup.Item className="d-flex justify-content-between">
                  <strong>{t.boardType}:</strong>
                  <span>{formData.board_types}</span>
                </ListGroup.Item>

                {formData.board_types === "Panelized" && (
                  <>
                    <ListGroup.Item className="d-flex justify-content-between">
                      <strong>{t.totalColumns}:</strong>
                      <span>{formData.total_columns || "-"}</span>
                    </ListGroup.Item>

                    <ListGroup.Item className="d-flex justify-content-between">
                      <strong>{t.totalRows}:</strong>
                      <span>{formData.total_rows || "-"}</span>
                    </ListGroup.Item>
                  </>
                )}

                {showSMDFields && (
                  <>
                    <ListGroup.Item variant="secondary">
                      <strong>Surface Mount Device (SMD)</strong>
                    </ListGroup.Item>
                    <ListGroup.Item className="d-flex justify-content-between">
                      <strong>{t.smdSide}:</strong>
                      <span>{formData.smd_side}</span>
                    </ListGroup.Item>

                    <ListGroup.Item className="d-flex justify-content-between">
                      <strong>{t.smdCount}:</strong>
                      <span>{formData.count_smd || "-"}</span>
                    </ListGroup.Item>

                    <ListGroup.Item className="d-flex justify-content-between">
                      <strong>{t.smdPins}:</strong>
                      <span>{formData.total_point_smd || "-"}</span>
                    </ListGroup.Item>
                  </>
                )}

                {showTHTFields && (
                  <>
                    <ListGroup.Item variant="secondary">
                      <strong>Through Hole (THT)</strong>
                    </ListGroup.Item>
                    <ListGroup.Item className="d-flex justify-content-between">
                      <strong>{t.thtSide}:</strong>
                      <span>{formData.tht_side}</span>
                    </ListGroup.Item>

                    <ListGroup.Item className="d-flex justify-content-between">
                      <strong>{t.thtCount}:</strong>
                      <span>{formData.count_tht || "-"}</span>
                    </ListGroup.Item>

                    <ListGroup.Item className="d-flex justify-content-between">
                      <strong>{t.thtPins}:</strong>
                      <span>{formData.total_point_tht || "-"}</span>
                    </ListGroup.Item>
                  </>
                )}

                <ListGroup.Item variant="secondary">
                  <strong>Dimensions</strong>
                </ListGroup.Item>

                <ListGroup.Item className="d-flex justify-content-between">
                  <strong>{t.width}:</strong>
                  <span>{formData.width_mm || "-"}</span>
                </ListGroup.Item>

                <ListGroup.Item className="d-flex justify-content-between">
                  <strong>{t.height}:</strong>
                  <span>{formData.high_mm || "-"}</span>
                </ListGroup.Item>

                <ListGroup.Item className="d-flex justify-content-between align-items-start">
                  <strong style={{ minWidth: "120px" }}>{t.topImages}:</strong>
                  <div className="d-flex flex-wrap gap-2">
                    {topImages.length > 0 ? (
                      topImages.map((img, idx) => (
                        <img
                          key={idx}
                          src={img.url}
                          alt={`Top ${idx + 1}`}
                          style={{
                            width: "60px",
                            height: "60px",
                            objectFit: "cover",
                            borderRadius: "4px",
                            border: "1px solid #ccc",
                          }}
                        />
                      ))
                    ) : (
                      <span>-</span>
                    )}
                  </div>
                </ListGroup.Item>

                <ListGroup.Item className="d-flex justify-content-between align-items-start">
                  <strong style={{ minWidth: "120px" }}>
                    {t.bottomImages}:
                  </strong>
                  <div className="d-flex flex-wrap gap-2">
                    {bottomImages.length > 0 ? (
                      bottomImages.map((img, idx) => (
                        <img
                          key={idx}
                          src={img.url}
                          alt={`Bottom ${idx + 1}`}
                          style={{
                            width: "60px",
                            height: "60px",
                            objectFit: "cover",
                            borderRadius: "4px",
                            border: "1px solid #ccc",
                          }}
                        />
                      ))
                    ) : (
                      <span>-</span>
                    )}
                  </div>
                </ListGroup.Item>

                <ListGroup.Item className="d-flex justify-content-between">
                  <strong>{t.zipFile}:</strong>
                  <span>
                    {formData.gerber_zip ? formData.gerber_zip.name : "-"}
                  </span>
                </ListGroup.Item>

                <ListGroup.Item>
                  <Row className="w-100">
                    <Col>
                      <strong>{t.notes}</strong>
                    </Col>
                    <Col className="text-end">{formData.notes || ""}</Col>
                  </Row>
                </ListGroup.Item>
              </ListGroup>
            </Card>

            <Card className="mb-3 p-3">
              <h4 className="mt-4">{t.calculatedSummary}</h4>
              <ListGroup variant="flush">
                <ListGroup.Item className="d-flex justify-content-between">
                  <strong>{t.stencilPrice}</strong>
                  <span>{stencilPrice.toLocaleString()} ฿</span>
                </ListGroup.Item>

                <ListGroup.Item className="d-flex justify-content-between">
                  <strong>{t.smdCost}</strong>
                  <span>{smdCost.toFixed(2)} ฿</span>
                </ListGroup.Item>

                <ListGroup.Item className="d-flex justify-content-between">
                  <strong>{t.thtCost}</strong>
                  <span>{thtCost.toFixed(2)} ฿</span>
                </ListGroup.Item>

                {/* <ListGroup.Item className="d-flex justify-content-between">
    <strong>{t.setupFee}</strong>
    <span>{setupPrice.toLocaleString()} ฿</span>
  </ListGroup.Item> */}

                <ListGroup.Item className="d-flex justify-content-between">
                  <strong>{t.deliveryFee}</strong>
                  <span>{delieveryPrice.toLocaleString()} ฿</span>
                </ListGroup.Item>

                <ListGroup.Item className="d-flex justify-content-between">
                  <strong>{t.totalQty}</strong>
                  <span>{qty}</span>
                </ListGroup.Item>

                <ListGroup.Item className="d-flex justify-content-between">
                  <strong>{t.vatFee}</strong>
                  <span>{vatPrice.toLocaleString()} ฿</span>
                </ListGroup.Item>

                <ListGroup.Item className="d-flex justify-content-between bg-light">
                  <strong>{t.totalCost}</strong>
                  <span>{totalCost.toLocaleString()} ฿</span>
                </ListGroup.Item>
              </ListGroup>

              <div className="text-danger small mt-2">
                * If your order is lower than {setupPrice.toLocaleString()} ฿,
                the minimum charge is {setupPrice.toLocaleString()} ฿.
              </div>

              <div className="p-3">
                <Button
                  type="submit"
                  disabled={isCreating || loading || isFetchingDefault}
                  variant="primary"
                  className="w-100"
                >
                  {t.submitOrder}
                </Button>
              </div>
            </Card>
          </Col>
        </Row>
      </Form>
    </Container>
  );
};

export default OrderassemblyCartYouSupplyPartScreen;
