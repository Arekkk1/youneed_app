import React from 'react';
import Sidebar from '../../shared/Sidebar'; // Assuming Sidebar is shared
import AdminDashboardContent from './AdminDashboardContent'; // The main content area

function AdminDashboard() {
  // Define sidebar links specific to Admin
  const adminLinks = [
    { name: 'Panel Główny', path: '/dashboard/admin', icon: 'LayoutDashboard' },
    { name: 'Zarządzanie Użytkownikami', path: '/dashboard/admin/users', icon: 'Users' },
    { name: 'Zarządzanie Usługami', path: '/dashboard/admin/services', icon: 'Package' },
    { name: 'Zarządzanie Zleceniami', path: '/dashboard/admin/orders', icon: 'ShoppingCart' },
    { name: 'Zarządzanie Subskrypcjami', path: '/dashboard/admin/subscriptions', icon: 'DollarSign' },
    { name: 'Zarządzanie Opiniami', path: '/dashboard/admin/feedback', icon: 'MessageSquare' },
    { name: 'Logi Audytowe', path: '/dashboard/admin/audit-logs', icon: 'List' },
    { name: 'Ustawienia', path: '/dashboard/admin/settings', icon: 'Settings' }, // General settings link
    // Add other admin-specific links here
     { name: 'Zarządzanie Usługodawcami', path: '/dashboard/admin/providers', icon: 'Briefcase' }, // Example
  ];

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar links={adminLinks} role="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Optional Header can go here */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 dark:bg-gray-800">
          {/* Render the main content for the admin dashboard */}
          {/* This component might contain routing logic based on the specific admin path */}
          {/* For now, let's assume it shows the main dashboard content */}
          <AdminDashboardContent />
          {/* Or use React Router's <Outlet /> if this is a layout route */}
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;
