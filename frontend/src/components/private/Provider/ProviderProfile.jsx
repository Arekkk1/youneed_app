import React, { useState, useEffect } from 'react';
        // import { useAuth } from '../../../context/AuthContext'; // Removed useAuth
        import api from '../../../api'; // Corrected path
        import { toast } from 'react-hot-toast';
        import { User, Building, Phone, Mail, MapPin, Globe, Edit, Save, X, Upload, Trash2, Loader2 } from 'lucide-react';

        // Helper function to format address
        const formatAddress = (user) => {
            if (!user) return ''; // Handle null user case
            const parts = [
                user.addressStreet,
                user.addressApartment,
                user.addressPostalCode && user.addressCity ? `${user.addressPostalCode} ${user.addressCity}` : user.addressCity,
                user.addressCountry
            ].filter(Boolean); // Filter out null/undefined/empty strings
            return parts.join(', ');
        };

        const ProviderProfile = () => {
            // const { user: contextUser, loading: authLoading } = useAuth(); // Removed useAuth
            const [user, setUser] = useState(null);
            const [isEditing, setIsEditing] = useState(false);
            const [formData, setFormData] = useState({});
            const [isLoading, setIsLoading] = useState(true);
            const [isSaving, setIsSaving] = useState(false);
            const [profilePictureFile, setProfilePictureFile] = useState(null);
            const [picturePreview, setPicturePreview] = useState(null);
            const [error, setError] = useState(''); // Added error state

            // --- LOCALSTORAGE WORKAROUND START ---
            const storedToken = localStorage.getItem('token');
            const storedUserId = localStorage.getItem('userId'); // Assuming userId is stored
            const storedRole = localStorage.getItem('role'); // Assuming role is stored
            // --- LOCALSTORAGE WORKAROUND END ---

            useEffect(() => {
                const fetchProfile = async () => {
                    console.log("[ProviderProfile] Fetching profile...");
                    setIsLoading(true);
                    setError(''); // Clear previous errors
                    try {
                        // Use storedToken directly
                        if (!storedToken) {
                            throw new Error("Brak tokenu uwierzytelniającego. Zaloguj się ponownie.");
                        }
                        // Set auth header for this specific request if not set globally
                        // (Assuming api instance might not have it if AuthContext failed)
                        const config = {
                            headers: { Authorization: `Bearer ${storedToken}` }
                        };
                        const response = await api.get('/profile', config); // Fetch full profile data
                        console.log("[ProviderProfile] API Response:", response.data);

                        if (response.data.status === 'success' && response.data.data) {
                            const fetchedUser = response.data.data;
                            setUser(fetchedUser);
                            setFormData({
                                firstName: fetchedUser.firstName || '',
                                lastName: fetchedUser.lastName || '',
                                companyName: fetchedUser.companyName || '',
                                phoneNumber: fetchedUser.phoneNumber || '',
                                industry: fetchedUser.industry || '',
                                website: fetchedUser.website || '',
                                addressStreet: fetchedUser.addressStreet || '',
                                addressApartment: fetchedUser.addressApartment || '',
                                addressCity: fetchedUser.addressCity || '',
                                addressPostalCode: fetchedUser.addressPostalCode || '',
                                addressCountry: fetchedUser.addressCountry || '',
                                // Add other relevant fields if needed
                            });
                            setPicturePreview(fetchedUser.profilePicture || null);
                        } else {
                            throw new Error(response.data.message || 'Nie udało się załadować profilu.');
                        }
                    } catch (error) {
                        console.error("[ProviderProfile] Błąd ładowania profilu:", error);
                        const errorMsg = error.response?.data?.message || error.message || 'Wystąpił błąd podczas ładowania profilu.';
                        setError(errorMsg); // Set error state
                        toast.error(errorMsg);
                    } finally {
                        setIsLoading(false);
                    }
                };

                // Trigger fetch if token exists and role is provider
                if (storedToken && storedRole === 'provider') {
                    fetchProfile();
                } else {
                    setIsLoading(false); // Stop loading if no token or wrong role
                    if (!storedToken) setError("Nie jesteś zalogowany.");
                    else if (storedRole !== 'provider') setError("Nie masz uprawnień dostawcy.");
                }
            }, [storedToken, storedRole]); // Depend on localStorage values

            const handleInputChange = (e) => {
                const { name, value } = e.target;
                setFormData(prev => ({ ...prev, [name]: value }));
            };

            const handleSaveChanges = async () => {
                setIsSaving(true);
                const updateData = {
                    ...formData,
                    // Structure address as an object if backend expects it that way
                    address: {
                        street: formData.addressStreet,
                        apartment: formData.addressApartment,
                        city: formData.addressCity,
                        postalCode: formData.addressPostalCode,
                        country: formData.addressCountry,
                    }
                };
                // Remove individual address fields if sending nested object
                delete updateData.addressStreet;
                delete updateData.addressApartment;
                delete updateData.addressCity;
                delete updateData.addressPostalCode;
                delete updateData.addressCountry;


                try {
                    // Use storedToken for the request
                    if (!storedToken) throw new Error("Brak tokenu.");
                    const config = { headers: { Authorization: `Bearer ${storedToken}` } };

                    const response = await api.patch('/profile', updateData, config); // Use PATCH and correct endpoint
                    if (response.data.status === 'success') {
                        const updatedUser = response.data.data;
                        setUser(updatedUser); // Update local state with returned data
                        setFormData({ // Reset form data based on new user data
                             firstName: updatedUser.firstName || '',
                             lastName: updatedUser.lastName || '',
                             companyName: updatedUser.companyName || '',
                             phoneNumber: updatedUser.phoneNumber || '',
                             industry: updatedUser.industry || '',
                             website: updatedUser.website || '',
                             addressStreet: updatedUser.addressStreet || '',
                             addressApartment: updatedUser.addressApartment || '',
                             addressCity: updatedUser.addressCity || '',
                             addressPostalCode: updatedUser.addressPostalCode || '',
                             addressCountry: updatedUser.addressCountry || '',
                        });
                        setIsEditing(false);
                        toast.success('Profil zaktualizowany pomyślnie!');
                    } else {
                        toast.error(response.data.message || 'Nie udało się zaktualizować profilu.');
                    }
                } catch (error) {
                    console.error("[ProviderProfile] Błąd aktualizacji profilu:", error);
                    toast.error(error.response?.data?.message || 'Wystąpił błąd podczas aktualizacji profilu.');
                } finally {
                    setIsSaving(false);
                }
            };

            const handlePictureChange = (event) => {
                const file = event.target.files[0];
                if (file && file.type.startsWith('image/')) {
                    setProfilePictureFile(file);
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setPicturePreview(reader.result);
                    };
                    reader.readAsDataURL(file);
                } else {
                    toast.error('Proszę wybrać plik obrazu.');
                }
            };

            const handlePictureUpload = async () => {
                if (!profilePictureFile) return;
                if (!storedToken) {
                    toast.error("Brak tokenu.");
                    return;
                }
                const uploadFormData = new FormData();
                uploadFormData.append('profilePicture', profilePictureFile);
                setIsSaving(true); // Use isSaving state for upload as well
                try {
                    const config = {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                            Authorization: `Bearer ${storedToken}`
                        }
                    };
                    const response = await api.post('/profile/picture', uploadFormData, config);
                    if (response.data.status === 'success') {
                        setUser(prev => ({ ...prev, profilePicture: response.data.data.profilePicture }));
                        setPicturePreview(response.data.data.profilePicture); // Update preview with URL from server
                        setProfilePictureFile(null); // Clear the file input state
                        toast.success('Zdjęcie profilowe zaktualizowane!');
                    } else {
                         toast.error(response.data.message || 'Nie udało się przesłać zdjęcia.');
                    }
                } catch (error) {
                    console.error("[ProviderProfile] Błąd przesyłania zdjęcia:", error);
                    toast.error(error.response?.data?.message || 'Wystąpił błąd podczas przesyłania zdjęcia.');
                } finally {
                    setIsSaving(false);
                }
            };

             const handlePictureDelete = async () => {
                if (!user?.profilePicture) return;
                if (!storedToken) {
                    toast.error("Brak tokenu.");
                    return;
                }
                if (!window.confirm('Czy na pewno chcesz usunąć zdjęcie profilowe?')) return;

                setIsSaving(true);
                try {
                    const config = { headers: { Authorization: `Bearer ${storedToken}` } };
                    const response = await api.delete('/profile/picture', config);
                    if (response.data.status === 'success') {
                        setUser(prev => ({ ...prev, profilePicture: null }));
                        setPicturePreview(null);
                        setProfilePictureFile(null);
                        toast.success('Zdjęcie profilowe usunięte!');
                    } else {
                         toast.error(response.data.message || 'Nie udało się usunąć zdjęcia.');
                    }
                } catch (error) {
                    console.error("[ProviderProfile] Błąd usuwania zdjęcia:", error);
                    toast.error(error.response?.data?.message || 'Wystąpił błąd podczas usuwania zdjęcia.');
                } finally {
                    setIsSaving(false);
                }
            };


            const toggleEdit = () => {
                if (isEditing && user) { // Ensure user is not null before resetting
                    // Reset form data if canceling edit
                    setFormData({
                        firstName: user.firstName || '',
                        lastName: user.lastName || '',
                        companyName: user.companyName || '',
                        phoneNumber: user.phoneNumber || '',
                        industry: user.industry || '',
                        website: user.website || '',
                        addressStreet: user.addressStreet || '',
                        addressApartment: user.addressApartment || '',
                        addressCity: user.addressCity || '',
                        addressPostalCode: user.addressPostalCode || '',
                        addressCountry: user.addressCountry || '',
                    });
                     setPicturePreview(user.profilePicture || null); // Reset preview
                     setProfilePictureFile(null); // Clear file selection
                }
                setIsEditing(!isEditing);
            };

            if (isLoading) {
                return <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-sky-600" /></div>;
            }

            if (error) { // Display error message if fetching failed
                 return <div className="text-center p-6 text-red-600 dark:text-red-400">{error}</div>;
            }

            if (!user) { // Handle case where user is null after loading (e.g., not found, not provider)
                return <div className="text-center p-6 text-gray-500 dark:text-gray-400">Nie znaleziono profilu dostawcy lub brak uprawnień.</div>;
            }

            // Ensure user is not null before accessing its properties
            const displayAddress = formatAddress(user);
            const avatarName = user.companyName || `${user.firstName || ''} ${user.lastName || ''}`;

            return (
                <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 md:p-8">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
                        {/* Profile Picture Section */}
                        <div className="flex-shrink-0 flex flex-col items-center">
                            <div className="relative group">
                                <img
                                    className="h-32 w-32 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                                    src={picturePreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(avatarName)}&background=random&color=fff`}
                                    alt="Zdjęcie profilowe"
                                />
                                {isEditing && (
                                    <label htmlFor="profilePictureInput" className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Upload className="h-8 w-8 text-white" />
                                        <input
                                            id="profilePictureInput"
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handlePictureChange}
                                            disabled={isSaving}
                                        />
                                    </label>
                                )}
                            </div>
                            {isEditing && profilePictureFile && (
                                 <button
                                    onClick={handlePictureUpload}
                                    disabled={isSaving}
                                    className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin"/> : <Save className="h-4 w-4 mr-1"/>}
                                    Prześlij
                                </button>
                            )}
                             {isEditing && user.profilePicture && !profilePictureFile && (
                                 <button
                                    onClick={handlePictureDelete}
                                    disabled={isSaving}
                                    className="mt-2 inline-flex items-center px-3 py-1 border border-red-300 text-xs font-medium rounded shadow-sm text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                                >
                                     {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin"/> : <Trash2 className="h-4 w-4 mr-1"/>}
                                     Usuń zdjęcie
                                 </button>
                             )}
                        </div>

                        {/* Profile Info Section */}
                        <div className="flex-grow mt-4 md:mt-0">
                            {isEditing ? (
                                <>
                                    <input
                                        type="text"
                                        name="companyName"
                                        value={formData.companyName}
                                        onChange={handleInputChange}
                                        placeholder="Nazwa firmy"
                                        className="text-2xl font-bold text-gray-900 dark:text-white bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-0 focus:border-sky-500 mb-1 w-full"
                                        disabled={isSaving}
                                    />
                                    <input
                                        type="text"
                                        name="industry"
                                        value={formData.industry}
                                        onChange={handleInputChange}
                                        placeholder="Branża"
                                        className="text-sm text-gray-500 dark:text-gray-400 bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-0 focus:border-sky-500 w-full"
                                        disabled={isSaving}
                                    />
                                </>
                            ) : (
                                <>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{avatarName}</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.industry}</p>
                                </>
                            )}
                        </div>

                        {/* Edit Button */}
                        <div className="ml-auto flex-shrink-0 self-start">
                            <button
                                onClick={toggleEdit}
                                disabled={isSaving}
                                className={`p-2 rounded-full transition-colors ${
                                    isEditing
                                        ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800/60'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                } disabled:opacity-50`}
                            >
                                {isEditing ? <X size={20} /> : <Edit size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* Details Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                        {/* Contact Info */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Informacje Kontaktowe</h3>
                            <div className="space-y-3">
                                <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                                    <User size={16} className="mr-3 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                    {isEditing ? (
                                        <div className="flex gap-2 flex-grow">
                                            <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="Imię" className="flex-1 bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-0 focus:border-sky-500" disabled={isSaving}/>
                                            <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Nazwisko" className="flex-1 bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-0 focus:border-sky-500" disabled={isSaving}/>
                                        </div>
                                    ) : (
                                        <span>{user.firstName} {user.lastName}</span>
                                    )}
                                </div>
                                <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                                    <Mail size={16} className="mr-3 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                    <span>{user.email}</span> {/* Email usually not editable here */}
                                </div>
                                <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                                    <Phone size={16} className="mr-3 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                    {isEditing ? (
                                        <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} placeholder="Numer telefonu" className="flex-grow bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-0 focus:border-sky-500" disabled={isSaving}/>
                                    ) : (
                                        <span>{user.phoneNumber || 'Brak'}</span>
                                    )}
                                </div>
                                 <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                                    <Globe size={16} className="mr-3 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                    {isEditing ? (
                                        <input type="url" name="website" value={formData.website} onChange={handleInputChange} placeholder="Strona internetowa (opcjonalnie)" className="flex-grow bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-0 focus:border-sky-500" disabled={isSaving}/>
                                    ) : (
                                        user.website ? <a href={user.website.startsWith('http') ? user.website : `http://${user.website}`} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">{user.website}</a> : <span>Brak</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Address Info */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Adres Firmy</h3>
                            <div className="space-y-3">
                                 <div className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                                     <MapPin size={16} className="mr-3 mt-1 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                     {isEditing ? (
                                         <div className="flex-grow space-y-2">
                                             <input type="text" name="addressStreet" value={formData.addressStreet} onChange={handleInputChange} placeholder="Ulica i numer" className="w-full bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-0 focus:border-sky-500" disabled={isSaving}/>
                                             <input type="text" name="addressApartment" value={formData.addressApartment} onChange={handleInputChange} placeholder="Numer lokalu (opcjonalnie)" className="w-full bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-0 focus:border-sky-500" disabled={isSaving}/>
                                             <div className="flex gap-2">
                                                <input type="text" name="addressPostalCode" value={formData.addressPostalCode} onChange={handleInputChange} placeholder="Kod pocztowy" className="flex-1 bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-0 focus:border-sky-500" disabled={isSaving}/>
                                                <input type="text" name="addressCity" value={formData.addressCity} onChange={handleInputChange} placeholder="Miasto" className="flex-1 bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-0 focus:border-sky-500" disabled={isSaving}/>
                                             </div>
                                              <input type="text" name="addressCountry" value={formData.addressCountry} onChange={handleInputChange} placeholder="Kraj" className="w-full bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-0 focus:border-sky-500" disabled={isSaving}/>
                                         </div>
                                     ) : (
                                         <span>{displayAddress || 'Brak adresu'}</span>
                                     )}
                                 </div>
                            </div>
                        </div>
                    </div>

                    {/* Save Button */}
                    {isEditing && (
                        <div className="mt-8 flex justify-end">
                            <button
                                onClick={handleSaveChanges}
                                disabled={isSaving}
                                className="inline-flex items-center justify-center px-6 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 className="h-5 w-5 mr-2 animate-spin"/> : <Save className="h-5 w-5 mr-2"/>}
                                Zapisz zmiany
                            </button>
                        </div>
                    )}
                </div>
            );
        };

        export default ProviderProfile;
