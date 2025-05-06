import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import api from '../../api';
import { AlertCircle, Loader2 } from 'lucide-react';

// Define colors for different statuses
const COLORS = {
  pending: '#fbbf24', // amber-400
  accepted: '#3b82f6', // blue-500
  completed: '#22c55e', // green-500
  rejected: '#f43f5e', // rose-500
  cancelled: '#6b7280', // gray-500
};

const STATUS_LABELS = {
  pending: 'Oczekujące',
  accepted: 'Zaakceptowane',
  completed: 'Ukończone',
  rejected: 'Odrzucone',
  cancelled: 'Anulowane',
};

function StatisticsChart({ role }) { // Role might be used for display logic if needed
  const [statsData, setStatsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStatsData = async () => {
      setLoading(true);
      setError('');
      try {
        // ** FIX: Remove role query parameter, add range=daily (or make dynamic) **
        const response = await api.get('/analytics/stats', {
            params: { range: 'monthly' } // Fetch monthly stats by default, or make selectable
        });
        if (response.data.status === 'success') {
          // Transform data for Pie chart: [{ name: 'Status', value: count }, ...]
          const formattedData = Object.entries(response.data.data)
            .map(([status, count]) => ({
              name: STATUS_LABELS[status] || status,
              value: count,
              color: COLORS[status] || '#a1a1aa', // default color zinc-400
            }))
            .filter(item => item.value > 0); // Only show statuses with count > 0
          setStatsData(formattedData);
        } else {
          throw new Error(response.data.message || 'Nie udało się pobrać danych statystycznych');
        }
      } catch (err) {
        console.error("Błąd pobierania danych statystycznych:", err);
        setError(err.response?.data?.message || err.message || 'Wystąpił błąd podczas ładowania danych statystycznych.');
      } finally {
        setLoading(false);
      }
    };

    fetchStatsData();
  }, []); // Fetch once on mount

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    if (percent === 0) return null; // Don't render label for 0%
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12} fontWeight="medium">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const renderChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={statsData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={100}
          innerRadius={50} // Make it a donut chart
          fill="#8884d8"
          dataKey="value"
          paddingAngle={2} // Add padding between segments
        >
          {statsData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} stroke={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value, name) => [`${value} zamówień`, name]} />
        <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
      </PieChart>
    </ResponsiveContainer>
  );

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 md:p-6 h-full">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Statystyki Zamówień (Miesięczne)</h3>
       {/* Add dropdown/buttons here later to change range (daily/weekly/monthly) */}
      {loading ? (
        <div className="flex justify-center items-center h-[300px]">
          <Loader2 className="animate-spin text-gray-500" size={32} />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded flex items-center gap-2 h-[300px] justify-center">
          <AlertCircle size={20} /> {error}
        </div>
      ) : statsData.length > 0 ? (
        renderChart()
      ) : (
        <div className="text-center p-6 text-gray-500 h-[300px] flex items-center justify-center">
            Brak danych statystycznych do wyświetlenia.
        </div>
      )}
    </div>
  );
}

export default StatisticsChart;
