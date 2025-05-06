import React, { useState, useEffect } from 'react';
import api from '../../../api'; // Use the configured api instance
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertCircle, Loader2, TrendingUp } from 'lucide-react';

// Assume polishMonths is defined elsewhere or define it here
const polishMonths = ["Sty", "Lut", "Mar", "Kwi", "Maj", "Cze", "Lip", "Sie", "Wrz", "Paź", "Lis", "Gru"];

function SalesModule() {
    const [salesData, setSalesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [range, setRange] = useState('monthly'); // Default range, could be 'daily', 'weekly', 'monthly', 'yearly'
    const [activeIndex, setActiveIndex] = useState(null);

    useEffect(() => {
        const fetchSalesData = async () => {
            setLoading(true);
            setError('');
            try {
                // ** FIX: Use correct analytics endpoint **
                // Determine endpoint based on range, e.g., /monthly-sales, /daily-sales (if exists)
                let endpoint = '/analytics/monthly-sales'; // Default to monthly
                // Add logic here if you implement daily/weekly sales endpoints
                // if (range === 'daily') endpoint = '/analytics/daily-sales';
                // if (range === 'weekly') endpoint = '/analytics/weekly-sales';

                const response = await api.get(endpoint); // Pass range if endpoint supports it
                if (response.data.status === 'success') {
                    // Format data based on expected response structure
                    const formattedData = response.data.data.map(item => ({
                        name: polishMonths[item.month - 1], // Assuming monthly data structure
                        value: item.value,
                        // Add formatting for daily/weekly if needed
                    }));
                    setSalesData(formattedData);
                } else {
                    throw new Error(response.data.message || 'Nie udało się pobrać danych sprzedaży');
                }
            } catch (err) {
                console.error("Błąd pobierania danych sprzedaży:", err);
                setError(err.response?.data?.message || err.message || 'Wystąpił błąd podczas ładowania danych sprzedaży.');
            } finally {
                setLoading(false);
            }
        };

        fetchSalesData();
    }, [range]); // Refetch when range changes

    const handleMouseEnter = (_, index) => setActiveIndex(index);
    const handleMouseLeave = () => setActiveIndex(null);

    const renderChart = () => (
        <ResponsiveContainer width="100%" height={250}>
            <BarChart data={salesData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" dark:stroke="#374151" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} dark:tick={{ fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} dark:tick={{ fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(value) => `${value} zł`} />
                <Tooltip
                    cursor={{ fill: 'rgba(209, 213, 219, 0.3)' }}
                    contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        borderColor: '#e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    }}
                    formatter={(value) => [`${value.toFixed(2)} zł`, 'Przychód']}
                />
                <Bar
                    dataKey="value"
                    radius={[4, 4, 0, 0]}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    {salesData.map((entry, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={index === activeIndex ? '#10b981' : '#34d399'} // Emerald color
                            dark:fill={index === activeIndex ? '#6ee7b7' : '#a7f3d0'}
                        />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );

    return (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 md:p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Analiza Sprzedaży</h3>
                {/* TODO: Add range selector (buttons/dropdown) to change 'range' state */}
                <TrendingUp className="text-emerald-500" size={24} />
            </div>
            {loading ? (
                <div className="flex justify-center items-center h-[250px]">
                    <Loader2 className="animate-spin text-emerald-500" size={32} />
                </div>
            ) : error ? (
                <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded flex items-center gap-2 h-[250px] justify-center">
                    <AlertCircle size={20} /> {error}
                </div>
            ) : salesData.length > 0 ? (
                renderChart()
            ) : (
                <div className="text-center p-6 text-gray-500 h-[250px] flex items-center justify-center">
                    Brak danych zysku do wyświetlenia dla wybranego okresu.
                </div>
            )}
        </div>
    );
}

export default SalesModule;
