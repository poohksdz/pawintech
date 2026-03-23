import React from 'react';
import { Container } from 'react-bootstrap';
import { useSelector } from 'react-redux';

const OrderassemblyCartWeSupplyPartScreen = () => {
  const { language } = useSelector((state) => state.language);

  const translations = {
    en: {
      title: '🚧 This feature is still under construction.',
      quote: '"Great things take time — we\'re building something amazing for you!"',
    },
    thai: {
      title: '🚧 ฟีเจอร์นี้ยังอยู่ระหว่างการพัฒนา',
      quote: '"สิ่งที่ยิ่งใหญ่ต้องใช้เวลา เรากำลังสร้างสิ่งที่ยอดเยี่ยมเพื่อคุณ!"',
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

export default OrderassemblyCartWeSupplyPartScreen;
