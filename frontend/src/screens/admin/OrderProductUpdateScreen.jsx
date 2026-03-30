import { useState } from "react";
import { useParams } from "react-router-dom";
import { Row, Col, ListGroup, Image, Card } from "react-bootstrap";
import { useSelector } from "react-redux";
import Message from "../../components/Message";
import Loader from "../../components/Loader";
import { Link } from "react-router-dom";
import { useGetOrderDetailsQuery } from "../../slices/ordersApiSlice";
import { format } from "date-fns";

const OrderProductUpdateScreen = () => {
  const { id: orderId } = useParams();

  const { data: order, isLoading, error } = useGetOrderDetailsQuery(orderId);

  // Removed unused mutations (payOrder, deliverOrder) and userInfo selector

  const [zoomedImage, setZoomedImage] = useState(null);

  // Removed unused toggleZoom and openZoom functions

  const closeZoom = () => {
    setZoomedImage(null);
  };

  // Removed unused imageStyle object (it had duplicate keys)
  // Removed unused PayPal functions (onApprove, onError, createOrder)
  // Removed unused deliverHandler

  const { language } = useSelector((state) => state.language);

  // Define translation object
  const translations = {
    en: {
      shippingAddressLbl: "Shipping Address",
      nameLbl: "Name",
      phoneLbl: "Phone",
      emailLbl: "Email",
      addressLbl: "Address",
      billingAddressLbl: "Billing Address",
      taxLbl: "Tax",
      deliveredOnLbl: "Delivered on",
      notDeliveredLbl: "Not Delivered",
      orderItemsLbl: "Order Items",
      orderIsEmptyLbl: "Order is empty",
      orderSummaryLbl: "Order Summary",
      itemsLbl: "Items",
      shippingLbl: "Shipping",
      totalLbl: "Total",
      vatLbl: "VAT",
      paymentHistoryLbl: "Payment History",
      transferedIDLbl: "Transfered ID",
      transferedAccountLbl: "Transfered Account",
      transferedAmountLbl: "Transfered Amount",
      transferedDateLbl: "Transfered Date",
      ImageLbl: "Slip Image",
    },
    thai: {
      shippingAddressLbl: "ที่อยู่สำหรับจัดส่ง",
      nameLbl: "ชื่อ",
      phoneLbl: "โทรศัพท์",
      emailLbl: "อีเมล",
      addressLbl: "ที่อยู่",
      billingAddressLbl: "ที่อยู่ใบกำกับภาษี",
      taxLbl: "เลขประจำตัวผู้เสียภาษี",
      deliveredOnLbl: "จัดส่งเมื่อ",
      notDeliveredLbl: "ยังไม่ได้จัดส่ง",
      orderItemsLbl: "รายการสั่งซื้อ",
      orderIsEmptyLbl: "ไม่มีรายการสั่งซื้อ",
      orderSummaryLbl: "สรุปคำสั่งซื้อ",
      itemsLbl: "รายการ",
      shippingLbl: "ค่าจัดส่ง",
      totalLbl: "ยอดรวม",
      vatLbl: "ค่าภาษี",
      paymentHistoryLbl: "ประวัติการชำระเงิน",
      transferedIDLbl: "รหัสการโอน",
      transferedAccountLbl: "บัญชีที่โอน",
      transferedAmountLbl: "จำนวนเงินที่โอน",
      transferedDateLbl: "วันที่โอน",
      ImageLbl: "ภาพสลิป",
    },
  };

  const t = translations[language] || translations.en;

  return isLoading ? (
    <Loader />
  ) : error ? (
    <Message variant="danger">{error.data.message}</Message>
  ) : (
    <>
      <h1 className="mt-3"> {order.paymentResult.paymentComfirmID}</h1>
      <Row>
        <Col md={8}>
          <ListGroup variant="flush">
            <ListGroup.Item>
              <h2>{t.shippingAddressLbl}</h2>
              <p>
                <strong>{t.nameLbl}: </strong>{" "}
                {order.shippingAddress.shippingname}
              </p>
              <p>
                <strong>{t.phoneLbl}: </strong> {order.shippingAddress.phone}
              </p>
              <p>
                <strong>{t.emailLbl}: </strong>{" "}
                <a href={`mailto:${order.user.email}`}>{order.user.email}</a>
              </p>
              <p>
                <strong>{t.addressLbl}: </strong>
                {order.shippingAddress.address}, {order.shippingAddress.city}{" "}
                {order.shippingAddress.postalCode},{" "}
                {order.shippingAddress.country}
              </p>
            </ListGroup.Item>
            <ListGroup.Item>
              <h2>{t.billingAddressLbl}</h2>
              <p>
                <strong>{t.nameLbl}: </strong>{" "}
                {order.billingAddress.billingName}
              </p>
              <p>
                <strong>{t.phoneLbl}: </strong>{" "}
                {order.billingAddress.billingPhone}
              </p>
              <p>
                <strong>{t.emailLbl}: </strong>{" "}
                <a href={`mailto:${order.user.email}`}>{order.user.email}</a>
              </p>
              <p>
                <strong>{t.addressLbl}: </strong>
                {order.billingAddress.billinggAddress},{" "}
                {order.billingAddress.billingCity}{" "}
                {order.billingAddress.billingPostalCode},{" "}
                {order.billingAddress.billingCountry}
              </p>
              <p>
                <strong>{t.taxLbl}: </strong> {order.billingAddress.tax}
              </p>
              {order.isDelivered ? (
                <Message variant="success">
                  {t.deliveredOnLbl}{" "}
                  {format(new Date(order.deliveredAt), "PPpp")}
                </Message>
              ) : (
                <Message variant="danger">{t.notDeliveredLbl}</Message>
              )}
            </ListGroup.Item>

            <ListGroup.Item>
              <h2>{t.orderItemsLbl}</h2>
              {order.orderItems.length === 0 ? (
                <Message>{t.orderIsEmptyLbl}</Message>
              ) : (
                <ListGroup variant="flush">
                  {order.orderItems.map((item, index) => (
                    <ListGroup.Item key={index}>
                      <Row>
                        <Col md={1}>
                          <Image
                            src={item.image}
                            alt={item.name}
                            fluid
                            rounded
                          />
                        </Col>
                        <Col>
                          <Link to={`/product/${item.product_id}`}>
                            {item.name}
                          </Link>
                        </Col>
                        <Col md={4}>
                          {item.qty} x {item.price} ฿ = {item.qty * item.price}{" "}
                          ฿
                        </Col>
                      </Row>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </ListGroup.Item>
          </ListGroup>
        </Col>
        <Col md={4}>
          <Card>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <h2>{t.orderSummaryLbl}</h2>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>{t.itemsLbl}</Col>
                  <Col style={{ textAlign: "right", marginRight: "100px" }}>
                    {order.itemsPrice} ฿
                  </Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>{t.vatLbl}</Col>
                  <Col style={{ textAlign: "right", marginRight: "100px" }}>
                    {order.vatPrice} ฿
                  </Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>{t.shippingLbl}</Col>
                  <Col style={{ textAlign: "right", marginRight: "100px" }}>
                    {order.shippingPrice} ฿
                  </Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>{t.totalLbl}</Col>
                  <Col style={{ textAlign: "right", marginRight: "100px" }}>
                    {order.totalPrice} ฿
                  </Col>
                </Row>
              </ListGroup.Item>
            </ListGroup>
          </Card>

          <Card style={{ marginTop: "20px" }}>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <h2>{t.paymentHistoryLbl}</h2>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>{t.transferedIDLbl}</Col>
                  <Col>{order.paymentResult.paymentComfirmID}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>{t.transferedAccountLbl}</Col>
                  <Col>{order.paymentResult.transferedName}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>{t.transferedAmountLbl}</Col>
                  <Col>{order.paymentResult.transferedAmount} ฿</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>{t.transferedDateLbl}</Col>
                  <Col>
                    {" "}
                    {format(
                      new Date(order.paymentResult.transferedDate),
                      "PPpp",
                    )}
                  </Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Row>
                    <Col md={6}>
                      <p>{t.ImageLbl}</p>
                    </Col>
                    <Col md={6} className="text-end">
                      <Image
                        src={order.paymentResult.paymentSlip}
                        alt="Slip"
                        thumbnail
                        style={{
                          width: "100px",
                          height: "auto",
                          cursor: "pointer",
                        }}
                        onClick={() =>
                          setZoomedImage(order.paymentResult.paymentSlip)
                        }
                      />
                    </Col>
                  </Row>

                  {zoomedImage && (
                    <div
                      onClick={closeZoom}
                      style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100vw",
                        height: "100vh",
                        backgroundColor: "rgba(0,0,0,0.85)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 9999,
                        cursor: "zoom-out",
                      }}
                    >
                      <img
                        src={zoomedImage}
                        alt="Zoomed"
                        style={{
                          maxWidth: "90%",
                          maxHeight: "90%",
                          borderRadius: "10px",
                          boxShadow: "0 0 30px rgba(255,255,255,0.3)",
                        }}
                      />
                    </div>
                  )}
                </Row>
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default OrderProductUpdateScreen;
