/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // เพิ่มจังหวะการเคลื่อนไหวที่นุ่มนวล (Cubic Bezier)
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)', // มาตรฐานใหม่ นุ่มกว่า ease-in-out
        'spring': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', // เด้งนิดๆ สำหรับ Dropdown
      },
      // เพิ่มระยะเวลามาตรฐานใหม่
      transitionDuration: {
        '400': '400ms',
      },
      // (ถ้ามี keyframes เดิมอยู่ เช็คให้ตรงกัน หรือใช้ของเดิมก็ได้ครับ)
    },
  },
  plugins: [],
}