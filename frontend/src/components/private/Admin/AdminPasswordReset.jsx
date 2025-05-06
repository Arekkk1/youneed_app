import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Assuming used within routing context
import api from '../../../api'; // Use the configured api instance
import { toast } from 'react-hot-toast';
import { Key, Send } from 'lucide-react';

function AdminPasswordReset() {
  const { userId } = useParams(); // Get userId from URL if applicable, or use a search input
  const navigate = useNavigate(); // To redirect after action
  const [targetUserId, setTargetUserId] = useState(userId || ''); // Allow input if not from params
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendResetLink = async (e) => {
    e.preventDefault();
    if (!targetUserId) {
      setError('Proszę podać ID użytkownika.');
      return;
    }
    setIsSending(true);
    setError('');
    setSuccess('');
    const resetToast = toast.loading('Wysyłanie linku resetującego...');

    try {
      // Assume endpoint POST /api/admin/users/:userId/send-reset-link
      const response = await api.post(`/admin/users/${targetUserId}/send-reset-link`);
      if (response.data.status === 'success') {
        setSuccess(`Link do resetowania hasła został wysłany na email użytkownika ${targetUserId}.`);
        toast.success('Link resetujący wysłany!', { id: resetToast });
        // Optionally clear input or redirect
        // setTargetUserId('');
      } else {
        throw new Error(response.data.message || 'Nie udało się wysłać linku resetującego');
      }
    } catch (err) {
      console.error("Błąd wysyłania linku resetującego:", err);
      const message = err.response?.data?.message || 'Nie udało się wysłać linku resetującego. Sprawdź ID użytkownika.';
      setError(message);
      toast.error(message, { id: resetToast });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">Resetowanie Hasła Użytkownika</h2>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Wprowadź ID użytkownika, aby wysłać na jego adres email link umożliwiający zresetowanie hasła.
        </p>

        <form onSubmit={handleSendResetLink} className="space-y-4">
          <div>
            <label htmlFor="targetUserId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              ID Użytkownika
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                 <Key className="h-5 w-5 text-gray-400" />
               </div>
              <input
                type="text"
                name="targetUserId"
                id="targetUserId"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                required
                className="focus:ring-sky-500 focus:border-sky-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Wklej ID użytkownika"
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-600 text-sm">{success}</p>}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSending}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50"
            >
              <Send className={`mr-2 h-5 w-5 ${isSending ? 'animate-spin' : ''}`} />
              {isSending ? 'Wysyłanie...' : 'Wyślij Link Resetujący'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminPasswordReset;
