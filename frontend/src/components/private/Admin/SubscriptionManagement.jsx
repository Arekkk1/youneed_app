import React, { useState, useEffect } from 'react';
import api from '../../../api'; // Use the configured api instance
import { toast } from 'react-hot-toast';
import { DollarSign, Edit, Trash2, PlusCircle } from 'lucide-react';

// Example Subscription Plan Structure (adjust as needed)
// { id: 'plan_1', name: 'Basic', price: 29.99, interval: 'month', features: ['Feature A', 'Feature B'] }

function SubscriptionManagement() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null); // For editing/creating

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    setError('');
    try {
      // Assume endpoint GET /api/admin/subscriptions/plans
      const response = await api.get('/admin/subscriptions/plans');
      if (response.data.status === 'success') {
        setPlans(response.data.data);
      } else {
        throw new Error(response.data.message || 'Nie udało się pobrać planów subskrypcji');
      }
    } catch (err) {
      console.error("Błąd pobierania planów:", err);
      setError(err.response?.data?.message || err.message || 'Nie udało się pobrać planów subskrypcji');
      toast.error('Nie udało się załadować planów subskrypcji.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (plan = null) => {
    setCurrentPlan(plan ? { ...plan } : { name: '', price: '', interval: 'month', features: '' }); // Initialize for create/edit
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentPlan(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentPlan(prev => ({ ...prev, [name]: value }));
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!currentPlan) return;

    const planData = {
      ...currentPlan,
      price: parseFloat(currentPlan.price), // Ensure price is a number
      features: currentPlan.features.split(',').map(f => f.trim()).filter(f => f), // Convert comma-separated string to array
    };

    const isEditing = !!currentPlan.id;
    const url = isEditing ? `/admin/subscriptions/plans/${currentPlan.id}` : '/admin/subscriptions/plans';
    const method = isEditing ? 'put' : 'post';
    const action = isEditing ? 'Aktualizowanie' : 'Tworzenie';
    const saveToast = toast.loading(`${action} planu...`);

    try {
      const response = await api[method](url, planData);
      if (response.data.status === 'success') {
        toast.success(`Plan ${isEditing ? 'zaktualizowany' : 'utworzony'} pomyślnie!`, { id: saveToast });
        handleCloseModal();
        fetchPlans(); // Refresh the list
      } else {
        throw new Error(response.data.message || `Nie udało się ${isEditing ? 'zaktualizować' : 'utworzyć'} planu`);
      }
    } catch (err) {
      console.error(`Błąd ${action.toLowerCase()} planu:`, err);
      toast.error(err.response?.data?.message || `Nie udało się ${isEditing ? 'zaktualizować' : 'utworzyć'} planu.`, { id: saveToast });
    }
  };

  const handleDeletePlan = async (id) => {
     if (!window.confirm('Czy na pewno chcesz usunąć ten plan subskrypcji?')) {
       return;
     }
     const deleteToast = toast.loading('Usuwanie planu...');
     try {
       // Assume endpoint DELETE /api/admin/subscriptions/plans/:id
       await api.delete(`/admin/subscriptions/plans/${id}`);
       toast.success('Plan usunięty pomyślnie!', { id: deleteToast });
       fetchPlans(); // Refresh the list
     } catch (err) {
       console.error("Błąd usuwania planu:", err);
       toast.error(err.response?.data?.message || 'Nie udało się usunąć planu.', { id: deleteToast });
     }
   };


  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Zarządzanie Subskrypcjami</h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-md hover:bg-sky-700 transition duration-150"
        >
          <PlusCircle size={18} />
          Dodaj Plan
        </button>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {loading ? (
        <p className="text-center text-gray-500 dark:text-gray-400">Ładowanie planów...</p>
      ) : (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow overflow-x-auto">
          {plans.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400">Brak zdefiniowanych planów subskrypcji.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nazwa Planu</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cena</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Okres</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Funkcje</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Akcje</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {plans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{plan.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {plan.price?.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{plan.interval === 'month' ? 'Miesięcznie' : plan.interval === 'year' ? 'Rocznie' : plan.interval}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                      <ul className="list-disc list-inside">
                        {plan.features?.map((feature, index) => <li key={index}>{feature}</li>)}
                      </ul>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleOpenModal(plan)}
                        title="Edytuj"
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeletePlan(plan.id)}
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

      {/* Modal for Add/Edit Plan */}
      {isModalOpen && currentPlan && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-6 border w-full max-w-lg shadow-lg rounded-md bg-white dark:bg-gray-800">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {currentPlan.id ? 'Edytuj Plan Subskrypcji' : 'Dodaj Nowy Plan Subskrypcji'}
            </h3>
            <form onSubmit={handleSavePlan} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nazwa Planu</label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={currentPlan.name}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cena (PLN)</label>
                <input
                  type="number"
                  name="price"
                  id="price"
                  step="0.01"
                  value={currentPlan.price}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="interval" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Okres Rozliczeniowy</label>
                <select
                  name="interval"
                  id="interval"
                  value={currentPlan.interval}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="month">Miesięcznie</option>
                  <option value="year">Rocznie</option>
                  {/* Add other intervals if needed */}
                </select>
              </div>
              <div>
                <label htmlFor="features" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Funkcje (oddzielone przecinkami)</label>
                <textarea
                  name="features"
                  id="features"
                  rows="3"
                  value={Array.isArray(currentPlan.features) ? currentPlan.features.join(', ') : currentPlan.features} // Handle array or string
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="np. Funkcja A, Funkcja B, Dostęp Premium"
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
                  {currentPlan.id ? 'Zapisz Zmiany' : 'Dodaj Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SubscriptionManagement;
