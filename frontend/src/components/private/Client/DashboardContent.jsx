import React, { useState, useEffect } from 'react';
import api from '../../../api'; // Use the configured api instance
import EcommerceMetrics from '../EcommerceMetrics';
import MonthlySalesChart from '../MonthlySalesChart';
import StatisticsChart from '../StatisticsChart';
import RecentOrders from '../RecentOrders';
import AddEventBanner from './AddEventBaner';
import ClientTaskCreateOrder from './TaskCreateOrder'; // Import the modal form
import { X } from 'lucide-react'; // For the close button

// Assume you get clientId from auth context or props
const MOCK_CLIENT_ID = 1; // Replace with actual client ID retrieval logic

function ClientDashboardContent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateOrderModalOpen, setIsCreateOrderModalOpen] = useState(false);
  const [clientId, setClientId] = useState(MOCK_CLIENT_ID); // Example: Set client ID

  // Function to open the modal
  const openModal = () => {
    setIsCreateOrderModalOpen(true);
  };

  // Function to close the modal
  const closeModal = () => {
    setIsCreateOrderModalOpen(false);
  };

  // Optional: Fetch client-specific summary data
  useEffect(() => {
    const fetchClientSummary = async () => {
      setLoading(true);
      try {
        // Fetch client ID if not available directly
        // const userResponse = await api.get('/auth/me'); // Example endpoint
        // setClientId(userResponse.data.id);
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate loading
      } catch (err) {
        console.error("Client Dashboard Error:", err);
        setError(err.response?.data?.message || err.message || 'Wystąpił błąd podczas ładowania panelu klienta.');
      } finally {
        setLoading(false);
      }
    };

    fetchClientSummary();
  }, []);

  if (loading) {
    return <div className="p-6 text-center">Ładowanie panelu klienta...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">Błąd: {error}</div>;
  }

  const clientRole = 'client';

  return (
    <div className="bg-slate-200 grid grid-cols-12 gap-4 md:gap-6 p-6 relative"> {/* Added relative positioning */}

  
      {/* Row 1: Metrics */}
      <div className="col-span-12">
        <EcommerceMetrics role={clientRole} />
      </div>

      {/* Row 2: Charts */}
      <div className="col-span-12 xl:col-span-7">
        <MonthlySalesChart role={clientRole} />
      </div>
      <div className="col-span-12 xl:col-span-5">
        <StatisticsChart role={clientRole} />
      </div>

      {/* Row 3: Recent Orders */}
      <div className="col-span-12">
        <RecentOrders role={clientRole} />
      </div>

      {/* Modal for Creating Order */}
      {isCreateOrderModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
           {/* Modal Content Wrapper */}
           <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full relative">
             {/* Close Button inside the modal content area */}
             <button
                onClick={closeModal}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors z-10" // Ensure button is above content
                aria-label="Zamknij"
             >
                <X size={24} />
             </button>
             {/* Render the form inside the styled wrapper */}
             <ClientTaskCreateOrder
                sendValue={closeModal} // Function to close the modal
                selectedDate={null} // No pre-selected date
                selectedHour={null} // No pre-selected hour
                onOrderCreated={() => { /* Optional: handle order creation feedback */ }}
                initialData={null} // Not editing
                serviceProviderId={null} // *** CRITICAL: No provider selected yet ***
                clientId={clientId} // Pass the client ID
                initialServiceId={null} // No initial service
             />
           </div>
        </div>
      )}

    </div>
  );
}

export default ClientDashboardContent;
