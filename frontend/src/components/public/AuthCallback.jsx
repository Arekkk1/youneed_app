import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

function AuthCallback({ setRole }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const role = params.get('role');
    const userId = params.get('userId');

    if (token && role && userId) {
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('userId', userId);
      setRole(role);
      navigate(`/dashboard/${role}`);
    } else {
      navigate('/login');
    }
  }, [navigate, location, setRole]);

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
      <p>Przetwarzanie logowania...</p>
    </div>
  );
}

export default AuthCallback;
