import React, { useState, useEffect } from "react";
import { Form, Button, Container, Row, Col, Card } from "react-bootstrap";
import { useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaArrowLeft,
  FaSave,
  FaEdit,
  FaLanguage,
  FaBarcode,
} from "react-icons/fa";
import Loader from "../../components/Loader";
import Message from "../../components/Message";
import {
  useGetCategoryDetailsQuery,
  useUpdateCategoryMutation,
} from "../../slices/categorySlice";

const CategoryEditScreen = () => {
  const { id: categoryId } = useParams();
  const navigate = useNavigate();
  const { language } = useSelector((state) => state.language);

  // State
  const [categoryName, setCategoryName] = useState("");
  const [categoryNameThai, setCategoryNameThai] = useState("");
  const [categoryShortName, setCategoryShortName] = useState("");

  // API Calls
  const {
    data: category,
    isLoading,
    error,
  } = useGetCategoryDetailsQuery(categoryId);
  const [updateCategory, { isLoading: loadingUpdate }] =
    useUpdateCategoryMutation();

  // Translations
  const t = {
    en: {
      title: "Edit Category",
      subtitle: "Update category details",
      lbl: {
        en: "Category Name (English)",
        th: "Category Name (Thai)",
        code: "Category Code / Short Name",
      },
      btn: { save: "Update Category", back: "Go Back", saving: "Updating..." },
      ph: {
        en: "Enter category name in English",
        th: "Enter category name in Thai",
        code: "Enter unique code",
      },
    },
    thai: {
      title: "แก้ไขหมวดหมู่",
      subtitle: "อัปเดตข้อมูลหมวดหมู่สินค้า",
      lbl: {
        en: "ชื่อหมวดหมู่ (ภาษาอังกฤษ)",
        th: "ชื่อหมวดหมู่ (ภาษาไทย)",
        code: "รหัสหมวดหมู่ / ชื่อย่อ",
      },
      btn: {
        save: "บันทึกการเปลี่ยนแปลง",
        back: "ย้อนกลับ",
        saving: "กำลังบันทึก...",
      },
      ph: {
        en: "ระบุชื่อหมวดหมู่ภาษาอังกฤษ",
        th: "ระบุชื่อหมวดหมู่ภาษาไทย",
        code: "ระบุรหัสที่ไม่ซ้ำกัน",
      },
    },
  }[language || "en"];

  useEffect(() => {
    if (category) {
      setCategoryName(category.categoryName || "");
      setCategoryNameThai(category.categoryNameThai || "");
      setCategoryShortName(category.categoryShortName || "");
    }
  }, [category]);

  const submitHandler = async (e) => {
    e.preventDefault();
    if (!categoryName || !categoryNameThai || !categoryShortName) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      await updateCategory({
        categoryId,
        categoryName,
        categoryNameThai,
        categoryShortName,
      }).unwrap();
      toast.success("Category updated successfully");
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
        <div className="bg-warning bg-opacity-10 p-3 rounded-circle me-3 text-warning">
          <FaEdit size={24} />
        </div>
        <div>
          <h2 className="fw-bold mb-0 text-dark">{t.title}</h2>
          <p className="text-muted mb-0">{t.subtitle}</p>
        </div>
      </div>

      {loadingUpdate && <Loader />}

      {isLoading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">
          {error?.data?.message || error.error}
        </Message>
      ) : (
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
                      <Form.Group
                        className="mb-4"
                        controlId="categoryShortName"
                      >
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
                      variant="warning"
                      size="lg"
                      className="text-dark shadow-sm fw-bold"
                      disabled={loadingUpdate}
                    >
                      <FaSave className="me-2" />
                      {loadingUpdate ? t.btn.saving : t.btn.save}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <style>{`
        .font-prompt { font-family: 'Prompt', sans-serif; }
        .form-control:focus { box-shadow: 0 0 0 0.25rem rgba(255, 193, 7, 0.15); border-color: #ffc107; }
      `}</style>
    </Container>
  );
};

export default CategoryEditScreen;
