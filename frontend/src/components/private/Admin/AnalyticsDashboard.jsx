import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AdminDashboard() {
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    averageRating: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/users/admin/analytics', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setAnalytics({
          totalUsers: response.data.data.totalUsers || 0,
          totalOrders: response.data.data.totalOrders || 0,
          totalRevenue: response.data.data.totalRevenue || 0,
          averageRating: response.data.data.averageRating || 0,
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
      {error && <p className="text-red-500">{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 shadow rounded">
            <h3 className="text-lg font-semibold">Total Users</h3>
            <p className="text-2xl">{analytics.totalUsers}</p>
          </div>
          <div className="bg-white p-4 shadow rounded">
            <h3 className="text-lg font-semibold">Total Orders</h3>
            <p className="text-2xl">{analytics.totalOrders}</p>
          </div>
          <div className="bg-white p-4 shadow rounded">
            <h3 className="text-lg font-semibold">Total Revenue</h3>
            <p className="text-2xl">{analytics.totalRevenue} PLN</p>
          </div>
          <div className="bg-white p-4 shadow rounded">
            <h3 className="text-lg font-semibold">Average Rating</h3>
            <p className="text-2xl">{analytics.averageRating.toFixed(1)}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
