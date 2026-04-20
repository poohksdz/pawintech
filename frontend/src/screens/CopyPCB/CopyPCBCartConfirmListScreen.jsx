import React, { useState } from "react";
import { useSelector } from "react-redux";
import Loader from "../../components/Loader";
import Message from "../../components/Message";
import { useGetAllcopycartsQuery } from "../../slices/copypcbCartApiSlice";
import { Table, Button, Row, Col } from "react-bootstrap";
import { FaCheck } from "react-icons/fa";
import { Link } from "react-router-dom";

import CopyPCBCartConfirmModle from "./CopyPCBCartConfirmModle";

const CopyPCBCartConfirmListScreen = () => {
  // userInfo not needed (public admin list)

  const { data, isLoading, error, refetch } = useGetAllcopycartsQuery();

  // State for modal visibility and selected order id
  const [showModal, setShowModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const handleShowModal = (id) => {
    setSelectedOrderId(id);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setSelectedOrderId(null);
    setShowModal(false);
  };

  const { language } = useSelector((state) => state.language);

  const translations = {
    en: {
      ConfirmCopyOrderListLbl: "Confirm Copy PCB Order List",
      ErrorMessageLbl: "No copy PCB orders found.",
      projectnameLbl: "Project Name",
      QtyLbl: "Quantity",
      TotalPriceLbl: "Total Price (฿)",
      DATELbl: "Date",
      DeliveryLbl: "Delivery",
      Status: "Status",
      ConfirmLbl: "Confirm",
      DetailLbl: "Details",
      AcceptLbl: "Accepted",
      RejectLbl: "Rejected",
      PendingLbl: "Pending",
    },
    thai: {
      ConfirmCopyOrderListLbl: "รายการยืนยันการสั่งซื้อ PCB แบบคัดลอก",
      ErrorMessageLbl: "ไม่พบคำสั่งซื้อ PCB แบบคัดลอก",
      projectnameLbl: "ชื่อโปรเจกต์",
      QtyLbl: "จำนวน",
      TotalPriceLbl: "ราคารวม (฿)",
      DATELbl: "วันที่",
      DeliveryLbl: "การจัดส่ง",
      Status: "สถานะ",
      ConfirmLbl: "ยืนยัน",
      DetailLbl: "รายละเอียด",
      AcceptLbl: "ยอมรับแล้ว",
      RejectLbl: "ปฏิเสธแล้ว",
      PendingLbl: "รอดำเนินการ",
    },
  };

  const t = translations[language] || translations.en;

  return (
    <>
      <Row className="align-items-center">
        <Col>
          <h1>{t.ConfirmCopyOrderListLbl}</h1>
        </Col>
        {/* <Col className="text-end">
          <Button className="my-3">
            <PiCircuitryFill size={20} /> Default PCB Price
          </Button>
        </Col> */}
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
              <th>{t.projectnameLbl}</th>
              <th>{t.QtyLbl}</th>
              <th>{t.TotalPriceLbl}</th>
              <th>{t.DATELbl}</th>
              <th>{t.status}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.data
              .filter((order) => parseInt(order.pcb_qty) > 0)
              .map((order, index) => (
                <tr key={order.id}>
                  <td>{index + 1}</td>
                  <td>{order.projectname}</td>
                  <td>{order.pcb_qty}</td>
                  <td>
                    {order.status === "pending" && (
                      <span className="text-warning">-</span>
                    )}
                    {order.status === "accepted" &&
                      (order.confirmed_price
                        ? parseFloat(order.confirmed_price).toFixed(2)
                        : "N/A")}
                    {order.status === "rejected" && (
                      <span className="text-danger">-</span>
                    )}
                  </td>
                  <td>{new Date(order.created_at).toLocaleDateString()}</td>
                  <td>
                    {order.status === "pending" && (
                      <span className="text-warning">{t.PendingLbl}</span>
                    )}
                    {order.status === "accepted" && (
                      <span className="text-success">{t.AcceptLbl}</span>
                    )}
                    {order.status === "rejected" && (
                      <span className="text-danger">{t.RejectLbl}</span>
                    )}
                  </td>
                  <td className="text-center">
                    {order.status === "pending" ? (
                      <Button
                        variant="light"
                        className="btn-sm btn-lime"
                        onClick={() => handleShowModal(order.id)}
                      >
                        {t.ConfirmLbl}
                      </Button>
                    ) : (
                      <FaCheck style={{ color: "green" }} />
                    )}
                  </td>
                  <td className="text-center">
                    <Button
                      as={Link}
                      to={`/${order.id}`}
                      variant="light"
                      className="btn-sm primary"
                    >
                      {t.DetailLbl}
                    </Button>
                  </td>
                </tr>
              ))}
          </tbody>
        </Table>
      )}

      {/* Modal Component */}
      <CopyPCBCartConfirmModle
        show={showModal}
        handleClose={handleCloseModal}
        pcborderId={selectedOrderId}
        onConfirm={() => {
          refetch(); // refresh data after confirming
          handleCloseModal(); // also close modal after confirm
        }}
      />
    </>
  );
};

export default CopyPCBCartConfirmListScreen;
