import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Row,
  Col,
  Card,
  Image,
  Button,
  Container,
  Badge,
  Accordion,
  Alert,
} from "react-bootstrap";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { useSelector } from "react-redux";
import {
  FaArrowLeft,
  FaFileArchive,
  FaImages,
  FaDownload,
  FaTruck,
  FaCalendarAlt,
  FaBoxOpen,
  FaReceipt,
} from "react-icons/fa";
import { format } from "date-fns";

import { useGetcopyPCBByIdQuery } from "../../slices/copypcbApiSlice";
import Loader from "../../components/Loader";
import Message from "../../components/Message";
import { BASE_URL } from "../../constants";

const CopyPCBDetailScreen = () => {
  const { id } = useParams();
  const { language } = useSelector((state) => state.language);
  const { data: order, isLoading, error } = useGetcopyPCBByIdQuery(id);
  const orderData = order?.data;
  const [zoomedImage, setZoomedImage] = useState(null);

  const getFullUrl = (pathInput) => {
    if (!pathInput) return null;
    let path =
      typeof pathInput === "object"
        ? pathInput.path || pathInput.url
        : pathInput;
    if (!path || typeof path !== "string") return null;

    if (path.startsWith("http")) return path;

    // Normalize path: replace backslashes and ensure single leading slash
    let normalizedPath = path.replace(/\\/g, "/");
    if (!normalizedPath.startsWith("/")) {
      normalizedPath = "/" + normalizedPath;
    }

    const baseUrl =
      process.env.NODE_ENV === "development"
        ? "http://localhost:5000"
        : BASE_URL || "";
    return `${baseUrl}${normalizedPath}`;
  };

  // Helper to get existing images
  const existingImages = orderData
    ? Array.from({ length: 10 }, (_, i) => [
        orderData[`front_image_${i + 1}`],
        orderData[`back_image_${i + 1}`],
      ])
        .flat()
        .filter(Boolean)
    : [];

  const t = {
    en: {
      lbl: {
        project: "Project",
        qty: "Qty",
        total: "Total",
        date: "Date",
        status: "Status",
        tracking: "Tracking",
        delivered: "Delivered",
        pickup: "Pickup at Store",
        note: "Note",
        pricePerUnit: "Price/Unit",
        name: "Name",
        phone: "Tel",
        address: "Address",
        tax: "Tax ID",
      },
      headers: {
        shipping: "Shipping & Billing",
        slip: "Payment Slip",
        images: "PCB Images",
        downloads: "Downloads",
      },
      btn: {
        back: "Back",
        dlAll: "Download Full Project",
        dlZip: "Gerber",
        dlImg: "Images",
      },
    },
    thai: {
      lbl: {
        project: "โปรเจกต์",
        qty: "จำนวน",
        total: "ยอดสุทธิ",
        date: "วันที่สั่ง",
        status: "สถานะ",
        tracking: "เลขพัสดุ",
        delivered: "จัดส่งสำเร็จ",
        pickup: "รับสินค้าเองที่บริษัท",
        note: "หมายเหตุ",
        pricePerUnit: "ราคา/ชิ้น",
        name: "ชื่อ",
        phone: "โทร",
        address: "ที่อยู่",
        tax: "เลขผู้เสียภาษี",
      },
      headers: {
        shipping: "ข้อมูลจัดส่ง & ใบกำกับภาษี",
        slip: "หลักฐานการโอนเงิน",
        images: "รูปภาพ PCB",
        downloads: "ดาวน์โหลด",
      },
      btn: {
        back: "กลับ",
        dlAll: "ดาวน์โหลดโปรเจกต์ทั้งหมด",
        dlZip: "ไฟล์ Gerber",
        dlImg: "รูปภาพ",
      },
    },
  }[language || "en"];

  // --- Download Logic ---
  const handleDownloadAll = async (e) => {
    e.preventDefault();
    if (!orderData) return;

    const zip = new JSZip();
    const folder = zip.folder(orderData.projectname || "project");

    try {
      // 1. Add Gerber Zip
      if (orderData.copypcb_zip) {
        const zipUrl = getFullUrl(orderData.copypcb_zip);
        const resp = await fetch(zipUrl);
        if (resp.ok) {
          folder.file(
            orderData.copypcb_zip.split("/").pop() || "source.zip",
            await resp.blob(),
          );
        } else {
          console.error(`Failed to fetch zip: ${zipUrl}`);
        }
      }

      // 2. Add Images
      for (let i = 1; i <= 10; i++) {
        const f = orderData[`front_image_${i}`];
        const b = orderData[`back_image_${i}`];
        if (f) {
          const r = await fetch(getFullUrl(f));
          if (r.ok) {
            const ext = f.split(".").pop() || "jpg";
            folder.file(`front-${i}.${ext}`, await r.blob());
          }
        }
        if (b) {
          const r = await fetch(getFullUrl(b));
          if (r.ok) {
            const ext = b.split(".").pop() || "jpg";
            folder.file(`back-${i}.${ext}`, await r.blob());
          }
        }
      }

      saveAs(
        await zip.generateAsync({ type: "blob" }),
        `${orderData.projectname}-full.zip`,
      );
    } catch (error) {
      alert(`Failed: ${error.message}`);
    }
  };

  if (isLoading) return <Loader />;
  if (error)
    return (
      <Message variant="danger">{error?.data?.message || error.error}</Message>
    );
  if (!orderData) return <Message variant="info">No Data Found</Message>;

  return (
    <Container fluid className="py-2 font-prompt pb-5 mb-5">
      {/* 1. Header & Back */}
      <div className="d-flex align-items-center gap-2 mb-3">
        <Link
          to="/cart/copypcbcart"
          className="btn btn-light btn-sm border shadow-sm rounded-circle d-flex align-items-center justify-content-center"
          style={{ width: 32, height: 32 }}
        >
          <FaArrowLeft size={14} />
        </Link>
        <div className="flex-grow-1 lh-1">
          <div className="d-flex align-items-center">
            <h5 className="fw-bold mb-0 text-dark me-2">
              Order #{orderData.orderID}
            </h5>
            {orderData.isDelivered ? (
              <Badge
                bg="success"
                className="rounded-pill"
                style={{ fontSize: "0.65rem" }}
              >
                <FaTruck className="me-1" />
                {t.lbl.delivered}
              </Badge>
            ) : (
              <Badge
                bg="warning"
                text="dark"
                className="rounded-pill"
                style={{ fontSize: "0.65rem" }}
              >
                Processing
              </Badge>
            )}
          </div>
          <small className="text-muted" style={{ fontSize: "0.7rem" }}>
            <FaCalendarAlt className="me-1" />{" "}
            {orderData.created_at
              ? format(new Date(orderData.created_at), "dd MMM yyyy, HH:mm")
              : "-"}
          </small>
        </div>
      </div>

      <Row className="g-3 justify-content-center">
        <Col lg={8} xl={6}>
          {/* 2. SUMMARY CARD */}
          <Card className="shadow-sm rounded-4 mb-3 border border-primary border-2">
            <Card.Body className="p-3">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <small
                    className="text-muted fw-bold text-uppercase"
                    style={{ fontSize: "0.7rem" }}
                  >
                    {t.lbl.project}
                  </small>
                  <h5 className="fw-bold text-primary mb-0">
                    {orderData.projectname}
                  </h5>
                </div>
                <div className="text-end">
                  <Badge bg="primary" className="px-3 py-1 rounded-pill fs-6">
                    {orderData.pcb_qty} <small className="fw-normal">pcs</small>
                  </Badge>
                </div>
              </div>

              <div className="bg-light rounded p-2 mt-2 d-flex justify-content-between align-items-center border">
                <small className="text-muted">
                  {t.lbl.pricePerUnit}:{" "}
                  <strong>
                    {orderData.pcb_qty
                      ? (
                          orderData.confirmed_price / orderData.pcb_qty
                        ).toLocaleString()
                      : "0"}{" "}
                    ฿
                  </strong>
                </small>
                <div className="text-end lh-1">
                  <small className="text-muted">{t.lbl.total}</small>
                  <div className="fw-bold text-dark fs-5">
                    {parseFloat(orderData.confirmed_price).toLocaleString()} ฿
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* 3. ACCORDION */}
          <Accordion
            defaultActiveKey="0"
            className="shadow-sm rounded-4 overflow-hidden border mb-3"
          >
            {/* Shipping & Note */}
            <Accordion.Item eventKey="0" className="border-0 border-bottom">
              <Accordion.Header className="custom-accordion-header">
                <FaTruck className="me-2 text-secondary" /> {t.headers.shipping}
              </Accordion.Header>
              <Accordion.Body className="bg-white p-3 small">
                {orderData.notes && (
                  <Alert
                    variant="warning"
                    className="py-2 px-3 mb-3 small border-warning"
                  >
                    <strong>{t.lbl.note}:</strong> {orderData.notes}
                  </Alert>
                )}

                <Row className="g-3">
                  <Col md={6}>
                    <h6 className="fw-bold text-primary mb-1 border-bottom pb-1">
                      Shipping
                    </h6>
                    {orderData.receivePlace === "bysending" ? (
                      <ul className="list-unstyled mb-0 mt-2">
                        <li>
                          <strong>{orderData.shippingName}</strong>{" "}
                          <span className="text-muted">
                            ({orderData.shippingPhone})
                          </span>
                        </li>
                        <li className="text-muted">
                          {orderData.shippingAddress} {orderData.shippingCity}{" "}
                          {orderData.shippingPostalCode}
                        </li>
                        {orderData.isDelivered && (
                          <li className="text-success mt-2 p-2 bg-success bg-opacity-10 rounded border border-success">
                            <strong>
                              <FaTruck /> {t.lbl.tracking}:
                            </strong>{" "}
                            {orderData.transferedNumber}
                          </li>
                        )}
                      </ul>
                    ) : (
                      <div className="p-2 bg-info bg-opacity-10 text-info border border-info rounded mt-2">
                        <FaBoxOpen className="me-1" />{" "}
                        <strong>{t.lbl.pickup}</strong>
                      </div>
                    )}
                  </Col>
                  <Col md={6} className="border-start-md">
                    <h6 className="fw-bold text-primary mb-1 border-bottom pb-1">
                      Billing
                    </h6>
                    <ul className="list-unstyled mb-0 mt-2">
                      <li>
                        <strong>{orderData.billingName}</strong>
                      </li>
                      <li className="text-muted">
                        Tax ID: {orderData.billingTax}
                      </li>
                      <li className="text-muted">
                        {orderData.billingAddress} {orderData.billingCity}{" "}
                        {orderData.billingPostalCode}
                      </li>
                    </ul>
                  </Col>
                </Row>
              </Accordion.Body>
            </Accordion.Item>

            {/* Slip */}
            <Accordion.Item eventKey="2" className="border-0 border-bottom">
              <Accordion.Header className="custom-accordion-header">
                <FaReceipt className="me-2 text-secondary" /> {t.headers.slip}
              </Accordion.Header>
              <Accordion.Body className="bg-white p-3 text-center">
                <div
                  className="d-inline-block position-relative rounded border overflow-hidden cursor-zoom"
                  onClick={() =>
                    setZoomedImage(getFullUrl(orderData.paymentSlip))
                  }
                >
                  <Image
                    src={getFullUrl(orderData.paymentSlip)}
                    style={{ height: 120, width: "auto" }}
                  />
                  <div className="mt-1 small text-muted">
                    <FaImages /> Tap to Zoom
                  </div>
                </div>
              </Accordion.Body>
            </Accordion.Item>

            {/* Images Gallery */}
            {existingImages.length > 0 && (
              <Accordion.Item eventKey="1" className="border-0">
                <Accordion.Header className="custom-accordion-header">
                  <FaImages className="me-2 text-secondary" />{" "}
                  {t.headers.images}{" "}
                  <Badge bg="secondary" className="ms-2 rounded-pill">
                    {existingImages.length}
                  </Badge>
                </Accordion.Header>
                <Accordion.Body className="bg-light p-2">
                  <div
                    className="d-grid gap-2"
                    style={{ gridTemplateColumns: "repeat(4, 1fr)" }}
                  >
                    {existingImages.map((img, idx) => (
                      <div
                        key={idx}
                        className="ratio ratio-1x1 rounded border bg-white overflow-hidden cursor-zoom shadow-sm"
                        onClick={() => setZoomedImage(getFullUrl(img))}
                      >
                        <Image
                          src={getFullUrl(img)}
                          className="w-100 h-100 object-fit-cover"
                        />
                      </div>
                    ))}
                  </div>
                </Accordion.Body>
              </Accordion.Item>
            )}
          </Accordion>

          {/* 4. Desktop Downloads (Hidden on Mobile) */}
          <div className="d-none d-md-block">
            <Card className="shadow-sm border-0 rounded-4 bg-light">
              <Card.Body className="p-3 d-flex align-items-center justify-content-between">
                <h6 className="fw-bold text-muted mb-0">
                  <FaDownload className="me-2" />
                  {t.headers.downloads}
                </h6>
                <div className="d-flex gap-2">
                  {orderData.copypcb_zip && (
                    <Button
                      variant="white"
                      size="sm"
                      className="border shadow-sm text-primary"
                      href={getFullUrl(orderData.copypcb_zip)}
                      download
                    >
                      <FaFileArchive /> {t.btn.dlZip}
                    </Button>
                  )}
                  <Button
                    variant="primary"
                    size="sm"
                    className="shadow-sm fw-bold px-3"
                    onClick={handleDownloadAll}
                  >
                    <FaDownload /> {t.btn.dlAll}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </div>
        </Col>
      </Row>

      {/* 5. Mobile Sticky Bar */}
      <div
        className="fixed-bottom p-3 bg-white border-top shadow-lg d-md-none"
        style={{ zIndex: 1040 }}
      >
        <Button
          variant="primary"
          size="lg"
          className="w-100 rounded-pill fw-bold shadow-sm d-flex align-items-center justify-content-center"
          onClick={handleDownloadAll}
        >
          <FaDownload className="me-2" /> {t.btn.dlAll}
        </Button>
      </div>

      {/* Lightbox */}
      {zoomedImage && (
        <div
          className="fixed-top w-100 h-100 d-flex justify-content-center align-items-center bg-black bg-opacity-90"
          style={{ zIndex: 2000 }}
          onClick={() => setZoomedImage(null)}
        >
          <img
            src={zoomedImage}
            alt="Zoom"
            className="img-fluid"
            style={{ maxHeight: "85vh", maxWidth: "95vw" }}
          />
        </div>
      )}

      <style>{`
        .font-prompt { font-family: 'Prompt', sans-serif; }
        .cursor-zoom { cursor: zoom-in; }
        /* Safe Accordion Header Style */
        .custom-accordion-header .accordion-button { background-color: #fff; color: #333; font-weight: 600; font-size: 0.95rem; }
        .custom-accordion-header .accordion-button:not(.collapsed) { background-color: #f0f8ff; color: #0d6efd; box-shadow: inset 0 -1px 0 rgba(0,0,0,.125); }
        .custom-accordion-header .accordion-button:focus { box-shadow: none; border-color: rgba(0,0,0,.125); }
        @media (min-width: 768px) { .border-start-md { border-left: 1px solid #dee2e6; } }
      `}</style>
    </Container>
  );
};

export default CopyPCBDetailScreen;
