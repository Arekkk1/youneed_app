import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ProviderDashboard from './pages/ProviderDashboard';
import ClientDashboard from './pages/ClientDashboard';
import AdminDashboard from './pages/AdminDashboard';
// Removed ClientRegistration import
import ProviderRegistration from './components/public/ProviderRegistration'; // Keep this
import Login from './components/public/login';
import AuthCallback from './components/public/AuthCallback';
// Remove imports for individual steps as they are rendered by ProviderRegistration
// import Step1Industry from './components/public/ProviderRegister/Step1Industry';
// import Step2About from './components/public/ProviderRegister/Step2About';
// import Step3SmsCode from './components/public/ProviderRegister/Step3SmsCode';
// import Step4Company from './components/public/ProviderRegister/Step4Company';
// import Step5Goals from './components/public/ProviderRegister/Step5Goals';
// import Step6Visibility from './components/public/ProviderRegister/Step6Visibility';
// import Step7Congratulations from './components/public/ProviderRegister/Step7Congratulations';
import ProtectedRoute from './components/shared/ProtectedRoute';
import EventList from './components/private/EventList'; // EventList is already imported
import Notifications from './components/private/Notifications';
import Settings from './components/private/Settings';
import SubscriptionManagement from './components/private/Provider/SubscriptionManagement';
import SubscriptionSuccess from './components/public/SubscriptionSuccess';
import axios from 'axios';
import SalesModule from './components/private/Provider/SalesModule';
import MarketingModule from './components/private/Provider/MarketingModule';
import ReportsModule from './components/private/Provider/ReportsModule';
import EmployeesEquipmentModule from './components/private/Provider/EmployeesEquipmentModule';
import ProviderProfile from './components/private/Provider/ProviderProfile';
import ClientsModule from './components/private/Provider/ClientsModule';
import UserManagement from './components/private/Admin/UserManagement';
import OrderManagement from './components/private/Admin/OrderManagement';
import ServiceManagement from './components/private/Admin/ServiceManagement';
import FeedbackModeration from './components/private/Admin/FeedbackModeration';
import AnalyticsDashboard from './components/private/Admin/AnalyticsDashboard';
import AuditLogs from './components/private/Admin/AuditLogs';
import Registration from './components/public/Registration';
import ProviderSearch from './components/private/Client/ProviderSearch';

function App() {
  const [role, setRole] = useState(localStorage.getItem('role') || '');
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  return (
    <Routes>
      <Route path="/" element={<HomePage setRole={setRole} />} />
      <Route path="/login" element={<Login setRole={setRole} />} />
      {/* Removed route for /register/client */}

      {/* --- Provider Registration Route --- */}
      {/* Render ProviderRegistration component directly. It will handle rendering steps internally. */}
      <Route path="/register/provider" element={<ProviderRegistration />} />
      {/* Remove nested routes for steps */}
      <Route path="/register/client" element={<Registration />} />
      {/*
    
        <Route path="step1" element={<Step1Industry />} />
        <Route path="step2" element={<Step2About />} />
        <Route path="step3" element={<Step3SmsCode />} />
        <Route path="step4" element={<Step4Company />} />
        <Route path="step5" element={<Step5Goals />} />
        <Route path="step6" element={<Step6Visibility />} />
        <Route path="step7" element={<Step7Congratulations />} />
      </Route>
      */}

      <Route path="/auth/callback" element={<AuthCallback setRole={setRole} />} />
      <Route
        path="/dashboard/provider/*"
        element={
          <ProtectedRoute role="provider">
            <ProviderDashboard />
          </ProtectedRoute>
        }
      >
        <Route path="calendar" element={<EventList />} /> {/* Provider's own calendar view */}
        <Route path="sales" element={<SalesModule />} />
        <Route path="clients" element={<ClientsModule />} />
        <Route path="marketing" element={<MarketingModule />} />
        <Route path="reports" element={<ReportsModule />} />
        <Route path="employees" element={<EmployeesEquipmentModule />} />
        <Route path="profile" element={<ProviderProfile />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="settings" element={<Settings />} />
        <Route path="subscriptions" element={<SubscriptionManagement />} />
      </Route>
      <Route
        path="/dashboard/client"
        element={
          <ProtectedRoute role="client">
            <ClientDashboard />
          </ProtectedRoute>
        }
      >
          
                            {/* Use the new ProviderSearch component for the search route */}
                            <Route path="searchProvider" element={<ProviderSearch />} />
                      
                            {/* Update profile route to use the placeholder/actual component */}
                            {/* <Route path="profile" element={<ClientProfile />} /> */}
                            {/* Add missing routes */}
                            <Route path="calendar" element={<EventList />} /> {/* Client view of their own calendar */}
                            {/* <Route path="orders" element={<ClientOrders />} /> */}
                            {/* <Route path="favorites" element={<ClientFavorites />} /> */}
        <Route path="notifications" element={<Notifications />} />
        <Route path="settings" element={<Settings />} />
        {/* Add other client routes here if needed */}
      </Route>
      <Route
        path="/dashboard/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      >
        <Route path="users" element={<UserManagement />} />
        <Route path="subscriptions" element={<SubscriptionManagement />} /> {/* Assuming Admin manages plans */}
        <Route path="orders" element={<OrderManagement />} />
        <Route path="services" element={<ServiceManagement />} />
        <Route path="feedback" element={<FeedbackModeration />} />
        <Route path="analytics" element={<AnalyticsDashboard />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Existing route for general calendar view, potentially for provider's own or client's own */}
      <Route
        path="/calendar/:serviceProviderId?" // Optional ID
        element={
          // Note: This ProtectedRoute doesn't specify a role in the original code.
          // It might need adjustment depending on intended access.
          // Keeping it as is for now based on "don't remove anything".
          <ProtectedRoute>
            <EventList />
          </ProtectedRoute>
        }
      />

      {/* === ADDED ROUTE === */}
      {/* New route specifically for viewing a provider's calendar for booking */}
      {/* This path matches the navigation from ProviderSearch.jsx */}
      <Route
        path="/events/:serviceProviderId" // Mandatory ID from search result click
        element={
          // Only clients should access this specific path to book events
          <ProtectedRoute role="client">
            <EventList />
          </ProtectedRoute>
        }
      />
      {/* =================== */}

      <Route path="/subscription/success" element={<SubscriptionSuccess />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
