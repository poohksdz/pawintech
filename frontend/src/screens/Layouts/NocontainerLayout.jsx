import React from 'react';
import { Outlet } from 'react-router-dom';

const NocontainerLayout = () => {
  return (
    // ใช้ <main> เพื่อความถูกต้องตามหลัก Semantic HTML
    // minHeight: 85vh เพื่อกันไม่ให้ Footer ลอยขึ้นมากลางจอถ้าหน้า Home เนื้อหาน้อยเกินไป
    // ไม่ใส่ Padding หรือ Container เพื่อให้หน้า Home จัดการความกว้างเต็มจอได้เอง (Full Width)
    <main style={{ minHeight: '85vh', position: 'relative' }}>
      <Outlet />
    </main>
  );
};

export default NocontainerLayout;