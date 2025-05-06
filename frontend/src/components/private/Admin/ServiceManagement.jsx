import React, { useState, useEffect } from 'react';
import api from '../../../api'; // Use the configured api instance
import { toast } from 'react-hot-toast';
import { Package, Edit, Trash2, PlusCircle } from 'lucide-react';

function ServiceManagement() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentService, setCurrentService] = useState(null); // For editing/creating

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    setError('');
    try {
      // Assume endpoint GET /api/admin/services or /api/services
      const response = await api.get('/admin/services');
      if (response.data.status === 'success') {
        setServices(response.data.data);
      } else {
        throw new Error(response.data.message || 'Nie udało się pobrać usług');
      }
    } catch (err) {
      console.error("Błąd pobierania usług:", err);
      setError(err.response?.data?.message || err.message || 'Nie udało się pobrać usług');
      toast.error('Nie udało się załadować listy usług.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (service = null) => {
    setCurrentService(service ? { ...service } : { name: '', description: '', category: '', basePrice: '' }); // Initialize
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentService(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentService(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    if (!currentService) return;

    const serviceData = {
      ...currentService,
      basePrice: parseFloat(currentService.basePrice) || 0, // Ensure price is a number
    };

    const isEditing = !!currentService.id;
    const url = isEditing ? `/admin/services/${currentService.id}` : '/admin/services';
    const method = isEditing ? 'put' : 'post';
    const action = isEditing ? 'Aktualizowanie' : 'Tworzenie';
    const saveToast = toast.loading(`${action} usługi...`);

    try {
      const response = await api[method](url, serviceData);
      if (response.data.status === 'success') {
        toast.success(`Usługa ${isEditing ? 'zaktualizowana' : 'utworzona'} pomyślnie!`, { id: saveToast });
        handleCloseModal();
        fetchServices(); // Refresh the list
      } else {
        throw new Error(response.data.message || `Nie udało się ${isEditing ? 'zaktualizować' : 'utworzyć'} usługi`);
      }
    } catch (err) {
      console.error(`Błąd ${action.toLowerCase()} usługi:`, err);
      toast.error(err.response?.data?.message || `Nie udało się ${isEditing ? 'zaktualizować' : 'utworzyć'} usługi.`, { id: saveToast });
    }
  };

  const handleDeleteService = async (id) => {
     if (!window.confirm('Czy na pewno chcesz usunąć tę usługę? Może to wpłynąć na istniejące zlecenia.')) {
       return;
     }
     const deleteToast = toast.loading('Usuwanie usługi...');
     try {
       // Assume endpoint DELETE /api/admin/services/:id
       await api.delete(`/admin/services/${id}`);
       toast.success('Usługa usunięta pomyślnie!', { id: deleteToast });
       fetchServices(); // Refresh the list
     } catch (err) {
       console.error("Błąd usuwania usługi:", err);
       toast.error(err.response?.data?.message || 'Nie udało się usunąć usługi.', { id: deleteToast });
     }
   };

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Zarządzanie Usługami</h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-md hover:bg-sky-700 transition duration-150"
        >
          <PlusCircle size={18} />
          Dodaj Usługę
        </button>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {loading ? (
        <p className="text-center text-gray-500 dark:text-gray-400">Ładowanie usług...</p>
      ) : (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow overflow-x-auto">
          {services.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400">Brak zdefiniowanych usług.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nazwa Usługi</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Kategoria</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cena Bazowa</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Opis</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Akcje</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {services.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{service.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{service.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {service.basePrice?.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 max-w-xs truncate">{service.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleOpenModal(service)}
                        title="Edytuj"
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteService(service.id)}
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

      {/* Modal for Add/Edit Service */}
      {isModalOpen && currentService && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-6 border w-full max-w-lg shadow-lg rounded-md bg-white dark:bg-gray-800">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {currentService.id ? 'Edytuj Usługę' : 'Dodaj Nową Usługę'}
            </h3>
            <form onSubmit={handleSaveService} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nazwa Usługi</label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={currentService.name}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Kategoria</label>
                <input
                  type="text"
                  name="category"
                  id="category"
                  value={currentService.category}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="np. Hydraulika, IT, Sprzątanie"
                />
              </div>
              <div>
                <label htmlFor="basePrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cena Bazowa (PLN)</label>
                <input
                  type="number"
                  name="basePrice"
                  id="basePrice"
                  step="0.01"
                  value={currentService.basePrice}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Opis</label>
                <textarea
                  name="description"
                  id="description"
                  rows="3"
                  value={currentService.description}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700"
                >
                  {currentService.id ? 'Zapisz Zmiany' : 'Dodaj Usługę'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ServiceManagement;
