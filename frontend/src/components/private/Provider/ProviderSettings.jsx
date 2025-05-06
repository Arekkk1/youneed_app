import React, { useState, useEffect } from 'react';
import api from '../../../api'; // Use the configured api instance
import { toast } from 'react-hot-toast';
import ProviderProfile from './ProviderProfile'; // Assuming this exists and handles profile details
import ProviderOpeningHours from './ProviderOpeningHours'; // Assuming this exists
import { BellRing, Briefcase, CreditCard, Users, Settings2, Loader2 } from 'lucide-react'; // Icons

// Placeholder components for sections not yet implemented
const PlaceholderSection = ({ title, description }) => (
  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-md border border-gray-200 dark:border-gray-700">
    <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-1">{title}</h4>
    <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    <button className="mt-2 text-sm text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300">
      Zarządzaj (do implementacji)
    </button>
  </div>
);

function ProviderSettings({ user, onUpdate }) { // Receive onUpdate prop
  // Initialize state with values from user prop if available, otherwise use defaults
  const [preferences, setPreferences] = useState({
    prefEmailNewOrder: user?.prefEmailNewOrder ?? true,
    prefEmailOrderUpdatesProvider: user?.prefEmailOrderUpdatesProvider ?? true,
    prefSmsAlerts: user?.prefSmsAlerts ?? false,
    // Add other provider-specific preferences here
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true); // Still useful if fetching additional data

  // Fetch current preferences on mount (optional, see ClientSettings comment)
  useEffect(() => {
    const fetchPreferences = async () => {
      setIsFetching(true);
      setIsLoading(true);
      try {
        const response = await api.get('/profile/preferences');
         if (response.data.status === 'success' && response.data.data) {
           setPreferences(prev => ({
                ...prev,
                prefEmailNewOrder: response.data.data.prefEmailNewOrder ?? prev.prefEmailNewOrder,
                prefEmailOrderUpdatesProvider: response.data.data.prefEmailOrderUpdatesProvider ?? prev.prefEmailOrderUpdatesProvider,
                prefSmsAlerts: response.data.data.prefSmsAlerts ?? prev.prefSmsAlerts,
            }));
            // onUpdate(response.data.data); // Update parent if needed
        } else {
             toast.error("Nie udało się załadować preferencji usługodawcy (odpowiedź serwera).");
        }
      } catch (err) {
        console.error("Error fetching provider preferences:", err);
        toast.error(err.response?.data?.message || "Nie udało się załadować preferencji usługodawcy.");
      } finally {
        setIsFetching(false);
        setIsLoading(false);
      }
    };
     // Only fetch if user data might be stale or incomplete
    if (!user?.prefEmailNewOrder || !user?.prefEmailOrderUpdatesProvider || user?.prefSmsAlerts === undefined) {
        fetchPreferences();
    } else {
        setIsFetching(false); // Assume user prop is sufficient
    }
  }, [user]); // Re-run if user prop changes significantly

  const handlePreferenceChange = (e) => {
    setPreferences({ ...preferences, [e.target.name]: e.target.checked });
  };

  const handleSavePreferences = async () => {
    setIsLoading(true);
    try {
       // Send only provider-specific preferences
       const payload = {
           prefEmailNewOrder: preferences.prefEmailNewOrder,
           prefEmailOrderUpdatesProvider: preferences.prefEmailOrderUpdatesProvider,
           prefSmsAlerts: preferences.prefSmsAlerts,
       };
      const response = await api.put('/profile/preferences', payload);
       if (response.data.status === 'success') {
           toast.success('Preferencje usługodawcy zapisane!');
           // Update parent state with the potentially updated preferences from backend
           if (response.data.data) {
               onUpdate(response.data.data);
           }
       } else {
           toast.error(response.data.message || "Nie udało się zapisać preferencji usługodawcy.");
       }
    } catch (err) {
      console.error("Error saving provider preferences:", err);
      toast.error(err.response?.data?.message || "Nie udało się zapisać preferencji usługodawcy.");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="space-y-8 p-3">
      {/* --- Provider Profile Section --- */}
      {/* Assuming ProviderProfile handles company details, logo, description etc. */}
      {/* It might need the onUpdate prop from Settings if it modifies profile data */}
      <section>
         <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4 flex items-center">
            <Briefcase className="mr-2 h-5 w-5 text-sky-600 dark:text-sky-400" />
            Profil Usługodawcy
         </h3>
         {/* Pass user data. If ProviderProfile updates data, it should call its own API or receive an onUpdate prop */}
         <ProviderProfile user={user} />
      </section>

      {/* --- Opening Hours Section --- */}
      {/* Assuming ProviderOpeningHours handles its own API calls or receives an onUpdate prop */}
      <section>
         <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4 flex items-center">
            <Settings2 className="mr-2 h-5 w-5 text-teal-600 dark:text-teal-400" />
            Godziny Otwarcia
         </h3>
         <ProviderOpeningHours />
      </section>

      {/* --- Notification Preferences --- */}
      <section>
        <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4 flex items-center">
          <BellRing className="mr-2 h-5 w-5 text-sky-600 dark:text-sky-400" />
          Preferencje Powiadomień Usługodawcy
        </h3>
         {isFetching ? (
             <div className="flex justify-center items-center h-20"><Loader2 className="h-6 w-6 animate-spin text-sky-600" /></div>
         ) : (
            <div className="space-y-4 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-md border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Zarządzaj powiadomieniami dotyczącymi nowych zleceń i aktualizacji.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-gray-800 dark:text-gray-200 text-sm">
                  Otrzymuj email o nowych zleceniach
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="prefEmailNewOrder" // Use DB column name
                    checked={preferences.prefEmailNewOrder}
                    onChange={handlePreferenceChange}
                    className="sr-only peer"
                    disabled={isLoading}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-300 dark:peer-focus:ring-sky-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-sky-600"></div>
                </label>
              </div>
               <div className="flex items-center justify-between">
                <span className="text-gray-800 dark:text-gray-200 text-sm">
                  Otrzymuj email o aktualizacjach statusu zleceń
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="prefEmailOrderUpdatesProvider" // Use DB column name
                    checked={preferences.prefEmailOrderUpdatesProvider}
                    onChange={handlePreferenceChange}
                    className="sr-only peer"
                    disabled={isLoading}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-300 dark:peer-focus:ring-sky-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-sky-600"></div>
                </label>
              </div>
               <div className="flex items-center justify-between">
                <span className="text-gray-800 dark:text-gray-200 text-sm">
                  Otrzymuj alerty SMS (wymaga konfiguracji)
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="prefSmsAlerts" // Use DB column name
                    checked={preferences.prefSmsAlerts}
                    onChange={handlePreferenceChange}
                    className="sr-only peer"
                    disabled={isLoading} // Add disabled state
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-300 dark:peer-focus:ring-sky-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-sky-600"></div>
                </label>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  onClick={handleSavePreferences}
                  disabled={isLoading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50"
                >
                  {isLoading ? (
                     <> <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Zapisywanie... </>
                  ) : (
                     'Zapisz preferencje powiadomień'
                  )}
                </button>
              </div>
            </div>
         )}
      </section>

      {/* --- Other Provider Sections (Placeholders) --- */}
       <section>
         <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4 flex items-center">
            <Settings2 className="mr-2 h-5 w-5 text-purple-600 dark:text-purple-400" />
            Zarządzanie Usługami
         </h3>
         <PlaceholderSection title="Usługi" description="Dodaj, edytuj lub usuń oferowane usługi." />
      </section>

       <section>
         <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4 flex items-center">
            <CreditCard className="mr-2 h-5 w-5 text-red-600 dark:text-red-400" />
            Ustawienia Płatności i Wypłat
         </h3>
         <PlaceholderSection title="Płatności" description="Skonfiguruj metody otrzymywania płatności za zlecenia." />
      </section>

       <section>
         <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4 flex items-center">
            <Users className="mr-2 h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Zarządzanie Zespołem
         </h3>
         <PlaceholderSection title="Zespół" description="Dodaj członków zespołu i zarządzaj ich uprawnieniami (jeśli dotyczy)." />
      </section>

      {/* General Account Actions (like password change) are handled in the main Settings.jsx */}
    </div>
  );
}

export default ProviderSettings;
