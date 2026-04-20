import React from "react";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";

const Rating = ({ value, text, color = "#facc15", className }) => {
  return (
    <div className={`flex items-center ${className || ""}`}>
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, index) => {
          const ratingValue = index + 1;

          return (
            <span
              key={index}
              style={{ color: value >= ratingValue || value >= ratingValue - 0.5 ? color : undefined }}
              className={`text-lg leading-none ${value >= ratingValue - 0.5 ? "star-filled" : "star-empty text-slate-200 dark:text-zinc-800"}`}
            >
              {value >= ratingValue ? (
                <FaStar />
              ) : value >= ratingValue - 0.5 ? (
                <FaStarHalfAlt />
              ) : (
                <FaRegStar />
              )}
            </span>
          );
        })}
      </div>

      {text && (
        <span className="ml-2 text-sm font-medium text-gray-500 pt-0.5">
          {text}
        </span>
      )}
    </div>
  );
};

export default Rating;
