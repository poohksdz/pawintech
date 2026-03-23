import React from 'react';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';

const Rating = ({ value, text, color }) => {
  return (
    <div className="flex items-center">
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, index) => {
          const ratingValue = index + 1;
          
          return (
            <span key={index} style={{ color }} className="text-lg leading-none">
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

Rating.defaultProps = {
  color: '#facc15', // สีเหลืองทอง (Tailwind yellow-400)
};

export default Rating;