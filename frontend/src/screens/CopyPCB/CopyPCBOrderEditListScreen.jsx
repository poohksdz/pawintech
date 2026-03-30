import React, { useState } from "react";
import { useSelector } from "react-redux";
import Loader from "../../components/Loader";
import Message from "../../components/Message";
import {
  useGetAllcopyPCBsQuery,
  useDeletecopyPCBMutation,
} from "../../slices/copypcbApiSlice";
import { Table, Button, Row, Col, Modal } from "react-bootstrap";
import { FaEdit, FaTrash } from "react-icons/fa";
import { Link } from "react-router-dom";

const CopyPCBOrderEditListScreen = () => {
  const { data, isLoading, error, refetch } = useGetAllcopyPCBsQuery();

  const [deletecopyPCB, { isLoading: loadingDelete }] =
    useDeletecopyPCBMutation();

  const [showModal, setShowModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const handleShowModal = (id) => {
    setSelectedOrderId(id);
    setShowModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deletecopyPCB(selectedOrderId).unwrap();
      refetch();
      setShowModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteHandler = (id) => {
    handleShowModal(id);
  };

  const { language } = useSelector((state) => state.language);

  const translations = {
    en: {
      CopyOrderListLbl: "Copy PCB Order List",
      ErrorMessageLbl: "No copy PCB orders found.",
      projectIDLbl: "Project ID",
      projectnameLbl: "Project Name",
      QtyLbl: "Quantity",
      TotalPriceLbl: "Total Price (฿)",
      DATELbl: "Date",
      EDITLbl: "Edit",
      DeliveryLbl: "Delivery",
      ConfirmLbl: "Confirm",
      CancelLbl: "Cancel",
      DetailLbl: "Details",
      Areyousure: "Are you sure?",
      Actioncannotbendone: "This action cannot be undone.",
      CloseLbl: "Close",
    },
    thai: {
      CopyOrderListLbl: "รายการสั่งซื้อ PCB แบบคัดลอก",
      ErrorMessageLbl: "ไม่พบคำสั่งซื้อ PCB แบบคัดลอก",
      projectIDLbl: "รหัสโปรเจกต์",
      projectnameLbl: "ชื่อโปรเจกต์",
      QtyLbl: "จำนวน",
      TotalPriceLbl: "ราคารวม (฿)",
      DATELbl: "วันที่",
      EDITLbl: "แก้ไข",
      DeliveryLbl: "การจัดส่ง",
      ConfirmLbl: "ยืนยัน",
      CancelLbl: "ยกเลิก",
      DetailLbl: "รายละเอียด",
      Areyousure: "คุณแน่ใจหรือไม่?",
      Actioncannotbendone: "การกระทำนี้ไม่สามารถย้อนกลับได้",
      CloseLbl: "ปิด",
    },
  };

  const t = translations[language] || translations.en;

  return (
    <>
      <Row className="align-items-center">
        <Col>
          <h1>{t.CopyOrderListLbl}</h1>
        </Col>
      </Row>

      {isLoading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">
          {error?.data?.message || error.message}
        </Message>
      ) : Array.isArray(data?.data) && data.data.length === 0 ? (
        <Message variant="info">{t.ErrorMessageLbl}</Message>
      ) : (
        <Table striped bordered hover responsive className="table-sm">
          <thead>
            <tr>
              <th>#</th>
              <th>{t.projectIDLbl}</th>
              <th>{t.projectnameLbl}</th>
              <th>{t.QtyLbl}</th>
              <th>{t.TotalPriceLbl}</th>
              <th>{t.DATELbl}</th>
              <th>{t.EDITLbl}</th>
            </tr>
          </thead>
          <tbody>
            {data.data.map((order, index) => (
              <tr key={order.id}>
                <td>{index + 1}</td>
                <td>{order.orderID}</td>
                <td>{order.projectname}</td>
                <td>{order.pcb_qty}</td>
                <td>
                  {order.confirmed_price
                    ? parseFloat(order.confirmed_price).toFixed(2)
                    : "-"}
                </td>
                <td>{new Date(order.created_at).toLocaleDateString()}</td>
                <td>
                  <Button
                    as={Link}
                    to={`/admin/ordercopypcbeditlist/${order.id}/edit`}
                    variant="light"
                    className="btn-sm mx-2"
                  >
                    <FaEdit />
                  </Button>
                  <Button
                    variant="danger"
                    className="btn-sm"
                    onClick={() => deleteHandler(order.id)}
                    disabled={loadingDelete}
                  >
                    <FaTrash style={{ color: "white" }} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        dialogClassName="modal-top"
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header closeButton>
          <Modal.Title>{t.Areyousure}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{t.Actioncannotbendone}</Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setShowModal(false)}>
            {t.CloseLbl}
          </Button>
          <Button
            variant="danger"
            style={{ color: "white" }}
            onClick={handleConfirmDelete}
          >
            {t.ConfirmLbl}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default CopyPCBOrderEditListScreen;
