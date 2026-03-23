import React from 'react';
import { FaShoppingCart } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

const FloatingCartButton = () => {
  const { cartItems } = useSelector((state) => state.cart);

  return (
    <>
      {/* Floating Cart Button, visible on xl and smaller */}
      <Link to="/cart" className="xl:hidden fixed bottom-5 right-5 z-50 group">
        <button
          className="flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/30"
          aria-label="Shopping Cart"
        >
          <FaShoppingCart size={22} />
          {cartItems.length > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 border-2 border-white rounded-full">
              {cartItems.reduce((a, c) => a + c.qty, 0)}
            </span>
          )}
        </button>
      </Link>
    </>
  );
};

export default FloatingCartButton;
