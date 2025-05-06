import React, { useState, useEffect } from 'react';
import api from '../../../api'; // Use the configured api instance
import EcommerceMetrics from '../EcommerceMetrics';
import MonthlySalesChart from '../MonthlySalesChart';
import StatisticsChart from '../StatisticsChart';
import DemographicCard from '../DemographicCard';
import RecentOrders from '../RecentOrders';
// Import other relevant charts/cards if needed, e.g., UserGrowthChart

function AdminDashboardContent() {
  const [loading, setLoading] = useState(true); // Manage overall loading state if needed
  const [error, setError] = useState('');

  // Optional: Fetch any admin-specific summary data not covered by shared components
  useEffect(() => {
    const fetchAdminSummary = async () => {
      setLoading(true); // Set loading true when starting data fetch
      try {
        // Example: Fetch pending provider approvals or system health status
        // const response = await api.get('/admin/summary');
        // if (response.data.status === 'success') {
        //   // Process summary data
        // } else {
        //   throw new Error(response.data.message || 'Failed to load admin summary');
        // }
        // Simulate loading completion if no specific fetch is needed here
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
      } catch (err) {
        console.error("Admin Dashboard Error:", err);
        setError(err.response?.data?.message || err.message || 'Wystąpił błąd podczas ładowania panelu administratora.');
      } finally {
        setLoading(false); // Set loading false after all fetches complete or fail
      }
    };

    fetchAdminSummary();
  }, []);

  if (loading) {
    return <div className="p-6 text-center">Ładowanie panelu administratora...</div>;
  }

  if (error) {
     return <div className="p-6 text-center text-red-500">Błąd: {error}</div>;
   }

  // Use role="admin" for shared components
  const adminRole = 'admin';

  return (
    <div className="bg-slate-200 grid grid-cols-12 gap-4 md:gap-6 p-6">
      {/* Row 1: Metrics */}
      <div className="col-span-12">
        <EcommerceMetrics role={adminRole} />
      </div>

      {/* Row 2: Sales Chart and Demographics/Targets */}
      <div className="col-span-12 xl:col-span-8">
        <MonthlySalesChart role={adminRole} />
      </div>
      <div className="col-span-12 xl:col-span-4">
        {/* Replace MonthlyTarget with something more relevant for admin? Or keep it? */}
        {/* <MonthlyTarget role={adminRole} /> */}
        <DemographicCard role={adminRole} />
      </div>

      {/* Row 3: Statistics Chart */}
      <div className="col-span-12">
        <StatisticsChart role={adminRole} />
      </div>

      {/* Row 4: Recent Orders and maybe another card */}
      <div className="col-span-12">
         <RecentOrders role={adminRole} />
      </div>

      {/* Add more admin-specific components/cards as needed */}
      {/* Example:
      <div className="col-span-12 md:col-span-6">
        <PendingApprovalsCard />
      </div>
      <div className="col-span-12 md:col-span-6">
        <SystemHealthCard />
      </div>
      */}
    </div>
  );
}

export default AdminDashboardContent;
