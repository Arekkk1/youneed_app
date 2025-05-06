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

