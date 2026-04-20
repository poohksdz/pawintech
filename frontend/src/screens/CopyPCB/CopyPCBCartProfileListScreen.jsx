import React from "react";
import { useSelector } from "react-redux";
import Loader from "../../components/Loader";
import Message from "../../components/Message";
import { useGetcopyPCBByUserIDQuery } from "../../slices/copypcbApiSlice";
import { Table, Button, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import { FaTimes } from "react-icons/fa";

const CopyPCBCartProfileListScreen = () => {
  const { userInfo } = useSelector((state) => state.auth);

  const { data, isLoading, error, refetch } = useGetcopyPCBByUserIDQuery(
    userInfo?._id,
    {
      skip: !userInfo?._id,
    },
  );

  const { language } = useSelector((state) => state.language);

  const translations = {
    en: {
      CopyPCBOrderLbl: "Copy PCB Orders",
      ErrorMessageLbl: "No copy PCB orders found.",
      projectidlbl: "Project ID",
      projectnameLbl: "Project Name",
      QtyLbl: "Quantity",
      TotalPriceLbl: "Total Price (฿)",
      DATELbl: "Date",
      DeliveryLbl: "Delivery",
      DetailLbl: "Details",
    },
    thai: {
      CopyPCBOrderLbl: "คำสั่งซื้อ PCB ที่คัดลอก",
      ErrorMessageLbl: "ไม่พบคำสั่งซื้อ PCB ที่คัดลอก",
      projectidlbl: "รหัสโปรเจกต์",
      projectnameLbl: "ชื่อโปรเจกต์",
      QtyLbl: "จำนวน",
      TotalPriceLbl: "ราคารวม (฿)",
      DATELbl: "วันที่",
      DeliveryLbl: "การจัดส่ง",
      DetailLbl: "รายละเอียด",
    },
  };

  const t = translations[language] || translations.en;

  return (
    <>
      <Row className="align-items-center mb-3">
        <Col>
          <h1>{t.CopyPCBOrderLbl}</h1>
        </Col>
      </Row>

      {isLoading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{t.ErrorMessageLbl}</Message>
      ) : Array.isArray(data?.data) && data.data.length === 0 ? (
        <Message variant="danger">{t.ErrorMessageLbl}</Message>
      ) : (
        <Table striped bordered hover responsive className="table-sm">
          <thead>
            <tr>
              <th>#</th>
              <th>{t.projectidlbl}</th>
              <th>{t.projectnameLbl}</th>
              <th>{t.QtyLbl}</th>
              <th>{t.TotalPriceLbl}</th>
              <th>{t.DATELbl}</th>
              <th>{t.DeliveryLbl}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.data
              .filter((order) => order.pcb_qty > 0)
              .map((order, index) => (
                <tr key={order.id}>
                  <td>{index + 1}</td>
                  <td>{order.orderID}</td>
                  <td>{order.projectname}</td>
                  <td>{order.pcb_qty}</td>
                  <td>{order.confirmed_price}</td>
                  <td>{new Date(order.created_at).toLocaleDateString()}</td>
                  <td>
                    {order.isDelivered ? (
                      order.deliveryOn?.substring(0, 10)
                    ) : (
                      <FaTimes style={{ color: "red" }} />
                    )}
                  </td>
                  <td className="text-center">
                    <Button
                      as={Link}
                      to={`/${order.id}`}
                      variant="light"
                      className="btn-sm"
                    >
                      {t.DetailLbl}
                    </Button>
                  </td>
                </tr>
              ))}
          </tbody>
        </Table>
      )}
    </>
  );
};

export default CopyPCBCartProfileListScreen;
