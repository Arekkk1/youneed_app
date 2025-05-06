import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, useSidebar } from '../../context/SidebarContext';
// Ensure this import is correct and uses the default export
import AppHeader from '../ui/AppHeader';
import AppSidebar from '../ui/AppSidebar';
import Backdrop from '../ui/Backdrop';

const LayoutContent = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  return (
    <div className="bg-slate-200 relative min-h-screen xl:flex">
      <div>
        <AppSidebar />
        <Backdrop />
      </div>
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${
          isExpanded || isHovered ? 'lg:ml-[290px] max-w-[100vw] lg:max-w-[81.8vw]' : 'lg:ml-[90px] max-w-[93.5vw]'
        } ${isMobileOpen ? 'ml-0 max-w-[100vw]' : ''}`}
      >
        <AppHeader /> {/* This line uses the imported AppHeader */}
        <div className="mx-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

const AppLayout = () => (
  <SidebarProvider>
    <LayoutContent />
  </SidebarProvider>
);

export default AppLayout;
