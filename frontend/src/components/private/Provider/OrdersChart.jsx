import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../../api'; // Use the configured api instance
import { toast } from 'react-hot-toast';
import { AlertCircle, Loader, BarChart2, DollarSign } from 'lucide-react'; // Icons

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload; // Access the full data point for context

    return (
      <div className="bg-white dark:bg-gray-700 p-2 border border-gray-300 dark:border-gray-600 rounded shadow-lg text-sm">
        <p className="font-semibold text-gray-800 dark:text-gray-100 mb-1">{label}</p>
        {payload.map((entry, index) => {
           const value = entry.value;
           const name = entry.name; // 'Liczba Zleceń' or 'Przychód'
           const isRevenue = name === 'Przychód';
           return (
             <p key={`item-${index}`} style={{ color: entry.color }}>
               {name}: {isRevenue ? value.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' }) : value}
             </p>
           );
        })}
      </div>
    );
  }
  return null;
};


function OrdersChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dataType, setDataType] = useState('count'); // 'count' or 'revenue'
  const [timeRange, setTimeRange] = useState('last30days'); // Match SalesModule options

  useEffect(() => {
    fetchChartData();
  }, [dataType, timeRange]); // Refetch when dataType or timeRange changes

  const fetchChartData = async () => {
    setLoading(true);
    setError('');
    try {
      // Endpoint GET /providers/analytics/orders-chart
      const response = await api.get('/providers/analytics/orders-chart', {
        params: {
            type: dataType, // 'count' or 'revenue'
            range: timeRange // 'last7days', 'last30days', etc.
        }
      });
      if (response.data.status === 'success') {
         // Ensure data has the correct keys ('date', 'count'/'revenue')
         const formattedData = response.data.data.map(item => ({
             date: item.date, // Assuming API returns 'date'
             [dataType]: item[dataType] // Dynamically set key 'count' or 'revenue'
         }));
         setData(formattedData);
      } else {
        throw new Error(response.data.message || 'Nie udało się pobrać danych do wykresu');
      }
    } catch (err) {
      console.error("Błąd pobierania danych wykresu zleceń:", err);
      setError(err.response?.data?.message || err.message || 'Wystąpił błąd podczas ładowania danych wykresu.');
      toast.error('Nie udało się załadować danych wykresu zleceń.');
      setData([]); // Clear data on error
    } finally {
      setLoading(false);
    }
  };

  const yAxisLabel = dataType === 'revenue' ? 'Przychód (PLN)' : 'Liczba Zleceń';
  const dataKey = dataType; // 'count' or 'revenue'
  const barName = dataType === 'revenue' ? 'Przychód' : 'Liczba Zleceń';
  const barColor = dataType === 'revenue' ? '#22c55e' : '#3b82f6'; // green-500 for revenue, blue-500 for count

  const formatYAxisTick = (value) => {
      if (dataType === 'revenue') {
          return value.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN', minimumFractionDigits: 0, maximumFractionDigits: 0 });
      }
      return value; // Return number as is for count
  };


  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 md:p-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
         <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
             <BarChart2 size={20} /> Zlecenia w Czasie
         </h3>
         <div className="flex items-center gap-4">
             {/* Time Range Selector */}
             <select
               value={timeRange}
               onChange={(e) => setTimeRange(e.target.value)}
               disabled={loading}
               className="text-xs p-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
             >
               <option value="last7days">Ostatnie 7 dni</option>
               <option value="last30days">Ostatnie 30 dni</option>
               <option value="thisMonth">Ten miesiąc</option>
               <option value="lastMonth">Poprzedni miesiąc</option>
             </select>
             {/* Data Type Toggle */}
             <div className="flex items-center gap-2 text-xs">
                 <button
                     onClick={() => setDataType('count')}
                     disabled={loading}
                     className={`p-1 rounded ${dataType === 'count' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                     title="Pokaż liczbę zleceń"
                 >
                     <BarChart2 size={16} />
                 </button>
                 <button
                     onClick={() => setDataType('revenue')}
                     disabled={loading}
                     className={`p-1 rounded ${dataType === 'revenue' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                     title="Pokaż przychód"
                 >
                     <DollarSign size={16} />
                 </button>
             </div>
         </div>
      </div>

      {error && (
        <div className="my-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center gap-2 text-sm">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <div className="flex-grow"> {/* Make chart container flexible */}
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader size={24} className="animate-spin text-sky-600" />
          </div>
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 5, right: 5, left: -15, bottom: 5 }} // Adjust margins for labels
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" dark:stroke="#4b5563" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#6b7280" dark:stroke="#9ca3af" />
              <YAxis
                  tickFormatter={formatYAxisTick}
                  tick={{ fontSize: 10 }}
                  stroke="#6b7280" dark:stroke="#9ca3af"
                  label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', fontSize: 10, fill: '#6b7280', dx: -10 }} // Add Y-axis label
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(14, 165, 233, 0.1)' }}/>
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey={dataKey} name={barName} fill={barColor} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 text-sm">
            Brak danych do wyświetlenia wykresu dla wybranego okresu i typu.
          </div>
        )}
      </div>
    </div>
  );
}

export default OrdersChart;
