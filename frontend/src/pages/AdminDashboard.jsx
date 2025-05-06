import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { SidebarProvider } from '../context/SidebarContext';
import AppLayout from '../components/ui/AppLayout';
import UserManagement from '../components/private/Admin/UserManagement';
import SubscriptionManagement from '../components/private/Admin/SubscriptionManagement';
import OrderManagement from '../components/private/Admin/OrderManagement';
import ServiceManagement from '../components/private/Admin/ServiceManagement';
import FeedbackModeration from '../components/private/Admin/FeedbackModeration';
import AnalyticsDashboard from '../components/private/Admin/AnalyticsDashboard';
import AuditLogs from '../components/private/Admin/AuditLogs';
import Notifications from '../components/private/Notifications';
import Settings from '../components/private/Settings';
import PageMeta from '../components/common/PageMeta';
import AdminProviderOpeningHours from '../components/private/Admin/AdminProviderOpeningHours';
import AdminProviders from '../components/private/Admin/AdminProviders';
import AdminPasswordReset from '../components/private/Admin/AdminPasswordReset';
import EventList from '../components/private/EventList'; // Import EventList

function AdminDashboard() {
  const location = useLocation();
  // console.log('AdminDashboard path:', location.pathname); // Keep for debugging if needed

  return (
    <SidebarProvider>
          <PageMeta
            title="YouNeed - Panel Administratora"
            description="Zarządzaj użytkownikami, subskrypcjami i platformą YouNeed."
          />
          <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<AnalyticsDashboard />} />
            <Route path="users" element={<UserManagement />} /> {/* Keep this for general user management */}
            <Route path="subscriptions" element={<SubscriptionManagement />} />
            <Route path="orders" element={<OrderManagement />} />
            <Route path="services" element={<ServiceManagement />} />
            <Route path="feedback" element={<FeedbackModeration />} />
            <Route path="analytics" element={<AnalyticsDashboard />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="settings" element={<Settings />} />
            <Route path="provider/:id/opening-hours" element={<AdminProviderOpeningHours />} />
            {/* Add specific route for providers list */}
            <Route path="providers" element={<AdminProviders />} />
            {/* Remove the duplicate /users route that pointed to AdminProviders */}
            {/* <Route path="users" element={<AdminProviders />} /> */}
            <Route path="/admin/reset-password" element={<AdminPasswordReset />} />
            {/* Add missing routes */}
            <Route path="calendar" element={<EventList />} /> {/* Admin view of calendar (might need specific logic) */}
            {/* Keep existing wildcard route */}
            <Route path="*" element={<div>404: Strona nie znaleziona w panelu administratora</div>} />
            </Route>
          </Routes>
    </SidebarProvider>
  );
}

export default AdminDashboard;
