import React, { useState, useEffect } from 'react';
import api from '../../../api'; // Use the configured api instance
import { toast } from 'react-hot-toast';
import { Star, MessageSquare, Trash2, Eye, User, Briefcase } from 'lucide-react'; // Icons

function FeedbackManagement() {
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Add state for filtering/sorting if needed

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    setLoading(true);
    setError('');
    try {
      // Assume endpoint GET /api/admin/feedback
      const response = await api.get('/admin/feedback');
      if (response.data.status === 'success') {
        setFeedbackList(response.data.data); // Assuming data is the array of feedback
      } else {
        throw new Error(response.data.message || 'Nie udało się pobrać opinii');
      }
    } catch (err) {
      console.error("Błąd pobierania opinii:", err);
      setError(err.response?.data?.message || err.message || 'Nie udało się pobrać opinii');
      toast.error('Nie udało się załadować listy opinii.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFeedback = async (id) => {
     if (!window.confirm('Czy na pewno chcesz usunąć tę opinię?')) {
       return;
     }
     const deleteToast = toast.loading('Usuwanie opinii...');
     try {
       // Assume endpoint DELETE /api/admin/feedback/:id
       await api.delete(`/admin/feedback/${id}`);
       toast.success('Opinia usunięta pomyślnie!', { id: deleteToast });
       fetchFeedback(); // Refresh the list
     } catch (err) {
       console.error("Błąd usuwania opinii:", err);
       toast.error(err.response?.data?.message || 'Nie udało się usunąć opinii.', { id: deleteToast });
     }
   };

  // Helper to render stars
  const renderStars = (rating) => {
    if (typeof rating !== 'number' || rating < 1 || rating > 5) return 'Brak oceny';
    return Array(5).fill(0).map((_, i) => (
      <Star
        key={i}
        size={16}
        className={`inline-block ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'}`}
      />
    ));
  };

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Zarządzanie Opiniami</h2>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {loading ? (
        <p className="text-center text-gray-500 dark:text-gray-400">Ładowanie opinii...</p>
      ) : (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow overflow-x-auto">
          {feedbackList.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400">Brak opinii do wyświetlenia.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ocena</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Komentarz</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Klient</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Usługodawca</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Zlecenie ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Data</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Akcje</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {feedbackList.map((feedback) => (
                  <tr key={feedback.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{renderStars(feedback.rating)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 max-w-md">
                      {feedback.comment || <span className="italic text-gray-400">Brak komentarza</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      <span className="flex items-center gap-1">
                        <User size={14} /> {feedback.client?.name || feedback.client?.firstName || 'Anonim'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                       <span className="flex items-center gap-1">
                         <Briefcase size={14} /> {feedback.provider?.companyName || feedback.provider?.firstName || 'Brak'}
                       </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {feedback.orderId ? `#${feedback.orderId.substring(0, 8)}` : 'Brak'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {feedback.createdAt ? new Date(feedback.createdAt).toLocaleDateString('pl-PL') : 'Brak'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {/* View Order Link */}
                      {feedback.orderId && (
                        <a href={`/admin/orders/${feedback.orderId}`} title="Zobacz Zlecenie" className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200">
                          <Eye size={18} />
                        </a>
                      )}
                      <button
                        onClick={() => handleDeleteFeedback(feedback.id)}
                        title="Usuń Opinię"
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
          {/* Add Pagination controls here if needed */}
        </div>
      )}
    </div>
  );
}

export default FeedbackManagement;
