import React, { useState, useEffect } from 'react';
import api from '../../../api'; // Use the configured api instance
import { Link } from 'react-router-dom';
import { BadgeCheck, XCircle, AlertCircle, Loader2, CreditCard, Calendar } from 'lucide-react';

const statusConfig = {
    active: { icon: BadgeCheck, color: 'text-green-500', label: 'Aktywna' },
    inactive: { icon: XCircle, color: 'text-red-500', label: 'Nieaktywna' },
    cancelled: { icon: XCircle, color: 'text-gray-500', label: 'Anulowana' },
};

function SubscriptionManagement() {
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSubscriptionData = async () => {
            setLoading(true);
            setError('');
            try {
                // ** FIX: Correct API endpoint **
                const response = await api.get('/provider/subscription'); // Use /provider/ prefix
                if (response.data.status === 'success') {
                    setSubscription(response.data.data);
                } else {
                    throw new Error(response.data.message || 'Nie udało się pobrać danych subskrypcji');
                }
            } catch (err) {
                console.error("Error fetching subscription data:", err);
                setError(err.response?.data?.message || err.message || 'Wystąpił błąd podczas ładowania danych subskrypcji.');
            } finally {
                setLoading(false);
            }
        };

        fetchSubscriptionData();
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
        if (!subscription) {
             return (
                 <div className="text-center p-6 text-gray-500 h-40 flex items-center justify-center">
                     Brak informacji o subskrypcji.
                 </div>
             );
        }

        const config = statusConfig[subscription.status] || statusConfig.inactive;
        const Icon = config.icon;

        return (
            <div>
                <div className="flex items-center mb-4">
                    <Icon className={`${config.color} mr-2`} size={24} />
                    <span className={`text-lg font-semibold ${config.color}`}>{config.label}</span>
                </div>
                <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    {subscription.planName && (
                        <p><strong>Plan:</strong> {subscription.planName}</p>
                    )}
                    {subscription.price > 0 && (
                         <p className="flex items-center"><CreditCard size={16} className="mr-2 text-gray-400" /> <strong>Cena:</strong> {subscription.price.toFixed(2)} zł / miesiąc</p>
                    )}
                    {subscription.nextBillingDate && (
                        <p className="flex items-center"><Calendar size={16} className="mr-2 text-gray-400" /> <strong>Następna płatność:</strong> {new Date(subscription.nextBillingDate).toLocaleDateString('pl-PL')}</p>
                    )}
                </div>
                <div className="mt-6">
                    {/* TODO: Add buttons for managing subscription (e.g., change plan, cancel, update payment) */}
                    <Link
                        to="/provider/billing" // Example link
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-2"
                    >
                        Zarządzaj Płatnościami
                    </Link>
                     {/* Add more actions as needed */}
                </div>
            </div>
        );
    };

    return (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 md:p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Twoja Subskrypcja</h3>
            {renderContent()}
        </div>
    );
}

export default SubscriptionManagement;
