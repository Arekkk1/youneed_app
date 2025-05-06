import React, { useState, useEffect } from 'react';
import api from '../../../api'; // Use the configured api instance
import { toast } from 'react-hot-toast'; // Assuming react-hot-toast is used
import { UserPlus, Edit, Trash2, Lock, Unlock } from 'lucide-react'; // Icons

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null); // Store user ID to confirm deletion

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError('');
      try {
        // Use the correct admin endpoint with query params
        const response = await api.get('/admin/users', {
          params: { role: roleFilter, search: searchTerm }, // Add search term
        });
        if (response.data.status === 'success') {
          // Access data from response.data.data
          setUsers(response.data.data);
        } else {
          throw new Error(response.data.message || 'Nie udało się pobrać użytkowników');
        }
      } catch (err) {
        console.error("Błąd pobierania użytkowników:", err);
        setError(err.response?.data?.message || err.message || 'Nie udało się pobrać użytkowników');
        toast.error('Nie udało się załadować listy użytkowników.');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [roleFilter, searchTerm]); // Re-fetch when filter or search term changes

  const deleteUser = async (id) => {
    const deleteToast = toast.loading('Usuwanie użytkownika...');
    try {
      // Use the correct admin endpoint for deletion
      await api.delete(`/admin/users/${id}`);
      setUsers(users.filter((user) => user.id !== id));
      setDeleteConfirm(null); // Close confirmation dialog
      toast.success('Użytkownik usunięty pomyślnie!', { id: deleteToast });
    } catch (err) {
      console.error("Błąd usuwania użytkownika:", err);
      setError(err.response?.data?.message || 'Nie udało się usunąć użytkownika');
      toast.error(err.response?.data?.message || 'Nie udało się usunąć użytkownika.', { id: deleteToast });
    }
  };

  const updateRestrictions = async (id, currentRestrictions) => {
     const newBannedStatus = !currentRestrictions?.banned;
     const action = newBannedStatus ? 'Blokowanie' : 'Odblokowywanie';
     const updateToast = toast.loading(`${action} użytkownika...`);
     try {
       // Use the correct admin endpoint for restrictions
       const response = await api.put(
         `/admin/users/${id}/restrictions`,
         { banned: newBannedStatus } // Send the new restriction status
       );
       if (response.data.status === 'success') {
         // Update the user in the local state
         setUsers(users.map((user) => (user.id === id ? response.data.data : user)));
         toast.success(`Użytkownik ${newBannedStatus ? 'zablokowany' : 'odblokowany'}!`, { id: updateToast });
       } else {
         throw new Error(response.data.message || `Nie udało się ${newBannedStatus ? 'zablokować' : 'odblokować'} użytkownika`);
       }
     } catch (err) {
       console.error(`Błąd ${action.toLowerCase()} użytkownika:`, err);
       setError(err.response?.data?.message || `Nie udało się ${newBannedStatus ? 'zablokować' : 'odblokować'} użytkownika`);
       toast.error(err.response?.data?.message || `Nie udało się ${newBannedStatus ? 'zablokować' : 'odblokować'} użytkownika.`, { id: updateToast });
     }
   };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleFilterChange = (event) => {
    setRoleFilter(event.target.value);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Zarządzanie Użytkownikami</h2>
        {/* Add User Button - Implement functionality later */}
        {/* <button className="flex items-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-md hover:bg-sky-700 transition duration-150">
          <UserPlus size={18} />
          Dodaj Użytkownika
        </button> */}
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Filters and Search */}
      <div className="mb-4 flex flex-col sm:flex-row gap-4">
        <div className="flex-grow">
          <label htmlFor="search" className="sr-only">Szukaj</label>
          <input
            type="text"
            id="search"
            placeholder="Szukaj po nazwie lub emailu..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <div>
          <label htmlFor="roleFilter" className="sr-only">Filtruj po roli</label>
          <select
            id="roleFilter"
            value={roleFilter}
            onChange={handleFilterChange}
            className="border border-gray-300 rounded-md p-2 focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">Wszystkie Role</option>
            <option value="admin">Admin</option>
            <option value="provider">Usługodawca</option>
            <option value="client">Klient</option>
          </select>
        </div>
      </div>

      {/* User Table */}
      {loading ? (
        <p className="text-center text-gray-500 dark:text-gray-400">Ładowanie użytkowników...</p>
      ) : (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow overflow-x-auto">
          {users.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400">Nie znaleziono użytkowników pasujących do kryteriów.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nazwa</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rola</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Akcje</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{user.firstName} {user.lastName} {user.companyName ? `(${user.companyName})` : ''}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{user.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.restrictions?.banned ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {user.restrictions?.banned ? 'Zablokowany' : 'Aktywny'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {/* Edit User Button - Implement later */}
                      {/* <button title="Edytuj" className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200">
                        <Edit size={18} />
                      </button> */}
                      <button
                        onClick={() => updateRestrictions(user.id, user.restrictions)}
                        title={user.restrictions?.banned ? 'Odblokuj' : 'Zablokuj'}
                        className={`${user.restrictions?.banned ? 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-200' : 'text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-200'}`}
                      >
                        {user.restrictions?.banned ? <Unlock size={18} /> : <Lock size={18} />}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(user.id)}
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
        </div>
      )}

      {/* Delete Confirmation Modal (Simple Example) */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Potwierdź usunięcie</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500 dark:text-gray-300">
                  Czy na pewno chcesz usunąć użytkownika: {users.find(u => u.id === deleteConfirm)?.email}? Tej operacji nie można cofnąć.
                </p>
              </div>
              <div className="items-center px-4 py-3 space-x-4">
                <button
                  onClick={() => deleteUser(deleteConfirm)}
                  className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-auto shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Tak, usuń
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 text-base font-medium rounded-md w-auto shadow-sm hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Anuluj
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
