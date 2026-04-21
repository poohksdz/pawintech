import React from "react";
import { useSelector } from "react-redux";
import { Table, Badge, Button } from "react-bootstrap";
import { FaBoxOpen } from "react-icons/fa"; // เพิ่ม icon สำหรับ empty state
import Message from "../../components/Message";
import Loader from "../../components/Loader";
import { useGetMyOrdersQuery } from "../../slices/ordersApiSlice";
import { Link } from "react-router-dom";

const CustomerOrderProductList = () => {
  const { data: orders, isLoading, error } = useGetMyOrdersQuery();

  const { language } = useSelector((state) => state.language);

  const translations = {
    en: {
      productorders: "Product Orders",
      qty: "Qty",
      orderIdLbl: "Order ID",
      orderDateLbl: "Date",
      orderTotalLbl: "Total Price",
      orderDeliveredLbl: "Status",
      orderDetailsLbl: "View Details",
      statusDelivered: "Delivered",
      statusProcessing: "Processing",
      emptyState: "No product orders found",
    },
    thai: {
      productorders: "รายการคำสั่งซื้อสินค้า",
      qty: "จำนวน",
      orderIdLbl: "รหัสสั่งซื้อ",
      orderDateLbl: "วันที่สั่ง",
      orderTotalLbl: "ยอดรวม",
      orderDeliveredLbl: "สถานะ",
      orderDetailsLbl: "ดูรายละเอียด",
      statusDelivered: "จัดส่งแล้ว",
      statusProcessing: "กำลังดำเนินการ",
      emptyState: "ไม่พบรายการคำสั่งซื้อสินค้า",
    },
  };

  const t = translations[language] || translations.en;

  if (isLoading)
    return (
      <div className="text-center py-5">
        <Loader />
      </div>
    );

  if (error)
    return (
      <Message variant="danger">{error?.data?.message || error.error}</Message>
    );

  // Empty State Check
  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-5 text-muted">
        <FaBoxOpen size={50} className="mb-3 opacity-25" />
        <p className="fs-5">{t.emptyState}</p>
      </div>
    );
  }

  return (
    <>
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="fw-bold text-primary m-0">{t.productorders}</h5>
        <span className="badge bg-light text-secondary rounded-pill border">
          Total: {orders.length}
        </span>
      </div>

      {/* Table Section */}
      <div className="table-responsive">
        <Table hover className="align-middle table-borderless">
          <thead className="bg-light text-secondary border-bottom">
            <tr>
              <th className="py-3 ps-3">#</th>
              <th className="py-3">{t.orderIdLbl}</th>
              <th className="py-3">{t.orderDateLbl}</th>
              <th className="py-3 text-center">{t.qty}</th>
              <th className="py-3 text-end">{t.orderTotalLbl}</th>
              <th className="py-3 text-center">{t.orderDeliveredLbl}</th>
              <th className="py-3 text-end pe-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {[...orders]
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .map((order, index) => (
                <tr
                  key={order.id}
                  style={{ borderBottom: "1px solid #f0f0f0" }}
                >
                  <td className="ps-3 text-muted">{index + 1}</td>

                  {/* Order ID */}
                  <td>
                    <span className="fw-medium text-dark font-monospace">
                      {order.paymentComfirmID || order.id}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="small text-muted">
                    {order.createdAt?.substring(0, 10)}
                  </td>

                  {/* Qty */}
                  <td className="text-center">
                    <span className="badge bg-secondary bg-opacity-10 text-secondary rounded-pill px-3">
                      {order.totalQty || 0}
                    </span>
                  </td>

                  {/* Price */}
                  <td className="text-end fw-bold text-dark">
                    {order.totalPrice?.toLocaleString()} ฿
                  </td>

                  {/* Status Badge */}
                  <td className="text-center">
                    {order.isDelivered ? (
                      <Badge
                        bg="success"
                        className="rounded-pill fw-normal px-2"
                      >
                        {t.statusDelivered}
                        <span className="ms-1 opacity-75 small">
                          ({order.deliveredAt?.substring(0, 10)})
                        </span>
                      </Badge>
                    ) : (
                      <Badge
                        bg="warning"
                        text="dark"
                        className="rounded-pill fw-normal px-2"
                      >
                        {t.statusProcessing}
                      </Badge>
                    )}
                  </td>

                  {/* Action Button */}
                  <td className="text-end pe-3">
                    <Button
                      as={Link}
                      to={`/orderproduct/${order.id}`}
                      variant="outline-primary"
                      size="sm"
                      className="rounded-pill px-3"
                    >
                      {t.orderDetailsLbl}
                    </Button>
                  </td>
                </tr>
              ))}
          </tbody>
        </Table>
      </div>
    </>
  );
};

export default CustomerOrderProductList;
