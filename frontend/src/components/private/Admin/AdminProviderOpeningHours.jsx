import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../api'; // Use the configured api instance
import { toast } from 'react-hot-toast';
import { Clock, Save } from 'lucide-react';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const dayTranslations = {
  Monday: 'Poniedziałek', Tuesday: 'Wtorek', Wednesday: 'Środa', Thursday: 'Czwartek',
  Friday: 'Piątek', Saturday: 'Sobota', Sunday: 'Niedziela'
};

function AdminProviderOpeningHours() {
  const { providerId } = useParams(); // Get provider ID from URL
  const [openingHours, setOpeningHours] = useState({});
  const [providerName, setProviderName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchOpeningHours = async () => {
      setLoading(true);
      setError('');
      try {
        // Assume endpoint GET /api/admin/providers/:providerId/opening-hours
        // It should probably fetch provider info too
        const response = await api.get(`/admin/providers/${providerId}/opening-hours`);
        if (response.data.status === 'success') {
          // Initialize hours state correctly
          const initialHours = {};
          daysOfWeek.forEach(day => {
            const dayData = response.data.data.hours?.find(h => h.dayOfWeek === day);
            initialHours[day] = {
              isOpen: dayData?.isOpen ?? false,
              openTime: dayData?.openTime || '09:00',
              closeTime: dayData?.closeTime || '17:00',
            };
          });
          setOpeningHours(initialHours);
          setProviderName(response.data.data.providerName || `Usługodawca #${providerId.substring(0,8)}`); // Get provider name if available
        } else {
          throw new Error(response.data.message || 'Nie udało się pobrać godzin otwarcia');
        }
      } catch (err) {
        console.error("Błąd pobierania godzin otwarcia:", err);
        setError(err.response?.data?.message || err.message || 'Nie udało się pobrać godzin otwarcia');
        toast.error('Nie udało się załadować godzin otwarcia.');
      } finally {
        setLoading(false);
      }
    };

    if (providerId) {
      fetchOpeningHours();
    } else {
      setError('Brak ID usługodawcy.');
      setLoading(false);
    }
  }, [providerId]);

  const handleInputChange = (day, field, value) => {
    setOpeningHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  const handleCheckboxChange = (day, checked) => {
    setOpeningHours(prev => ({
      ...prev,
      [day]: { ...prev[day], isOpen: checked }
    }));
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    const saveToast = toast.loading('Zapisywanie godzin otwarcia...');

    // Format data for the API
    const payload = Object.entries(openingHours).map(([day, times]) => ({
      dayOfWeek: day,
      isOpen: times.isOpen,
      openTime: times.isOpen ? times.openTime : null,
      closeTime: times.isOpen ? times.closeTime : null,
    }));

    try {
      // Assume endpoint PUT /api/admin/providers/:providerId/opening-hours
      const response = await api.put(`/admin/providers/${providerId}/opening-hours`, { hours: payload });
      if (response.data.status === 'success') {
        toast.success('Godziny otwarcia zapisane pomyślnie!', { id: saveToast });
      } else {
        throw new Error(response.data.message || 'Nie udało się zapisać godzin otwarcia');
      }
    } catch (err) {
      console.error("Błąd zapisywania godzin otwarcia:", err);
      toast.error(err.response?.data?.message || 'Nie udało się zapisać godzin otwarcia.', { id: saveToast });
      setError(err.response?.data?.message || 'Nie udało się zapisać godzin otwarcia.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-center">Ładowanie godzin otwarcia...</div>;
  if (error) return <div className="p-6 text-center text-red-500">Błąd: {error}</div>;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">Godziny Otwarcia</h2>
      <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">{providerName}</p>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-4">
        {daysOfWeek.map(day => (
          <div key={day} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center border-b dark:border-gray-700 pb-4 last:border-b-0 last:pb-0">
            <div className="sm:col-span-1 flex items-center">
              <input
                type="checkbox"
                id={`isOpen-${day}`}
                checked={openingHours[day]?.isOpen || false}
                onChange={(e) => handleCheckboxChange(day, e.target.checked)}
                className="h-4 w-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500 mr-3"
              />
              <label htmlFor={`isOpen-${day}`} className="font-medium text-gray-700 dark:text-gray-200">{dayTranslations[day]}</label>
            </div>
            <div className="sm:col-span-3 flex items-center gap-4">
              <div className="flex-1">
                <label htmlFor={`openTime-${day}`} className="sr-only">Godzina otwarcia</label>
                <input
                  type="time"
                  id={`openTime-${day}`}
                  value={openingHours[day]?.openTime || '09:00'}
                  onChange={(e) => handleInputChange(day, 'openTime', e.target.value)}
                  disabled={!openingHours[day]?.isOpen}
                  className={`w-full border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white ${!openingHours[day]?.isOpen ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
              </div>
              <span className={`text-gray-500 dark:text-gray-400 ${!openingHours[day]?.isOpen ? 'opacity-50' : ''}`}>-</span>
              <div className="flex-1">
                <label htmlFor={`closeTime-${day}`} className="sr-only">Godzina zamknięcia</label>
                <input
                  type="time"
                  id={`closeTime-${day}`}
                  value={openingHours[day]?.closeTime || '17:00'}
                  onChange={(e) => handleInputChange(day, 'closeTime', e.target.value)}
                  disabled={!openingHours[day]?.isOpen}
                  className={`w-full border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white ${!openingHours[day]?.isOpen ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSaveChanges}
          disabled={isSaving}
          className="flex items-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-md hover:bg-sky-700 transition duration-150 disabled:opacity-50"
        >
          <Save size={18} />
          {isSaving ? 'Zapisywanie...' : 'Zapisz Zmiany'}
        </button>
      </div>
    </div>
  );
}

export default AdminProviderOpeningHours;
