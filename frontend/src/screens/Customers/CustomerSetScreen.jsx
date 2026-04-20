import React, { useState } from "react";
import { Form, Button, Container, Row, Col, Card } from "react-bootstrap";
import { useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaUserPlus,
  FaBuilding,
  FaUserTie,
  FaIdCard,
  FaMapMarkerAlt,
  FaSave,
  FaArrowLeft,
} from "react-icons/fa";
import Loader from "../../components/Loader";
//  ตรวจสอบ path ให้ถูกต้อง
import { useCreateCustomerMutation } from "../../slices/customersApiSlice";

const CustomerSetScreen = () => {
  const navigate = useNavigate();
  const { language } = useSelector((state) => state.language);

  // State
  const [customerName, setCustomerName] = useState("");
  const [customerPresentName, setCustomerPresentName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerVAT, setCustomerVAT] = useState("");

  // API Call
  const [createCustomer, { isLoading }] = useCreateCustomerMutation();

  // Translations
  const t = {
    en: {
      title: "Create New Customer",
      subtitle: "Add a new customer to the system",
      lbl: {
        name: "Customer Name",
        presentName: "Contact Person / Present Name",
        vat: "Tax ID / VAT",
        address: "Address",
      },
      btn: { save: "Create Customer", back: "Go Back", saving: "Creating..." },
      placeholder: {
        name: "Enter company or customer name",
        present: "Enter contact person name",
        vat: "Enter Tax ID",
        address: "Enter full address",
      },
    },
    thai: {
      title: "เพิ่มลูกค้าใหม่",
      subtitle: "เพิ่มข้อมูลลูกค้าใหม่เข้าสู่ระบบ",
      lbl: {
        name: "ชื่อลูกค้า / บริษัท",
        presentName: "ชื่อผู้ติดต่อ / ชื่อที่แสดง",
        vat: "เลขประจำตัวผู้เสียภาษี",
        address: "ที่อยู่",
      },
      btn: { save: "บันทึกข้อมูล", back: "ย้อนกลับ", saving: "กำลังบันทึก..." },
      placeholder: {
        name: "ระบุชื่อลูกค้า หรือชื่อบริษัท",
        present: "ระบุชื่อผู้ติดต่อ",
        vat: "ระบุเลขผู้เสียภาษี",
        address: "ระบุที่อยู่ให้ครบถ้วน",
      },
    },
  }[language || "en"];

  // Submit Handler
  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      await createCustomer({
        customer_name: customerName,
        customer_present_name: customerPresentName,
        customer_address: customerAddress,
        customer_vat: customerVAT,
      }).unwrap();
      toast.success("Customer created successfully!");
      navigate("/admin/customers");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to create customer");
    }
  };

  return (
    <Container className="py-4 font-prompt">
      {/* Back Button */}
      <Link
        to="/admin/customers"
        className="btn btn-light mb-3 shadow-sm border text-decoration-none"
      >
        <FaArrowLeft className="me-2" /> {t.btn.back}
      </Link>

      <div className="d-flex align-items-center mb-4">
        <div className="bg-primary bg-opacity-10 p-3 rounded-circle me-3 text-primary">
          <FaUserPlus size={24} />
        </div>
        <div>
          <h2 className="fw-bold mb-0 text-dark">{t.title}</h2>
          <p className="text-muted mb-0">{t.subtitle}</p>
        </div>
      </div>

      {isLoading && <Loader />}

      <Row className="justify-content-center">
        <Col lg={10}>
          <Card className="shadow-sm border-0 rounded-4">
            <Card.Body className="p-4">
              <Form onSubmit={submitHandler}>
                <Row className="g-3">
                  {/* Customer Name */}
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="customerName">
                      <Form.Label className="fw-bold text-muted small">
                        <FaBuilding className="me-1" /> {t.lbl.name}{" "}
                        <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder={t.placeholder.name}
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        required
                        className="py-2"
                      />
                    </Form.Group>
                  </Col>

                  {/* Contact Person */}
                  <Col md={6}>
                    <Form.Group
                      className="mb-3"
                      controlId="customerPresentName"
                    >
                      <Form.Label className="fw-bold text-muted small">
                        <FaUserTie className="me-1" /> {t.lbl.presentName}
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder={t.placeholder.present}
                        value={customerPresentName}
                        onChange={(e) => setCustomerPresentName(e.target.value)}
                        className="py-2"
                      />
                    </Form.Group>
                  </Col>

                  {/* VAT */}
                  <Col md={12}>
                    <Form.Group className="mb-3" controlId="customerVAT">
                      <Form.Label className="fw-bold text-muted small">
                        <FaIdCard className="me-1" /> {t.lbl.vat}
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder={t.placeholder.vat}
                        value={customerVAT}
                        onChange={(e) => setCustomerVAT(e.target.value)}
                        className="py-2 font-monospace"
                      />
                    </Form.Group>
                  </Col>

                  {/* Address */}
                  <Col md={12}>
                    <Form.Group className="mb-4" controlId="customerAddress">
                      <Form.Label className="fw-bold text-muted small">
                        <FaMapMarkerAlt className="me-1" /> {t.lbl.address}
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        placeholder={t.placeholder.address}
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        className="py-2"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <div className="d-grid">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={isLoading}
                    className="shadow-sm"
                  >
                    <FaSave className="me-2" />
                    {isLoading ? t.btn.saving : t.btn.save}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <style dangerouslySetInnerHTML={{ __html: `
        .font-prompt { font-family: 'Prompt', sans-serif; }
        .form-control:focus { box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.1); border-color: #86b7fe; }
      ` }} />
    </Container>
  );
};

export default CustomerSetScreen;
