import React from "react";

const Loader = ({ fullScreen = false, size = "60px", text = "Loading..." }) => {
  // Container Classes: จัดการ Layout และ Overlay
  const containerClasses = fullScreen
    ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm transition-all duration-300"
    : "flex flex-col items-center justify-center w-full h-full p-8";

  // Spinner Logic: แปลง size เป็นตัวเลขเพื่อคำนวณความหนาเส้น (Optional)
  // แต่ในที่นี้เราจะใช้ style width/height ตรงๆ เพื่อรองรับค่าที่ส่งมาแบบ '60px'

  return (
    <div className={containerClasses}>
      {/* Spinner Ring */}
      <div
        className="animate-spin rounded-full border-solid border-gray-200 border-t-blue-600"
        style={{
          width: size,
          height: size,
          borderWidth: fullScreen ? "4px" : "3px", // เส้นหนาขึ้นถ้าเต็มจอ
        }}
        role="status"
      >
        <span className="sr-only">Loading...</span>
      </div>

      {/* Loading Text */}
      {text && (
        <div className="mt-4 text-sm font-bold tracking-widest text-gray-500 uppercase animate-pulse">
          {text}
        </div>
      )}
    </div>
  );
};

export default Loader;
