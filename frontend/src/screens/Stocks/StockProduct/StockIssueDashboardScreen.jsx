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
  FaUser,
  FaUserCheck,
} from "react-icons/fa";
import { useGetStockIssueQuery } from "../../../slices/stockIssueApiSlice";
import Loader from "../../../components/Loader";
import Message from "../../../components/Message";
import { useNavigate } from "react-router-dom";

const formatDate = (dateString) => {
  if (!dateString) return "-";
  // The backend already returns DD-MM-YYYY, so we just return it
  // Or we can parse it if we want custom formatting, but let's just remove the time part
  const [day, month, year] = dateString.split("-");
  if (day && month && year) {
    const date = new Date(`${year}-${month}-${day}`);
    if (!isNaN(date)) {
      return date.toLocaleDateString("en-GB", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
  }
  return dateString;
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
    <div className="dashboard-container font-sans text-start min-vh-100 pb-5 pt-4">
      <Container fluid="lg">
        {/* --- Header Section --- */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4 gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-2">
              <div className="icon-box-primary">
                <FaTruckLoading size={18} />
              </div>
              <h5 className="text-primary-accent fw-bold mb-0" style={{ letterSpacing: "0.5px" }}>Stock Management</h5>
            </div>
            <h2 className="fw-black text-dark-blue mb-1 display-6" style={{ letterSpacing: "-1px" }}>
              Issue History
            </h2>
            <p className="text-muted-blue mb-0 fs-6 fw-medium">
              จัดการและติดตามประวัติการเบิกจ่ายพัสดุ
            </p>
          </div>
          <div className="d-flex gap-3">
            <div
              className="stat-card px-4 py-3 text-center rounded-4"
              style={{ minWidth: "150px" }}
            >
              <div
                className="text-muted-blue text-uppercase fw-bold mb-1"
                style={{ fontSize: "0.75rem", letterSpacing: "1px" }}
              >
                Total Records
              </div>
              <div className="fw-black text-dark-blue display-5 lh-1">{products.length}</div>
            </div>
          </div>
        </div>

        {/* --- Main Content Card --- */}
        <Card className="border-0 rounded-4 overflow-hidden premium-card">
          {/* Header / Filter Toolbar */}
          <Card.Header className="bg-white border-bottom-0 pt-4 pb-3 px-4 rounded-top-4">
            <Row className="g-3 align-items-center justify-content-between">
              <Col xs={12} md={5} lg={4}>
                <InputGroup className="premium-search-box rounded-pill overflow-hidden">
                  <InputGroup.Text className="bg-transparent border-0 ps-4 pe-2">
                    <FaSearch className="text-primary-accent" />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="ค้นหาเลขที่เบิก, ชื่อพัสดุ..."
                    className="border-0 shadow-none bg-transparent py-2 px-2 fw-medium"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <Button
                      variant="link"
                      className="text-muted-blue border-0 pe-4 text-decoration-none"
                      onClick={() => setSearchQuery("")}
                    >
                      <FaTimes />
                    </Button>
                  )}
                </InputGroup>
              </Col>
              <Col xs={12} md="auto" className="d-flex gap-2 justify-content-end">
                <Button
                  variant={statusFilter !== "all" ? "primary" : "light"}
                  className={`premium-btn rounded-pill px-4 py-2 d-flex align-items-center gap-2 position-relative fw-bold ${statusFilter !== "all" ? "btn-primary-accent" : ""}`}
                  onClick={() => setShowFilterCanvas(true)}
                >
                  <FaFilter size={14} className={statusFilter !== "all" ? "text-white" : "text-primary-accent"} /> 
                  <span className={statusFilter !== "all" ? "text-white" : "text-dark-blue"}>ตัวกรอง</span>
                  {statusFilter !== "all" && (
                    <span className="position-absolute top-0 start-100 translate-middle p-2 bg-danger border border-2 border-white rounded-circle"></span>
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
              <thead className="premium-thead">
                <tr>
                  <th style={{ width: "25%" }} className="px-4 py-4 text-start">ข้อมูลพัสดุ</th>
                  <th style={{ width: "22%" }} className="py-4 text-start">เลขที่เบิกและหมายเหตุ</th>
                  <th style={{ width: "18%" }} className="py-4 text-start">ผู้เกี่ยวข้อง</th>
                  <th style={{ width: "12%" }} className="text-center py-4">จำนวน</th>
                  <th style={{ width: "13%" }} className="text-center py-4">สถานะ</th>
                  <th style={{ width: "10%" }} className="text-end px-4 py-4">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((p) => {
                  const isComplete = p.issueqty >= p.requestqty;
                  return (
                    <tr key={p.ID} className="premium-row cursor-pointer" onClick={() => navigate(`/componentissuelist/${p.ID}`)}>
                      <td className="px-4 py-4 text-start">
                        <div className="d-flex align-items-center gap-3">
                          <div className="premium-img-box">
                            {p.img ? (
                              <img src={p.img} alt="prod" />
                            ) : (
                              <FaBoxOpen className="text-secondary opacity-50" size={24} />
                            )}
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <OverlayTrigger overlay={<Tooltip>{p.electotronixPN || p.manufacturePN}</Tooltip>}>
                              <div className="fw-black text-dark-blue text-truncate fs-6 mb-1 hover-primary">
                                {p.electotronixPN || p.manufacturePN}
                              </div>
                            </OverlayTrigger>
                            <div className="text-muted-blue small text-truncate fw-medium" title={p.description}>
                              {p.description}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 text-start">
                        <div className="d-flex flex-column gap-2">
                          <div className="badge-issue-no">
                            #{p.issueno}
                          </div>
                          <div className="text-muted-blue small d-flex align-items-center gap-1 fw-medium">
                            <FaCalendarAlt size={12} className="opacity-75" />
                            <span>{formatDate(p.issuedate)} <span className="opacity-75 ms-1">{p.issuetime}</span></span>
                          </div>
                          {p.note && (
                            <div className="premium-note text-truncate" title={p.note}>
                              <FaRegStickyNote className="me-1 opacity-75" />
                              {p.note}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-4">
                        <div className="d-flex flex-column gap-3">
                          <div className="d-flex align-items-center gap-2">
                            <div className="icon-circle-sm bg-primary-light text-primary-accent">
                              <FaUser size={10} />
                            </div>
                            <div className="text-truncate">
                              <div className="label-tiny">Requested By</div>
                              <div className="fw-bold text-dark-blue" style={{ fontSize: '13px' }}>{p.reciever || p.username || 'Unknown'}</div>
                            </div>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <div className="icon-circle-sm bg-success-light text-success">
                              <FaUserCheck size={11} />
                            </div>
                            <div className="text-truncate">
                              <div className="label-tiny">Approved By</div>
                              <div className="fw-bold text-dark-blue" style={{ fontSize: '13px' }}>{p.issueBy || 'System'}</div>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="text-center py-4">
                        <div className="premium-qty-box">
                          <span className={`fw-black ${isComplete ? "text-success" : "text-warning"}`} style={{ fontSize: '1.1rem' }}>
                            {p.issueqty}
                          </span>
                          <span className="text-muted-blue mx-2 fw-light">|</span>
                          <span className="fw-bold text-dark-blue" style={{ fontSize: '1rem' }}>
                            {p.requestqty}
                          </span>
                        </div>
                      </td>

                      <td className="text-center py-4">
                        {isComplete ? (
                          <div className="badge-status-completed">
                            <FaCheck size={10} className="me-1" /> Completed
                          </div>
                        ) : (
                          <div className="badge-status-partial">
                            Partial
                          </div>
                        )}
                      </td>

                      <td className="text-end px-4 py-4">
                        <Button variant="light" size="sm" className="btn-action-circle" onClick={(e) => { e.stopPropagation(); navigate(`/componentissuelist/${p.ID}`); }}>
                          <FaChevronRight size={14} />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>

          {/* --- 2. MOBILE VIEW (CARDS) --- */}
          <div className="d-lg-none mt-3 p-2">
            {currentItems.map((p) => {
              const isComplete = p.issueqty >= p.requestqty;
              return (
                <Card
                  key={p.ID}
                  className="mb-4 border-0 premium-card rounded-4 overflow-hidden"
                >
                  <Card.Body className="p-4">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <div className="badge-issue-no mb-2">
                          #{p.issueno}
                        </div>
                        <div className="text-muted-blue small d-flex align-items-center gap-1 fw-medium" style={{ fontSize: "0.8rem" }}>
                          <FaCalendarAlt size={11} className="opacity-75" /> {formatDate(p.issuedate)} <span className="opacity-75 ms-1">{p.issuetime}</span>
                        </div>
                      </div>
                      {isComplete ? (
                        <div className="badge-status-completed px-2 py-1" style={{ fontSize: "0.75rem" }}>
                          Completed
                        </div>
                      ) : (
                        <div className="badge-status-partial px-2 py-1" style={{ fontSize: "0.75rem" }}>
                          Partial
                        </div>
                      )}
                    </div>

                    <div
                      className="d-flex gap-3 align-items-center mb-3 p-3 rounded-4 cursor-pointer"
                      style={{ background: "#F4F7FE" }}
                      onClick={() => navigate(`/componentissuelist/${p.ID}`)}
                    >
                      <div className="premium-img-box" style={{ background: "white", width: "60px", height: "60px" }}>
                        {p.img ? (
                          <img src={p.img} alt="img" />
                        ) : (
                          <FaBoxOpen className="text-secondary opacity-25" size={28} />
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <div className="fw-black text-dark-blue text-truncate fs-6 mb-1">
                          {p.electotronixPN || p.manufacturePN}
                        </div>
                        <div className="text-muted-blue text-truncate fw-medium" style={{ fontSize: "0.8rem" }}>
                          {p.description}
                        </div>
                      </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-end mb-3">
                      <div className="d-flex flex-column gap-2">
                        <div className="d-flex align-items-center gap-2">
                          <div className="icon-circle-sm bg-primary-light text-primary-accent">
                            <FaUser size={10} />
                          </div>
                          <div className="text-truncate">
                            <div className="label-tiny">Requested By</div>
                            <div className="fw-bold text-dark-blue" style={{ fontSize: '12px' }}>{p.reciever || p.username || 'Unknown'}</div>
                          </div>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <div className="icon-circle-sm bg-success-light text-success">
                            <FaUserCheck size={11} />
                          </div>
                          <div className="text-truncate">
                            <div className="label-tiny">Approved By</div>
                            <div className="fw-bold text-dark-blue" style={{ fontSize: '12px' }}>{p.issueBy || 'System'}</div>
                          </div>
                        </div>
                      </div>
                      <div className="d-flex flex-column align-items-end gap-1">
                        <div className="label-tiny">Quantity</div>
                        <div className="premium-qty-box px-3 py-1">
                          <strong className={isComplete ? "text-success fs-6" : "text-warning fs-6"}>
                            {p.issueqty}
                          </strong>
                          <span className="mx-2 text-muted-blue fw-light opacity-50">|</span>
                          <span className="text-dark-blue fw-bold">{p.requestqty}</span>
                        </div>
                      </div>
                    </div>

                    {p.note && (
                      <div className="premium-note w-100 mb-3" style={{ fontSize: "0.8rem" }}>
                        <FaRegStickyNote className="opacity-75 me-1" />
                        {p.note}
                      </div>
                    )}

                    <Button
                      variant="primary"
                      className="w-100 rounded-pill shadow-sm py-2 btn-primary-accent fw-bold"
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
        /* Core Colors */
        :root {
          --bg-color: #F4F7FE;
          --dark-blue: #2B3674;
          --muted-blue: #A3AED0;
          --primary-accent: #4318FF;
          --primary-light: rgba(67, 24, 255, 0.08);
          --success: #05CD99;
          --success-light: rgba(5, 205, 153, 0.1);
          --warning: #FFCE20;
          --warning-light: rgba(255, 206, 32, 0.15);
        }
        .text-dark-blue { color: var(--dark-blue) !important; }
        .text-muted-blue { color: var(--muted-blue) !important; }
        .text-primary-accent { color: var(--primary-accent) !important; }
        .bg-primary-light { background-color: var(--primary-light) !important; }
        .bg-success-light { background-color: var(--success-light) !important; }
        .text-success { color: var(--success) !important; }
        .text-warning { color: #f59e0b !important; }

        .dashboard-container {
          background-color: var(--bg-color);
        }
        .font-sans {
          font-family: "Inter", "Kanit", -apple-system, sans-serif;
        }
        .fw-black { font-weight: 800; }
        .fw-medium { font-weight: 500; }
        
        .icon-box-primary {
          width: 36px; height: 36px;
          background: var(--primary-accent);
          color: white;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
        }
        .stat-card {
          background: white;
          box-shadow: 0 10px 30px rgba(0,0,0,0.03);
          border: 1px solid rgba(0,0,0,0.02);
        }
        .premium-card {
          background: white;
          box-shadow: 0 15px 40px -15px rgba(0,0,0,0.05) !important;
        }
        .premium-search-box {
          background-color: #F4F7FE;
          border: 1px solid transparent;
          transition: all 0.2s ease;
        }
        .premium-search-box:focus-within {
          background-color: white;
          border-color: var(--primary-accent);
          box-shadow: 0 0 0 4px var(--primary-light);
        }
        .premium-btn {
          border: 1px solid #E9EDF7;
          color: var(--dark-blue);
          background: white;
          transition: all 0.2s ease;
        }
        .premium-btn:hover {
          background: #F4F7FE;
        }
        .btn-primary-accent {
          background: var(--primary-accent) !important;
          color: white !important;
          border-color: var(--primary-accent) !important;
          box-shadow: 0 4px 15px var(--primary-light);
        }

        /* Table Styles */
        .table-border-custom { margin-bottom: 0; }
        .premium-thead th {
          background-color: white;
          color: var(--muted-blue);
          font-weight: 700;
          font-size: 0.75rem;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #E9EDF7 !important;
          padding-bottom: 1rem !important;
        }
        .premium-row {
          transition: all 0.2s ease;
          border-bottom: 1px solid #F4F7FE !important;
        }
        .premium-row:last-child { border-bottom: none !important; }
        .premium-row:hover {
          background-color: #F8FAFF;
          transform: translateY(-1px);
        }
        
        .premium-img-box {
          width: 50px; height: 50px;
          background: #F4F7FE;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          padding: 8px;
        }
        .premium-img-box img { max-width: 100%; max-height: 100%; object-fit: contain; }
        
        .badge-issue-no {
          background: #E0EAFC;
          color: var(--primary-accent);
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.85rem;
          display: inline-block;
          width: fit-content;
        }
        .premium-note {
          background: var(--warning-light);
          color: #D97706;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 500;
          display: inline-block;
        }

        .icon-circle-sm {
          width: 28px; height: 28px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
        }
        .label-tiny {
          font-size: 0.55rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--muted-blue);
          margin-bottom: 0;
          font-weight: 700;
        }

        .premium-qty-box {
          background: white;
          border: 1px solid #E9EDF7;
          border-radius: 20px;
          padding: 6px 16px;
          display: inline-flex;
          align-items: center;
          box-shadow: 0 2px 6px rgba(0,0,0,0.02);
        }
        
        .badge-status-completed {
          background: var(--success-light);
          color: var(--success);
          font-weight: 700;
          padding: 6px 14px;
          border-radius: 20px;
          display: inline-flex;
          align-items: center;
          font-size: 0.85rem;
        }
        .badge-status-partial {
          background: var(--warning-light);
          color: #D97706;
          font-weight: 700;
          padding: 6px 14px;
          border-radius: 20px;
          display: inline-flex;
          align-items: center;
          font-size: 0.85rem;
        }

        .btn-action-circle {
          width: 36px; height: 36px;
          border-radius: 50% !important;
          display: inline-flex; align-items: center; justify-content: center;
          background: white;
          color: var(--muted-blue);
          border: 1px solid #E9EDF7;
          transition: all 0.2s ease;
        }
        .premium-row:hover .btn-action-circle,
        .btn-action-circle:hover {
          background: var(--primary-accent);
          color: white !important;
          border-color: var(--primary-accent);
          box-shadow: 0 4px 10px var(--primary-light);
        }
        .hover-primary:hover { color: var(--primary-accent) !important; }
      `}</style>
    </div>
  );
};

export default StockIssueDashboardScreen;
