import React from "react";
import { motion } from "framer-motion";

const CustomCheckbox = ({ checked, onChange, variant = "black" }) => {
  const isWhite = variant === "white";
  return (
    <motion.div
      className="relative flex items-center justify-center cursor-pointer w-5 h-5"
      onClick={onChange}
      whileTap={{ scale: 0.85 }}
    >
      <motion.div
        className="w-5 h-5 rounded-[4px] flex items-center justify-center border-2 transition-colors"
        initial={false}
        animate={{
          backgroundColor: checked ? (isWhite ? "#ffffff" : "#000000") : "transparent",
          borderColor: isWhite ? "#ffffff" : (checked ? "#000000" : "#D1D5DB"),
        }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        <motion.svg
          className={`w-3.5 h-3.5 ${isWhite ? "text-[#00A651]" : "text-white"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <motion.polyline
            points="20 6 9 17 4 12"
            initial={false}
            animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
            transition={{
              pathLength: {
                duration: 0.3,
                ease: "easeOut",
                delay: checked ? 0.1 : 0,
              },
              opacity: { duration: 0.1 },
            }}
          />
        </motion.svg>
      </motion.div>
    </motion.div>
  );
};

export default CustomCheckbox;
