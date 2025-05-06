import React, { useState, useEffect } from 'react';
import axios from 'axios';

function FeedbackManagement() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

useEffect(() => {
    const fetchFeedbacks = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://49.13.68.62:5000/api/admin/feedback', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFeedbacks(response.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Nie udało się pobrać opinii');
      } finally {
        setLoading(false);
      }
    };
    fetchFeedbacks();
  }, []);

  const deleteFeedback = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://49.13.68.62:5000/api/admin/feedback/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFeedbacks(feedbacks.filter((feedback) => feedback.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Nie udało się usunąć opinii');
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Zarządzanie Opiniami</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {loading ? (
        <p>Ładowanie...</p>
      ) : (
        <div className="bg-white p-4 rounded-lg shadow">
          {feedbacks.length === 0 ? (
            <p>Brak opinii</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-2">Klient</th>
                  <th className="text-left p-2">Usługodawca</th>
                  <th className="text-left p-2">Ocena</th>
                  <th className="text-left p-2">Komentarz</th>
                  <th className="text-left p-2">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {feedbacks.map((feedback) => (
                  <tr key={feedback.id} className="border-t">
                    <td className="p-2">{feedback.Client.name}</td>
                    <td className="p-2">{feedback.Provider.name}</td>
                    <td className="p-2">{feedback.rating}</td>
                    <td className="p-2">{feedback.comment}</td>
                    <td className="p-2">
                      <button
                        onClick={() => setDeleteConfirm(feedback.id)}
                        className="bg-red-500 text-white px-2 py-1 rounded"
                      >
                        Usuń
                      </button>
                      {deleteConfirm === feedback.id && (
                        <div className="mt-2">
                          <p>Czy na pewno chcesz usunąć opinię?</p>
                          <button
                            onClick={() => deleteFeedback(feedback.id)}
                            className="bg-red-500 text-white px-2 py-1 rounded mr-2"
                          >
                            Tak
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="bg-gray-500 text-white px-2 py-1 rounded"
                          >
                            Nie
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default FeedbackManagement;
