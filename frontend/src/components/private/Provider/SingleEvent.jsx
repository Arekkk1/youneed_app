import React from 'react';
import api from '../../../api'; // Use configured api instance
import { toast } from 'react-hot-toast';
import { Check, X, Edit, Trash2, Clock, User, Wrench, Info, Calendar } from 'lucide-react'; // Added icons
import { useAuth } from '../../../context/AuthContext'; // Import useAuth

// Helper to format date/time
const formatDateTime = (date) => {
    if (!date) return 'N/A';
    try {
        return new Date(date).toLocaleString('pl-PL', {
            hour: '2-digit', minute: '2-digit'
        });
    } catch (e) {
        console.error("Error formatting date:", date, e);
        return 'Invalid Date';
    }
};
const formatDate = (date) => {
     if (!date) return 'N/A';
     try {
        return new Date(date).toLocaleDateString('pl-PL');
     } catch (e) {
         console.error("Error formatting date:", date, e);
         return 'Invalid Date';
     }
};

function ProviderSingleEvent({ item, hour, isInProgress, isDone, onOrderUpdated, onOrderDeleted, onEditOrder, onDeleteAdmin, isAdminView = false, currentUserRole }) { // Added currentUserRole prop

    // --- DEBUG LOGGING START ---
    // console.log('[ProviderSingleEvent DEBUG] Rendering item:', item);
    // --- DEBUG LOGGING END ---

    const handleStatusChange = async (newStatus) => {
        const toastId = toast.loading(`Zmieniam status na "${newStatus}"...`);
        try {
            // Use the standard order status update endpoint (assuming provider has permission or admin uses admin route)
            const url = currentUserRole === 'admin' ? `/admin/orders/${item.id}` : `/orders/${item.id}/status`;
            const method = currentUserRole === 'admin' ? api.patch : api.patch; // Admin might PATCH full order, provider only status?
            const payload = currentUserRole === 'admin' ? { status: newStatus } : { status: newStatus }; // Adjust payload if admin PATCH is different

            // For simplicity, let's assume both use PATCH /orders/:id/status for now
            // If admin needs full PATCH, adjust URL and payload
            await api.patch(`/orders/${item.id}/status`, { status: newStatus });

            toast.success(`Status zlecenia zmieniony na "${newStatus}"!`, { id: toastId });
            if (onOrderUpdated) onOrderUpdated(); // Refresh list
        } catch (err) {
            console.error('Error updating order status:', err);
            toast.error(err.response?.data?.message || 'Nie udało się zmienić statusu.', { id: toastId });
        }
    };

    const handleDeleteProvider = async () => {
         // Provider can only cancel pending/accepted orders via status change
         if (item.status === 'pending' || item.status === 'accepted') {
             if (window.confirm(`Czy na pewno chcesz anulować to zlecenie?`)) {
                 handleStatusChange('cancelled');
             }
         } else {
             toast.error('Nie można anulować zlecenia w tym statusie.');
         }
     };

    const statusColors = {
        pending: 'bg-yellow-500 border-yellow-600',
        accepted: 'bg-sky-500 border-sky-600',
        completed: 'bg-green-500 border-green-600',
        cancelled: 'bg-red-500 border-red-600',
        rejected: 'bg-orange-500 border-orange-600',
    };
    const statusText = {
         pending: 'Oczekujące',
         accepted: 'Zaakceptowane',
         completed: 'Zakończone',
         cancelled: 'Anulowane',
         rejected: 'Odrzucone',
    };

    const currentStatusColor = statusColors[item.status] || 'bg-gray-500 border-gray-600';
    const currentStatusText = statusText[item.status] || item.status || 'Nieznany';

    // Safely access nested properties
    const clientName = item.client?.name || 'Brak danych klienta';
    const serviceName = item.service?.name || 'Brak danych usługi';
    const displayTitle = item.title || serviceName;
    const startTime = formatDateTime(item.startAt);
    const endTime = formatDateTime(item.endAt);
    const displayDate = formatDate(item.startAt);

    return (
        <div className={`p-3 rounded-lg mb-2 text-white shadow-md border-l-4 ${currentStatusColor} relative`}>
            <div className="flex justify-between items-start mb-1">
                <p className="font-semibold text-sm break-words pr-2" title={displayTitle}>{displayTitle}</p>
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded flex-shrink-0 ${currentStatusColor}`}>
                    {currentStatusText}
                </span>
            </div>

            <div className="text-xs space-y-0.5 text-gray-200 mb-2">
                 {item.client && (
                    <p className="flex items-center"><User size={12} className="mr-1.5 opacity-70"/> Klient: {clientName}</p>
                 )}
                 {item.service && (
                     <p className="flex items-center"><Wrench size={12} className="mr-1.5 opacity-70"/> Usługa: {serviceName}</p>
                 )}
                 <p className="flex items-center"><Clock size={12} className="mr-1.5 opacity-70"/> Godziny: {startTime} - {endTime}</p>
                 <p className="flex items-center"><Calendar size={12} className="mr-1.5 opacity-70"/> Data: {displayDate}</p>
                 {item.description && (
                     <p className="flex items-start pt-1"><Info size={12} className="mr-1.5 mt-0.5 opacity-70 flex-shrink-0"/> Opis: <span className="italic break-words">{item.description}</span></p>
                 )}
            </div>


            {/* Action Buttons */}
            <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-white border-opacity-20 text-xs">
                {/* Provider/Admin Actions */}
                {item.status === 'pending' && (currentUserRole === 'provider' || currentUserRole === 'admin') && (
                    <>
                        <button
                            onClick={() => handleStatusChange('accepted')}
                            className="flex items-center bg-green-600 hover:bg-green-700 text-white py-0.5 px-1.5 rounded transition duration-150"
                            title="Akceptuj"
                        >
                            <Check size={12} className="mr-0.5"/> Akceptuj
                        </button>
                        <button
                            onClick={() => handleStatusChange('rejected')}
                            className="flex items-center bg-orange-600 hover:bg-orange-700 text-white py-0.5 px-1.5 rounded transition duration-150"
                            title="Odrzuć"
                        >
                            <X size={12} className="mr-0.5"/> Odrzuć
                        </button>
                    </>
                )}
                 {item.status === 'accepted' && (currentUserRole === 'provider' || currentUserRole === 'admin') && (
                     <button
                         onClick={() => handleStatusChange('completed')}
                         className="flex items-center bg-green-600 hover:bg-green-700 text-white py-0.5 px-1.5 rounded transition duration-150"
                         title="Oznacz jako zakończone"
                     >
                         <Check size={12} className="mr-0.5"/> Zakończ
                     </button>
                 )}

                 {/* Edit Button (Provider/Admin) */}
                 {(currentUserRole === 'provider' || currentUserRole === 'admin') && onEditOrder && (
                     <button
                         onClick={() => onEditOrder(item)}
                         className="flex items-center bg-blue-600 hover:bg-blue-700 text-white py-0.5 px-1.5 rounded transition duration-150"
                         title="Edytuj"
                     >
                         <Edit size={12} className="mr-0.5"/> Edytuj
                     </button>
                 )}

                 {/* Cancel Button (Provider - only for pending/accepted) */}
                 {currentUserRole === 'provider' && (item.status === 'pending' || item.status === 'accepted') && onOrderDeleted && (
                     <button
                         onClick={handleDeleteProvider} // Provider uses cancel logic
                         className="flex items-center bg-red-600 hover:bg-red-700 text-white py-0.5 px-1.5 rounded transition duration-150"
                         title="Anuluj Zlecenie"
                     >
                         <X size={12} className="mr-0.5"/> Anuluj
                     </button>
                 )}

                 {/* Delete Button (Admin Only) */}
                 {currentUserRole === 'admin' && onDeleteAdmin && (
                     <button
                         onClick={() => onDeleteAdmin(item.id)}
                         className="flex items-center bg-red-700 hover:bg-red-800 text-white py-0.5 px-1.5 rounded transition duration-150 ml-auto" // Push to right
                         title="Usuń (Admin)"
                     >
                         <Trash2 size={12} className="mr-0.5"/> Usuń
                     </button>
                 )}
            </div>

            {/* Status Indicators */}
            {isInProgress(item.startAt, item.endAt) && item.status !== 'completed' && item.status !== 'cancelled' && (
                 <p className="text-xs italic text-yellow-300 mt-1 animate-pulse">W trakcie...</p>
            )}
            {/* Optional: Add indicator for completed/cancelled */}
            {/* {item.status === 'completed' && <p className="text-xs italic text-green-300 mt-1">Zakończone</p>} */}
            {/* {item.status === 'cancelled' && <p className="text-xs italic text-red-300 mt-1">Anulowane</p>} */}
        </div>
    );
}

// Wrapper component to inject currentUserRole from context
function ProviderSingleEventWrapper(props) {
    const { user } = useAuth();
    const currentUserRole = user?.role;

    // If no user role, don't render (or show placeholder/error)
    if (!currentUserRole) {
        // console.warn("[ProviderSingleEventWrapper] No user role found in context.");
        return null; // Or some fallback UI
    }

    return <ProviderSingleEvent {...props} currentUserRole={currentUserRole} />;
}


export default ProviderSingleEventWrapper;
