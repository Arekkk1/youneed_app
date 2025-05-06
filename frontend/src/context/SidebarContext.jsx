import React, { createContext, useContext, useState, useEffect } from 'react';
    import { useLocation } from 'react-router-dom';

    const SidebarContext = createContext();

    export const SidebarProvider = ({ children }) => {
      const [isExpanded, setIsExpanded] = useState(true);
      const [isHovered, setIsHovered] = useState(false);
      const [isMobileOpen, setIsMobileOpen] = useState(false);
      const [sidebarItems, setSidebarItems] = useState([]);
      const location = useLocation();
      // Fetch role from localStorage, default to 'provider' if not found initially
      const role = localStorage.getItem('role') || 'provider';

      useEffect(() => {
        // Base items common to most roles or used as a fallback home link
        const baseItems = [
          { label: 'Strona główna', icon: 'Home', path: role === 'admin' ? '/dashboard/admin' : role === 'client' ? '/dashboard/client' : '/dashboard/provider' },
        ];

        // Items specific to the 'provider' role
        const providerItems = [
          { label: 'Kalendarz', icon: 'Calendar', path: '/dashboard/provider/calendar' },
          { label: 'Sprzedaż', icon: 'ShoppingCart', path: '/dashboard/provider/sales' }, // Changed icon for clarity
          { label: 'Klienci', icon: 'Users', path: '/dashboard/provider/clients' },
          { label: 'Marketing', icon: 'Megaphone', path: '/dashboard/provider/marketing' },
          { label: 'Raporty', icon: 'ChartBar', path: '/dashboard/provider/reports' },
          { label: 'Pracownicy i sprzęt', icon: 'Briefcase', path: '/dashboard/provider/employees' }, // Covers both
          { label: 'Profil', icon: 'User', path: '/dashboard/provider/profile' },
          { label: 'Subskrypcje', icon: 'CreditCard', path: '/dashboard/provider/subscriptions' },
          { label: 'Powiadomienia', icon: 'Bell', path: '/dashboard/provider/notifications' },
          { label: 'Ustawienia', icon: 'Cog', path: '/dashboard/provider/settings' },
        ];

        // Items specific to the 'client' role
        const clientItems = [
          // Added search as a primary action for clients
          { label: 'Wyszukaj Usługi', icon: 'Search', path: '/dashboard/client/searchProvider' },
          // { label: 'Moje Zlecenia', icon: 'ListChecks', path: '/dashboard/client/orders' }, // Added Orders
          { label: 'Kalendarz', icon: 'Calendar', path: '/dashboard/client/calendar' }, // Added Calendar
          // { label: 'Ulubieni', icon: 'Heart', path: '/dashboard/client/favorites' }, // Added Favorites
          // { label: 'Profil', icon: 'User', path: '/dashboard/client/profile' },
          { label: 'Powiadomienia', icon: 'Bell', path: '/dashboard/client/notifications' },
          { label: 'Ustawienia', icon: 'Cog', path: '/dashboard/client/settings' },
        ];

        // Items specific to the 'admin' role
        const adminItems = [
          { label: 'Użytkownicy', icon: 'Users', path: '/dashboard/admin/users' },
          { label: 'Subskrypcje', icon: 'CreditCard', path: '/dashboard/admin/subscriptions' },
          { label: 'Zamówienia', icon: 'ShoppingCart', path: '/dashboard/admin/orders' },
          { label: 'Usługi', icon: 'Briefcase', path: '/dashboard/admin/services' },
          { label: 'Opinie', icon: 'Star', path: '/dashboard/admin/feedback' },
          { label: 'Analityka', icon: 'ChartPie', path: '/dashboard/admin/analytics' },
          { label: 'Logi audytu', icon: 'DocumentText', path: '/dashboard/admin/audit-logs' },
          { label: 'Powiadomienia', icon: 'Bell', path: '/dashboard/admin/notifications' },
          { label: 'Ustawienia', icon: 'Cog', path: '/dashboard/admin/settings' },
        ];

        // Determine the final list of items based on the current role
        const items = role === 'admin' ? [...baseItems, ...adminItems] : role === 'client' ? [...baseItems, ...clientItems] : [...baseItems, ...providerItems];
        setSidebarItems(items);

        // Close mobile sidebar on location change
        if (isMobileOpen) {
          setIsMobileOpen(false);
        }

      }, [location, role, isMobileOpen]); // Added isMobileOpen dependency

      const toggleSidebar = () => setIsExpanded((prev) => !prev);
      const toggleMobileSidebar = () => setIsMobileOpen((prev) => !prev);

      return (
        <SidebarContext.Provider
          value={{
            isExpanded,
            isHovered,
            isMobileOpen,
            setIsHovered,
            toggleSidebar,
            toggleMobileSidebar,
            sidebarItems,
          }}
        >
          {children}
        </SidebarContext.Provider>
      );
    };

    export const useSidebar = () => {
      const context = useContext(SidebarContext);
      if (!context) {
        throw new Error('useSidebar must be used within a SidebarProvider');
      }
      return context;
    };
