import React, { useState, useMemo } from "react";
import Loader from "../../components/Loader";
import Message from "../../components/Message";
import { Link } from "react-router-dom";
import {
  Table,
  Button,
  Row,
  Col,
  Modal,
  Card,
  Container,
  Badge,
  InputGroup,
  Form,
} from "react-bootstrap";
import { toast } from "react-toastify";
import {
  FaEdit,
  FaTrash,
  FaSearch,
  FaMicrochip,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaClipboardList,
} from "react-icons/fa";
import { PiCircuitryFill, PiCurrencyCircleDollarFill } from "react-icons/pi";
import { useSelector } from "react-redux";
import {
  useGetAllOrderPCBsQuery,
  useDeleteOrderPCBMutation,
} from "../../slices/orderpcbSlice";

// Helper Function for formatting currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
  }).format(amount);
};

const OrderPCBEditListsScreen = () => {
  const [showModal, setShowModal] = useState(false);
  const [pcbToDelete, setPCBToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading, error, refetch } = useGetAllOrderPCBsQuery();

  const [deleteOrderPCB, { isLoading: loadingDelete }] =
    useDeleteOrderPCBMutation();
  const { language } = useSelector((state) => state.language);

  const translations = {
    en: {
      Title: "Gerber PCB Management",
      Subtitle: "Overview of all custom PCB manufacturing orders",
      DefaultPrice: "Configuration",
      ErrorMessageLbl: "No Gerber PCB orders found.",
      ProjectName: "Project Info",
      PCBID: "Order ID",
      Qty: "Quantity",
      TotalPrice: "Total Value",
      Date: "Submitted Date",
      Action: "Actions",
      SearchPlaceholder: "Search by Project Name or ID...",
      TotalOrders: "Total Orders",
      TotalRevenue: "Estimated Revenue",
      DeleteTitle: "Delete Order?",
      DeleteMsg: "This action is permanent and cannot be undone. Are you sure?",
      Cancel: "Keep Order",
      Delete: "Yes, Delete",
      Showing: "Showing",
      Items: "orders",
      EmptyState: "No orders found match your search.",
    },
    thai: {
      Title: "จัดการคำสั่งซื้อ PCB (Gerber)",
      Subtitle: "ภาพรวมรายการสั่งผลิต PCB และใบเสนอราคาทั้งหมด",
      DefaultPrice: "ตั้งค่าราคา",
      ErrorMessageLbl: "ไม่พบคำสั่งซื้อ PCB ในระบบ",
      ProjectName: "ข้อมูลโปรเจกต์",
      PCBID: "รหัสสั่งซื้อ",
      Qty: "จำนวน",
      TotalPrice: "มูลค่ารวม",
      Date: "วันที่สั่งซื้อ",
      Action: "จัดการ",
      SearchPlaceholder: "ค้นหาชื่อโปรเจกต์ หรือรหัสสั่งซื้อ...",
      TotalOrders: "ออเดอร์ทั้งหมด",
      TotalRevenue: "มูลค่าประเมินรวม",
      DeleteTitle: "ยืนยันการลบ",
      DeleteMsg: "คุณแน่ใจหรือไม่ที่จะลบรายการนี้? ข้อมูลจะหายไปถาวร",
      Cancel: "ยกเลิก",
      Delete: "ยืนยันลบ",
      Showing: "แสดง",
      Items: "รายการ",
      EmptyState: "ไม่พบรายการที่ตรงกับคำค้นหา",
    },
  };

  const t = translations[language] || translations.en;

  // --- Logic: Filter & Search ---
  const filteredOrders = useMemo(() => {
    if (!data) return [];

    let sortedData = [...data].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at),
    );

    if (!searchTerm) return sortedData;

    return sortedData.filter(
      (order) =>
        order.projectname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.orderID?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [data, searchTerm]);

  // --- Logic: Stats ---
  const stats = useMemo(() => {
    if (!data) return { count: 0, revenue: 0 };
    return {
      count: data.length,
      revenue: data.reduce(
        (acc, item) => acc + (parseFloat(item.quoted_price_to_customer) || 0),
        0,
      ),
    };
  }, [data]);

  const deleteHandler = (id) => {
    setPCBToDelete(id);
    setShowModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteOrderPCB(pcbToDelete);
      refetch();
      setShowModal(false);
      toast.success("Deleted successfully");
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  return (
    <div className="bg-light min-vh-100 py-4 font-prompt">
      <Container fluid="lg">
        {/* --- Header Section --- */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 gap-3 animate__animated animate__fadeInDown">
          <div className="d-flex align-items-center gap-3">
            <div
              className="bg-white p-3 rounded-4 shadow-sm text-primary d-flex align-items-center justify-content-center border"
              style={{ width: 60, height: 60 }}
            >
              <PiCircuitryFill size={32} />
            </div>
            <div>
              <h2 className="fw-bold text-dark mb-0">{t.Title}</h2>
              <p className="text-muted mb-0 small">{t.Subtitle}</p>
            </div>
          </div>
          <Button
            as={Link}
            to="/admin/orderpcbeditlist"
            variant="dark"
            className="rounded-pill px-4 py-2 fw-bold shadow-sm d-flex align-items-center gap-2 hover-scale"
          >
            <FaEdit /> {t.DefaultPrice}
          </Button>
        </div>

        {/* --- Dashboard Stats Cards --- */}
        <Row className="g-4 mb-4 animate__animated animate__fadeInUp">
          <Col xs={12} md={6}>
            <Card className="border-0 shadow-sm rounded-4 h-100 overflow-hidden card-stat">
              <Card.Body className="p-4 position-relative">
                <div className="d-flex justify-content-between align-items-start z-1 position-relative">
                  <div>
                    <div className="text-muted fw-bold text-uppercase small mb-2">
                      {t.TotalOrders}
                    </div>
                    <h2 className="display-5 fw-bold text-dark mb-0">
                      {stats.count}
                    </h2>
                  </div>
                  <div className="icon-bg bg-primary bg-opacity-10 text-primary rounded-4 p-3">
                    <FaClipboardList size={28} />
                  </div>
                </div>
                {/* Decorative Circle */}
                <div className="position-absolute bottom-0 end-0 opacity-10 translate-middle-y me-n3 mb-n3">
                  <FaClipboardList size={120} color="#0d6efd" />
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card className="border-0 shadow-sm rounded-4 h-100 overflow-hidden card-stat bg-primary text-white">
              <Card.Body className="p-4 position-relative">
                <div className="d-flex justify-content-between align-items-start z-1 position-relative">
                  <div>
                    <div className="text-white text-opacity-75 fw-bold text-uppercase small mb-2">
                      {t.TotalRevenue}
                    </div>
                    <h2 className="display-5 fw-bold mb-0">
                      {formatCurrency(stats.revenue)}
                    </h2>
                  </div>
                  <div className="icon-bg bg-white bg-opacity-25 text-white rounded-4 p-3">
                    <PiCurrencyCircleDollarFill size={28} />
                  </div>
                </div>
                {/* Decorative Circle */}
                <div className="position-absolute bottom-0 end-0 opacity-25 translate-middle-y me-n3 mb-n3">
                  <FaMoneyBillWave size={120} color="#fff" />
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* --- Main Content Card --- */}
        <Card className="border-0 shadow rounded-4 overflow-hidden animate__animated animate__fadeInUp animate__delay-1s">
          {/* Toolbar */}
          <div className="p-4 bg-white border-bottom">
            <Row className="g-3 align-items-center">
              <Col xs={12} md={6} lg={5}>
                <InputGroup className="search-bar shadow-sm rounded-pill">
                  <InputGroup.Text className="bg-white border-0 ps-3 text-muted">
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    placeholder={t.SearchPlaceholder}
                    className="border-0 shadow-none bg-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <Button
                      variant="link"
                      className="text-muted text-decoration-none"
                      onClick={() => setSearchTerm("")}
                    >
                      x
                    </Button>
                  )}
                </InputGroup>
              </Col>
              <Col xs={12} md={6} lg={7} className="text-md-end">
                <Badge
                  bg="light"
                  text="dark"
                  className="border px-3 py-2 rounded-pill fw-normal"
                >
                  {t.Showing}{" "}
                  <span className="fw-bold">{filteredOrders.length}</span>{" "}
                  {t.Items}
                </Badge>
              </Col>
            </Row>
          </div>

          <Card.Body className="p-0 bg-light">
            {isLoading ? (
              <div className="text-center py-5">
                <Loader />
                <p className="text-muted mt-3">Loading orders...</p>
              </div>
            ) : error ? (
              <div className="p-4">
                <Message variant="danger">{t.ErrorMessageLbl}</Message>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-5">
                <div className="bg-white p-4 rounded-circle shadow-sm d-inline-block mb-3">
                  <FaMicrochip
                    size={40}
                    className="text-secondary opacity-50"
                  />
                </div>
                <h5 className="text-muted">{t.EmptyState}</h5>
                {searchTerm && (
                  <Button variant="link" onClick={() => setSearchTerm("")}>
                    Clear Search
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* --- Desktop Table View --- */}
                <div className="table-responsive d-none d-lg-block">
                  <Table hover className="align-middle mb-0 custom-table">
                    <thead className="bg-white text-secondary text-uppercase small">
                      <tr>
                        <th
                          className="py-3 ps-4 border-bottom"
                          style={{ width: "5%" }}
                        >
                          #
                        </th>
                        <th
                          className="py-3 border-bottom"
                          style={{ width: "15%" }}
                        >
                          {t.PCBID}
                        </th>
                        <th
                          className="py-3 border-bottom"
                          style={{ width: "30%" }}
                        >
                          {t.ProjectName}
                        </th>
                        <th
                          className="py-3 border-bottom text-center"
                          style={{ width: "10%" }}
                        >
                          {t.Qty}
                        </th>
                        <th
                          className="py-3 border-bottom"
                          style={{ width: "15%" }}
                        >
                          {t.TotalPrice}
                        </th>
                        <th
                          className="py-3 border-bottom"
                          style={{ width: "15%" }}
                        >
                          {t.Date}
                        </th>
                        <th
                          className="py-3 pe-4 border-bottom text-end"
                          style={{ width: "10%" }}
                        >
                          {t.Action}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {filteredOrders.map((pcb, index) => (
                        <tr key={pcb.id} className="row-hover">
                          <td className="ps-4 text-muted small">{index + 1}</td>
                          <td>
                            <Badge
                              bg="light"
                              text="dark"
                              className="border font-monospace text-secondary fw-normal"
                            >
                              {pcb.orderID}
                            </Badge>
                          </td>
                          <td>
                            <div
                              className="fw-bold text-dark text-truncate"
                              style={{ maxWidth: "250px" }}
                              title={pcb.projectname}
                            >
                              {pcb.projectname}
                            </div>
                          </td>
                          <td className="text-center">
                            <span className="fw-bold text-dark bg-light px-2 py-1 rounded border">
                              {pcb.pcb_quantity}
                            </span>
                          </td>
                          <td>
                            <span className="fw-bold text-success">
                              {formatCurrency(
                                pcb.quoted_price_to_customer ||
                                  pcb.total_amount_cost,
                              )}
                            </span>
                          </td>
                          <td className="text-muted small">
                            <div className="d-flex align-items-center gap-2">
                              <FaCalendarAlt className="text-primary opacity-50" />
                              {new Date(pcb.created_at).toLocaleDateString(
                                language === "thai" ? "th-TH" : "en-GB",
                              )}
                            </div>
                          </td>
                          <td className="pe-4 text-end">
                            <div className="d-flex justify-content-end gap-2">
                              <Button
                                as={Link}
                                to={`/admin/orderpcbeditlists/${pcb.id}/edit`}
                                variant="light"
                                size="sm"
                                className="btn-icon rounded-circle text-primary border-0 bg-primary bg-opacity-10"
                                title="Edit"
                              >
                                <FaEdit />
                              </Button>
                              <Button
                                variant="light"
                                size="sm"
                                className="btn-icon rounded-circle text-danger border-0 bg-danger bg-opacity-10"
                                onClick={() => deleteHandler(pcb.id)}
                                disabled={loadingDelete}
                                title="Delete"
                              >
                                <FaTrash />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>

                {/* --- Mobile Card View --- */}
                <div className="d-lg-none p-3">
                  <Row className="g-3">
                    {filteredOrders.map((pcb) => (
                      <Col xs={12} key={pcb.id}>
                        <Card className="border-0 shadow-sm rounded-4 h-100">
                          <Card.Body className="p-3">
                            <div className="d-flex justify-content-between align-items-start mb-3">
                              <div className="d-flex align-items-center gap-2">
                                <div className="bg-primary bg-opacity-10 text-primary p-2 rounded-3">
                                  <FaMicrochip />
                                </div>
                                <div>
                                  <div
                                    className="font-monospace text-muted small"
                                    style={{ fontSize: "0.75rem" }}
                                  >
                                    {pcb.orderID}
                                  </div>
                                  <div
                                    className="fw-bold text-dark text-truncate"
                                    style={{ maxWidth: "200px" }}
                                  >
                                    {pcb.projectname}
                                  </div>
                                </div>
                              </div>
                              <Badge
                                bg="success"
                                className="bg-opacity-10 text-success border border-success fw-bold"
                              >
                                {formatCurrency(pcb.quoted_price_to_customer)}
                              </Badge>
                            </div>

                            <div className="bg-light rounded-3 p-2 mb-3 d-flex justify-content-between small">
                              <div className="text-muted">
                                <FaClipboardList className="me-1" /> Qty:{" "}
                                <span className="fw-bold text-dark">
                                  {pcb.pcb_quantity}
                                </span>
                              </div>
                              <div className="text-muted">
                                <FaCalendarAlt className="me-1" />{" "}
                                {new Date(pcb.created_at).toLocaleDateString()}
                              </div>
                            </div>

                            <Row className="g-2">
                              <Col xs={6}>
                                <Button
                                  as={Link}
                                  to={`/admin/orderpcbeditlists/${pcb.id}/edit`}
                                  variant="outline-primary"
                                  size="sm"
                                  className="w-100 rounded-3 border-opacity-25 fw-bold"
                                >
                                  Edit
                                </Button>
                              </Col>
                              <Col xs={6}>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  className="w-100 rounded-3 border-opacity-25 fw-bold"
                                  onClick={() => deleteHandler(pcb.id)}
                                  disabled={loadingDelete}
                                >
                                  Delete
                                </Button>
                              </Col>
                            </Row>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </div>
              </>
            )}
          </Card.Body>
        </Card>
      </Container>

      {/* Delete Modal */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
        backdrop="static"
        contentClassName="border-0 shadow-lg rounded-4"
      >
        <Modal.Body className="p-4 text-center">
          <div className="bg-danger bg-opacity-10 text-danger p-4 rounded-circle d-inline-block mb-3">
            <FaTrash size={32} />
          </div>
          <h4 className="fw-bold text-dark mb-2">{t.DeleteTitle}</h4>
          <p className="text-muted mb-4">{t.DeleteMsg}</p>
          <div className="d-flex gap-2 justify-content-center">
            <Button
              variant="light"
              onClick={() => setShowModal(false)}
              className="rounded-pill px-4 fw-bold"
            >
              {t.Cancel}
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
              className="rounded-pill px-4 fw-bold shadow-sm"
            >
              {t.Delete}
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* Inline Styles */}
      <style>{`
        .font-prompt { font-family: 'Prompt', sans-serif; }
        .hover-scale:hover { transform: translateY(-2px); transition: all 0.2s ease; }
        .card-stat { transition: all 0.3s ease; }
        .card-stat:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important; }
        .search-bar { border: 1px solid #e9ecef; transition: all 0.2s; }
        .search-bar:focus-within { border-color: #0d6efd; box-shadow: 0 0 0 3px rgba(13,110,253,0.1); }
        .row-hover:hover { background-color: #f8f9fa; }
        .btn-icon { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .btn-icon:hover { transform: scale(1.1); filter: brightness(0.9); }
      `}</style>
    </div>
  );
};

export default OrderPCBEditListsScreen;
