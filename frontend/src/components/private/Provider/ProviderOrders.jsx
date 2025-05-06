import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../api'; // Use the configured api instance
import { toast } from 'react-hot-toast';
import { List, AlertCircle, Loader, Filter, Search, Calendar, User, Tag, CheckCircle, XCircle, Clock } from 'lucide-react'; // Icons
import moment from 'moment';
import 'moment/locale/pl'; // Import Polish locale

moment.locale('pl'); // Set Polish locale

// Function to get status styling
const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
        case 'pending': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"><Clock size={12}/> Oczekujące</span>;
        case 'confirmed':
        case 'accepted': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"><CheckCircle size={12}/> Zaakceptowane</span>;
        case 'completed': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle size={12}/> Zakończone</span>;
        case 'cancelled': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"><XCircle size={12}/> Anulowane</span>;
        default: return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">Nieznany</span>;
    }
};

function ProviderOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: '', // e.g., 'pending', 'accepted', 'completed', 'cancelled'
    dateFrom: '',
    dateTo: '',
    search: '',
  });
  const [pagination, setPagination] = useState({
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      limit: 10, // Items per page
  });

  const fetchOrders = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      // Endpoint GET /providers/orders
      const response = await api.get('/providers/orders', {
        params: {
          page: page,
          limit: pagination.limit,
          status: filters.status || undefined, // Send only if filter is set
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined,
          search: filters.search || undefined,
        },
      });

      if (response.data.status === 'success') {
        setOrders(response.data.data);
        setPagination({
            currentPage: response.data.pagination.currentPage,
            totalPages: response.data.pagination.totalPages,
            totalItems: response.data.pagination.totalItems,
            limit: pagination.limit,
        });
      } else {
        throw new Error(response.data.message || 'Nie udało się pobrać listy zleceń');
      }
    } catch (err) {
      console.error("Błąd pobierania zleceń:", err);
      setError(err.response?.data?.message || err.message || 'Wystąpił błąd podczas ładowania zleceń.');
      toast.error('Nie udało się załadować listy zleceń.');
      setOrders([]); // Clear orders on error
      setPagination({ currentPage: 1, totalPages: 1, totalItems: 0, limit: 10 }); // Reset pagination
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit]); // Depend on filters and limit

  useEffect(() => {
    fetchOrders(1); // Fetch first page when component mounts or filters change
  }, [fetchOrders]); // fetchOrders is memoized with useCallback

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    // Fetching is handled by useEffect dependency change
  };

  const handleSearchChange = (e) => {
     setFilters(prev => ({ ...prev, search: e.target.value }));
     // Optional: Add debounce here if needed
  };

  const handlePageChange = (newPage) => {
      if (newPage >= 1 && newPage <= pagination.totalPages) {
          fetchOrders(newPage);
      }
  };

  // Action handlers (accept, cancel, complete) - similar to ProviderSingleEvent
   const handleStatusChange = async (orderId, status) => {
     const toastId = toast.loading(`Zmienianie statusu zlecenia ${orderId}...`);
     try {
       // Endpoint PATCH /providers/orders/:id/status
       const response = await api.patch(`/providers/orders/${orderId}/status`, { status });
       if (response.data.status === 'success') {
         toast.success('Status zlecenia zaktualizowany!', { id: toastId });
         fetchOrders(pagination.currentPage); // Refresh current page
       } else {
         throw new Error(response.data.message || 'Nie udało się zaktualizować statusu');
       }
     } catch (err) {
       console.error('Błąd aktualizacji statusu zlecenia:', err);
       toast.error(err.response?.data?.message || err.message || 'Wystąpił błąd.', { id: toastId });
     }
   };


  return (
    <div className="p-4 md:p-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
        <List size={24} /> Moje Zlecenia
      </h2>

      {/* Filters and Search */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Szukaj</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </span>
              <input
                type="text"
                id="search"
                name="search"
                value={filters.search}
                onChange={handleSearchChange}
                placeholder="Klient, usługa, tytuł..."
                className="w-full p-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>
          {/* Status Filter */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="">Wszystkie</option>
              <option value="pending">Oczekujące</option>
              <option value="accepted">Zaakceptowane</option>
              <option value="completed">Zakończone</option>
              <option value="cancelled">Anulowane</option>
            </select>
          </div>
          {/* Date Filters */}
          <div>
             <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data od</label>
             <input
               type="date"
               id="dateFrom"
               name="dateFrom"
               value={filters.dateFrom}
               onChange={handleFilterChange}
               className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
             />
           </div>
           <div>
             <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data do</label>
             <input
               type="date"
               id="dateTo"
               name="dateTo"
               value={filters.dateTo}
               onChange={handleFilterChange}
               className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
             />
           </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded flex items-center gap-2">
          <AlertCircle size={20} /> {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-10">
          <Loader size={32} className="mx-auto animate-spin text-sky-600" />
          <p className="mt-2 text-gray-500 dark:text-gray-400">Ładowanie zleceń...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-10 px-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          <List size={48} className="mx-auto text-gray-400 dark:text-gray-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Brak zleceń</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Nie znaleziono zleceń pasujących do wybranych filtrów.</p>
        </div>
      ) : (
        <>
          {/* Orders Table */}
          <div className="bg-white dark:bg-gray-800 shadow overflow-x-auto sm:rounded-md">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Data i Godzina</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Klient</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Usługa / Tytuł</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Akcje</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {orders.map((order) => {
                  const clientName = order.client?.name || `${order.client?.firstName || ''} ${order.client?.lastName || ''}`.trim() || 'Brak klienta';
                  const serviceName = order.service?.name || 'Nieokreślona usługa';
                  const displayTitle = order.title || serviceName;
                  const isDone = moment(order.endAt).isBefore(moment());

                  return (
                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-1">
                           <Calendar size={14} />
                           {moment(order.startAt).format('YYYY-MM-DD HH:mm')}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                         <div className="flex items-center gap-1">
                           <User size={14} />
                           {clientName}
                         </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate" title={displayTitle}>
                         <div className="flex items-center gap-1">
                           <Tag size={14} />
                           {displayTitle}
                         </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          {order.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(order.id, 'accepted')}
                                className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 p-1 rounded hover:bg-green-100 dark:hover:bg-green-900"
                                title="Akceptuj"
                              >
                                <CheckCircle size={18} />
                              </button>
                              <button
                                onClick={() => handleStatusChange(order.id, 'cancelled')}
                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900"
                                title="Odrzuć"
                              >
                                <XCircle size={18} />
                              </button>
                            </>
                          )}
                          {(order.status === 'accepted' || order.status === 'confirmed') && isDone && (
                             <button
                               onClick={() => handleStatusChange(order.id, 'completed')}
                               className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 p-1 rounded hover:bg-green-100 dark:hover:bg-green-900"
                               title="Oznacz jako zakończone"
                             >
                               <CheckCircle size={18} />
                             </button>
                           )}
                           {/* Add View/Edit details button if needed */}
                           {/* <button onClick={() => viewOrderDetails(order.id)} className="text-sky-600 hover:text-sky-800"><Eye size={18} /></button> */}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-6 flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
              <span>
                Strona {pagination.currentPage} z {pagination.totalPages} (Łącznie: {pagination.totalItems} zleceń)
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1 || loading}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Poprzednia
                </button>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages || loading}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Następna
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ProviderOrders;
