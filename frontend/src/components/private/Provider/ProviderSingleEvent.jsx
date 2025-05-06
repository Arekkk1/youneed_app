import React from 'react';
import api from '../../../api'; // Use the configured api instance
import { toast } from 'react-hot-toast';
import { CheckCircle, XCircle, Clock, User, Info, Edit, Trash2 } from 'lucide-react'; // Icons
import moment from 'moment';

function ProviderSingleEvent({ item, hour, onOrderUpdated, onOrderDeleted, onEditOrder }) { // Added delete/edit handlers

  // Function to check if the event is currently in progress
  const isInProgress = (start, end) => {
    const now = moment();
    return moment(start).isBefore(now) && moment(end).isAfter(now);
  };

  // Function to check if the event is done
  const isDone = (end) => {
    return moment(end).isBefore(moment());
  };

  const handleStatusChange = async (status) => {
    const toastId = toast.loading(`Zmienianie statusu na "${status}"...`);
    try {
      // Endpoint PATCH /providers/orders/:id/status
      const response = await api.patch(`/providers/orders/${item.id}/status`, { status });
      if (response.data.status === 'success') {
        toast.success('Status zlecenia zaktualizowany!', { id: toastId });
        if (onOrderUpdated) {
          onOrderUpdated(); // Callback to refresh the parent list/calendar
        }
      } else {
        throw new Error(response.data.message || 'Nie udało się zaktualizować statusu');
      }
    } catch (err) {
      console.error('Błąd aktualizacji statusu zlecenia:', err);
      toast.error(err.response?.data?.message || err.message || 'Wystąpił błąd.', { id: toastId });
    }
  };

  const handleDeleteOrder = async () => {
     if (!window.confirm('Czy na pewno chcesz usunąć to zlecenie? Tej akcji nie można cofnąć.')) {
       return;
     }
     const toastId = toast.loading('Usuwanie zlecenia...');
     try {
       // Endpoint DELETE /providers/orders/:id
       const response = await api.delete(`/providers/orders/${item.id}`);
       if (response.data.status === 'success') {
         toast.success('Zlecenie usunięte!', { id: toastId });
         if (onOrderDeleted) {
           onOrderDeleted(item.id); // Callback to remove from parent list/calendar
         }
       } else {
         throw new Error(response.data.message || 'Nie udało się usunąć zlecenia');
       }
     } catch (err) {
       console.error('Błąd usuwania zlecenia:', err);
       toast.error(err.response?.data?.message || err.message || 'Wystąpił błąd podczas usuwania.', { id: toastId });
     }
   };

  const getStatusColor = (status) => {
      switch (status?.toLowerCase()) {
          case 'pending': return 'bg-yellow-500 border-yellow-600 dark:bg-yellow-600 dark:border-yellow-700';
          case 'confirmed':
          case 'accepted': return 'bg-blue-500 border-blue-600 dark:bg-blue-600 dark:border-blue-700';
          case 'completed': return 'bg-green-500 border-green-600 dark:bg-green-600 dark:border-green-700';
          case 'cancelled': return 'bg-red-500 border-red-600 dark:bg-red-600 dark:border-red-700 opacity-70';
          default: return 'bg-gray-500 border-gray-600 dark:bg-gray-600 dark:border-gray-700';
      }
  };

  const clientName = item.client?.name || `${item.client?.firstName || ''} ${item.client?.lastName || ''}`.trim() || 'Brak klienta'; // Changed default
  const serviceName = item.service?.name || 'Nieokreślona usługa';
  const displayTitle = item.title || serviceName;

  return (
    <div className={`p-3 rounded-lg mb-2 text-white shadow-md border-l-4 ${getStatusColor(item.status)}`}>
      <div className="flex justify-between items-start mb-1">
        <p className="font-semibold text-sm break-words pr-2" title={displayTitle}>{displayTitle}</p>
        <span className="text-xs font-mono bg-black bg-opacity-20 px-1.5 py-0.5 rounded flex-shrink-0">{hour}</span>
      </div>

      <div className="text-xs space-y-1 opacity-90">
        {item.description && (
          <p className="flex items-start gap-1">
            <Info size={12} className="flex-shrink-0 mt-0.5" />
            <span className="break-words">{item.description}</span>
          </p>
        )}
        {item.client && ( // Only show client if present
            <p className="flex items-center gap-1">
            <User size={12} />
            <span>Klient: {clientName}</span>
            </p>
        )}
        <p className="flex items-center gap-1 capitalize">
           <Clock size={12} />
           <span>Status: {item.status || 'Nieznany'}</span>
        </p>
      </div>


      {/* Status indicators */}
      {isInProgress(item.startAt, item.endAt) && !isDone(item.endAt) && item.status !== 'completed' && item.status !== 'cancelled' && (
        <p className="text-xs mt-2 font-medium text-yellow-200 animate-pulse">W trakcie...</p>
      )}
      {isDone(item.endAt) && item.status !== 'completed' && item.status !== 'cancelled' && (
         <p className="text-xs mt-2 font-medium text-orange-200">Zakończone (oczekuje na oznaczenie)</p>
      )}
       {isDone(item.endAt) && item.status === 'completed' && (
         <p className="text-xs mt-2 font-medium text-green-200">Zakończone</p>
       )}
       {item.status === 'cancelled' && (
          <p className="text-xs mt-2 font-medium text-red-200">Anulowane</p>
       )}


      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-white border-opacity-20">
        {/* Pending Order Actions */}
        {item.status === 'pending' && (
          <>
            <button
              onClick={() => handleStatusChange('accepted')} // Use 'accepted' or 'confirmed' based on backend
              className="flex-1 inline-flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs py-1 px-2 rounded transition duration-150 ease-in-out min-w-[80px]"
              title="Akceptuj zlecenie"
            >
              <CheckCircle size={14} /> Akceptuj
            </button>
            <button
              onClick={() => handleStatusChange('cancelled')}
              className="flex-1 inline-flex items-center justify-center gap-1 bg-red-600 hover:bg-red-700 text-white text-xs py-1 px-2 rounded transition duration-150 ease-in-out min-w-[80px]"
              title="Odrzuć/Anuluj zlecenie"
            >
              <XCircle size={14} /> Odrzuć
            </button>
          </>
        )}

        {/* Mark as Completed Action */}
        {(item.status === 'accepted' || item.status === 'confirmed') && isDone(item.endAt) && (
          <button
            onClick={() => handleStatusChange('completed')}
            className="w-full inline-flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs py-1 px-2 rounded transition duration-150 ease-in-out"
            title="Oznacz jako zakończone"
          >
            <CheckCircle size={14} /> Oznacz jako Zakończone
          </button>
        )}

         {/* Edit and Delete Buttons (Always available unless completed/cancelled?) */}
         {item.status !== 'completed' && item.status !== 'cancelled' && onEditOrder && (
             <button
               onClick={() => onEditOrder(item)} // Pass the item to the edit handler
               className="p-1 text-white hover:text-yellow-300 transition duration-150 ease-in-out"
               title="Edytuj zlecenie"
             >
               <Edit size={14} />
             </button>
           )}
           {onOrderDeleted && ( // Allow deletion regardless of status? Or only specific ones?
             <button
               onClick={handleDeleteOrder}
               className="p-1 text-white hover:text-red-300 transition duration-150 ease-in-out ml-auto" // Push delete to the right
               title="Usuń zlecenie"
             >
               <Trash2 size={14} />
             </button>
           )}
      </div>
    </div>
  );
}

export default ProviderSingleEvent;
