import React from 'react';
import { Link } from 'react-router-dom';

const SubscriptionSuccess = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <h2 className="text-2xl font-bold mb-4">Subskrypcja aktywowana!</h2>
        <p className="mb-4">Twoja płatność została pomyślnie przetworzona. Możesz teraz korzystać z pełnych możliwości platformy YouNeed.</p>
        <Link
          to={localStorage.getItem('role') === 'provider' ? '/dashboard/provider' : '/dashboard/client'}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Przejdź do panelu
        </Link>
      </div>
    </div>
  );
};

export default SubscriptionSuccess;
