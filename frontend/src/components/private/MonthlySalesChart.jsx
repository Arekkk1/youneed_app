import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../../api';
import { AlertCircle, Loader2 } from 'lucide-react';

// Polish month names
const polishMonths = ["Sty", "Lut", "Mar", "Kwi", "Maj", "Cze", "Lip", "Sie", "Wrz", "Paź", "Lis", "Gru"];

function MonthlySalesChart({ role }) { // Role might be used for display logic if needed
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeIndex, setActiveIndex] = useState(null); // For hover effect

  useEffect(() => {
    const fetchSalesData = async () => {
      setLoading(true);
      setError('');
      try {
        // ** FIX: Remove role query parameter **
        const response = await api.get('/analytics/monthly-sales');
        if (response.data.status === 'success') {
          // Map month number to Polish abbreviation
          const formattedData = response.data.data.map(item => ({
            name: polishMonths[item.month - 1], // Adjust index for 0-based array
            value: item.value,
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
  }, []); // Fetch only once on mount

  const handleMouseEnter = (_, index) => {
    setActiveIndex(index);
  };

  const handleMouseLeave = () => {
    setActiveIndex(null);
  };

  const renderChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={salesData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" dark:stroke="#374151" />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} dark:tick={{ fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} dark:tick={{ fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(value) => `${value} zł`} />
        <Tooltip
          cursor={{ fill: 'rgba(209, 213, 219, 0.3)' }}
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderColor: '#e5e7eb',
            borderRadius: '8px',
            fontSize: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
          formatter={(value) => [`${value.toFixed(2)} zł`, role === 'provider' ? 'Przychód' : 'Wydatki']} // Dynamic label
        />
        <Bar
          dataKey="value"
          radius={[4, 4, 0, 0]} // Rounded top corners
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {salesData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={index === activeIndex ? '#4f46e5' : '#6366f1'} // Indigo color, darker on hover
              dark:fill={index === activeIndex ? '#a5b4fc' : '#818cf8'} // Lighter indigo for dark mode
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 md:p-6 h-full">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {role === 'provider' ? 'Miesięczny Przychód' : 'Miesięczne Wydatki'} {/* Dynamic Title */}
      </h3>
      {loading ? (
        <div className="flex justify-center items-center h-[300px]">
          <Loader2 className="animate-spin text-indigo-500" size={32} />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded flex items-center gap-2 h-[300px] justify-center">
          <AlertCircle size={20} /> {error}
        </div>
      ) : salesData.length > 0 ? (
         renderChart()
      ) : (
        <div className="text-center p-6 text-gray-500 h-[300px] flex items-center justify-center">
            Brak danych zysków do wyświetlenia.
        </div>
      )}
    </div>
  );
}

export default MonthlySalesChart;
