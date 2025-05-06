import React from 'react';
import { Clock, CheckCircle, XCircle, AlertTriangle, Info, Calendar } from 'lucide-react'; // Added icons
import { useAuth } from '../../../context/AuthContext'; // Use AuthContext
import api from '../../../api'; // Use configured api instance
import { toast } from 'react-hot-toast';


// Helper to format date/time
const formatDateTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('pl-PL', {
        hour: '2-digit', minute: '2-digit'
    });
};
const formatDate = (date) => {
     if (!date) return 'N/A';
     return new Date(date).toLocaleDateString('pl-PL');
};

function ClientSingleEvent({ item, hour, isInProgress, isDone, onOrderUpdated }) {
    const { user } = useAuth(); // Get current user info

    // Determine if the current user is the client for this order
    const isCurrentUserClient = user?.id === item.clientId;

    const handleCancelOrder = async () => {
         if (!isCurrentUserClient) return; // Should not happen if component is rendered correctly
         if (item.status !== 'pending') {
             toast.error('Możesz anulować tylko oczekujące zlecenia.');
             return;
         }
         if (!window.confirm('Czy na pewno chcesz anulować to zlecenie?')) return;

         const toastId = toast.loading('Anulowanie zlecenia...');
         try {
             await api.patch(`/orders/${item.id}/status`, { status: 'cancelled' });
             toast.success('Zlecenie anulowane.', { id: toastId });
             if (onOrderUpdated) onOrderUpdated(); // Refresh list
         } catch (err) {
             console.error('Error cancelling order:', err);
             toast.error(err.response?.data?.message || 'Nie udało się anulować zlecenia.', { id: toastId });
         }
     };


    // Define colors and text based on status
    const statusInfo = {
        pending: { text: 'Oczekujące', color: 'bg-yellow-500 border-yellow-600', icon: <AlertTriangle size={14} className="mr-1"/> },
        accepted: { text: 'Zaakceptowane', color: 'bg-sky-500 border-sky-600', icon: <CheckCircle size={14} className="mr-1"/> },
        completed: { text: 'Zakończone', color: 'bg-green-500 border-green-600', icon: <CheckCircle size={14} className="mr-1"/> },
        cancelled: { text: 'Anulowane', color: 'bg-red-500 border-red-600', icon: <XCircle size={14} className="mr-1"/> },
        rejected: { text: 'Odrzucone', color: 'bg-orange-500 border-orange-600', icon: <XCircle size={14} className="mr-1"/> },
    };

    const currentStatus = statusInfo[item.status] || { text: item.status, color: 'bg-gray-500 border-gray-600', icon: <Info size={14} className="mr-1"/> };

    // Render different content based on whether the current user is the client for this order
    if (isCurrentUserClient) {
        // Current user IS the client for this order - show details
        return (
            <div className={`p-3 rounded-lg mb-2 text-white shadow-md border-l-4 ${currentStatus.color}`}>
                <div className="flex justify-between items-start mb-1">
                    <p className="font-semibold text-sm break-words">{item.title || item.service?.name || 'Twoje Zlecenie'}</p>
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded flex items-center ${currentStatus.color}`}>
                         {currentStatus.icon} {currentStatus.text}
                    </span>
                </div>
                 <div className="text-xs space-y-0.5 text-gray-200 mb-2">
                     <p className="flex items-center"><Calendar size={12} className="mr-1.5 opacity-70"/> Data: {formatDate(item.startAt)}</p>
                     <p className="flex items-center"><Clock size={12} className="mr-1.5 opacity-70"/> Godziny: {formatDateTime(item.startAt)} - {formatDateTime(item.endAt)}</p>
                     {item.description && (
                         <p className="flex items-start pt-1"><Info size={12} className="mr-1.5 mt-0.5 opacity-70 flex-shrink-0"/> Opis: <span className="italic break-words">{item.description}</span></p>
                     )}
                 </div>

                 {/* Cancel Button for Pending Orders */}
                 {item.status === 'pending' && (
                     <div className="mt-2">
                         <button
                             onClick={handleCancelOrder}
                             className="flex items-center bg-red-600 hover:bg-red-700 text-white text-xs py-0.5 px-1.5 rounded transition duration-150"
                             title="Anuluj Zlecenie"
                         >
                             <X size={12} className="mr-0.5"/> Anuluj
                         </button>
                     </div>
                 )}

                 {isInProgress(item.startAt, item.endAt) && <p className="text-xs italic text-yellow-300 mt-1">W trakcie</p>}
            </div>
        );
    } else {
        // Current user is NOT the client - show "Zajęte" for accepted orders
        if (item.status === 'accepted') {
             return (
                 <div className="text-gray-400 dark:text-gray-500 p-3 text-center rounded-lg border border-gray-600 bg-gray-700 opacity-80">
                     Zajęte
                 </div>
             );
        } else {
             // Don't show pending/cancelled/rejected orders of other clients
             return null;
        }
    }
}

export default ClientSingleEvent;
