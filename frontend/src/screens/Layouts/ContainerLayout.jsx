import React from "react";
import { Outlet } from "react-router-dom";
import { Container } from "react-bootstrap";

const ContainerLayout = () => {
  return (
    // ใช้ <main> เพื่อความถูกต้องตามหลัก Semantic HTML
    // bg-light: สีพื้นหลังเทาอ่อน ช่วยให้ Card สีขาวในหน้าต่างๆ ดูเด่นขึ้น
    <main className="py-4 bg-slate-50 dark:bg-black transition-colors duration-500" style={{ minHeight: "85vh" }}>
      <Container>
        {/* Outlet คือจุดที่จะแสดงผลหน้าจอต่างๆ (Product, Profile, etc.) */}
        <Outlet />
      </Container>
    </main>
  );
};

export default ContainerLayout;
