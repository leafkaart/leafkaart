import React from "react";
import DashboardAnalytics from "../../components/dashboard/DashboardAnalytics";

function CustomerDashboard() {
  return (
    <div className="flex flex-col h-full">
      <main className="flex-1">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Dashboard Overview
        </h1>
        <DashboardAnalytics />
      </main>
    </div>
  );
}

export default CustomerDashboard;
