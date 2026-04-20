import React, { useState } from "react";
import { useSelector } from "react-redux";
import {
  useCreateStockProductMutation,
  useUploadStockProductImageMutation,
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
import {
  Form,
  Button,
  Row,
  Col,
  Modal,
  Container,
  Card,
  InputGroup,
  Image,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaPlus,
  FaSave,
  FaArrowLeft,
  FaImage,
  FaBox,
  FaTags,
  FaIndustry,
  FaWarehouse,
} from "react-icons/fa";
import Loader from "../../../components/Loader";

const StockProductSetScreen = () => {
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);

  // --- State ---
  const [formData, setFormData] = useState({
    electotronixPN: "", // Assuming you might want to add this field to the form
    value: "",
    category: "",
    subcategory: "",
    footprint: "",
    manufacture: "",
    manufacturePN: "",
    supplier: "",
    supplierPN: "",
    alternative: "",
    description: "",
    note: "",
    position: "",
    price: "",
    moq: "",
    spq: "",
    process: "",
    quantity: "",
    link: "",
    weight: "",
    img: "",
  });

  // --- Modal States & Inputs ---
  const [modalState, setModalState] = useState({ type: null, value: "" });
  const closeModals = () => setModalState({ type: null, value: "" });

  // --- API Hooks ---
  const [createStockProduct, { isLoading }] = useCreateStockProductMutation();
  const [uploadStockProductImage, { isLoading: loadingUpload }] =
    useUploadStockProductImageMutation();

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

  // --- Create Mutations ---
  const [createStockCategory] = useCreateStockCategoryMutation();
  const [createStockSubcategory] = useCreateStockSubcategoryMutation();
  const [createStockFootprint] = useCreateStockFootprintMutation();
  const [createStockSupplier] = useCreateStockSupplierMutation();
  const [createStockManufacture] = useCreateStockManufactureMutation();

  // --- Handlers ---
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic Validation
    const requiredFields = [
      "value",
      "quantity",
      "category",
      "subcategory",
      "footprint",
      "manufacture",
      "supplier",
    ];
    const missing = requiredFields.filter((field) => !formData[field]);

    if (missing.length > 0) {
      toast.error(`Please fill in: ${missing.join(", ")}`);
      return;
    }

    try {
      const payload = {
        ...formData,
        username: userInfo?.name,
        price: Number(formData.price),
        quantity: Number(formData.quantity),
        weight: Number(formData.weight),
      };

      const res = await createStockProduct(payload).unwrap();

      // Refresh Lists
      refetchCategories();
      refetchSubcategories();
      refetchFootprints();
      refetchSuppliers();
      refetchManufactures();

      toast.success(`Product created successfully! Barcode: ${res.barcode || "N/A"}`);
      navigate("/componenteditlist");
    } catch (error) {
      const message =
        error?.data?.error ||
        error?.data?.message ||
        error?.error ||
        "Unknown error";
      toast.error(`Failed to create product: ${message}`);
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

  // --- Quick Create Handlers ---
  const handleQuickCreate = async () => {
    const { type, value } = modalState;
    if (!value) return;

    try {
      if (type === "Category") {
        await createStockCategory({
          category: value,
          createuser: userInfo.name,
        }).unwrap();
        refetchCategories();
      } else if (type === "Subcategory") {
        await createStockSubcategory({
          subcategory: value,
          category: formData.category,
          createuser: userInfo.name,
        }).unwrap();
        refetchSubcategories();
      } else if (type === "Footprint") {
        await createStockFootprint({
          namefootprint: value,
          category: formData.category,
          createuser: userInfo.name,
        }).unwrap();
        refetchFootprints();
      } else if (type === "Manufacture") {
        await createStockManufacture({
          namemanufacture: value,
          createuser: userInfo.name,
        }).unwrap();
        refetchManufactures();
      } else if (type === "Supplier") {
        await createStockSupplier({
          namesupplier: value,
          createuser: userInfo.name,
        }).unwrap();
        refetchSuppliers();
      }
      toast.success(`${type} created!`);
      closeModals();
    } catch (err) {
      toast.error(`Failed to create ${type}`);
    }
  };

  return (
    <Container className="py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-primary mb-0">Create New Component</h2>
          <p className="text-muted mb-0">
            Add a new item to the inventory system
          </p>
        </div>
        <Button variant="outline-secondary" onClick={() => navigate(-1)}>
          <FaArrowLeft className="me-2" /> Back
        </Button>
      </div>

      <Form onSubmit={handleSubmit}>
        <Row className="g-4">
          {/* Column 1: Classification & Basic Info */}
          <Col md={6}>
            <Card className="shadow-sm h-100 border-0">
              <Card.Header className="bg-white border-bottom-0 pt-3 pb-0">
                <h5 className="fw-bold text-secondary">
                  <FaTags className="me-2" /> Classification
                </h5>
              </Card.Header>
              <Card.Body>
                {/* Category */}
                <Form.Group className="mb-3">
                  <Form.Label>
                    Category <span className="text-danger">*</span>
                  </Form.Label>
                  <InputGroup>
                    <Form.Select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Category</option>
                      {categoryData.map((cat) => (
                        <option key={cat.ID} value={cat.category}>
                          {cat.category}
                        </option>
                      ))}
                    </Form.Select>
                    <Button
                      variant="outline-primary"
                      onClick={() =>
                        setModalState({ type: "Category", value: "" })
                      }
                    >
                      <FaPlus />
                    </Button>
                  </InputGroup>
                </Form.Group>

                {/* Subcategory */}
                <Form.Group className="mb-3">
                  <Form.Label>
                    Subcategory <span className="text-danger">*</span>
                  </Form.Label>
                  <InputGroup>
                    <Form.Select
                      name="subcategory"
                      value={formData.subcategory}
                      onChange={handleChange}
                      required
                      disabled={!formData.category}
                    >
                      <option value="">Select Subcategory</option>
                      {subcategoryData
                        .filter((sub) => sub.category === formData.category)
                        .map((sub) => (
                          <option
                            key={sub.subcategoryID}
                            value={sub.subcategory}
                          >
                            {sub.subcategory}
                          </option>
                        ))}
                    </Form.Select>
                    <Button
                      variant="outline-primary"
                      onClick={() =>
                        setModalState({ type: "Subcategory", value: "" })
                      }
                      disabled={!formData.category}
                    >
                      <FaPlus />
                    </Button>
                  </InputGroup>
                </Form.Group>

                {/* Footprint */}
                <Form.Group className="mb-3">
                  <Form.Label>
                    Footprint <span className="text-danger">*</span>
                  </Form.Label>
                  <InputGroup>
                    <Form.Select
                      name="footprint"
                      value={formData.footprint}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Footprint</option>
                      {footprintData.map((fp) => (
                        <option key={fp.footprintID} value={fp.namefootprint}>
                          {fp.namefootprint}
                        </option>
                      ))}
                    </Form.Select>
                    <Button
                      variant="outline-primary"
                      onClick={() =>
                        setModalState({ type: "Footprint", value: "" })
                      }
                      disabled={!formData.category}
                    >
                      <FaPlus />
                    </Button>
                  </InputGroup>
                </Form.Group>

                <hr className="my-4" />

                <h5 className="fw-bold text-secondary mb-3">
                  <FaBox className="me-2" /> Product Details
                </h5>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Value / Name <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="value"
                    value={formData.value}
                    onChange={handleChange}
                    required
                    placeholder="e.g. 10k Ohm, 10uF"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Electotronix P/N</Form.Label>
                  <Form.Control
                    type="text"
                    name="electotronixPN"
                    placeholder="Auto-generated if blank or '-'"
                    value={formData.electotronixPN}
                    onChange={handleChange}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Card.Body>
            </Card>
          </Col>

          {/* Column 2: Supply Chain & Inventory */}
          <Col md={6}>
            <Card className="shadow-sm border-0 mb-4">
              <Card.Header className="bg-white border-bottom-0 pt-3 pb-0">
                <h5 className="fw-bold text-secondary">
                  <FaIndustry className="me-2" /> Supply Chain
                </h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Manufacturer <span className="text-danger">*</span>
                      </Form.Label>
                      <InputGroup>
                        <Form.Select
                          name="manufacture"
                          value={formData.manufacture}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select...</option>
                          {manufactureData.map((m) => (
                            <option key={m.ID} value={m.namemanufacture}>
                              {m.namemanufacture}
                            </option>
                          ))}
                        </Form.Select>
                        <Button
                          variant="outline-primary"
                          onClick={() =>
                            setModalState({ type: "Manufacture", value: "" })
                          }
                        >
                          <FaPlus />
                        </Button>
                      </InputGroup>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Mfg P/N</Form.Label>
                      <Form.Control
                        type="text"
                        name="manufacturePN"
                        value={formData.manufacturePN}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Supplier <span className="text-danger">*</span>
                      </Form.Label>
                      <InputGroup>
                        <Form.Select
                          name="supplier"
                          value={formData.supplier}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select...</option>
                          {supplierData.map((s) => (
                            <option key={s.ID} value={s.namesupplier}>
                              {s.namesupplier}
                            </option>
                          ))}
                        </Form.Select>
                        <Button
                          variant="outline-primary"
                          onClick={() =>
                            setModalState({ type: "Supplier", value: "" })
                          }
                        >
                          <FaPlus />
                        </Button>
                      </InputGroup>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Supplier P/N</Form.Label>
                      <Form.Control
                        type="text"
                        name="supplierPN"
                        value={formData.supplierPN}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Datasheet / Link</Form.Label>
                  <Form.Control
                    type="text"
                    name="link"
                    value={formData.link}
                    onChange={handleChange}
                    placeholder="https://..."
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Alternative Parts</Form.Label>
                  <Form.Control
                    type="text"
                    name="alternative"
                    value={formData.alternative}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Card.Body>
            </Card>

            <Card className="shadow-sm border-0">
              <Card.Header className="bg-white border-bottom-0 pt-3 pb-0">
                <h5 className="fw-bold text-secondary">
                  <FaWarehouse className="me-2" /> Inventory & Pricing
                </h5>
              </Card.Header>
              <Card.Body>
                <Row className="g-2">
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Quantity <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="number"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Price (Unit)</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.0001"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Weight (g)</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        name="weight"
                        value={formData.weight}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="g-2">
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>MOQ</Form.Label>
                      <Form.Control
                        type="text"
                        name="moq"
                        value={formData.moq}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>SPQ</Form.Label>
                      <Form.Control
                        type="text"
                        name="spq"
                        value={formData.spq}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Position</Form.Label>
                      <Form.Control
                        type="text"
                        name="position"
                        value={formData.position}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Process / Note</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="note"
                    value={formData.note}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Card.Body>
            </Card>
          </Col>

          {/* Full Width: Image Upload */}
          <Col xs={12}>
            <Card className="shadow-sm border-0 mb-4">
              <Card.Body>
                <h5 className="fw-bold text-secondary mb-3">
                  <FaImage className="me-2" /> Product Image
                </h5>
                <Row className="align-items-center">
                  <Col md={6}>
                    <Form.Group controlId="img">
                      <Form.Control
                        type="file"
                        accept="image/*"
                        onChange={uploadImageHandler}
                      />
                      {loadingUpload && <Loader />}
                    </Form.Group>
                  </Col>
                  <Col md={6} className="text-center">
                    {formData.img ? (
                      <Image
                        src={formData.img}
                        alt="Preview"
                        thumbnail
                        style={{ maxHeight: "150px" }}
                      />
                    ) : (
                      <div className="text-muted border rounded p-4 bg-light">
                        No Image Selected
                      </div>
                    )}
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <div className="d-grid gap-2 d-md-flex justify-content-md-end mt-4 mb-5">
          <Button
            variant="light"
            size="lg"
            className="px-4"
            onClick={() => navigate("/componenteditlist")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="px-5 shadow-sm"
            disabled={isLoading}
          >
            {isLoading ? (
              "Saving..."
            ) : (
              <>
                <FaSave className="me-2" /> Save Component
              </>
            )}
          </Button>
        </div>
      </Form>

      {/* --- Reusable Modal for Quick Adds --- */}
      <Modal show={!!modalState.type} onHide={closeModals} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add New {modalState.type}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalState.type && (
            <Form.Group>
              <Form.Label>{modalState.type} Name</Form.Label>
              <Form.Control
                type="text"
                autoFocus
                value={modalState.value}
                onChange={(e) =>
                  setModalState({ ...modalState, value: e.target.value })
                }
                placeholder={`Enter new ${modalState.type}`}
              />
              {/* Show Category Context for Sub/Footprint */}
              {(modalState.type === "Subcategory" ||
                modalState.type === "Footprint") && (
                  <Form.Text className="text-muted">
                    Linked to Category: <strong>{formData.category}</strong>
                  </Form.Text>
                )}
            </Form.Group>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeModals}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleQuickCreate}>
            Create
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default StockProductSetScreen;
