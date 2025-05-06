import React, { useState, useEffect } from 'react';
import api from '../../../api'; // Use the configured api instance
import { toast } from 'react-hot-toast';
import { BellRing, Star, Shield, Loader2 } from 'lucide-react'; // Icons for sections

const ClientSettings = ({ user, onUpdate }) => { // Receive onUpdate prop
  // Initialize state with values from user prop if available, otherwise use defaults
  const [preferences, setPreferences] = useState({
    prefEmailOrderUpdatesClient: user?.prefEmailOrderUpdatesClient ?? true,
    prefEmailPromotions: user?.prefEmailPromotions ?? false,
    // Add other client-specific preferences here
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true); // Still useful if fetching additional data

  // Fetch current preferences on mount (optional if user prop is always up-to-date)
  // If the main Settings component already fetches everything, this might be redundant
  // But it's safer to fetch specifically needed data here if Settings doesn't guarantee it
  useEffect(() => {
    const fetchPreferences = async () => {
      setIsFetching(true);
      setIsLoading(true);
      try {
        const response = await api.get('/profile/preferences');
        if (response.data.status === 'success' && response.data.data) {
           setPreferences(prev => ({
                ...prev,
                prefEmailOrderUpdatesClient: response.data.data.prefEmailOrderUpdatesClient ?? prev.prefEmailOrderUpdatesClient,
                prefEmailPromotions: response.data.data.prefEmailPromotions ?? prev.prefEmailPromotions,
            }));
            // Update parent state as well if needed, though maybe redundant if parent fetched too
            // onUpdate(response.data.data);
        } else {
            toast.error("Nie udało się załadować preferencji klienta (odpowiedź serwera).");
        }
      } catch (err) {
        console.error("Error fetching client preferences:", err);
        toast.error(err.response?.data?.message || "Nie udało się załadować preferencji klienta.");
      } finally {
        setIsFetching(false);
        setIsLoading(false);
      }
    };
    // Only fetch if user data might be stale or incomplete
    if (!user?.prefEmailOrderUpdatesClient || !user?.prefEmailPromotions) {
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
      // Send only client-specific preferences
      const payload = {
          prefEmailOrderUpdatesClient: preferences.prefEmailOrderUpdatesClient,
          prefEmailPromotions: preferences.prefEmailPromotions,
      };
      const response = await api.put('/profile/preferences', payload);
      if (response.data.status === 'success') {
          toast.success('Preferencje zapisane!');
          // Update parent state with the potentially updated preferences from backend
          if (response.data.data) {
              onUpdate(response.data.data);
          }
      } else {
          toast.error(response.data.message || "Nie udało się zapisać preferencji.");
      }
    } catch (err) {
      console.error("Error saving client preferences:", err);
      toast.error(err.response?.data?.message || "Nie udało się zapisać preferencji.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return <div className="flex justify-center items-center h-20"><Loader2 className="h-6 w-6 animate-spin text-sky-600" /></div>;
  }

  return (
    <div className="space-y-8">
      {/* --- Notification Preferences --- */}
      <section>
        <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4 flex items-center">
          <BellRing className="mr-2 h-5 w-5 text-sky-600 dark:text-sky-400" />
          Preferencje Powiadomień
        </h3>
        <div className="space-y-4 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-md border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Zarządzaj powiadomieniami email dotyczącymi Twoich zleceń i ofert.
          </p>
          <div className="flex items-center justify-between">
            <span className="text-gray-800 dark:text-gray-200 text-sm">
              Otrzymuj email o aktualizacjach statusu zlecenia
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="prefEmailOrderUpdatesClient" // Use DB column name
                checked={preferences.prefEmailOrderUpdatesClient}
                onChange={handlePreferenceChange}
                className="sr-only peer"
                disabled={isLoading}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-300 dark:peer-focus:ring-sky-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-sky-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-800 dark:text-gray-200 text-sm">
              Otrzymuj email o promocjach i nowościach
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="prefEmailPromotions" // Use DB column name
                checked={preferences.prefEmailPromotions}
                onChange={handlePreferenceChange}
                className="sr-only peer"
                disabled={isLoading}
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
                 'Zapisz preferencje'
              )}
            </button>
          </div>
        </div>
      </section>

      {/* --- Favorite Providers (Placeholder) --- */}
      <section>
        <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4 flex items-center">
          <Star className="mr-2 h-5 w-5 text-amber-500" />
          Ulubieni Usługodawcy
        </h3>
        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-md border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Zarządzaj listą swoich ulubionych usługodawców (do implementacji).
          </p>
          <button className="mt-2 text-sm text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300">
            Przejdź do ulubionych (do implementacji)
          </button>
        </div>
      </section>

      {/* --- Privacy Settings Link (Placeholder) --- */}
      <section>
        <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4 flex items-center">
          <Shield className="mr-2 h-5 w-5 text-green-600 dark:text-green-400" />
          Ustawienia Prywatności
        </h3>
        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-md border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Szczegółowe ustawienia prywatności znajdziesz w dedykowanej sekcji.
          </p>
           <button
             onClick={() => {/* TODO: Navigate or switch tab to 'privacy' */}}
             className="mt-2 text-sm text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300"
           >
            Przejdź do ustawień prywatności
          </button>
        </div>
      </section>

      {/* Add other client-specific sections like Saved Payment Methods if needed */}
    </div>
  );
};

export default ClientSettings;
