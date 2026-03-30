import React from "react";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { Container, Row, Col } from "react-bootstrap";

const PointingEmailScreen = () => {
  const location = useLocation();
  const email = location.state?.email; // Get the email passed from the ForgotPasswordScreen
  const { language } = useSelector((state) => state.language); // Get the current language

  // Define translation object
  const translations = {
    en: {
      checkInbox: "Check Your Email Inbox!",
      emailSent:
        "We have sent you an email with a link to reset your password.",
      followInstructions: "Please check your inbox at",
      issue: "We encountered an issue. Please try again later.",
    },
    thai: {
      checkInbox: "ตรวจสอบกล่องอีเมลของคุณ!",
      emailSent: "เราได้ส่งอีเมลพร้อมลิงก์เพื่อรีเซ็ตรหัสผ่านของคุณแล้ว",
      followInstructions: "กรุณาตรวจสอบกล่องอีเมลที่",
      issue: "เราเจอปัญหา กรุณาลองใหม่อีกครั้ง",
    },
  };

  const t = translations[language] || translations.en;

  return (
    <Container
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: "80vh" }}
    >
      <Row className="w-100 text-center">
        <Col>
          <h1>{t.checkInbox}</h1>
          <div>
            {email ? (
              <p>
                {t.emailSent} {t.followInstructions} <strong>{email}</strong>{" "}
                {t.followInstructions.toLowerCase()}.
              </p>
            ) : (
              <p>{t.issue}</p>
            )}
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default PointingEmailScreen;
