import React from 'react';
import { Navigate, useLocation } from 'react-router-dom'; // Added useLocation for logging

function ProtectedRoute({ children, role: requiredRoleProp }) {
  const location = useLocation(); // Get current location for logging
  const token = localStorage.getItem('token');
  const userRoleFromStorage = localStorage.getItem('role');

  console.log(`[ProtectedRoute DEBUG] Evaluating route for path: ${location.pathname}`);
  console.log(`[ProtectedRoute DEBUG] Token present in localStorage: ${!!token}`);
  console.log(`[ProtectedRoute DEBUG] User role from localStorage: '${userRoleFromStorage}'`);
  console.log(`[ProtectedRoute DEBUG] Required role for this route (prop): '${requiredRoleProp}'`);

  if (!token) {
    console.log('[ProtectedRoute DEBUG] No token found. Redirecting to /login.');
    // Pass current path to redirect back after login, if desired
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If a specific role is required for this route (requiredRoleProp is provided)
  if (requiredRoleProp) {
    if (userRoleFromStorage !== requiredRoleProp) {
      console.warn(`[ProtectedRoute DEBUG] Role mismatch! User role: '${userRoleFromStorage}', Required role: '${requiredRoleProp}'. Redirecting to /.`);
      return <Navigate to="/" replace />; // Redirect to main page if roles don't match
    } else {
      console.log(`[ProtectedRoute DEBUG] Role match. User role: '${userRoleFromStorage}', Required role: '${requiredRoleProp}'. Access GRANTED.`);
    }
  } else {
    // If no specific role is required (requiredRoleProp is undefined),
    // just being authenticated (token exists) is enough.
    console.log('[ProtectedRoute DEBUG] No specific role required for this route. Access GRANTED (token exists).');
  }

  return children; // User is authenticated and has the required role (if any)
}

export default ProtectedRoute;
