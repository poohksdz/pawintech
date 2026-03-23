import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";
import 'animate.css';
import TrackVisibility from 'react-on-screen';
import { useGetAboutDetailsQuery } from "../slices/aboutApiSlice";
import { useGetAboutimagesQuery } from "../slices/aboutImageApiSlice";
import DOMPurify from "dompurify";

const AboutScreen = () => {
  // ⚠️ จุดที่ 1: ต้องแก้ ID นี้ให้ตรงกับใน Database ของคุณ
  // ถ้าไม่รู้ ลองเปิด Network Tab ดู API ที่เรียกไป หรือดูใน MongoDB
  const aboutId = "1";

  const { language } = useSelector((state) => state.language);

  // ดึงข้อมูล About
  const { data: about, isLoading, error, refetch } = useGetAboutDetailsQuery(aboutId);

  // ดึงข้อมูลรูปภาพ
  const { data: imageData, isLoading: isImgLoading } = useGetAboutimagesQuery({});

  useEffect(() => {
    refetch();
    // 🔍 Debug: ดูค่าที่ได้จาก API
  }, [about, error, imageData, refetch]);

  if (isLoading) return <Container className="py-5 text-center"><h3>Loading About Content...</h3></Container>;

  if (error) {
    return (
      <Container className="py-5 text-center text-danger">
        <h3>Error Loading Data</h3>
        <p>{error?.data?.message || error.error || "Check Console for details"}</p>
        <p>Possible cause: ID "{aboutId}" might not exist in Database.</p>
      </Container>
    );
  }

  if (!about) return <Container className="py-5 text-center"><h3>No about data found for ID: {aboutId}</h3></Container>;

  // ส่วนของการจัดการเนื้อหา (เหมือนเดิม)
  const content = language === "thai" ? about.aboutContentThai : about.aboutContentEng;

  const sanitizedContent = DOMPurify.sanitize(content || "", {
    ADD_TAGS: ["iframe"],
    ADD_ATTR: ["allowfullscreen", "frameborder", "src", "class"],
  });

  const processContent = (html) => {
    if (!html) return "";
    return html
      .replace(/src="(aboutImages\/.*?)"/g, 'src="/$1"')
      .replace(/<img /g, '<img style="max-width: 100%; height: auto; display: block; margin: 0 auto;" ')
      .replace(/<iframe /g, '<iframe style="width: 100%; max-width: 900px; aspect-ratio: 16/9; height: auto; display: block; margin: 0 auto;" ')
      .replace(
        /https:\/\/www\.youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/g,
        '<iframe class="ql-video" frameborder="0" allowfullscreen="true" style="width: 100%; max-width: 900px; aspect-ratio: 16/9; height: auto; display: block; margin: 0 auto;" src="https://www.youtube.com/embed/$1"></iframe>'
      );
  };

  const processedContent = processContent(sanitizedContent);

  const translations = {
    en: { editAbout: "EDIT" },
    thai: { editAbout: "แก้ไข" },
  };

  const t = translations[language] || translations.en;

  // ⚠️ จุดที่ 2: เช็คโครงสร้างรูปภาพให้ครอบคลุม
  // บางที API ส่งมาเป็น Array เลย หรือส่งมาเป็น { aboutimages: [...] }
  const imagesToDisplay = imageData?.aboutimages || imageData || [];

  return (
    <Container className="py-4">
      <TrackVisibility once partialVisibility>
        {({ isVisible }) => (
          <div className={isVisible ? "animate__animated animate__fadeInUp" : "opacity-0"}>
            <Row>
              <Col md={10} className="mx-auto">
                <div className="text-end">
                  <Link className='btn btn-light mb-3' to={`/admin/about/${aboutId}/edit`} style={{ color: '#303d4a' }}>
                    {t.editAbout}
                  </Link>
                </div>
                {/* แสดงเนื้อหา */}
                <div dangerouslySetInnerHTML={{ __html: processedContent }} />
              </Col>
            </Row>

            <hr />

            {/* ส่วนแสดงรูปภาพ */}
            <Row>
              {Array.isArray(imagesToDisplay) && imagesToDisplay.map((aboutImage) => (
                <Col key={aboutImage._id} xs={12} sm={6} md={3} className="mb-4">
                  <img
                    className="h-100 shadow zoom-card"
                    src={
                      typeof aboutImage.images === 'string'
                        ? aboutImage.images
                        : (aboutImage.images?.images || aboutImage.images?.path || aboutImage.images?.url || '/images/sample.jpg')
                    }
                    alt="About Gallery"
                  />
                </Col>
              ))}
            </Row>
          </div>
        )}
      </TrackVisibility>
    </Container>
  );
};

export default AboutScreen;