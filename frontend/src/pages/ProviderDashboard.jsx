import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { SidebarProvider } from '../context/SidebarContext';
import AppLayout from '../components/ui/AppLayout';
import DashboardContent from '../components/private/Provider/DashboardContent';
import EventList from '../components/private/EventList';
import SalesModule from '../components/private/Provider/SalesModule';
import ClientsModule from '../components/private/Provider/ClientsModule';
import MarketingModule from '../components/private/Provider/MarketingModule';
// import ReportsModule from '../components/private/Provider/ReportsModule'; // Remove this import
import ProviderReports from '../components/private/Provider/ProviderReports'; // Import the correct component
import EmployeesEquipmentModule from '../components/private/Provider/EmployeesEquipmentModule';
import ProviderProfile from '../components/private/Provider/ProviderProfile';
import Notifications from '../components/private/Notifications';
import Settings from '../components/private/Settings';
import SubscriptionManagement from '../components/private/Provider/SubscriptionManagement';
import ServiceManagement from '../components/private/Provider/ServiceManagement'; // Import missing component
import ProviderOrders from '../components/private/Provider/ProviderOrders'; // Import missing component
import PageMeta from '../components/common/PageMeta';
import ProviderSettings from '../components/private/Provider/ProviderSettings';

function ProviderDashboard() {
  return (
    <SidebarProvider>
        <PageMeta
          title="YouNeed - Panel Usługodawcy"
          description="Zarządzaj swoimi usługami i zamówieniami w YouNeed."
        />
        <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardContent />} />
          <Route path="calendar" element={<EventList />} />
          <Route path="sales" element={<SalesModule />} />
          <Route path="clients" element={<ClientsModule />} />
          <Route path="marketing" element={<MarketingModule />} />
          {/* Update the element for the reports route */}
          <Route path="reports" element={<ProviderReports />} />
          <Route path="employees" element={<EmployeesEquipmentModule />} />
          <Route path="profile" element={<ProviderProfile />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="settings" element={<ProviderSettings />} />
          <Route path="subscriptions" element={<SubscriptionManagement />} />
          {/* Add missing routes */}
          <Route path="services" element={<ServiceManagement />} />
          <Route path="orders" element={<ProviderOrders />} />
          {/* Keep existing wildcard route */}
          <Route path="*" element={<div>404: Strona nie znaleziona w panelu usługodawcy</div>} />
          </Route>
        </Routes>
    </SidebarProvider>
  );
}

export default ProviderDashboard;
