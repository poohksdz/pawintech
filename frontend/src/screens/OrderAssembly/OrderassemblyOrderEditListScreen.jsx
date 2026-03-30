import React, { useState } from "react";
import { useSelector } from "react-redux";
import Loader from "../../components/Loader";
import Message from "../../components/Message";
import { Table, Button, Row, Col, Modal } from "react-bootstrap";
import { FaEdit, FaTrash } from "react-icons/fa";
import { PiCircuitryFill } from "react-icons/pi";
import { Link } from "react-router-dom";
import {
  useGetAllAssemblyPCBsQuery,
  useDeleteAssemblyPCBMutation,
} from "../../slices/assemblypcbApiSlice";

const OrderassemblyOrderEditListScreen = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const { language } = useSelector((state) => state.language);

  const { data, isLoading, error, refetch } = useGetAllAssemblyPCBsQuery();

  const [deleteAssemblyPCB, { isLoading: loadingDelete }] =
    useDeleteAssemblyPCBMutation();

  const [showModal, setShowModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const handleShowModal = (id) => {
    setSelectedOrderId(id);
    setShowModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteAssemblyPCB(selectedOrderId).unwrap();
      refetch();
      setShowModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteHandler = (id) => {
    handleShowModal(id);
  };

  const translations = {
    en: {
      AssemblyEditListsLbl: "Assembly Edit Lists",
      ErrorMessageLbl: "No custom PCB orders found.",
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
      DefaultAssemblyPrice: "Default Assembly Price",
    },
    thai: {
      AssemblyEditListsLbl: "รายการแก้ไข PCB แบบกำหนดเอง",
      ErrorMessageLbl: "ไม่พบคำสั่งซื้อ PCB แบบกำหนดเอง",
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
      DefaultAssemblyPrice: "ราคาการประกอบมาตรฐาน",
    },
  };

  const t = translations[language] || translations.en;

  return (
    <>
      <Row className="align-items-center">
        <Col>
          <h1>{t.AssemblyEditListsLbl}</h1>
        </Col>
        <Col className="text-end">
          <Button className="my-3" as={Link} to="/admin/assemblyboardeditd">
            <PiCircuitryFill size={20} /> {t.DefaultAssemblyPrice}
          </Button>
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
                    to={`/admin/assemblyboardeditlist/${order.id}/edit`}
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

export default OrderassemblyOrderEditListScreen;
