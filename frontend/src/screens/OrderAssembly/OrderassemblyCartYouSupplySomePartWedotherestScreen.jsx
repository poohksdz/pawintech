import React from 'react';
import { Container } from 'react-bootstrap';
import { useSelector } from 'react-redux';

const OrderassemblyCartYouSupplySomePartWedotherestScreen = () => {
  const { language } = useSelector((state) => state.language);

  const translations = {
    en: {
      title: '🚧 This feature is still under construction.',
      quote: '"We’re building this shared journey — thanks for your patience!"',
    },
    thai: {
      title: '🚧 ฟีเจอร์นี้ยังอยู่ระหว่างการพัฒนา',
      quote: '"เรากำลังสร้างฟีเจอร์นี้เพื่อการใช้งานร่วมกัน ขอบคุณที่รอคอย!"',
    },
  };

  const t = translations[language] || translations.en;

  return (
    <Container
      className="d-flex justify-content-center align-items-center text-center"
      style={{ height: '80vh' }}
    >
      <div>
        <h4 className="text-secondary">{t.title}</h4>
        <p className="text-muted mt-3">{t.quote}</p>
      </div>
    </Container>
  );
};

export default OrderassemblyCartYouSupplySomePartWedotherestScreen;
