import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../api';
import { toast } from 'react-hot-toast';
import { Clock, Save, Loader2, AlertCircle } from 'lucide-react';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const dayTranslations = {
    Monday: 'Poniedziałek',
    Tuesday: 'Wtorek',
    Wednesday: 'Środa',
    Thursday: 'Czwartek',
    Friday: 'Piątek',
    Saturday: 'Sobota',
    Sunday: 'Niedziela',
};

// Map day names to indices (0-6)
const dayToIndex = {
    Monday: 0,
    Tuesday: 1,
    Wednesday: 2,
    Thursday: 3,
    Friday: 4,
    Saturday: 5,
    Sunday: 6,
};

// Helper to format time for display (HH:MM)
const formatDisplayTime = (timeString) => {
    if (!timeString || typeof timeString !== 'string') return '';
    return timeString.substring(0, 5); // Extract HH:MM
};

// Helper to format time for API (HH:MM or null)
const formatApiTime = (timeString) => {
    if (!timeString || typeof timeString !== 'string' || timeString.length !== 5) return null;
    return timeString; // Already in HH:MM format
};

function ProviderOpeningHours() {
    const [openingHours, setOpeningHours] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState(null);

    const fetchOpeningHours = useCallback(async () => {
        setIsFetching(true);
        setIsLoading(true);
        setError(null);
        console.log("Fetching opening hours...");
        try {
            const response = await api.get('/provider/opening-hours');
            console.log("API response for GET /provider/opening-hours:", response);

            if (response.data && response.data.status === 'success' && Array.isArray(response.data.data)) {
                const fetchedHours = response.data.data;
                const initialHours = daysOfWeek.map(day => {
                    const existing = fetchedHours.find(h => h.dayOfWeek === dayToIndex[day]);
                    return existing ? {
                        dayOfWeek: day,
                        isOpen: !existing.isClosed,
                        openTime: formatDisplayTime(existing.startTime),
                        closeTime: formatDisplayTime(existing.endTime)
                    } : {
                        dayOfWeek: day,
                        isOpen: false,
                        openTime: '',
                        closeTime: '',
                    };
                });
                initialHours.sort((a, b) => daysOfWeek.indexOf(a.dayOfWeek) - daysOfWeek.indexOf(b.dayOfWeek));
                setOpeningHours(initialHours);
            } else {
                console.error("Invalid response structure:", response.data);
                setError("Nie udało się załadować godzin otwarcia (nieprawidłowa odpowiedź).");
                toast.error("Nie udało się załadować godzin otwarcia (nieprawidłowa odpowiedź).");
                setOpeningHours(daysOfWeek.map(day => ({ dayOfWeek: day, isOpen: false, openTime: '', closeTime: '' })));
            }
        } catch (err) {
            console.error("Błąd pobierania godzin otwarcia:", err);
            const errorMsg = err.response?.data?.message || err.message || "Nieznany błąd serwera";
            setError(`Błąd pobierania godzin otwarcia: ${errorMsg}`);
            toast.error(`Błąd pobierania godzin otwarcia: ${errorMsg}`);
            setOpeningHours(daysOfWeek.map(day => ({ dayOfWeek: day, isOpen: false, openTime: '', closeTime: '' })));
        } finally {
            setIsFetching(false);
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOpeningHours();
    }, [fetchOpeningHours]);

    const handleToggle = (index) => {
        const newHours = [...openingHours];
        newHours[index].isOpen = !newHours[index].isOpen;
        if (!newHours[index].isOpen) {
            newHours[index].openTime = '';
            newHours[index].closeTime = '';
        }
        setOpeningHours(newHours);
    };

    const handleTimeChange = (index, field, value) => {
        if (value && !/^(?:[01]\d|2[0-3]):(?:[0-5]\d)$/.test(value)) {
            // Allow intermediate typing
        }
        const newHours = [...openingHours];
        newHours[index][field] = value;
        setOpeningHours(newHours);
    };

    const validateHours = () => {
        for (const hour of openingHours) {
            if (hour.isOpen) {
                if (!hour.openTime || !hour.closeTime) {
                    toast.error(`Proszę podać godziny otwarcia i zamknięcia dla ${dayTranslations[hour.dayOfWeek]}.`);
                    return false;
                }
                if (!/^(?:[01]\d|2[0-3]):(?:[0-5]\d)$/.test(hour.openTime) || !/^(?:[01]\d|2[0-3]):(?:[0-5]\d)$/.test(hour.closeTime)) {
                    toast.error(`Nieprawidłowy format czasu dla ${dayTranslations[hour.dayOfWeek]}. Użyj formatu HH:MM.`);
                    return false;
                }
                if (hour.openTime >= hour.closeTime) {
                    toast.error(`Godzina zamknięcia musi być późniejsza niż godzina otwarcia dla ${dayTranslations[hour.dayOfWeek]}.`);
                    return false;
                }
            }
        }
        return true;
    };

    const handleSaveChanges = async () => {
        if (!validateHours()) {
            return;
        }

        setIsLoading(true);
        setError(null);
        console.log("Saving opening hours:", openingHours);

        const payload = openingHours.map(hour => ({
            dayOfWeek: dayToIndex[hour.dayOfWeek], // Convert to integer
            isClosed: !hour.isOpen, // Invert for backend
            startTime: hour.isOpen ? formatApiTime(hour.openTime) : null,
            endTime: hour.isOpen ? formatApiTime(hour.closeTime) : null,
        }));

        console.log("Payload for PUT /provider/opening-hours:", payload);

        try {
            const response = await api.put('/provider/opening-hours', payload);
            console.log("API response for PUT /provider/opening-hours:", response);

            if (response.data && response.data.status === 'success') {
                toast.success('Godziny otwarcia zapisane pomyślnie!');
                if (Array.isArray(response.data.data)) {
                    const updatedHours = response.data.data.map(h => ({
                        dayOfWeek: daysOfWeek[h.dayOfWeek],
                        isOpen: !h.isClosed,
                        openTime: formatDisplayTime(h.startTime),
                        closeTime: formatDisplayTime(h.endTime)
                    })).sort((a, b) => daysOfWeek.indexOf(a.dayOfWeek) - daysOfWeek.indexOf(b.dayOfWeek));
                    setOpeningHours(updatedHours);
                }
            } else {
                setError(response.data?.message || "Nie udało się zapisać godzin otwarcia (nieprawidłowa odpowiedź).");
                toast.error(response.data?.message || "Nie udało się zapisać godzin otwarcia (nieprawidłowa odpowiedź).");
            }
        } catch (err) {
            console.error("Błąd zapisywania godzin otwarcia:", err);
            const errorMsg = err.response?.data?.message || err.message || "Nieznany błąd serwera";
            setError(`Błąd zapisywania godzin otwarcia: ${errorMsg}`);
            toast.error(`Błąd zapisywania godzin otwarcia: ${errorMsg}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4 flex items-center">
                <Clock className="mr-2 h-5 w-5 text-teal-600 dark:text-teal-400" />
                Godziny Otwarcia
            </h3>

            {isFetching && (
                <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
                </div>
            )}

            {!isFetching && error && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-600/50 rounded-md text-red-700 dark:text-red-300 flex items-center">
                    <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {!isFetching && !error && (
                <div className="space-y-4">
                    {openingHours.map((hour, index) => (
                        <div key={hour.dayOfWeek} className="flex flex-col sm:flex-row items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                            <div className="flex items-center mb-2 sm:mb-0 w-full sm:w-auto">
                                <label className="relative inline-flex items-center cursor-pointer mr-4">
                                    <input
                                        type="checkbox"
                                        checked={hour.isOpen}
                                        onChange={() => handleToggle(index)}
                                        className="sr-only peer"
                                        disabled={isLoading}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-300 dark:peer-focus:ring-sky-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-sky-600"></div>
                                </label>
                                <span className="font-medium text-gray-800 dark:text-gray-200 w-24">{dayTranslations[hour.dayOfWeek]}</span>
                            </div>
                            <div className={`flex items-center space-x-2 transition-opacity duration-300 ${hour.isOpen ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                                <input
                                    type="time"
                                    value={hour.openTime}
                                    onChange={(e) => handleTimeChange(index, 'openTime', e.target.value)}
                                    className="block w-28 px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 text-gray-900 dark:text-gray-100 disabled:opacity-70"
                                    disabled={!hour.isOpen || isLoading}
                                    required={hour.isOpen}
                                />
                                <span className="text-gray-500 dark:text-gray-400">-</span>
                                <input
                                    type="time"
                                    value={hour.closeTime}
                                    onChange={(e) => handleTimeChange(index, 'closeTime', e.target.value)}
                                    className="block w-28 px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 text-gray-900 dark:text-gray-100 disabled:opacity-70"
                                    disabled={!hour.isOpen || isLoading}
                                    required={hour.isOpen}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!isFetching && (
                <div className="mt-6 flex justify-end">
                    <button
                        onClick={handleSaveChanges}
                        disabled={isLoading || !!error}
                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" aria-hidden="true" />
                                Zapisywanie...
                            </>
                        ) : (
                            <>
                                <Save className="-ml-1 mr-2 h-4 w-4" aria-hidden="true" />
                                Zapisz godziny otwarcia
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}

export default ProviderOpeningHours;