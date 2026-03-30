import React, { useState, useEffect, useMemo } from "react"; // 1. Added useMemo
import { useSelector } from "react-redux"; // 2. Removed useDispatch
import {
  Table,
  Button,
  Modal,
  Form,
  Col,
  Row,
  InputGroup,
  Card,
  Badge,
} from "react-bootstrap";
import { FaSearch, FaInfoCircle, FaTimesCircle } from "react-icons/fa";
import {
  useGetStockRequestImportanceQuery,
  useUpdateStockRequestCancelMutation,
} from "../../../slices/stockRequestApiSlice";
import { useGetStockProductsQuery } from "../../../slices/stockProductApiSlice";
import { useGetStockCategoriesQuery } from "../../../slices/stockCategoryApiSlice";
import { useGetStockSubcategoriesQuery } from "../../../slices/stockSubcategoryApiSlice";
import { useGetStockFootprintsQuery } from "../../../slices/stockFootprintApiSlice";
import { useGetStockManufacturesQuery } from "../../../slices/stockManufactureApiSlice";
import { useGetStockSuppliersQuery } from "../../../slices/stockSupplierApiSlice";
import Loader from "../../../components/Loader";
import Message from "../../../components/Message";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const StockRequestImportanceScreen = () => {
  const navigate = useNavigate();
  // const dispatch = useDispatch(); // 3. Removed unused dispatch
  const { userInfo } = useSelector((state) => state.auth);

  const { data, isLoading, error } = useGetStockRequestImportanceQuery();
  const [updateStockRequestCancel] = useUpdateStockRequestCancelMutation();

  const { data: existingQtyData } = useGetStockProductsQuery();

  const { data: categoryData = [] } = useGetStockCategoriesQuery();
  const { data: subcategoryData = [] } = useGetStockSubcategoriesQuery();
  const { data: footprintData = [] } = useGetStockFootprintsQuery();
  const { data: manufactureData = [] } = useGetStockManufacturesQuery();
  const { data: supplierData = [] } = useGetStockSuppliersQuery();

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);

  // 4. Fixed: Wrapped products in useMemo to prevent the useEffect warning
  const products = useMemo(() => data?.requestimportances || [], [data]);

  const [formData, setFormData] = useState({
    category: "",
    subcategory: "",
    footprint: "",
    manufacturer: "",
    supplier: "",
  });

  // --- Filter Logic ---
  useEffect(() => {
    let filtered = [...products];

    if (formData.category)
      filtered = filtered.filter((p) => p.category === formData.category);
    if (formData.subcategory)
      filtered = filtered.filter((p) => p.subcategory === formData.subcategory);
    if (formData.footprint)
      filtered = filtered.filter((p) => p.footprint === formData.footprint);
    if (formData.manufacturer)
      filtered = filtered.filter(
        (p) => p.manufacture === formData.manufacturer,
      );
    if (formData.supplier)
      filtered = filtered.filter((p) => p.supplier === formData.supplier);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.electotronixPN?.toLowerCase().includes(query) ||
          item.manufacturePN?.toLowerCase().includes(query) ||
          item.value?.toLowerCase().includes(query),
      );
    }

    setFilteredProducts(filtered);
  }, [formData, searchQuery, products]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // --- Cancel Modal State ---
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedProductForCancel, setSelectedProductForCancel] =
    useState(null);
  const [cancelMessage, setCancelMessage] = useState("");

  const openCancelModal = (product) => {
    setSelectedProductForCancel(product);
    setCancelMessage("");
    setShowCancelModal(true);
  };

  const closeCancelModal = () => {
    setSelectedProductForCancel(null);
    setShowCancelModal(false);
  };

  const handleConfirmCancel = async () => {
    if (!selectedProductForCancel) return;
    if (!cancelMessage || cancelMessage.trim() === "") {
      toast.error("Please fill in a reason for cancellation!");
      return;
    }

    try {
      await updateStockRequestCancel({
        id: selectedProductForCancel.ID,
        cancel_message: cancelMessage,
        updateCancelBy: userInfo.name,
        canceledUserId: userInfo._id,
      }).unwrap();

      toast.success("Cancel status updated");
      closeCancelModal();
    } catch (error) {
      toast.error("Failed to update cancel status");
      console.error(error);
    }
  };

  // --- Details Modal State ---
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);

  const openDetailModal = (product) => {
    setSelectedDetailItem(product);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setSelectedDetailItem(null);
    setShowDetailModal(false);
  };

  if (isLoading) return <Loader />;
  if (error)
    return (
      <Message variant="danger">{error?.data?.message || error.error}</Message>
    );

  const containerStyle = {
    height: "70vh",
    overflowX: "auto",
    overflowY: "auto",
  };

  return (
    <>
      <Row className="align-items-center justify-content-between mb-3">
        <Col md="6">
          <h1 className="mb-0">All Requested Importance</h1>
        </Col>
        <Col md="4" className="text-end">
          <div className="d-flex justify-content-between align-items-center">
            <Button
              variant="primary"
              className="white text-white ms-3 mx-2"
              style={{ whiteSpace: "nowrap" }}
              onClick={() => navigate(`/componentissuecartlist`)}
            >
              Issue Cart
            </Button>
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Search P/N..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button variant="primary">
                <FaSearch />
              </Button>
            </InputGroup>
          </div>
        </Col>
      </Row>

      {/* Filters Row */}
      <div className="row g-2 mb-3">
        <div className="col">
          <select
            className="form-select form-select-sm"
            name="category"
            value={formData.category}
            onChange={handleChange}
          >
            <option value="">All Category</option>
            {categoryData.map((cat) => (
              <option key={cat.ID} value={cat.category}>
                {cat.category}
              </option>
            ))}
          </select>
        </div>
        <div className="col">
          <select
            className="form-select form-select-sm"
            name="subcategory"
            value={formData.subcategory}
            onChange={handleChange}
            disabled={!formData.category}
          >
            <option value="">All Subcategory</option>
            {subcategoryData
              .filter((sub) => sub.category === formData.category)
              .map((sub) => (
                <option key={sub.ID} value={sub.subcategory}>
                  {sub.subcategory}
                </option>
              ))}
          </select>
        </div>
        <div className="col">
          <select
            className="form-select form-select-sm"
            name="footprint"
            value={formData.footprint}
            onChange={handleChange}
          >
            <option value="">All Footprint</option>
            {footprintData.map((fp) => (
              <option key={fp.ID} value={fp.namefootprint}>
                {fp.namefootprint}
              </option>
            ))}
          </select>
        </div>
        <div className="col">
          <select
            className="form-select form-select-sm"
            name="manufacturer"
            value={formData.manufacturer}
            onChange={handleChange}
          >
            <option value="">All Manufacturer</option>
            {manufactureData.map((mfg) => (
              <option key={mfg.ID} value={mfg.namemanufacture}>
                {mfg.namemanufacture}
              </option>
            ))}
          </select>
        </div>
        <div className="col">
          <select
            className="form-select form-select-sm"
            name="supplier"
            value={formData.supplier}
            onChange={handleChange}
          >
            <option value="">All Supplier</option>
            {supplierData.map((sup) => (
              <option key={sup.ID} value={sup.namesupplier}>
                {sup.namesupplier}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table - Simplified */}
      <div style={containerStyle}>
        <Table
          striped
          bordered
          hover
          className="table-sm center-table sticky-header align-middle"
        >
          <thead className="bg-light text-center">
            <tr>
              <th style={{ width: "50px" }}>#</th>
              <th style={{ width: "80px" }}>Image</th>
              <th style={{ width: "20%" }}>Request Info</th>
              <th style={{ width: "25%" }}>Part Information</th>
              <th style={{ width: "15%" }}>Quantities</th>
              <th>Status / Process</th>
              <th style={{ width: "150px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((p, index) => {
              const currentStock =
                existingQtyData?.products?.find(
                  (prod) => prod.electotronixPN === p.electotronixPN,
                )?.quantity || 0;

              return (
                <tr key={p.ID}>
                  <td className="text-center">{index + 1}</td>
                  <td className="text-center">
                    {p.img ? (
                      <img
                        src={`/componentImages${p.img}`}
                        alt="prod"
                        width="50"
                        height="50"
                        style={{ objectFit: "contain" }}
                      />
                    ) : (
                      <span className="text-muted small">No Img</span>
                    )}
                  </td>
                  <td>
                    <div>
                      <strong>No:</strong> {p.requestno}
                    </div>
                    <div className="small text-muted">
                      {p.requestdate} {p.requesttime}
                    </div>
                    <div className="small text-primary">
                      <strong>By:</strong> {p.requestedUser}
                    </div>
                  </td>
                  <td>
                    <div className="fw-bold">{p.electotronixPN && p.electotronixPN !== "-" ? p.electotronixPN : (p.barcode || "-")}</div>
                    <div className="small">Mfr: {p.manufacture}</div>
                    <div className="small text-muted">
                      Mfr P/N: {p.manufacturePN}
                    </div>
                  </td>
                  <td className="text-center">
                    <div className="d-flex flex-column gap-1">
                      <Badge bg="primary">Req: {p.requestqty}</Badge>
                      <Badge bg="secondary">Stock: {currentStock}</Badge>
                    </div>
                  </td>
                  <td className="text-center">
                    {p.process ? (
                      <Badge bg="info">{p.process}</Badge>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td className="text-center">
                    <div className="d-flex justify-content-center gap-2">
                      <Button
                        variant="outline-info"
                        size="sm"
                        title="View Details"
                        onClick={() => openDetailModal(p)}
                      >
                        <FaInfoCircle /> Details
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        title="Cancel Request"
                        onClick={() => openCancelModal(p)}
                      >
                        <FaTimesCircle /> Cancel
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>

      {/* --- Details Modal (Secondary Information) --- */}
      <Modal
        show={showDetailModal}
        onHide={closeDetailModal}
        size="lg"
        centered
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>
            Product Details{" "}
            <span className="text-primary fs-6">
              ({selectedDetailItem?.electotronixPN})
            </span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedDetailItem && (
            <Form>
              <h6 className="border-bottom pb-2 mb-3 text-muted">
                Technical Specifications
              </h6>
              <Row className="mb-3">
                <Col md={3}>
                  <strong>Category:</strong>
                </Col>
                <Col md={3}>{selectedDetailItem.category}</Col>
                <Col md={3}>
                  <strong>Subcategory:</strong>
                </Col>
                <Col md={3}>{selectedDetailItem.subcategory}</Col>
              </Row>
              <Row className="mb-3">
                <Col md={3}>
                  <strong>Value:</strong>
                </Col>
                <Col md={3}>{selectedDetailItem.value}</Col>
                <Col md={3}>
                  <strong>Footprint:</strong>
                </Col>
                <Col md={3}>{selectedDetailItem.footprint}</Col>
              </Row>
              <Row className="mb-3">
                <Col md={3}>
                  <strong>Position:</strong>
                </Col>
                <Col md={3}>{selectedDetailItem.position}</Col>
                <Col md={3}>
                  <strong>Weight:</strong>
                </Col>
                <Col md={3}>{selectedDetailItem.weight}</Col>
              </Row>

              <h6 className="border-bottom pb-2 mb-3 mt-4 text-muted">
                Supply Chain
              </h6>
              <Row className="mb-3">
                <Col md={3}>
                  <strong>Supplier:</strong>
                </Col>
                <Col md={3}>{selectedDetailItem.supplier}</Col>
                <Col md={3}>
                  <strong>Supplier P/N:</strong>
                </Col>
                <Col md={3}>{selectedDetailItem.supplierPN}</Col>
              </Row>
              <Row className="mb-3">
                <Col md={3}>
                  <strong>Price:</strong>
                </Col>
                <Col md={3}>{selectedDetailItem.unitprice}</Col>
                <Col md={3}>
                  <strong>MOQ / SPQ:</strong>
                </Col>
                <Col md={3}>
                  {selectedDetailItem.moq} / {selectedDetailItem.spq}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={3}>
                  <strong>Link:</strong>
                </Col>
                <Col md={9}>
                  {selectedDetailItem.link ? (
                    <a
                      href={selectedDetailItem.link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Product Link
                    </a>
                  ) : (
                    "-"
                  )}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={3}>
                  <strong>Alternative:</strong>
                </Col>
                <Col md={9}>{selectedDetailItem.alternative || "-"}</Col>
              </Row>

              <h6 className="border-bottom pb-2 mb-3 mt-4 text-muted">
                Additional Information
              </h6>
              <Row className="mb-3">
                <Col md={12}>
                  <strong>Description:</strong>
                  <p className="text-muted small mt-1">
                    {selectedDetailItem.description &&
                      selectedDetailItem.description !==
                      "No description available."
                      ? selectedDetailItem.description
                      : selectedDetailItem.value}
                  </p>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={12}>
                  <strong>Request Note:</strong>
                  <div className="p-2 bg-light border rounded mt-1">
                    {selectedDetailItem.note || "-"}
                  </div>
                </Col>
              </Row>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeDetailModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* --- Cancel Confirmation Modal --- */}
      <Modal show={showCancelModal} onHide={closeCancelModal} centered>
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>Confirm Cancellation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center mb-4">
            <FaTimesCircle size={50} className="text-danger mb-2" />
            <h5>Are you sure?</h5>
            <p className="text-muted">
              You are about to cancel the request for: <br />
              <strong>{selectedProductForCancel?.electotronixPN}</strong>
            </p>
          </div>
          <Form.Group controlId="cancelMessage">
            <Form.Label className="fw-bold">
              Reason for Cancellation <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={cancelMessage}
              onChange={(e) => setCancelMessage(e.target.value)}
              placeholder="E.g., Wrong quantity ordered, Project cancelled..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeCancelModal}>
            Keep Request
          </Button>
          <Button variant="danger" onClick={handleConfirmCancel}>
            Confirm Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default StockRequestImportanceScreen;
