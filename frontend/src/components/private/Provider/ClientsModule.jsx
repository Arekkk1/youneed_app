import React, { useState, useEffect } from 'react';
import api from '../../../api'; // Use the configured api instance
import { Link } from 'react-router-dom';
import { Users, AlertCircle, Loader2, Mail, Phone, ExternalLink } from 'lucide-react';

function ClientsModule() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchClients = async () => {
            setLoading(true);
            setError('');
            try {
                // ** FIX: Correct API endpoint **
                const response = await api.get('/provider/clients'); // Use /provider/ prefix
                if (response.data.status === 'success') {
                    setClients(response.data.data);
                } else {
                    throw new Error(response.data.message || 'Nie udało się pobrać klientów');
                }
            } catch (err) {
                console.error("Błąd pobierania klientów:", err);
                setError(err.response?.data?.message || err.message || 'Wystąpił błąd podczas ładowania listy klientów.');
            } finally {
                setLoading(false);
            }
        };

        fetchClients();
    }, []);

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex justify-center items-center h-40">
                    <Loader2 className="animate-spin text-indigo-500" size={32} />
                </div>
            );
        }
        if (error) {
            return (
                <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded flex items-center gap-2 h-40 justify-center">
                    <AlertCircle size={20} /> {error}
                </div>
            );
        }
        if (clients.length === 0) {
            return (
                <div className="text-center p-6 text-gray-500 h-40 flex items-center justify-center">
                    Brak klientów do wyświetlenia.
                </div>
            );
        }
        return (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nazwa / Firma</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Telefon</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Akcje</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {clients.map((client) => (
                            <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="px-4 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{client.name}</div>
                                    {client.companyName && <div className="text-xs text-gray-500 dark:text-gray-400">{client.companyName}</div>}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 flex items-center">
                                    <Mail size={14} className="mr-1 text-gray-400" /> {client.email || 'Brak'}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 flex items-center">
                                    <Phone size={14} className="mr-1 text-gray-400" /> {client.phoneNumber || 'Brak'}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                    {/* Link to client details page (if exists) or orders filtered by client */}
                                    <Link
                                        to={`/provider/orders?clientId=${client.id}`} // Example link to orders filtered by client
                                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 inline-flex items-center"
                                        title="Zobacz zamówienia klienta"
                                    >
                                        Zamówienia <ExternalLink size={14} className="ml-1" />
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 md:p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Twoi Klienci</h3>
                <Users className="text-indigo-500" size={24} />
            </div>
            {renderContent()}
        </div>
    );
}

export default ClientsModule;
