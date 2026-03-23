import React from 'react';
import { Container, Button, Card } from 'react-bootstrap';
import { FaTools, FaArrowLeft, FaCogs, FaDraftingCompass } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

const OrderAssemblyDitalScreen = () => {
  const { language } = useSelector((state) => state.language);

  const translations = {
    en: {
      title: 'Assembly Details Coming Soon',
      subtitle: 'We are building a comprehensive view for your Assembly Orders.',
      desc: 'Soon you will be able to track assembly progress, view component lists, and check QC status right here.',
      goBack: 'Back to Dashboard',
    },
    thai: {
      title: 'รายละเอียดงานประกอบกำลังพัฒนา',
      subtitle: 'เรากำลังพัฒนาระบบแสดงรายละเอียดสำหรับงานประกอบ (Assembly) ของคุณ',
      desc: 'เร็วๆ นี้คุณจะสามารถติดตามความคืบหน้า รายการอุปกรณ์ และสถานะ QC ได้ที่หน้านี้',
      goBack: 'กลับสู่แดชบอร์ด',
    },
  };

  const t = translations[language] || translations.en;

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
      <Card className="border-0 shadow-sm rounded-4 text-center p-4 p-md-5" style={{ maxWidth: '650px', width: '100%' }}>
        <Card.Body>
          {/* Animated Icon Section */}
          <div className="mb-4 position-relative d-inline-block">
            <div className="p-4 bg-warning bg-opacity-10 rounded-circle text-warning">
                <FaDraftingCompass size={60} />
            </div>
            <div className="position-absolute bottom-0 end-0 bg-white rounded-circle p-2 shadow-sm border">
                 <FaCogs size={20} className="text-secondary" />
            </div>
          </div>

          <h2 className="fw-bold text-dark mb-2">{t.title}</h2>
          <h5 className="text-primary fw-medium mb-3">{t.subtitle}</h5>
          
          <p className="text-muted mb-5 small mx-auto" style={{ maxWidth: '500px', lineHeight: '1.6' }}>
            {t.desc}
          </p>

          <Link to="/profile">
            <Button 
                variant="primary" 
                size="lg" 
                className="rounded-pill px-5 shadow-sm fw-bold d-inline-flex align-items-center gap-2"
            >
              <FaArrowLeft /> {t.goBack}
            </Button>
          </Link>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default OrderAssemblyDitalScreen;