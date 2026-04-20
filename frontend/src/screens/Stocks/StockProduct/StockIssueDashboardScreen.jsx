import React, { useState, useEffect, useMemo } from "react";
import {
  Button,
  Badge,
  Container,
  Table,
  Card,
  Row,
  Col,
  Form,
  InputGroup,
  Offcanvas,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import {
  FaSearch,
  FaFilter,
  FaTimes,
  FaBoxOpen,
  FaTruckLoading,
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight,
  FaCheck,
  FaRegStickyNote,
  FaMicrochip,
} from "react-icons/fa";
import { useGetStockIssueQuery } from "../../../slices/stockIssueApiSlice";
import Loader from "../../../components/Loader";
import Message from "../../../components/Message";
import { useNavigate } from "react-router-dom";

// Utility: Format Date
const formatDate = (dateString) => {
  if (!dateString) return "-";
  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return new Date(dateString).toLocaleDateString("en-GB", options);
};

const StockIssueDashboardScreen = () => {
  const navigate = useNavigate();
  const { data, isLoading, error } = useGetStockIssueQuery();

  const products = useMemo(() => data?.issuegoods || [], [data]);

  // --- State ---
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter State
  const [showFilterCanvas, setShowFilterCanvas] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  // --- Logic ---
  useEffect(() => {
    let filtered = products;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.electotronixPN?.toLowerCase().includes(query) ||
          item.manufacturePN?.toLowerCase().includes(query) ||
          item.issueno?.toLowerCase().includes(query) ||
          item.note?.toLowerCase().includes(query),
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => {
        const isComplete = item.issueqty >= item.requestqty;
        if (statusFilter === "completed") return isComplete;
        if (statusFilter === "partial") return !isComplete;
        return true;
      });
    }

    setFilteredProducts(filtered);
    setCurrentPage(1);
  }, [searchQuery, statusFilter, products]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setShowFilterCanvas(false);
  };

  if (isLoading) return <Loader />;
  if (error)
    return (
      <Message variant="danger">{error?.data?.message || error.error}</Message>
    );

  return (
    <div className="bg-light min-vh-100 py-3 py-lg-4 font-sans text-start">
      <Container fluid="lg">
        {/* --- Header Section --- */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
          <div>
            <h3 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2 fs-4 fs-md-3">
              <FaTruckLoading className="text-primary" /> Stock Issued History
            </h3>
            <p className="text-muted mb-0 small">
              จัดการและติดตามประวัติการเบิกจ่ายพัสดุ
            </p>
          </div>
          <div className="d-flex gap-3">
            <Card
              className="border-0 shadow-sm px-3 py-2 text-center w-100 w-md-auto"
              style={{ minWidth: "120px" }}
            >
              <small
                className="text-muted text-uppercase"
                style={{ fontSize: "0.7rem", letterSpacing: "1px" }}
              >
                Records
              </small>
              <div className="fw-bold text-primary fs-5">{products.length}</div>
            </Card>
          </div>
        </div>

        {/* --- Main Content Card --- */}
        <Card className="border-0 shadow-sm rounded-4 overflow-hidden bg-transparent bg-lg-white">
          {/* Header / Filter Toolbar */}
          <Card.Header className="bg-white border-bottom py-3 px-3 px-lg-4 rounded-top-4">
            <Row className="g-3 align-items-center justify-content-between">
              <Col xs={12} md={6}>
                <InputGroup className="border rounded-pill overflow-hidden shadow-sm input-group-hover bg-white">
                  <InputGroup.Text className="bg-white border-0 ps-3">
                    <FaSearch className="text-muted" />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="ค้นหา..."
                    className="border-0 shadow-none bg-transparent"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <Button
                      variant="link"
                      className="text-muted border-0 pe-3"
                      onClick={() => setSearchQuery("")}
                    >
                      <FaTimes />
                    </Button>
                  )}
                </InputGroup>
              </Col>
              <Col xs={12} md="auto" className="d-flex gap-2">
                <Button
                  variant={
                    statusFilter !== "all" ? "primary" : "outline-secondary"
                  }
                  className="rounded-pill px-3 d-flex align-items-center gap-2 position-relative w-100 w-md-auto justify-content-center"
                  size="sm"
                  onClick={() => setShowFilterCanvas(true)}
                >
                  <FaFilter /> ตัวกรอง
                  {statusFilter !== "all" && (
                    <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle"></span>
                  )}
                </Button>
              </Col>
            </Row>
          </Card.Header>

          {/* --- 1. DESKTOP VIEW (TABLE) --- */}
          <div className="table-responsive d-none d-lg-block bg-white">
            <Table
              hover
              className="align-middle mb-0 text-nowrap table-border-custom"
              style={{ tableLayout: "fixed", width: "100%" }}
            >
              <thead
                className="bg-light text-secondary text-uppercase small"
                style={{ fontSize: "0.75rem", letterSpacing: "0.5px" }}
              >
                <tr>
                  <th
                    style={{ width: "35%" }}
                    className="px-4 py-3 border-bottom-2 text-start"
                  >
                    ข้อมูลพัสดุ
                  </th>
                  <th
                    style={{ width: "25%" }}
                    className="py-3 border-bottom-2 text-start"
                  >
                    เลขที่เบิกและหมายเหตุ
                  </th>
                  <th
                    style={{ width: "15%" }}
                    className="text-center py-3 border-bottom-2"
                  >
                    จำนวน (เบิก/ขอ)
                  </th>
                  <th
                    style={{ width: "15%" }}
                    className="text-center py-3 border-bottom-2"
                  >
                    สถานะ
                  </th>
                  <th
                    style={{ width: "10%" }}
                    className="text-end px-4 py-3 border-bottom-2"
                  >
                    เครื่องมือ
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((p) => {
                  const isComplete = p.issueqty >= p.requestqty;
                  return (
                    <tr key={p.ID}>
                      <td className="px-4 py-3 text-start">
                        <div
                          className="d-flex align-items-center gap-3"
                          style={{ overflow: "hidden" }}
                        >
                          <div
                            className="bg-white rounded p-1 border d-flex align-items-center justify-content-center shadow-sm flex-shrink-0"
                            style={{ width: "45px", height: "45px" }}
                          >
                            {p.img ? (
                              <img
                                src={p.img}
                                alt="prod"
                                style={{
                                  maxWidth: "100%",
                                  maxHeight: "100%",
                                  objectFit: "contain",
                                }}
                              />
                            ) : (
                              <FaBoxOpen
                                className="text-secondary opacity-25"
                                size={20}
                              />
                            )}
                          </div>
                          <div
                            style={{ minWidth: 0, flex: 1 }}
                            className="text-start"
                          >
                            <OverlayTrigger
                              overlay={
                                <Tooltip>
                                  {p.electotronixPN || p.manufacturePN}
                                </Tooltip>
                              }
                            >
                              <div
                                className="fw-bold text-primary text-decoration-none cursor-pointer hover-link text-truncate"
                                onClick={() =>
                                  navigate(`/componentissuelist/${p.ID}`)
                                }
                              >
                                {p.electotronixPN || p.manufacturePN}
                              </div>
                            </OverlayTrigger>
                            <div
                              className="text-muted small text-truncate"
                              title={p.description}
                            >
                              {p.description}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 text-start">
                        <div className="d-flex flex-column text-truncate">
                          <span
                            className="fw-bold text-dark font-monospace text-truncate"
                            title={p.issueno}
                          >
                            {p.issueno}
                          </span>
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <small className="text-muted d-flex align-items-center gap-1 text-truncate">
                              <FaCalendarAlt
                                size={10}
                                className="flex-shrink-0"
                              />{" "}
                              {formatDate(p.issuedate)}
                            </small>
                          </div>
                          {p.note && (
                            <div
                              className="text-muted text-truncate"
                              style={{
                                fontSize: "0.75rem",
                                fontStyle: "normal",
                              }}
                            >
                              <span className="fw-bold text-secondary">
                                Note:
                              </span>{" "}
                              {p.note}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="text-center py-3">
                        <div className="d-inline-flex align-items-center bg-light rounded-pill px-3 py-1 border">
                          <strong
                            className={
                              isComplete ? "text-success" : "text-warning"
                            }
                          >
                            {p.issueqty}
                          </strong>
                          <span className="mx-1 text-muted small">/</span>
                          <span className="text-muted small">
                            {p.requestqty}
                          </span>
                        </div>
                      </td>

                      <td className="text-center py-3">
                        {isComplete ? (
                          <Badge
                            bg="success"
                            className="bg-opacity-10 text-success border border-success-subtle px-3 py-2 rounded-pill fw-normal"
                          >
                            <FaCheck size={10} className="me-1" /> Completed
                          </Badge>
                        ) : (
                          <Badge
                            bg="warning"
                            className="bg-opacity-10 text-warning border border-warning-subtle px-3 py-2 rounded-pill fw-normal"
                          >
                            Partial
                          </Badge>
                        )}
                      </td>

                      <td className="text-end px-4 py-3">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="rounded-pill px-3"
                          onClick={() =>
                            navigate(`/componentissuelist/${p.ID}`)
                          }
                        >
                          Details
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>

          {/* --- 2. MOBILE VIEW (CARDS) --- */}
          <div className="d-lg-none mt-3">
            {currentItems.map((p) => {
              const isComplete = p.issueqty >= p.requestqty;
              return (
                <Card
                  key={p.ID}
                  className="mb-3 border-0 shadow-sm rounded-4 overflow-hidden"
                >
                  <Card.Body className="p-3">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <Badge
                          bg="light"
                          text="dark"
                          className="border font-monospace mb-1"
                        >
                          {p.issueno}
                        </Badge>
                        <div className="text-muted small d-flex align-items-center gap-1">
                          <FaCalendarAlt size={10} /> {formatDate(p.issuedate)}
                        </div>
                      </div>
                      {isComplete ? (
                        <Badge
                          bg="success"
                          className="bg-opacity-10 text-success border border-success-subtle px-2 py-1 fw-normal"
                        >
                          Completed
                        </Badge>
                      ) : (
                        <Badge
                          bg="warning"
                          className="bg-opacity-10 text-warning border border-warning-subtle px-2 py-1 fw-normal"
                        >
                          Partial
                        </Badge>
                      )}
                    </div>

                    <div
                      className="d-flex gap-3 align-items-center mb-3 p-2 bg-light rounded-3"
                      onClick={() => navigate(`/componentissuelist/${p.ID}`)}
                    >
                      <div
                        className="bg-white rounded border d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{ width: "50px", height: "50px" }}
                      >
                        {p.img ? (
                          <img
                            src={p.img}
                            alt="img"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "contain",
                            }}
                          />
                        ) : (
                          <FaBoxOpen className="text-muted" />
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <div className="fw-bold text-primary text-truncate">
                          <FaMicrochip className="me-1 text-secondary" />
                          {p.electotronixPN || p.manufacturePN}
                        </div>
                        <div className="text-muted small text-truncate">
                          {p.description}
                        </div>
                      </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div className="d-flex align-items-center bg-white border px-3 py-1 rounded-pill">
                        <span className="text-muted small me-2">Qty:</span>
                        <strong
                          className={
                            isComplete ? "text-success" : "text-warning"
                          }
                        >
                          {p.issueqty}
                        </strong>
                        <span className="mx-1 text-muted small">/</span>
                        <span className="text-muted small">{p.requestqty}</span>
                      </div>
                    </div>

                    {p.note && (
                      <div className="small text-muted fst-italic mb-3 border-start border-3 border-info ps-2 bg-light py-1 rounded-end">
                        <FaRegStickyNote className="text-info me-1 mb-1" />{" "}
                        {p.note}
                      </div>
                    )}

                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="w-100 rounded-pill"
                      onClick={() => navigate(`/componentissuelist/${p.ID}`)}
                    >
                      View Details
                    </Button>
                  </Card.Body>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Card.Footer className="bg-white border-top py-3 rounded-bottom-4">
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted small">
                  Page <strong>{currentPage}</strong> of{" "}
                  <strong>{totalPages}</strong>
                </span>
                <div className="d-flex gap-2">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((c) => c - 1)}
                    className="px-3"
                  >
                    <FaChevronLeft />
                  </Button>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((c) => c + 1)}
                    className="px-3"
                  >
                    <FaChevronRight />
                  </Button>
                </div>
              </div>
            </Card.Footer>
          )}
        </Card>

        {/* --- Filter Sidebar --- */}
        <Offcanvas
          show={showFilterCanvas}
          onHide={() => setShowFilterCanvas(false)}
          placement="end"
        >
          <Offcanvas.Header closeButton className="border-bottom">
            <Offcanvas.Title className="fw-bold">
              <FaFilter className="me-2 text-primary" /> ตัวเลือกการกรอง
            </Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            <div className="mb-4 text-start">
              <label className="fw-bold mb-2 text-secondary small">
                สถานะการเบิกจ่าย
              </label>
              <Form.Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="shadow-none"
              >
                <option value="all">แสดงทั้งหมด</option>
                <option value="completed">Completed (ครบจำนวน)</option>
                <option value="partial">Partial (ยังไม่ครบ)</option>
              </Form.Select>
            </div>
            <div className="d-grid gap-2">
              <Button
                variant="primary"
                onClick={() => setShowFilterCanvas(false)}
              >
                ใช้ตัวกรอง
              </Button>
              <Button variant="outline-danger" onClick={handleResetFilters}>
                รีเซ็ตทั้งหมด
              </Button>
            </div>
          </Offcanvas.Body>
        </Offcanvas>
      </Container>

      <style jsx>{`
        .table-border-custom tbody tr {
          border-bottom: 2px solid #e9ecef !important;
        }
        .table-border-custom tbody tr:last-child {
          border-bottom: none !important;
        }
        .table-border-custom tbody tr:hover {
          background-color: #f8f9fa;
        }
        .border-bottom-2 {
          border-bottom: 2px solid #dee2e6 !important;
        }
        .font-sans {
          font-family:
            "Inter",
            -apple-system,
            sans-serif;
        }
        .input-group-hover:focus-within {
          box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.15) !important;
          border-color: #86b7fe !important;
        }
        .hover-link:hover {
          text-decoration: underline !important;
          color: #0a58ca !important;
        }
      `}</style>
    </div>
  );
};

export default StockIssueDashboardScreen;
