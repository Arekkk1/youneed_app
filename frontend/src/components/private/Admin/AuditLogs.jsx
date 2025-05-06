import React, { useState, useEffect } from 'react';
import api from '../../../api'; // Use the configured api instance
import { toast } from 'react-hot-toast';
import { List, User, Clock, Search, Filter } from 'lucide-react'; // Icons

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ action: '', userId: '', searchTerm: '' });
  // Add state for pagination

  useEffect(() => {
    fetchLogs();
  }, [filters]); // Refetch when filters change

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      // Assume endpoint GET /api/admin/audit-logs with filter params
      const response = await api.get('/admin/audit-logs', {
        params: {
          action: filters.action || undefined,
          userId: filters.userId || undefined,
          search: filters.searchTerm || undefined,
          // Add pagination params like page, limit
        },
      });
      if (response.data.status === 'success') {
        setLogs(response.data.data); // Assuming data is the array of logs
      } else {
        throw new Error(response.data.message || 'Nie udało się pobrać logów audytowych');
      }
    } catch (err) {
      console.error("Błąd pobierania logów:", err);
      setError(err.response?.data?.message || err.message || 'Nie udało się pobrać logów audytowych');
      toast.error('Nie udało się załadować logów audytowych.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Brak daty';
    try {
      return new Date(timestamp).toLocaleString('pl-PL', {
        dateStyle: 'short', timeStyle: 'medium'
      });
    } catch {
      return 'Nieprawidłowa data';
    }
  };

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Logi Audytowe</h2>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Filters */}
      <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            name="searchTerm"
            placeholder="Szukaj w szczegółach..."
            value={filters.searchTerm}
            onChange={handleFilterChange}
            className="w-full border border-gray-300 rounded-md p-2 pl-10 focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <div className="relative">
           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
             <List className="h-5 w-5 text-gray-400" />
           </div>
          <input
            type="text"
            name="action"
            placeholder="Filtruj po akcji (np. LOGIN, UPDATE_USER)"
            value={filters.action}
            onChange={handleFilterChange}
            className="w-full border border-gray-300 rounded-md p-2 pl-10 focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <div className="relative">
           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
             <User className="h-5 w-5 text-gray-400" />
           </div>
          <input
            type="text" // Could be a select if you fetch users
            name="userId"
            placeholder="Filtruj po ID użytkownika"
            value={filters.userId}
            onChange={handleFilterChange}
            className="w-full border border-gray-300 rounded-md p-2 pl-10 focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <p className="text-center text-gray-500 dark:text-gray-400">Ładowanie logów...</p>
      ) : (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow overflow-x-auto">
          {logs.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400">Nie znaleziono logów pasujących do kryteriów.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Data i Czas</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Akcja</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Użytkownik</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Szczegóły</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      <span className="flex items-center gap-1"><Clock size={14} /> {formatTimestamp(log.timestamp)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{log.action}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {log.user ? `${log.user.firstName || ''} ${log.user.lastName || ''} (ID: ${log.userId})` : `ID: ${log.userId || 'System'}`}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 max-w-md break-words">
                      {/* Display details - might need JSON.stringify or specific formatting */}
                      {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                    </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm">
                       <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${log.status === 'SUCCESS' ? 'bg-green-100 text-green-800' : log.status === 'FAILURE' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                         {log.status}
                       </span>
                     </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {/* Add Pagination controls here if needed */}
        </div>
      )}
    </div>
  );
}

export default AuditLogs;
