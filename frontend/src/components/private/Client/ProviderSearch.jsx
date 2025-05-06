import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../../api';
import { toast } from 'react-hot-toast';
import { Search, MapPin, Star, ChevronRight, Loader, AlertCircle, Briefcase, Tag } from 'lucide-react';

// Industries list
const industries = [
    'Budownictwo', 'Elektryka', 'Hydraulika', 'Stolarstwo', 'Malarstwo',
    'Ogrodnictwo', 'Sprzątanie', 'Transport', 'Fryzjerstwo', 'Kosmetyka',
    'Fotografia', 'Catering', 'IT', 'Marketing', 'Księgowość', 'Tłumaczenia'
];

function ProviderSearch() {
    const [searchQuery, setSearchQuery] = useState({ service: '', industry: '', location: '' });
    const [searchResults, setSearchResults] = useState([]);
    const [selectedIndustry, setSelectedIndustry] = useState(null); // For button selection visual state
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const location = useLocation();
    const intent = location.state?.intent; // Get intent from navigation state

    // Function to perform the search API call using the /search endpoint
    const performSearch = useCallback(async (params) => {
        setIsLoading(true);
        setError('');
        setSearchResults([]);
        try {
            console.log('[ProviderSearch] Performing search with params:', params);
            // *** CONFIRMED: Using the /search endpoint ***
            const res = await api.get('/search', { params });
            console.log('[ProviderSearch] Search response:', res.data);

            // Assuming backend returns { status: 'success', data: [...] }
            if (res.data?.status === 'success' && Array.isArray(res.data.data)) {
                setSearchResults(res.data.data);
                if (res.data.data.length === 0) {
                    toast('Nie znaleziono wyników dla podanych kryteriów.', { icon: 'ℹ️' });
                }
            } else {
                 const message = res.data?.message || 'Otrzymano nieprawidłową odpowiedź z serwera.';
                 throw new Error(message);
            }
        } catch (err) {
            console.error('Search error:', err);
            const errorMsg = err.response?.data?.message || err.message || 'Wystąpił błąd podczas wyszukiwania.';
            setError(errorMsg);
            toast.error(`Błąd wyszukiwania: ${errorMsg}`);
            setSearchResults([]);
        } finally {
            setIsLoading(false);
        }
    }, []); // No dependencies needed as it uses state setters and constants

    // Handle text input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSearchQuery(prev => ({ ...prev, [name]: value }));
        // Clear industry button selection if user types in industry field
        if (name === 'industry') {
            setSelectedIndustry(null);
        }
    };

    // Handle form submission (manual search)
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (!searchQuery.service && !searchQuery.industry && !searchQuery.location && !selectedIndustry) {
            toast.error('Wprowadź kryteria wyszukiwania lub wybierz branżę.');
            return;
        }
        // Use selectedIndustry if available and industry field is empty
        const industryToSearch = searchQuery.industry || selectedIndustry;

        const params = {};
        if (searchQuery.service) params.q = searchQuery.service;
        if (industryToSearch) params.industry = industryToSearch;
        // Location search not implemented in backend yet
        // if (searchQuery.location) params.location = searchQuery.location;

        // Clear button selection only if manual search is initiated
        // If triggered by button click, selection remains until another action
        if (e.type === 'submit') {
             setSelectedIndustry(null);
        }

        performSearch(params);
    };

    // Handle clicking an industry button
    const handleIndustryButtonClick = (industry) => {
        setSelectedIndustry(industry); // Set visual selection
        setSearchQuery({ service: '', industry: industry, location: '' }); // Clear other fields, set industry
        performSearch({ industry: industry }); // Perform search immediately
    };

    // Navigate to the provider's event list page when a result is clicked
    const handleResultClick = (result) => {
        let providerId = null;
        let preselectedServiceId = null;

        if (result.type === 'Dostawca' && result.id) {
            providerId = result.id;
        } else if (result.type === 'Usługa' && result.providerId) {
            providerId = result.providerId;
            preselectedServiceId = result.id; // Pass service ID if a service was clicked
        }

        if (providerId) {
            // Navigate to the provider's event list (calendar)
            // Pass the intent and potentially preselectedServiceId state forward
            const navigationState = { intent };
            if (preselectedServiceId) {
                navigationState.preselectedServiceId = preselectedServiceId;
            }
            navigate(`/events/${providerId}`, { state: navigationState });
        } else {
            console.warn("Clicked result is missing ID or providerId:", result);
            toast.error("Nie można przejść do profilu tego wyniku.");
        }
    };


    return (
        <div className="p-4 md:p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">
            <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800 dark:text-white text-center">
                Znajdź Usługodawcę lub Usługę
            </h1>

            {/* Search Form */}
            <form onSubmit={handleSearchSubmit} className="mb-8 max-w-3xl mx-auto bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {/* Search Term (Service/Name) */}
                    <div className="relative">
                        <label htmlFor="search-service" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Nazwa lub usługa
                        </label>
                        <Search className="absolute left-3 top-9 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            id="search-service"
                            name="service" // Corresponds to searchQuery.service
                            value={searchQuery.service}
                            onChange={handleInputChange}
                            placeholder="Np. Fryzjer Jan, strzyżenie..."
                            className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                        />
                    </div>

                    {/* Industry */}
                    <div className="relative">
                         <label htmlFor="search-industry" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                             Branża
                         </label>
                         <Briefcase className="absolute left-3 top-9 h-5 w-5 text-gray-400" />
                         <input
                             type="text"
                             id="search-industry"
                             name="industry" // Corresponds to searchQuery.industry
                             value={searchQuery.industry}
                             onChange={handleInputChange}
                             placeholder="Np. Budownictwo, IT..."
                             className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                         />
                    </div>

                     {/* Location (Placeholder - not implemented in backend search) */}
                     <div className="relative">
                        <label htmlFor="search-location" className="block text-sm font-medium text-gray-400 dark:text-gray-500 mb-1">
                            Lokalizacja (wkrótce)
                        </label>
                        <MapPin className="absolute left-3 top-9 h-5 w-5 text-gray-500" />
                        <input
                            type="text"
                            id="search-location"
                            name="location" // Corresponds to searchQuery.location
                            value={searchQuery.location}
                            onChange={handleInputChange}
                            placeholder="Np. Warszawa, Gdańsk..."
                            className="pl-10 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 dark:placeholder-gray-500 cursor-not-allowed"
                            disabled // Disabled until backend supports it
                        />
                    </div>
                </div>

                {/* Industry Buttons */}
                <div className="mb-6">
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                         Lub wybierz branżę:
                     </label>
                     <div className="flex flex-wrap gap-2">
                         {industries.map(industry => (
                             <button
                                 key={industry}
                                 type="button"
                                 onClick={() => handleIndustryButtonClick(industry)}
                                 className={`inline-flex items-center px-3 py-1 border rounded-full text-sm font-medium transition-colors ${
                                     selectedIndustry === industry
                                         ? 'bg-sky-600 text-white border-sky-600'
                                         : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                                 }`}
                             >
                                 <Tag size={14} className="mr-1.5" />
                                 {industry}
                             </button>
                         ))}
                     </div>
                </div>


                <div className="flex justify-center">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50"
                    >
                        {isLoading ? (
                            <>
                                <Loader className="animate-spin -ml-1 mr-2 h-5 w-5" />
                                Szukanie...
                            </>
                        ) : (
                            <>
                                <Search className="-ml-1 mr-2 h-5 w-5" />
                                Szukaj
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* Results */}
            <div className="max-w-3xl mx-auto">
                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center gap-2 text-sm justify-center dark:bg-red-900 dark:text-red-200 dark:border-red-700">
                        <AlertCircle size={18} /> {error}
                    </div>
                )}

                {isLoading && searchResults.length === 0 ? ( // Show loader only if loading and no results yet
                     <div className="text-center py-10">
                         <Loader size={32} className="animate-spin text-sky-500 mx-auto" />
                         <p className="mt-2 text-gray-500 dark:text-gray-400">Ładowanie wyników...</p>
                     </div>
                ) : !isLoading && searchResults.length === 0 && (searchQuery.service || searchQuery.industry || searchQuery.location || selectedIndustry) ? ( // No results message only if search was attempted
                    <p className="text-center text-gray-500 dark:text-gray-400 py-10">
                        Brak wyników dla podanych kryteriów. Spróbuj zmienić wyszukiwanie.
                    </p>
                ) : !isLoading && searchResults.length === 0 && !(searchQuery.service || searchQuery.industry || searchQuery.location || selectedIndustry) ? ( // Initial state message
                     <p className="text-center text-gray-500 dark:text-gray-400 py-10">
                         Wpisz kryteria wyszukiwania lub wybierz branżę, aby znaleźć usługodawców lub usługi.
                     </p>
                ) : (
                    <ul className="space-y-4">
                        {searchResults.map((result) => (
                            <li
                                key={`${result.type}-${result.id}`} // Use type and id for unique key
                                onClick={() => handleResultClick(result)} // Use the updated handler
                                className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                            >
                                <div className="p-4 flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        {/* Placeholder for image/icon */}
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 ${result.type === 'Dostawca' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-green-100 dark:bg-green-900'}`}>
                                            {result.type === 'Dostawca' ? <Briefcase size={24} /> : <Tag size={24} />}
                                        </div>
                                        <div>
                                            <p className="text-lg font-semibold text-gray-900 dark:text-white">{result.name || 'Brak nazwy'}</p>
                                            {/* Display type and specific details */}
                                            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{result.type}</p>
                                            {result.type === 'Dostawca' && result.industry && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center mt-1">
                                                    <Briefcase size={14} className="mr-1" /> {result.industry}
                                                </p>
                                            )}
                                             {result.type === 'Usługa' && (
                                                 <>
                                                    {result.category && (
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center mt-1">
                                                            <Tag size={14} className="mr-1" /> {result.category}
                                                        </p>
                                                    )}
                                                    {result.providerName && (
                                                         <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center mt-1">
                                                             <Briefcase size={14} className="mr-1" /> Dostawca: {result.providerName}
                                                         </p>
                                                    )}
                                                     {result.price !== undefined && result.duration !== undefined && (
                                                         <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                             {result.price} zł / {result.duration} min
                                                         </p>
                                                     )}
                                                 </>
                                             )}
                                            {/* Add location if available in results */}
                                            {result.location && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center mt-1">
                                                    <MapPin size={14} className="mr-1" /> {result.location}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {/* Placeholder for rating */}
                                        {result.rating && (
                                            <div className="flex items-center text-sm text-yellow-500">
                                                <Star size={16} className="mr-1 fill-current" />
                                                {typeof result.rating === 'number' ? result.rating.toFixed(1) : result.rating}
                                            </div>
                                        )}
                                        <ChevronRight size={20} className="text-gray-400 dark:text-gray-500" />
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default ProviderSearch;
