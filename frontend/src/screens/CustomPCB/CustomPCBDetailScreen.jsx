import { useState } from "react";
import { useParams } from "react-router-dom";
import { Row, Col, Card, Image, ListGroup, Button } from "react-bootstrap";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { useSelector } from "react-redux";
import { useGetCustomPCBByIdQuery } from "../../slices/custompcbApiSlice";
import Loader from "../../components/Loader";
import Message from "../../components/Message";
import { format } from "date-fns";
import { BASE_URL } from "../../constants";

const CustomPCBDetailScreen = () => {
  const { id } = useParams();
  const { language } = useSelector((state) => state.language);
  const { data: order, isLoading, error } = useGetCustomPCBByIdQuery(id);

  const orderData = order?.data;

  const [zoomedImage, setZoomedImage] = useState(null);

  const getFullUrl = (pathInput) => {
    if (!pathInput) return null;
    const path =
      typeof pathInput === "object"
        ? pathInput.path || pathInput.url
        : pathInput;
    if (!path || typeof path !== "string") return null;

    if (path.startsWith("http")) return path;
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

  const imageFields = [
    "dirgram_image_1",
    "dirgram_image_2",
    "dirgram_image_3",
    "dirgram_image_4",
    "dirgram_image_5",
    "dirgram_image_6",
    "dirgram_image_7",
    "dirgram_image_8",
    "dirgram_image_9",
    "dirgram_image_10",
  ];

  const t = {
    en: {
      details: "PCB Order Details",
      shipping: "Shipping Info",
      billing: "Billing Info",
      user: "User Info",
      cost: "Cost & Calculation",
      quantity: "Quantity",
      length: "Length",
      width: "Width",
      areaPerBoard: "Area/Board",
      totalArea: "Total Area",
      layers: "Layers",
      material: "Base Material",
      thickness: "Thickness",
      color: "Color",
      silkscreen: "Silkscreen",
      surfaceFinish: "Surface Finish",
      copperWeight: "Copper Weight",
      created: "Created",
      delivery: "Delivery",
      deliveryID: "Delivery ID",
      deliveryat: "Delivered At",
      deliveredAt: "Delivered At",
      isDelivered: "Delivered",
      notDeliveredLbl: "Not Delivered",
      deliveredOnLbl: "Delivered on",
      weightPerBoard: "Weight/Board",
      totalWeight: "Total Weight",
      pricePerCm2: "Price/cm²",
      extraServiceCost: "Extra Service Cost",
      pcbCost: "PCB Cost",
      deliveryDHL: "Delivery DHL",
      serviceDHL: "Service DHL",
      ems: "EMS",
      totalCost: "Total Cost",
      profitMargin: "Profit Margin (%)",
      priceBeforeVat: "Price Before VAT",
      pricePerBoard: "Price/Board",
      vat: "VAT (%)",
      quotedPrice: "Quoted Price",
      name: "Name",
      phone: "Phone",
      email: "Email",
      address: "Address",
      city: "City",
      postal: "Postal Code",
      country: "Country",
      tax: "Tax ID",
      shippingAddressLbl: "Shipping Address",
      billingAddressLbl: "Billing Address",
      nameLbl: "Name",
      phoneLbl: "Phone",
      emailLbl: "Email",
      addressLbl: "Address",
      taxLbl: "Tax ID",
      orderItemsLbl: "Order Items",
      orderIsEmptyLbl: "Order is empty",
      gerberFile: "Gerber File",
      goBackLbl: "Go Back",
      ImageLbl: "Slip Image",
      uniquePrice: "Unit Price",
      customerselectedtoreceiveatcompanyLbl:
        "Customer selected to receive at company",
    },
    thai: {
      details: "รายละเอียดคำสั่งซื้อ PCB",
      shipping: "ข้อมูลจัดส่ง",
      billing: "ข้อมูลใบกำกับภาษี",
      user: "ข้อมูลผู้ใช้",
      cost: "ต้นทุน & การคำนวณ",
      quantity: "จำนวน",
      length: "ความยาว",
      width: "ความกว้าง",
      areaPerBoard: "พื้นที่/บอร์ด",
      totalArea: "พื้นที่รวม",
      layers: "จำนวนชั้น",
      material: "วัสดุ",
      thickness: "ความหนา",
      color: "สี",
      silkscreen: "ซิลค์สกรีน",
      surfaceFinish: "พื้นผิว",
      copperWeight: "น้ำหนักทองแดง",
      created: "วันที่สร้าง",
      delivery: "การจัดส่ง",
      deliveryID: "รหัสพัสดุ",
      deliveryat: "วันที่จัดส่ง",
      deliveredAt: "วันที่จัดส่ง",
      isDelivered: "จัดส่งแล้ว",
      notDeliveredLbl: "ยังไม่ได้จัดส่ง",
      deliveredOnLbl: "จัดส่งเมื่อ",
      weightPerBoard: "น้ำหนัก/บอร์ด",
      totalWeight: "น้ำหนักรวม",
      pricePerCm2: "ราคา/cm²",
      extraServiceCost: "ค่าบริการเสริม",
      pcbCost: "ต้นทุน PCB",
      deliveryDHL: "DHL",
      serviceDHL: "ค่าบริการ DHL",
      ems: "EMS",
      totalCost: "ต้นทุนรวม",
      profitMargin: "กำไร (%)",
      priceBeforeVat: "ราคารวมก่อน VAT",
      pricePerBoard: "ราคา/บอร์ด",
      vat: "VAT (%)",
      quotedPrice: "ราคาที่เสนอ",
      name: "ชื่อ",
      phone: "เบอร์โทร",
      email: "อีเมล",
      address: "ที่อยู่",
      city: "เมือง",
      postal: "รหัสไปรษณีย์",
      country: "ประเทศ",
      tax: "เลขประจำตัวผู้เสียภาษี",
      shippingAddressLbl: "ที่อยู่สำหรับจัดส่ง",
      billingAddressLbl: "ที่อยู่ใบกำกับภาษี",
      nameLbl: "ชื่อ",
      phoneLbl: "เบอร์โทร",
      emailLbl: "อีเมล",
      addressLbl: "ที่อยู่",
      taxLbl: "เลขผู้เสียภาษี",
      orderItemsLbl: "รายการคำสั่งซื้อ",
      orderIsEmptyLbl: "ไม่มีรายการสั่งซื้อ",
      gerberFile: "ไฟล์ Gerber",
      goBackLbl: "กลับ",
      ImageLbl: "รูปภาพ Slip",
      uniquePrice: "ราคาต่อชิ้น",
      customerselectedtoreceiveatcompanyLbl: "ลูกค้าเลือกมารับที่บริษัท",
    },
  }[language || "en"];

  if (isLoading) return <Loader />;
  if (error)
    return (
      <Message variant="danger">{error?.data?.message || error.error}</Message>
    );
  if (!orderData) return <Message variant="info">No data found</Message>;

  const downloadAllImages = async (e) => {
    e.preventDefault();
    const zip = new JSZip();
    const folder = zip.folder(orderData.projectname || "images");

    const fields = imageFields
      .map(
        (key, i) =>
          orderData[key] && {
            file: orderData[key],
            name: `diagram-${i + 1}.jpg`,
          },
      )
      .filter(Boolean);

    if (!fields.length) {
      alert("No images found to download.");
      return;
    }

    for (const { file, name } of fields) {
      const url = getFullUrl(file);
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("File not found");
        const blob = await response.blob();
        folder.file(name, blob);
      } catch (err) {
        console.error(`Failed to fetch ${url}`, err);
      }
    }

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(
      content,
      `${orderData.projectname || "images"}-images-pawin-tech.zip`,
    );
  };

  const handleDownloadAll = async () => {
    const zip = new JSZip();

    // Add Gerber ZIP file (first type)
    if (orderData.dirgram_zip) {
      const zipUrl = getFullUrl(orderData.dirgram_zip);
      try {
        const response = await fetch(zipUrl);
        if (response.ok) {
          const blob = await response.blob();
          zip.file(
            orderData.dirgram_zip.split("/").pop() || "technical-files.zip",
            blob,
          );
        }
      } catch (err) {
        console.error("Failed to fetch Tech ZIP:", err);
      }
    }

    // Add Gerber ZIP file (second type)
    if (orderData.gerber_zip) {
      const zipUrl = getFullUrl(orderData.gerber_zip);
      try {
        const response = await fetch(zipUrl);
        if (response.ok) {
          const blob = await response.blob();
          zip.file(orderData.gerber_zip.split("/").pop() || "gerber.zip", blob);
        }
      } catch (error) {
        console.error("Error fetching zip zip:", error);
      }
    }

    // Add image files to an "images" folder
    const imageFolder = zip.folder("images");

    const fields = imageFields
      .map(
        (key, i) =>
          orderData[key] && {
            file: orderData[key],
            name: `diagram-${i + 1}.jpg`,
          },
      )
      .filter(Boolean);

    for (const { file, name } of fields) {
      const url = getFullUrl(file);
      try {
        const response = await fetch(url);
        if (response.ok) {
          const blob = await response.blob();
          imageFolder.file(name, blob);
        }
      } catch (err) {
        console.error(`Failed to fetch ${url}`, err);
      }
    }

    // Generate final ZIP and download
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(
      content,
      `${orderData.projectname || "project"}-project-pawin-tech.zip`,
    );
  };

  return (
    <div className="mt-3">
      <h1 className="mt-3">{orderData.orderID}</h1>
      <Row>
        <Col md={6}>
          <ListGroup variant="flush">
            {orderData.receivePlace === "bysending" ? (
              <ListGroup.Item>
                <h4>{t.shipping}</h4>
                <p>
                  <strong>{t.nameLbl}:</strong> {orderData.shippingName}
                </p>
                <p>
                  <strong>{t.phoneLbl}:</strong> {orderData.shippingPhone}
                </p>
                <p>
                  <strong>{t.addressLbl}:</strong> {orderData.shippingAddress},{" "}
                  {orderData.shippingCity}, {orderData.shippingPostalCode},{" "}
                  {orderData.shippingCountry}
                </p>
              </ListGroup.Item>
            ) : (
              <ListGroup.Item>
                <h2>{t.shippingAddressLbl}</h2>
                <Message variant="success">
                  * {t.customerselectedtoreceiveatcompanyLbl}
                </Message>
              </ListGroup.Item>
            )}
            <ListGroup.Item>
              <h4>{t.billing}</h4>
              <p>
                <strong>{t.nameLbl}:</strong> {orderData.billingName}
              </p>
              <p>
                <strong>{t.phoneLbl}:</strong> {orderData.billingPhone}
              </p>
              <p>
                <strong>{t.addressLbl}:</strong> {orderData.billingAddress},{" "}
                {orderData.billingCity}, {orderData.billingPostalCode},{" "}
                {orderData.billingCountry}
              </p>
              <p>
                <strong>{t.taxLbl}:</strong> {orderData.billingTax}
              </p>
            </ListGroup.Item>

            <ListGroup.Item>
              <h4>{t.delivery}</h4>
              {orderData.isDelivered ? (
                <Message variant="success">
                  {t.deliveredOnLbl}{" "}
                  {orderData.deliveryOn
                    ? format(new Date(orderData.deliveryOn), "PPpp")
                    : "-"}
                  , {t.deliveryID}:{orderData.transferedNumber}
                </Message>
              ) : (
                <Message variant="danger">{t.notDeliveredLbl}</Message>
              )}
            </ListGroup.Item>
          </ListGroup>
        </Col>

        <Col md={6}>
          <Card className="mb-3">
            <Card.Header className="mt-2" as="h2">
              {t.cost}
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <strong>Project Name:</strong> {orderData.projectname}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Quantity:</strong> {orderData.pcb_qty}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Notes:</strong> {orderData.notes || "None"}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Diagram ZIP: </strong>{" "}
                  {/* {orderData.dirgram_zip ? (
        <a href={orderData.dirgram_zip} target="_blank" rel="noreferrer"  download>
          Download
        </a>
      ) : (
        'N/A'
      )} */}
                  {orderData.dirgram_zip ? (
                    <a
                      href={getFullUrl(orderData.dirgram_zip)}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Download
                    </a>
                  ) : (
                    "N/A"
                  )}
                </ListGroup.Item>

                <ListGroup.Item className="justify-content-between align-items-center">
                  <div>
                    <strong>Images: </strong>{" "}
                    <a href="#" onClick={downloadAllImages}>
                      Download All Images
                    </a>
                  </div>
                </ListGroup.Item>

                <ListGroup.Item className="justify-content-between align-items-center">
                  <div>
                    <strong>Project:</strong>{" "}
                    <Button
                      className="btn btn-primary btn-sm"
                      onClick={handleDownloadAll}
                    >
                      Download Project
                    </Button>
                  </div>
                </ListGroup.Item>
                <ListGroup.Item>
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>{t.quantity}</th>
                        <th>{t.uniquePrice}</th>
                        <th>{t.quotedPrice}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>{orderData.orderID}</td>
                        <td>{orderData.pcb_qty}</td>
                        <td>
                          {orderData.confirmed_price && orderData.pcb_qty
                            ? (
                                orderData.confirmed_price / orderData.pcb_qty
                              ).toFixed(2)
                            : "-"}{" "}
                          ฿
                        </td>
                        <td>{orderData.confirmed_price} ฿</td>
                      </tr>
                    </tbody>
                  </table>
                  <Row className="align-items-center">
                    <Col md={6}>
                      <h4>{t.ImageLbl}</h4>
                      {orderData.transferedDate ? (
                        <h5>
                          {format(new Date(orderData.transferedDate), "PPpp")}
                        </h5>
                      ) : (
                        <h5>-</h5>
                      )}
                    </Col>
                    <Col md={6} className="text-end">
                      <Image
                        src={getFullUrl(orderData.paymentSlip)}
                        alt="Slip"
                        thumbnail
                        style={{
                          width: "100px",
                          height: "auto",
                          cursor: "pointer",
                        }}
                        onClick={() =>
                          setZoomedImage(getFullUrl(orderData.paymentSlip))
                        }
                      />
                    </Col>
                  </Row>
                </ListGroup.Item>
              </ListGroup>

              <hr />

              <div className="d-flex flex-wrap gap-3 mt-3">
                {imageFields.map((field, idx) =>
                  orderData[field] ? (
                    <Image
                      key={idx}
                      src={getFullUrl(orderData[field])}
                      alt={`Photo ${idx + 1}`}
                      thumbnail
                      onClick={() =>
                        setZoomedImage(getFullUrl(orderData[field]))
                      }
                      style={{
                        cursor: "zoom-in",
                        width: "150px",
                        height: "150px",
                        objectFit: "cover",
                      }}
                    />
                  ) : null,
                )}
              </div>

              {zoomedImage && (
                <div
                  onClick={() => setZoomedImage(null)}
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
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CustomPCBDetailScreen;
