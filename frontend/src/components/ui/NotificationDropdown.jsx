import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { BellRing, CheckCircle, XCircle, Info, AlertTriangle, Trash2, Check } from 'lucide-react';
import api from '../../api'; // Use the configured api instance
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale'; // Import Polish locale

const NotificationIcon = ({ type }) => {
    switch (type) {
        case 'success': return <CheckCircle className="text-green-500" size={18} />;
        case 'error': return <XCircle className="text-red-500" size={18} />;
        case 'info': return <Info className="text-blue-500" size={18} />;
        case 'warning': return <AlertTriangle className="text-yellow-500" size={18} />;
        default: return <BellRing className="text-gray-500" size={18} />;
    }
};

const NotificationDropdown = ({ onClose }) => {
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [role, setRole] = useState(null);

    const fetchNotifications = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // *** CORRECTED ENDPOINT ***
            // Added query parameters directly to the URL
            const response = await api.get('/common/notifications?limit=15&sort=createdAt:desc');
            if (response.data.status === 'success') {
                setNotifications(response.data.data || []);
            } else {
                throw new Error(response.data.message || 'Failed to fetch notifications');
            }
        } catch (err) {
            console.error("Błąd pobierania powiadomień w dropdown:", err);
            setError(err.message || 'Nie można załadować powiadomień.');
            toast.error('Błąd ładowania powiadomień.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
        const storedRole = localStorage.getItem('role');
    if (storedRole) {
      setRole(storedRole);
    }
    }, [fetchNotifications]);

    const markAsRead = async (id) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        try {
            // *** CORRECTED ENDPOINT ***
            await api.put(`/common/notifications/${id}/read`);
            // No need to refetch, already updated optimistically
            // toast.success('Oznaczono jako przeczytane.'); // Optional feedback
        } catch (err) {
            console.error("Błąd oznaczania powiadomienia jako przeczytane:", err);
            toast.error('Nie udało się oznaczyć jako przeczytane.');
            // Revert optimistic update on error
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: false } : n));
        }
    };

    const markAllAsRead = async () => {
        const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
        if (unreadIds.length === 0) return;

        // Optimistic update
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        try {
             // *** CORRECTED ENDPOINT ***
            await api.post('/common/notifications/mark-all-read');
            // toast.success('Wszystkie oznaczono jako przeczytane.'); // Optional feedback
        } catch (err) {
            console.error("Błąd oznaczania wszystkich powiadomień jako przeczytane:", err);
            toast.error('Nie udało się oznaczyć wszystkich jako przeczytane.');
            // Revert optimistic update on error
            setNotifications(prev => prev.map(n => unreadIds.includes(n.id) ? { ...n, isRead: false } : n));
        }
    };

    // const deleteNotification = async (id) => {
    //     // Optimistic update
    //     setNotifications(prev => prev.filter(n => n.id !== id));
    //     try {
    //         // *** Needs corresponding backend endpoint ***
    //         // await api.delete(`/common/notifications/${id}`);
    //         toast.success('Powiadomienie usunięte.');
    //     } catch (err) {
    //         console.error("Błąd usuwania powiadomienia:", err);
    //         toast.error('Nie udało się usunąć powiadomienia.');
    //         // Revert optimistic update requires storing the deleted item temporarily
    //         fetchNotifications(); // Simple revert: refetch all
    //     }
    // };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="origin-top-right absolute right-0 mt-2 w-80 md:w-96 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-50 max-h-[70vh] flex flex-col">
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Powiadomienia</h3>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllAsRead}
                        className="text-xs text-sky-600 dark:text-sky-400 hover:underline focus:outline-none"
                        title="Oznacz wszystkie jako przeczytane"
                    >
                        <Check size={16} />
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="p-6 text-center text-gray-500 dark:text-gray-400">Ładowanie...</div>
                ) : error ? (
                    <div className="p-6 text-center text-red-500">{error}</div>
                ) : notifications.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 dark:text-gray-400">Brak nowych powiadomień.</div>
                ) : (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {notifications.map((notification) => (
                            <li
                                key={notification.id}
                                className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 ${!notification.isRead ? 'bg-sky-50 dark:bg-sky-900/20' : ''}`}
                            >
                                <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0 mt-1">
                                        <NotificationIcon type={notification.type || 'info'} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-700 dark:text-gray-200 mb-1">{notification.message}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: pl })}
                                        </p>
                                        {notification.link && (
                                            <Link
                                                to={notification.link}
                                                onClick={onClose} // Close dropdown on link click
                                                className="text-xs text-sky-600 dark:text-sky-400 hover:underline mt-1 block"
                                            >
                                                Zobacz szczegóły
                                            </Link>
                                        )}
                                    </div>
                                    <div className="flex-shrink-0 flex flex-col items-center space-y-1">
                                        {!notification.isRead && (
                                            <button
                                                onClick={() => markAsRead(notification.id)}
                                                className="p-1 rounded-full text-gray-400 hover:text-green-600 hover:bg-green-100 dark:hover:bg-green-900/50 focus:outline-none"
                                                title="Oznacz jako przeczytane"
                                            >
                                                <CheckCircle size={16} />
                                            </button>
                                        )}
                                        {/* Delete button - requires backend implementation */}
                                        {/* <button
                                            onClick={() => deleteNotification(notification.id)}
                                            className="p-1 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 focus:outline-none"
                                            title="Usuń powiadomienie"
                                        >
                                            <Trash2 size={16} />
                                        </button> */}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-center">
                <Link
                    to={'/dashboard/'+ role + '/notifications'} // Link to a dedicated notifications page
                    onClick={onClose}
                    className="text-sm font-medium text-sky-600 dark:text-sky-400 hover:underline"
                >
                    Zobacz wszystkie powiadomienia
                </Link>
            </div>
        </div>
    );
};

export default NotificationDropdown;
