import React, { useState, useEffect } from 'react';
import api from '../../../api'; // Use the configured api instance
import EcommerceMetrics from '../EcommerceMetrics';
import MonthlySalesChart from '../MonthlySalesChart';
import MonthlyTarget from '../MonthlyTarget';
import StatisticsChart from '../StatisticsChart';
import RecentOrders from '../RecentOrders';
import { AlertCircle, Loader2 } from 'lucide-react'; // Added Loader2
// Import provider-specific components like UpcomingAppointments, QuickActions

function ProviderDashboardContent() {
  const [loading, setLoading] = useState(true); // Manage overall loading state
  const [error, setError] = useState('');
  const [summaryData, setSummaryData] = useState(null); // For provider-specific summary

  // Fetch provider-specific summary data
  useEffect(() => {
    setLoading(false);
    // const fetchProviderSummary = async () => {
    //   setLoading(true);
    //   setError('');
    //   try {
    //     // ** FIX: Corrected API endpoint **
    //     const response = await api.get('/provider/dashboard/summary'); // Use /provider/ prefix
    //     if (response.data.status === 'success') {
    //       setSummaryData(response.data.data);
    //     } else {
    //       throw new Error(response.data.message || 'Nie udało się pobrać podsumowania panelu');
    //     }
    //   } catch (err) {
    //     console.error("Provider Dashboard Summary Error:", err);
    //     const errorMsg = err.response?.data?.message || err.message || 'Wystąpił błąd podczas ładowania podsumowania panelu usługodawcy.';
    //     setError(`Błąd ładowania podsumowania: ${errorMsg}`);
    //     // Don't necessarily block the whole dashboard on summary error
    //   } finally {
    //     setLoading(false);
    //   }
    // };

    // fetchProviderSummary();
  }, []);

   // Use role="provider" for shared components that need it for internal logic/display
   const providerRole = 'provider';

   // Display loading indicator only for the initial summary fetch
   if (loading) {
     return (
        <div className="p-6 text-center flex justify-center items-center h-64">
            <Loader2 className="animate-spin mr-2" size={24} />
            Ładowanie panelu usługodawcy...
        </div>
     );
   }

  return (
    <div className="bg-slate-200 dark:bg-gray-900 grid grid-cols-12 gap-4 md:gap-6 p-6">
      {/* Display error if summary fetch failed */}
      {/* {error && (
         <div className="col-span-12 p-4 mb-4 bg-red-100 border border-red-400 text-red-700 rounded flex items-center gap-2">
           <AlertCircle size={20} /> {error}
         </div>
       )} */}

      {/* Row 1: Metrics */}
      <div className="col-span-12">
        {/* Pass role for internal logic, initialData can be from summary or fetched internally */}
        <EcommerceMetrics role={providerRole} initialData={summaryData} />
      </div>

      {/* Row 2: Sales Chart and Monthly Target */}
      <div className="col-span-12 xl:col-span-7">
        <MonthlySalesChart role={providerRole} />
      </div>
      <div className="col-span-12 xl:col-span-5">
        <MonthlyTarget role={providerRole} initialData={summaryData?.target} />
      </div>

      {/* Row 3: Statistics Chart and Recent Orders */}
      <div className="col-span-12 xl:col-span-7">
         <StatisticsChart role={providerRole} />
      </div>
       <div className="col-span-12 xl:col-span-5">
         {/* Placeholder or another relevant card for providers */}
         <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 md:p-6 h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
             <h4 className="font-semibold mb-2">Szybkie Akcje</h4>
             <p className="text-sm text-center">(Np. Dodaj usługę, Zablokuj czas, Zarządzaj godzinami otwarcia)</p>
             {/* Add actual buttons/links here */}
         </div>
       </div>


      {/* Row 4: Recent Orders */}
      <div className="col-span-12">
        <RecentOrders role={providerRole} />
      </div>

      {/* Add more provider-specific components/cards */}
      {/* Example:
       <div className="col-span-12 md:col-span-6">
         <UpcomingAppointmentsCard appointments={summaryData?.upcomingAppointments} />
       </div>
       <div className="col-span-12 md:col-span-6">
         <QuickActionsCard /> // e.g., Add Service, Block Time
       </div>
       */}
    </div>
  );
}

export default ProviderDashboardContent;
