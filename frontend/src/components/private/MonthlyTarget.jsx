import React, { useState, useEffect } from 'react';
import api from '../../api';
import { AlertCircle, Loader2, Target } from 'lucide-react'; // Added Target icon

function MonthlyTarget({ role, initialData }) { // Role might be used for display logic if needed
  const [targetData, setTargetData] = useState({ current: 0, target: 0, percentage: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTargetData = async () => {
      setLoading(true);
      setError('');
      try {
        // ** FIX: Remove role query parameter **
        const response = await api.get('/analytics/monthly-target');
        if (response.data.status === 'success') {
          setTargetData(response.data.data);
        } else {
          throw new Error(response.data.message || 'Nie udało się pobrać danych celu');
        }
      } catch (err) {
        console.error("Błąd pobierania danych celu:", err);
        setError(err.response?.data?.message || err.message || 'Wystąpił błąd podczas ładowania danych celu.');
      } finally {
        setLoading(false);
      }
    };

    // Use initialData if provided and seems valid, otherwise fetch
    if (initialData && typeof initialData.target === 'number') {
        setTargetData(initialData);
        setLoading(false);
    } else {
        fetchTargetData();
    }
  }, [initialData]); // Re-run if initialData changes

  const { current, target, percentage, label } = targetData;

  const renderContent = () => (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {label || (role === 'provider' ? 'Cel Miesięczny' : 'Cel Miesięczny (Info)')} {/* Dynamic Title */}
        </h3>
        <Target className="text-indigo-500" size={24} />
      </div>

      <div className="relative pt-1 mb-4">
        <div className="flex mb-2 items-center justify-between">
          <div>
            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200 dark:text-indigo-100 dark:bg-indigo-500">
              Postęp
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold inline-block text-indigo-600 dark:text-indigo-300">
              {percentage}%
            </span>
          </div>
        </div>
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-200 dark:bg-gray-700">
          <div
            style={{ width: `${percentage}%` }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500 transition-all duration-500 ease-out"
          ></div>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Aktualnie</p>
        <p className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
          {current.toFixed(2)} zł
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Cel</p>
        <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
          {target.toFixed(2)} zł
        </p>
      </div>
       {role !== 'provider' && (
           <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-4">
               (Ta sekcja jest przykładowa dla klientów/adminów)
           </p>
       )}
    </>
  );

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 md:p-6 h-full flex flex-col justify-center">
      {loading ? (
        <div className="flex justify-center items-center h-full">
          <Loader2 className="animate-spin text-indigo-500" size={32} />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded flex items-center gap-2 h-full justify-center">
          <AlertCircle size={20} /> {error}
        </div>
      ) : (
        renderContent()
      )}
    </div>
  );
}

export default MonthlyTarget;
