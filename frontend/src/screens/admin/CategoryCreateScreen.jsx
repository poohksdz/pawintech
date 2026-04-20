import React, { useState } from "react";
import { Form, Button, Container, Row, Col, Card } from "react-bootstrap";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaArrowLeft,
  FaSave,
  FaTags,
  FaLanguage,
  FaBarcode,
} from "react-icons/fa";
import Loader from "../../components/Loader";
// ️ ตรวจสอบ path ให้ถูกต้อง
import { useCreateCategoryMutation } from "../../slices/categorySlice";

const CategoryCreateScreen = () => {
  const navigate = useNavigate();
  const { language } = useSelector((state) => state.language);

  // State
  const [categoryName, setCategoryName] = useState("");
  const [categoryNameThai, setCategoryNameThai] = useState("");
  const [categoryShortName, setCategoryShortName] = useState("");

  // API Call
  const [createCategory, { isLoading }] = useCreateCategoryMutation();

  // Translations
  const t = {
    en: {
      title: "Create Category",
      subtitle: "Add a new product category",
      lbl: {
        en: "Category Name (English)",
        th: "Category Name (Thai)",
        code: "Category Code / Short Name",
      },
      btn: { save: "Create Category", back: "Go Back", saving: "Creating..." },
      ph: {
        en: "Enter category name in English",
        th: "Enter category name in Thai",
        code: "Enter unique code (e.g., IOT, ELEC)",
      },
    },
    thai: {
      title: "เพิ่มหมวดหมู่ใหม่",
      subtitle: "เพิ่มหมวดหมู่สินค้าใหม่ลงในระบบ",
      lbl: {
        en: "ชื่อหมวดหมู่ (ภาษาอังกฤษ)",
        th: "ชื่อหมวดหมู่ (ภาษาไทย)",
        code: "รหัสหมวดหมู่ / ชื่อย่อ",
      },
      btn: { save: "บันทึกข้อมูล", back: "ย้อนกลับ", saving: "กำลังบันทึก..." },
      ph: {
        en: "ระบุชื่อหมวดหมู่ภาษาอังกฤษ",
        th: "ระบุชื่อหมวดหมู่ภาษาไทย",
        code: "ระบุรหัสหรือชื่อย่อ (เช่น IOT, ELEC)",
      },
    },
  }[language || "en"];

  // Handler
  const submitHandler = async (e) => {
    e.preventDefault();
    // Basic validation
    if (
      !categoryName.trim() ||
      !categoryNameThai.trim() ||
      !categoryShortName.trim()
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      await createCategory({
        categoryName,
        categoryNameThai,
        categoryShortName,
      }).unwrap();
      toast.success("Category created successfully");
      navigate("/admin/categorylist");
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  return (
    <Container className="py-4 font-prompt">
      <Link
        to="/admin/categorylist"
        className="btn btn-light mb-3 shadow-sm border text-decoration-none"
      >
        <FaArrowLeft className="me-2" /> {t.btn.back}
      </Link>

      <div className="d-flex align-items-center mb-4">
        <div className="bg-primary bg-opacity-10 p-3 rounded-circle me-3 text-primary">
          <FaTags size={24} />
        </div>
        <div>
          <h2 className="fw-bold mb-0 text-dark">{t.title}</h2>
          <p className="text-muted mb-0">{t.subtitle}</p>
        </div>
      </div>

      {isLoading && <Loader />}

      <Row className="justify-content-center">
        <Col lg={8}>
          <Card className="shadow-sm border-0 rounded-4">
            <Card.Body className="p-4">
              <Form onSubmit={submitHandler}>
                <Row className="g-3">
                  <Col md={12}>
                    <Form.Group className="mb-3" controlId="categoryName">
                      <Form.Label className="fw-bold text-muted small">
                        <FaLanguage className="me-1" /> {t.lbl.en}{" "}
                        <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder={t.ph.en}
                        value={categoryName}
                        onChange={(e) => setCategoryName(e.target.value)}
                        className="py-2"
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col md={12}>
                    <Form.Group className="mb-3" controlId="categoryNameThai">
                      <Form.Label className="fw-bold text-muted small">
                        <FaLanguage className="me-1" /> {t.lbl.th}{" "}
                        <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder={t.ph.th}
                        value={categoryNameThai}
                        onChange={(e) => setCategoryNameThai(e.target.value)}
                        className="py-2"
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col md={12}>
                    <Form.Group className="mb-4" controlId="categoryShortName">
                      <Form.Label className="fw-bold text-muted small">
                        <FaBarcode className="me-1" /> {t.lbl.code}{" "}
                        <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder={t.ph.code}
                        value={categoryShortName}
                        onChange={(e) => setCategoryShortName(e.target.value)}
                        className="py-2 font-monospace"
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <div className="d-grid pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="text-white shadow-sm"
                    disabled={isLoading}
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
        .form-control:focus { box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.15); border-color: #0d6efd; }
      ` }} />
    </Container>
  );
};

export default CategoryCreateScreen;
