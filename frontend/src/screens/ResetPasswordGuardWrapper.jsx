import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import ResetPasswordScreen from './ResetPasswordScreen';

const ResetPasswordGuard = ({ children }) => {
  const location = useLocation();
  const token = new URLSearchParams(location.search).get('token');

  // Check if a token exists in the URL
  if (!token) {
    return <Navigate to="/requestpasswordreset" replace />;
  }

  // If token exists, render the ResetPasswordScreen
  return children;
};

export default function ResetPasswordGuardWrapper() {
  return <ResetPasswordGuard><ResetPasswordScreen /></ResetPasswordGuard>;
}  
