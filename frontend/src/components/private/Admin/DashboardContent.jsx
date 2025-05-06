import React from 'react';
import EcommerceMetrics from '../EcommerceMetrics';
import MonthlySalesChart from '../MonthlySalesChart';
import MonthlyTarget from '../MonthlyTarget';
import StatisticsChart from '../StatisticsChart';
import DemographicCard from '../DemographicCard';
import RecentOrders from '../RecentOrders';

function DashboardContent() {
  return (
    <div className="bg-slate-200 grid grid-cols-12 gap-4 md:gap-6 p-6">
      <div className="col-span-12 space-y-6 xl:col-span-7">
        <EcommerceMetrics role="admin" />
        <MonthlySalesChart role="admin" />
      </div>
      <div className="col-span-12 xl:col-span-5">
        <MonthlyTarget role="admin" />
      </div>
      <div className="col-span-12">
        <StatisticsChart role="admin" />
      </div>
      <div className="col-span-12 xl:col-span-5">
        <DemographicCard role="admin" />
      </div>
      <div className="col-span-12 xl:col-span-7">
        <RecentOrders role="admin" />
      </div>
    </div>
  );
}

export default DashboardContent;

// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { Users, DollarSign, CreditCard } from 'lucide-react';
// import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

// const MetricsCard = ({ title, value, icon: Icon }) => (
//   <div className="bg-white p-4 rounded-lg shadow">
//     <div className="flex items-center gap-4">
//       <Icon size={32} className="text-blue-500" />
//       <div>
//         <h3 className="text-lg font-semibold">{title}</h3>
//         <p className="text-2xl">{value}</p>
//       </div>
//     </div>
//   </div>
// );

// const UserDistributionChart = ({ data }) => {
//   const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];
//   return (
//     <div className="bg-white p-4 rounded-lg shadow">
//       <h3 className="text-lg font-semibold mb-4">Rozkład użytkowników</h3>
//       <ResponsiveContainer width="100%" height={300}>
//         <PieChart>
//           <Pie
//             data={data}
//             dataKey="value"
//             nameKey="name"
//             cx="50%"
//             cy="50%"
//             outerRadius={80}
//             fill="#8884d8"
//           >
//             {data.map((entry, index) => (
//               <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//             ))}
//           </Pie>
//           <Tooltip />
//         </PieChart>
//       </ResponsiveContainer>
//     </div>
//   );
// };

// function DashboardContent() {
//   const [metrics, setMetrics] = useState({ users: 0, revenue: 0, subscriptions: 0 });
//   const [userDistribution, setUserDistribution] = useState([]);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const [metricsRes, distributionRes] = await Promise.all([
//           axios.get('http://localhost:5000/api/users/admin/metrics'),
//           axios.get('http://localhost:5000/api/users/admin/user-distribution'),
//         ]);
//         setMetrics(metricsRes.data);
//         setUserDistribution(distributionRes.data);
//       } catch (err) {
//         console.error('Dashboard data error:', err);
//       }
//     };
//     fetchData();
//   }, []);

//   return (
//     <div className="grid grid-cols-12 gap-4 md:gap-6">
//       <div className="col-span-12 space-y-6 xl:col-span-7">
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           <MetricsCard title="Użytkownicy" value={metrics.users} icon={Users} />
//           <MetricsCard title="Przychód" value={`${metrics.revenue} PLN`} icon={DollarSign} />
//           <MetricsCard title="Subskrypcje" value={metrics.subscriptions} icon={CreditCard} />
//         </div>
//         <UserDistributionChart data={userDistribution} />
//       </div>
//       <div className="col-span-12 xl:col-span-5">
//         <div className="bg-white p-4 rounded-lg shadow">
//           <h3 className="text-lg font-semibold mb-4">Podsumowanie systemu</h3>
//           <p>Całkowita liczba aktywnych użytkowników: {metrics.users}</p>
//           <p>Całkowity przychód z subskrypcji: {metrics.revenue} PLN</p>
//           <p>Aktywne subskrypcje: {metrics.subscriptions}</p>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default DashboardContent;
