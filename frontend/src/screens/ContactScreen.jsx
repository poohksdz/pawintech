import React from "react";
import { useSelector } from "react-redux";
import { Container, Row, Col, Card, Image } from "react-bootstrap"; // ลบ Button ออก
import { FaPhoneAlt, FaFacebook, FaLine, FaMapMarkerAlt } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import ContactComponent from "../components/ContactComponent";

const ContactScreen = () => {
  const { language } = useSelector((state) => state.language);

  // แยกข้อมูลออกจาก JSX เพื่อให้จัด Layout ได้ยืดหยุ่นขึ้น
  const translations = {
    en: {
      title: "Contact Us",
      companyName: "Pawin Technology Co., Ltd.",
      address:
        "139/65 Soi Romklao 24, Romklao Road, Min Buri Subdistrict, Min Buri District, Bangkok 10510.",
      mapCaption: "Location Map",
    },
    thai: {
      title: "ติดต่อเรา",
      companyName: "บริษัท ภาวินท์เทคโนโลยี จำกัด",
      address:
        "139/65 ซอยร่มเกล้า24 ถนนร่มเกล้า แขวงมีนบุรี เขตมีนบุรี กรุงเทพ 10510",
      mapCaption: "แผนที่บริษัท",
    },
  };

  const t = translations[language] || translations.en;

  // Style สำหรับลิงก์เพื่อให้ดูสวยงามและมี Interaction
  const linkStyle = {
    textDecoration: "none",
    color: "#495057",
    fontWeight: "500",
    transition: "0.3s",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  };

  // Function เล็กๆ สำหรับ Icon Wrapper
  const IconWrapper = ({ children, color }) => (
    <div
      style={{
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        backgroundColor: color || "#e9ecef",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontSize: "18px",
        flexShrink: 0,
      }}
    >
      {children}
    </div>
  );

  return (
    <div
      style={{
        backgroundColor: "#f8f9fa",
        minHeight: "100vh",
        paddingBottom: "3rem",
      }}
    >
      {/* Header Section */}
      <div className="bg-white shadow-sm py-4 mb-5">
        <Container>
          <h2 className="fs-4 md:fs-2 fw-bold text-primary mb-0 border-start border-5 border-primary ps-3">
            {t.title}
          </h2>
        </Container>
      </div>

      <Container>
        <Row className="g-4 mb-5">
          {/* Left Column: Contact Information */}
          <Col lg={6} md={12}>
            <Card className="h-100 border-0 shadow-sm rounded-4 overflow-hidden">
              <Card.Body className="p-3 p-md-4 p-lg-5">
                <h3 className="fw-bold text-dark mb-3">{t.companyName}</h3>

                <hr className="my-4 text-muted opacity-25" />

                {/* Address */}
                <div className="d-flex mb-4">
                  <IconWrapper color="#dc3545">
                    <FaMapMarkerAlt />
                  </IconWrapper>
                  <div className="ms-3">
                    <h6 className="fw-bold mb-1">Address</h6>
                    <p className="text-muted mb-0">{t.address}</p>
                  </div>
                </div>

                {/* Phone */}
                <div className="d-flex mb-4">
                  <IconWrapper color="#198754">
                    <FaPhoneAlt />
                  </IconWrapper>
                  <div className="ms-3 d-flex align-items-center">
                    <a
                      href="tel:0992263277"
                      style={linkStyle}
                      className="hover-primary"
                    >
                      099-226-3277
                    </a>
                  </div>
                </div>

                {/* Line */}
                <div className="d-flex mb-4">
                  <IconWrapper color="#06c755">
                    <FaLine />
                  </IconWrapper>
                  <div className="ms-3 d-flex align-items-center">
                    <a
                      href="https://line.me/ti/p/pwtech"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={linkStyle}
                    >
                      @pwtech
                    </a>
                  </div>
                </div>

                {/* Email */}
                <div className="d-flex mb-4">
                  <IconWrapper color="#ffc107">
                    <MdEmail />
                  </IconWrapper>
                  <div className="ms-3 d-flex align-items-center">
                    <a href="mailto:contact@pawin-tech.com" style={linkStyle}>
                      contact@pawin-tech.com
                    </a>
                  </div>
                </div>

                {/* Facebook */}
                <div className="d-flex">
                  <IconWrapper color="#1877f2">
                    <FaFacebook />
                  </IconWrapper>
                  <div className="ms-3 d-flex align-items-center">
                    <a
                      href="https://www.facebook.com/@electotronixth"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={linkStyle}
                    >
                      electotronixth
                    </a>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Right Column: Map Image */}
          <Col lg={6} md={12}>
            <Card className="h-100 border-0 shadow-sm rounded-4 overflow-hidden">
              <div
                style={{
                  height: "100%",
                  minHeight: "400px",
                  position: "relative",
                }}
              >
                <Image
                  src="image/pawintach_location.JPG"
                  alt="Location map of Phawin Technology Co., Ltd."
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
                <div
                  className="position-absolute bottom-0 start-0 w-100 p-3"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
                  }}
                >
                  <p className="text-white mb-0 fw-light text-center">
                    <FaMapMarkerAlt className="me-2" />
                    {t.mapCaption}
                  </p>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Contact Form Section */}
        <Row className="justify-content-center">
          <Col lg={10}>
            <div className="bg-white p-3 p-md-4 p-lg-5 rounded-4 shadow-sm">
              <h4 className="fw-bold text-center mb-4">Send us a message</h4>
              <ContactComponent />
            </div>
          </Col>
        </Row>
      </Container>

      {/* Adding hover effect CSS via style tag */}
      <style jsx>{`
        .hover-primary:hover {
          color: #0d6efd !important;
          transform: translateX(5px);
        }
      `}</style>
    </div>
  );
};

export default ContactScreen;
