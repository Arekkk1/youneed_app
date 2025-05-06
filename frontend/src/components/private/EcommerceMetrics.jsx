import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Star } from 'lucide-react'; // Added Star
import api from '../../api'; // Use the configured api instance
import { AlertCircle, Loader2 } from 'lucide-react'; // Added Loader

const iconMap = {
  earnings: <DollarSign className="text-green-500" />,
  expenses: <DollarSign className="text-red-500" />,
  revenue: <DollarSign className="text-blue-500" />,
  orders: <ShoppingCart className="text-purple-500" />,
  users: <Users className="text-indigo-500" />,
  rating: <Star className="text-yellow-500" />, // Added rating icon
  default: <TrendingUp className="text-gray-500" />,
};

const getIcon = (key) => {
  if (key.toLowerCase().includes('earning')) return iconMap.earnings;
  if (key.toLowerCase().includes('expense')) return iconMap.expenses;
  if (key.toLowerCase().includes('revenue')) return iconMap.revenue;
  if (key.toLowerCase().includes('order')) return iconMap.orders;
  if (key.toLowerCase().includes('user') || key.toLowerCase().includes('client') || key.toLowerCase().includes('provider')) return iconMap.users;
  if (key.toLowerCase().includes('rating')) return iconMap.rating;
  return iconMap.default;
};

// Simple mapping for Polish labels (can be expanded)
const labelMap = {
    totalEarnings: 'Całkowite Zarobki',
    completedOrders: 'Ukończone Zamówienia',
    pendingOrders: 'Oczekujące Zamówienia',
    activeServices: 'Aktywne Usługi',
    totalExpenses: 'Całkowite Wydatki',
    totalOrdersPlaced: 'Złożone Zamówienia',
    activeOrders: 'Aktywne Zamówienia',
    totalRevenue: 'Całkowity Przychód',
    totalUsers: 'Wszyscy Użytkownicy',
    totalProviders: 'Usługodawcy',
    totalClients: 'Klienci',
    totalOrders: 'Wszystkie Zamówienia',
    averageRating: 'Śr. Ocena',
    // Add more mappings as needed
};

const formatValue = (key, value) => {
    if (key.toLowerCase().includes('earning') || key.toLowerCase().includes('expense') || key.toLowerCase().includes('revenue')) {
        return `${parseFloat(value).toFixed(2)} zł`; // Format as currency
    }
    if (key.toLowerCase().includes('rating')) {
        return parseFloat(value).toFixed(1); // Format rating
    }
    return value; // Return raw value for counts etc.
};


function EcommerceMetrics({ role, initialData }) { // Role might be used for display logic if needed
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      setError('');
      try {
        // ** FIX: Remove role query parameter, backend gets it from token **
        const response = await api.get('/analytics/metrics');
        if (response.data.status === 'success') {
          setMetrics(response.data.data);
        } else {
          throw new Error(response.data.message || 'Nie udało się pobrać metryk');
        }
      } catch (err) {
        console.error("Błąd pobierania metryk:", err);
        setError(err.response?.data?.message || err.message || 'Wystąpił błąd podczas ładowania metryk.');
      } finally {
        setLoading(false);
      }
    };

    // Use initialData if provided (e.g., from dashboard summary), otherwise fetch
    if (initialData && Object.keys(initialData).length > 0) {
        // Map initialData keys if necessary to match expected metric keys
        // Example: if summary has 'pendingOrders', map it to 'pendingOrders' metric
        const mappedMetrics = {
            totalEarnings: initialData.totalEarnings,
            completedOrders: initialData.completedThisMonth, // Example mapping
            pendingOrders: initialData.pendingOrders,
            activeServices: initialData.totalServices,
            averageRating: initialData.averageRating,
            // Add other relevant mappings based on summary structure
        };
        setMetrics(mappedMetrics);
        setLoading(false);
    } else {
        fetchMetrics();
    }

  }, [initialData]); // Re-run if initialData changes

  if (loading) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 md:p-6 flex items-center justify-center h-24">
                    <Loader2 className="animate-spin text-gray-400" />
                </div>
            ))}
        </div>
    );
  }

  if (error) {
    return (
      <div className="col-span-12 p-4 bg-red-100 border border-red-400 text-red-700 rounded flex items-center gap-2">
        <AlertCircle size={20} /> Błąd ładowania metryk: {error}
      </div>
    );
  }

  if (!metrics || Object.keys(metrics).length === 0) {
    return <div className="text-center p-6 text-gray-500">Brak dostępnych metryk.</div>;
  }

  // Filter out the 'label' key before mapping
  const metricEntries = Object.entries(metrics).filter(([key]) => key !== 'label');


  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
      {metricEntries.map(([key, value]) => (
        <div key={key} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 md:p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{labelMap[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
            {getIcon(key)}
          </div>
          <div className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white">
            {formatValue(key, value)}
          </div>
          {/* Optional: Add comparison/trend later */}
          {/* <div className="text-xs text-green-500 flex items-center mt-1">
            <TrendingUp size={14} className="mr-1" />
            <span>+5.2% vs last month</span>
          </div> */}
        </div>
      ))}
    </div>
  );
}

export default EcommerceMetrics;
