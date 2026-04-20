import React, { useState } from "react";
import { useSelector } from "react-redux";
import Loader from "../../components/Loader";
import Message from "../../components/Message";
import {
  useGetAllCustomPCBsQuery,
  useDeleteCustomPCBMutation,
} from "../../slices/custompcbApiSlice";
//  แก้ไข: เพิ่ม Container เข้ามาในบรรทัดนี้แล้ว
import {
  Table,
  Button,
  Row,
  Col,
  Modal,
  Badge,
  Card,
  Container,
} from "react-bootstrap";
import { FaEdit, FaTrash } from "react-icons/fa";
import { Link } from "react-router-dom";

const CustomPCBEditListScreen = () => {
  const { data, isLoading, error, refetch } = useGetAllCustomPCBsQuery();
  const [deleteCustomPCB, { isLoading: loadingDelete }] =
    useDeleteCustomPCBMutation();

  const [showModal, setShowModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const handleShowModal = (id) => {
    setSelectedOrderId(id);
    setShowModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteCustomPCB(selectedOrderId).unwrap();
      refetch();
      setShowModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const { language } = useSelector((state) => state.language);
  const translations = {
    en: {
      CustomOrderListLbl: "Custom PCB Order Management",
      ErrorMessageLbl: "No custom PCB orders found.",
      projectIDLbl: "Order ID",
      projectnameLbl: "Project Name",
      QtyLbl: "Qty",
      TotalPriceLbl: "Price (฿)",
      DATELbl: "Date",
      EDITLbl: "Actions",
      ConfirmLbl: "Confirm Delete",
      CloseLbl: "Cancel",
      Areyousure: "Confirm Deletion?",
      Actioncannotbendone:
        "This will permanently remove the order from the system.",
    },
    thai: {
      CustomOrderListLbl: "จัดการรายการสั่งทำ PCB",
      ErrorMessageLbl: "ไม่พบคำสั่งซื้อ PCB แบบกำหนดเอง",
      projectIDLbl: "รหัสสั่งซื้อ",
      projectnameLbl: "ชื่อโปรเจกต์",
      QtyLbl: "จำนวน",
      TotalPriceLbl: "ราคา (฿)",
      DATELbl: "วันที่",
      EDITLbl: "จัดการ",
      ConfirmLbl: "ยืนยันการลบ",
      CloseLbl: "ยกเลิก",
      Areyousure: "ยืนยันการลบข้อมูล?",
      Actioncannotbendone: "การกระทำนี้จะไม่สามารถกู้คืนข้อมูลกลับมาได้",
    },
  };

  const t = translations[language] || translations.en;

  return (
    <Container className="py-4">
      {/* --- Header Section --- */}
      <Row className="mb-4 align-items-center">
        <Col>
          <h2 className="fw-bold text-dark mb-0">
            <span className="border-start border-primary border-4 ps-3">
              {t.CustomOrderListLbl}
            </span>
          </h2>
        </Col>
        <Col xs="auto">
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => refetch()}
            className="rounded-pill px-3 shadow-sm"
          >
            Refresh Data
          </Button>
        </Col>
      </Row>

      {isLoading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">
          {error?.data?.message || error.message}
        </Message>
      ) : (
        <Card className="shadow-sm border-0 rounded-4 overflow-hidden">
          <Table hover responsive className="mb-0 align-middle">
            <thead className="bg-light">
              <tr className="text-secondary small text-uppercase">
                <th className="ps-4 py-3">#</th>
                <th>{t.projectIDLbl}</th>
                <th>{t.projectnameLbl}</th>
                <th className="text-center">{t.QtyLbl}</th>
                <th>{t.TotalPriceLbl}</th>
                <th>{t.DATELbl}</th>
                <th className="text-center pe-4">{t.EDITLbl}</th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.map((order, index) => (
                <tr key={order.id} className="border-bottom">
                  <td className="ps-4 text-muted">{index + 1}</td>
                  <td className="fw-medium text-primary">#{order.orderID}</td>
                  <td>
                    <div className="fw-bold text-dark">{order.projectname}</div>
                  </td>
                  <td className="text-center">
                    <Badge bg="light" text="dark" className="border px-2 py-1">
                      {order.pcb_qty}
                    </Badge>
                  </td>
                  <td>
                    {order.confirmed_price ? (
                      <span className="text-success fw-bold">
                        ฿{parseFloat(order.confirmed_price).toLocaleString()}
                      </span>
                    ) : (
                      <Badge bg="warning" text="dark" className="fw-normal">
                        Waiting for Quote
                      </Badge>
                    )}
                  </td>
                  <td className="text-muted small">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="text-center pe-4">
                    <div className="d-flex justify-content-center gap-2">
                      <Button
                        as={Link}
                        to={`/admin/ordercustompcbEditlist/${order.id}/edit`}
                        variant="primary"
                        className="btn-sm rounded-3 d-flex align-items-center px-3 shadow-sm"
                      >
                        <FaEdit className="me-1" />{" "}
                        {language === "thai" ? "ตรวจงาน" : "Review"}
                      </Button>
                      <Button
                        variant="outline-danger"
                        className="btn-sm rounded-3"
                        onClick={() => handleShowModal(order.id)}
                        disabled={loadingDelete}
                      >
                        <FaTrash />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {(!data?.data || data.data.length === 0) && (
            <div className="text-center py-5">
              <p className="text-muted mb-0">{t.ErrorMessageLbl}</p>
            </div>
          )}
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Body className="text-center p-4">
          <div className="text-danger mb-3">
            <FaTrash size={40} />
          </div>
          <h4 className="fw-bold">{t.Areyousure}</h4>
          <p className="text-muted">{t.Actioncannotbendone}</p>
          <div className="d-flex justify-content-center gap-2 mt-4">
            <Button
              variant="light"
              className="px-4 rounded-pill"
              onClick={() => setShowModal(false)}
            >
              {t.CloseLbl}
            </Button>
            <Button
              variant="danger"
              className="px-4 rounded-pill shadow-sm"
              onClick={handleConfirmDelete}
            >
              {t.ConfirmLbl}
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      <style dangerouslySetInnerHTML={{ __html: `
        .table thead th { font-weight: 600; font-size: 0.75rem; border-top: none; background-color: #f1f5f9; }
        .table tbody tr:hover { background-color: #f8fafc; transition: background 0.2s; }
        .badge { font-weight: 500; font-size: 0.75rem; }
      ` }} />
    </Container>
  );
};

export default CustomPCBEditListScreen;
