import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';

// ✅ เพิ่ม Props: loginPath, shippingPath, paymentPath, placeOrderPath
// ถ้าไม่ส่งค่ามา จะใช้ค่า Default ('/shipping', '/payment' ฯลฯ) เพื่อให้ระบบเดิมไม่พัง
const CheckoutSteps = ({ 
  step1, 
  step2, 
  step3, 
  step4,
  loginPath = '/login',
  shippingPath = '/shipping',
  paymentPath = '/payment',
  placeOrderPath = '/placeorder'
}) => {
  return (
    <Nav className='justify-content-center mb-4'>
      <Nav.Item>
        {step1 ? (
          <Nav.Link as={Link} to={loginPath}>
            Sign In
          </Nav.Link>
        ) : (
          <Nav.Link disabled>Sign In</Nav.Link>
        )}
      </Nav.Item>

      <Nav.Item>
        {step2 ? (
          <Nav.Link as={Link} to={shippingPath}>
            Shipping
          </Nav.Link>
        ) : (
          <Nav.Link disabled>Shipping</Nav.Link>
        )}
      </Nav.Item>

      <Nav.Item>
        {step3 ? (
          <Nav.Link as={Link} to={paymentPath}>
            Payment
          </Nav.Link>
        ) : (
          <Nav.Link disabled>Payment</Nav.Link>
        )}
      </Nav.Item>

      <Nav.Item>
        {step4 ? (
          <Nav.Link as={Link} to={placeOrderPath}>
            Summary
          </Nav.Link>
        ) : (
          <Nav.Link disabled>Order History</Nav.Link>
        )}
      </Nav.Item>
    </Nav>
  );
};

export default CheckoutSteps;