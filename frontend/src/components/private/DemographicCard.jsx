import React, { useEffect, useState } from 'react';
import api from '../../api'; // Use the configured api instance

export default function DemographicCard({ role }) {
  const [demographics, setDemographics] = useState({ male: 0, female: 0, other: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDemographics = async () => {
      setLoading(true);
      setError(null);
      try {
        // Assume an endpoint like /api/analytics/demographics?role=...
        // Adjust endpoint URL and response structure as needed
        const response = await api.get(`/analytics/demographics?role=${role}`);
        if (response.data.status === 'success') {
          // Assuming response.data.data = { male: count, female: count, other: count }
          setDemographics(response.data.data);
        } else {
          throw new Error(response.data.message || 'Nie udało się pobrać danych demograficznych');
        }
      } catch (err) {
        console.error("Błąd pobierania danych demograficznych:", err);
        setError(err.response?.data?.message || err.message || 'Nie udało się pobrać danych demograficznych');
      } finally {
        setLoading(false);
      }
    };
    fetchDemographics();
  }, [role]);

  const total = demographics.male + demographics.female + demographics.other;
  const malePercentage = total > 0 ? ((demographics.male / total) * 100).toFixed(1) : 0;
  const femalePercentage = total > 0 ? ((demographics.female / total) * 100).toFixed(1) : 0;
  const otherPercentage = total > 0 ? ((demographics.other / total) * 100).toFixed(1) : 0;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
        Demografia {role === 'admin' ? 'Użytkowników' : role === 'client' ? 'Usługodawców' : 'Klientów'}
      </h3>
      <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
        Podział według płci
      </p>
      {error && <div className="mt-4 text-red-500">{error}</div>}
      {loading && <div className="mt-4 text-gray-500">Ładowanie...</div>}
      {!loading && !error && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-300">Mężczyźni</span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90">{malePercentage}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
            <div className="h-2 rounded-full bg-blue-500" style={{ width: `${malePercentage}%` }}></div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-300">Kobiety</span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90">{femalePercentage}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
            <div className="h-2 rounded-full bg-pink-500" style={{ width: `${femalePercentage}%` }}></div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-300">Inne</span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90">{otherPercentage}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
            <div className="h-2 rounded-full bg-gray-500" style={{ width: `${otherPercentage}%` }}></div>
          </div>
        </div>
      )}
    </div>
  );
}
