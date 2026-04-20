import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  Button,
  Badge,
  Row,
  Col,
  Card,
  Container,
  InputGroup,
  Form,
  Offcanvas,
  OverlayTrigger,
  Tooltip,
  Modal,
} from "react-bootstrap";
import {
  FaSearch,
  FaFilter,
  FaTimes,
  FaInfoCircle,
  FaBoxOpen,
  FaTruckLoading,
  FaRegCopy,
  FaChevronLeft,
  FaChevronRight,
  FaCalendarAlt,
  FaIndustry,
  FaLayerGroup,
  FaTrashAlt,
  FaExclamationTriangle,
} from "react-icons/fa";
import {
  useGetStockReceiveQuery,
  useDeleteStockReceiveMutation,
} from "../../../slices/stockReceiveApiSlice";
import { useGetStockCategoriesQuery } from "../../../slices/stockCategoryApiSlice";
import { useGetStockManufacturesQuery } from "../../../slices/stockManufactureApiSlice";
import { useGetStockSuppliersQuery } from "../../../slices/stockSupplierApiSlice";
import Loader from "../../../components/Loader";
import Message from "../../../components/Message";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import moment from "moment";

// --- Helper: Date Formatter (แก้ Invalid Date) ---
const formatDate = (date) => {
  if (!date) return "-";
  const m = moment(date);
  return m.isValid() ? m.format("DD MMM YYYY") : "-";
};

const StockReceiveDashboardScreen = () => {
  const navigate = useNavigate();

  // --- API Hooks ---
  const { data, isLoading, error, refetch } = useGetStockReceiveQuery();
  const [deleteStockReceive, { isLoading: isDeleting }] =
    useDeleteStockReceiveMutation();

  const { data: categoryData = [] } = useGetStockCategoriesQuery();
  const { data: manufactureData = [] } = useGetStockManufacturesQuery();
  const { data: supplierData = [] } = useGetStockSuppliersQuery();

  const products = useMemo(() => data?.receiptgoods || [], [data]);

  // --- State ---
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    category: "",
    manufacturer: "",
    supplier: "",
  });
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [dateFilter, setDateFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [showFilterCanvas, setShowFilterCanvas] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // --- Logic ---
  useEffect(() => {
    let filtered = products;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.electotronixPN?.toLowerCase().includes(q) ||
          p.grnno?.toLowerCase().includes(q) ||
          p.manufacturePN?.toLowerCase().includes(q),
      );
    }

    if (formData.category)
      filtered = filtered.filter((p) => p.category === formData.category);
    if (formData.manufacturer)
      filtered = filtered.filter(
        (p) => p.manufacture === formData.manufacturer,
      );
    if (formData.supplier)
      filtered = filtered.filter((p) => p.supplier === formData.supplier);

    const now = moment();
    if (dateFilter === "7days") {
      filtered = filtered.filter((p) =>
        moment(p.grndate).isAfter(now.clone().subtract(7, "days")),
      );
    } else if (dateFilter === "30days") {
      filtered = filtered.filter((p) =>
        moment(p.grndate).isAfter(now.clone().subtract(30, "days")),
      );
    }

    setFilteredProducts(filtered);
    setCurrentPage(1);
  }, [formData, searchQuery, dateFilter, products]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const handleCopy = (e, text, label = "Text") => {
    e.stopPropagation();
    if (text) {
      navigator.clipboard.writeText(text);
      toast.success(`Copied ${label}`, {
        autoClose: 1000,
        hideProgressBar: true,
        position: "bottom-center",
      });
    }
  };

  const handleDeleteClick = (e, item) => {
    e.stopPropagation();
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteStockReceive(itemToDelete.ID).unwrap();
      toast.success(`Deleted: ${itemToDelete.grnno}`);
      setShowDeleteModal(false);
      setItemToDelete(null);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete");
    }
  };

  const handleResetFilters = () => {
    setFormData({ category: "", manufacturer: "", supplier: "" });
    setSearchQuery("");
    setDateFilter("all");
    setShowFilterCanvas(false);
  };

  // --- Filter Panel ---
  const FilterPanel = () => (
    <div className="d-flex flex-column gap-3">
      <Form.Group>
        <Form.Label className="small fw-bold text-secondary mb-1">
          SEARCH
        </Form.Label>
        <InputGroup className="shadow-sm rounded-3 overflow-hidden border">
          <InputGroup.Text className="bg-white border-0 ps-3">
            <FaSearch className="text-muted opacity-50" />
          </InputGroup.Text>
          <Form.Control
            placeholder="Search GRN, P/N..."
            className="border-0 bg-white py-2 shadow-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button
              variant="white"
              className="border-0"
              onClick={() => setSearchQuery("")}
            >
              <FaTimes className="text-muted" />
            </Button>
          )}
        </InputGroup>
      </Form.Group>

      <Form.Group>
        <Form.Label className="small fw-bold text-secondary mb-1">
          TIME PERIOD
        </Form.Label>
        <Form.Select
          className="shadow-sm rounded-3 py-2 text-muted border"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        >
          <option value="all">All Time</option>
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
        </Form.Select>
      </Form.Group>

      <hr className="my-1 opacity-25" />

      <Form.Group>
        <Form.Label className="small fw-bold text-secondary mb-1">
          CATEGORY
        </Form.Label>
        <Form.Select
          className="shadow-sm rounded-3 py-2 text-muted border"
          value={formData.category}
          onChange={(e) =>
            setFormData({ ...formData, category: e.target.value })
          }
        >
          <option value="">All Categories</option>
          {categoryData.map((c) => (
            <option key={c.ID} value={c.category}>
              {c.category}
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      <Form.Group>
        <Form.Label className="small fw-bold text-secondary mb-1">
          MANUFACTURER
        </Form.Label>
        <Form.Select
          className="shadow-sm rounded-3 py-2 text-muted border"
          value={formData.manufacturer}
          onChange={(e) =>
            setFormData({ ...formData, manufacturer: e.target.value })
          }
        >
          <option value="">All Manufacturers</option>
          {manufactureData.map((m) => (
            <option key={m.ID} value={m.namemanufacture}>
              {m.namemanufacture}
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      <Form.Group>
        <Form.Label className="small fw-bold text-secondary mb-1">
          SUPPLIER
        </Form.Label>
        <Form.Select
          className="shadow-sm rounded-3 py-2 text-muted border"
          value={formData.supplier}
          onChange={(e) =>
            setFormData({ ...formData, supplier: e.target.value })
          }
        >
          <option value="">All Suppliers</option>
          {supplierData.map((s) => (
            <option key={s.ID} value={s.namesupplier}>
              {s.namesupplier}
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      <Button
        variant="outline-danger"
        className="mt-3 w-100 rounded-pill fw-bold shadow-sm"
        onClick={handleResetFilters}
      >
        <FaTimes className="me-2" /> Reset Filters
      </Button>
    </div>
  );

  if (isLoading) return <Loader />;
  if (error)
    return (
      <Message variant="danger">{error?.data?.message || error.error}</Message>
    );

  return (
    <Container
      fluid
      className="py-4 px-3 px-lg-5 bg-light min-vh-100 font-sans"
    >
      {/* --- Page Header & Toolbar --- */}
      <div className="mb-4">
        <Row className="align-items-center g-3">
          <Col xs={12} lg={4}>
            <h3 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
              <div
                className="bg-success bg-opacity-10 p-2 rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: 42, height: 42 }}
              >
                <FaTruckLoading className="text-success" size={20} />
              </div>
              Stock Receive
            </h3>
            <p className="text-muted mb-0 small ps-1">
              Manage and track your incoming goods
            </p>
          </Col>

          <Col xs={12} lg={8}>
            <div className="d-flex flex-column flex-md-row justify-content-lg-end gap-3 align-items-stretch align-items-md-center">
              <Card
                className="border-0 shadow-sm rounded-pill px-4 py-2 bg-white d-flex flex-row align-items-center justify-content-between gap-3"
                style={{ minWidth: "fit-content" }}
              >
                <div className="d-flex align-items-center gap-2">
                  <FaLayerGroup className="text-primary opacity-75" />
                  <span className="text-muted small fw-bold text-uppercase">
                    Total
                  </span>
                </div>
                <div className="fw-bold text-dark fs-5 lh-1">
                  {filteredProducts.length}
                </div>
              </Card>

              <InputGroup
                className="shadow-sm rounded-pill overflow-hidden border bg-white"
                style={{ maxWidth: "350px", width: "100%" }}
              >
                <InputGroup.Text className="bg-white border-0 ps-3">
                  <FaSearch className="text-muted opacity-50" />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search GRN, P/N..."
                  className="border-0 bg-white py-2 shadow-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <Button
                    variant="white"
                    className="border-0"
                    onClick={() => setSearchQuery("")}
                  >
                    <FaTimes className="text-muted" />
                  </Button>
                )}
              </InputGroup>

              <Button
                variant="white"
                className="border shadow-sm rounded-pill fw-bold text-secondary px-4 py-2 d-flex align-items-center justify-content-center gap-2"
                onClick={() => setShowFilterCanvas(true)}
              >
                <FaFilter className="text-primary" /> Filter
              </Button>
            </div>
          </Col>
        </Row>
      </div>

      {/* --- MAIN CONTENT (Full Width) --- */}
      <Card className="border-0 shadow-sm rounded-4 overflow-hidden d-none d-lg-block">
        <div className="table-responsive">
          {/*  ใส่ className="align-middle" ที่ Table โดยตรง */}
          <Table hover className="align-middle mb-0 text-nowrap">
            <thead className="bg-light text-secondary small text-uppercase">
              <tr>
                <th
                  className="ps-4 py-3 border-0 fw-bold text-center"
                  style={{ width: "60px" }}
                >
                  #
                </th>
                <th className="py-3 border-0 fw-bold" style={{ width: "20%" }}>
                  GRN Document
                </th>
                <th className="py-3 border-0 fw-bold" style={{ width: "35%" }}>
                  Product Details
                </th>
                <th className="py-3 border-0 fw-bold" style={{ width: "20%" }}>
                  Source
                </th>
                <th
                  className="py-3 border-0 fw-bold text-center"
                  style={{ width: "10%" }}
                >
                  Qty
                </th>
                <th
                  className="py-3 border-0 fw-bold text-center pe-4"
                  style={{ width: "15%" }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((p, i) => (
                //  ใส่ style verticalAlign ที่ tr เพื่อบังคับทุก td
                <tr
                  key={p.ID}
                  className="table-row-hover"
                  style={{ verticalAlign: "middle" }}
                >
                  <td className="ps-4 text-muted small fw-bold text-center">
                    {indexOfFirstItem + i + 1}
                  </td>

                  {/* GRN */}
                  <td>
                    <div>
                      <OverlayTrigger
                        overlay={<Tooltip>Click to Copy GRN</Tooltip>}
                      >
                        <div
                          className="fw-bold text-primary d-inline-flex align-items-center gap-2 cursor-pointer hover-underline w-fit"
                          onClick={(e) => handleCopy(e, p.grnno, "GRN Number")}
                        >
                          {p.grnno}{" "}
                          <FaRegCopy
                            className="text-muted opacity-25 hover-icon"
                            size={12}
                          />
                        </div>
                      </OverlayTrigger>
                      <div className="text-muted small mt-1 d-flex align-items-center gap-2">
                        <FaCalendarAlt size={10} className="opacity-50" />{" "}
                        {formatDate(p.grndate)}
                      </div>
                    </div>
                  </td>

                  {/* Product */}
                  <td>
                    <div className="d-flex align-items-center gap-3">
                      <div
                        className="bg-white border rounded-3 p-1 d-flex align-items-center justify-content-center shadow-sm flex-shrink-0"
                        style={{ width: 48, height: 48 }}
                      >
                        {p.img ? (
                          <img
                            src={p.img}
                            alt="p"
                            style={{
                              maxWidth: "100%",
                              maxHeight: "100%",
                              objectFit: "contain",
                            }}
                          />
                        ) : (
                          <FaBoxOpen className="text-muted opacity-25" />
                        )}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <OverlayTrigger
                          overlay={
                            <Tooltip>
                              {p.electotronixPN || p.manufacturePN}
                            </Tooltip>
                          }
                        >
                          <div
                            className="fw-bold text-dark text-truncate cursor-pointer"
                            onClick={(e) =>
                              handleCopy(
                                e,
                                p.electotronixPN || p.manufacturePN,
                                "Part Number",
                              )
                            }
                          >
                            {p.electotronixPN || p.manufacturePN}
                          </div>
                        </OverlayTrigger>
                        <div
                          className="text-muted small text-truncate"
                          style={{ maxWidth: 350 }}
                        >
                          {p.description}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Source - ใช้ div ธรรมดา ไม่ใช้ flex-column เพื่อให้ vertical-align ทำงาน */}
                  <td>
                    <div className="fw-medium text-dark d-flex align-items-center gap-2 text-truncate">
                      <FaIndustry
                        className="text-muted opacity-50 flex-shrink-0"
                        size={12}
                      />
                      <span title={p.manufacture}>{p.manufacture}</span>
                    </div>
                    <div
                      className="text-muted small text-truncate ps-4 mt-1"
                      style={{ maxWidth: 200 }}
                      title={p.supplier}
                    >
                      {p.supplier || "-"}
                    </div>
                  </td>

                  {/* Qty */}
                  <td className="text-center">
                    <Badge
                      bg="success"
                      className="bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2 rounded-pill fw-bold font-monospace shadow-sm"
                    >
                      +{p.grnqty}
                    </Badge>
                  </td>

                  {/* Actions */}
                  <td className="text-center pe-4">
                    <div className="d-flex justify-content-center gap-2">
                      <OverlayTrigger overlay={<Tooltip>View Details</Tooltip>}>
                        <Button
                          variant="light"
                          size="sm"
                          className="rounded-circle border btn-icon-hover shadow-sm"
                          onClick={() =>
                            navigate(`/componentreceivelist/${p.ID}`)
                          }
                        >
                          <FaInfoCircle className="text-secondary" />
                        </Button>
                      </OverlayTrigger>
                      <OverlayTrigger overlay={<Tooltip>Delete Item</Tooltip>}>
                        <Button
                          variant="light"
                          size="sm"
                          className="rounded-circle border btn-icon-hover shadow-sm"
                          style={{
                            backgroundColor: "#fff0f0",
                            borderColor: "#ffc9c9",
                          }}
                          onClick={(e) => handleDeleteClick(e, p)}
                        >
                          <FaTrashAlt className="text-danger" />
                        </Button>
                      </OverlayTrigger>
                    </div>
                  </td>
                </tr>
              ))}
              {currentItems.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">
                    No records found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white border-top py-3 px-4 d-flex justify-content-between align-items-center">
            <span className="text-muted small">
              Showing{" "}
              <strong>
                {indexOfFirstItem + 1}-
                {Math.min(indexOfLastItem, filteredProducts.length)}
              </strong>{" "}
              of <strong>{filteredProducts.length}</strong>
            </span>
            <div className="d-flex gap-2">
              <Button
                variant="outline-secondary"
                size="sm"
                className="rounded-pill px-3"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((c) => c - 1)}
              >
                <FaChevronLeft />
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                className="rounded-pill px-3"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((c) => c + 1)}
              >
                <FaChevronRight />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* --- MOBILE VIEW (CARDS) --- */}
      <div className="d-lg-none">
        {currentItems.map((p) => (
          <Card
            key={p.ID}
            className="border-0 shadow-sm mb-3 rounded-4 overflow-hidden card-hover"
          >
            <Card.Body className="p-3">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <Badge
                    bg="light"
                    text="primary"
                    className="border border-primary border-opacity-25 fw-bold mb-1 font-monospace px-2 cursor-pointer"
                    onClick={(e) => handleCopy(e, p.grnno, "GRN Number")}
                  >
                    {p.grnno}{" "}
                    <FaRegCopy className="ms-1 opacity-50" size={10} />
                  </Badge>
                  <div className="text-muted small d-flex align-items-center gap-1 ps-1">
                    <FaCalendarAlt size={10} /> {formatDate(p.grndate)}
                  </div>
                </div>
                <Badge
                  bg="success"
                  className="bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2 rounded-pill fw-bold fs-6"
                >
                  +{p.grnqty}
                </Badge>
              </div>

              <div
                className="d-flex gap-3 align-items-center mb-3 p-2 bg-light rounded-3 border border-light"
                onClick={() => navigate(`/componentreceivelist/${p.ID}`)}
              >
                <div
                  className="bg-white rounded border d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm"
                  style={{ width: 50, height: 50 }}
                >
                  {p.img ? (
                    <img
                      src={p.img}
                      alt="p"
                      style={{
                        maxWidth: "100%",
                        maxHeight: "100%",
                        objectFit: "contain",
                      }}
                    />
                  ) : (
                    <FaBoxOpen className="text-muted opacity-25" />
                  )}
                </div>
                <div className="overflow-hidden">
                  <div className="fw-bold text-dark text-truncate">
                    {p.electotronixPN || p.manufacturePN}
                  </div>
                  <div className="text-muted small text-truncate">
                    {p.description}
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top border-light text-muted small">
                <div
                  className="d-flex align-items-center gap-2 text-truncate"
                  style={{ maxWidth: "50%" }}
                >
                  <FaIndustry size={12} />{" "}
                  <span className="text-truncate">{p.manufacture}</span>
                </div>
                <div className="d-flex gap-2">
                  <Button
                    variant="outline-danger"
                    size="sm"
                    className="rounded-pill px-3 d-flex align-items-center border-danger-subtle"
                    onClick={(e) => handleDeleteClick(e, p)}
                  >
                    <FaTrashAlt size={10} className="me-1" /> Delete
                  </Button>
                  <Button
                    variant="link"
                    className="text-decoration-none p-0 fw-bold small d-flex align-items-center"
                    onClick={() => navigate(`/componentreceivelist/${p.ID}`)}
                  >
                    Details <FaChevronRight size={10} className="ms-1" />
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        ))}

        {/* Mobile Pagination */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-center gap-3 mt-4 mb-5">
            <Button
              variant="white"
              className="shadow-sm border rounded-circle"
              style={{ width: 40, height: 40 }}
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((c) => c - 1)}
            >
              <FaChevronLeft />
            </Button>
            <span className="align-self-center text-muted small fw-bold bg-white px-3 py-1 rounded-pill shadow-sm">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="white"
              className="shadow-sm border rounded-circle"
              style={{ width: 40, height: 40 }}
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((c) => c + 1)}
            >
              <FaChevronRight />
            </Button>
          </div>
        )}
      </div>

      {/* --- Filter Offcanvas (All Screens) --- */}
      <Offcanvas
        show={showFilterCanvas}
        onHide={() => setShowFilterCanvas(false)}
        placement="end"
        className="rounded-start-4 border-0"
      >
        <Offcanvas.Header closeButton className="border-bottom bg-light">
          <Offcanvas.Title className="fw-bold fs-5 text-dark">
            <FaFilter className="me-2 text-primary" /> Filter Options
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="bg-white p-4">
          <FilterPanel />
        </Offcanvas.Body>
      </Offcanvas>

      {/* --- Delete Confirmation Modal --- */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
        size="sm"
      >
        <Modal.Body className="text-center p-4">
          <div className="mb-3 text-danger bg-danger bg-opacity-10 rounded-circle d-inline-flex p-3">
            <FaExclamationTriangle size={32} />
          </div>
          <h5 className="fw-bold text-dark">Confirm Deletion</h5>
          <p className="text-muted small mb-4">
            Are you sure you want to delete GRN{" "}
            <strong>{itemToDelete?.grnno}</strong>? This action cannot be
            undone.
          </p>
          <div className="d-grid gap-2">
            <Button
              variant="danger"
              className="rounded-pill fw-bold"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Yes, Delete Item"}
            </Button>
            <Button
              variant="light"
              className="rounded-pill fw-bold text-muted"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      <style jsx>{`
        .font-sans {
          font-family:
            "Inter",
            system-ui,
            -apple-system,
            sans-serif;
        }
        .table-row-hover:hover {
          background-color: #f8f9fa;
          transition: 0.15s ease-in-out;
        }
        .btn-icon-hover:hover {
          background-color: #e9ecef;
          border-color: #dee2e6;
          transform: translateY(-2px);
          color: #0d6efd !important;
        }
        .hover-underline:hover {
          text-decoration: underline;
        }
        .hover-icon {
          transition: 0.2s;
        }
        .hover-underline:hover .hover-icon {
          opacity: 1 !important;
          color: #0d6efd !important;
        }
        .card-hover {
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }
        .card-hover:active {
          transform: scale(0.98);
        }
        .w-fit {
          width: fit-content;
        }

        /* Force vertical alignment */
        table.table td,
        table.table th {
          vertical-align: middle !important;
        }
      `}</style>
    </Container>
  );
};

export default StockReceiveDashboardScreen;
