import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { SidebarProvider } from '../../context/SidebarContext';
import AppLayout from '../ui/AppLayout';
import EventList from './EventList';
import SalesModule from './Provider/SalesModule';
import ClientsModule from './Provider/ClientsModule';
import MarketingModule from './Provider/MarketingModule';
import ReportsModule from './Provider/ReportsModule';
import EmployeesEquipmentModule from './Provider/EmployeesEquipmentModule';
import ProviderProfile from './Provider/ProviderProfile';
import EcommerceMetrics from './EcommerceMetrics';
import MonthlySalesChart from './MonthlySalesChart';
import MonthlyTarget from './MonthlyTarget';
import StatisticsChart from './StatisticsChart';
import DemographicCard from './DemographicCard';
import RecentOrders from './RecentOrders';

function DashboardContent() {
  return (
    <div className="bg-slate-200 grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12 space-y-6 xl:col-span-7">
        <EcommerceMetrics />
        <MonthlySalesChart />
      </div>
      <div className="col-span-12 xl:col-span-5">
        <MonthlyTarget />
      </div>
      <div className="col-span-12">
        <StatisticsChart />
      </div>
      <div className="col-span-12 xl:col-span-5">
        <DemographicCard />
      </div>
      <div className="col-span-12 xl:col-span-7">
        <RecentOrders />
      </div>
    </div>
  );
}

function ProviderDashboard() {
  return (
    <SidebarProvider>
          <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardContent />} />
            <Route path="calendar" element={<EventList />} />
            <Route path="sales" element={<SalesModule />} />
            <Route path="clients" element={<ClientsModule />} />
            <Route path="marketing" element={<MarketingModule />} />
            <Route path="reports" element={<ReportsModule />} />
            <Route path="employees" element={<EmployeesEquipmentModule />} />
            <Route path="profile" element={<ProviderProfile />} />
            <Route path="*" element={<div>404: Strona nie znaleziona</div>} />
            </Route>
          </Routes>
    </SidebarProvider>
  );
}

export default ProviderDashboard;
