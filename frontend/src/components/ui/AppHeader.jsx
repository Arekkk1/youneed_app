import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Still needed for user details and logout
import { useSidebar } from '../../context/SidebarContext';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, Bell, User as UserIcon, Search, Menu, X, LogOut, LogIn, UserPlus, Settings } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';
import api from '../../api';
import useClickOutside from '../../hooks/useClickOutside';

const AppHeader = () => {
    // Use context for user details, logout, and loading state
    const { user, logout, loading: isAuthLoading } = useAuth();
    const { toggleSidebar, isMobileOpen } = useSidebar();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    // Local state for UI elements
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearchLoading, setIsSearchLoading] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    // State to track authentication based on localStorage token
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const notificationRef = useRef(null);
    const profileRef = useRef(null);
    const searchRef = useRef(null);

    useClickOutside(notificationRef, () => setIsNotificationOpen(false));
    useClickOutside(profileRef, () => setIsProfileOpen(false));
    useClickOutside(searchRef, () => setIsSearchFocused(false));

    // Check localStorage for token on mount and when auth context loading state changes
    useEffect(() => {
        // Assume token is stored under 'authToken'. Change if needed.
        const token = localStorage.getItem('token');
        setIsAuthenticated(!!token); // Set state based on token presence
    }, [isAuthLoading]); // Re-check when auth loading finishes, in case context updated localStorage

    // Fetch unread notification count - depends on isAuthenticated state
    useEffect(() => {
        const fetchUnreadCount = async () => {
            if (isAuthenticated) { // Use the local isAuthenticated state
                try {
                    const response = await api.get('/common/notifications?isRead=false&limit=1');
                    if (response.data.status === 'success') {
                        setUnreadCount(response.data.pagination?.totalItems || response.data.data?.length || 0);
                    }
                } catch (error) {
                    console.error("Błąd pobierania liczby nieprzeczytanych powiadomień:", error);
                }
            } else {
                setUnreadCount(0);
            }
        };

        fetchUnreadCount();
        const intervalId = setInterval(fetchUnreadCount, 60000);
        return () => clearInterval(intervalId);
    }, [isAuthenticated]); // Depend on the local isAuthenticated state

    const handleLogout = () => {
        logout(); // Call logout from context (clears context, removes token)
        setIsAuthenticated(false); // Update local state immediately
        setIsProfileOpen(false);
        navigate('/');
    };

    const handleSearchChange = async (event) => {
        const query = event.target.value;
        setSearchQuery(query);

        if (query.length > 2) {
            setIsSearchLoading(true);
            try {
                const response = await api.get(`/search?q=${encodeURIComponent(query)}`);
                 if (response.data.status === 'success') {
                    setSearchResults(response.data.data || []);
                 } else {
                    setSearchResults([]);
                 }
            } catch (error) {
                console.error("Błąd wyszukiwania:", error);
                setSearchResults([]);
            } finally {
                setIsSearchLoading(false);
            }
        } else {
            setSearchResults([]);
        }
    };

    const handleSearchResultClick = (result) => {
        console.log("Navigating to result:", result);
        setSearchQuery('');
        setSearchResults([]);
        setIsSearchFocused(false);
        if (result.type === 'client' && result.id) {
            navigate(`/provider/clients/${result.id}`);
        } else if (result.type === 'order' && result.id) {
            navigate(`/provider/orders/${result.id}`);
        }
        // Add more types as needed
    };

    // Determine dashboard link based on user role from context (if available)
    const dashboardLink = isAuthenticated
        ? (user?.role === 'provider' ? '/provider/dashboard' : user?.role === 'client' ? '/client/dashboard' : '/')
        : '/';

    return (
        <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 shadow-sm dark:border-b dark:border-gray-800">
            <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Left Side: Hamburger and Logo */}
                    <div className="flex items-center">
                        <button
                            onClick={toggleSidebar}
                            className="p-2 mr-2 text-gray-500 rounded-md lg:hidden hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-sky-500 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700"
                            aria-label="Toggle sidebar"
                        >
                            {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                        <Link to={dashboardLink} className="flex-shrink-0">
                            
                            <img
                                className="hidden w-auto h-10 dark:hidden lg:block"
                                src="/images/logo/youneed_logo_black.png"
                                alt="YouNeed Logo"
                            />
                      
                        </Link>
                    </div>

                    {/* Center: Search Bar */}
                    <div className="flex-1 hidden sm:flex justify-center px-4">
                        <div className="relative w-full max-w-lg" ref={searchRef}>
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <Search className="w-5 h-5 text-gray-400" aria-hidden="true" />
                            </div>
                            <input
                                id="search"
                                name="search"
                                className="block w-full py-2 pl-10 pr-3 leading-5 text-gray-900 placeholder-gray-500 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-sky-500 focus:border-sky-500 focus:placeholder-gray-400 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-400 sm:text-sm"
                                placeholder="Szukaj zleceń, klientów..."
                                type="search"
                                value={searchQuery}
                                onChange={handleSearchChange}
                                onFocus={() => setIsSearchFocused(true)}
                            />
                            {isSearchFocused && (searchQuery.length > 0 || isSearchLoading) && (
                                <div className="absolute z-10 w-full mt-1 overflow-auto bg-white rounded-md shadow-lg dark:bg-gray-800 max-h-60 ring-1 ring-black ring-opacity-5">
                                    {isSearchLoading && <div className="px-4 py-2 text-sm text-gray-500">Ładowanie...</div>}
                                    {!isSearchLoading && searchResults.length === 0 && searchQuery.length > 2 && (
                                        <div className="px-4 py-2 text-sm text-gray-500">Brak wyników.</div>
                                    )}
                                    {!isSearchLoading && searchResults.length > 0 && (
                                        <ul className="py-1">
                                            {searchResults.map((result) => (
                                                <li
                                                    key={result.id + '-' + result.type}
                                                    onClick={() => handleSearchResultClick(result)}
                                                    className="px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                                                >
                                                    <span className="font-medium">{result.name || result.title || result.id}</span>
                                                    <span className="ml-2 text-xs text-gray-500">({result.type})</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Side: Theme Toggle, Notifications, Profile / Login/Register */}
                    <div className="flex items-center space-x-2 md:space-x-4"> {/* Adjusted spacing */}
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 dark:focus:ring-offset-gray-800"
                            aria-label="Toggle theme"
                        >
                            {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
                        </button>

                        {/* Conditional Rendering based on Auth State */}
                        {isAuthLoading ? (
                            // Loading State: Placeholder to maintain layout
                            <div className="flex items-center space-x-2 md:space-x-4">
                                <div className="w-8 h-8 bg-gray-300 rounded-full animate-pulse dark:bg-gray-700"></div>
                                <div className="w-8 h-8 bg-gray-300 rounded-full animate-pulse dark:bg-gray-700"></div>
                            </div>
                        ) : isAuthenticated ? ( // <<< CHANGED condition to use local state based on localStorage token
                            // Logged-in State: Notifications & Profile
                            <>
                                {/* Notification Button */}
                                <div className="relative" ref={notificationRef}>
                                    <button
                                        onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                                        className="relative p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:focus:ring-offset-gray-800"
                                        aria-label="Powiadomienia"
                                    >
                                        <Bell size={22} />
                                        {unreadCount > 0 && (
                                            <span className="absolute top-0 right-0 block h-2.5 w-2.5 transform translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800"></span>
                                        )}
                                    </button>
                                    {isNotificationOpen && (
                                        <div className="absolute right-0 mt-2 z-50">
                                            <NotificationDropdown onClose={() => setIsNotificationOpen(false)} />
                                        </div>
                                    )}
                                </div>

                                {/* Profile Dropdown */}
                                <div className="relative" ref={profileRef}>
                                    <div>
                                        <button
                                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                                            className="flex text-sm bg-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 dark:bg-gray-700 dark:focus:ring-offset-gray-800"
                                            id="user-menu-button"
                                            aria-expanded={isProfileOpen}
                                            aria-haspopup="true"
                                            aria-label="User menu"
                                        >
                                            <span className="sr-only">Otwórz menu użytkownika</span>
                                            {/* Use user object from context for details */}
                                            {user?.profilePicture ? (
                                                <img
                                                    className="w-8 h-8 rounded-full"
                                                    src={user.profilePicture}
                                                    alt="Profil"
                                                />
                                            ) : (
                                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900">
                                                    {user?.firstName ? (
                                                        <span className="text-sm font-medium leading-none text-sky-600 dark:text-sky-300">
                                                            {user.firstName.charAt(0).toUpperCase()}
                                                        </span>
                                                    ) : (
                                                        <UserIcon className="w-5 h-5 text-sky-600 dark:text-sky-300" />
                                                    )}
                                                </span>
                                            )}
                                        </button>
                                    </div>
                                    {isProfileOpen && (
                                        <div
                                            className="absolute right-0 w-48 py-1 mt-2 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800 dark:ring-gray-700 z-50"
                                            role="menu"
                                            aria-orientation="vertical"
                                            aria-labelledby="user-menu-button"
                                        >
                                            {/* Use user object from context for details */}
                                            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-600">
                                                <p className="text-sm text-gray-700 dark:text-gray-200">Zalogowano jako</p>
                                                <p className="text-sm font-medium text-gray-900 truncate dark:text-white">{user?.email}</p>
                                            </div>
                                            <div className="py-1">
                                                <Link
                                                    to="/settings" // Unified settings path
                                                    className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                                                    role="menuitem"
                                                    onClick={() => setIsProfileOpen(false)}
                                                >
                                                    <Settings className="w-4 h-4 mr-2" /> Ustawienia
                                                </Link>
                                                {/* Add more links as needed */}
                                            </div>
                                            <div className="py-1 border-t border-gray-100 dark:border-gray-700">
                                                <button
                                                    onClick={handleLogout}
                                                    className="flex items-center w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-700"
                                                    role="menuitem"
                                                >
                                                    <LogOut className="w-4 h-4 mr-2" /> Wyloguj
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            // Logged-out State: Login & Register
                            <div className="flex items-center space-x-2 md:space-x-4">
                                <Link
                                    to="/login"
                                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                                >
                                    <LogIn className="inline w-4 h-4 mr-1" /> Zaloguj się
                                </Link>
                                <Link
                                    to="/register/provider" // Link to provider registration flow
                                    className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                                >
                                    <UserPlus className="inline w-4 h-4 mr-1" /> Zarejestruj się
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default AppHeader;
