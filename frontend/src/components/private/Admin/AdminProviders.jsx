import React, { useState, useEffect } from 'react';
import api from '../../../api'; // Use the configured api instance
import { toast } from 'react-hot-toast';
import { Briefcase, Search, Eye, Clock, Edit } from 'lucide-react'; // Icons
import { Link } from 'react-router-dom'; // For linking

function AdminProviders() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  // Add state for pagination if needed

  useEffect(() => {
    fetchProviders();
  }, [searchTerm]); // Refetch when search term changes

  const fetchProviders = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch users with role 'provider'
      const response = await api.get('/admin/users', {
        params: {
          role: 'provider',
          search: searchTerm || undefined,
          // Add pagination params
        },
      });
      if (response.data.status === 'success') {
        setProviders(response.data.data);
      } else {
        throw new Error(response.data.message || 'Nie udało się pobrać listy usługodawców');
      }
    } catch (err) {
      console.error("Błąd pobierania usługodawców:", err);
      setError(err.response?.data?.message || err.message || 'Nie udało się pobrać listy usługodawców');
      toast.error('Nie udało się załadować listy usługodawców.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Zarządzanie Usługodawcami</h2>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Szukaj usługodawcy (nazwa, email, branża)..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full border border-gray-300 rounded-md p-2 pl-10 focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
      </div>

      {/* Providers Table */}
      {loading ? (
        <p className="text-center text-gray-500 dark:text-gray-400">Ładowanie usługodawców...</p>
      ) : (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow overflow-x-auto">
          {providers.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400">Nie znaleziono usługodawców pasujących do kryteriów.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nazwa Firmy / Imię</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Branża</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Akcje</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {providers.map((provider) => (
                  <tr key={provider.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {provider.companyName || `${provider.firstName} ${provider.lastName}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{provider.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{provider.industry || 'Brak'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${provider.restrictions?.banned ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {provider.restrictions?.banned ? 'Zablokowany' : 'Aktywny'}
                      </span>
                      {/* Add verification status if applicable */}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {/* Link to view provider details (maybe user management page) */}
                      <Link to={`/admin/users/${provider.id}`} title="Zobacz Profil" className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200">
                        <Eye size={18} />
                      </Link>
                      {/* Link to manage opening hours */}
                      <Link to={`/admin/providers/${provider.id}/opening-hours`} title="Zarządzaj Godzinami Otwarcia" className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-200">
                        <Clock size={18} />
                      </Link>
                       {/* Link to edit provider details (maybe user management page) */}
                       <Link to={`/admin/users/${provider.id}/edit`} title="Edytuj" className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200">
                         <Edit size={18} />
                       </Link>
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

export default AdminProviders;
