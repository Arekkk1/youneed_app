import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../api'; // Use the configured api instance
import { toast } from 'react-hot-toast';
import { PlusCircle, Edit, Trash2, AlertCircle, DollarSign, Clock, Tag, Loader } from 'lucide-react';
import ServiceFormModal from './ServiceFormModal'; // Assuming a modal component exists

function ServiceManagement() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null); // For editing
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Endpoint GET /providers/services (fetches provider's own services)
      const response = await api.get('/providers/services');
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
  }, []); // No dependencies needed if api instance is stable

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleOpenModal = (mode = 'create', service = null) => {
    setModalMode(mode);
    setSelectedService(service);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedService(null);
  };

  const handleSaveService = async (serviceData) => {
    const isEdit = modalMode === 'edit';
    const toastId = toast.loading(isEdit ? 'Aktualizowanie usługi...' : 'Dodawanie usługi...');
    try {
      let response;
      // Ensure numeric fields are numbers and handle potential empty strings
      const payload = {
          ...serviceData,
          price: parseFloat(serviceData.price) || 0, // Default to 0 if parsing fails
          duration: parseInt(serviceData.duration, 10) || 0, // Default to 0 if parsing fails
      };

      // Basic frontend validation (complementary to backend)
      if (!payload.name || payload.price < 0 || payload.duration <= 0) {
          throw new Error("Nazwa, poprawna cena (>= 0) i dodatni czas trwania (> 0) są wymagane.");
      }


      if (isEdit && selectedService?.id) {
        // Endpoint PUT /providers/services/:id
        response = await api.put(`/providers/services/${selectedService.id}`, payload);
      } else {
        // Endpoint POST /providers/services
        response = await api.post('/providers/services', payload);
      }

      if (response.data.status === 'success') {
        toast.success(`Usługa ${isEdit ? 'zaktualizowana' : 'dodana'} pomyślnie!`, { id: toastId });
        handleCloseModal();
        fetchServices(); // Refresh the list
      } else {
        // Handle potential validation errors from backend
         if (response.data.errors) {
            const errorMessages = Object.values(response.data.errors).flat().join('. ');
            throw new Error(errorMessages);
         }
        throw new Error(response.data.message || `Nie udało się ${isEdit ? 'zaktualizować' : 'dodać'} usługi`);
      }
    } catch (err) {
      console.error(`Błąd ${isEdit ? 'aktualizacji' : 'dodawania'} usługi:`, err);
      const errorMessage = err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join('. ') // Flatten potential array errors
          : err.response?.data?.message || err.message || 'Wystąpił błąd.';
      toast.error(errorMessage, { id: toastId, duration: 5000 }); // Show error longer
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('Czy na pewno chcesz usunąć tę usługę? Może to wpłynąć na istniejące zlecenia i nie można tego cofnąć.')) {
      return;
    }
    const toastId = toast.loading('Usuwanie usługi...');
    try {
      // Endpoint DELETE /providers/services/:id
      const response = await api.delete(`/providers/services/${serviceId}`);
      // Check for status 204 No Content or a success message
      if (response.status === 204 || response.data?.status === 'success') {
        toast.success('Usługa usunięta!', { id: toastId });
        fetchServices(); // Refresh the list
      } else {
        throw new Error(response.data?.message || 'Nie udało się usunąć usługi');
      }
    } catch (err) {
      console.error("Błąd usuwania usługi:", err);
      toast.error(err.response?.data?.message || err.message || 'Wystąpił błąd podczas usuwania.', { id: toastId });
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Zarządzanie Usługami</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Dodawaj, edytuj lub usuwaj usługi oferowane klientom.</p>
        </div>
        <button
          onClick={() => handleOpenModal('create')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 flex-shrink-0"
        >
          <PlusCircle size={16} className="mr-2" /> Dodaj Nową Usługę
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded flex items-center gap-2">
          <AlertCircle size={20} /> {error}
        </div>
      )}

      {loading && (
         <div className="text-center py-10">
           <Loader size={32} className="mx-auto animate-spin text-sky-600" />
           <p className="mt-2 text-gray-500 dark:text-gray-400">Ładowanie usług...</p>
         </div>
       )}

      {!loading && !error && services.length === 0 && (
        <div className="text-center py-10 px-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          <Tag size={48} className="mx-auto text-gray-400 dark:text-gray-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Brak zdefiniowanych usług</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Zacznij od dodania swojej pierwszej usługi, aby klienci mogli rezerwować terminy.</p>
          <div className="mt-6">
            <button
              onClick={() => handleOpenModal('create')}
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
            >
              <PlusCircle className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Dodaj Pierwszą Usługę
            </button>
          </div>
        </div>
      )}

      {!loading && !error && services.length > 0 && (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
          <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-700">
            {services.map((service) => (
              <li key={service.id}>
                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150 ease-in-out">
                  <div className="flex items-center justify-between flex-wrap gap-2"> {/* Flex wrap for smaller screens */}
                    <div className="flex-1 min-w-0"> {/* Allow text to wrap */}
                      <p className="text-lg font-medium text-sky-600 dark:text-sky-400 truncate" title={service.name}>{service.name}</p>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 break-words">{service.description || 'Brak opisu'}</p> {/* Use break-words */}
                    </div>
                    <div className="ml-4 flex-shrink-0 flex items-center space-x-2">
                       <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 whitespace-nowrap">
                         <DollarSign size={12} className="mr-1" /> {service.price?.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}
                       </span>
                       <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 whitespace-nowrap">
                         <Clock size={12} className="mr-1" /> {service.duration} min
                       </span>
                      <button
                        onClick={() => handleOpenModal('edit', service)}
                        className="p-1 text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 rounded"
                        title="Edytuj"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteService(service.id)}
                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded"
                        title="Usuń"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Modal for adding/editing services */}
      {isModalOpen && (
        <ServiceFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveService}
          serviceData={selectedService}
          mode={modalMode}
        />
      )}
    </div>
  );
}

export default ServiceManagement;
