const appleFontStack = [
  "-apple-system",
  "BlinkMacSystemFont",
  '"SF Pro Display"',
  '"SF Pro Thai"',
  '"Sukhumvit Set"',
  '"Noto Sans Thai"',
  "Prompt",
  '"Helvetica Neue"',
  "Helvetica",
  "Arial",
  "sans-serif",
];

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: appleFontStack,
        prompt: appleFontStack,
        inter: appleFontStack,
      },
      // เพิ่มจังหวะการเคลื่อนไหวที่นุ่มนวล ระดับพรีเมียม (Apple-style Easings)
      transitionTimingFunction: {
        DEFAULT: "cubic-bezier(0.25, 1, 0.5, 1)", // Quart ease-out (Smooth & Refined)
        "ease-in": "cubic-bezier(0.4, 0, 1, 1)",
        "ease-out": "cubic-bezier(0.16, 1, 0.3, 1)", // Expo ease-out (Signature Apple swoop)
        "ease-in-out": "cubic-bezier(0.65, 0, 0.35, 1)", // Elegant symmetric
        smooth: "cubic-bezier(0.16, 1, 0.3, 1)", // Update custom smooth class
        spring: "cubic-bezier(0.175, 0.885, 0.32, 1.1)", // Natural spring, not too bouncy
      },
      // เพิ่มระยะเวลามาตรฐานให้ยาวขึ้น เพื่อให้รู้สึกพรีเมียมและไม่กระตุก
      transitionDuration: {
        DEFAULT: "400ms", // Up from 150ms default
        200: "200ms",
        300: "300ms",
        400: "400ms",
        500: "500ms",
        700: "700ms",
        800: "800ms",
        1000: "1000ms",
      },
    },
  },
  plugins: [],
};
