import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { AlertCircle, Loader2, ExternalLink } from 'lucide-react';

const statusStyles = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  accepted: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

const statusLabels = {
  pending: 'Oczekujące',
  accepted: 'Zaakceptowane',
  completed: 'Ukończone',
  rejected: 'Odrzucone',
  cancelled: 'Anulowane',
};

function RecentOrders({ role }) { // Role might be used for display logic if needed
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRecentOrders = async () => {
      setLoading(true);
      setError('');
      try {
        // ** FIX: Remove role query parameter **
        const response = await api.get('/orders/recent');
        if (response.data.status === 'success') {
          setOrders(response.data.data);
        } else {
          throw new Error(response.data.message || 'Nie udało się pobrać ostatnich zamówień');
        }
      } catch (err) {
        console.error("Błąd pobierania ostatnich zamówień:", err);
        setError(err.response?.data?.message || err.message || 'Wystąpił błąd podczas ładowania ostatnich zamówień.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentOrders();
  }, []); // Fetch once on mount

  const renderOrders = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              ID / Tytuł
            </th>
            {role !== 'client' && ( // Show Client for Provider/Admin
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Klient
              </th>
            )}
             {role !== 'provider' && ( // Show Provider for Client/Admin
               <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                 Usługodawca
               </th>
             )}
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Usługa
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Data Utworzenia
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Akcje
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900 dark:text-white">{order.title}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">ID: {order.id}</div>
              </td>
              {role !== 'client' && (
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {order.clientName}
                </td>
              )}
              {role !== 'provider' && (
                 <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                   {order.providerName}
                 </td>
               )}
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                {order.serviceName}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                {format(new Date(order.createdAt), 'd MMM yyyy, HH:mm', { locale: pl })}
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[order.status] || statusStyles.cancelled}`}>
                  {statusLabels[order.status] || order.status}
                </span>
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                {/* Adjust link based on role and where order details are located */}
                <Link
                  to={`/${role}/orders/${order.id}`} // Example link structure
                  className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 inline-flex items-center"
                >
                  Szczegóły <ExternalLink size={14} className="ml-1" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 md:p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ostatnie Zamówienia</h3>
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="animate-spin text-indigo-500" size={32} />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded flex items-center gap-2 h-40 justify-center">
          <AlertCircle size={20} /> {error}
        </div>
      ) : orders.length > 0 ? (
        renderOrders()
      ) : (
        <div className="text-center p-6 text-gray-500 h-40 flex items-center justify-center">
            Brak ostatnich zamówień do wyświetlenia.
        </div>
      )}
    </div>
  );
}

export default RecentOrders;
