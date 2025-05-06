import React, { useState, useEffect } from 'react';
import api from '../../../api'; // Use the configured api instance
import { toast } from 'react-hot-toast';
import { Star, MessageSquare, User, Calendar } from 'lucide-react'; // Icons

function FeedbackList() {
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [averageRating, setAverageRating] = useState(0);
  // Add state for filtering/sorting if needed

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    setLoading(true);
    setError('');
    try {
      // Assume endpoint GET /api/providers/feedback
      const response = await api.get('/providers/feedback');
      if (response.data.status === 'success') {
        setFeedbackList(response.data.data.feedback || []); // Assuming data structure { feedback: [], averageRating: X }
        setAverageRating(response.data.data.averageRating || 0);
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

  // Helper to render stars
  const renderStars = (rating) => {
    if (typeof rating !== 'number' || rating < 1 || rating > 5) return null; // Don't render if no rating
    return Array(5).fill(0).map((_, i) => (
      <Star
        key={i}
        size={16}
        className={`inline-block ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'}`}
      />
    ));
  };

   const formatDate = (dateString) => {
     if (!dateString) return '';
     try { return new Date(dateString).toLocaleDateString('pl-PL'); }
     catch { return ''; }
   };

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Opinie Klientów</h2>
      <div className="mb-6 flex items-center gap-2 text-lg text-gray-600 dark:text-gray-300">
         Średnia ocena:
         {averageRating > 0 ? (
           <>
             <span className="font-semibold text-yellow-500">{averageRating.toFixed(1)}</span>
             {renderStars(Math.round(averageRating))}
           </>
         ) : (
           <span className="italic text-sm">Brak ocen</span>
         )}
       </div>


      {error && <p className="text-red-500 mb-4">{error}</p>}

      {loading ? (
        <p className="text-center text-gray-500 dark:text-gray-400">Ładowanie opinii...</p>
      ) : (
        <div className="space-y-4">
          {feedbackList.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">Nie otrzymano jeszcze żadnych opinii.</p>
          ) : (
            feedbackList.map((feedback) => (
              <div key={feedback.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-2">
                  <div className="flex items-center gap-2 mb-2 sm:mb-0">
                    {renderStars(feedback.rating)}
                    {feedback.rating && <span className="text-sm font-medium text-gray-700 dark:text-gray-300">({feedback.rating}/5)</span>}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                     <span className="flex items-center gap-1"><User size={12}/> {feedback.client?.name || feedback.client?.firstName || 'Klient'}</span>
                     <span className="flex items-center gap-1"><Calendar size={12}/> {formatDate(feedback.createdAt)}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 italic">
                  <MessageSquare size={14} className="inline mr-1 mb-0.5" />
                  {feedback.comment || 'Brak komentarza.'}
                </p>
                 {/* Optional: Link to the related order */}
                 {feedback.orderId && (
                   <div className="mt-2 text-right">
                     <a href={`/dashboard/provider/orders/${feedback.orderId}`} className="text-xs text-sky-600 hover:underline">
                       Zobacz zlecenie #{feedback.orderId.substring(0, 8)}
                     </a>
                   </div>
                 )}
              </div>
            ))
          )}
          {/* Add Pagination controls here if needed */}
        </div>
      )}
    </div>
  );
}

export default FeedbackList;
