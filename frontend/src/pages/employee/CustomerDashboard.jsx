import React from "react";
import { Calendar } from "lucide-react";
import DashboardAnalytics from "../../components/dashboard/DashboardAnalytics";

function CustomerDashboard() {
  return (
    <div className="flex flex-col h-full">
      <header className="bg-white border-b border-gray-200 px-6 py-4 -m-6 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Employee Panel</h2>
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
            <Calendar className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-700">
              {new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </header>

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
