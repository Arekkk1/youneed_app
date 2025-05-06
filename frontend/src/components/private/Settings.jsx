import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext'; // Corrected path relative to this file
import api from '../../api'; // Use the configured api instance
import { toast } from 'react-hot-toast';
import { User, Lock, Bell, CreditCard, Building, LogOut, ShieldCheck, Palette, Sun, Moon, Monitor, Settings as SettingsIcon, SlidersHorizontal, Loader2 } from 'lucide-react';

// Import Role Specific Settings Components
import ClientSettings from './Client/ClientSettings'; // Import Client Settings
import ProviderSettings from './Provider/ProviderSettings'; // Import Provider Settings
import ChangePasswordForm from './ChangePasswordForm'; // Import the new component file
import UserProfileForm from './UserProfileForm'; // Import the new component file

// --- Reusable Form Components (Now with API integration) ---

// General Notification Preferences
const GeneralNotificationPreferences = () => {
    const [prefs, setPrefs] = useState({ prefEmailMarketing: false, prefEmailPlatformUpdates: true });
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    // Fetch current preferences on mount
    useEffect(() => {
        const fetchPrefs = async () => {
            setIsFetching(true);
            setIsLoading(true); // Also set loading during fetch
            try {
                const response = await api.get('/profile/preferences');
                if (response.data.status === 'success' && response.data.data) {
                    // Update state only with relevant fields from response
                    setPrefs(prev => ({
                        ...prev, // Keep existing state structure
                        prefEmailMarketing: response.data.data.prefEmailMarketing ?? prev.prefEmailMarketing,
                        prefEmailPlatformUpdates: response.data.data.prefEmailPlatformUpdates ?? prev.prefEmailPlatformUpdates,
                    }));
                } else {
                    toast.error("Nie udało się załadować ogólnych preferencji powiadomień (odpowiedź serwera).");
                }
            } catch (err) {
                console.error("Error fetching general notification preferences:", err);
                toast.error(err.response?.data?.message || "Nie udało się załadować ogólnych preferencji powiadomień.");
            } finally {
                setIsFetching(false);
                setIsLoading(false);
            }
        };
        fetchPrefs();
    }, []);


    const handleChange = (e) => {
        setPrefs({ ...prefs, [e.target.name]: e.target.checked });
    };

    const handleSave = async () => {
         setIsLoading(true);
         try {
             // Send only the relevant preferences
             const payload = {
                 prefEmailMarketing: prefs.prefEmailMarketing,
                 prefEmailPlatformUpdates: prefs.prefEmailPlatformUpdates,
             };
             const response = await api.put('/profile/preferences', payload);
             if (response.data.status === 'success') {
                 toast.success('Ogólne preferencje powiadomień zapisane!');
                 // Optionally update local state again from response if backend modifies data
                 // setPrefs(response.data.data);
             } else {
                 toast.error(response.data.message || "Nie udało się zapisać ogólnych preferencji.");
             }
         } catch (err) {
             console.error("Error saving general notification preferences:", err);
             toast.error(err.response?.data?.message || "Nie udało się zapisać ogólnych preferencji.");
         } finally {
             setIsLoading(false);
         }
    };

    if (isFetching) {
        return <div className="flex justify-center items-center h-20"><Loader2 className="h-6 w-6 animate-spin text-sky-600" /></div>;
    }

    return (
        <div className="space-y-4">
             <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">Ogólne Powiadomienia</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Wybierz, jakie ogólne powiadomienia chcesz otrzymywać.</p>
            <div className="flex items-center justify-between">
                <span className="text-gray-800 dark:text-gray-200 text-sm">Powiadomienia email o nowościach i promocjach</span>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" name="prefEmailMarketing" checked={prefs.prefEmailMarketing} onChange={handleChange} className="sr-only peer" disabled={isLoading}/>
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-300 dark:peer-focus:ring-sky-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-sky-600"></div>
                </label>
            </div>
             <div className="flex items-center justify-between">
                <span className="text-gray-800 dark:text-gray-200 text-sm">Powiadomienia email o ważnych aktualizacjach platformy</span>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" name="prefEmailPlatformUpdates" checked={prefs.prefEmailPlatformUpdates} onChange={handleChange} className="sr-only peer" disabled={isLoading}/>
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-300 dark:peer-focus:ring-sky-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-sky-600"></div>
                </label>
            </div>
             <div className="flex justify-end mt-4">
                <button onClick={handleSave} disabled={isLoading} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50">
                    {isLoading ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Zapisywanie...
                        </>
                    ) : (
                        'Zapisz preferencje ogólne'
                    )}
                </button>
            </div>
        </div>
    );
};

const PrivacySettings = () => {
    // Placeholder for privacy settings - Needs specific requirements
     return (
         <div>
             <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">Prywatność</h3>
             <p className="text-gray-600 dark:text-gray-400">Zarządzaj ustawieniami prywatności swojego konta.</p>
             {/* Example: Profile Visibility (if not handled in UserProfileForm) */}
             {/* <div className="flex items-center justify-between mt-4">
                <span className="text-gray-800 dark:text-gray-200 text-sm">Profil publiczny widoczny dla innych</span>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" name="profilePublic" checked={...} onChange={...} className="sr-only peer" disabled={...}/>
                    <div className="w-11 h-6 bg-gray-200 ..."></div>
                </label>
             </div>
             <div className="flex justify-end mt-4">
                <button onClick={handleSavePrivacy} disabled={isLoading} className="...">
                    Zapisz ustawienia prywatności
                </button>
            </div> */}
             <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">(Sekcja do implementacji zgodnie z wymaganiami)</p>
         </div>
     );
};

const ThemeSwitcher = () => {
    // This component uses localStorage and should work as is.
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'system');

    useEffect(() => {
        const root = window.document.documentElement;
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (theme === 'dark' || (theme === 'system' && systemPrefersDark)) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const handleThemeChange = (newTheme) => {
        setTheme(newTheme);
    };

    return (
        <div className="space-y-3">
             <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">Wygląd Aplikacji</h3>
             <p className="text-gray-600 dark:text-gray-400 text-sm">Wybierz preferowany motyw interfejsu.</p>
             <div className="flex items-center justify-around gap-2 rounded-lg p-1 bg-gray-100 dark:bg-gray-700">
                 <button
                     onClick={() => handleThemeChange('light')}
                     className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                         theme === 'light' ? 'bg-white dark:bg-gray-500 text-sky-700 dark:text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                     }`}
                 >
                     <Sun size={16} /> Jasny
                 </button>
                 <button
                     onClick={() => handleThemeChange('dark')}
                     className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                         theme === 'dark' ? 'bg-gray-800 text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                     }`}
                 >
                     <Moon size={16} /> Ciemny
                 </button>
                 <button
                     onClick={() => handleThemeChange('system')}
                     className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                         theme === 'system' ? 'bg-white dark:bg-gray-500 text-sky-700 dark:text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                     }`}
                 >
                     <Monitor size={16} /> Systemowy
                 </button>
             </div>
        </div>
    );
};

// --- Main Settings Component ---
function Settings() {
    const { user, logout, loading: authLoading } = useAuth(); // Get user and loading state
    const [activeTab, setActiveTab] = useState('profile'); // Default tab
    const [userData, setUserData] = useState(null); // Store fetched user data
    const [isFetchingProfile, setIsFetchingProfile] = useState(true);
    const [profileError, setProfileError] = useState(null); // State to store profile fetch error

    console.log("[Settings] Component rendered. Current activeTab:", activeTab);

    // Fetch user data when component mounts or user context changes
    useEffect(() => {
        const fetchUserData = async () => {
            setIsFetchingProfile(true);
            setUserData(null);
            setProfileError(null);

            const currentUserId = user?.id;
            console.log(`[Settings] useEffect fetchUserData triggered. authLoading: ${authLoading}, currentUserId: ${currentUserId}`);

            if (!authLoading && currentUserId) {
                console.log("[Settings] Attempting to fetch user profile data for user ID:", currentUserId);
                try {
                    // Use the main profile endpoint which should now include preferences
                    const response = await api.get('/profile');
                    console.log("[Settings] API response received:", response);

                    if (response.data && response.data.status === 'success' && response.data.data) {
                        console.log("[Settings] User profile data fetched successfully. Setting userData:", response.data.data);
                        setUserData(response.data.data);
                        setProfileError(null);
                    } else {
                         const errorMsg = `Failed to fetch user data. API status: ${response.data?.status}, Message: ${response.data?.message}`;
                         console.error("[Settings]", errorMsg);
                         setProfileError(response.data?.message || "Nieprawidłowa odpowiedź serwera.");
                         toast.error("Nie udało się pobrać danych użytkownika (nieprawidłowa odpowiedź).");
                         setUserData(null);
                    }
                } catch (err) {
                    const errorMsg = err.response?.data?.message || err.message || "Błąd ładowania danych użytkownika.";
                    console.error("[Settings] Error fetching user data:", err.response || err);
                    setProfileError(errorMsg);
                    toast.error(errorMsg);
                    setUserData(null);

                     if (err.response?.status === 401 || err.response?.status === 403) {
                         console.log("[Settings] Unauthorized (401/403) fetching profile, logging out.");
                         logout();
                     }
                } finally {
                    console.log("[Settings] Finished fetching profile data attempt.");
                    setIsFetchingProfile(false);
                }
            } else if (!authLoading && !currentUserId) {
                 console.log("[Settings] No user ID found in AuthContext after auth loading finished. Cannot fetch profile.");
                 setIsFetchingProfile(false);
                 setProfileError("Brak informacji o użytkowniku. Zaloguj się ponownie.");
                 setUserData(null);
            } else {
                 console.log("[Settings] Skipping fetch: Auth is loading or no user ID yet.");
                 if (!authLoading) {
                    setIsFetchingProfile(false);
                 }
            }
        };

        fetchUserData();

    }, [user, authLoading, logout]); // Dependencies for the effect

    // Callback function for UserProfileForm to update the main userData state
    const handleProfileUpdate = (updatedProfileData) => {
        console.log("[Settings] Profile updated via UserProfileForm, updating local state:", updatedProfileData);
        // Merge updated data with existing data to preserve preferences etc.
        // if they are not returned by the profile update endpoint
        setUserData(prevData => ({ ...prevData, ...updatedProfileData }));
    };

     // Callback function for preference components to update the main userData state
     // This might be less necessary if profile endpoint returns all data,
     // but useful if preference updates return only preferences.
     const handlePreferencesUpdate = (updatedPreferences) => {
        console.log("[Settings] Preferences updated, merging into local state:", updatedPreferences);
        setUserData(prevData => ({ ...prevData, ...updatedPreferences }));
     };


    const renderContent = () => {
        console.log(`[Settings] renderContent called. ActiveTab: ${activeTab}`);
        console.log(`[Settings] Render check. AuthLoading: ${authLoading}, FetchingProfile: ${isFetchingProfile}, UserData exists: ${!!userData}, ProfileError: ${profileError}`);

        if (authLoading || isFetchingProfile) {
             console.log("[Settings] Render: Showing loading spinner.");
             return <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-sky-600" /></div>;
        }

        if (!userData) {
             console.log("[Settings] Render: No userData. Showing error message.");
             return (
                <div className="text-center p-6 text-red-600 dark:text-red-400">
                    <p>Nie udało się załadować danych profilu.</p>
                    {profileError && <p className="text-sm mt-2">({profileError})</p>}
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Spróbuj odświeżyć stronę lub zaloguj się ponownie.</p>
                </div>
             );
        }

        // Pass the update handler to components that modify preferences
        // Pass the full userData down so components have access to all needed fields
        console.log(`[Settings] Render: Proceeding to switch statement for tab: ${activeTab}`);
        switch (activeTab) {
            case 'profile':
                console.log("[Settings] Render: Rendering UserProfileForm");
                // Pass the specific update handler for profile fields
                return <UserProfileForm user={userData} onUpdate={handleProfileUpdate} />;
            case 'password':
                 console.log("[Settings] Render: Rendering ChangePasswordForm");
                return <ChangePasswordForm />; // Assumes no user data needed directly
            case 'notifications':
                 console.log("[Settings] Render: Rendering GeneralNotificationPreferences");
                 // Pass the preference update handler (though it might update its own state)
                 // No direct user data needed here if it fetches its own prefs
                return <GeneralNotificationPreferences />;
            case 'theme':
                 console.log("[Settings] Render: Rendering ThemeSwitcher");
                return <ThemeSwitcher />; // No user data needed
            case 'privacy':
                 console.log("[Settings] Render: Rendering PrivacySettings");
                 // Pass user data if privacy settings depend on it
                return <PrivacySettings user={userData} />;
            case 'clientSettings':
                 console.log("[Settings] Render: Rendering ClientSettings");
                 // Pass user data and the preference update handler
                 return <ClientSettings user={userData} onUpdate={handlePreferencesUpdate} />;
            case 'providerSettings':
                 console.log("[Settings] Render: Rendering ProviderSettings");
                 // Pass user data and the preference update handler
                 return <ProviderSettings user={userData} onUpdate={handlePreferencesUpdate} />;
            default:
                 console.log("[Settings] Render: Rendering default (UserProfileForm)");
                 return <UserProfileForm user={userData} onUpdate={handleProfileUpdate} />;
        }
    };

    // Determine user role safely
    const currentUserRole = userData?.role || user?.role;

    const getTabs = () => {
        const baseTabs = [
            { id: 'profile', label: 'Profil', icon: User },
            { id: 'password', label: 'Hasło', icon: Lock },
            { id: 'theme', label: 'Wygląd', icon: Palette },
            { id: 'notifications', label: 'Powiadomienia Ogólne', icon: Bell },
            { id: 'privacy', label: 'Prywatność', icon: ShieldCheck },
        ];

        // Only add role-specific tabs if we have user data (and thus a role)
        // Use currentUserRole which checks userData first
        if (currentUserRole === 'client') {
            return [
                ...baseTabs,
                { id: 'clientSettings', label: 'Ustawienia Klienta', icon: SettingsIcon },
            ];
        } else if (currentUserRole === 'provider') {
            return [
                baseTabs[0], // Profile
                { id: 'providerSettings', label: 'Ustawienia Firmy', icon: SlidersHorizontal },
                baseTabs[1], // Password
                baseTabs[2], // Theme
                baseTabs[3], // General Notifications
                baseTabs[4], // Privacy
            ];
        }
        // Fallback for admin or if userData hasn't loaded yet
        return baseTabs;
    };

    const tabs = getTabs();

    const handleTabClick = (tabId) => {
        console.log(`[Settings] handleTabClick called with tabId: ${tabId}`);
        setActiveTab(tabId);
    };

    return (
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 p-4 md:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-64 flex-shrink-0">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">Ustawienia</h2>
                <nav className="space-y-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabClick(tab.id)}
                            className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                activeTab === tab.id
                                    ? 'bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                            }`}
                            disabled={isFetchingProfile} // Disable while fetching initial profile
                        >
                            <tab.icon className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                            <span className="truncate">{tab.label}</span>
                        </button>
                    ))}
                     <button
                        onClick={logout}
                        disabled={authLoading}
                        className="w-full flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-800 dark:hover:text-red-300 mt-4 disabled:opacity-50"
                    >
                        <LogOut className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                        Wyloguj
                    </button>
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="flex-grow bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 md:p-8 overflow-y-auto">
                {/* Render active tab content */}
                {renderContent()}
            </main>
        </div>
    );
}

export default Settings;
