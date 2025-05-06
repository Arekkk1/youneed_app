import React, { useState, useEffect, useCallback } from 'react';
        import api from '../../api'; // Use the configured api instance
        import { toast } from 'react-hot-toast';
        import moment from 'moment';
        import 'moment/locale/pl'; // Polish locale
        import { Bell, AlertCircle, Loader2, Trash2, Eye, CheckCircle, XCircle, Plus, Edit } from 'lucide-react'; // Keep Trash2 for now, but button is removed

        moment.locale('pl');

        function Notifications() {
            const [notifications, setNotifications] = useState([]);
            const [loading, setLoading] = useState(true);
            const [error, setError] = useState('');
            const [filter, setFilter] = useState('all'); // 'all', 'unread'
            const [page, setPage] = useState(1);
            const [hasMore, setHasMore] = useState(true);
            const limit = 15; // Consider making this configurable or matching backend default if different

            // --- LOCALSTORAGE WORKAROUND START ---
            const storedToken = localStorage.getItem('token');
            // --- LOCALSTORAGE WORKAROUND END ---

            const fetchNotifications = useCallback(async (pageNum, currentNotifications = []) => {
                if (!storedToken) {
                    setError("Nie jesteś zalogowany lub Twoja sesja wygasła.");
                    setLoading(false);
                    setNotifications([]);
                    setHasMore(false);
                    return;
                }
                setLoading(true);
                setError('');

                try {
                    const config = {
                        headers: { Authorization: `Bearer ${storedToken}` },
                        params: {
                            page: pageNum,
                            limit: limit,
                            // Backend commonRoutes doesn't seem to support 'status' filter, removing for now
                            // status: filter === 'unread' ? 'unread' : undefined,
                        }
                    };
                    console.log("[Notifications] Fetching page:", pageNum, "Filter:", filter, "from /api/common/notifications");
                    // *** CORRECTED PATH ***
                    const response = await api.get('/common/notifications', config);
                    console.log("[Notifications] API Response:", response.data);

                    // Adjust based on actual backend response structure from commonRoutes
                    // Assuming commonRoutes returns data directly, not nested under 'data'
                    if (response.data && Array.isArray(response.data)) { // Check if response.data is the array
                        const newNotifications = response.data;
                        // Backend commonRoutes doesn't seem to paginate, adjust logic
                        // setNotifications(pageNum === 1 ? newNotifications : [...currentNotifications, ...newNotifications]);
                        // setHasMore(newNotifications.length === limit); // Disable pagination logic for now
                        setNotifications(newNotifications); // Replace notifications entirely
                        setHasMore(false); // Assume no pagination from commonRoutes endpoint
                        // Apply frontend filter if backend doesn't support it
                        if (filter === 'unread') {
                            setNotifications(newNotifications.filter(n => !n.isRead));
                        }

                    } else if (response.data.status === 'success' && response.data.data) { // Handle potential nested structure just in case
                         const newNotifications = response.data.data || [];
                         setNotifications(pageNum === 1 ? newNotifications : [...currentNotifications, ...newNotifications]);
                         setHasMore(newNotifications.length === limit);
                         if (filter === 'unread') {
                             setNotifications(prev => prev.filter(n => !n.isRead));
                         }
                    }
                     else {
                        // Handle cases where response is successful but data format is unexpected
                        console.warn("[Notifications] Unexpected response structure:", response.data);
                        setNotifications([]);
                        setHasMore(false);
                        // Optionally set an error message
                        // setError("Otrzymano nieoczekiwaną odpowiedź z serwera.");
                    }
                } catch (err) {
                    console.error("[Notifications] Błąd pobierania powiadomień:", err);
                    const errorMsg = err.response?.data?.message || err.message || 'Wystąpił błąd podczas ładowania powiadomień.';
                    setError(errorMsg);
                    toast.error(`Nie udało się załadować powiadomień: ${errorMsg}`);
                     if (err.response?.status === 401 || err.response?.status === 403) {
                         setError("Błąd autoryzacji. Spróbuj zalogować się ponownie.");
                     }
                } finally {
                    setLoading(false);
                }
            // Adjust dependencies: Backend doesn't filter, so fetch only when token changes or manually refreshed.
            // Frontend filtering happens after fetch.
            }, [limit, storedToken, filter]); // Keep filter dependency for frontend filtering

            useEffect(() => {
                console.log("[Notifications] Token changed or component mounted. Fetching.");
                setPage(1); // Reset page state although pagination might be disabled
                setNotifications([]);
                setHasMore(true); // Reset hasMore state
                if (storedToken) {
                    fetchNotifications(1);
                } else {
                    setLoading(false);
                    setError("Nie jesteś zalogowany.");
                    setNotifications([]);
                    setHasMore(false);
                }
            // Fetch only when token changes. Filtering is handled after fetch.
            }, [storedToken, fetchNotifications]);

            // Frontend filtering logic based on the 'filter' state
            const filteredNotifications = notifications.filter(notification => {
                if (filter === 'unread') {
                    return !notification.isRead;
                }
                return true; // 'all' filter shows everything
            });


            // Load more might not be needed if backend doesn't paginate this endpoint
            // const loadMore = () => {
            //     if (!loading && hasMore) {
            //         const nextPage = page + 1;
            //         setPage(nextPage);
            //         fetchNotifications(nextPage, notifications);
            //     }
            // };

            const markAsRead = async (id) => {
                if (!storedToken) return;
                // Optimistic update
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
                try {
                    const config = { headers: { Authorization: `Bearer ${storedToken}` } };
                    // *** CORRECTED PATH ***
                    await api.put(`/common/notifications/${id}/read`, null, config);
                } catch (err) {
                    console.error("[Notifications] Błąd oznaczania jako przeczytane:", err);
                    toast.error('Nie udało się oznaczyć jako przeczytane.');
                    // Revert optimistic update on error
                    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: false } : n));
                }
            };

             const markAllAsRead = async () => {
                 if (!storedToken) return;
                 const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
                 if (unreadIds.length === 0) return;

                 // Optimistic update
                 setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                 const toastId = toast.loading('Oznaczanie wszystkich jako przeczytane...');

                 try {
                     const config = { headers: { Authorization: `Bearer ${storedToken}` } };
                     // *** CORRECTED PATH AND METHOD ***
                     await api.post('/common/notifications/mark-all-read', null, config);
                     toast.success('Wszystkie oznaczone jako przeczytane.', { id: toastId });
                     // Refetch to ensure consistency if needed, or rely on optimistic update
                     // fetchNotifications(1);
                 } catch (err) {
                     console.error("[Notifications] Błąd oznaczania wszystkich jako przeczytane:", err);
                     toast.error('Nie udało się oznaczyć wszystkich jako przeczytane.', { id: toastId });
                     // Revert optimistic update on error
                     setNotifications(prev => prev.map(n => unreadIds.includes(n.id) ? { ...n, isRead: false } : n));
                 }
             };

            // Delete functionality removed as endpoint is missing in commonRoutes.js
            // const deleteNotification = async (id) => { ... };

            const getIconForType = (type) => {
                 // Use the types defined in the database schema
                switch (type) {
                    case 'order': return <Plus size={18} className="text-green-500" />; // Assuming 'order' maps to creation
                    case 'feedback': return <CheckCircle size={18} className="text-purple-500" />;
                    case 'message': return <Bell size={18} className="text-blue-500" />; // Or a message icon
                    case 'account': return <Edit size={18} className="text-yellow-500" />;
                    case 'warning': return <AlertCircle size={18} className="text-red-500" />;
                    case 'announcement': return <Info size={18} className="text-sky-500" />;
                    default: return <Bell size={18} className="text-gray-400" />;
                }
            };

            return (
                <div className="p-4 md:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">Powiadomienia</h1>
                            {storedToken && (
                                <div className="flex items-center gap-4">
                                     <div className="flex items-center gap-2 rounded-lg p-1 bg-gray-200 dark:bg-gray-700">
                                         <button
                                             onClick={() => setFilter('all')}
                                             className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                                 filter === 'all' ? 'bg-white dark:bg-gray-500 text-sky-700 dark:text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                                             }`}
                                         >
                                             Wszystkie
                                         </button>
                                         <button
                                             onClick={() => setFilter('unread')}
                                             className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                                 filter === 'unread' ? 'bg-white dark:bg-gray-500 text-sky-700 dark:text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                                             }`}
                                         >
                                             Nieprzeczytane
                                         </button>
                                     </div>
                                     <button
                                         onClick={markAllAsRead}
                                         disabled={loading || notifications.filter(n => !n.isRead).length === 0}
                                         className="text-sm text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                         title="Oznacz wszystkie jako przeczytane"
                                     >
                                         <Eye size={20} />
                                     </button>
                                </div>
                            )}
                        </div>

                        {error && !loading && (
                            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center gap-2 text-sm">
                                <AlertCircle size={18} /> {error}
                            </div>
                        )}

                        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
                            {!storedToken && !loading ? (
                                <p className="text-center text-gray-500 dark:text-gray-400 py-10">Musisz być zalogowany, aby zobaczyć powiadomienia.</p>
                            ) : filteredNotifications.length === 0 && !loading && !error ? ( // Use filteredNotifications here
                                <p className="text-center text-gray-500 dark:text-gray-400 py-10">Brak powiadomień do wyświetlenia.</p>
                            ) : (
                                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {/* Map over filteredNotifications */}
                                    {filteredNotifications.map(notification => (
                                        <li
                                            key={notification.id}
                                            className={`p-4 flex items-start gap-4 transition-colors duration-150 ${
                                                notification.isRead ? 'bg-white dark:bg-gray-800' : 'bg-sky-50 dark:bg-sky-900/30' // Use isRead from DB
                                            }`}
                                        >
                                            <div className="flex-shrink-0 pt-1">
                                                {getIconForType(notification.type)} {/* Use type from data */}
                                            </div>
                                            <div className="flex-grow">
                                                {/* Backend doesn't provide title, use message */}
                                                <p className={`text-sm font-medium ${notification.isRead ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>
                                                    {notification.message.substring(0, 80)}{notification.message.length > 80 ? '...' : ''}
                                                </p>
                                                {/* Display full message if needed, or remove if title is enough */}
                                                {/* <p className={`text-sm ${notification.isRead ? 'text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>
                                                    {notification.message}
                                                </p> */}
                                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                                    {moment(notification.createdAt).fromNow()}
                                                </p>
                                            </div>
                                            <div className="flex-shrink-0 flex items-center gap-2">
                                                {!notification.isRead && (
                                                    <button
                                                        onClick={() => markAsRead(notification.id)}
                                                        className="p-1 text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                                                        title="Oznacz jako przeczytane"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                )}
                                                {/* Delete button removed */}
                                                {/* <button
                                                    onClick={() => deleteNotification(notification.id)}
                                                    className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                                                    title="Usuń powiadomienie"
                                                >
                                                    <Trash2 size={16} />
                                                </button> */}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {loading && (
                            <div className="text-center py-6">
                                <Loader2 size={24} className="animate-spin text-sky-600 mx-auto" />
                            </div>
                        )}

                        {/* Load more button removed as pagination seems disabled in backend */}
                        {/* {!loading && hasMore && filteredNotifications.length > 0 && storedToken && (
                            <div className="text-center mt-6">
                                <button
                                    onClick={loadMore}
                                    className="px-4 py-2 text-sm font-medium text-sky-700 bg-sky-100 rounded-md hover:bg-sky-200 dark:bg-sky-900/50 dark:text-sky-300 dark:hover:bg-sky-800/60"
                                >
                                    Załaduj więcej
                                </button>
                            </div>
                        )} */}
                    </div>
                </div>
            );
        }

        export default Notifications;
