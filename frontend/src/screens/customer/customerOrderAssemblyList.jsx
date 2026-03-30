import React from "react";
import { Container, Button, Card } from "react-bootstrap";
import { FaTools, FaArrowLeft, FaCogs } from "react-icons/fa";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

const CustomerOrderAssemblyList = () => {
  const { language } = useSelector((state) => state.language);

  const translations = {
    en: {
      title: "Feature Under Development",
      subtitle:
        "We are working hard to bring you the Assembly Order feature soon.",
      goBack: "Back to Dashboard",
      stayTuned: "Stay tuned for updates!",
    },
    thai: {
      title: "ฟีเจอร์นี้กำลังอยู่ในระหว่างการพัฒนา",
      subtitle:
        "เรากำลังเร่งดำเนินการเพื่อเปิดให้ใช้งานระบบสั่งประกอบ (Assembly) เร็วๆ นี้",
      goBack: "กลับสู่แดชบอร์ด",
      stayTuned: "โปรดติดตามการอัปเดต!",
    },
  };

  const t = translations[language] || translations.en;

  return (
    <Container
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: "70vh" }}
    >
      <Card
        className="border-0 shadow-sm rounded-4 text-center p-5"
        style={{ maxWidth: "600px", width: "100%" }}
      >
        <Card.Body>
          {/* Animated Icon Section */}
          <div className="mb-4 position-relative d-inline-block">
            <div className="p-4 bg-primary bg-opacity-10 rounded-circle text-primary">
              <FaTools size={60} />
            </div>
            {/* Decorative small icon */}
            <div className="position-absolute bottom-0 end-0 bg-white rounded-circle p-1 shadow-sm">
              <FaCogs size={24} className="text-warning" />
            </div>
          </div>

          <h2 className="fw-bold text-dark mb-3">{t.title}</h2>

          <p className="text-muted mb-4 fs-5" style={{ lineHeight: "1.6" }}>
            {t.subtitle}
            <br />
            <span className="fs-6 opacity-75">{t.stayTuned}</span>
          </p>

          <Link to="/profile">
            <Button
              variant="outline-primary"
              size="lg"
              className="rounded-pill px-4 d-inline-flex align-items-center gap-2"
            >
              <FaArrowLeft /> {t.goBack}
            </Button>
          </Link>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CustomerOrderAssemblyList;
