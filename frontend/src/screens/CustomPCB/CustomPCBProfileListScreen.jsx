import React from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Table, Button, Badge } from "react-bootstrap";
import { FaBoxOpen, FaSearch } from "react-icons/fa"; // Icons
import Loader from "../../components/Loader";
import Message from "../../components/Message";
import { useGetCustomPCBByUserIDQuery } from "../../slices/custompcbApiSlice";

const CustomPCBProfileListScreen = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const { language } = useSelector((state) => state.language);

  const { data, isLoading, error } = useGetCustomPCBByUserIDQuery(
    userInfo?._id,
    {
      skip: !userInfo?._id,
    },
  );

  const t = {
    en: {
      CustomPCBOrderLbl: "Custom PCB Orders",
      ErrorMessageLbl: "No custom PCB orders found.",
      projectidlbl: "Order ID",
      projectnameLbl: "Project Name",
      QtyLbl: "Qty",
      TotalPriceLbl: "Total Price",
      DATELbl: "Date",
      DeliveryLbl: "Status",
      DetailLbl: "Details",
      statusPending: "Quoting",
      statusDelivered: "Delivered",
      statusProcessing: "Processing",
      emptyState: "No Custom PCB orders yet",
    },
    thai: {
      CustomPCBOrderLbl: "รายการสั่งทำ PCB (Custom)",
      ErrorMessageLbl: "ไม่พบคำสั่งซื้อ",
      projectidlbl: "รหัสสั่งซื้อ",
      projectnameLbl: "ชื่อโปรเจกต์",
      QtyLbl: "จำนวน",
      TotalPriceLbl: "ราคาประเมิน",
      DATELbl: "วันที่ส่งแบบ",
      DeliveryLbl: "สถานะ",
      DetailLbl: "รายละเอียด",
      statusPending: "รอเสนอราคา",
      statusDelivered: "จัดส่งแล้ว",
      statusProcessing: "กำลังดำเนินการ",
      emptyState: "ยังไม่มีรายการสั่งทำ PCB",
    },
  }[language || "en"];

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

  // Filter valid orders (qty > 0)
  const orders = data?.data?.filter((order) => order.pcb_qty > 0) || [];

  // Empty State Check
  if (orders.length === 0) {
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
        <h5 className="fw-bold text-primary m-0">{t.CustomPCBOrderLbl}</h5>
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
              <th className="py-3">{t.projectidlbl}</th>
              <th className="py-3">{t.projectnameLbl}</th>
              <th className="py-3 text-center">{t.QtyLbl}</th>
              <th className="py-3 text-end">{t.TotalPriceLbl}</th>
              <th className="py-3">{t.DATELbl}</th>
              <th className="py-3 text-center">{t.DeliveryLbl}</th>
              <th className="py-3 text-end pe-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {[...orders]
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) // Sort by date desc
              .map((order, index) => (
                <tr
                  key={order.id}
                  style={{ borderBottom: "1px solid #f9f9f9" }}
                >
                  <td className="ps-3 text-muted small">{index + 1}</td>

                  {/* Order ID */}
                  <td>
                    <span className="fw-medium text-dark font-monospace">
                      {order.orderID}
                    </span>
                  </td>

                  {/* Project Name */}
                  <td>
                    <span className="fw-bold text-primary">
                      {order.projectname}
                    </span>
                  </td>

                  {/* Qty */}
                  <td className="text-center">
                    <span className="badge bg-secondary bg-opacity-10 text-secondary rounded-pill px-3 fw-normal">
                      {order.pcb_qty}
                    </span>
                  </td>

                  {/* Price */}
                  <td className="text-end">
                    {order.status === "pending" ? (
                      <span className="text-muted small fst-italic">
                        {t.statusPending}...
                      </span>
                    ) : order.confirmed_price ? (
                      <span className="fw-bold text-dark">
                        {parseFloat(order.confirmed_price).toLocaleString()} ฿
                      </span>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>

                  {/* Date */}
                  <td className="small text-muted text-nowrap">
                    {new Date(order.created_at).toLocaleDateString()}
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
                          ({order.deliveryOn?.substring(0, 10)})
                        </span>
                      </Badge>
                    ) : (
                      <Badge
                        bg={
                          order.status === "pending" ? "secondary" : "warning"
                        }
                        text="white"
                        className="rounded-pill fw-normal px-2"
                      >
                        {order.status === "pending"
                          ? t.statusPending
                          : t.statusProcessing}
                      </Badge>
                    )}
                  </td>

                  {/* Action Button */}
                  <td className="text-end pe-3">
                    <Button
                      as={Link}
                      to={`/custompcb/${order.id}`}
                      variant="outline-primary"
                      size="sm"
                      className="rounded-pill px-3 d-inline-flex align-items-center gap-1"
                    >
                      <FaSearch size={12} /> {t.DetailLbl}
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

export default CustomPCBProfileListScreen;
