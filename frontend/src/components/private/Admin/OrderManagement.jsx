import React, { useState, useEffect } from 'react';
import api from '../../../api'; // Use the configured api instance
import { toast } from 'react-hot-toast';
import { Eye, Edit, Trash2, Filter, Search } from 'lucide-react'; // Icons
import { Link } from 'react-router-dom'; // For linking to order details

function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ status: '', searchTerm: '' });
  // Add state for pagination if needed

  useEffect(() => {
    fetchOrders();
  }, [filters]); // Refetch when filters change

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      // Assume endpoint GET /api/admin/orders with filter params
      const response = await api.get('/admin/orders', {
        params: {
          status: filters.status || undefined, // Send only if filter is set
          search: filters.searchTerm || undefined,
          // Add pagination params like page, limit if implemented
        },
      });
      if (response.data.status === 'success') {
        setOrders(response.data.data); // Assuming data is the array of orders
      } else {
        throw new Error(response.data.message || 'Nie udało się pobrać zleceń');
      }
    } catch (err) {
      console.error("Błąd pobierania zleceń:", err);
      setError(err.response?.data?.message || err.message || 'Nie udało się pobrać zleceń');
      toast.error('Nie udało się załadować listy zleceń.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleDeleteOrder = async (id) => {
     if (!window.confirm('Czy na pewno chcesz usunąć to zlecenie? Tej operacji nie można cofnąć.')) {
       return;
     }
     const deleteToast = toast.loading('Usuwanie zlecenia...');
     try {
       // Assume endpoint DELETE /api/admin/orders/:id
       await api.delete(`/admin/orders/${id}`);
       toast.success('Zlecenie usunięte pomyślnie!', { id: deleteToast });
       fetchOrders(); // Refresh the list
     } catch (err) {
       console.error("Błąd usuwania zlecenia:", err);
       toast.error(err.response?.data?.message || 'Nie udało się usunąć zlecenia.', { id: deleteToast });
     }
   };

   // Function to get status badge styling
   const getStatusBadge = (status) => {
     switch (status?.toLowerCase()) {
       case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
       case 'confirmed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
       case 'inprogress': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'; // Example
       case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
       case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
       default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
     }
   };

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Zarządzanie Zleceniami</h2>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Filters */}
      <div className="mb-4 flex flex-col sm:flex-row gap-4">
        <div className="flex-grow relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            name="searchTerm"
            placeholder="Szukaj (ID, tytuł, klient, usługodawca)..."
            value={filters.searchTerm}
            onChange={handleFilterChange}
            className="w-full border border-gray-300 rounded-md p-2 pl-10 focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <div className="relative">
           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
             <Filter className="h-5 w-5 text-gray-400" />
           </div>
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="appearance-none w-full sm:w-auto border border-gray-300 rounded-md p-2 pl-10 pr-8 focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">Wszystkie Statusy</option>
            <option value="pending">Oczekujące</option>
            <option value="confirmed">Potwierdzone</option>
            <option value="inProgress">W trakcie</option> {/* Adjust if needed */}
            <option value="completed">Zakończone</option>
            <option value="cancelled">Anulowane</option>
          </select>
           <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
             <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
               <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
             </svg>
           </div>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <p className="text-center text-gray-500 dark:text-gray-400">Ładowanie zleceń...</p>
      ) : (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow overflow-x-auto">
          {orders.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400">Nie znaleziono zleceń pasujących do kryteriów.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID / Tytuł</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Klient</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Usługodawca</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Usługa</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cena</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Data Utworzenia</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Akcje</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      <Link to={`/admin/orders/${order.id}`} className="hover:underline"> {/* Link to detail view */}
                        {order.title || `#${order.id.substring(0, 8)}`}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{order.client?.name || order.client?.firstName || 'Brak'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{order.provider?.companyName || order.provider?.firstName || 'Brak'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{order.service?.name || 'Brak'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {order.service?.price?.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' }) || 'Brak'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold leading-5 ${getStatusBadge(order.status)}`}>
                        {order.status || 'Nieznany'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString('pl-PL') : 'Brak'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Link to={`/admin/orders/${order.id}`} title="Zobacz Szczegóły" className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200">
                        <Eye size={18} />
                      </Link>
                      {/* Edit might involve changing status or details - implement modal/page */}
                      {/* <button title="Edytuj" className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200">
                        <Edit size={18} />
                      </button> */}
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        title="Usuń"
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {/* Add Pagination controls here if implemented */}
        </div>
      )}
    </div>
  );
}

export default OrderManagement;
